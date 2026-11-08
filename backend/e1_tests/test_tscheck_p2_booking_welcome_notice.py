from conftest import find_free_slot, book
from p2helpers import rmail, wait_deliveries, NOTICE

def test_first_and_second_booking(client, db):
    email = rmail("bk")
    d, t, _ = find_free_slot(client)
    r = book(client, d, t, email=email); assert r.status_code == 200, r.text
    a1 = r.json()["appointment"]["id"]
    wait_deliveries(db, {"appointmentId": a1, "templateKey": "APPOINTMENT_CONFIRMATION"})
    w = wait_deliveries(db, {"toEmail": email, "templateKey": "CLIENT_WELCOME"})
    txt = (w[0].get("textBody") or "").lower()
    assert not any(k in txt for k in ["descuento", "promo", "oferta", "%"]), txt
    n = wait_deliveries(db, {"toEmail": NOTICE, "templateKey": "SALON_NOTICE_BOOKING", "appointmentId": a1})[0]
    nt = n.get("textBody") or ""
    appt = db.appointment.find_one({"_id": a1})
    for s in [appt["referenceCode"], "Corte", "Clara", appt["dateStrMadrid"], appt["startTimeMadrid"], email, "600111222", "tscheck cliente"]:
        assert s in nt, (s, nt)
    d2, t2, _ = find_free_slot(client)
    r2 = book(client, d2, t2, email=email); assert r2.status_code == 200, r2.text
    a2 = r2.json()["appointment"]["id"]
    wait_deliveries(db, {"appointmentId": a2, "templateKey": "APPOINTMENT_CONFIRMATION"})
    assert db.emailDelivery.count_documents({"toEmail": email, "templateKey": "CLIENT_WELCOME"}) == 1
