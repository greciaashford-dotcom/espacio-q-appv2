from conftest import API, find_free_slot, book, availability, ip

def tok(r): return r.json()["manageUrl"].rsplit("/", 1)[1]

def manage(c, body): return c.post(f"{API}/v1/bookings/manage", json=body, headers={"x-forwarded-for": ip()})

def test_reschedule_free_and_taken(client, db):
    d, t, slots = find_free_slot(client)
    r = book(client, d, t); assert r.status_code == 200
    token, aid = tok(r), r.json()["appointment"]["id"]
    # free slot on a different date
    d2, t2, _ = find_free_slot(client)
    if d2 == d: d2, t2, _ = find_free_slot(client)
    rr = manage(client, {"action": "reschedule", "token": token, "newDateStr": d2, "newStartTime": t2})
    assert rr.status_code == 200, rr.text
    a = db.appointment.find_one({"_id": aid})
    assert (a["dateStrMadrid"], a["startTimeMadrid"]) == (d2, t2)
    assert t in [s["time"] for s in availability(client, d)]
    # taken slot
    d3, t3, _ = find_free_slot(client)
    assert book(client, d3, t3).status_code == 200
    rt = manage(client, {"action": "reschedule", "token": token, "newDateStr": d3, "newStartTime": t3})
    assert rt.status_code == 409, rt.text
    assert "Tu cita original se mantiene intacta" in rt.json()["error"]
    a = db.appointment.find_one({"_id": aid})
    assert (a["dateStrMadrid"], a["startTimeMadrid"]) == (d2, t2)

def test_cancel_then_rebook(client):
    d, t, _ = find_free_slot(client)
    r = book(client, d, t); assert r.status_code == 200
    rc = manage(client, {"action": "cancel", "token": tok(r), "reason": "tscheck"})
    assert rc.status_code == 200, rc.text
    assert book(client, d, t).status_code == 200

def test_invalid_token(client):
    r = manage(client, {"action": "cancel", "token": "tscheck-invalid-token-xxxxxxxxxxxx"})
    assert r.status_code in (400, 404), r.text
    assert "customerEmail" not in r.text
