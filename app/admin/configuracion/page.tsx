import React from "react";
import { prisma } from "@/lib/db/prisma";
import { ensureBaseCmsAndSettings } from "@/lib/domain/cms";
import { getCurrentUser, canManageSettingsOrUsers } from "@/lib/auth/session";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { SettingsManager } from "@/components/admin/settings-manager";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Configuración" };

export default async function AdminConfiguracionPage() {
  const user = await getCurrentUser();
  if (!user || !canManageSettingsOrUsers(user)) {
    return (
      <div>
        <AdminPageHeader
          title="Configuración"
          description="Acceso restringido a cuentas con perfil Propietaria/o (OWNER_ADMIN)."
        />
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Tu rol actual no tiene permisos para modificar parámetros fiscales, políticas globales ni cuentas de usuarios internos.
          </CardContent>
        </Card>
      </div>
    );
  }

  const [settings, users, professionals] = await Promise.all([
    ensureBaseCmsAndSettings(),
    prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        professionalId: true,
        active: true,
        canExportData: true,
        canManageMarketing: true,
        lastLoginAt: true,
      },
    }),
    prisma.professional.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const envStatus = [
    { key: "DATABASE_URL", label: "Base de datos PostgreSQL", configured: Boolean(process.env.DATABASE_URL?.trim()) },
    { key: "AUTH_SECRET", label: "Secreto criptográfico de sesión/HMAC", configured: Boolean(process.env.AUTH_SECRET?.trim()) },
    { key: "TOKEN_ENCRYPTION_KEY", label: "Clave AES-256-GCM para tokens externos", configured: Boolean(process.env.TOKEN_ENCRYPTION_KEY?.trim()) },
    { key: "CRON_SECRET", label: "Secreto Bearer para worker de trabajos", configured: Boolean(process.env.CRON_SECRET?.trim()) },
    { key: "EMAIL_PROVIDER_API_KEY", label: "Proveedor de envío transaccional y marketing (Resend)", configured: Boolean(process.env.EMAIL_PROVIDER_API_KEY?.trim()) },
    { key: "EMAIL_WEBHOOK_SECRET", label: "Firma HMAC de webhooks de entregabilidad y rebotes", configured: Boolean(process.env.EMAIL_WEBHOOK_SECRET?.trim()) },
    { key: "GOOGLE_CLIENT_ID / SECRET", label: "Google Business Profile OAuth 2.0", configured: Boolean(process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim()) },
    { key: "GOOGLE_PLACES_API_KEY / PLACE_ID", label: "Google Places API (verificación de ficha)", configured: Boolean(process.env.GOOGLE_PLACES_API_KEY?.trim() && process.env.GOOGLE_PLACE_ID?.trim()) },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Configuración"
        description="Identidad del salón, datos fiscales/legales (interpolados en textos legales), políticas de reserva y cuentas internas."
      />
      <SettingsManager
        initialSettings={settings}
        users={users.map((u) => ({
          ...u,
          lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
        }))}
        professionals={professionals}
        envStatus={envStatus}
      />
    </div>
  );
}
