import datetime as dt
from conftest import availability, find_free_slot, book, future_workdays

def test_closed_days_and_hours(client):
    today = dt.date.today()
    checked = 0
    for i in range(2, 16):
        d = today + dt.timedelta(days=i)
        slots = availability(client, d.isoformat())
        if d.weekday() in (6, 0):
            assert slots == [], d
        elif slots:
            first, last = slots[0]["time"], slots[-1]["endTime"]
            if d.weekday() == 5:
                assert first >= "09:00" and last <= "16:00", (d, first, last)
            else:
                assert first >= "10:30" and last <= "21:00", (d, first, last)
            checked += 1
    assert checked > 0

def test_booking_removes_slot_and_utc_offset(client, db):
    d, t, _ = find_free_slot(client)
    r = book(client, d, t)
    assert r.status_code == 200, r.text
    appt = db.appointment.find_one({"_id": r.json()["appointment"]["id"]})
    # Europe/Madrid offset check
    from zoneinfo import ZoneInfo
    local = dt.datetime.fromisoformat(f"{d}T{t}").replace(tzinfo=ZoneInfo("Europe/Madrid"))
    assert appt["startAtUtc"].replace(tzinfo=dt.timezone.utc) == local.astimezone(dt.timezone.utc)
    assert t not in [s["time"] for s in availability(client, d)]
