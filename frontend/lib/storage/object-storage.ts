// Emergent Object Storage (media de la biblioteca). Los ficheros nunca se guardan en disco local ni en MongoDB.
const STORAGE_BASE = (process.env.INTEGRATION_PROXY_URL || "").trim() || "https://integrations.emergentagent.com";
const STORAGE_URL = STORAGE_BASE.replace(/\/$/, "") + "/objstore/api/v1/storage";
const APP_PREFIX = "espacio-q/public-media";

const g = globalThis as unknown as { __storageKey?: Promise<string> };

async function initStorage(force = false): Promise<string> {
  if (!g.__storageKey || force) {
    const emergentKey = process.env.EMERGENT_LLM_KEY?.trim();
    if (!emergentKey) {
      console.error("[storage] Falta EMERGENT_LLM_KEY: no se puede usar Emergent Object Storage.");
      throw new Error("Almacenamiento de objetos no configurado.");
    }
    g.__storageKey = fetch(`${STORAGE_URL}/init`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emergent_key: emergentKey }),
    }).then(async (res) => {
      if (!res.ok) throw new Error(`Object storage init HTTP ${res.status}`);
      return (await res.json()).storage_key as string;
    });
    g.__storageKey.catch(() => (g.__storageKey = undefined));
  }
  return g.__storageKey;
}

async function withKey(run: (key: string) => Promise<Response>): Promise<Response> {
  let res = await run(await initStorage());
  if (res.status === 404 || res.status === 401) {
    const retry = await run(await initStorage(true));
    if (retry.ok || res.status === 401) res = retry;
  }
  return res;
}

export const mediaObjectPath = (fileName: string) => `${APP_PREFIX}/${fileName}`;

export async function putMediaObject(fileName: string, data: Buffer, contentType: string): Promise<string> {
  const path = mediaObjectPath(fileName);
  const res = await withKey((key) =>
    fetch(`${STORAGE_URL}/objects/${path}`, {
      method: "PUT",
      headers: { "X-Storage-Key": key, "Content-Type": contentType },
      body: new Uint8Array(data),
    })
  );
  if (!res.ok) throw new Error(`No se pudo guardar la imagen en el almacenamiento (HTTP ${res.status}).`);
  return ((await res.json()) as { path: string }).path;
}

export async function getMediaObject(fileName: string): Promise<Buffer | null> {
  const path = mediaObjectPath(fileName);
  const res = await withKey((key) => fetch(`${STORAGE_URL}/objects/${path}`, { headers: { "X-Storage-Key": key } }));
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Object storage GET HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}
