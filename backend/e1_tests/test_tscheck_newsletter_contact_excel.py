import io, time
import openpyxl
from conftest import API, uid, ip

def test_newsletter(client, db):
    email = f"tscheck-{uid()}@example.com"
    r = client.post(f"{API}/v1/newsletter/subscribe", json={"email": email, "firstName": "tscheck", "consentAccepted": True, "source": "footer_form"}, headers={"x-forwarded-for": ip()})
    assert r.status_code == 200, r.text
    bad = client.post(f"{API}/v1/newsletter/subscribe", json={"email": f"tscheck-{uid()}@example.com", "consentAccepted": False}, headers={"x-forwarded-for": ip()})
    assert bad.status_code == 400, bad.text
    for _ in range(10):
        e = db.emailDelivery.find_one({"toEmail": email})
        if e: break
        time.sleep(1)
    assert e and e["templateKey"] == "NEWSLETTER_VERIFY" and e["status"] == "SIMULATED_LOCAL", e and e.get("templateKey")

def test_contact(client, db):
    email = f"tscheck-{uid()}@example.com"
    body = {"name": "tscheck contacto", "email": email, "phone": "600111222", "subject": "tscheck", "message": "Mensaje de prueba tscheck suficientemente largo.", "privacyAccepted": True, "website": ""}
    r = client.post(f"{API}/v1/contact", json=body, headers={"x-forwarded-for": ip()})
    assert r.status_code == 200, r.text
    assert db.contactMessage.find_one({"email": email})
    for _ in range(10):
        e = db.emailDelivery.find_one({"toEmail": email, "templateKey": "CONTACT_ACK"})
        if e: break
        time.sleep(1)
    assert e
    bad = client.post(f"{API}/v1/contact", json={**body, "email": "no-es-email"}, headers={"x-forwarded-for": ip()})
    assert bad.status_code == 400 and "error" in bad.json(), bad.text
    print(bad.json())

def test_excel_template_import_export(client, owner_cookies, db):
    t = client.get(f"{API}/v1/admin/clients/template", cookies=owner_cookies)
    assert t.status_code == 200 and t.content[:2] == b"PK"
    wb = openpyxl.load_workbook(io.BytesIO(t.content)); ws = wb.active
    headers = [c.value for c in ws[1]]
    s = uid(); emails = [f"tscheck-{s}-{i}@example.com" for i in range(3)]
    for r in range(ws.max_row, 1, -1): ws.delete_rows(r)
    for i, em in enumerate(emails):
        row = []
        for h in headers:
            hl = str(h).lower()
            if "mail" in hl: row.append(em)
            elif "nombre" in hl or "name" in hl: row.append("=1+1" if i == 0 else f"tscheck {s} {i}")
            elif "consent" in hl or "marketing" in hl or "newsletter" in hl: row.append("sí")
            elif "tel" in hl or "phone" in hl: row.append("600111222")
            else: row.append(None)
        ws.append(row)
    # ensure formula stored as literal string
    for row in ws.iter_rows(min_row=2):
        for c in row:
            if c.value == "=1+1": c.data_type = "s"
    buf = io.BytesIO(); wb.save(buf)
    r = client.post(f"{API}/v1/admin/clients/import", cookies=owner_cookies,
        files={"file": ("tscheck.xlsx", buf.getvalue(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
        data={"mode": "CREATE_ONLY", "dryRun": "false"})
    assert r.status_code == 200, r.text
    docs = list(db["client"].find({"email": {"$in": emails}}))
    assert len(docs) == 3, (headers, r.text[:400])
    for d in docs:
        assert not d.get("marketingConsent") and not d.get("marketingOptIn"), d
    f = [d for d in docs if d["email"] == emails[0]][0]
    assert any(isinstance(v, str) and v.startswith("=1+1") or v == "'=1+1" for v in f.values()), f
    e = client.get(f"{API}/v1/admin/clients/export", cookies=owner_cookies)
    assert e.status_code == 200
    openpyxl.load_workbook(io.BytesIO(e.content))
