export const dynamic = "force-dynamic";

/** Health check del despliegue (sin dependencias: debe responder aunque MongoDB tarde en conectar). */
export function GET() {
  return Response.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
}
