# ESPACIO Q Phase 2 retest (iteration 3): reserved-domain functional checks + minimal real Resend sends
import os
import re
import time
import uuid
import html
import datetime as dt
import concurrent.futures as cf
import pytest
import requests
from pymongo import MongoClient


def _env(path, key):
    for line in open(path):
        if line.startswith(key + "="):
            return line.split("=", 1)[1].strip().strip('"')


BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or _env("/app/frontend/.env", "APP_URL")).rstrip("/")
WEBHOOK_CRON_SECRET = _env("/app/backend/.env", "WEBHOOK_CRON_SECRET")
db = MongoClient(_env("/app/backend/.env", "MONGO_URL"))[_env("/app/backend/.env", "DB_NAME").strip('"') or "espacio_q"]
SVC, PRO = "svc-corte-autor", "pro-clara-mendoza"
RUN = uuid.uuid4().hex[:6]
H = {"Origin": BASE_URL, "Content-Type": "application/json"}
CREATED = {"tokens": [], "contact_ids": [], "subs": [], "emails": []}


def clear_rl():
    db.rateLimitHit.delete_many({"key": {"$regex": "^(booking_create|contact|newsletter)"}})


def run_jobs():
    r = requests.post(f"{BASE_URL}/api/internal/jobs", headers={"Authorization": f"Bearer {WEBHOOK_CRON_SECRET}"}, timeout=120)
    assert r.status_code == 200, r.text
    return r.json()


def find_slot(weeks=(4, 10)):
    for wk in range(*weeks):
        for off in range(7):
            d = dt.date.today() + dt.timedelta(days=7 * wk + off)
            if d.weekday() not in (1, 2, 3, 4):
                continue
            r = requests.get(f"{BASE_URL}/api/v1/bookings/availability", params={"serviceId": SVC, "date": d.isoformat(), "professionalId": PRO})
            slots = [s["time"] for s in r.json().get("slots", [])]
            if slots:
                return d.isoformat(), slots[len(slots) // 2]
    pytest.skip("no free slot")


def book(email, date=None, time_=None, name="TEST_ It3 Cliente"):
    clear_rl()
    if not date:
        date, time_ = find_slot()
    p = {"serviceId": SVC, "professionalId": PRO, "dateStr": date, "startTime": time_, "customerName": name,
         "customerEmail": email, "customerPhone": "600111222", "termsAccepted": True, "idempotencyKey": uuid.uuid4().hex}
    r = requests.post(f"{BASE_URL}/api/v1/bookings", json=p, headers=H, timeout=90)
    assert r.status_code == 200, r.text
    CREATED["tokens"].append(requests.utils.unquote(r.json()["manageUrl"].rsplit("/", 1)[1]))
    return r.json()


def contact(email):
    clear_rl()
    r = requests.post(f"{BASE_URL}/api/v1/contact", headers=H, timeout=90, json={
        "name": "TEST_ It3 Visitante", "email": email, "phone": "600222333", "subject": "TEST_ asunto",
        "message": "TEST_ mensaje de prueba iteración 3", "privacyAccepted": True})
    assert r.status_code == 200, r.text
    m = db.contactMessage.find_one({"email": email.lower()}, sort=[("createdAt", -1)])
    CREATED["contact_ids"].append(m["_id"])
    return m


def set_settings(notice, contact_email):
    db.salonSettings.update_one({"_id": "default"}, {"$set": {"noticeEmail": notice, "contactEmail": contact_email}})


@pytest.fixture(scope="module", autouse=True)
def restore():
    orig = db.salonSettings.find_one({"_id": "default"}, {"noticeEmail": 1, "contactEmail": 1})
    yield
    db.salonSettings.update_one({"_id": "default"}, {"$set": {"noticeEmail": None, "contactEmail": orig.get("contactEmail")}})
    for t in CREATED["tokens"]:
        requests.post(f"{BASE_URL}/api/v1/bookings/manage", json={"action": "cancel", "token": t, "reason": "TEST cleanup"}, headers=H, timeout=60)


# --- cron + scheduler
def test_cron_auth():
    assert requests.post(f"{BASE_URL}/api/internal/jobs", timeout=30).status_code in (401, 403)
    assert requests.post(f"{BASE_URL}/api/internal/jobs", headers={"Authorization": "Bearer wrong"}, timeout=30).status_code in (401, 403)
    data = run_jobs()
    assert "processedJobs" in str(data)


def test_scheduler_lease_recent():
    lease = db.schedulerLeases.find_one({"_id": "job-queue"})
    assert lease and lease.get("lastRunAt")
    age = (dt.datetime.utcnow() - lease["lastRunAt"]).total_seconds()
    assert age < 6.5 * 60, f"scheduler lastRunAt too old: {age}s"


# --- contact: ack simulated w/ reason, notice to contactEmail fallback
def test_contact_fallback_to_contact_email():
    set_settings(None, f"salon.{RUN}@example.com")
    sender = f"visit.{RUN}@example.com"
    m = contact(sender)
    ack = db.emailDelivery.find_one({"dedupKey": f"contact-ack:{m['_id']}"})
    assert ack["status"] == "SIMULATED_LOCAL" and "reservado" in ack["errorMessage"]
    n = db.emailDelivery.find_one({"dedupKey": f"salon-notice-contact:{m['_id']}"})
    assert n and n["toEmail"] == f"salon.{RUN}@example.com" and n["templateKey"] == "SALON_NOTICE_CONTACT"


def test_contact_no_notice_address():
    set_settings(None, None)
    m = contact(f"visit2.{RUN}@example.com")
    assert db.emailDelivery.find_one({"dedupKey": f"salon-notice-contact:{m['_id']}"}) is None
    assert db.emailDelivery.find_one({"dedupKey": f"contact-ack:{m['_id']}"}) is not None


# --- REAL SEND #1: salon contact notice accepted with provider id (Reply-To = sender)
def test_contact_notice_real_send_accepted():
    set_settings(f"delivered+it3notice{RUN}@resend.dev", None)
    m = contact(f"visit3.{RUN}@example.com")
    n = db.emailDelivery.find_one({"dedupKey": f"salon-notice-contact:{m['_id']}"})
    assert n is not None
    print("notice delivery:", n["status"], n.get("providerMessageId"), n.get("errorMessage"))
    if n["status"] == "FAILED" and "rate" in (n.get("errorMessage") or "").lower():
        job = db.notificationJob.find_one({"dedupKey": f"retry:salon-notice-contact:{m['_id']}"})
        assert job and job["jobType"] == "RETRY_EMAIL_DELIVERY" and job["status"] == "PENDING"
        assert job["payloadJson"]["replyTo"] == f"visit3.{RUN}@example.com"
        pytest.xfail("provider rate limited; retry job correctly queued")
    assert n["status"] == "ACCEPTED" and n.get("providerMessageId")


# --- booking: welcome once, notice to noticeEmail, immediate processing
def test_booking_welcome_once_and_notice():
    set_settings(f"avisos.{RUN}@example.com", None)
    email = f"cli.{RUN}@example.com"
    a1 = book(email)
    time.sleep(3)
    appt1 = db.appointment.find_one({"referenceCode": a1.get("referenceCode")}) or db.appointment.find_one({"customerEmail": email})
    jobs = list(db.notificationJob.find({"appointmentId": appt1["_id"]}))
    tpls = {j["payloadJson"].get("templateKey"): j for j in jobs}
    assert "CLIENT_WELCOME" in tpls and "SALON_NOTICE_BOOKING" in tpls
    if tpls["CLIENT_WELCOME"]["status"] == "PENDING":
        run_jobs()
    notice = db.emailDelivery.find_one({"dedupKey": f"salon-notice-booking:{appt1['_id']}"})
    assert notice and notice["toEmail"] == f"avisos.{RUN}@example.com"
    welcomes = db.emailDelivery.count_documents({"toEmail": email, "templateKey": "CLIENT_WELCOME"})
    assert welcomes == 1
    # second booking: no new welcome job
    d, t = find_slot((4, 10))
    a2 = book(email, d, t)
    time.sleep(2)
    appt2 = db.appointment.find_one({"customerEmail": email, "_id": {"$ne": appt1["_id"]}})
    assert db.notificationJob.count_documents({"appointmentId": appt2["_id"], "payloadJson.templateKey": "CLIENT_WELCOME"}) == 0
    run_jobs()
    assert db.emailDelivery.count_documents({"toEmail": email, "templateKey": "CLIENT_WELCOME"}) == 1


def test_booking_missing_notice_cancels_job():
    set_settings(None, None)
    a = book(f"cli2.{RUN}@example.com")
    appt = db.appointment.find_one({"customerEmail": f"cli2.{RUN}@example.com"})
    run_jobs()
    j = db.notificationJob.find_one({"dedupKey": f"salon-notice-booking:{appt['_id']}"})
    assert j["status"] == "CANCELLED" and "Sin email de avisos" in (j.get("lastError") or "")


# --- newsletter double opt-in, welcome once, unsubscribe -> suppression
def test_newsletter_double_optin_and_unsubscribe():
    email = f"news.{RUN}@example.com"
    clear_rl()
    r = requests.post(f"{BASE_URL}/api/v1/newsletter/subscribe", headers=H, json={"email": email, "consentAccepted": True}, timeout=60)
    assert r.status_code == 200, r.text
    sub = db.subscriber.find_one({"emailNormalized": email})
    assert sub["status"] == "PENDING"
    v = db.emailDelivery.find_one({"dedupKey": {"$regex": f"^newsletter-verify:{sub['_id']}"}})
    assert v and v["status"] == "SIMULATED_LOCAL"
    tok = requests.utils.unquote(html.unescape(re.search(r"confirmar\?token=([^\"&<\s]+)", v["htmlBody"]).group(1)))
    r = requests.post(f"{BASE_URL}/api/v1/newsletter/action", headers=H, json={"action": "confirm", "token": tok}, timeout=60)
    assert r.status_code == 200, r.text
    r2 = requests.post(f"{BASE_URL}/api/v1/newsletter/action", headers=H, json={"action": "confirm", "token": tok}, timeout=60)
    assert r2.status_code in (200, 400)
    assert db.subscriber.find_one({"_id": sub["_id"]})["status"] == "ACTIVE"
    assert db.emailDelivery.count_documents({"dedupKey": f"newsletter-welcome:{sub['_id']}"}) == 1
    r = requests.post(f"{BASE_URL}/api/v1/newsletter/action", headers=H, json={"action": "unsubscribe", "email": email}, timeout=60)
    assert r.status_code == 200
    assert db.suppression.find_one({"emailNormalized": email}) is not None
    assert db.subscriber.find_one({"_id": sub["_id"]})["status"] != "ACTIVE"


# --- booking concurrency
def test_booking_concurrency_10_parallel():
    clear_rl()
    d, t = find_slot((5, 10))

    def one(i):
        p = {"serviceId": SVC, "professionalId": PRO, "dateStr": d, "startTime": t, "customerName": f"TEST_ Conc {i}",
             "customerEmail": f"conc{i}.{RUN}@example.com", "customerPhone": "600000000", "termsAccepted": True,
             "idempotencyKey": uuid.uuid4().hex}
        return requests.post(f"{BASE_URL}/api/v1/bookings", json=p, headers={**H, "X-Forwarded-For": f"10.9.{i}.1"}, timeout=90)

    with cf.ThreadPoolExecutor(10) as ex:
        res = list(ex.map(one, range(10)))
    codes = sorted(r.status_code for r in res)
    for r in res:
        if r.status_code == 200:
            CREATED["tokens"].append(requests.utils.unquote(r.json()["manageUrl"].rsplit("/", 1)[1]))
    assert codes.count(200) == 1 and codes.count(409) == 9, codes


def test_openapi_current():
    r = requests.get(f"{BASE_URL}/api/openapi.json", timeout=30)
    assert r.status_code == 200
    s = r.text
    assert "/api/internal/jobs" in s or "internal/jobs" in s
    print("openapi mentions RETRY_EMAIL_DELIVERY:", "RETRY_EMAIL_DELIVERY" in s, "rate_limited/429:", "429" in s)
