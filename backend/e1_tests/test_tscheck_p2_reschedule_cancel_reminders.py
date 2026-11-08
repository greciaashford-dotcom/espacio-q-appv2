import datetime as dt
from conftest import API, find_free_slot, book
from p2helpers import rmail, wait_deliveries, manage_token, run_jobs

def test_reschedule_cancel_reminders(client, db):
    email = rmail("rc")
    d, t, _ = find_free_slot(client)
    r = book(client, d, t, email=email); assert r.status_code == 200, r.text
    a = r.json()["appointment"]["id"]
    wait_deliveries(db, {"appointmentId": a, "templateKey": "APPOINTMENT_CONFIRMATION"})
    # force reminder jobs of THIS test appointment due now
    now = dt.datetime.utcnow() - dt.timedelta(seconds=5)
    res = db.notificationJob.update_many({"appointmentId": a, "jobType": "APPOINTMENT_REMINDER", "status": "PENDING"},
                                         {"$set": {"scheduledAtUtc": now, "nextAttemptUtc": now}})
    assert res.modified_count == 2, res.modified_count
    run_jobs(); run_jobs()
    for k in ("APPOINTMENT_REMINDER_24H", "APPOINTMENT_REMINDER_2H"):
        wait_deliveries(db, {"appointmentId": a, "templateKey": k})
    run_jobs(); run_jobs()
    for k in ("APPOINTMENT_REMINDER_24H", "APPOINTMENT_REMINDER_2H"):
        assert db.emailDelivery.count_documents({"appointmentId": a, "templateKey": k}) == 1
    tok = manage_token(db, a)
    d2, t2, _ = find_free_slot(client)
    m = client.post(f"{API}/v1/bookings/manage", json={"action": "reschedule", "token": tok, "newDateStr": d2, "newStartTime": t2})
    assert m.status_code == 200, m.text
    wait_deliveries(db, {"appointmentId": a, "templateKey": "APPOINTMENT_RESCHEDULED"})
    c = client.post(f"{API}/v1/bookings/manage", json={"action": "cancel", "token": tok, "reason": "tscheck"})
    assert c.status_code == 200, c.text
    wait_deliveries(db, {"appointmentId": a, "templateKey": "APPOINTMENT_CANCELLED"})
