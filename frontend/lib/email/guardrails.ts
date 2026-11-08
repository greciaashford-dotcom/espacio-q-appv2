// Control estructural de seguridad para todo correo saliente (guardarraíles del remitente gestionado):
// sin formularios, enlaces/recursos solo https absolutos sin acortadores/IPs/punycode/credenciales,
// texto de enlace coherente con su host y sin frases que pidan credenciales.
const SHORTENERS = ["bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "goo.gl", "rebrand.ly"];
const CRED_ASK = [
  "reply with your password", "reply with the code", "send your password", "cvv",
  "send us your password", "enter your password below", "confirm your card number",
  "your full card number", "seed phrase", "recovery phrase", "verify your card",
  "social security number", "confirm your bank details",
  "envíanos tu contraseña", "responde con tu contraseña", "número completo de tu tarjeta",
];
const HOSTISH = /\b(?:https?:\/\/)?((?:[a-z0-9-]+\.)+[a-z]{2,})/gi;

function decodeEntities(s: string) {
  return s
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

function hostOk(host: string) {
  if (!host || host.includes("xn--")) return false;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(":") || host.startsWith("[")) return false;
  return !SHORTENERS.some((s) => host === s || host.endsWith(`.${s}`));
}

const sameSite = (shown: string, real: string) => shown === real || real.endsWith(`.${shown}`) || shown.endsWith(`.${real}`);

export function assertSafeEmail(subject: string, html: string): void {
  const noComments = html.replace(/<!--[\s\S]*?-->/g, "");
  if (/<\s*(form|input|textarea|select)\b/i.test(noComments)) throw new Error("No se permiten formularios en el correo (G2)");
  const body = decodeEntities(`${subject}\n${noComments}`).toLowerCase();
  for (const p of CRED_ASK) if (body.includes(p)) throw new Error(`El correo pide credenciales: "${p}" (G2)`);

  const attrRe = /\s(href|src)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
  for (const m of noComments.matchAll(attrRe)) {
    const url = decodeEntities(m[2] ?? m[3] ?? m[4] ?? "").trim();
    const low = url.toLowerCase();
    if (!url || /^(mailto:|tel:|cid:|#)/.test(low)) continue;
    if (!low.startsWith("https://")) throw new Error(`Los enlaces deben ser https absolutos: ${url} (G3)`);
    const parsed = new URL(low);
    if (!hostOk(parsed.hostname) || parsed.username) throw new Error(`URL no permitida: ${url} (G3)`);
  }

  const anchorRe = /<a\b[^>]*\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a>/gi;
  for (const m of noComments.matchAll(anchorRe)) {
    const href = decodeEntities(m[1] ?? m[2] ?? m[3] ?? "").trim().toLowerCase();
    if (!href.startsWith("https://")) continue;
    const real = new URL(href).hostname;
    const text = decodeEntities(m[4].replace(/<[^>]+>/g, ""));
    for (const t of text.matchAll(HOSTISH)) {
      if (!sameSite(t[1].toLowerCase(), real)) throw new Error(`Texto de enlace "${t[1]}" ≠ host real ${real} (G3)`);
    }
  }
}
