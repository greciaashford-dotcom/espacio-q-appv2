/** URL pública de la app para enlaces de correos (APP_URL obligatoria; SITE_URL es solo para SEO). */
export function appUrl(): string {
  const url = process.env.APP_URL?.trim().replace(/\/$/, "");
  if (!url) throw new Error("APP_URL es obligatoria (URL pública de la app para enlaces de correo).");
  return url;
}
