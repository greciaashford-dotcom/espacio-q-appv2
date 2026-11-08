import { NextResponse } from "next/server";
import { detectImageMimeFromBuffer } from "@/lib/security/ssrf";
import { getMediaObject } from "@/lib/storage/object-storage";

const SAFE_NAME = /^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp|avif)$/;

// Caché en memoria acotada (los objetos son inmutables: nombre único por subida).
const CACHE_LIMIT_BYTES = 64 * 1024 * 1024;
const g = globalThis as unknown as { __mediaCache?: Map<string, Buffer>; __mediaCacheBytes?: number };
const cache = (g.__mediaCache ??= new Map());

function remember(name: string, buf: Buffer) {
  g.__mediaCacheBytes = (g.__mediaCacheBytes ?? 0) + buf.length;
  cache.set(name, buf);
  while ((g.__mediaCacheBytes ?? 0) > CACHE_LIMIT_BYTES && cache.size > 1) {
    const [oldest, old] = cache.entries().next().value as [string, Buffer];
    cache.delete(oldest);
    g.__mediaCacheBytes! -= old.length;
  }
}

export async function GET(
  _req: Request,
  { params }: { params: { filename: string } }
) {
  const name = params.filename;
  if (!SAFE_NAME.test(name)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  try {
    let buf = cache.get(name) ?? null;
    if (!buf) {
      buf = await getMediaObject(name);
      if (!buf) return new NextResponse("Not Found", { status: 404 });
      remember(name, buf);
    }
    const mime = detectImageMimeFromBuffer(buf);
    if (!mime) return new NextResponse("Not Found", { status: 404 });
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": mime,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("[media] error leyendo de Object Storage", err);
    return new NextResponse("Service Unavailable", { status: 503 });
  }
}
