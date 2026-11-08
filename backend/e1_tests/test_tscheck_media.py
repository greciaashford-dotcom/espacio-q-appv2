import io, struct, zlib
from conftest import API, BASE, uid

def png():
    def chunk(t, d): return struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xffffffff)
    raw = b"\x00\xff\x00\x00"
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", 1, 1, 8, 2, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(raw)) + chunk(b"IEND", b"")

def up(c, ck, name, data, ctype):
    return c.post(f"{API}/v1/admin/media/upload", cookies=ck,
        files={"file": (name, data, ctype)}, data={"internalName": f"tscheck-{uid()}", "altText": "tscheck"})

def test_png_upload_served(client, owner_cookies):
    r = up(client, owner_cookies, "tscheck.png", png(), "image/png")
    assert r.status_code == 200, r.text
    url = next((v for v in str(r.json()).replace("'", " ").split() if "/media/" in v), None)
    assert url, r.text
    path = url[url.index("/media/"):].rstrip(",}")
    g = client.get("http://localhost:3000" + path, cookies=owner_cookies)
    assert g.status_code == 200 and g.content[:4] == b"\x89PNG", (path, g.status_code)

def test_svg_and_fake_jpg_rejected(client, owner_cookies):
    r1 = up(client, owner_cookies, "x.svg", b"<svg xmlns='http://www.w3.org/2000/svg'/>", "image/svg+xml")
    r2 = up(client, owner_cookies, "x.jpg", b"just text pretending", "image/jpeg")
    assert r1.status_code >= 400 and r2.status_code >= 400, (r1.status_code, r2.status_code)

def test_upload_requires_auth(client):
    r = up(client, {}, "tscheck.png", png(), "image/png")
    assert r.status_code in (401, 403)
