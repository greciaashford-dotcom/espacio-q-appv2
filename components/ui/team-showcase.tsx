/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Globe,
  Instagram,
  Linkedin,
  Twitter,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface TeamMember {
  id?: string;
  name: string;
  role: string;
  /** Breve descripción de especialidad mostrada al destacar al miembro del equipo. */
  specialty?: string;
  /** Enlace externo HTTPS (editable desde el panel CMS) o ruta local (/media/...). */
  url?: string;
  /** Alias de compatibilidad con la interfaz original del componente. */
  image?: string;
  /** Enlace directo opcional a reserva cuando corresponde a un perfil activo en agenda. */
  bookingHref?: string;
  instagramHref?: string;
  linkedinHref?: string;
  twitterHref?: string;
  behanceHref?: string;
  social?: {
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    behance?: string;
  };
}

export const DEFAULT_SALON_TEAM_MEMBERS: TeamMember[] = [
  {
    id: "eq-team-1",
    name: "Clara Mendoza",
    role: "DIRECCIÓN ARTÍSTICA · CORTE Y FORMA",
    specialty: "Corte en seco, líneas orgánicas y estudio personalizado de facciones.",
    url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=700&q=80",
    instagramHref: "https://instagram.com",
  },
  {
    id: "eq-team-2",
    name: "Mateo Valdés",
    role: "ESPECIALISTA EN COLOR Y LUZ NATURAL",
    specialty: "Iluminación a mano alzada, matices cálidos y coloración respetuosa.",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=700&q=80",
    instagramHref: "https://instagram.com",
    linkedinHref: "https://linkedin.com",
  },
  {
    id: "eq-team-3",
    name: "Sofía Alarcón",
    role: "ESTILISMO EDITORIAL Y RECOGIDOS",
    specialty: "Peinados con movimiento natural, ondas abiertas y estilismo de eventos.",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=700&q=80",
    instagramHref: "https://instagram.com",
  },
  {
    id: "eq-team-4",
    name: "Lucas Ferrer",
    role: "CORTE CONTEMPORÁNEO Y TEXTURA",
    specialty: "Capas invisibles, cabello rizado u ondulado y cortes de fácil mantenimiento.",
    url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=700&q=80",
    linkedinHref: "https://linkedin.com",
  },
  {
    id: "eq-team-5",
    name: "Valeria Soto",
    role: "SALUD CAPILAR Y RITUALES BOTÁNICOS",
    specialty: "Diagnóstico del cuero cabelludo, hidratación profunda y recuperación de fibra.",
    url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=700&q=80",
    instagramHref: "https://instagram.com",
  },
  {
    id: "eq-team-6",
    name: "Elena Quiroga",
    role: "CUIDADO ESTÉTICO Y ARMONÍA FACIAL",
    specialty: "Diseño de mirada, rituales calmantes y acabado luminoso de la piel.",
    url: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=700&q=80",
    instagramHref: "https://instagram.com",
  },
];

export interface TeamShowcaseProps {
  members?: TeamMember[];
  className?: string;
}

function resolveMemberImage(member: TeamMember): string {
  return (member.url || member.image || "").trim();
}

function resolveCleanSocialUrl(raw?: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "#") return null;
  return trimmed;
}

function resolveMemberSocial(member: TeamMember) {
  return {
    instagram: resolveCleanSocialUrl(member.instagramHref ?? member.social?.instagram),
    linkedin: resolveCleanSocialUrl(member.linkedinHref ?? member.social?.linkedin),
    twitter: resolveCleanSocialUrl(member.twitterHref ?? member.social?.twitter),
    behance: resolveCleanSocialUrl(member.behanceHref ?? member.social?.behance),
  };
}

export function TeamShowcase({
  members: rawMembers,
  className,
}: TeamShowcaseProps) {
  const members =
    rawMembers && rawMembers.length > 0
      ? rawMembers.filter((m) => Boolean(m && m.name && resolveMemberImage(m)))
      : DEFAULT_SALON_TEAM_MEMBERS;

  const activeList = members.length > 0 ? members : DEFAULT_SALON_TEAM_MEMBERS;
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const normalized = activeList.map((m, idx) => ({
    ...m,
    resolvedId: m.id || `team-member-${idx + 1}`,
  }));

  const col1 = normalized.filter((_, i) => i % 3 === 0);
  const col2 = normalized.filter((_, i) => i % 3 === 1);
  const col3 = normalized.filter((_, i) => i % 3 === 2);

  const handleToggleSelect = (id: string) => {
    setHoveredId((prev) => (prev === id ? null : id));
  };

  return (
    <div
      data-slot="team-showcase"
      className={cn(
        "mx-auto flex w-full max-w-6xl select-none flex-col items-center gap-8 font-sans lg:flex-row lg:items-start lg:gap-14",
        className
      )}
    >
      {/* ── Izquierda: Mosaico escalonado de retratos ── */}
      <div className="grid w-full max-w-[520px] flex-shrink-0 grid-cols-3 gap-2.5 sm:gap-3.5 lg:flex lg:w-auto lg:max-w-none">
        {/* Columna 1 */}
        <div className="flex flex-col gap-2.5 sm:gap-3.5">
          {col1.map((member) => (
            <PhotoCard
              key={member.resolvedId}
              member={member}
              memberId={member.resolvedId}
              className="aspect-[11/12] w-full lg:h-[172px] lg:w-[158px] lg:aspect-auto"
              hoveredId={hoveredId}
              onHover={setHoveredId}
              onToggleSelect={handleToggleSelect}
            />
          ))}
        </div>

        {/* Columna 2 (desplazada hacia abajo) */}
        <div className="mt-7 flex flex-col gap-2.5 sm:mt-12 sm:gap-3.5 lg:mt-[64px]">
          {col2.map((member) => (
            <PhotoCard
              key={member.resolvedId}
              member={member}
              memberId={member.resolvedId}
              className="aspect-[11/12] w-full lg:h-[188px] lg:w-[174px] lg:aspect-auto"
              hoveredId={hoveredId}
              onHover={setHoveredId}
              onToggleSelect={handleToggleSelect}
            />
          ))}
        </div>

        {/* Columna 3 (desplazamiento intermedio) */}
        <div className="mt-3.5 flex flex-col gap-2.5 sm:mt-6 sm:gap-3.5 lg:mt-[30px]">
          {col3.map((member) => (
            <PhotoCard
              key={member.resolvedId}
              member={member}
              memberId={member.resolvedId}
              className="aspect-[11/12] w-full lg:h-[178px] lg:w-[164px] lg:aspect-auto"
              hoveredId={hoveredId}
              onHover={setHoveredId}
              onToggleSelect={handleToggleSelect}
            />
          ))}
        </div>
      </div>

      {/* ── Derecha: Listado interactivo del equipo ── */}
      <div
        role="list"
        aria-label="Integrantes del equipo de ESPACIO Q"
        className="grid w-full flex-1 grid-cols-1 gap-4 pt-1 sm:grid-cols-2 lg:flex lg:flex-col lg:gap-5 lg:pt-3"
      >
        {normalized.map((member) => (
          <MemberRow
            key={member.resolvedId}
            member={member}
            memberId={member.resolvedId}
            hoveredId={hoveredId}
            onHover={setHoveredId}
            onToggleSelect={handleToggleSelect}
          />
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Tarjeta fotográfica con transición editorial B/N -> Color
───────────────────────────────────────── */

function PhotoCard({
  member,
  memberId,
  className,
  hoveredId,
  onHover,
  onToggleSelect,
}: {
  member: TeamMember;
  memberId: string;
  className: string;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onToggleSelect: (id: string) => void;
}) {
  const isActive = hoveredId === memberId;
  const isDimmed = hoveredId !== null && !isActive;
  const imgSrc = resolveMemberImage(member);

  return (
    <button
      type="button"
      aria-label={`Destacar perfil de ${member.name}, ${member.role}`}
      aria-pressed={isActive}
      className={cn(
        "group relative flex-shrink-0 cursor-pointer overflow-hidden rounded-editorial border border-border/80 bg-secondary text-left shadow-subtle outline-none transition-[opacity,transform,box-shadow] duration-300 focus-visible:ring-2 focus-visible:ring-ring",
        className,
        isDimmed ? "opacity-55" : "opacity-100",
        isActive && "ring-1 ring-foreground/25 shadow-editorial"
      )}
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") onHover(memberId);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") onHover(null);
      }}
      onClick={() => onToggleSelect(memberId)}
    >
      <img
        src={imgSrc}
        alt={`${member.name} — ${member.role}`}
        loading="lazy"
        decoding="async"
        className={cn(
          "h-full w-full object-cover transition-[filter,transform] duration-500 motion-reduce:transition-none",
          isActive ? "scale-[1.03]" : "scale-100"
        )}
        style={{
          filter: isActive
            ? "grayscale(0) brightness(1)"
            : "grayscale(1) contrast(1.03) brightness(0.84)",
        }}
      />
    </button>
  );
}

/* ─────────────────────────────────────────
   Fila interactiva de integrante del equipo
───────────────────────────────────────── */

function MemberRow({
  member,
  memberId,
  hoveredId,
  onHover,
  onToggleSelect,
}: {
  member: TeamMember;
  memberId: string;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onToggleSelect: (id: string) => void;
}) {
  const isActive = hoveredId === memberId;
  const isDimmed = hoveredId !== null && !isActive;
  const social = resolveMemberSocial(member);
  const hasSocial = Boolean(
    social.instagram || social.linkedin || social.twitter || social.behance
  );

  return (
    <div
      role="listitem"
      tabIndex={0}
      aria-label={`${member.name} — ${member.role}`}
      className={cn(
        "group cursor-pointer rounded-editorial border px-3.5 py-3 transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isActive
          ? "border-border bg-card shadow-subtle"
          : "border-transparent bg-transparent hover:border-border/60 hover:bg-card/50",
        isDimmed ? "opacity-50" : "opacity-100"
      )}
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") onHover(memberId);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") onHover(null);
      }}
      onFocus={() => onHover(memberId)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          onHover(null);
        }
      }}
      onClick={() => onToggleSelect(memberId)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggleSelect(memberId);
        }
      }}
    >
      {/* Nombre + redes sociales / reserva */}
      <div className="flex flex-wrap items-center gap-2.5">
        <span
          aria-hidden="true"
          className={cn(
            "h-3 rounded-[5px] flex-shrink-0 transition-all duration-300",
            isActive ? "w-5 bg-foreground" : "w-3.5 bg-foreground/25"
          )}
        />
        <span
          className={cn(
            "font-serif text-xl font-medium leading-none tracking-tight transition-colors duration-300 sm:text-[22px]",
            isActive ? "text-foreground" : "text-foreground/85"
          )}
        >
          {member.name}
        </span>

        {/* Iconos sociales opcionales */}
        {hasSocial && (
          <div
            className={cn(
              "ml-0.5 flex items-center gap-1 transition-all duration-200",
              isActive
                ? "translate-x-0 opacity-100"
                : "pointer-events-none -translate-x-2 opacity-0"
            )}
          >
            {social.instagram && (
              <a
                href={social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-all duration-150 hover:scale-110 hover:bg-foreground/10 hover:text-foreground"
                aria-label={`Instagram de ${member.name}`}
                title="Instagram"
              >
                <Instagram className="size-3.5" />
              </a>
            )}
            {social.linkedin && (
              <a
                href={social.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-all duration-150 hover:scale-110 hover:bg-foreground/10 hover:text-foreground"
                aria-label={`LinkedIn de ${member.name}`}
                title="LinkedIn"
              >
                <Linkedin className="size-3.5" />
              </a>
            )}
            {social.twitter && (
              <a
                href={social.twitter}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-all duration-150 hover:scale-110 hover:bg-foreground/10 hover:text-foreground"
                aria-label={`Perfil X de ${member.name}`}
                title="X / Twitter"
              >
                <Twitter className="size-3.5" />
              </a>
            )}
            {social.behance && (
              <a
                href={social.behance}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-all duration-150 hover:scale-110 hover:bg-foreground/10 hover:text-foreground"
                aria-label={`Portfolio de ${member.name}`}
                title="Portfolio"
              >
                <Globe className="size-3.5" />
              </a>
            )}
          </div>
        )}

        {member.bookingHref && isActive && (
          <Link
            href={member.bookingHref}
            onClick={(e) => e.stopPropagation()}
            className="ml-auto inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-accent"
          >
            <Calendar className="size-3" aria-hidden="true" />
            <span>Reservar</span>
          </Link>
        )}
      </div>

      {/* Especialidad / Rol */}
      <p className="mt-1.5 pl-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground sm:text-[11px]">
        {member.role}
      </p>

      {/* Nota breve de especialidad al destacar */}
      {member.specialty && (
        <p
          className={cn(
            "overflow-hidden pl-6 text-xs leading-relaxed text-muted-foreground transition-all duration-300",
            isActive ? "mt-1.5 max-h-20 opacity-100" : "mt-0 max-h-0 opacity-0"
          )}
        >
          {member.specialty}
        </p>
      )}
    </div>
  );
}

export default TeamShowcase;
