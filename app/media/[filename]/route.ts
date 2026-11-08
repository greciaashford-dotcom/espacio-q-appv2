import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { detectImageMimeFromBuffer } from "@/lib/security/ssrf";

const SAFE_NAME = /^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp|avif)$/;

function getPublicMediaDir(): string {
  const base = process.env.LOCAL_STORAGE_DIR || "./storage";
  return path.resolve(process.cwd(), base, "public-media");
}

export async function GET(
  _req: Request,
  { params }: { params: { filename: string } }
) {
  const name = params.filename;
  if (!SAFE_NAME.test(name)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const baseDir = getPublicMediaDir();
  const fullPath = path.resolve(baseDir, name);
  if (!fullPath.startsWith(baseDir)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const buf = await fs.readFile(fullPath);
    const mime = detectImageMimeFromBuffer(buf) || "application/octet-stream";
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": mime,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not Found", { status: 404 });
  }
}
