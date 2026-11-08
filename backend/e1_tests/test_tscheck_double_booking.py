import concurrent.futures as cf
import httpx
from conftest import find_free_slot, book, uid, PRO

def _race(db):
    with httpx.Client(timeout=90) as c:
        d, t, _ = find_free_slot(c)
    def one(i):
        with httpx.Client(timeout=90) as c:
            return book(c, d, t)
    with cf.ThreadPoolExecutor(10) as ex:
        res = list(ex.map(one, range(10)))
    codes = sorted(r.status_code for r in res)
    assert codes.count(200) == 1 and codes.count(409) == 9, codes
    for r in res:
        if r.status_code == 409:
            assert "alternatives" in r.json()
    appt_id = [r for r in res if r.status_code == 200][0].json()["appointment"]["id"]
    appt = db.appointment.find_one({"_id": appt_id})
    n = db.occupancy.count_documents({"professionalId": PRO, "active": True,
        "startAtUtc": {"$lt": appt["blockEndAtUtc"]}, "endAtUtc": {"$gt": appt["blockStartAtUtc"]}})
    assert n == 1, n

def test_concurrency_run1(db): _race(db)
def test_concurrency_run2(db): _race(db)
def test_concurrency_run3(db): _race(db)

def test_partial_overlap_409(client):
    d, t, slots = find_free_slot(client)
    r = book(client, d, t); assert r.status_code == 200, r.text
    h, m = map(int, t.split(":")); m += 30; h += m // 60; m %= 60
    r2 = book(client, d, f"{h:02d}:{m:02d}")
    assert r2.status_code == 409, r2.text

def test_idempotency(client):
    d, t, _ = find_free_slot(client)
    key, email = f"tscheck-{uid()}-idem", f"tscheck-{uid()}@example.com"
    r1 = book(client, d, t, key=key, email=email); r2 = book(client, d, t, key=key, email=email)
    assert r1.status_code == 200 and r2.status_code == 200, (r1.text, r2.text)
    assert r1.json()["appointment"]["id"] == r2.json()["appointment"]["id"]
