# ESPACIO Q edge cases: 'any' professional concurrency, concurrent reschedule, closed-day/past/horizon booking, rate-limit identity
import uuid
import datetime as dt
import concurrent.futures as cf
import requests
from test_espacioq_api import BASE_URL, avail, book, manage, token_of, next_weekday, PRO, SVC, CREATED_TOKENS, cleanup  # noqa: F401


def test_any_professional_concurrency_matches_capacity():
    date = next_weekday(2, 6)  # Wed
    slots = avail(date)["slots"]
    s = slots[len(slots) // 3]
    cap = s["availableCount"]
    with cf.ThreadPoolExecutor(10) as ex:
        res = list(ex.map(lambda _: book(date, s["time"], pro="any"), range(10)))
    ok = [r for r in res if r.status_code == 200]
    pros = {r.json()["appointment"]["professionalId"] for r in ok}
    print("capacity", cap, "ok", len(ok), "pros", pros, sorted(r.status_code for r in res))
    assert len(ok) == cap
    assert len(pros) == cap


def test_concurrent_reschedule_same_target():
    date = next_weekday(3, 6)  # Thu
    slots = [x["time"] for x in avail(date, PRO)["slots"]]
    r1, r2 = book(date, slots[0]), book(date, slots[12])
    assert r1.status_code == 200 and r2.status_code == 200
    target = slots[24]
    toks = [token_of(r1), token_of(r2)]
    with cf.ThreadPoolExecutor(2) as ex:
        res = list(ex.map(lambda t: manage({"action": "reschedule", "token": t, "newDateStr": date, "newStartTime": target}), toks))
    codes = sorted(r.status_code for r in res)
    print("resched codes", codes, [r.text[:120] for r in res])
    assert codes == [200, 409]


def test_booking_closed_day_rejected():
    r = book(next_weekday(0, 2), "11:00")  # Monday
    assert r.status_code in (400, 409, 422), r.text


def test_booking_past_date_rejected():
    r = book((dt.date.today() - dt.timedelta(days=3)).isoformat(), "11:00")
    assert r.status_code in (400, 409, 422), r.text


def test_booking_beyond_horizon_rejected():
    d = dt.date.today() + dt.timedelta(days=75)
    while d.weekday() not in (1, 2, 3, 4):
        d += dt.timedelta(days=1)
    assert avail(d.isoformat(), PRO)["slots"] == []
    r = book(d.isoformat(), "11:00")
    assert r.status_code in (400, 409, 422), r.text


def test_rate_limit_identity_from_client_xff():
    """If client-supplied X-Forwarded-For drives rate-limit identity, the limit is bypassable by rotating it."""
    fixed = f"203.0.113.{uuid.uuid4().int % 250}"
    codes = []
    for _ in range(11):
        r = requests.post(f"{BASE_URL}/api/v1/bookings", headers={"X-Forwarded-For": fixed}, json={
            "serviceId": "TEST_nonexistent", "professionalId": "any", "dateStr": next_weekday(1, 2), "startTime": "11:00",
            "customerName": "TEST_ RL", "customerEmail": "test_rl@example.com", "customerPhone": "600111222",
            "termsAccepted": True, "idempotencyKey": uuid.uuid4().hex})
        codes.append(r.status_code)
    print("codes with fixed spoofed XFF:", codes)
    # 429 at the 11th request proves the spoofed header is the identity (bypass by rotating)
    assert codes[-1] == 429
