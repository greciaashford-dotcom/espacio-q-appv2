"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveProfessionalAction } from "@/app/admin/equipo/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type ProfessionalItem = {
  id: string;
  name: string;
  slug: string;
  roleTitle: string;
  bio: string | null;
  specialties: string[];
  photoAssetId: string | null;
  active: boolean;
  publicVisible: boolean;
  sortOrder: number;
  serviceIds: string[];
  futureAppointmentsCount: number;
};

type ServiceOption = {
  id: string;
  name: string;
  categoryName: string;
};

type MediaOption = {
  id: string;
  internalName: string;
};

export function TeamManager({
  professionals,
  services,
  mediaAssets,
}: {
  professionals: ProfessionalItem[];
  services: ServiceOption[];
  mediaAssets: MediaOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [needsReassignWarning, setNeedsReassignWarning] = useState<number | null>(null);

  const emptyForm = {
    id: "",
    name: "",
    slug: "",
    roleTitle: "",
    bio: "",
    specialtiesText: "",
    photoAssetId: "",
    active: true,
    publicVisible: true,
    sortOrder: 0,
    serviceIds: services.map((s) => s.id),
    reassignToProfessionalId: "",
    forceDeactivateWithAlerts: false,
  };

  const [form, setForm] = useState(emptyForm);

  function editPro(p: ProfessionalItem) {
    setNeedsReassignWarning(null);
    setForm({
      id: p.id,
      name: p.name,
      slug: p.slug,
      roleTitle: p.roleTitle,
      bio: p.bio ?? "",
      specialtiesText: p.specialties.join(", "),
      photoAssetId: p.photoAssetId ?? "",
      active: p.active,
      publicVisible: p.publicVisible,
      sortOrder: p.sortOrder,
      serviceIds: p.serviceIds,
      reassignToProfessionalId: "",
      forceDeactivateWithAlerts: false,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleService(serviceId: string) {
    setForm((prev) => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(serviceId)
        ? prev.serviceIds.filter((id) => id !== serviceId)
        : [...prev.serviceIds, serviceId],
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const res = await saveProfessionalAction({
        ...form,
        id: form.id || undefined,
        slug: form.slug || undefined,
      });
      if (res.ok) {
        const extra =
          (res.reassignedCount ?? 0) > 0 || (res.alertedCount ?? 0) > 0
            ? ` (${res.reassignedCount} citas reasignadas, ${res.alertedCount} marcadas para revisión manual).`
            : ".";
        setFeedback({ type: "ok", text: `Perfil profesional guardado${extra}` });
        setNeedsReassignWarning(null);
        setForm(emptyForm);
        router.refresh();
      } else {
        if ((res as any).requiresReassignment) {
          setNeedsReassignWarning((res as any).futureAppointmentsCount ?? 1);
        }
        setFeedback({ type: "err", text: res.error ?? "No se pudo guardar el perfil." });
      }
    });
  }

  const otherActivePros = professionals.filter((p) => p.active && p.id !== form.id);

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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{form.id ? "Editar miembro del equipo" : "Añadir profesional"}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Configura su ficha pública y marca qué servicios del catálogo está habilitado/a para realizar.
            </p>
          </div>
          {form.id && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setNeedsReassignWarning(null);
                setForm(emptyForm);
              }}
            >
              Cancelar edición
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="pro-name">Nombre y apellidos</Label>
                <Input
                  id="pro-name"
                  placeholder="Nombre real del profesional"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pro-role">Puesto / Especialidad principal</Label>
                <Input
                  id="pro-role"
                  placeholder="Ej. Estilista Senior / Colorista"
                  value={form.roleTitle}
                  onChange={(e) => setForm({ ...form, roleTitle: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pro-photo">Fotografía (Multimedia)</Label>
                <select
                  id="pro-photo"
                  className="flex h-10 w-full rounded-lg border border-input bg-card px-3 text-sm"
                  value={form.photoAssetId}
                  onChange={(e) => setForm({ ...form, photoAssetId: e.target.value })}
                >
                  <option value="">— Sin fotografía —</option>
                  {mediaAssets.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.internalName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="pro-spec">Etiquetas de especialidad (separadas por comas)</Label>
                <Input
                  id="pro-spec"
                  placeholder="Color orgánico, Corte en seco, Tratamientos"
                  value={form.specialtiesText}
                  onChange={(e) => setForm({ ...form, specialtiesText: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pro-order">Orden de aparición</Label>
                <Input
                  id="pro-order"
                  type="number"
                  min={0}
                  max={999}
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pro-bio">Presentación editorial (opcional)</Label>
              <Textarea
                id="pro-bio"
                rows={3}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Servicios habilitados ({form.serviceIds.length}/{services.length})</Label>
                {services.length > 0 && (
                  <button
                    type="button"
                    className="text-xs underline"
                    onClick={() =>
                      setForm({
                        ...form,
                        serviceIds:
                          form.serviceIds.length === services.length
                            ? []
                            : services.map((s) => s.id),
                      })
                    }
                  >
                    {form.serviceIds.length === services.length
                      ? "Desmarcar todos"
                      : "Marcar todos"}
                  </button>
                )}
              </div>
              {services.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Todavía no hay servicios en el catálogo. Podrás asignarlos en cuanto crees servicios en «Servicios».
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-2 rounded-xl border border-border bg-background/50 p-3 sm:grid-cols-2 lg:grid-cols-3">
                  {services.map((srv) => (
                    <label key={srv.id} className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={form.serviceIds.includes(srv.id)}
                        onChange={() => toggleService(srv.id)}
                      />
                      <span>
                        <strong>{srv.name}</strong>{" "}
                        <span className="text-muted-foreground">({srv.categoryName})</span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {needsReassignWarning !== null && !form.active && (
              <div className="space-y-3 rounded-xl border border-warning bg-warning/10 p-4 text-sm">
                <p className="font-medium">
                  Protección de citas futuras ({needsReassignWarning} cita(s) activa(s)):
                </p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <Label className="text-xs">Reasignar citas futuras compatibles a:</Label>
                    <select
                      className="mt-1 flex h-9 w-full rounded-lg border border-input bg-card px-2.5 text-xs"
                      value={form.reassignToProfessionalId}
                      onChange={(e) =>
                        setForm({ ...form, reassignToProfessionalId: e.target.value })
                      }
                    >
                      <option value="">— No reasignar automáticamente —</option>
                      {otherActivePros.map((op) => (
                        <option key={op.id} value={op.id}>
                          {op.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={form.forceDeactivateWithAlerts}
                        onChange={(e) =>
                          setForm({ ...form, forceDeactivateWithAlerts: e.target.checked })
                        }
                      />
                      <span>
                        Confirmar baja generando alertas de conflicto para revisión manual en Horarios/Agenda
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-3 text-sm">
              <div className="flex flex-wrap items-center gap-5">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  />
                  <span>Activo en agenda y motor de disponibilidad</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.publicVisible}
                    onChange={(e) => setForm({ ...form, publicVisible: e.target.checked })}
                  />
                  <span>Visible en la página pública /equipo</span>
                </label>
              </div>
              <Button type="submit" disabled={isPending}>
                {form.id ? "Guardar cambios" : "Crear profesional"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Equipo registrado ({professionals.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {professionals.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Todavía no se han registrado profesionales. No inventamos nombres ficticios: añade al equipo real para habilitar la selección en reservas.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {professionals.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{p.name}</span>
                      <span className="text-xs text-muted-foreground">· {p.roleTitle}</span>
                      <Badge variant={p.active ? "success" : "secondary"}>
                        {p.active ? "Activo" : "Inactivo"}
                      </Badge>
                      {!p.publicVisible && <Badge variant="outline">Oculto en web</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {p.serviceIds.length} servicio(s) asignado(s) · {p.futureAppointmentsCount} cita(s) futura(s)
                    </p>
                  </div>
                  <Button type="button" size="sm" variant="outline" onClick={() => editPro(p)}>
                    Editar / Servicios
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
