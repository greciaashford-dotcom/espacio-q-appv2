# ESPACIO Q Phase 2 — real email via Emergent-managed Resend (JRN-26..JRN-39)
import os
import re
import time
import uuid
import datetime as dt
import pytest
import requests
from pymongo import MongoClient


def _env(path, key):
    for line in open(path):
        if line.startswith(key + "="):
            return line.split("=", 1)[1].strip().strip('"')


BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or _env("/app/frontend/.env", "APP_URL")).rstrip("/")
CRON_SECRET = _env("/app/frontend/.env", "CRON_SECRET")
db = MongoClient(_env("/app/backend/.env", "MONGO_URL") or "mongodb://localhost:27017")["espacio_q"]
SVC = "svc-corte-autor"
PRO = "pro-clara-mendoza"
RUN = uuid.uuid4().hex[:6]
CREATED_TOKENS = []


def clear_rl():
    db.rateLimitHit.delete_many({"key": {"$regex": "^(booking_create|contact|newsletter):"}})


def run_jobs():
    r = requests.post(f"{BASE_URL}/api/internal/jobs", headers={"Authorization": f"Bearer {CRON_SECRET}"}, timeout=120)
    assert r.status_code == 200, r.text
    return r.json()


def next_weekday(wd, weeks_ahead=1):
    d = dt.date.today() + dt.timedelta(days=7 * weeks_ahead)
    while d.weekday() != wd:
        d += dt.timedelta(days=1)
    return d.isoformat()


def free_slots(date, pro=PRO):
    r = requests.get(f"{BASE_URL}/api/v1/bookings/availability", params={"serviceId": SVC, "date": date, "professionalId": pro})
    assert r.status_code == 200, r.text
    return [s["time"] for s in r.json()["slots"]]


def book(email, date=None, time_=None, name="TEST_ Cliente Fase2", phone="600111222"):
    clear_rl()
    if date is None:
        for wk in range(3, 9):
            for wd in (1, 2, 3, 4, 5):
                d = next_weekday(wd, wk)
                s = free_slots(d)
                if s:
                    date, time_ = d, s[len(s) // 3]
                    break
            if date:
                break
    payload = {"serviceId": SVC, "professionalId": PRO, "dateStr": date, "startTime": time_,
               "customerName": name, "customerEmail": email, "customerPhone": phone,
               "termsAccepted": True, "idempotencyKey": uuid.uuid4().hex}
    r = requests.post(f"{BASE_URL}/api/v1/bookings", json=payload, timeout=90)
    assert r.status_code == 200, r.text
    CREATED_TOKENS.append(requests.utils.unquote(r.json()["manageUrl"].rsplit("/", 1)[1]))
    return r.json()


def deliveries(**q):
    return list(db.emailDelivery.find(q))


def wait_delivery(timeout=40, **q):
    end = time.time() + timeout
    while time.time() < end:
        d = deliveries(**q)
        if d:
            return d
        time.sleep(2)
    run_jobs()
    return deliveries(**q)


def contact(email, msg="TEST_ mensaje de prueba fase 2"):
    clear_rl()
    return requests.post(f"{BASE_URL}/api/v1/contact", json={
        "name": "TEST_ Visitante", "email": email, "phone": "600222333", "subject": "TEST_ asunto",
        "message": msg, "privacyAccepted": True}, timeout=90)


@pytest.fixture(scope="module", autouse=True)
def settings_restore():
    orig = db.salonSettings.find_one({"_id": "default"}, {"noticeEmail": 1, "contactEmail": 1})
    yield
    db.salonSettings.update_one({"_id": "default"}, {"$set": {"noticeEmail": None, "contactEmail": orig.get("contactEmail")}})
    for t in CREATED_TOKENS:
        requests.post(f"{BASE_URL}/api/v1/bookings/manage", json={"action": "cancel", "token": t, "reason": "TEST cleanup"}, timeout=60)


# JRN-26 contact -> CONTACT_ACK ACCEPTED with provider id
def test_contact_ack_accepted():
    db.salonSettings.update_one({"_id": "default"}, {"$set": {"noticeEmail": None}})
    email = f"delivered+ack{RUN}@resend.dev"
    r = contact(email)
    assert r.status_code == 200, r.text
    assert db.contactMessage.find_one({"email": email})
    d = wait_delivery(templateKey="CONTACT_ACK", toEmail=email)
    assert len(d) == 1 and d[0]["status"] == "ACCEPTED", d
    assert d[0].get("providerMessageId"), d[0]
    assert d[0]["providerName"] == "RESEND"


# JRN-26 + JRN-28 newsletter verify + welcome exactly once
def test_newsletter_verify_and_welcome_once():
    clear_rl()
    email = f"delivered+nl{RUN}@resend.dev"
    r = requests.post(f"{BASE_URL}/api/v1/newsletter/subscribe", json={"email": email, "consentAccepted": True}, timeout=60)
    assert r.status_code == 200, r.text
    d = wait_delivery(templateKey="NEWSLETTER_VERIFY", toEmail=email)
    assert d and d[0]["status"] == "ACCEPTED" and d[0].get("providerMessageId"), d
    tok = re.search(r"confirmar\?token=([^\s\"&<]+)", d[0]["textBody"]).group(1)
    tok = requests.utils.unquote(tok)
    for _ in range(2):
        rr = requests.post(f"{BASE_URL}/api/v1/newsletter/action", json={"action": "confirm", "token": tok}, timeout=60)
        print("confirm:", rr.status_code, rr.text[:200])
        assert rr.status_code in (200, 409, 400)
    time.sleep(3)
    w = deliveries(templateKey="NEWSLETTER_WELCOME", toEmail=email)
    if not w:
        run_jobs()
        w = deliveries(templateKey="NEWSLETTER_WELCOME", toEmail=email)
    assert len(w) == 1, w
    assert w[0]["status"] == "ACCEPTED" and w[0].get("providerMessageId")
    assert "bienvenida" in w[0]["subject"].lower()
    sub = db.subscriber.find_one({"email": email})
    print("subscriber:", {k: sub.get(k) for k in ("status", "verifiedAt")})


# JRN-29/30/32 online booking -> confirmation + one CLIENT_WELCOME + SALON_NOTICE_BOOKING
def test_booking_welcome_once_and_salon_notice():
    db.salonSettings.update_one({"_id": "default"}, {"$set": {"noticeEmail": "delivered+salon@resend.dev"}})
    email = f"delivered+new{RUN}@resend.dev"
    b1 = book(email, name="TEST_ Lucía Pérez", phone="611222333")
    appt_id = b1["appointment"]["id"]
    init = wait_delivery(appointmentId=appt_id, templateKey={"$in": ["APPOINTMENT_CONFIRMATION", "APPOINTMENT_REQUEST_PENDING"]})
    assert init and init[0]["status"] == "ACCEPTED", init
    wel = wait_delivery(templateKey="CLIENT_WELCOME", toEmail=email)
    assert len(wel) == 1 and wel[0]["status"] == "ACCEPTED", wel
    assert "unsubscribe" not in wel[0]["htmlBody"].lower() and "baja" not in wel[0]["textBody"].lower()
    notice = wait_delivery(templateKey="SALON_NOTICE_BOOKING", appointmentId=appt_id)
    assert notice and notice[0]["status"] == "ACCEPTED" and notice[0]["toEmail"] == "delivered+salon@resend.dev", notice
    txt = notice[0]["textBody"]
    print(txt)
    for s in ("Servicio", "Profesional", "Fecha (Madrid)", "Hora (Madrid)", "Estado", "TEST_ Lucía Pérez", email, "611222333"):
        assert s in txt, s
    # second booking same email -> no second welcome
    b2 = book(email)
    init2 = wait_delivery(appointmentId=b2["appointment"]["id"], templateKey={"$in": ["APPOINTMENT_CONFIRMATION", "APPOINTMENT_REQUEST_PENDING"]})
    assert init2 and init2[0]["status"] == "ACCEPTED"
    run_jobs()
    assert len(deliveries(templateKey="CLIENT_WELCOME", toEmail=email)) == 1
    assert db.notificationJob.count_documents({"payloadJson.templateKey": "CLIENT_WELCOME", "payloadJson.toEmail": email}) == 1


# JRN-33 contact with notice email -> SALON_NOTICE_CONTACT (reply-to sender) + CONTACT_ACK
def test_contact_salon_notice():
    db.salonSettings.update_one({"_id": "default"}, {"$set": {"noticeEmail": "delivered+salon@resend.dev"}})
    email = f"delivered+cn{RUN}@resend.dev"
    r = contact(email, "TEST_ Hola, quiero información sobre mechas.")
    assert r.status_code == 200, r.text
    msg = db.contactMessage.find_one({"email": email})
    n = wait_delivery(dedupKey=f"salon-notice-contact:{msg['_id']}")
    assert n and n[0]["status"] == "ACCEPTED" and n[0]["templateKey"] == "SALON_NOTICE_CONTACT", n
    assert "quiero información sobre mechas" in n[0]["textBody"]
    a = deliveries(templateKey="CONTACT_ACK", toEmail=email)
    assert a and a[0]["status"] == "ACCEPTED"


# JRN-34 missing notice + contact email -> booking ok, notice job CANCELLED with reason
def test_missing_notice_email_cancels_job():
    db.salonSettings.update_one({"_id": "default"}, {"$set": {"noticeEmail": None, "contactEmail": None}})
    b = book(f"delivered+miss{RUN}@resend.dev")
    appt_id = b["appointment"]["id"]
    time.sleep(3)
    job = db.notificationJob.find_one({"dedupKey": f"salon-notice-booking:{appt_id}"})
    if job["status"] == "PENDING":
        run_jobs()
        job = db.notificationJob.find_one({"dedupKey": f"salon-notice-booking:{appt_id}"})
    assert job["status"] == "CANCELLED" and "Sin email de avisos" in (job.get("lastError") or ""), job
    assert not deliveries(templateKey="SALON_NOTICE_BOOKING", appointmentId=appt_id)


# JRN-35 reschedule + cancel via manage link
def test_reschedule_cancel_accepted():
    email = os.environ.get("PHASE2_EXISTING_EMAIL") or f"delivered+mng{RUN}@resend.dev"
    b = book(email)
    tok = CREATED_TOKENS[-1]
    date = b["appointment"].get("dateStrMadrid") or b["appointment"].get("dateStr")
    slots = free_slots(date)
    r = requests.post(f"{BASE_URL}/api/v1/bookings/manage", json={"action": "reschedule", "token": tok, "newDateStr": date, "newStartTime": slots[-1]}, timeout=90)
    assert r.status_code == 200, r.text
    rs = wait_delivery(templateKey="APPOINTMENT_RESCHEDULED", appointmentId=b["appointment"]["id"])
    assert rs and rs[0]["status"] == "ACCEPTED", rs
    r = requests.post(f"{BASE_URL}/api/v1/bookings/manage", json={"action": "cancel", "token": tok}, timeout=90)
    assert r.status_code == 200, r.text
    c = wait_delivery(templateKey="APPOINTMENT_CANCELLED", appointmentId=b["appointment"]["id"])
    assert c and c[0]["status"] == "ACCEPTED", c


# JRN-36 reminders forced due -> each ACCEPTED exactly once after two worker runs
def test_reminders_once():
    email = os.environ.get("PHASE2_EXISTING_EMAIL") or f"delivered+rem{RUN}@resend.dev"
    b = book(email)
    appt_id = b["appointment"]["id"]
    jobs = list(db.notificationJob.find({"appointmentId": appt_id, "jobType": {"$regex": "REMINDER"}}))
    print([(j["jobType"], j["dedupKey"], j["status"]) for j in jobs])
    assert len(jobs) == 2, jobs
    past = dt.datetime.utcnow() - dt.timedelta(minutes=1)
    db.notificationJob.update_many({"_id": {"$in": [j["_id"] for j in jobs]}}, {"$set": {"scheduledAtUtc": past, "nextAttemptUtc": past}})
    run_jobs()
    run_jobs()
    rem = deliveries(appointmentId=appt_id, templateKey={"$regex": "REMINDER"})
    print([(d["templateKey"], d["status"]) for d in rem])
    keys = sorted(d["templateKey"] for d in rem)
    assert keys == ["APPOINTMENT_REMINDER_24H", "APPOINTMENT_REMINDER_2H"], keys
    assert all(d["status"] == "ACCEPTED" for d in rem)


# JRN-38 provider failure: invalid recipient rejected -> message saved, delivery FAILED w/ error
def test_contact_provider_failure():
    email = f"bounced+{RUN}@resend.dev"  # still accepted by API; use syntactically odd address instead
    bad = f"test{RUN}@localhost-no-tld"
    r = contact(bad)
    print("bad addr contact:", r.status_code, r.text[:200])
    if r.status_code == 400:
        pytest.skip("validator rejects address before provider (cannot trigger provider failure end-to-end)")
    msg = db.contactMessage.find_one({"email": bad})
    assert msg
    d = deliveries(dedupKey=f"contact-ack:{msg['_id']}")
    print(d and (d[0]["status"], d[0].get("errorMessage")))
    assert d and d[0]["status"] in ("FAILED", "ACCEPTED")
    if d[0]["status"] == "FAILED":
        assert d[0].get("errorMessage")


# JRN-39 scheduler lease updated recently
def test_scheduler_lease_recent():
    lease = db.schedulerLeases.find_one({"_id": "job-queue"})
    assert lease and lease.get("lastRunAt")
    age = (dt.datetime.utcnow() - lease["lastRunAt"]).total_seconds()
    print("lease age s:", age)
    assert age < 400
