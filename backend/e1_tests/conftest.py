import datetime as dt
import hashlib
import os
import random
import secrets
import uuid

import httpx
import pymongo
import pytest

API = "http://localhost:8001/api"
BASE = "http://localhost:8001"
SVC = "svc-corte-autor"
PRO = "pro-clara-mendoza"


def _env(path, key):
    try:
        for line in open(path):
            if line.startswith(key + "="):
                return line.split("=", 1)[1].strip().strip('"')
    except FileNotFoundError:
        pass
    return None


MONGO_URL = _env("/app/backend/.env", "MONGO_URL") or "mongodb://localhost:27017"
DB_NAME = _env("/app/backend/.env", "DB_NAME") or "espacio_q"
CRON_SECRET = _env("/app/frontend/.env", "CRON_SECRET")


def uid():
    return uuid.uuid4().hex[:10]


def ip():
    return f"10.{random.randint(1,250)}.{random.randint(1,250)}.{random.randint(1,250)}"


@pytest.fixture(scope="session")
def db():
    return pymongo.MongoClient(MONGO_URL)[DB_NAME]


@pytest.fixture
def client():
    with httpx.Client(timeout=60) as c:
        yield c


def make_session(db, email):
    """tscheck session fixture row for an existing test account (no change to the account)."""
    user = db.user.find_one({"email": email})
    token = secrets.token_urlsafe(32)
    now = dt.datetime.utcnow()
    db.session.insert_one({
        "_id": f"tscheck-sess-{uid()}",
        "tokenHash": hashlib.sha256(token.encode()).hexdigest(),
        "userId": user["_id"],
        "expiresAt": now + dt.timedelta(hours=2),
        "userAgent": "tscheck",
        "ipRedacted": None,
        "createdAt": now,
    })
    return {"espacioq_session": token}


@pytest.fixture(scope="session")
def owner_cookies(db):
    return make_session(db, "owner@espacioq.test")


@pytest.fixture(scope="session")
def reception_cookies(db):
    return make_session(db, "reception@espacioq.test")


def future_workdays(min_days=3, max_days=55):
    today = dt.date.today()
    out = []
    for i in range(min_days, max_days):
        d = today + dt.timedelta(days=i)
        if d.weekday() in (1, 2, 3, 4, 5):  # Tue-Sat
            out.append(d.isoformat())
    return out


def availability(c, date, pro=PRO, svc=SVC):
    r = c.get(f"{API}/v1/bookings/availability", params={"serviceId": svc, "date": date, "professionalId": pro})
    assert r.status_code == 200, r.text
    return r.json()["slots"]


def find_free_slot(c, pro=PRO, need_next_free=False):
    days = future_workdays()
    random.shuffle(days)
    for d in days:
        slots = availability(c, d, pro)
        times = [s["time"] for s in slots]
        random.shuffle(times)
        for t in times:
            return d, t, slots
    raise AssertionError("no free slot found")


def book(c, date, time, pro=PRO, key=None, email=None, xff=None):
    body = {
        "serviceId": SVC, "professionalId": pro, "dateStr": date, "startTime": time,
        "customerName": "tscheck cliente", "customerEmail": email or f"tscheck-{uid()}@example.com",
        "customerPhone": "600111222", "termsAccepted": True,
        "idempotencyKey": key or f"tscheck-{uid()}-key",
    }
    return c.post(f"{API}/v1/bookings", json=body, headers={"x-forwarded-for": xff or ip()})
