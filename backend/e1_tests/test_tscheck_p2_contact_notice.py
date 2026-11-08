from conftest import API, ip
from p2helpers import rmail, wait_deliveries, NOTICE

def test_contact_ack_and_salon_notice(client, db):
    email = rmail("ct")
    body = {"name": "tscheck contacto", "email": email, "phone": "600111222", "subject": "tscheck", "message": "Mensaje tscheck P2 con texto suficiente.", "privacyAccepted": True, "website": ""}
    r = client.post(f"{API}/v1/contact", json=body, headers={"x-forwarded-for": ip()})
    assert r.status_code == 200, r.text
    msg = db.contactMessage.find_one({"email": email}); assert msg
    ack = wait_deliveries(db, {"toEmail": email, "templateKey": "CONTACT_ACK"})[0]
    assert ack["providerName"] == "RESEND" and ack["providerMessageId"]
    n = wait_deliveries(db, {"toEmail": NOTICE, "templateKey": "SALON_NOTICE_CONTACT", "dedupKey": {"$regex": msg["_id"]}})[0]
    assert "tscheck contacto" in n["subject"] or "tscheck contacto" in (n.get("textBody") or "")
    assert "Mensaje tscheck P2" in (n.get("textBody") or n.get("htmlBody", "")), "message body not in notice"
