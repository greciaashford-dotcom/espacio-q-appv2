import re, time
from conftest import API, ip
from p2helpers import rmail, wait_deliveries

def test_newsletter_verify_and_welcome_once(client, db):
    email = rmail("nl")
    r = client.post(f"{API}/v1/newsletter/subscribe", json={"email": email, "firstName": "tscheck", "consentAccepted": True, "source": "footer_form"}, headers={"x-forwarded-for": ip()})
    assert r.status_code == 200, r.text
    v = wait_deliveries(db, {"toEmail": email, "templateKey": "NEWSLETTER_VERIFY"})[0]
    assert v["providerName"] == "RESEND" and v["providerMessageId"], v
    tok = re.search(r"token=([A-Za-z0-9_\-]+)", v["textBody"]).group(1)
    for _ in range(2):
        c = client.post(f"{API}/v1/newsletter/action", json={"action": "confirm", "token": tok})
        assert c.status_code in (200, 400), c.text
    wait_deliveries(db, {"toEmail": email, "templateKey": "NEWSLETTER_WELCOME"})
    time.sleep(20)
    c = client.post(f"{API}/v1/newsletter/action", json={"action": "confirm", "token": tok})
    time.sleep(10)
    s = db.subscriber.find_one({"email": email})
    assert s["status"] in ("ACTIVE", "CONFIRMED", "VERIFIED", "SUBSCRIBED") and s["confirmedAt"], s["status"]
    assert db.emailDelivery.count_documents({"toEmail": email, "templateKey": "NEWSLETTER_WELCOME"}) == 1
    assert db.notificationJob.count_documents({"payloadJson.toEmail": email, "payloadJson.templateKey": "NEWSLETTER_WELCOME"}) <= 1
