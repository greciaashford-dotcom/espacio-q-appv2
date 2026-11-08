import re, time, httpx
from conftest import API, CRON_SECRET, uid, ip

NOTICE = "delivered+tscheck-notice@resend.dev"

def rmail(label):
    return f"delivered+tscheck-{label}-{uid()}@resend.dev"

def run_jobs():
    try:
        return httpx.post(f"{API}/internal/jobs", headers={"Authorization": f"Bearer {CRON_SECRET}"}, timeout=120)
    except Exception:
        return None

def wait_deliveries(db, q, n=1, timeout=900, status="ACCEPTED"):
    """Poll until n deliveries matching q reach status (rate-limit pauses requeue; kick worker periodically)."""
    end = time.time() + timeout; last = 0
    while time.time() < end:
        docs = list(db.emailDelivery.find(q, {"htmlBody": 0}))
        ok = [d for d in docs if d["status"] == status]
        if len(ok) >= n:
            return ok
        if time.time() - last > 60:
            run_jobs(); last = time.time()
        time.sleep(5)
    raise AssertionError(f"timeout waiting {q}: {[(d['templateKey'], d['status'], d.get('errorMessage')) for d in db.emailDelivery.find(q)]}")

def manage_token(db, appt_id):
    d = db.emailDelivery.find_one({"appointmentId": appt_id, "templateKey": "APPOINTMENT_CONFIRMATION"})
    m = re.search(r"/reservar/gestion/([A-Za-z0-9_\-]+)", d.get("textBody") or d.get("htmlBody"))
    return m.group(1)
