"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createScheduleExceptionAction,
  deleteScheduleExceptionAction,
  resetProfessionalScheduleInheritanceAction,
  resolveScheduleConflictAlertAction,
  saveWeeklyScheduleAction,
  triggerGoogleScheduleSyncAction,
} from "@/app/admin/horarios/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type IntervalItem = { start: string; end: string };

type DayRow = {
  dayOfWeek: number;
  isOpen: boolean;
  intervals: IntervalItem[];
};

type ExceptionItem = {
  id: string;
  targetType: string;
  professionalName: string | null;
  dateStr: string;
  isClosed: boolean;
  intervals: IntervalItem[];
  reason: string | null;
  source: string;
};

type ConflictItem = {
  id: string;
  referenceCode: string;
  customerName: string;
  dateStrMadrid: string;
  startTimeMadrid: string;
  reason: string;
  source: string;
};

const DAY_LABELS: Array<{ dayOfWeek: number; name: string }> = [
  { dayOfWeek: 1, name: "Lunes" },
  { dayOfWeek: 2, name: "Martes" },
  { dayOfWeek: 3, name: "Miércoles" },
  { dayOfWeek: 4, name: "Jueves" },
  { dayOfWeek: 5, name: "Viernes" },
  { dayOfWeek: 6, name: "Sábado" },
  { dayOfWeek: 0, name: "Domingo" },
];

export function SchedulesManager({
  salonDays,
  proSchedulesByProId,
  professionals,
  scheduleConfirmed,
  activeScheduleSource,
  exceptions,
  conflicts,
  googleStatus,
  syncEvents,
}: {
  salonDays: DayRow[];
  proSchedulesByProId: Record<string, { hasCustom: boolean; days: DayRow[] }>;
  professionals: Array<{ id: string; name: string }>;
  scheduleConfirmed: boolean;
  activeScheduleSource: string;
  exceptions: ExceptionItem[];
  conflicts: ConflictItem[];
  googleStatus: {
    hasBusinessOAuth: boolean;
    hasPlacesApi: boolean;
    connectionStatus: string;
    externalLocationTitle: string | null;
    lastSyncAt: string | null;
    isOwnerAdmin: boolean;
  };
  syncEvents: Array<{ id: string; provider: string; status: string; summary: string; createdAt: string }>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [selectedScope, setSelectedScope] = useState<"SALON" | string>("SALON");
  const [confirmedFlag, setConfirmedFlag] = useState(scheduleConfirmed);
  const [daysState, setDaysState] = useState<DayRow[]>(salonDays);

  const [exForm, setExForm] = useState({
    targetType: "SALON" as "SALON" | "PROFESSIONAL",
    professionalId: "",
    dateStr: "",
    isClosed: true,
    start: "10:00",
    end: "15:00",
    reason: "",
  });

  function switchScope(next: "SALON" | string) {
    setSelectedScope(next);
    if (next === "SALON") {
      setDaysState(salonDays);
    } else {
      const entry = proSchedulesByProId[next];
      setDaysState(entry?.days ?? salonDays);
    }
  }

  function updateDay(dayOfWeek: number, updater: (prev: DayRow) => DayRow) {
    setDaysState((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? updater(d) : d))
    );
  }

  function handleSaveWeekly(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const res = await saveWeeklyScheduleAction({
        targetType: selectedScope === "SALON" ? "SALON" : "PROFESSIONAL",
        professionalId: selectedScope === "SALON" ? "" : selectedScope,
        scheduleConfirmed: selectedScope === "SALON" ? confirmedFlag : undefined,
        days: daysState,
      });
      if (res.ok) {
        const msg =
          (res.conflictsDetected ?? 0) > 0
            ? `Horario guardado. Atención: se detectaron ${res.conflictsDetected} cita(s) futura(s) fuera del nuevo horario (revisa el bloque de alertas).`
            : "Horario semanal guardado correctamente.";
        setFeedback({ type: "ok", text: msg });
        router.refresh();
      } else {
        setFeedback({ type: "err", text: res.error ?? "No se pudo guardar el horario." });
      }
    });
  }

  function handleAddException(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const res = await createScheduleExceptionAction({
        targetType: exForm.targetType,
        professionalId: exForm.targetType === "PROFESSIONAL" ? exForm.professionalId : "",
        dateStr: exForm.dateStr,
        isClosed: exForm.isClosed,
        intervals: exForm.isClosed ? [] : [{ start: exForm.start, end: exForm.end }],
        reason: exForm.reason,
      });
      if (res.ok) {
        setFeedback({
          type: "ok",
          text:
            (res.conflictsDetected ?? 0) > 0
              ? `Excepción guardada (${res.conflictsDetected} conflicto(s) con citas futuras registrado(s) en alertas).`
              : "Festivo o excepción horaria registrada.",
        });
        setExForm({ ...exForm, dateStr: "", reason: "" });
        router.refresh();
      } else {
        setFeedback({ type: "err", text: res.error ?? "Error al guardar excepción." });
      }
    });
  }

  return (
    <div className="space-y-8">
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

      {conflicts.length > 0 && (
        <Card className="border-warning">
          <CardHeader>
            <CardTitle>Alertas de citas fuera del nuevo horario ({conflicts.length})</CardTitle>
            <p className="text-sm text-muted-foreground">
              Por seguridad operativa, ningún cambio de horario o sincronización cancela citas automáticamente. Revisa estas citas en Agenda y márcalas como resueltas tras contactar al cliente.
            </p>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            {conflicts.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-medium">
                    {c.referenceCode} · {c.customerName} ({c.dateStrMadrid} {c.startTimeMadrid})
                  </p>
                  <p className="text-xs text-muted-foreground">{c.reason}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      await resolveScheduleConflictAlertAction(c.id);
                      router.refresh();
                    })
                  }
                >
                  Marcar resuelto
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Editor semanal (Salón y turnos por profesional con soporte de horario partido) */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Horario semanal regular (Europe/Madrid)</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Admite jornada continua o turno partido. El turno de un profesional siempre se interseca con el horario del salón (nunca lo amplía).
                </p>
              </div>
              <select
                aria-label="Seleccionar horario del salón o profesional"
                className="flex min-h-[44px] w-full rounded-lg border border-input bg-card px-3 text-base font-medium sm:h-10 sm:min-h-0 sm:w-auto sm:text-sm"
                value={selectedScope}
                onChange={(e) => switchScope(e.target.value)}
              >
                <option value="SALON">Horario general del salón</option>
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    Turno: {p.name} {proSchedulesByProId[p.id]?.hasCustom ? "(Personalizado)" : "(Hereda salón)"}
                  </option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveWeekly} className="space-y-4">
              <div className="divide-y divide-border">
                {DAY_LABELS.map(({ dayOfWeek, name }) => {
                  const row = daysState.find((d) => d.dayOfWeek === dayOfWeek) ?? {
                    dayOfWeek,
                    isOpen: false,
                    intervals: [],
                  };

                  return (
                    <div key={dayOfWeek} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <label className="flex min-w-[140px] items-center gap-2.5 text-sm font-medium">
                        <input
                          type="checkbox"
                          checked={row.isOpen}
                          onChange={(e) =>
                            updateDay(dayOfWeek, (prev) => ({
                              ...prev,
                              isOpen: e.target.checked,
                              intervals:
                                e.target.checked && prev.intervals.length === 0
                                  ? [{ start: "10:00", end: "20:00" }]
                                  : prev.intervals,
                            }))
                          }
                        />
                        <span>{name}</span>
                      </label>

                      {!row.isOpen ? (
                        <span className="text-xs text-muted-foreground">Cerrado / Descanso</span>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          {row.intervals.map((intv, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 rounded-lg border border-border bg-background/60 px-2 py-1">
                              <input
                                type="time"
                                aria-label={`${name} inicio tramo ${idx + 1}`}
                                value={intv.start}
                                onChange={(e) =>
                                  updateDay(dayOfWeek, (prev) => ({
                                    ...prev,
                                    intervals: prev.intervals.map((it, i) =>
                                      i === idx ? { ...it, start: e.target.value } : it
                                    ),
                                  }))
                                }
                                className="bg-transparent text-base sm:text-xs"
                              />
                              <span className="text-xs text-muted-foreground">–</span>
                              <input
                                type="time"
                                aria-label={`${name} fin tramo ${idx + 1}`}
                                value={intv.end}
                                onChange={(e) =>
                                  updateDay(dayOfWeek, (prev) => ({
                                    ...prev,
                                    intervals: prev.intervals.map((it, i) =>
                                      i === idx ? { ...it, end: e.target.value } : it
                                    ),
                                  }))
                                }
                                className="bg-transparent text-base sm:text-xs"
                              />
                              {row.intervals.length > 1 && (
                                <button
                                  type="button"
                                  title="Quitar tramo"
                                  className="px-1 text-xs text-muted-foreground hover:text-destructive"
                                  onClick={() =>
                                    updateDay(dayOfWeek, (prev) => ({
                                      ...prev,
                                      intervals: prev.intervals.filter((_, i) => i !== idx),
                                    }))
                                  }
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          ))}
                          {row.intervals.length < 2 && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs"
                              onClick={() =>
                                updateDay(dayOfWeek, (prev) => ({
                                  ...prev,
                                  intervals: [
                                    { start: "10:00", end: "14:00" },
                                    { start: "16:00", end: "20:00" },
                                  ],
                                }))
                              }
                            >
                              + Turno partido
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-4">
                {selectedScope === "SALON" ? (
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={confirmedFlag}
                      onChange={(e) => setConfirmedFlag(e.target.checked)}
                    />
                    <span>
                      <strong>Horario del salón confirmado</strong> (si se desmarca, /reservar pasa a «Reservas online próximamente»)
                    </span>
                  </label>
                ) : (
                  <div>
                    {proSchedulesByProId[selectedScope]?.hasCustom && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() =>
                          startTransition(async () => {
                            await resetProfessionalScheduleInheritanceAction(selectedScope);
                            setFeedback({
                              type: "ok",
                              text: "Turno personalizado eliminado; ahora hereda el horario general del salón.",
                            });
                            router.refresh();
                          })
                        }
                      >
                        Restaurar herencia del salón
                      </Button>
                    )}
                  </div>
                )}

                <Button type="submit" disabled={isPending}>
                  Guardar horario semanal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Sincronización Google Business Profile / Places */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Fuente de horarios y Google</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Fuente activa</span>
                <Badge variant="outline">{activeScheduleSource}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Google Business OAuth</span>
                <Badge variant={googleStatus.hasBusinessOAuth ? "success" : "warning"}>
                  {googleStatus.hasBusinessOAuth ? "Credenciales listas" : "Pendiente de credenciales"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Google Places API</span>
                <Badge variant={googleStatus.hasPlacesApi ? "success" : "warning"}>
                  {googleStatus.hasPlacesApi ? "Credenciales listas" : "Pendiente de credenciales"}
                </Badge>
              </div>
              {googleStatus.externalLocationTitle && (
                <p className="text-xs text-muted-foreground">
                  Ficha vinculada: <strong>{googleStatus.externalLocationTitle}</strong>
                </p>
              )}
              {googleStatus.lastSyncAt && (
                <p className="text-xs text-muted-foreground">
                  Última sincronización: {new Date(googleStatus.lastSyncAt).toLocaleString("es-ES")}
                </p>
              )}

              <div className="flex flex-col gap-2 pt-2">
                {googleStatus.hasBusinessOAuth && googleStatus.isOwnerAdmin && (
                  <a
                    href="/api/integrations/google/connect"
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-card px-4 text-xs font-medium hover:bg-accent"
                  >
                    Conectar cuenta Google Business Profile (OAuth)
                  </a>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      const res = await triggerGoogleScheduleSyncAction();
                      setFeedback({
                        type: res.ok ? "ok" : "err",
                        text: "message" in res ? res.message : res.error,
                      });
                      router.refresh();
                    })
                  }
                >
                  Sincronizar ahora con Google
                </Button>
              </div>

              {syncEvents.length > 0 && (
                <div className="space-y-1.5 border-t border-border pt-3 text-xs">
                  <p className="font-medium">Últimos eventos de sincronización</p>
                  {syncEvents.map((ev) => (
                    <div key={ev.id} className="rounded border border-border p-2">
                      <p className="font-medium">
                        {ev.provider} · {ev.status}
                      </p>
                      <p className="text-muted-foreground">{ev.summary}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Festivos, vacaciones y cierres puntuales */}
          <Card>
            <CardHeader>
              <CardTitle>Festivos, ausencias y horarios especiales</CardTitle>
              <p className="text-xs text-muted-foreground">
                Una excepción manual local tiene máxima prioridad sobre el horario semanal y sobre Google.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleAddException} className="space-y-3 text-sm">
                <div className="space-y-1">
                  <Label className="text-xs">Ámbito</Label>
                  <select
                    className="flex h-9 w-full rounded-lg border border-input bg-card px-2.5 text-xs"
                    value={exForm.targetType}
                    onChange={(e) =>
                      setExForm({
                        ...exForm,
                        targetType: e.target.value as "SALON" | "PROFESSIONAL",
                      })
                    }
                  >
                    <option value="SALON">Todo el salón</option>
                    <option value="PROFESSIONAL">Ausencia/horario de un profesional</option>
                  </select>
                </div>
                {exForm.targetType === "PROFESSIONAL" && (
                  <div className="space-y-1">
                    <Label className="text-xs">Profesional</Label>
                    <select
                      className="flex h-9 w-full rounded-lg border border-input bg-card px-2.5 text-xs"
                      value={exForm.professionalId}
                      onChange={(e) => setExForm({ ...exForm, professionalId: e.target.value })}
                      required
                    >
                      <option value="">Selecciona...</option>
                      {professionals.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="space-y-1">
                  <Label htmlFor="ex-date" className="text-xs">
                    Fecha (Madrid)
                  </Label>
                  <Input
                    id="ex-date"
                    type="date"
                    value={exForm.dateStr}
                    onChange={(e) => setExForm({ ...exForm, dateStr: e.target.value })}
                    required
                  />
                </div>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={exForm.isClosed}
                    onChange={(e) => setExForm({ ...exForm, isClosed: e.target.checked })}
                  />
                  <span>Cerrado todo el día / Ausencia completa</span>
                </label>
                {!exForm.isClosed && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Apertura</Label>
                      <Input
                        type="time"
                        value={exForm.start}
                        onChange={(e) => setExForm({ ...exForm, start: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Cierre</Label>
                      <Input
                        type="time"
                        value={exForm.end}
                        onChange={(e) => setExForm({ ...exForm, end: e.target.value })}
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-1">
                  <Label htmlFor="ex-reason" className="text-xs">
                    Motivo (opcional)
                  </Label>
                  <Input
                    id="ex-reason"
                    placeholder="Ej. Festivo San Isidro / Vacaciones"
                    value={exForm.reason}
                    onChange={(e) => setExForm({ ...exForm, reason: e.target.value })}
                  />
                </div>
                <Button type="submit" size="sm" className="w-full" disabled={isPending}>
                  Registrar excepción
                </Button>
              </form>

              <div className="divide-y divide-border border-t border-border pt-2">
                {exceptions.length === 0 ? (
                  <p className="py-2 text-xs text-muted-foreground">Sin excepciones registradas.</p>
                ) : (
                  exceptions.map((ex) => (
                    <div key={ex.id} className="flex items-center justify-between gap-2 py-2 text-xs">
                      <div>
                        <p className="font-medium">
                          {ex.dateStr} ·{" "}
                          {ex.targetType === "SALON" ? "Salón" : ex.professionalName ?? "Profesional"}
                        </p>
                        <p className="text-muted-foreground">
                          {ex.isClosed
                            ? "Cerrado"
                            : ex.intervals.map((i) => `${i.start}-${i.end}`).join(", ")}{" "}
                          {ex.reason ? `(${ex.reason})` : ""}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          startTransition(async () => {
                            await deleteScheduleExceptionAction(ex.id);
                            router.refresh();
                          })
                        }
                      >
                        Quitar
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
