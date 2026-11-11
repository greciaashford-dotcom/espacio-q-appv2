import json, re, struct, httpx, pytest

B = "http://localhost:3000"
PAGES = ["/", "/servicios", "/servicios/corte-de-autor-visagismo", "/contacto", "/preguntas-frecuentes"]
c = httpx.Client(base_url=B, timeout=60, follow_redirects=True)


def get(p):
    r = c.get(p)
    assert r.status_code == 200, (p, r.status_code)
    return r


def meta(html, attr, key):
    m = re.search(r'<meta (?:name|property)="%s" content="([^"]*)"' % re.escape(key), html)
    return m.group(1) if m else None


def jsonld(html):
    out = []
    for s in re.findall(r'<script type="application/ld\+json"[^>]*>(.*?)</script>', html, re.S):
        d = json.loads(s)
        out.extend(d.get("@graph", [d]) if isinstance(d, dict) else d)
    return out


def types(items):
    t = []
    for i in items:
        x = i.get("@type")
        t.extend(x if isinstance(x, list) else [x])
    return t


def test_meta_tags_unique_and_noindex():
    titles, descs = set(), set()
    for p in PAGES:
        r = get(p)
        h = r.text
        assert "noindex" in r.headers.get("x-robots-tag", "") or 'name="robots" content="noindex' in h
        t = re.search(r"<title>(.*?)</title>", h).group(1)
        d = meta(h, "name", "description")
        assert t and d, p
        titles.add(t); descs.add(d)
        assert len(re.findall(r"<h1[\s>]", h)) == 1, (p, "h1 count")
        can = re.search(r'<link rel="canonical" href="([^"]+)"', h).group(1)
        assert can == "https://espacioq.es" + ("" if p == "/" else p), can
        assert meta(h, "p", "og:url") == can
        assert meta(h, "p", "og:image:width") == "1200" and meta(h, "p", "og:image:height") == "630"
        assert meta(h, "n", "twitter:card")
        assert 'hrefLang="es-ES"' in h
        assert meta(h, "n", "geo.position") or meta(h, "n", "ICBM")
        if p == "/":
            assert "Chueca" in t + d
            img = meta(h, "p", "og:image")
            path = re.sub(r"^https?://[^/]+", "", img)
            ir = c.get(path)
            assert ir.status_code == 200 and ir.headers["content-type"].startswith("image")
    assert len(titles) == len(PAGES) and len(descs) == len(PAGES)


def test_jsonld():
    h = get("/").text
    items = jsonld(h)
    ts = types(items)
    assert "WebSite" in ts and "Organization" in ts
    salon = next(i for i in items if set(["HairSalon", "BeautySalon"]) & set(types([i])))
    s = json.dumps(salon, ensure_ascii=False)
    assert "Pelayo" in s and "28004" in s and "Chueca" in s and "ReserveAction" in s
    assert str(salon["geo"]["latitude"]).startswith("40.4241269")
    assert str(salon["geo"]["longitude"]).startswith("-3.6976262")
    assert salon.get("telephone")
    assert "10:30" in s and "21:00" in s and "09:00" in s and "16:00" in s
    assert "aggregateRating" not in h and '"review"' not in h
    sv = types(jsonld(get("/servicios/corte-de-autor-visagismo").text))
    assert "Service" in sv and "BreadcrumbList" in sv
    fh = get("/preguntas-frecuentes").text
    faq = next(i for i in jsonld(fh) if "FAQPage" in types([i]))
    assert len(faq["mainEntity"]) == 6
    for q in faq["mainEntity"]:
        assert q["name"][:20].replace("&", "&amp;") in fh or q["name"][:20] in fh


def test_robots_sitemap_llms_rawhtml():
    r = get("/robots.txt").text
    for bot in ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "Claude-User",
                "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended", "CCBot"]:
        assert f"User-Agent: {bot}" in r
    for d in ["/admin", "/acceso", "/api/", "/reservar/gestion", "/newsletter"]:
        assert f"Disallow: {d}" in r
    assert "Sitemap: https://espacioq.es/sitemap.xml" in r
    sm = get("/sitemap.xml").text
    locs = re.findall(r"<loc>([^<]+)", sm)
    assert all(l.startswith("https://espacioq.es") for l in locs)
    assert "https://espacioq.es/preguntas-frecuentes" in locs
    assert "https://espacioq.es/servicios/corte-de-autor-visagismo" in locs
    l = get("/llms.txt").text
    for s in ["ESPACIO Q", "Pelayo", "Metro", "10:30", "+34", "€", "/reservar", "/preguntas-frecuentes"]:
        assert s in l, s
    home = get("/").text
    for s in ["Pelayo", "10:30"]:
        assert s in home, s
    assert "€" in get("/servicios").text
    assert "Pelayo" in get("/preguntas-frecuentes").text or "<details" in get("/preguntas-frecuentes").text


def png_size(b):
    assert b[:8] == b"\x89PNG\r\n\x1a\n"
    return struct.unpack(">II", b[16:24])


def test_icons_manifest():
    assert get("/favicon.ico").content[:4] == b"\x00\x00\x01\x00"
    assert png_size(get("/apple-touch-icon.png").content) == (180, 180)
    assert png_size(get("/icon-192.png").content) == (192, 192)
    assert png_size(get("/icon-512.png").content) == (512, 512)
    m = get("/manifest.webmanifest").json()
    purposes = " ".join(i.get("purpose", "") for i in m["icons"])
    assert "maskable" in purposes
    for i in m["icons"]:
        assert c.get(i["src"]).status_code == 200
