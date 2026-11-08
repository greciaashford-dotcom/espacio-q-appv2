# ESPACIO Q Phase 1 API regression tests (booking, availability, concurrency, manage, jobs, auth guards, openapi)
import os
import uuid
import random
import datetime as dt
import concurrent.futures as cf
import subprocess
import json
import pytest
import requests


def _env(path, key):
    for line in open(path):
        if line.startswith(key + "="):
            return line.split("=", 1)[1].strip().strip('"')


BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or _env("/app/frontend/.env", "APP_URL")).rstrip("/")
CRON_SECRET = _env("/app/frontend/.env", "CRON_SECRET")
SVC = "svc-corte-autor"
PRO = "pro-clara-mendoza"
CREATED_TOKENS = []


def ip():
    return f"10.{random.randint(1,250)}.{random.randint(1,250)}.{random.randint(1,250)}"


def next_weekday(wd, weeks_ahead=1):
    # wd: 0=Mon..6=Sun ; returns date >= today+7*weeks_ahead
    d = dt.date.today() + dt.timedelta(days=7 * weeks_ahead)
    while d.weekday() != wd:
        d += dt.timedelta(days=1)
    return d.isoformat()


def avail(date, pro="any", svc=SVC):
    r = requests.get(f"{BASE_URL}/api/v1/bookings/availability", params={"serviceId": svc, "date": date, "professionalId": pro})
    assert r.status_code == 200, r.text
    return r.json()


def book(date, time, pro=PRO, key=None, email=None):
    payload = {
        "serviceId": SVC, "professionalId": pro, "dateStr": date, "startTime": time,
        "customerName": "TEST_ Cliente", "customerEmail": email or f"test_{uuid.uuid4().hex[:8]}@example.com",
        "customerPhone": "600111222", "termsAccepted": True, "idempotencyKey": key or uuid.uuid4().hex,
    }
    r = requests.post(f"{BASE_URL}/api/v1/bookings", json=payload, headers={"X-Forwarded-For": ip()}, timeout=60)
    if r.status_code == 200 and r.json().get("manageUrl"):
        CREATED_TOKENS.append(r.json()["manageUrl"].rsplit("/", 1)[1])
    return r


def token_of(r):
    return requests.utils.unquote(r.json()["manageUrl"].rsplit("/", 1)[1])


def manage(body):
    return requests.post(f"{BASE_URL}/api/v1/bookings/manage", json=body, timeout=60)


@pytest.fixture(scope="session", autouse=True)
def cleanup():
    yield
    for t in CREATED_TOKENS:
        manage({"action": "cancel", "token": requests.utils.unquote(t), "reason": "TEST cleanup"})


# OpenAPI
def test_openapi():
    r = requests.get(f"{BASE_URL}/api/openapi.json")
    assert r.status_code == 200
    d = r.json()
    assert d["openapi"].startswith("3")
    assert "/api/v1/bookings" in d["paths"] and "/api/v1/bookings/availability" in d["paths"]


# Availability rules JRN-7/8
def test_availability_closed_sun_mon():
    assert avail(next_weekday(6))["slots"] == []
    assert avail(next_weekday(0))["slots"] == []


def test_availability_saturday_window():
    s = avail(next_weekday(5, 2))["slots"]
    assert s and s[0]["time"] == "09:00"
    assert all(x["endTime"] <= "16:00" for x in s)


def test_availability_tuesday_first_slot():
    s = avail(next_weekday(1, 3))["slots"]
    assert s and s[0]["time"] == "10:30"


def test_availability_bad_params():
    r = requests.get(f"{BASE_URL}/api/v1/bookings/availability", params={"serviceId": SVC, "date": "2026/1/1"})
    assert r.status_code == 400


# JRN-9 concurrency
def test_concurrent_bookings_exactly_one():
    date = next_weekday(2, 4)  # Wed
    slots = avail(date, PRO)["slots"]
    t = slots[len(slots) // 2]["time"]
    with cf.ThreadPoolExecutor(10) as ex:
        res = list(ex.map(lambda _: book(date, t), range(10)))
    codes = sorted(r.status_code for r in res)
    print(codes, [r.json().get("code") for r in res if r.status_code != 200])
    assert codes.count(200) == 1, codes
    assert codes.count(409) == 9, codes
    for r in res:
        if r.status_code == 409:
            assert r.json().get("code") in ("CONCURRENT_OVERLAP", "SLOT_UNAVAILABLE")
            assert isinstance(r.json().get("alternatives"), list)
    appt_id = [r for r in res if r.status_code == 200][0].json()["appointment"]["id"]
    out = subprocess.run(["mongosh", "espacio_q", "--quiet", "--eval",
                          f'print(db.occupancy.countDocuments({{appointmentId:"{appt_id}",active:true}}))'], capture_output=True, text=True).stdout
    print("active occupancies for appt:", out)
    assert t not in [s["time"] for s in avail(date, PRO)["slots"]]


# JRN-10 overlap + JRN-11 idempotency
def test_overlap_and_idempotency():
    date = next_weekday(3, 4)  # Thu
    slots = [s["time"] for s in avail(date, PRO)["slots"]]
    t0 = slots[0]
    key = uuid.uuid4().hex
    r1 = book(date, t0, key=key, email="test_idem@example.com")
    assert r1.status_code == 200, r1.text
    r2 = book(date, t0, key=key, email="test_idem@example.com")
    assert r2.status_code == 200, r2.text
    assert r2.json()["idempotentReplay"] is True
    assert r2.json()["appointment"]["id"] == r1.json()["appointment"]["id"]
    # overlapping start +30min inside 60min duration
    h, m = map(int, t0.split(":"))
    t30 = f"{h + (m + 30) // 60:02d}:{(m + 30) % 60:02d}"
    r3 = book(date, t30)
    assert r3.status_code == 409, r3.text
    assert "La franja horaria seleccionada ya no está disponible" in r3.json()["error"]


# JRN-12..15 manage flows
def test_manage_reschedule_cancel_rebook():
    date = next_weekday(4, 5)  # Fri
    slots = [s["time"] for s in avail(date, PRO)["slots"]]
    a, b, c = slots[0], slots[8], slots[16]
    ra = book(date, a)
    rb = book(date, c)
    assert ra.status_code == 200 and rb.status_code == 200
    tok = token_of(ra)
    # reschedule to free slot b
    r = manage({"action": "reschedule", "token": tok, "newDateStr": date, "newStartTime": b})
    assert r.status_code == 200, r.text
    free = [s["time"] for s in avail(date, PRO)["slots"]]
    assert a in free and b not in free
    # reschedule to taken slot c
    r = manage({"action": "reschedule", "token": tok, "newDateStr": date, "newStartTime": c})
    assert r.status_code == 409, r.text
    assert "La nueva fecha u hora seleccionada no está disponible. Tu cita original se mantiene intacta." in r.json()["error"]
    # cancel b, then rebook b
    r = manage({"action": "cancel", "token": tok})
    assert r.status_code == 200, r.text
    r = book(date, b)
    assert r.status_code == 200, r.text


def test_manage_invalid_token():
    r = manage({"action": "cancel", "token": uuid.uuid4().hex + uuid.uuid4().hex})
    assert r.status_code == 404
    assert "no es válido" in r.json()["error"]


def test_booking_validation():
    r = requests.post(f"{BASE_URL}/api/v1/bookings", json={"serviceId": SVC, "dateStr": "x"})
    assert r.status_code == 400


# JRN-23 reminder jobs
def test_reminder_jobs_created():
    date = next_weekday(1, 5)
    t = avail(date, PRO)["slots"][4]["time"]
    r = book(date, t)
    assert r.status_code == 200
    aid = r.json()["appointment"]["id"]
    out = subprocess.run(["mongosh", "espacio_q", "--quiet", "--eval",
                          f'print(JSON.stringify(db.notificationJob.find({{$or:[{{appointmentId:"{aid}"}},{{"payload.appointmentId":"{aid}"}}]}},{{type:1,kind:1,status:1}}).toArray()))'],
                         capture_output=True, text=True).stdout
    print("jobs:", out)
    assert out.strip() not in ("", "[]")


# JRN-22 internal jobs
def test_internal_jobs_auth():
    assert requests.post(f"{BASE_URL}/api/internal/jobs").status_code == 401
    r = requests.post(f"{BASE_URL}/api/internal/jobs", headers={"Authorization": f"Bearer {CRON_SECRET}"}, timeout=90)
    assert r.status_code == 200, r.text
    print(r.json())


# Q-5 admin APIs guarded
@pytest.mark.parametrize("path", ["/api/v1/admin/clients/export", "/api/v1/admin/clients/template"])
def test_admin_api_unauth(path):
    r = requests.get(f"{BASE_URL}{path}", allow_redirects=False)
    assert r.status_code in (401, 403), r.status_code


def test_admin_upload_unauth():
    r = requests.post(f"{BASE_URL}/api/v1/admin/media/upload", files={"file": ("a.png", b"x", "image/png")}, allow_redirects=False)
    assert r.status_code in (401, 403)


# JRN-19/20 newsletter + contact via API
def test_newsletter_consent_required():
    r = requests.post(f"{BASE_URL}/api/v1/newsletter/subscribe", json={"email": "test_nl@example.com", "consentAccepted": False})
    assert r.status_code == 400


def test_contact_invalid_email():
    r = requests.post(f"{BASE_URL}/api/v1/contact", json={"name": "TEST", "email": "bad", "message": "hola hola hola", "privacyAccepted": True})
    assert r.status_code == 400
