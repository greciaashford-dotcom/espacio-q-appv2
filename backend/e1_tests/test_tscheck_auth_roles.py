from conftest import API

def test_export_requires_auth(client):
    r = client.get(f"{API}/v1/admin/clients/export")
    assert r.status_code in (401, 403)

def test_owner_can_export(client, owner_cookies):
    r = client.get(f"{API}/v1/admin/clients/export", cookies=owner_cookies)
    assert r.status_code == 200, r.text[:200]
    assert r.content[:2] == b"PK"

def test_reception_denied_export(client, reception_cookies):
    r = client.get(f"{API}/v1/admin/clients/export", cookies=reception_cookies)
    assert r.status_code in (401, 403), r.status_code
