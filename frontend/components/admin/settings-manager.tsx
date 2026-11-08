"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createStaffUserAction,
  updateSalonSettingsAction,
  updateStaffUserAction,
} from "@/app/admin/configuracion/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type SettingsRecord = {
  brandName: string;
  tagline: string;
  city: string;
  country: string;
  googleMapsUrl: string;
  addressLine: string | null;
  postalCode: string | null;
  neighborhood: string | null;
  phone: string | null;
  whatsapp: string | null;
  contactEmail: string | null;
  noticeEmail: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  legalOwnerName: string | null;
  legalTaxId: string | null;
  legalRegistryInfo: string | null;
  legalRegisteredAddress: string | null;
  legalDpoEmail: string | null;
  publicBookingEnabled: boolean;
  bookingApprovalMode: string;
  slotIntervalMin: number;
  minAdvanceNoticeMin: number;
  maxBookingHorizonDays: number;
  cancellationFreeHours: number;
  rescheduleFreeHours: number;
  contactRetentionDays: number;
  exportRetentionHours: number;
  analyticsCookiesEnabled: boolean;
  marketingCookiesEnabled: boolean;
  externalMapEmbedEnabled: boolean;
};

type StaffUserItem = {
  id: string;
  name: string;
  email: string;
  role: "OWNER_ADMIN" | "RECEPTION" | "PROFESSIONAL";
  professionalId: string | null;
  active: boolean;
  canExportData: boolean;
  canManageMarketing: boolean;
  lastLoginAt: string | null;
};

type ProfessionalOption = {
  id: string;
  name: string;
};

export function SettingsManager({
  initialSettings,
  users,
  professionals,
  envStatus,
}: {
  initialSettings: SettingsRecord;
  users: StaffUserItem[];
  professionals: ProfessionalOption[];
  envStatus: Array<{ key: string; label: string; configured: boolean }>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState<"general" | "legal" | "booking" | "users" | "system">("general");
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [form, setForm] = useState({
    brandName: initialSettings.brandName,
    tagline: initialSettings.tagline,
    city: initialSettings.city,
    country: initialSettings.country,
    googleMapsUrl: initialSettings.googleMapsUrl,
    addressLine: initialSettings.addressLine ?? "",
    postalCode: initialSettings.postalCode ?? "",
    neighborhood: initialSettings.neighborhood ?? "",
    phone: initialSettings.phone ?? "",
    whatsapp: initialSettings.whatsapp ?? "",
    contactEmail: initialSettings.contactEmail ?? "",
    noticeEmail: initialSettings.noticeEmail ?? "",
    instagramUrl: initialSettings.instagramUrl ?? "",
    facebookUrl: initialSettings.facebookUrl ?? "",
    tiktokUrl: initialSettings.tiktokUrl ?? "",
    legalOwnerName: initialSettings.legalOwnerName ?? "",
    legalTaxId: initialSettings.legalTaxId ?? "",
    legalRegistryInfo: initialSettings.legalRegistryInfo ?? "",
    legalRegisteredAddress: initialSettings.legalRegisteredAddress ?? "",
    legalDpoEmail: initialSettings.legalDpoEmail ?? "",
    publicBookingEnabled: initialSettings.publicBookingEnabled,
    bookingApprovalMode:
      initialSettings.bookingApprovalMode === "MANUAL"
        ? ("MANUAL" as const)
        : ("AUTOMATIC" as const),
    slotIntervalMin: initialSettings.slotIntervalMin,
    minAdvanceNoticeMin: initialSettings.minAdvanceNoticeMin,
    maxBookingHorizonDays: initialSettings.maxBookingHorizonDays,
    cancellationFreeHours: initialSettings.cancellationFreeHours,
    rescheduleFreeHours: initialSettings.rescheduleFreeHours,
    contactRetentionDays: initialSettings.contactRetentionDays,
    exportRetentionHours: initialSettings.exportRetentionHours,
    analyticsCookiesEnabled: initialSettings.analyticsCookiesEnabled,
    marketingCookiesEnabled: initialSettings.marketingCookiesEnabled,
    externalMapEmbedEnabled: initialSettings.externalMapEmbedEnabled,
  });

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "RECEPTION" as "OWNER_ADMIN" | "RECEPTION" | "PROFESSIONAL",
    professionalId: "",
    canExportData: false,
    canManageMarketing: false,
  });

  function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const res = await updateSalonSettingsAction(form);
      if (res.ok) {
        setFeedback({
          type: "ok",
          text: "Configuración guardada y páginas públicas/legales actualizadas.",
        });
        router.refresh();
      } else {
        setFeedback({ type: "err", text: res.error ?? "No se pudo guardar." });
      }
    });
  }

  function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const res = await createStaffUserAction(newUser);
      if (res.ok) {
        setFeedback({ type: "ok", text: "Usuario interno creado correctamente." });
        setNewUser({
          name: "",
          email: "",
          password: "",
          role: "RECEPTION",
          professionalId: "",
          canExportData: false,
          canManageMarketing: false,
        });
        router.refresh();
      } else {
        setFeedback({ type: "err", text: res.error ?? "Error al crear usuario." });
      }
    });
  }

  const tabs = [
    { id: "general", label: "Identidad y contacto" },
    { id: "legal", label: "Datos fiscales y legales" },
    { id: "booking", label: "Políticas de reserva y cookies" },
    { id: "users", label: `Usuarios y permisos (${users.length})` },
    { id: "system", label: "Integraciones y entorno" },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

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

      {(tab === "general" || tab === "legal" || tab === "booking") && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {tab === "general" && (
            <Card>
              <CardHeader>
                <CardTitle>Marca, dirección en Madrid y canales de contacto</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Si un campo opcional se deja vacío, la web pública no lo inventará ni mostrará enlaces rotos.
                </p>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="brandName">Nombre comercial</Label>
                  <Input
                    id="brandName"
                    value={form.brandName}
                    onChange={(e) => setForm({ ...form, brandName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tagline">Lema editorial</Label>
                  <Input
                    id="tagline"
                    value={form.tagline}
                    onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="addressLine">Dirección postal (calle y número)</Label>
                  <Input
                    id="addressLine"
                    placeholder="Pendiente de confirmar"
                    value={form.addressLine}
                    onChange={(e) => setForm({ ...form, addressLine: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="postalCode">Código postal</Label>
                    <Input
                      id="postalCode"
                      placeholder="280.."
                      value={form.postalCode}
                      onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="neighborhood">Barrio / Zona</Label>
                    <Input
                      id="neighborhood"
                      placeholder="Ej. Chamberí / Justicia"
                      value={form.neighborhood}
                      onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="city">Ciudad</Label>
                  <Input
                    id="city"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="country">País</Label>
                  <Input
                    id="country"
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="googleMapsUrl">Enlace oficial de Google Maps</Label>
                  <Input
                    id="googleMapsUrl"
                    type="url"
                    value={form.googleMapsUrl}
                    onChange={(e) => setForm({ ...form, googleMapsUrl: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Teléfono del salón</Label>
                  <Input
                    id="phone"
                    placeholder="+34 ..."
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="whatsapp">WhatsApp (opcional)</Label>
                  <Input
                    id="whatsapp"
                    placeholder="+34 ..."
                    value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contactEmail">Correo de atención al cliente</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="hola@..."
                    value={form.contactEmail}
                    onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="noticeEmail">Email de avisos del salón</Label>
                  <Input
                    id="noticeEmail"
                    data-testid="settings-notice-email-input"
                    type="email"
                    placeholder="avisos@... (vacío = correo de atención al cliente)"
                    value={form.noticeEmail}
                    onChange={(e) => setForm({ ...form, noticeEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="instagramUrl">Instagram URL (opcional)</Label>
                  <Input
                    id="instagramUrl"
                    type="url"
                    placeholder="https://instagram.com/..."
                    value={form.instagramUrl}
                    onChange={(e) => setForm({ ...form, instagramUrl: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="facebookUrl">Facebook URL (opcional)</Label>
                  <Input
                    id="facebookUrl"
                    type="url"
                    value={form.facebookUrl}
                    onChange={(e) => setForm({ ...form, facebookUrl: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tiktokUrl">TikTok URL (opcional)</Label>
                  <Input
                    id="tiktokUrl"
                    type="url"
                    value={form.tiktokUrl}
                    onChange={(e) => setForm({ ...form, tiktokUrl: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {tab === "legal" && (
            <Card>
              <CardHeader>
                <CardTitle>Identificación LSSI-CE y RGPD del titular</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Estos valores sustituyen automáticamente las variables{" "}
                  <code>{"{{legalOwnerName}}"}</code>, <code>{"{{legalTaxId}}"}</code>,{" "}
                  <code>{"{{legalRegisteredAddress}}"}</code>, <code>{"{{legalRegistryInfo}}"}</code> y{" "}
                  <code>{"{{legalDpoEmail}}"}</code> en Aviso Legal, Términos, Condiciones de Reserva,
                  Privacidad y Cookies.
                </p>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="legalOwnerName">Titular / Razón social</Label>
                  <Input
                    id="legalOwnerName"
                    placeholder="Nombre completo o sociedad titular"
                    value={form.legalOwnerName}
                    onChange={(e) => setForm({ ...form, legalOwnerName: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="legalTaxId">NIF / CIF</Label>
                  <Input
                    id="legalTaxId"
                    placeholder="Ej. B12345678"
                    value={form.legalTaxId}
                    onChange={(e) => setForm({ ...form, legalTaxId: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="legalRegisteredAddress">Domicilio social / fiscal completo</Label>
                  <Input
                    id="legalRegisteredAddress"
                    placeholder="Calle, número, código postal, Madrid, España"
                    value={form.legalRegisteredAddress}
                    onChange={(e) => setForm({ ...form, legalRegisteredAddress: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="legalRegistryInfo">Datos registrales (si es sociedad mercantil)</Label>
                  <Input
                    id="legalRegistryInfo"
                    placeholder="Registro Mercantil de Madrid, Tomo..., Folio..., Hoja..."
                    value={form.legalRegistryInfo}
                    onChange={(e) => setForm({ ...form, legalRegistryInfo: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="legalDpoEmail">Email para ejercicio de derechos RGPD / Privacidad</Label>
                  <Input
                    id="legalDpoEmail"
                    type="email"
                    placeholder="privacidad@..."
                    value={form.legalDpoEmail}
                    onChange={(e) => setForm({ ...form, legalDpoEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contactRetentionDays">Retención consultas de contacto (días)</Label>
                  <Input
                    id="contactRetentionDays"
                    type="number"
                    min={30}
                    max={3650}
                    value={form.contactRetentionDays}
                    onChange={(e) =>
                      setForm({ ...form, contactRetentionDays: Number(e.target.value) })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {tab === "booking" && (
            <Card>
              <CardHeader>
                <CardTitle>Reglas operativas de reserva online y privacidad técnica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="bookingApprovalMode">Modo de confirmación</Label>
                    <select
                      id="bookingApprovalMode"
                      className="flex h-10 w-full rounded-lg border border-input bg-card px-3 text-sm"
                      value={form.bookingApprovalMode}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          bookingApprovalMode:
                            e.target.value === "MANUAL" ? "MANUAL" : "AUTOMATIC",
                        })
                      }
                    >
                      <option value="AUTOMATIC">Confirmación inmediata automática</option>
                      <option value="MANUAL">Solicitud pendiente de aprobar por salón</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="slotIntervalMin">Intervalo entre huecos (min)</Label>
                    <Input
                      id="slotIntervalMin"
                      type="number"
                      min={5}
                      max={120}
                      step={5}
                      value={form.slotIntervalMin}
                      onChange={(e) =>
                        setForm({ ...form, slotIntervalMin: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="minAdvanceNoticeMin">Antelación mínima reserva (min)</Label>
                    <Input
                      id="minAdvanceNoticeMin"
                      type="number"
                      min={0}
                      max={10080}
                      value={form.minAdvanceNoticeMin}
                      onChange={(e) =>
                        setForm({ ...form, minAdvanceNoticeMin: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="maxBookingHorizonDays">Horizonte máximo abierto (días)</Label>
                    <Input
                      id="maxBookingHorizonDays"
                      type="number"
                      min={1}
                      max={365}
                      value={form.maxBookingHorizonDays}
                      onChange={(e) =>
                        setForm({ ...form, maxBookingHorizonDays: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cancellationFreeHours">Ventana cancelación online (horas)</Label>
                    <Input
                      id="cancellationFreeHours"
                      type="number"
                      min={0}
                      max={168}
                      value={form.cancellationFreeHours}
                      onChange={(e) =>
                        setForm({ ...form, cancellationFreeHours: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="rescheduleFreeHours">Ventana reprogramación online (horas)</Label>
                    <Input
                      id="rescheduleFreeHours"
                      type="number"
                      min={0}
                      max={168}
                      value={form.rescheduleFreeHours}
                      onChange={(e) =>
                        setForm({ ...form, rescheduleFreeHours: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-3 border-t border-border pt-4 text-sm">
                  <label className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={form.publicBookingEnabled}
                      onChange={(e) =>
                        setForm({ ...form, publicBookingEnabled: e.target.checked })
                      }
                      className="h-4 w-4"
                    />
                    <span>Habilitar reservas online públicas (cuando existan servicios, equipo y horarios confirmados)</span>
                  </label>
                  <label className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={form.analyticsCookiesEnabled}
                      onChange={(e) =>
                        setForm({ ...form, analyticsCookiesEnabled: e.target.checked })
                      }
                      className="h-4 w-4"
                    />
                    <span>Activar categoría de cookies analíticas opcionales en el gestor de consentimiento</span>
                  </label>
                  <label className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={form.marketingCookiesEnabled}
                      onChange={(e) =>
                        setForm({ ...form, marketingCookiesEnabled: e.target.checked })
                      }
                      className="h-4 w-4"
                    />
                    <span>Activar categoría de cookies de marketing opcionales en el gestor de consentimiento</span>
                  </label>
                  <label className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={form.externalMapEmbedEnabled}
                      onChange={(e) =>
                        setForm({ ...form, externalMapEmbedEnabled: e.target.checked })
                      }
                      className="h-4 w-4"
                    />
                    <span>Permitir mapa embebido de terceros (tras consentimiento explícito del visitante)</span>
                  </label>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando..." : "Guardar configuración"}
            </Button>
          </div>
        </form>
      )}

      {tab === "users" && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Cuentas internas del salón</CardTitle>
              <p className="text-sm text-muted-foreground">
                Control de acceso RBAC: <strong>Propietaria/o</strong> (acceso total),{" "}
                <strong>Recepción</strong> (operativa diaria; exportación Excel y marketing opcionales) y{" "}
                <strong>Profesional</strong> (restringido exclusivamente a su propia agenda).
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {users.map((u) => (
                <StaffUserRow
                  key={u.id}
                  user={u}
                  professionals={professionals}
                  onFeedback={setFeedback}
                />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Añadir usuario interno</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="space-y-3.5">
                <div className="space-y-1">
                  <Label htmlFor="nu-name">Nombre</Label>
                  <Input
                    id="nu-name"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="nu-email">Email</Label>
                  <Input
                    id="nu-email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="nu-pass">Contraseña inicial (mín. 10 caracteres)</Label>
                  <Input
                    id="nu-pass"
                    type="password"
                    minLength={10}
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="nu-role">Rol</Label>
                  <select
                    id="nu-role"
                    className="flex h-10 w-full rounded-lg border border-input bg-card px-3 text-sm"
                    value={newUser.role}
                    onChange={(e) =>
                      setNewUser({
                        ...newUser,
                        role: e.target.value as "OWNER_ADMIN" | "RECEPTION" | "PROFESSIONAL",
                      })
                    }
                  >
                    <option value="RECEPTION">Recepción</option>
                    <option value="PROFESSIONAL">Profesional (solo su agenda)</option>
                    <option value="OWNER_ADMIN">Propietaria/o (Admin total)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="nu-pro">Perfil profesional vinculado (requerido para rol Profesional)</Label>
                  <select
                    id="nu-pro"
                    className="flex h-10 w-full rounded-lg border border-input bg-card px-3 text-sm"
                    value={newUser.professionalId}
                    onChange={(e) => setNewUser({ ...newUser, professionalId: e.target.value })}
                  >
                    <option value="">— Sin vincular —</option>
                    {professionals.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                {newUser.role === "RECEPTION" && (
                  <div className="space-y-2 rounded-lg border border-border p-3 text-xs">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={newUser.canExportData}
                        onChange={(e) =>
                          setNewUser({ ...newUser, canExportData: e.target.checked })
                        }
                      />
                      <span>Permitir exportar CRM a Excel (.xlsx)</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={newUser.canManageMarketing}
                        onChange={(e) =>
                          setNewUser({ ...newUser, canManageMarketing: e.target.checked })
                        }
                      />
                      <span>Permitir gestionar campañas de marketing</span>
                    </label>
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={isPending}>
                  Crear cuenta
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "system" && (
        <Card>
          <CardHeader>
            <CardTitle>Estado de variables de entorno y credenciales</CardTitle>
            <p className="text-sm text-muted-foreground">
              Por seguridad, los secretos jamás se leen ni exponen al navegador; aquí solo se muestra si cada variable está definida en el servidor.
            </p>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {envStatus.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between rounded-lg border border-border px-4 py-2.5 text-sm"
              >
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="font-mono text-xs text-muted-foreground">{item.key}</p>
                </div>
                <Badge variant={item.configured ? "success" : "warning"}>
                  {item.configured ? "Configurado" : "Pendiente"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StaffUserRow({
  user,
  professionals,
  onFeedback,
}: {
  user: StaffUserItem;
  professionals: ProfessionalOption[];
  onFeedback: (msg: { type: "ok" | "err"; text: string }) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [role, setRole] = useState(user.role);
  const [professionalId, setProfessionalId] = useState(user.professionalId ?? "");
  const [active, setActive] = useState(user.active);
  const [canExportData, setCanExportData] = useState(user.canExportData);
  const [canManageMarketing, setCanManageMarketing] = useState(user.canManageMarketing);
  const [newPassword, setNewPassword] = useState("");

  function handleSave() {
    startTransition(async () => {
      const res = await updateStaffUserAction({
        userId: user.id,
        role,
        professionalId,
        active,
        canExportData,
        canManageMarketing,
        newPassword,
      });
      if (res.ok) {
        setNewPassword("");
        onFeedback({ type: "ok", text: `Cuenta ${user.email} actualizada.` });
        router.refresh();
      } else {
        onFeedback({ type: "err", text: res.error ?? "No se pudo actualizar usuario." });
      }
    });
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-background/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
        <Badge variant={active ? "success" : "secondary"}>
          {active ? "Activo" : "Desactivado"}
        </Badge>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <Label className="text-xs">Rol</Label>
          <select
            className="mt-1 flex h-9 w-full rounded-lg border border-input bg-card px-2.5 text-xs"
            value={role}
            onChange={(e) =>
              setRole(e.target.value as "OWNER_ADMIN" | "RECEPTION" | "PROFESSIONAL")
            }
          >
            <option value="OWNER_ADMIN">Propietaria/o</option>
            <option value="RECEPTION">Recepción</option>
            <option value="PROFESSIONAL">Profesional</option>
          </select>
        </div>
        <div>
          <Label className="text-xs">Profesional vinculado</Label>
          <select
            className="mt-1 flex h-9 w-full rounded-lg border border-input bg-card px-2.5 text-xs"
            value={professionalId}
            onChange={(e) => setProfessionalId(e.target.value)}
          >
            <option value="">— Ninguno —</option>
            {professionals.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-xs">Nueva contraseña (opcional)</Label>
          <Input
            type="password"
            placeholder="Sin cambios"
            className="mt-1 h-9 text-xs"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            <span>Cuenta activa</span>
          </label>
          {role === "RECEPTION" && (
            <>
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={canExportData}
                  onChange={(e) => setCanExportData(e.target.checked)}
                />
                <span>Exportar Excel</span>
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={canManageMarketing}
                  onChange={(e) => setCanManageMarketing(e.target.checked)}
                />
                <span>Marketing</span>
              </label>
            </>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={handleSave} disabled={pending}>
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}
