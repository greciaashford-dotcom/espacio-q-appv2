import time
from conftest import find_free_slot, book

def test_booking_ok_without_notice(client, db):
    s = db.salonSettings.find_one({"_id": "default"})
    assert not s.get("noticeEmail") and not s.get("contactEmail")
    d, t, _ = find_free_slot(client)
    r = book(client, d, t); assert r.status_code == 200, r.text
    a = r.json()["appointment"]["id"]
    time.sleep(15)
    assert db.emailDelivery.count_documents({"appointmentId": a, "templateKey": "APPOINTMENT_CONFIRMATION"}) == 1
    assert db.emailDelivery.count_documents({"appointmentId": a, "templateKey": "SALON_NOTICE_BOOKING"}) == 0
