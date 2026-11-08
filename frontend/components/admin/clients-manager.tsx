"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  anonymizeClientRgpdAction,
  archiveOrRestoreClientAction,
  revokeClientMarketingConsentAction,
  saveClientAction,
} from "@/app/admin/clientes/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type ClientItem = {
  id: string;
  externalId: string | null;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  tags: string[];
  internalNotes: string | null;
  marketingConsent: boolean;
  status: string;
  appointmentsCount: number;
  recentAppointments: Array<{
    id: string;
    referenceCode: string;
    dateStrMadrid: string;
    serviceName: string;
    status: string;
  }>;
};

type ImportPreviewResult = {
  dryRun: boolean;
  summary: {
    totalRows: number;
    createdCount: number;
    updatedCount: number;
    skippedCount: number;
    errorCount: number;
  };
  rowResults: Array<{
    rowNumber: number;
    action: string;
    message: string;
    email?: string | null;
  }>;
};

const EXPORT_COLUMNS = [
  { key: "externalId", label: "ID Externo" },
  { key: "firstName", label: "Nombre" },
  { key: "lastName", label: "Apellidos" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Teléfono" },
  { key: "tags", label: "Etiquetas" },
  { key: "marketingConsent", label: "Consentimiento Marketing" },
  { key: "appointmentsCount", label: "Total Citas" },
  { key: "createdAt", label: "Fecha Alta" },
];

export function ClientsManager({
  clients,
  totalCount,
  page,
  totalPages,
  searchQuery,
  tagFilter,
  statusFilter,
  canExport,
  isOwnerAdmin,
}: {
  clients: ClientItem[];
  totalCount: number;
  page: number;
  totalPages: number;
  searchQuery: string;
  tagFilter: string;
  statusFilter: string;
  canExport: boolean;
  isOwnerAdmin: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [panel, setPanel] = useState<"none" | "form" | "excel">("none");

  const [qInput, setQInput] = useState(searchQuery);
  const [tagInput, setTagInput] = useState(tagFilter);

  const emptyForm = {
    id: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    tagsText: "",
    internalNotes: "",
  };
  const [form, setForm] = useState(emptyForm);

  // Estado de importación/exportación Excel (.xlsx)
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<"CREATE_ONLY" | "UPSERT_BY_EMAIL">("CREATE_ONLY");
  const [excelLoading, setExcelLoading] = useState(false);
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [selectedCols, setSelectedCols] = useState<string[]>(EXPORT_COLUMNS.map((c) => c.key));

  function applySearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (qInput.trim()) params.set("q", qInput.trim());
    if (tagInput.trim()) params.set("tag", tagInput.trim());
    if (statusFilter) params.set("status", statusFilter);
    router.push(`/admin/clientes?${params.toString()}`);
  }

  function editClient(c: ClientItem) {
    setForm({
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName ?? "",
      email: c.email ?? "",
      phone: c.phone ?? "",
      tagsText: c.tags.join(", "),
      internalNotes: c.internalNotes ?? "",
    });
    setPanel("form");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleSaveClient(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const res = await saveClientAction({
        ...form,
        id: form.id || undefined,
      });
      if (res.ok) {
        setFeedback({ type: "ok", text: "Ficha de cliente guardada." });
        setForm(emptyForm);
        setPanel("none");
        router.refresh();
      } else {
        setFeedback({ type: "err", text: res.error ?? "No se pudo guardar." });
      }
    });
  }

  async function runExcelImport(dryRun: boolean) {
    if (!excelFile) {
      setFeedback({ type: "err", text: "Selecciona primero un archivo .xlsx." });
      return;
    }
    setExcelLoading(true);
    setFeedback(null);
    try {
      const fd = new FormData();
      fd.append("file", excelFile);
      fd.append("mode", importMode);
      fd.append("dryRun", dryRun ? "true" : "false");

      const res = await fetch("/api/v1/admin/clients/import", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: "err", text: data.error ?? "Error procesando archivo Excel." });
      } else {
        setPreview(data);
        if (!dryRun) {
          setFeedback({
            type: "ok",
            text: `Importación completada: ${data.summary.createdCount} creados, ${data.summary.updatedCount} actualizados, ${data.summary.skippedCount} omitidos, ${data.summary.errorCount} errores. Ningún contacto importado ha sido suscrito automáticamente a marketing.`,
          });
          router.refresh();
        }
      }
    } catch {
      setFeedback({ type: "err", text: "Error de red al subir el archivo .xlsx." });
    } finally {
      setExcelLoading(false);
    }
  }

  const exportUrl = (() => {
    const p = new URLSearchParams();
    if (searchQuery) p.set("q", searchQuery);
    if (tagFilter) p.set("tag", tagFilter);
    if (selectedCols.length > 0) p.set("cols", selectedCols.join(","));
    return `/api/v1/admin/clients/export?${p.toString()}`;
  })();

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col justify-between gap-4 p-4 lg:flex-row lg:items-center">
          <form onSubmit={applySearch} className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
            <Input
              placeholder="Buscar nombre, email o teléfono..."
              className="w-full sm:w-64"
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
            />
            <Input
              placeholder="Etiqueta (ej. color)"
              className="w-full sm:w-40"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
            />
            <Button type="submit" size="sm" variant="outline">
              Filtrar
            </Button>
            {(searchQuery || tagFilter) && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setQInput("");
                  setTagInput("");
                  router.push("/admin/clientes");
                }}
              >
                Limpiar
              </Button>
            )}
          </form>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setPanel(panel === "excel" ? "none" : "excel")}
            >
              Importar / Exportar Excel (.xlsx)
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setForm(emptyForm);
                setPanel(panel === "form" ? "none" : "form");
              }}
            >
              + Nuevo cliente
            </Button>
          </div>
        </CardContent>
      </Card>

      {feedback && (
        <div
          role="status"
          className={`rounded-lg border px-4 py-3 text-sm ${
            feedback.type === "ok"
              ? "border-success/40 bg-success/10 text-foreground"
              : "border-destructive/40 bg-destructive/10 text-destructive"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Panel Excel (.xlsx) */}
      {panel === "excel" && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Importar clientes desde Excel (.xlsx)</CardTitle>
              <p className="text-xs text-muted-foreground">
                Validación previa obligatoria (Dry-Run). Conforme a RGPD/LSSI, importar un Excel jamás marca consentimiento de marketing ni reactiva contactos dados de baja.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <a
                  href="/api/v1/admin/clients/template"
                  className="text-xs font-medium underline"
                >
                  Descargar plantilla oficial Excel (.xlsx)
                </a>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="xlsx-file" className="text-xs">
                  Archivo .xlsx (máx. 5 MB / 2.500 filas)
                </Label>
                <Input
                  id="xlsx-file"
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={(e) => {
                    setExcelFile(e.target.files?.[0] ?? null);
                    setPreview(null);
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Comportamiento ante emails ya existentes</Label>
                <select
                  className="flex min-h-[44px] w-full rounded-lg border border-input bg-card px-3 text-base sm:h-10 sm:min-h-0 sm:text-xs"
                  value={importMode}
                  onChange={(e) =>
                    setImportMode(e.target.value as "CREATE_ONLY" | "UPSERT_BY_EMAIL")
                  }
                >
                  <option value="CREATE_ONLY">Solo crear nuevos (omitir duplicados)</option>
                  <option value="UPSERT_BY_EMAIL">Actualizar datos básicos si coincide email</option>
                </select>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!excelFile || excelLoading}
                  onClick={() => runExcelImport(true)}
                >
                  {excelLoading ? "Analizando..." : "1. Previsualizar (Dry-Run)"}
                </Button>
                {preview && (
                  <Button
                    type="button"
                    size="sm"
                    disabled={excelLoading}
                    onClick={() => runExcelImport(false)}
                  >
                    2. Confirmar importación definitiva
                  </Button>
                )}
              </div>

              {preview && (
                <div className="space-y-2 rounded-lg border border-border bg-background/70 p-3 text-xs">
                  <p className="font-medium">
                    {preview.dryRun ? "Simulación previa (aún sin guardar):" : "Resultado aplicado:"}{" "}
                    {preview.summary.totalRows} filas · {preview.summary.createdCount} nuevos ·{" "}
                    {preview.summary.updatedCount} actualizados · {preview.summary.skippedCount}{" "}
                    omitidos · {preview.summary.errorCount} errores
                  </p>
                  <div className="max-h-44 overflow-y-auto divide-y divide-border">
                    {preview.rowResults.slice(0, 40).map((r) => (
                      <div key={r.rowNumber} className="py-1">
                        <span className="font-mono">Fila {r.rowNumber}</span> [{r.action}]:{" "}
                        {r.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Exportar CRM a Excel (.xlsx)</CardTitle>
              <p className="text-xs text-muted-foreground">
                Genera un libro `.xlsx` con formato texto seguro (neutralizando fórmulas `=`, `+`, `-`, `@` y preservando prefijos `+34`).
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {!canExport ? (
                <p className="text-sm text-muted-foreground">
                  Tu cuenta no tiene habilitado el permiso de exportación de datos personales. Solicítalo a Dirección si lo necesitas.
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-2 text-xs min-[420px]:grid-cols-2">
                    {EXPORT_COLUMNS.map((col) => (
                      <label key={col.key} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedCols.includes(col.key)}
                          onChange={() =>
                            setSelectedCols((prev) =>
                              prev.includes(col.key)
                                ? prev.filter((k) => k !== col.key)
                                : [...prev, col.key]
                            )
                          }
                        />
                        <span>{col.label}</span>
                      </label>
                    ))}
                  </div>
                  <a
                    href={exportUrl}
                    className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-xs font-medium text-primary-foreground hover:opacity-90"
                  >
                    Descargar Excel (.xlsx) ({totalCount} registros en filtro actual)
                  </a>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Formulario crear/editar cliente */}
      {panel === "form" && (
        <Card>
          <CardHeader>
            <CardTitle>{form.id ? "Editar ficha de cliente" : "Registrar cliente"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveClient} className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-xs">Nombre *</Label>
                <Input
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Apellidos</Label>
                <Input
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Teléfono</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label className="text-xs">Etiquetas (separadas por comas)</Label>
                <Input
                  placeholder="color, hidratación, novia"
                  value={form.tagsText}
                  onChange={(e) => setForm({ ...form, tagsText: e.target.value })}
                />
              </div>
              <div className="space-y-1 md:col-span-3">
                <Label className="text-xs">Notas técnicas / internas (solo visibles por el salón)</Label>
                <Textarea
                  rows={2}
                  value={form.internalNotes}
                  onChange={(e) => setForm({ ...form, internalNotes: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 md:col-span-3">
                <Button type="button" variant="outline" onClick={() => setPanel("none")}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  Guardar ficha
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Listado de clientes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Clientes registrados ({totalCount})</CardTitle>
          <span className="text-xs text-muted-foreground">
            Página {page} de {Math.max(1, totalPages)}
          </span>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No hay clientes registrados con este criterio. Puedes crearlos manualmente, recibirlos al confirmar reservas o importarlos desde Excel (.xlsx).
            </p>
          ) : (
            <div className="divide-y divide-border">
              {clients.map((c) => (
                <div key={c.id} className="space-y-2 py-4">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">
                          {c.firstName} {c.lastName ?? ""}
                        </span>
                        <Badge variant={c.marketingConsent ? "success" : "secondary"}>
                          {c.marketingConsent ? "Marketing opt-in" : "Solo transaccional"}
                        </Badge>
                        {c.status === "ARCHIVED" && <Badge variant="outline">Archivado</Badge>}
                        {c.tags.map((t) => (
                          <Badge key={t} variant="outline">
                            {t}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {c.email ?? "Sin email"} · {c.phone ?? "Sin teléfono"} ·{" "}
                        {c.appointmentsCount} cita(s)
                      </p>
                      {c.internalNotes && (
                        <p className="text-xs text-muted-foreground">Nota: {c.internalNotes}</p>
                      )}
                      {c.recentAppointments.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Últimas citas:{" "}
                          {c.recentAppointments
                            .map((a) => `${a.dateStrMadrid} (${a.serviceName})`)
                            .join(" · ")}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      <Button size="sm" variant="outline" onClick={() => editClient(c)}>
                        Editar
                      </Button>
                      {c.marketingConsent && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isPending}
                          onClick={() =>
                            startTransition(async () => {
                              await revokeClientMarketingConsentAction(c.id);
                              setFeedback({
                                type: "ok",
                                text: "Consentimiento comercial revocado y añadido a supresión.",
                              });
                              router.refresh();
                            })
                          }
                        >
                          Baja marketing
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isPending}
                        onClick={() =>
                          startTransition(async () => {
                            await archiveOrRestoreClientAction(c.id, c.status !== "ARCHIVED");
                            router.refresh();
                          })
                        }
                      >
                        {c.status === "ARCHIVED" ? "Restaurar" : "Archivar"}
                      </Button>
                      {isOwnerAdmin && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isPending}
                          onClick={() => {
                            if (
                              window.confirm(
                                "¿Anonimizar irreversiblemente los datos personales de este cliente conforme a RGPD? Se conservarán las métricas de citas sin datos identificativos."
                              )
                            ) {
                              startTransition(async () => {
                                const res = await anonymizeClientRgpdAction(c.id);
                                if (res.ok) {
                                  setFeedback({
                                    type: "ok",
                                    text: "Datos personales anonimizados conforme a RGPD.",
                                  });
                                  router.refresh();
                                }
                              });
                            }
                          }}
                        >
                          Anonimizar RGPD
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => {
                  const p = new URLSearchParams();
                  if (searchQuery) p.set("q", searchQuery);
                  if (tagFilter) p.set("tag", tagFilter);
                  p.set("page", String(page - 1));
                  router.push(`/admin/clientes?${p.toString()}`);
                }}
              >
                Anterior
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => {
                  const p = new URLSearchParams();
                  if (searchQuery) p.set("q", searchQuery);
                  if (tagFilter) p.set("tag", tagFilter);
                  p.set("page", String(page + 1));
                  router.push(`/admin/clientes?${p.toString()}`);
                }}
              >
                Siguiente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
