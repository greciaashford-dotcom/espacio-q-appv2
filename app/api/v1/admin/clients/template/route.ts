import { NextResponse } from "next/server";
import { getCurrentUser, canManageCatalogOrCms } from "@/lib/auth/session";
import { generateClientsExcelTemplate } from "@/lib/domain/excel";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !canManageCatalogOrCms(user)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const buffer = await generateClientsExcelTemplate();

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="plantilla-clientes-espacio-q.xlsx"',
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
