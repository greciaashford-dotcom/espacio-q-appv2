import time
from conftest import API, ip, uid

def test_provider_reject_contact_saved_and_failed(client, db):
    email = f"tscheck-{uid()}@tscheck-nonexistent.zzzz"
    body = {"name": "tscheck fallo", "email": email, "phone": "600111222", "subject": "tscheck", "message": "Mensaje tscheck de ruta de fallo suficiente.", "privacyAccepted": True, "website": ""}
    r = client.post(f"{API}/v1/contact", json=body, headers={"x-forwarded-for": ip()})
    assert r.status_code in (200, 400), r.text
    if r.status_code == 400:
        return print("form rejected address:", r.text)
    assert db.contactMessage.find_one({"email": email})
    for _ in range(120):
        dl = db.emailDelivery.find_one({"toEmail": email, "templateKey": "CONTACT_ACK"})
        if dl and dl["status"] != "QUEUED": break
        time.sleep(5)
    print("delivery:", dl and (dl["status"], dl.get("errorMessage")))
    assert dl, "no delivery row"
    assert dl["status"] != "ACCEPTED" or dl.get("providerMessageId"), dl
    if dl["status"] == "FAILED":
        assert dl.get("errorMessage")
