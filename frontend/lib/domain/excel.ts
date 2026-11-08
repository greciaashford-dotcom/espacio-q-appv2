import ExcelJS from "exceljs";
import { prisma } from "@/lib/db/prisma";
import { normalizeEmail, normalizePhone } from "@/lib/utils";
import { generateOpaqueToken } from "@/lib/security/crypto";

export const EXCEL_TEMPLATE_COLUMNS = [
  { header: "id_externo", key: "externalId", width: 16 },
  { header: "nombre", key: "firstName", width: 22 },
  { header: "apellidos", key: "lastName", width: 26 },
  { header: "email", key: "email", width: 30 },
  { header: "telefono", key: "phone", width: 18 },
  { header: "etiquetas", key: "tags", width: 26 },
  { header: "notas", key: "internalNotes", width: 36 },
] as const;

/**
 * Neutraliza posibles vectores de inyección de fórmulas en Excel/CSV (=, +, -, @, tab, CR)
 */
export function sanitizeSpreadsheetText(value: string | null | undefined): string {
  if (!value) return "";
  const str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

function extractSafeCellText(cellValue: ExcelJS.CellValue): string {
  if (cellValue === null || cellValue === undefined) return "";
  if (typeof cellValue === "string" || typeof cellValue === "number" || typeof cellValue === "boolean") {
    return String(cellValue).trim();
  }
  if (cellValue instanceof Date) {
    return cellValue.toISOString();
  }
  if (typeof cellValue === "object") {
    // Si la celda contiene un objeto fórmula, NUNCA evaluamos ni usamos la fórmula; extraemos texto plano seguro si existe
    if ("richText" in cellValue && Array.isArray(cellValue.richText)) {
      return cellValue.richText.map((rt) => rt.text).join("").trim();
    }
    if ("text" in cellValue && typeof cellValue.text === "string") {
      return cellValue.text.trim();
    }
  }
  return "";
}

export async function generateClientsExcelTemplate(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ESPACIO Q";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Plantilla Clientes");
  sheet.columns = EXCEL_TEMPLATE_COLUMNS.map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width,
  }));

  sheet.getRow(1).font = { bold: true };
  // Fila de guía ilustrativa sin datos reales
  sheet.addRow({
    externalId: "EJEMPLO-001",
    firstName: "Nombre (Obligatorio)",
    lastName: "Apellidos (Opcional)",
    email: "ejemplo@dominio.es",
    phone: "+34 600 000 000",
    tags: "corte, color",
    internalNotes: "Nota interna de ejemplo (borrar fila antes de importar)",
  });

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

export type ParsedClientRow = {
  rowNumber: number;
  externalId: string | null;
  firstName: string;
  lastName: string | null;
  email: string | null;
  emailNormalized: string | null;
  phone: string | null;
  phoneNormalized: string | null;
  tags: string[];
  internalNotes: string | null;
  warnings: string[];
  error?: string;
};

export async function parseAndValidateClientsXlsx(
  fileBuffer: Buffer,
  options?: { maxRows?: number }
): Promise<{
  ok: boolean;
  error?: string;
  rows: ParsedClientRow[];
}> {
  const maxRows = options?.maxRows ?? 2500;
  const workbook = new ExcelJS.Workbook();

  try {
    await workbook.xlsx.load(fileBuffer as any);
  } catch {
    return {
      ok: false,
      error: "El archivo no es un libro Excel (.xlsx) válido o está dañado.",
      rows: [],
    };
  }

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    return {
      ok: false,
      error: "El archivo Excel no contiene ninguna hoja de cálculo.",
      rows: [],
    };
  }

  if (sheet.rowCount > maxRows + 1) {
    return {
      ok: false,
      error: `El archivo supera el límite máximo permitido de ${maxRows} filas por lote.`,
      rows: [],
    };
  }

  // Leer cabeceras de la fila 1
  const headerRow = sheet.getRow(1);
  const colIndexByField: Record<string, number> = {};

  headerRow.eachCell((cell, colNumber) => {
    const rawHeader = extractSafeCellText(cell.value)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

    if (["id_externo", "external_id", "id", "codigo"].includes(rawHeader)) {
      colIndexByField.externalId = colNumber;
    } else if (["nombre", "first_name", "firstname", "cliente"].includes(rawHeader)) {
      colIndexByField.firstName = colNumber;
    } else if (["apellidos", "apellido", "last_name", "lastname"].includes(rawHeader)) {
      colIndexByField.lastName = colNumber;
    } else if (["email", "correo", "e-mail", "mail"].includes(rawHeader)) {
      colIndexByField.email = colNumber;
    } else if (["telefono", "tel", "movil", "phone", "celular"].includes(rawHeader)) {
      colIndexByField.phone = colNumber;
    } else if (["etiquetas", "tags", "segmento"].includes(rawHeader)) {
      colIndexByField.tags = colNumber;
    } else if (["notas", "observaciones", "notas_internas", "notes"].includes(rawHeader)) {
      colIndexByField.internalNotes = colNumber;
    }
  });

  if (!colIndexByField.firstName) {
    return {
      ok: false,
      error:
        "No se encontró la columna obligatoria «nombre» en la primera fila del Excel.",
      rows: [],
    };
  }

  const parsedRows: ParsedClientRow[] = [];
  const seenEmailsInFile = new Set<string>();

  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const firstName = colIndexByField.firstName
      ? extractSafeCellText(row.getCell(colIndexByField.firstName).value)
      : "";
    const lastName = colIndexByField.lastName
      ? extractSafeCellText(row.getCell(colIndexByField.lastName).value)
      : "";
    const rawEmail = colIndexByField.email
      ? extractSafeCellText(row.getCell(colIndexByField.email).value)
      : "";
    const rawPhone = colIndexByField.phone
      ? extractSafeCellText(row.getCell(colIndexByField.phone).value)
      : "";
    const rawExternalId = colIndexByField.externalId
      ? extractSafeCellText(row.getCell(colIndexByField.externalId).value)
      : "";
    const rawTags = colIndexByField.tags
      ? extractSafeCellText(row.getCell(colIndexByField.tags).value)
      : "";
    const rawNotes = colIndexByField.internalNotes
      ? extractSafeCellText(row.getCell(colIndexByField.internalNotes).value)
      : "";

    // Saltar filas completamente vacías
    if (!firstName && !lastName && !rawEmail && !rawPhone && !rawExternalId) {
      continue;
    }

    const warnings: string[] = [];
    let error: string | undefined;

    if (!firstName || firstName.length < 2) {
      error = "El campo «nombre» es obligatorio y debe tener al menos 2 caracteres.";
    }

    const emailNormalized = normalizeEmail(rawEmail);
    if (emailNormalized) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailNormalized)) {
        error = `Formato de correo electrónico inválido: "${rawEmail}".`;
      } else if (seenEmailsInFile.has(emailNormalized)) {
        error = `Correo electrónico duplicado dentro del mismo archivo: "${emailNormalized}".`;
      } else {
        seenEmailsInFile.add(emailNormalized);
      }
    } else {
      warnings.push("Sin email: este cliente no recibirá comunicaciones por correo.");
    }

    const phoneNormalized = normalizePhone(rawPhone);
    const tags = rawTags
      ? rawTags
          .split(/[,;|]/)
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    parsedRows.push({
      rowNumber: r,
      externalId: rawExternalId || null,
      firstName,
      lastName: lastName || null,
      email: emailNormalized,
      emailNormalized,
      phone: rawPhone || null,
      phoneNormalized,
      tags,
      internalNotes: rawNotes || null,
      warnings,
      error,
    });
  }

  return {
    ok: true,
    rows: parsedRows,
  };
}

export async function executeClientsXlsxImport(params: {
  fileBuffer: Buffer;
  fileName: string;
  mode: "CREATE_ONLY" | "UPSERT_BY_EMAIL";
  dryRun?: boolean;
  actorUserId?: string;
}) {
  const parsed = await parseAndValidateClientsXlsx(params.fileBuffer);
  if (!parsed.ok) {
    return {
      ok: false as const,
      error: parsed.error,
    };
  }

  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  const rowResults: Array<{
    rowNumber: number;
    action: "CREATED" | "UPDATED" | "SKIPPED" | "ERROR";
    message: string;
    email?: string | null;
  }> = [];

  for (const row of parsed.rows) {
    if (row.error) {
      errorCount++;
      rowResults.push({
        rowNumber: row.rowNumber,
        action: "ERROR",
        message: row.error,
        email: row.emailNormalized,
      });
      continue;
    }

    const existingByEmail = row.emailNormalized
      ? await prisma.client.findFirst({
          where: { emailNormalized: row.emailNormalized },
        })
      : null;

    if (existingByEmail) {
      if (params.mode === "CREATE_ONLY") {
        skippedCount++;
        rowResults.push({
          rowNumber: row.rowNumber,
          action: "SKIPPED",
          message: `Omitido: ya existe un cliente con el correo ${row.emailNormalized}.`,
          email: row.emailNormalized,
        });
        continue;
      }

      // Modo UPSERT_BY_EMAIL: actualiza datos básicos pero NUNCA activa marketingConsent ni reactiva bajas
      if (!params.dryRun) {
        const mergedTags = Array.from(
          new Set([...existingByEmail.tags, ...row.tags])
        );
        await prisma.client.update({
          where: { id: existingByEmail.id },
          data: {
            firstName: row.firstName,
            lastName: row.lastName ?? existingByEmail.lastName,
            phone: row.phone ?? existingByEmail.phone,
            phoneNormalized:
              row.phoneNormalized ?? existingByEmail.phoneNormalized,
            externalId: row.externalId ?? existingByEmail.externalId,
            tags: mergedTags,
            internalNotes: row.internalNotes ?? existingByEmail.internalNotes,
          },
        });
      }
      updatedCount++;
      rowResults.push({
        rowNumber: row.rowNumber,
        action: "UPDATED",
        message: "Cliente existente actualizado (consentimiento comercial preservado sin activar por importación).",
        email: row.emailNormalized,
      });
      continue;
    }

    // Crear nuevo cliente: marketingConsent SIEMPRE false en importación Excel (Regla crítica Sección 12)
    if (!params.dryRun) {
      await prisma.client.create({
        data: {
          externalId: row.externalId,
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.emailNormalized,
          emailNormalized: row.emailNormalized,
          phone: row.phone,
          phoneNormalized: row.phoneNormalized,
          tags: row.tags,
          internalNotes: row.internalNotes,
          marketingConsent: false,
          status: "ACTIVE",
        },
      });
    }
    createdCount++;
    rowResults.push({
      rowNumber: row.rowNumber,
      action: "CREATED",
      message:
        row.warnings.length > 0
          ? `Creado (${row.warnings.join(" ")})`
          : "Cliente creado correctamente (no suscrito a marketing por defecto).",
      email: row.emailNormalized,
    });
  }

  let importJobId: string | null = null;
  if (!params.dryRun) {
    const job = await prisma.importJob.create({
      data: {
        fileName: params.fileName,
        mode: params.mode,
        totalRows: parsed.rows.length,
        createdCount,
        updatedCount,
        skippedCount,
        errorCount,
        status: "COMPLETED",
        actorUserId: params.actorUserId ?? null,
        rowResults: {
          create: rowResults.map((r) => ({
            rowNumber: r.rowNumber,
            action: r.action,
            message: r.message,
            email: r.email ?? null,
          })),
        },
      },
    });
    importJobId = job.id;

    await prisma.auditEvent.create({
      data: {
        actorUserId: params.actorUserId ?? null,
        action: "CLIENTS_XLSX_IMPORT",
        entityType: "ImportJob",
        entityId: job.id,
        summary: `Importación Excel (${params.fileName}): ${createdCount} creados, ${updatedCount} actualizados, ${skippedCount} omitidos, ${errorCount} errores.`,
      },
    });
  }

  return {
    ok: true as const,
    dryRun: Boolean(params.dryRun),
    importJobId,
    summary: {
      totalRows: parsed.rows.length,
      createdCount,
      updatedCount,
      skippedCount,
      errorCount,
    },
    rowResults,
  };
}

export async function exportClientsToXlsx(params: {
  search?: string;
  tag?: string;
  columns?: string[];
  actorUserId?: string;
}): Promise<{ buffer: Buffer; rowCount: number; exportJobId: string }> {
  const where: any = {
    status: { not: "ANONYMIZED" },
  };

  if (params.search?.trim()) {
    const q = params.search.trim();
    where.OR = [
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { emailNormalized: { contains: q.toLowerCase() } },
      { phone: { contains: q } },
    ];
  }

  if (params.tag?.trim()) {
    where.tags = { has: params.tag.trim() };
  }

  const clients = await prisma.client.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { appointments: true } },
    },
  });

  const allowedCols = [
    "externalId",
    "firstName",
    "lastName",
    "email",
    "phone",
    "tags",
    "marketingConsent",
    "appointmentsCount",
    "createdAt",
  ];

  const selectedCols =
    params.columns && params.columns.length > 0
      ? params.columns.filter((c) => allowedCols.includes(c))
      : allowedCols;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ESPACIO Q";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Clientes ESPACIO Q");

  const colDefs: Record<string, { header: string; width: number }> = {
    externalId: { header: "ID Externo", width: 16 },
    firstName: { header: "Nombre", width: 22 },
    lastName: { header: "Apellidos", width: 26 },
    email: { header: "Email", width: 30 },
    phone: { header: "Teléfono", width: 20 },
    tags: { header: "Etiquetas", width: 26 },
    marketingConsent: { header: "Consentimiento Marketing", width: 24 },
    appointmentsCount: { header: "Total Citas", width: 14 },
    createdAt: { header: "Fecha Alta", width: 22 },
  };

  sheet.columns = selectedCols.map((key) => ({
    header: colDefs[key]?.header ?? key,
    key,
    width: colDefs[key]?.width ?? 20,
  }));

  sheet.getRow(1).font = { bold: true };

  for (const client of clients) {
    const rowData: Record<string, string | number> = {};
    for (const col of selectedCols) {
      switch (col) {
        case "externalId":
          rowData[col] = sanitizeSpreadsheetText(client.externalId);
          break;
        case "firstName":
          rowData[col] = sanitizeSpreadsheetText(client.firstName);
          break;
        case "lastName":
          rowData[col] = sanitizeSpreadsheetText(client.lastName);
          break;
        case "email":
          rowData[col] = sanitizeSpreadsheetText(client.email);
          break;
        case "phone":
          // Exportar siempre como texto para conservar '+' y ceros iniciales
          rowData[col] = sanitizeSpreadsheetText(client.phone);
          break;
        case "tags":
          rowData[col] = sanitizeSpreadsheetText(client.tags.join(", "));
          break;
        case "marketingConsent":
          rowData[col] = client.marketingConsent ? "Sí (Verificado)" : "No";
          break;
        case "appointmentsCount":
          rowData[col] = client._count.appointments;
          break;
        case "createdAt":
          rowData[col] = client.createdAt.toISOString().slice(0, 10);
          break;
      }
    }
    const addedRow = sheet.addRow(rowData);
    // Forzar formato texto '@' en todas las celdas de texto para impedir ejecución de fórmulas
    addedRow.eachCell((cell) => {
      if (typeof cell.value === "string") {
        cell.numFmt = "@";
      }
    });
  }

  const exportJob = await prisma.exportJob.create({
    data: {
      scope: params.search ? `filtrado:${params.search}` : "todos",
      columnsJson: selectedCols,
      rowCount: clients.length,
      downloadToken: generateOpaqueToken(24),
      expiresAtUtc: new Date(Date.now() + 24 * 60 * 60 * 1000),
      actorUserId: params.actorUserId ?? null,
    },
  });

  await prisma.auditEvent.create({
    data: {
      actorUserId: params.actorUserId ?? null,
      action: "CLIENTS_XLSX_EXPORT",
      entityType: "ExportJob",
      entityId: exportJob.id,
      summary: `Exportación Excel de ${clients.length} clientes.`,
    },
  });

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    rowCount: clients.length,
    exportJobId: exportJob.id,
  };
}
