"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createAdminAppointmentAction,
  createManualBlockAction,
  releaseManualBlockAction,
  rescheduleAdminAppointmentAction,
  updateAppointmentStatusAction,
} from "@/app/admin/agenda/actions";
import { formatPrice } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type AppointmentItem = {
  id: string;
  referenceCode: string;
  status: string;
  dateStrMadrid: string;
  startTimeMadrid: string;
  endTimeMadrid: string;
  serviceName: string;
  durationMin: number;
  priceType: string;
  priceCents: number | null;
  professionalId: string;
  professionalName: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  customerNotes: string | null;
  internalNotes: string | null;
};

type BlockItem = {
  id: string;
  professionalId: string;
  professionalName: string;
  dateStrMadrid: string;
  startTimeMadrid: string;
  endTimeMadrid: string;
  notes: string | null;
};

const STATUS_BADGE: Record<
  string,
  { label: string; variant: "success" | "warning" | "secondary" | "destructive" | "outline" }
> = {
  CONFIRMED: { label: "Confirmada", variant: "success" },
  PENDING_APPROVAL: { label: "Pendiente aprobar", variant: "warning" },
  COMPLETED: { label: "Completada", variant: "outline" },
  NO_SHOW: { label: "No presentado", variant: "destructive" },
  CANCELLED: { label: "Cancelada", variant: "secondary" },
};

export function AgendaManager({
  selectedDate,
  weekDates,
  viewMode,
  filterProId,
  filterStatus,
  appointments,
  manualBlocks,
  professionals,
  services,
  lockedProfessionalId,
}: {
  selectedDate: string;
  weekDates: string[];
  viewMode: "day" | "week" | "list";
  filterProId: string;
  filterStatus: string;
  appointments: AppointmentItem[];
  manualBlocks: BlockItem[];
  professionals: Array<{ id: string; name: string }>;
  services: Array<{ id: string; name: string; durationMin: number }>;
  lockedProfessionalId: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [activePanel, setActivePanel] = useState<"none" | "newAppt" | "newBlock">("none");
  const [rescheduleTarget, setRescheduleTarget] = useState<{
    id: string;
    dateStr: string;
    startTime: string;
  } | null>(null);

  const [apptForm, setApptForm] = useState({
    serviceId: services[0]?.id ?? "",
    professionalId: lockedProfessionalId ?? professionals[0]?.id ?? "",
    dateStr: selectedDate,
    startTime: "10:00",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    internalNotes: "",
  });

  const [blockForm, setBlockForm] = useState({
    professionalId: lockedProfessionalId ?? professionals[0]?.id ?? "",
    dateStr: selectedDate,
    startTime: "14:00",
    endTime: "15:00",
    notes: "",
  });

  function pushFilters(next: {
    date?: string;
    view?: string;
    pro?: string;
    status?: string;
  }) {
    const params = new URLSearchParams();
    params.set("date", next.date ?? selectedDate);
    params.set("view", next.view ?? viewMode);
    const p = next.pro ?? filterProId;
    if (p) params.set("pro", p);
    const st = next.status ?? filterStatus;
    if (st) params.set("status", st);
    router.push(`/admin/agenda?${params.toString()}`);
  }

  function handleCreateAppt(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const res = await createAdminAppointmentAction(apptForm);
      if (res.ok) {
        setFeedback({
          type: "ok",
          text: `Cita creada correctamente (${res.referenceCode}).`,
        });
        setActivePanel("none");
        setApptForm({ ...apptForm, customerName: "", customerEmail: "", customerPhone: "", internalNotes: "" });
        router.refresh();
      } else {
        setFeedback({ type: "err", text: res.error ?? "No se pudo crear la cita." });
      }
    });
  }

  function handleCreateBlock(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const res = await createManualBlockAction(blockForm);
      if (res.ok) {
        setFeedback({ type: "ok", text: "Franja horaria bloqueada en agenda." });
        setActivePanel("none");
        setBlockForm({ ...blockForm, notes: "" });
        router.refresh();
      } else {
        setFeedback({ type: "err", text: res.error ?? "No se pudo bloquear la franja." });
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Barra superior de filtros y vistas */}
      <Card>
        <CardContent className="flex flex-col justify-between gap-4 p-4 lg:flex-row lg:items-center">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="date"
              aria-label="Fecha en agenda"
              className="w-auto"
              value={selectedDate}
              onChange={(e) => pushFilters({ date: e.target.value })}
            />
            <div className="inline-flex rounded-lg border border-border bg-background p-0.5">
              {(
                [
                  { id: "day", label: "Día" },
                  { id: "week", label: "Semana" },
                  { id: "list", label: "Lista" },
                ] as const
              ).map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => pushFilters({ view: v.id })}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                    viewMode === v.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>

            {!lockedProfessionalId && (
              <select
                aria-label="Filtrar por profesional"
                className="flex min-h-[44px] w-full rounded-lg border border-input bg-card px-3 text-base sm:h-10 sm:min-h-0 sm:w-auto sm:text-xs"
                value={filterProId}
                onChange={(e) => pushFilters({ pro: e.target.value })}
              >
                <option value="">Todo el equipo</option>
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}

            <select
              aria-label="Filtrar por estado"
              className="flex min-h-[44px] w-full rounded-lg border border-input bg-card px-3 text-base sm:h-10 sm:min-h-0 sm:w-auto sm:text-xs"
              value={filterStatus}
              onChange={(e) => pushFilters({ status: e.target.value })}
            >
              <option value="">Todos los estados</option>
              <option value="CONFIRMED">Confirmadas</option>
              <option value="PENDING_APPROVAL">Pendientes de aprobar</option>
              <option value="COMPLETED">Completadas</option>
              <option value="NO_SHOW">No presentado</option>
              <option value="CANCELLED">Canceladas</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                setActivePanel(activePanel === "newBlock" ? "none" : "newBlock")
              }
            >
              Bloquear franja
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() =>
                setActivePanel(activePanel === "newAppt" ? "none" : "newAppt")
              }
            >
              + Nueva cita manual
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

      {activePanel === "newAppt" && (
        <Card>
          <CardHeader>
            <CardTitle>Registrar cita manual</CardTitle>
            <p className="text-sm text-muted-foreground">
              Utiliza el mismo motor atómico y anti-solapamiento que la reserva pública.
            </p>
          </CardHeader>
          <CardContent>
            {services.length === 0 || professionals.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Para crear citas necesitas dar de alta al menos un servicio activo, un profesional con ese servicio asignado y confirmar el horario del salón.
              </p>
            ) : (
              <form onSubmit={handleCreateAppt} className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-xs">Servicio</Label>
                  <select
                    className="flex h-10 w-full rounded-lg border border-input bg-card px-3 text-sm"
                    value={apptForm.serviceId}
                    onChange={(e) => setApptForm({ ...apptForm, serviceId: e.target.value })}
                    required
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.durationMin} min)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Profesional</Label>
                  <select
                    className="flex h-10 w-full rounded-lg border border-input bg-card px-3 text-sm"
                    value={apptForm.professionalId}
                    disabled={Boolean(lockedProfessionalId)}
                    onChange={(e) =>
                      setApptForm({ ...apptForm, professionalId: e.target.value })
                    }
                    required
                  >
                    {professionals.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Fecha</Label>
                    <Input
                      type="date"
                      value={apptForm.dateStr}
                      onChange={(e) => setApptForm({ ...apptForm, dateStr: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Hora (Madrid)</Label>
                    <Input
                      type="time"
                      value={apptForm.startTime}
                      onChange={(e) => setApptForm({ ...apptForm, startTime: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Nombre del cliente</Label>
                  <Input
                    value={apptForm.customerName}
                    onChange={(e) => setApptForm({ ...apptForm, customerName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Email (opcional, recibe confirmación)</Label>
                  <Input
                    type="email"
                    value={apptForm.customerEmail}
                    onChange={(e) => setApptForm({ ...apptForm, customerEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Teléfono (opcional)</Label>
                  <Input
                    value={apptForm.customerPhone}
                    onChange={(e) => setApptForm({ ...apptForm, customerPhone: e.target.value })}
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label className="text-xs">Notas internas de cabina</Label>
                  <Input
                    value={apptForm.internalNotes}
                    onChange={(e) => setApptForm({ ...apptForm, internalNotes: e.target.value })}
                  />
                </div>
                <div className="flex items-end justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActivePanel("none")}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    Confirmar cita
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {activePanel === "newBlock" && (
        <Card>
          <CardHeader>
            <CardTitle>Bloquear tramo horario (pausa, reunión o mantenimiento)</CardTitle>
          </CardHeader>
          <CardContent>
            {professionals.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay profesionales activos.</p>
            ) : (
              <form onSubmit={handleCreateBlock} className="grid grid-cols-1 gap-4 md:grid-cols-5">
                <div className="space-y-1">
                  <Label className="text-xs">Profesional</Label>
                  <select
                    className="flex min-h-[44px] w-full rounded-lg border border-input bg-card px-3 text-base sm:h-10 sm:min-h-0 sm:text-sm"
                    value={blockForm.professionalId}
                    disabled={Boolean(lockedProfessionalId)}
                    onChange={(e) =>
                      setBlockForm({ ...blockForm, professionalId: e.target.value })
                    }
                  >
                    {professionals.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Fecha</Label>
                  <Input
                    type="date"
                    value={blockForm.dateStr}
                    onChange={(e) => setBlockForm({ ...blockForm, dateStr: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Inicio</Label>
                  <Input
                    type="time"
                    value={blockForm.startTime}
                    onChange={(e) => setBlockForm({ ...blockForm, startTime: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Fin</Label>
                  <Input
                    type="time"
                    value={blockForm.endTime}
                    onChange={(e) => setBlockForm({ ...blockForm, endTime: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Motivo</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Pausa"
                      value={blockForm.notes}
                      onChange={(e) => setBlockForm({ ...blockForm, notes: e.target.value })}
                    />
                    <Button type="submit" disabled={isPending}>
                      Bloquear
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {/* Vista Semana (columnas por día) */}
      {viewMode === "week" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-7">
          {weekDates.map((dStr) => {
            const dayAppts = appointments.filter((a) => a.dateStrMadrid === dStr);
            const dayBlocks = manualBlocks.filter((b) => b.dateStrMadrid === dStr);
            return (
              <Card key={dStr} className={dStr === selectedDate ? "border-primary" : ""}>
                <CardHeader className="p-3 pb-2">
                  <button
                    type="button"
                    onClick={() => pushFilters({ date: dStr, view: "day" })}
                    className="text-left font-serif text-base font-medium hover:underline"
                  >
                    {dStr}
                  </button>
                  <p className="text-[11px] text-muted-foreground">
                    {dayAppts.length} cita(s)
                  </p>
                </CardHeader>
                <CardContent className="space-y-2 p-3 pt-0">
                  {dayAppts.map((a) => {
                    const st = STATUS_BADGE[a.status] ?? { label: a.status, variant: "outline" as const };
                    return (
                      <div key={a.id} className="rounded-lg border border-border bg-background/70 p-2 text-xs">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold">
                            {a.startTimeMadrid}–{a.endTimeMadrid}
                          </span>
                          <Badge variant={st.variant}>{st.label}</Badge>
                        </div>
                        <p className="mt-1 font-medium">{a.customerName}</p>
                        <p className="text-muted-foreground">{a.serviceName}</p>
                        <p className="text-[11px] text-muted-foreground">{a.professionalName}</p>
                      </div>
                    );
                  })}
                  {dayBlocks.map((b) => (
                    <div key={b.id} className="rounded-lg border border-dashed border-border p-2 text-[11px] text-muted-foreground">
                      Bloqueo {b.startTimeMadrid}–{b.endTimeMadrid} ({b.professionalName})
                    </div>
                  ))}
                  {dayAppts.length === 0 && dayBlocks.length === 0 && (
                    <p className="py-3 text-xs text-muted-foreground">Libre</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Vista Día y Vista Lista (óptimas en móvil y escritorio) */
        <div className="space-y-4">
          {manualBlocks.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Bloqueos manuales activos</CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-border">
                {manualBlocks.map((b) => (
                  <div key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                    <div>
                      <span className="font-medium">
                        {b.dateStrMadrid} · {b.startTimeMadrid}–{b.endTimeMadrid}
                      </span>{" "}
                      <span className="text-muted-foreground">
                        ({b.professionalName}) {b.notes ? `— ${b.notes}` : ""}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isPending}
                      onClick={() =>
                        startTransition(async () => {
                          await releaseManualBlockAction(b.id);
                          router.refresh();
                        })
                      }
                    >
                      Liberar
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>
                {viewMode === "day"
                  ? `Citas del día ${selectedDate} (${appointments.length})`
                  : `Próximas citas en lista (${appointments.length})`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No hay citas registradas para este filtro.
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {appointments.map((a) => {
                    const st = STATUS_BADGE[a.status] ?? {
                      label: a.status,
                      variant: "outline" as const,
                    };
                    const isRescheduling = rescheduleTarget?.id === a.id;

                    return (
                      <div key={a.id} className="space-y-3 py-4">
                        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs text-muted-foreground">
                                {a.referenceCode}
                              </span>
                              <span className="font-semibold">
                                {a.dateStrMadrid} · {a.startTimeMadrid}–{a.endTimeMadrid}
                              </span>
                              <Badge variant={st.variant}>{st.label}</Badge>
                              <Badge variant="outline">{a.professionalName}</Badge>
                            </div>
                            <p className="text-sm font-medium">
                              {a.customerName}{" "}
                              <span className="font-normal text-muted-foreground">
                                {a.customerPhone ? `· ${a.customerPhone}` : ""}{" "}
                                {a.customerEmail ? `· ${a.customerEmail}` : ""}
                              </span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {a.serviceName} ({a.durationMin} min ·{" "}
                              {formatPrice(a.priceType, a.priceCents)})
                            </p>
                            {(a.customerNotes || a.internalNotes) && (
                              <p className="text-xs text-muted-foreground">
                                {a.customerNotes ? `Nota cliente: "${a.customerNotes}" ` : ""}
                                {a.internalNotes ? `· Cabina: "${a.internalNotes}"` : ""}
                              </p>
                            )}
                          </div>

                          {a.status !== "CANCELLED" && (
                            <div className="flex flex-wrap gap-1.5">
                              {a.status === "PENDING_APPROVAL" && (
                                <Button
                                  size="sm"
                                  disabled={isPending}
                                  onClick={() =>
                                    startTransition(async () => {
                                      const res = await updateAppointmentStatusAction({
                                        appointmentId: a.id,
                                        newStatus: "CONFIRMED",
                                      });
                                      if (!res.ok)
                                        setFeedback({ type: "err", text: res.error ?? "Error" });
                                      router.refresh();
                                    })
                                  }
                                >
                                  Aprobar
                                </Button>
                              )}
                              {a.status === "CONFIRMED" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={isPending}
                                    onClick={() =>
                                      startTransition(async () => {
                                        await updateAppointmentStatusAction({
                                          appointmentId: a.id,
                                          newStatus: "COMPLETED",
                                        });
                                        router.refresh();
                                      })
                                    }
                                  >
                                    Completada
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={isPending}
                                    onClick={() =>
                                      startTransition(async () => {
                                        await updateAppointmentStatusAction({
                                          appointmentId: a.id,
                                          newStatus: "NO_SHOW",
                                        });
                                        router.refresh();
                                      })
                                    }
                                  >
                                    No presentado
                                  </Button>
                                </>
                              )}
                              {(a.status === "CONFIRMED" || a.status === "PENDING_APPROVAL") && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      setRescheduleTarget(
                                        isRescheduling
                                          ? null
                                          : {
                                              id: a.id,
                                              dateStr: a.dateStrMadrid,
                                              startTime: a.startTimeMadrid,
                                            }
                                      )
                                    }
                                  >
                                    Reprogramar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    disabled={isPending}
                                    onClick={() =>
                                      startTransition(async () => {
                                        const res = await updateAppointmentStatusAction({
                                          appointmentId: a.id,
                                          newStatus: "CANCELLED",
                                          reason: "Cancelada en recepción/agenda",
                                        });
                                        if (res.ok) {
                                          setFeedback({
                                            type: "ok",
                                            text: `Cita ${a.referenceCode} cancelada y hueco liberado.`,
                                          });
                                          router.refresh();
                                        }
                                      })
                                    }
                                  >
                                    Cancelar
                                  </Button>
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        {isRescheduling && rescheduleTarget && (
                          <div className="flex flex-wrap items-end gap-2 rounded-lg border border-border bg-background/60 p-3">
                            <div>
                              <Label className="text-xs">Nueva fecha</Label>
                              <Input
                                type="date"
                                className="h-9"
                                value={rescheduleTarget.dateStr}
                                onChange={(e) =>
                                  setRescheduleTarget({
                                    ...rescheduleTarget,
                                    dateStr: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Nueva hora</Label>
                              <Input
                                type="time"
                                className="h-9"
                                value={rescheduleTarget.startTime}
                                onChange={(e) =>
                                  setRescheduleTarget({
                                    ...rescheduleTarget,
                                    startTime: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <Button
                              size="sm"
                              disabled={isPending}
                              onClick={() =>
                                startTransition(async () => {
                                  const res = await rescheduleAdminAppointmentAction({
                                    appointmentId: rescheduleTarget.id,
                                    newDateStr: rescheduleTarget.dateStr,
                                    newStartTime: rescheduleTarget.startTime,
                                  });
                                  if (res.ok) {
                                    setFeedback({
                                      type: "ok",
                                      text: "Cita reprogramada atómicamente.",
                                    });
                                    setRescheduleTarget(null);
                                    router.refresh();
                                  } else {
                                    setFeedback({
                                      type: "err",
                                      text: res.error ?? "Franja ocupada.",
                                    });
                                  }
                                })
                              }
                            >
                              Guardar nuevo horario
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
