import React from "react";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { madridLocalToUtc, utcToMadridParts } from "@/lib/domain/timezone";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { AgendaManager } from "@/components/admin/agenda-manager";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Agenda" };

function buildWeekAround(dateStr: string): string[] {
  const [y, m, d] = dateStr.split("-").map((n) => parseInt(n, 10));
  const base = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const day = base.getUTCDay(); // 0 Sun..6 Sat
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(base.getTime() + diffToMonday * 24 * 3600 * 1000);

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const dt = new Date(monday.getTime() + i * 24 * 3600 * 1000);
    dates.push(dt.toISOString().slice(0, 10));
  }
  return dates;
}

export default async function AdminAgendaPage({
  searchParams,
}: {
  searchParams?: { date?: string; view?: string; pro?: string; status?: string };
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  if (user.role === "PROFESSIONAL" && !user.professionalId) {
    return (
      <div>
        <AdminPageHeader
          title="Mi agenda"
          description="Tu cuenta de usuario aún no está vinculada a un perfil del equipo."
        />
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Solicita a Dirección (Propietaria/o) que vincule tu usuario con tu ficha profesional en{" "}
            <strong>Configuración → Usuarios y permisos</strong>.
          </CardContent>
        </Card>
      </div>
    );
  }

  const todayMadrid = utcToMadridParts(new Date()).dateStr;
  const selectedDate =
    searchParams?.date && /^\d{4}-\d{2}-\d{2}$/.test(searchParams.date)
      ? searchParams.date
      : todayMadrid;

  const viewMode: "day" | "week" | "list" =
    searchParams?.view === "week"
      ? "week"
      : searchParams?.view === "list"
      ? "list"
      : "day";

  const lockedProfessionalId =
    user.role === "PROFESSIONAL" ? user.professionalId : null;
  const filterProId = lockedProfessionalId ?? (searchParams?.pro?.trim() || "");
  const filterStatus = searchParams?.status?.trim() || "";

  const weekDates = buildWeekAround(selectedDate);

  const apptWhere: any = {};
  if (filterProId) {
    apptWhere.professionalId = filterProId;
  }
  if (filterStatus) {
    apptWhere.status = filterStatus;
  }

  if (viewMode === "day") {
    apptWhere.dateStrMadrid = selectedDate;
  } else if (viewMode === "week") {
    apptWhere.dateStrMadrid = { in: weekDates };
  } else {
    apptWhere.dateStrMadrid = { gte: selectedDate };
  }

  const rangeStartDate = viewMode === "week" ? weekDates[0] : selectedDate;
  const rangeEndDate =
    viewMode === "week"
      ? weekDates[6]
      : viewMode === "day"
      ? selectedDate
      : (() => {
          const [y, m, d] = selectedDate.split("-").map((n) => parseInt(n, 10));
          return new Date(Date.UTC(y, m - 1, d + 30, 12, 0, 0))
            .toISOString()
            .slice(0, 10);
        })();

  const startConv = madridLocalToUtc(rangeStartDate, "00:00");
  const endConv = madridLocalToUtc(rangeEndDate, "23:59");

  const [appointments, rawBlocks, professionals, services] = await Promise.all([
    prisma.appointment.findMany({
      where: apptWhere,
      orderBy: [{ dateStrMadrid: "asc" }, { startTimeMadrid: "asc" }],
      include: { professional: { select: { name: true } } },
      take: 150,
    }),
    prisma.occupancy.findMany({
      where: {
        active: true,
        appointmentId: null,
        ...(filterProId ? { professionalId: filterProId } : {}),
        ...(startConv.ok && endConv.ok
          ? {
              startAtUtc: { lte: endConv.utcDate },
              endAtUtc: { gte: startConv.utcDate },
            }
          : {}),
      },
      include: { professional: { select: { name: true } } },
      orderBy: { startAtUtc: "asc" },
    }),
    prisma.professional.findMany({
      where: {
        active: true,
        ...(lockedProfessionalId ? { id: lockedProfessionalId } : {}),
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
    prisma.service.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, durationMin: true },
    }),
  ]);

  const manualBlocks = rawBlocks.map((b) => {
    const s = utcToMadridParts(b.startAtUtc);
    const e = utcToMadridParts(b.endAtUtc);
    return {
      id: b.id,
      professionalId: b.professionalId,
      professionalName: b.professional.name,
      dateStrMadrid: s.dateStr,
      startTimeMadrid: s.timeStr,
      endTimeMadrid: e.timeStr,
      notes: b.notes,
    };
  });

  return (
    <div>
      <AdminPageHeader
        title={lockedProfessionalId ? "Mi agenda" : "Agenda de citas"}
        description="Gestión en tiempo real de reservas, aprobaciones, reprogramaciones atómicas y bloqueos de cabina."
      />
      <AgendaManager
        selectedDate={selectedDate}
        weekDates={weekDates}
        viewMode={viewMode}
        filterProId={filterProId}
        filterStatus={filterStatus}
        appointments={appointments.map((a) => ({
          id: a.id,
          referenceCode: a.referenceCode,
          status: a.status,
          dateStrMadrid: a.dateStrMadrid,
          startTimeMadrid: a.startTimeMadrid,
          endTimeMadrid: a.endTimeMadrid,
          serviceName: a.serviceNameSnapshot,
          durationMin: a.durationMinSnapshot,
          priceType: a.priceTypeSnapshot,
          priceCents: a.priceCentsSnapshot,
          professionalId: a.professionalId,
          professionalName: a.professional.name,
          customerName: a.customerName,
          customerEmail: a.customerEmail,
          customerPhone: a.customerPhone,
          customerNotes: a.customerNotes,
          internalNotes: a.internalNotes,
        }))}
        manualBlocks={manualBlocks}
        professionals={professionals}
        services={services}
        lockedProfessionalId={lockedProfessionalId}
      />
    </div>
  );
}
