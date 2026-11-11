"""Genera favicon, iconos PWA e imagen social 1200x630 de ESPACIO Q en /app/frontend/public."""
import io
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

OUT = Path("/app/frontend/public")
OUT.mkdir(exist_ok=True)
SRC = "https://customer-assets-jai6qajn.emergentagent.net/job_espacio-q-app--55y3g2cv/artifacts/7bbb25ccb10a787d_S%C3%ADmbolo%20Q%20minimalista%20en%20gris%20claro.png"
BG = (243, 243, 243)
INK = (17, 17, 17)


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    return Image.open(io.BytesIO(urllib.request.urlopen(req, timeout=60).read()))


src = fetch(SRC).convert("L")
# Máscara de tinta (Q negra) y recorte ajustado
mask = src.point(lambda v: 255 if v < 128 else 0)
bbox = mask.getbbox()
q = mask.crop(bbox)
w, h = q.size
side = max(w, h)


def render(size, pad_ratio, bold_px=0, maskable=False):
    """Coloca la Q centrada; bold_px engrosa el trazo (solo tamaños pequeños)."""
    big = 1024
    inner = int(big * (1 - 2 * pad_ratio))
    scale = inner / side
    glyph = q.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.LANCZOS)
    if bold_px:
        glyph = glyph.filter(ImageFilter.MaxFilter(bold_px * 2 + 1))
    canvas_mask = Image.new("L", (big, big), 0)
    canvas_mask.paste(glyph, ((big - glyph.width) // 2, (big - glyph.height) // 2))
    img = Image.new("RGB", (big, big), BG)
    img.paste(Image.new("RGB", (big, big), INK), (0, 0), canvas_mask)
    return img.resize((size, size), Image.LANCZOS)


# Tamaños pequeños: Q casi a sangre y trazo algo más grueso para que sea legible a 16 px
ico16 = render(16, 0.04, bold_px=34)
ico32 = render(32, 0.05, bold_px=22)
ico48 = render(48, 0.06, bold_px=14)
ico48.save(OUT / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)], append_images=[ico16, ico32])
ico16.save(OUT / "favicon-16x16.png")
ico32.save(OUT / "favicon-32x32.png")
render(180, 0.12).save(OUT / "apple-touch-icon.png")
render(192, 0.1).save(OUT / "icon-192.png")
render(512, 0.1).save(OUT / "icon-512.png")
render(512, 0.22).save(OUT / "icon-maskable-512.png")

# Imagen social 1200x630: foto editorial del salón + panel lino con la marca
photo = fetch("https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?auto=format&fit=crop&w=1400&q=80").convert("RGB")
og = Image.new("RGB", (1200, 630), (233, 228, 216))
photo = ImageOps.fit(photo, (560, 630), Image.LANCZOS, centering=(0.5, 0.5))
og.paste(photo, (640, 0))
d = ImageDraw.Draw(og)
serif = "/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf"
sans = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
logo = render(96, 0.1)
og.paste(logo, (72, 72))


def spaced(text, xy, font, fill, tracking):
    x, y = xy
    for ch in text:
        d.text((x, y), ch, font=font, fill=fill)
        x += d.textlength(ch, font=font) + tracking


spaced("ESPACIO Q", (72, 236), ImageFont.truetype(serif, 76), (20, 20, 20), 10)
d.text((74, 340), "Peluquería y salón de belleza", font=ImageFont.truetype(serif, 38), fill=(40, 40, 40))
d.text((74, 390), "en Chueca, Madrid", font=ImageFont.truetype(serif, 38), fill=(40, 40, 40))
d.line((74, 468, 190, 468), fill=(120, 110, 95), width=2)
d.text((74, 492), "Calle de Pelayo, 41 · Reserva online", font=ImageFont.truetype(sans, 24), fill=(90, 85, 75))
og.save(OUT / "og-espacioq.jpg", quality=88)
print("ok", bbox, {p.name: Image.open(p).size for p in OUT.iterdir()})
