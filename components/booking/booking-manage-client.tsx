"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  CheckCircle2,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

export function BookingManageClient({
  token,
  appointment,
  todayStr,
  maxDateStr,
  cancellationFreeHours,
}: {
  token: string;
  appointment: {
    id: string;
    referenceCode: string;
    status: string;
    attendanceConfirmed: boolean;
    serviceId: string;
    serviceName: string;
    durationMin: number;
    priceType: string;
    priceCents: number | null;
    currency: string;
    professionalId: string;
    professionalName: string;
    dateStrMadrid: string;
    startTimeMadrid: string;
    endTimeMadrid: string;
  };
  todayStr: string;
  maxDateStr: string;
  cancellationFreeHours: number;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"view" | "reschedule" | "cancel">("view");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{
    type: "ok" | "error";
    text: string;
  } | null>(null);

  const [newDateStr, setNewDateStr] = useState(appointment.dateStrMadrid);
  const [slots, setSlots] = useState<Array<{ time: string; endTime: string }>>(
    []
  );
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [newTime, setNewTime] = useState("");
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    if (mode !== "reschedule") return;
    setLoadingSlots(true);
    const qs = new URLSearchParams({
      serviceId: appointment.serviceId,
      date: newDateStr,
      professionalId: appointment.professionalId,
    });
    fetch(`/api/v1/bookings/availability?${qs.toString()}`, {
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((d) => {
        setSlots(d.slots || []);
        setNewTime("");
      })
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [mode, newDateStr, appointment.serviceId, appointment.professionalId]);

  const runAction = async (payload: Record<string, any>) => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/v1/bookings/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ...payload }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({
          type: "error",
          text: data.error || "No se pudo completar la acción.",
        });
        return;
      }
      setMessage({
        type: "ok",
        text:
          payload.action === "cancel"
            ? "Tu cita ha sido cancelada correctamente."
            : payload.action === "reschedule"
              ? "Tu cita ha sido reprogramada con éxito."
              : "Gracias por confirmar tu asistencia.",
      });
      setMode("view");
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "Error de conexión." });
    } finally {
      setBusy(false);
    }
  };

  const canModify =
    appointment.status === "CONFIRMED" ||
    appointment.status === "PENDING_APPROVAL";

  const statusLabel: Record<string, string> = {
    CONFIRMED: "Confirmada",
    PENDING_APPROVAL: "Pendiente de confirmación",
    CANCELLED: "Cancelada",
    COMPLETED: "Completada",
    NO_SHOW: "No asistió",
  };

  return (
    <div className="space-y-6 rounded-editorial border border-border bg-card p-4 shadow-editorial sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Referencia {appointment.referenceCode}
          </p>
          <h1 className="mt-1 font-serif text-2xl sm:text-3xl">Gestión de tu cita</h1>
        </div>
        <Badge
          variant={
            appointment.status === "CONFIRMED"
              ? "success"
              : appointment.status === "CANCELLED"
                ? "destructive"
                : "warning"
          }
        >
          {statusLabel[appointment.status] || appointment.status}
        </Badge>
      </div>

      <dl className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-background/70 p-5 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wider text-muted-foreground">
            Servicio
          </dt>
          <dd className="mt-0.5 font-medium">
            {appointment.serviceName} ({appointment.durationMin} min)
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-muted-foreground">
            Profesional
          </dt>
          <dd className="mt-0.5 font-medium">{appointment.professionalName}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-muted-foreground">
            Fecha y hora (Madrid)
          </dt>
          <dd className="mt-0.5 font-medium">
            {appointment.dateStrMadrid} · {appointment.startTimeMadrid} –{" "}
            {appointment.endTimeMadrid}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-muted-foreground">
            Importe
          </dt>
          <dd className="mt-0.5 font-medium">
            {formatPrice(
              appointment.priceType,
              appointment.priceCents,
              appointment.currency
            )}
          </dd>
        </div>
      </dl>

      {message && (
        <p
          role="status"
          className={
            message.type === "ok"
              ? "rounded-lg border border-border bg-accent p-3 text-sm text-success"
              : "rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
          }
        >
          {message.text}
        </p>
      )}

      {canModify && mode === "view" && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Las modificaciones y cancelaciones online requieren al menos{" "}
            <strong>{cancellationFreeHours} horas</strong> de antelación. Ninguna
            acción se ejecuta automáticamente al abrir este enlace.
          </p>
          <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-3">
            {appointment.status === "CONFIRMED" &&
              !appointment.attendanceConfirmed && (
                <Button
                  type="button"
                  className="w-full sm:w-auto"
                  disabled={busy}
                  onClick={() => runAction({ action: "confirm_attendance" })}
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Confirmar mi asistencia
                </Button>
              )}
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setMode("reschedule")}
            >
              <RefreshCw className="h-4 w-4" /> Reprogramar fecha u hora
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setMode("cancel")}
            >
              <XCircle className="h-4 w-4" /> Cancelar cita
            </Button>
          </div>
        </div>
      )}

      {mode === "reschedule" && (
        <div className="space-y-4 rounded-xl border border-border bg-background/60 p-5">
          <h2 className="font-serif text-xl">Elegir nueva fecha y hora</h2>
          <div className="max-w-xs space-y-1.5">
            <Label htmlFor="resched-date">Nueva fecha</Label>
            <Input
              id="resched-date"
              type="date"
              min={todayStr}
              max={maxDateStr}
              value={newDateStr}
              onChange={(e) => setNewDateStr(e.target.value)}
            />
          </div>
          {loadingSlots ? (
            <p className="text-xs text-muted-foreground">
              Consultando franjas libres…
            </p>
          ) : slots.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No hay franjas disponibles para esta fecha. Tu cita original sigue
              intacta.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map((s) => (
                <button
                  key={s.time}
                  type="button"
                  onClick={() => setNewTime(s.time)}
                  className={`min-h-[40px] rounded-lg border px-3 py-1.5 text-xs font-medium ${
                    newTime === s.time
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card"
                  }`}
                >
                  {s.time}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              disabled={!newTime || busy}
              onClick={() =>
                runAction({
                  action: "reschedule",
                  newDateStr,
                  newStartTime: newTime,
                })
              }
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Calendar className="h-4 w-4" />
              )}
              Confirmar nuevo horario
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setMode("view")}
            >
              Volver
            </Button>
          </div>
        </div>
      )}

      {mode === "cancel" && (
        <div className="space-y-4 rounded-xl border border-border bg-background/60 p-5">
          <h2 className="font-serif text-xl">Confirmar cancelación de cita</h2>
          <div className="space-y-1.5">
            <Label htmlFor="cancel-reason">Motivo (opcional)</Label>
            <Textarea
              id="cancel-reason"
              rows={2}
              maxLength={250}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="destructive"
              disabled={busy}
              onClick={() =>
                runAction({ action: "cancel", reason: cancelReason })
              }
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Sí, cancelar mi cita
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setMode("view")}
            >
              Mantener mi cita
            </Button>
          </div>
        </div>
      )}

      <div className="border-t border-border pt-4 text-xs text-muted-foreground">
        <Link href="/reservar" className="underline">
          Reservar otra cita
        </Link>{" "}
        ·{" "}
        <Link href="/" className="underline">
          Volver a ESPACIO Q
        </Link>
      </div>
    </div>
  );
}
