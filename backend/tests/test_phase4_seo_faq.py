# Phase 4: SEO/GEO meta, JSON-LD, robots/sitemap/llms.txt, favicon assets, FAQ SSR (public HTTP checks)
import json
import os
import re
import html as htmlmod

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")

PAGES = [
    "/", "/servicios", "/servicios/corte-en-seco-rizo-organico", "/equipo", "/galeria", "/contacto",
    "/reservar", "/preguntas-frecuentes", "/aviso-legal", "/terminos-y-condiciones",
    "/condiciones-reserva", "/privacidad", "/cookies",
]

_cache = {}


def get(path):
    if path not in _cache:
        _cache[path] = requests.get(f"{BASE_URL}{path}", timeout=60)
    return _cache[path]


def meta(html, attr, name):
    m = re.search(rf'<meta[^>]*{attr}="{re.escape(name)}"[^>]*content="([^"]*)"', html) or re.search(
        rf'<meta[^>]*content="([^"]*)"[^>]*{attr}="{re.escape(name)}"', html)
    return htmlmod.unescape(m.group(1)) if m else None


def jsonld(html, sid):
    m = re.search(rf'<script[^>]*id="{sid}"[^>]*>(.*?)</script>', html, re.S)
    return json.loads(m.group(1)) if m else None


# SEO meta per public page
@pytest.mark.parametrize("path", PAGES)
def test_page_seo_meta(path):
    r = get(path)
    assert r.status_code == 200
    assert "noindex" in r.headers.get("x-robots-tag", "")
    h = r.text
    title = re.search(r"<title>(.*?)</title>", h, re.S).group(1)
    assert title.strip()
    desc = meta(h, "name", "description")
    assert desc and len(desc) > 30
    n_h1 = len(re.findall(r"<h1[\s>]", h))
    assert n_h1 == 1, f"h1 count {n_h1}"
    canon = re.search(r'<link[^>]*rel="canonical"[^>]*href="([^"]+)"', h).group(1)
    exp = "https://espacioq.es" + ("" if path == "/" else path)
    assert canon.rstrip("/") == exp.rstrip("/")
    assert re.search(r'hrefLang="es-ES"|hreflang="es-ES"', h)
    assert meta(h, "property", "og:url").rstrip("/") == exp.rstrip("/")
    assert meta(h, "property", "og:image") == "https://espacioq.es/og-espacioq.jpg"
    assert meta(h, "property", "og:image:width") == "1200"
    assert meta(h, "property", "og:image:height") == "630"
    assert meta(h, "name", "twitter:card") == "summary_large_image"
    assert meta(h, "name", "geo.region") == "ES-MD"
    assert meta(h, "name", "geo.placename") == "Madrid"
    assert meta(h, "name", "geo.position") == "40.4241269;-3.6976262"
    rob = meta(h, "name", "robots")
    assert rob and "noindex" in rob and "nofollow" in rob
    assert "aggregateRating" not in h and '"review"' not in h
    sal = jsonld(h, "jsonld-salon")
    assert sal and "@graph" in sal


def test_titles_descriptions_unique():
    titles, descs = {}, {}
    for p in PAGES:
        h = get(p).text
        titles[p] = re.search(r"<title>(.*?)</title>", h, re.S).group(1)
        descs[p] = meta(h, "name", "description")
    assert len(set(titles.values())) == len(PAGES), titles
    assert len(set(descs.values())) == len(PAGES), descs


def test_home_wording():
    h = get("/").text
    assert "Peluquería y salón de belleza en Chueca, Madrid" in htmlmod.unescape(h)


# JSON-LD salon graph
def test_salon_jsonld():
    g = jsonld(get("/").text, "jsonld-salon")["@graph"]
    types = [n["@type"] for n in g]
    flat = [t for x in types for t in (x if isinstance(x, list) else [x])]
    assert "WebSite" in flat and "Organization" in flat and "HairSalon" in flat and "BeautySalon" in flat
    org = next(n for n in g if n["@type"] == "Organization")
    logo = org["logo"] if isinstance(org["logo"], str) else org["logo"].get("url")
    assert logo.endswith("/icon-512.png")
    salon = next(n for n in g if isinstance(n["@type"], list) and "HairSalon" in n["@type"] or n["@type"] == "HairSalon")
    for k in ["address", "geo", "telephone", "openingHoursSpecification", "priceRange", "hasMap", "areaServed", "potentialAction"]:
        assert k in salon, k
    ohs = salon["openingHoursSpecification"]
    s = json.dumps(ohs)
    assert "10:30" in s and "21:00" in s and "09:00" in s and "16:00" in s
    act = salon["potentialAction"]
    act = act[0] if isinstance(act, list) else act
    assert act["@type"] == "ReserveAction"
    assert "/reservar" in json.dumps(act)


def test_service_jsonld():
    d = jsonld(get("/servicios/corte-en-seco-rizo-organico").text, "jsonld-service")
    s = json.dumps(d)
    assert '"Service"' in s and '"BreadcrumbList"' in s


def test_faq_jsonld_and_ssr():
    h = get("/preguntas-frecuentes").text
    d = jsonld(h, "jsonld-faq")
    assert d
    items = d.get("mainEntity") or next(n for n in d.get("@graph", []) if n["@type"] == "FAQPage")["mainEntity"]
    assert len(items) == 6
    plain = htmlmod.unescape(h)
    for q in items:
        assert q["name"] in plain
    assert h.count("<details") == 6
    assert "<summary" in h


def test_robots_txt():
    t = get("/robots.txt").text
    for ua in ["*", "GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "Claude-User",
               "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended", "CCBot"]:
        assert f"User-Agent: {ua}\n" in t
    assert t.count("Disallow: /admin\n") == 12
    assert "Sitemap: https://espacioq.es/sitemap.xml" in t


def test_sitemap():
    t = get("/sitemap.xml").text
    assert "https://espacioq.es/preguntas-frecuentes" in t
    assert "https://espacioq.es/servicios/corte-en-seco-rizo-organico" in t
    assert t.count("<url>") == t.count("<lastmod>")
    assert "/admin" not in t and "/acceso" not in t


def test_llms_txt():
    r = get("/llms.txt")
    assert r.status_code == 200 and ("text/plain" in r.headers["content-type"] or "text/markdown" in r.headers["content-type"])
    t = r.text
    for s in ["Pelayo", "Chueca", "Metro", "10:30", "+34", "€", "/reservar", "/preguntas-frecuentes"]:
        assert s in t, s


@pytest.mark.parametrize("p,ctype", [
    ("/favicon.ico", "image/"), ("/apple-touch-icon.png", "image/png"), ("/icon-192.png", "image/png"),
    ("/icon-512.png", "image/png"), ("/icon-maskable-512.png", "image/png"), ("/og-espacioq.jpg", "image/jpeg"),
    ("/manifest.webmanifest", "manifest+json"),
])
def test_assets(p, ctype):
    r = get(p)
    assert r.status_code == 200 and ctype in r.headers["content-type"]


def test_icon_links_in_head():
    h = get("/").text
    assert re.search(r'<link[^>]*rel="icon"', h)
    assert re.search(r'<link[^>]*rel="apple-touch-icon"', h)
    assert re.search(r'<link[^>]*rel="manifest"', h)
