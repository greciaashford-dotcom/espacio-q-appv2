"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  Clock,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Moon,
  Scissors,
  Settings,
  Sun,
  Users,
  UserSquare2,
  Workflow,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/lib/auth/actions";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
};

const NAV: NavItem[] = [
  { href: "/admin", label: "Resumen", icon: LayoutDashboard },
  { href: "/admin/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/admin/clientes", label: "Clientes", icon: Users, roles: ["OWNER_ADMIN", "RECEPTION"] },
  { href: "/admin/servicios", label: "Servicios", icon: Scissors, roles: ["OWNER_ADMIN", "RECEPTION"] },
  { href: "/admin/equipo", label: "Equipo", icon: UserSquare2, roles: ["OWNER_ADMIN", "RECEPTION"] },
  { href: "/admin/horarios", label: "Horarios", icon: Clock, roles: ["OWNER_ADMIN", "RECEPTION"] },
  { href: "/admin/contenido", label: "Contenido y legales", icon: FileText, roles: ["OWNER_ADMIN", "RECEPTION"] },
  { href: "/admin/multimedia", label: "Multimedia", icon: ImageIcon, roles: ["OWNER_ADMIN", "RECEPTION"] },
  { href: "/admin/marketing", label: "Marketing", icon: Megaphone, roles: ["OWNER_ADMIN", "RECEPTION"] },
  { href: "/admin/automatizaciones", label: "Automatizaciones", icon: Workflow, roles: ["OWNER_ADMIN", "RECEPTION"] },
  { href: "/admin/informes", label: "Informes", icon: BarChart3, roles: ["OWNER_ADMIN", "RECEPTION"] },
  { href: "/admin/configuracion", label: "Configuración", icon: Settings, roles: ["OWNER_ADMIN"] },
];

function NavList({ role, onNavigate }: { role: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  const visibleItems = NAV.filter((item) => !item.roles || item.roles.includes(role));

  return (
    <ul className="space-y-1">
      {visibleItems.map((item) => {
        const active =
          item.href === "/admin" ? pathname === "/admin" : pathname?.startsWith(item.href);
        const Icon = item.icon;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-[40px] items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function AdminShell({
  user,
  children,
}: {
  user: { name: string; email: string; role: string };
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("espacioq_admin_theme");
      if (saved === "dark") {
        setDark(true);
        document.documentElement.classList.add("dark");
      }
    } catch {
      // ignore storage errors
    }
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, []);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    try {
      window.localStorage.setItem("espacioq_admin_theme", next ? "dark" : "light");
    } catch {
      // ignore
    }
  }

  const roleLabel =
    user.role === "OWNER_ADMIN"
      ? "Propietaria/o"
      : user.role === "RECEPTION"
      ? "Recepción"
      : "Profesional";

  const footer = (
    <div className="space-y-3 border-t border-sidebar-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-between text-xs">
        <div>
          <p className="font-medium text-foreground">{user.name}</p>
          <p className="text-muted-foreground">{roleLabel}</p>
        </div>
        <button
          type="button"
          onClick={toggleDark}
          aria-label={dark ? "Cambiar a modo lino claro" : "Cambiar a modo oscuro"}
          title={dark ? "Modo lino claro" : "Modo oscuro para panel"}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-accent"
        >
          {dark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        </button>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/"
          target="_blank"
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs hover:bg-accent"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Ver web
        </Link>
        <form action={logoutAction} className="flex-1">
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs hover:bg-accent"
          >
            <LogOut className="h-3.5 w-3.5" /> Salir
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-[100dvh] bg-background">
      {/* Sidebar escritorio */}
      <aside className="sticky top-0 hidden h-[100dvh] w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="border-b border-sidebar-border px-5 py-5">
          <p className="font-serif text-2xl tracking-[0.14em]">ESPACIO Q</p>
          <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            Panel de gestión
          </p>
        </div>
        <nav aria-label="Navegación del panel" className="flex-1 overflow-y-auto p-3">
          <NavList role={user.role} />
        </nav>
        {footer}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar móvil con accesos rápidos táctiles >= 44px */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur lg:hidden">
          <Link href="/admin" className="font-serif text-xl tracking-[0.14em]">
            ESPACIO Q
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/agenda"
              className="inline-flex h-11 items-center rounded-lg border border-border bg-card px-3 text-xs font-medium"
            >
              Agenda
            </Link>
            <button
              type="button"
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-card"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </header>
        {open && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-foreground/40" onClick={() => setOpen(false)} />
            <aside className="absolute left-0 top-0 flex h-full w-72 max-w-[85vw] flex-col bg-sidebar shadow-editorial">
              <div className="flex items-center justify-between border-b border-sidebar-border px-5 py-4">
                <p className="font-serif text-xl tracking-[0.14em]">ESPACIO Q</p>
                <button
                  aria-label="Cerrar menú"
                  onClick={() => setOpen(false)}
                  className="h-11 w-11"
                >
                  <X className="mx-auto h-5 w-5" />
                </button>
              </div>
              <nav
                aria-label="Navegación del panel (móvil)"
                className="flex-1 overflow-y-auto p-3"
              >
                <NavList role={user.role} onNavigate={() => setOpen(false)} />
              </nav>
              {footer}
            </aside>
          </div>
        )}

        <main className="min-w-0 flex-1 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}

export function AdminPageHeader({
  title,
  description,
  breadcrumbs,
  actions,
}: {
  title: string;
  description?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 space-y-3">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Ruta" className="text-xs text-muted-foreground">
          {breadcrumbs.map((b, i) => (
            <span key={i}>
              {b.href ? (
                <Link href={b.href} className="hover:text-foreground">
                  {b.label}
                </Link>
              ) : (
                <span className="text-foreground">{b.label}</span>
              )}
              {i < breadcrumbs.length - 1 && <span className="mx-1.5">/</span>}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-serif text-3xl font-medium sm:text-4xl">{title}</h1>
          {description && (
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}
