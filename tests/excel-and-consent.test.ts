import ExcelJS from "exceljs";
import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import {
  executeClientsXlsxImport,
  exportClientsToXlsx,
} from "@/lib/domain/excel";

describe("Importación y exportación Excel (.xlsx), protección de fórmulas y consentimiento comercial", () => {
  const testTag = `xlsx-test-${Date.now()}`;
  const emailNew = `ana.${Date.now()}@espacioq-test.es`;
  const emailUnsub = `baja.${Date.now()}@espacioq-test.es`;
  const emailFormula = `formula.${Date.now()}@espacioq-test.es`;

  let createdExportJobId = "";

  afterAll(async () => {
    await prisma.importJob.deleteMany({
      where: { fileName: { startsWith: "test-import-" } },
    });
    if (createdExportJobId) {
      await prisma.exportJob.deleteMany({
        where: { id: createdExportJobId },
      });
    }
    await prisma.auditEvent.deleteMany({
      where: { action: { in: ["CLIENTS_XLSX_IMPORT", "CLIENTS_XLSX_EXPORT"] } },
    });
    await prisma.suppression.deleteMany({
      where: { emailNormalized: { in: [emailNew, emailUnsub, emailFormula] } },
    });
    await prisma.client.deleteMany({
      where: { emailNormalized: { in: [emailNew, emailUnsub, emailFormula] } },
    });
  });

  it("importa .xlsx real normalizando emails, detectando filas erróneas y SIN activar marketingConsent ni reactivar bajas", async () => {
    // Preparar un contacto previamente dado de baja y suprimido
    await prisma.client.create({
      data: {
        firstName: "Contacto Dado De Baja",
        email: emailUnsub,
        emailNormalized: emailUnsub,
        marketingConsent: false,
        tags: [testTag],
      },
    });
    await prisma.suppression.create({
      data: {
        emailNormalized: emailUnsub,
        reason: "UNSUBSCRIBED",
      },
    });

    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Clientes");
    sheet.columns = [
      { header: "nombre", key: "nombre" },
      { header: "apellidos", key: "apellidos" },
      { header: "email", key: "email" },
      { header: "telefono", key: "telefono" },
      { header: "etiquetas", key: "etiquetas" },
      { header: "notas", key: "notas" },
    ];

    sheet.addRow({
      nombre: "Ana",
      apellidos: "López",
      email: `  ${emailNew.toUpperCase()}  `,
      telefono: "+34 600 11 22 33",
      etiquetas: `${testTag}, color`,
      notas: "Primera visita",
    });

    sheet.addRow({
      nombre: "Fila Inválida",
      apellidos: "Error",
      email: "correo-malformado-sin-dominio",
      telefono: "600000000",
      etiquetas: testTag,
    });

    sheet.addRow({
      nombre: "Contacto Dado De Baja Actualizado",
      apellidos: "Pérez",
      email: emailUnsub,
      telefono: "+34 699 88 77 66",
      etiquetas: testTag,
    });

    sheet.addRow({
      nombre: "=CMD|' /C calc'!A0",
      apellidos: "@SUM(1+1)",
      email: emailFormula,
      telefono: "+34 611 00 11 22",
      etiquetas: testTag,
      notas: "-2+3+cmd",
    });

    const rawBuf = Buffer.from(await wb.xlsx.writeBuffer());

    const res = await executeClientsXlsxImport({
      fileBuffer: rawBuf,
      fileName: `test-import-${Date.now()}.xlsx`,
      mode: "UPSERT_BY_EMAIL",
      dryRun: false,
    });

    expect(res.ok).toBe(true);
    if (!res.ok) return;

    expect(res.summary.createdCount).toBe(2);
    expect(res.summary.updatedCount).toBe(1);
    expect(res.summary.errorCount).toBe(1);

    const createdAna = await prisma.client.findFirst({
      where: { emailNormalized: emailNew },
    });
    expect(createdAna).not.toBeNull();
    expect(createdAna?.marketingConsent).toBe(false);

    const updatedUnsub = await prisma.client.findFirst({
      where: { emailNormalized: emailUnsub },
    });
    expect(updatedUnsub?.marketingConsent).toBe(false);

    const stillSuppressed = await prisma.suppression.findUnique({
      where: { emailNormalized: emailUnsub },
    });
    expect(stillSuppressed).not.toBeNull();
  });

  it("exporta .xlsx neutralizando inyección de fórmulas (=, +, -, @) y conservando teléfonos +34 como texto", async () => {
    const exported = await exportClientsToXlsx({
      tag: testTag,
    });
    createdExportJobId = exported.exportJobId;

    expect(exported.rowCount).toBeGreaterThanOrEqual(2);

    const readWb = new ExcelJS.Workbook();
    await readWb.xlsx.load(exported.buffer as any);
    const sheet = readWb.worksheets[0];
    expect(sheet).toBeDefined();

    const cellValues: string[] = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      row.eachCell((cell) => {
        if (typeof cell.value === "string") {
          cellValues.push(cell.value);
          expect(cell.numFmt).toBe("@");
        }
      });
    });

    // Las cadenas que empezaban por =, @, + o - quedan prefijadas con apóstrofe literal
    expect(cellValues.some((v) => v.startsWith("'=CMD"))).toBe(true);
    expect(cellValues.some((v) => v.startsWith("'@SUM"))).toBe(true);
    expect(cellValues.some((v) => v.includes("+34 600 11 22 33"))).toBe(true);
  });
});
