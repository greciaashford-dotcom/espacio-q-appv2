import datetime as dt
from conftest import API, CRON_SECRET, find_free_slot, book

def test_jobs_auth(client):
    assert client.post(f"{API}/internal/jobs").status_code == 401
    r = client.post(f"{API}/internal/jobs", headers={"Authorization": f"Bearer {CRON_SECRET}"})
    assert r.status_code == 200, r.text

def test_reminder_jobs(client, db):
    d, t, _ = find_free_slot(client)
    r = book(client, d, t); assert r.status_code == 200
    aid = r.json()["appointment"]["id"]
    a = db.appointment.find_one({"_id": aid})
    jobs = {j["payloadJson"]["templateKey"]: j["scheduledAtUtc"] for j in db.notificationJob.find({"appointmentId": aid})}
    assert jobs["APPOINTMENT_REMINDER_24H"] == a["startAtUtc"] - dt.timedelta(hours=24)
    assert jobs["APPOINTMENT_REMINDER_2H"] == a["startAtUtc"] - dt.timedelta(hours=2)

def test_seed_not_duplicated(db):
    for coll, key in [("service", "slug"), ("professional", "name"), ("emailTemplate", "key")]:
        vals = [d.get(key) for d in db[coll].find({}, {key: 1})]
        vals = [v for v in vals if v is not None]
        assert len(vals) == len(set(vals)), (coll, vals)
