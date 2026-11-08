import httpx
from conftest import BASE, API

def test_openapi_lists_v1():
    r = httpx.get(f"{API}/openapi.json", timeout=60)
    assert r.status_code == 200
    paths = r.json()["paths"]
    assert any(p.startswith("/api/v1/") for p in paths)

def test_public_pages_200():
    for p in ["/", "/servicios", "/equipo", "/galeria", "/contacto", "/reservar"]:
        r = httpx.get(BASE.replace("8001", "3000") + p, timeout=90)
        assert r.status_code == 200, p
