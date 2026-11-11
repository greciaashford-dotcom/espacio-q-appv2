"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useScrollToTopOnChange } from "@/lib/ui/scroll";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  Search,
  Sparkles,
  TicketPercent,
  UserCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  BLACK_FRIDAY_PROMO,
  calculateDiscountedCents,
  validatePromoCoupon,
  type ValidatedPromoCoupon,
} from "@/lib/domain/promo-coupon";
import { cn, formatPrice } from "@/lib/utils";

export type BookingWizardService = {
  id: string;
  categoryName: string;
  name: string;
  shortDescription: string;
  durationMin: number;
  priceType: string;
  priceCents: number | null;
  currency: string;
  professionals: Array<{
    id: string;
    name: string;
    roleTitle: string;
    customDurationMin: number | null;
    customPriceCents: number | null;
  }>;
};

export type BookingOpenDayOption = {
  dateStr: string;
  shortLabel: string;
  hoursLabel: string;
};

type SlotOption = {
  time: string;
  endTime: string;
  availableCount?: number;
};

function makeIdemKey() {
  return `bk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function BookingWizard({
  services,
  initialServiceId,
  initialProfessionalId,
  initialExtraServices,
  initialCoupon,
  minDateStr,
  defaultDateStr,
  maxDateStr,
  upcomingOpenDays = [],
  bookingEnabled,
  cancellationFreeHours,
  cms,
}: {
  services: BookingWizardService[];
  initialServiceId?: string;
  initialProfessionalId?: string;
  initialExtraServices?: string;
  initialCoupon?: string;
  minDateStr?: string;
  defaultDateStr: string;
  maxDateStr: string;
  upcomingOpenDays?: BookingOpenDayOption[];
  bookingEnabled: boolean;
  cancellationFreeHours: number;
  cms: Record<string, any>;
}) {
  const preselectedSvc = services.find((s) => s.id === initialServiceId) ?? null;

  const knownProAcrossCatalog = useMemo(() => {
    if (!initialProfessionalId || initialProfessionalId === "any") return null;
    for (const s of services) {
      const match = s.professionals.find((p) => p.id === initialProfessionalId);
      if (match) return match;
    }
    return null;
  }, [services, initialProfessionalId]);

  const preselectedProValidForSvc =
    preselectedSvc &&
    initialProfessionalId &&
    preselectedSvc.professionals.some((p) => p.id === initialProfessionalId)
      ? initialProfessionalId
      : null;

  const initialStep: 1 | 2 | 3 = preselectedSvc
    ? preselectedProValidForSvc
      ? 3
      : 2
    : 1;

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(initialStep);
  const wizardRef = useRef<HTMLDivElement>(null);
  useScrollToTopOnChange(wizardRef, step);
  const [serviceId, setServiceId] = useState<string>(preselectedSvc?.id || "");
  const [professionalId, setProfessionalId] = useState<string>(
    preselectedProValidForSvc ?? (knownProAcrossCatalog ? knownProAcrossCatalog.id : "any")
  );
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("all");
  const [serviceSearch, setServiceSearch] = useState<string>("");

  const [dateStr, setDateStr] = useState<string>(defaultDateStr);
  const [selectedSlot, setSelectedSlot] = useState<SlotOption | null>(null);

  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerNotes, setCustomerNotes] = useState(() =>
    initialExtraServices?.trim()
      ? `Ritual combinado deseado además del principal: ${initialExtraServices.trim()}`
      : ""
  );
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  const initialValidatedCoupon = useMemo<ValidatedPromoCoupon | null>(() => {
    if (!initialCoupon) return null;
    const check = validatePromoCoupon(initialCoupon);
    return check.valid ? check : null;
  }, [initialCoupon]);

  const [couponInput, setCouponInput] = useState<string>(
    initialValidatedCoupon?.code ?? (initialCoupon?.trim() || "")
  );
  const [appliedCoupon, setAppliedCoupon] =
    useState<ValidatedPromoCoupon | null>(initialValidatedCoupon);
  const [couponError, setCouponError] = useState<string | null>(() => {
    if (!initialCoupon?.trim()) return null;
    const check = validatePromoCoupon(initialCoupon);
    return check.valid ? null : check.error;
  });

  useEffect(() => {
    // Recuperar automáticamente el cupón si el cliente pulsó "Copiar" o "Aplicar" en la ventana emergente
    if (!appliedCoupon && !initialCoupon) {
      try {
        const saved = window.localStorage.getItem(
          BLACK_FRIDAY_PROMO.storageSavedCodeKey
        );
        if (saved) {
          const check = validatePromoCoupon(saved);
          if (check.valid) {
            setAppliedCoupon(check);
            setCouponInput(check.code);
          }
        }
      } catch {
        // Ignorar restricciones de localStorage
      }
    }

    const onExternalApply = (ev: Event) => {
      const code = (ev as CustomEvent<{ code?: string }>).detail?.code;
      if (!code) return;
      const check = validatePromoCoupon(code);
      if (check.valid) {
        setAppliedCoupon(check);
        setCouponInput(check.code);
        setCouponError(null);
      }
    };

    window.addEventListener("espacioq:apply-coupon", onExternalApply);
    return () => {
      window.removeEventListener("espacioq:apply-coupon", onExternalApply);
    };
  }, [appliedCoupon, initialCoupon]);

  const handleApplyCoupon = (rawCode?: string) => {
    const targetCode = rawCode !== undefined ? rawCode : couponInput;
    const check = validatePromoCoupon(targetCode);
    if (!check.valid) {
      setCouponError(check.error);
      return;
    }
    setAppliedCoupon(check);
    setCouponInput(check.code);
    setCouponError(null);
    setIdempotencyKey(makeIdemKey());
    try {
      window.localStorage.setItem(
        BLACK_FRIDAY_PROMO.storageSavedCodeKey,
        check.code
      );
    } catch {
      // Ignorar
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError(null);
    setIdempotencyKey(makeIdemKey());
    try {
      window.localStorage.removeItem(BLACK_FRIDAY_PROMO.storageSavedCodeKey);
    } catch {
      // Ignorar
    }
  };

  const [idempotencyKey, setIdempotencyKey] = useState<string>(() =>
    makeIdemKey()
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [conflictAlternatives, setConflictAlternatives] = useState<SlotOption[]>(
    []
  );
  const [confirmedAppt, setConfirmedAppt] = useState<{
    referenceCode: string;
    status: string;
    dateStrMadrid: string;
    startTimeMadrid: string;
    endTimeMadrid: string;
    serviceName: string;
    durationMin: number;
    priceType: string;
    priceCents: number | null;
    currency: string;
    professionalName: string;
    appliedCoupon?: {
      code: string;
      discountPercent: number;
      label: string;
      originalPriceCents: number | null;
      finalPriceCents: number | null;
    } | null;
    manageUrl: string | null;
  } | null>(null);

  const selectedService = useMemo(
    () => services.find((s) => s.id === serviceId) ?? null,
    [services, serviceId]
  );

  const selectedProfessional = useMemo(() => {
    if (professionalId === "any") return null;
    if (selectedService) {
      return (
        selectedService.professionals.find((p) => p.id === professionalId) ?? null
      );
    }
    for (const s of services) {
      const found = s.professionals.find((p) => p.id === professionalId);
      if (found) return found;
    }
    return null;
  }, [selectedService, services, professionalId]);

  const categoryNames = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const s of services) {
      if (!seen.has(s.categoryName)) {
        seen.add(s.categoryName);
        list.push(s.categoryName);
      }
    }
    return list;
  }, [services]);

  const filteredStep1Services = useMemo(() => {
    const q = serviceSearch.trim().toLowerCase();
    return services.filter((s) => {
      if (
        professionalId !== "any" &&
        !s.professionals.some((p) => p.id === professionalId)
      ) {
        return false;
      }
      if (
        activeCategoryFilter !== "all" &&
        s.categoryName !== activeCategoryFilter
      ) {
        return false;
      }
      if (q) {
        const hay = `${s.name} ${s.shortDescription} ${s.categoryName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [services, professionalId, activeCategoryFilter, serviceSearch]);

  const effectiveDuration =
    selectedProfessional?.customDurationMin ??
    selectedService?.durationMin ??
    0;
  const effectivePriceCents =
    selectedProfessional?.customPriceCents ??
    selectedService?.priceCents ??
    null;
  const discountedEffectivePriceCents = appliedCoupon
    ? calculateDiscountedCents(effectivePriceCents, appliedCoupon.discountPercent)
    : effectivePriceCents;

  // Si cambia el servicio, revalidar profesional compatible y avanzar al paso adecuado
  const handleSelectService = (nextSvcId: string) => {
    setServiceId(nextSvcId);
    const nextSvc = services.find((s) => s.id === nextSvcId);
    const proStillValid =
      professionalId !== "any" &&
      Boolean(nextSvc?.professionals.some((p) => p.id === professionalId));

    if (!proStillValid && professionalId !== "any") {
      setProfessionalId("any");
    }
    setSelectedSlot(null);
    setIdempotencyKey(makeIdemKey());
    setStep(proStillValid ? 3 : 2);
  };

  const fetchSlots = useCallback(async () => {
    if (!serviceId || !dateStr) return;
    setLoadingSlots(true);
    setSlotsError(null);
    try {
      const qs = new URLSearchParams({
        serviceId,
        date: dateStr,
        professionalId,
      });
      const res = await fetch(`/api/v1/bookings/availability?${qs.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSlots([]);
        setSlotsError(data.error || "No se pudo consultar la disponibilidad.");
        return;
      }
      if (!data.bookingReady) {
        setSlots([]);
        setSlotsError(
          data.standbyReason || "Disponibilidad pendiente de configuración."
        );
        return;
      }
      const nextSlots: SlotOption[] = data.slots || [];
      setSlots(nextSlots);
      setSelectedSlot((prev) =>
        prev && nextSlots.some((s) => s.time === prev.time) ? prev : null
      );
    } catch {
      setSlotsError("Error de conexión al consultar horarios disponibles.");
    } finally {
      setLoadingSlots(false);
    }
  }, [serviceId, dateStr, professionalId]);

  useEffect(() => {
    if (step === 3 && bookingEnabled && serviceId) {
      fetchSlots();
    }
  }, [step, bookingEnabled, serviceId, fetchSlots]);

  const groupedSlots = useMemo(() => {
    const morning: SlotOption[] = [];
    const midday: SlotOption[] = [];
    const afternoon: SlotOption[] = [];
    for (const s of slots) {
      const hour = Number(s.time.slice(0, 2));
      if (hour < 14) morning.push(s);
      else if (hour < 17) midday.push(s);
      else afternoon.push(s);
    }
    return [
      { label: "Mañana", items: morning },
      { label: "Mediodía", items: midday },
      { label: "Tarde", items: afternoon },
    ].filter((g) => g.items.length > 0);
  }, [slots]);

  if (!bookingEnabled || services.length === 0) {
    return (
      <div className="rounded-editorial border border-border bg-card p-10 text-center shadow-subtle sm:p-14">
        <Sparkles className="mx-auto h-8 w-8 text-muted-foreground" />
        <h2 className="mt-4 font-serif text-3xl text-foreground">
          {cms.standbyTitle || "Reservas online próximamente"}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {cms.standbyDescription ||
            "Estamos ultimando la configuración oficial de servicios, profesionales y horarios en ESPACIO Q Madrid."}
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/contacto">Contactar con el salón</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/servicios">Ver carta de servicios</Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleConfirmBooking = async () => {
    if (!selectedService || !selectedSlot) return;
    setSubmitError(null);
    setConflictAlternatives([]);

    if (!termsAccepted) {
      setSubmitError(
        "Debes aceptar las Condiciones de Reserva y la Política de Privacidad."
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedService.id,
          professionalId,
          dateStr,
          startTime: selectedSlot.time,
          customerName,
          customerEmail,
          customerPhone,
          customerNotes,
          couponCode: appliedCoupon?.code || "",
          termsAccepted,
          marketingOptIn,
          idempotencyKey,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409) {
        setSubmitError(
          data.error ||
            "La hora seleccionada acaba de ocuparse. Elige una franja alternativa."
        );
        setConflictAlternatives(data.alternatives || []);
        setIdempotencyKey(makeIdemKey());
        return;
      }
      if (!res.ok) {
        setSubmitError(data.error || "No se pudo confirmar tu reserva.");
        return;
      }

      setConfirmedAppt({
        ...data.appointment,
        manageUrl: data.manageUrl || null,
      });
      setStep(6);
    } catch {
      setSubmitError(
        "Error de red al confirmar. Puedes pulsar de nuevo con seguridad (protección anti-duplicados activa)."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const stepLabels = [
    "1. Servicio",
    "2. Profesional",
    "3. Fecha y hora",
    "4. Tus datos",
    "5. Revisión",
  ];

  return (
    <div ref={wizardRef} data-slot="booking-wizard-active" data-testid="booking-wizard" className="space-y-8">
      {step < 6 && (
        <div className="space-y-4">
          <ol
            aria-label="Pasos de la reserva"
            className="no-scrollbar flex items-center gap-2 overflow-x-auto whitespace-nowrap border-b border-border pb-3.5 text-xs sm:flex-wrap sm:whitespace-normal sm:pb-4"
          >
            {stepLabels.map((label, idx) => {
              const sNum = (idx + 1) as 1 | 2 | 3 | 4 | 5;
              const active = step === sNum;
              const completed = step > sNum;
              return (
                <li
                  key={label}
                  className={`shrink-0 rounded-full border px-3 py-1.5 font-medium sm:px-3.5 ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : completed
                        ? "border-border bg-accent text-foreground"
                        : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  {label}
                </li>
              );
            })}
          </ol>

          {/* Barra de Cupón Promocional / Black Friday */}
          <div
            data-slot="booking-coupon-widget"
            className={cn(
              "rounded-2xl border p-3.5 transition-colors sm:px-4 sm:py-3.5",
              appliedCoupon
                ? "border-primary bg-accent"
                : "border-border bg-card"
            )}
          >
            {appliedCoupon ? (
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 text-xs sm:text-sm">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <TicketPercent className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-medium text-foreground">
                      Cupón{" "}
                      <span className="font-serif tracking-wider">
                        {appliedCoupon.code}
                      </span>{" "}
                      aplicado ·{" "}
                      <strong>{`−${appliedCoupon.discountPercent} % Black Friday`}</strong>
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Descuento reflejado automáticamente en todos los servicios.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveCoupon}
                  className="h-9 px-3 text-xs text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Quitar cupón</span>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-foreground">
                    <TicketPercent
                      className="h-4 w-4 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <label htmlFor="bk-coupon-top">
                      ¿Tienes un cupón de descuento?
                    </label>
                    {BLACK_FRIDAY_PROMO.enabled && (
                      <button
                        type="button"
                        onClick={() => handleApplyCoupon(BLACK_FRIDAY_PROMO.code)}
                        className="rounded-full border border-border bg-background px-2.5 py-0.5 text-[11px] font-semibold tracking-wider text-foreground transition-colors hover:bg-accent"
                      >
                        Usar {BLACK_FRIDAY_PROMO.code} (−
                        {BLACK_FRIDAY_PROMO.discountPercent} %)
                      </button>
                    )}
                  </div>

                  <div className="flex w-full items-center gap-2 sm:w-auto">
                    <Input
                      id="bk-coupon-top"
                      type="text"
                      placeholder="Ej.: BLACKQ25"
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value.toUpperCase());
                        if (couponError) setCouponError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleApplyCoupon();
                        }
                      }}
                      className="h-10 min-w-0 flex-1 font-mono text-base uppercase tracking-wider sm:h-9 sm:w-40 sm:text-xs"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleApplyCoupon()}
                      className="h-10 shrink-0 px-3.5 text-xs sm:h-9"
                    >
                      Aplicar
                    </Button>
                  </div>
                </div>
                {couponError && (
                  <p role="alert" className="text-xs text-destructive">
                    {couponError}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PASO 1: Elegir Servicio */}
      {step === 1 && (
        <div className="space-y-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="font-serif text-2xl">1. Selecciona el servicio</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Elige uno de nuestros {services.length} rituales o filtra por capítulo.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                aria-label="Buscar servicio para reservar"
                placeholder="Buscar corte, balayage, head spa..."
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {professionalId !== "any" && selectedProfessional && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-accent/70 px-4 py-3 text-xs">
              <span className="inline-flex items-center gap-2 font-medium text-foreground">
                <UserCheck className="h-4 w-4 text-primary" />
                <span>
                  Mostrando rituales realizados por{" "}
                  <strong>{selectedProfessional.name}</strong>
                </span>
              </span>
              <button
                type="button"
                onClick={() => setProfessionalId("any")}
                className="inline-flex items-center gap-1 font-medium text-muted-foreground underline hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
                <span>Ver todos los especialistas</span>
              </button>
            </div>
          )}

          {categoryNames.length > 1 && (
            <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setActiveCategoryFilter("all")}
                className={cn(
                  "min-h-[36px] shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                  activeCategoryFilter === "all"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                )}
              >
                Todos
              </button>
              {categoryNames.map((catName) => (
                <button
                  key={catName}
                  type="button"
                  onClick={() => setActiveCategoryFilter(catName)}
                  className={cn(
                    "min-h-[36px] shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                    activeCategoryFilter === catName
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  )}
                >
                  {catName}
                </button>
              ))}
            </div>
          )}

          {filteredStep1Services.length === 0 ? (
            <div className="rounded-editorial border border-border bg-card p-8 text-center shadow-subtle">
              <p className="font-serif text-xl text-foreground">
                No hay servicios que coincidan con la búsqueda
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setServiceSearch("");
                  setActiveCategoryFilter("all");
                  setProfessionalId("any");
                }}
              >
                Mostrar todos los servicios
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border rounded-editorial border border-border bg-card shadow-subtle">
              {filteredStep1Services.map((svc) => (
                <div
                  key={svc.id}
                  className="flex flex-col justify-between gap-4 p-5 transition-colors hover:bg-accent/35 sm:flex-row sm:items-center sm:p-6"
                >
                  <div className="max-w-xl space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{svc.categoryName}</Badge>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" /> {svc.durationMin} min
                      </span>
                    </div>
                    <h3 className="font-serif text-xl font-medium">{svc.name}</h3>
                    <p className="text-xs text-muted-foreground sm:text-sm">
                      {svc.shortDescription}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 sm:flex-col sm:items-end">
                    <div className="flex flex-col sm:items-end">
                      {appliedCoupon && svc.priceCents !== null ? (
                        <>
                          <span className="text-xs text-muted-foreground line-through">
                            {formatPrice(svc.priceType, svc.priceCents, svc.currency)}
                          </span>
                          <span className="font-serif text-lg font-medium text-foreground sm:whitespace-nowrap sm:text-xl">
                            {formatPrice(
                              svc.priceType,
                              calculateDiscountedCents(
                                svc.priceCents,
                                appliedCoupon.discountPercent
                              ),
                              svc.currency
                            )}
                          </span>
                        </>
                      ) : (
                        <span className="font-serif text-lg font-medium sm:whitespace-nowrap sm:text-xl">
                          {formatPrice(svc.priceType, svc.priceCents, svc.currency)}
                        </span>
                      )}
                      {appliedCoupon && svc.priceCents === null && (
                        <span className="text-[11px] font-medium text-primary">
                          −{appliedCoupon.discountPercent} % sobre presupuesto
                        </span>
                      )}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleSelectService(svc.id)}
                    >
                      Seleccionar <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PASO 2: Elegir Profesional */}
      {step === 2 && selectedService && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl">2. Elige profesional</h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setStep(1)}
            >
              <ArrowLeft className="h-4 w-4" /> Cambiar servicio
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                setProfessionalId("any");
                setSelectedSlot(null);
                setIdempotencyKey(makeIdemKey());
                setStep(3);
              }}
              className={`flex flex-col items-start rounded-editorial border p-5 text-left transition-colors ${
                professionalId === "any"
                  ? "border-primary bg-accent"
                  : "border-border bg-card hover:bg-accent/50"
              }`}
            >
              <Badge variant="secondary">Máxima disponibilidad</Badge>
              <p className="mt-2 font-serif text-xl font-medium">
                {cms.anyProfessionalLabel ||
                  "Cualquier profesional disponible"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {cms.anyProfessionalDescription ||
                  "Se asignará automáticamente un especialista habilitado en la hora elegida."}
              </p>
            </button>

            {selectedService.professionals.map((pro) => (
              <button
                key={pro.id}
                type="button"
                onClick={() => {
                  setProfessionalId(pro.id);
                  setSelectedSlot(null);
                  setIdempotencyKey(makeIdemKey());
                  setStep(3);
                }}
                className={`flex flex-col items-start rounded-editorial border p-5 text-left transition-colors ${
                  professionalId === pro.id
                    ? "border-primary bg-accent"
                    : "border-border bg-card hover:bg-accent/50"
                }`}
              >
                <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
                  <UserCheck className="h-3.5 w-3.5" /> {pro.roleTitle}
                </span>
                <p className="mt-1.5 font-serif text-xl font-medium">
                  {pro.name}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Duración: {pro.customDurationMin ?? selectedService.durationMin}{" "}
                  min ·{" "}
                  {appliedCoupon &&
                  (pro.customPriceCents ?? selectedService.priceCents) !== null ? (
                    <>
                      <span className="line-through opacity-75">
                        {formatPrice(
                          selectedService.priceType,
                          pro.customPriceCents ?? selectedService.priceCents,
                          selectedService.currency
                        )}
                      </span>{" "}
                      <strong className="text-foreground">
                        {formatPrice(
                          selectedService.priceType,
                          calculateDiscountedCents(
                            pro.customPriceCents ?? selectedService.priceCents,
                            appliedCoupon.discountPercent
                          ),
                          selectedService.currency
                        )}
                      </strong>
                    </>
                  ) : (
                    formatPrice(
                      selectedService.priceType,
                      pro.customPriceCents ?? selectedService.priceCents,
                      selectedService.currency
                    )
                  )}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* PASO 3: Fecha y Hora Disponible */}
      {step === 3 && selectedService && (
        <div className="space-y-6 rounded-editorial border border-border bg-card p-4 shadow-subtle sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl">
                3. Selecciona fecha y hora disponible
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Horario de atención: Martes a Viernes 10:30–21:00 · Sábados 09:00–16:00 · Domingos y Lunes cerrado
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setStep(2)}
            >
              <ArrowLeft className="h-4 w-4" /> Volver a profesional
            </Button>
          </div>

          {upcomingOpenDays.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Próximos días abiertos
              </p>
              <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
                {upcomingOpenDays.map((dayOpt) => {
                  const isSelectedDay = dateStr === dayOpt.dateStr;
                  return (
                    <button
                      key={dayOpt.dateStr}
                      type="button"
                      onClick={() => {
                        setDateStr(dayOpt.dateStr);
                        setSelectedSlot(null);
                        setIdempotencyKey(makeIdemKey());
                      }}
                      className={cn(
                        "flex min-h-[52px] shrink-0 flex-col items-start justify-center rounded-xl border px-3.5 py-2 text-left transition-colors",
                        isSelectedDay
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background hover:bg-accent"
                      )}
                    >
                      <span className="text-xs font-semibold">
                        {dayOpt.shortLabel}
                      </span>
                      <span
                        className={cn(
                          "text-[11px]",
                          isSelectedDay
                            ? "text-primary-foreground/80"
                            : "text-muted-foreground"
                        )}
                      >
                        {dayOpt.hoursLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="w-full max-w-xs space-y-1.5">
            <Label htmlFor="booking-date-input">Otra fecha en calendario (Madrid)</Label>
            <Input
              id="booking-date-input"
              type="date"
              min={minDateStr || defaultDateStr}
              max={maxDateStr}
              value={dateStr}
              onChange={(e) => {
                setDateStr(e.target.value);
                setSelectedSlot(null);
                setIdempotencyKey(makeIdemKey());
              }}
            />
          </div>

          <div className="space-y-4">
            <p className="text-sm font-medium">
              Horas libres para {selectedService.name} ({effectiveDuration} min)
              {selectedProfessional ? ` con ${selectedProfessional.name}` : ""}:
            </p>
            {loadingSlots ? (
              <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Calculando disponibilidad real en el servidor…</span>
              </div>
            ) : slotsError ? (
              <p role="alert" className="text-sm text-destructive">
                {slotsError}
              </p>
            ) : slots.length === 0 ? (
              <div className="space-y-3 rounded-lg border border-border bg-background p-4 text-sm text-muted-foreground">
                <p>
                  No hay franjas disponibles en la fecha seleccionada (recuerda que domingos y lunes el salón permanece cerrado).
                </p>
                {upcomingOpenDays.length > 0 && dateStr !== upcomingOpenDays[0].dateStr && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDateStr(upcomingOpenDays[0].dateStr);
                      setSelectedSlot(null);
                      setIdempotencyKey(makeIdemKey());
                    }}
                  >
                    Ir al próximo día abierto ({upcomingOpenDays[0].shortLabel})
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {groupedSlots.map((grp) => (
                  <div key={grp.label} className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      {grp.label}
                    </p>
                    <div className="grid grid-cols-2 gap-2.5 min-[380px]:grid-cols-3 sm:grid-cols-5 md:grid-cols-6">
                      {grp.items.map((slot) => {
                        const isChosen = selectedSlot?.time === slot.time;
                        return (
                          <button
                            key={slot.time}
                            type="button"
                            onClick={() => {
                              setSelectedSlot(slot);
                              setIdempotencyKey(makeIdemKey());
                            }}
                            className={`min-h-[44px] rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                              isChosen
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-background hover:bg-accent"
                            }`}
                          >
                            {slot.time}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              className="w-full sm:w-auto"
              disabled={!selectedSlot}
              onClick={() => setStep(4)}
            >
              Continuar con mis datos <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* PASO 4: Datos del Cliente */}
      {step === 4 && selectedService && selectedSlot && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setStep(5);
          }}
          className="space-y-5 rounded-editorial border border-border bg-card p-4 shadow-subtle sm:p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-serif text-xl sm:text-2xl">4. Tus datos de contacto</h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setStep(3)}
            >
              <ArrowLeft className="h-4 w-4" /> Cambiar hora
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="bk-name">Nombre y apellidos *</Label>
              <Input
                id="bk-name"
                required
                minLength={2}
                autoComplete="name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bk-phone">Teléfono móvil *</Label>
              <Input
                id="bk-phone"
                type="tel"
                required
                minLength={6}
                autoComplete="tel"
                placeholder="+34 600 000 000"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bk-email">
              Correo electrónico *{" "}
              <span className="text-xs font-normal text-muted-foreground">
                (para enviarte confirmación y enlace seguro de gestión)
              </span>
            </Label>
            <Input
              id="bk-email"
              type="email"
              required
              autoComplete="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bk-notes">
              Observación breve sobre el servicio (opcional)
            </Label>
            <Textarea
              id="bk-notes"
              maxLength={400}
              rows={3}
              placeholder="Ej.: preferencia de estilo o detalle técnico a tener en cuenta (no incluyas datos médicos sensibles)."
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" className="w-full sm:w-auto">
              Revisar mi cita <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </form>
      )}

      {/* PASO 5: Revisión y Confirmación */}
      {step === 5 && selectedService && selectedSlot && (
        <div className="space-y-6 rounded-editorial border border-border bg-card p-4 shadow-subtle sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-serif text-xl sm:text-2xl">5. Revisa y confirma tu cita</h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setStep(4)}
            >
              <ArrowLeft className="h-4 w-4" /> Editar datos
            </Button>
          </div>

          <dl className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-background/70 p-4 text-sm sm:grid-cols-2 sm:p-5">
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                Servicio
              </dt>
              <dd className="mt-0.5 font-medium">{selectedService.name}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                Profesional
              </dt>
              <dd className="mt-0.5 font-medium">
                {selectedProfessional
                  ? selectedProfessional.name
                  : "Asignación automática (profesional disponible)"}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                Fecha y hora (Madrid)
              </dt>
              <dd className="mt-0.5 font-medium">
                {dateStr} · {selectedSlot.time} – {selectedSlot.endTime} (
                {effectiveDuration} min)
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                Importe (pago en salón)
              </dt>
              <dd className="mt-0.5 font-medium">
                {appliedCoupon && effectivePriceCents !== null ? (
                  <span className="inline-flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground line-through">
                      {formatPrice(
                        selectedService.priceType,
                        effectivePriceCents,
                        selectedService.currency
                      )}
                    </span>
                    <strong className="text-foreground">
                      {formatPrice(
                        selectedService.priceType,
                        discountedEffectivePriceCents,
                        selectedService.currency
                      )}
                    </strong>
                    <Badge variant="secondary" className="text-[11px]">
                      −{appliedCoupon.discountPercent} % ({appliedCoupon.code})
                    </Badge>
                  </span>
                ) : (
                  <span className="inline-flex flex-wrap items-center gap-2">
                    <span>
                      {formatPrice(
                        selectedService.priceType,
                        effectivePriceCents,
                        selectedService.currency
                      )}
                    </span>
                    {appliedCoupon && (
                      <Badge variant="secondary" className="text-[11px]">
                        −{appliedCoupon.discountPercent} % ({appliedCoupon.code})
                      </Badge>
                    )}
                  </span>
                )}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                Persona de contacto
              </dt>
              <dd className="mt-0.5 break-words">
                {customerName} · {customerEmail} · {customerPhone}
              </dd>
            </div>
          </dl>

          <p className="rounded-lg border border-border bg-accent/60 p-3.5 text-xs leading-relaxed text-muted-foreground">
            {(
              cms.cancellationSummary ||
              "Puedes cancelar o reprogramar sin coste hasta con {{cancellationFreeHours}} horas de antelación desde el enlace seguro que recibirás por email."
            ).replace(
              "{{cancellationFreeHours}}",
              String(cancellationFreeHours)
            )}
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-2.5">
              <input
                id="bk-terms"
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0"
              />
              <label
                htmlFor="bk-terms"
                className="text-xs leading-relaxed text-muted-foreground"
              >
                {cms.termsAcceptLabel ||
                  "He leído y acepto las Condiciones de Reserva y la Política de Privacidad para tramitar mi cita."}{" "}
                (
                <Link
                  href="/condiciones-reserva"
                  target="_blank"
                  className="font-medium text-foreground underline"
                >
                  Condiciones de Reserva
                </Link>{" "}
                ·{" "}
                <Link
                  href="/privacidad"
                  target="_blank"
                  className="font-medium text-foreground underline"
                >
                  Política de Privacidad
                </Link>
                )
              </label>
            </div>

            <div className="flex items-start gap-2.5">
              <input
                id="bk-marketing"
                type="checkbox"
                checked={marketingOptIn}
                onChange={(e) => setMarketingOptIn(e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0"
              />
              <label
                htmlFor="bk-marketing"
                className="text-xs leading-relaxed text-muted-foreground"
              >
                {cms.marketingOptInLabel ||
                  "Deseo suscribirme a la newsletter de ESPACIO Q (opcional, requiere confirmación por email)."}
              </label>
            </div>
          </div>

          {submitError && (
            <div
              role="alert"
              className="space-y-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{submitError}</span>
              </div>
              {conflictAlternatives.length > 0 && (
                <div className="space-y-2 pt-1">
                  <p className="text-xs font-semibold text-foreground">
                    Franjas alternativas disponibles hoy ({dateStr}):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {conflictAlternatives.map((alt) => (
                      <Button
                        key={alt.time}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedSlot(alt);
                          setSubmitError(null);
                          setConflictAlternatives([]);
                        }}
                      >
                        Elegir {alt.time}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              type="button"
              size="lg"
              className="w-full sm:w-auto"
              disabled={submitting}
              onClick={handleConfirmBooking}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Calendar className="h-4 w-4" />
              )}
              Confirmar reserva
            </Button>
          </div>
        </div>
      )}

      {/* PASO 6: Resultado Final */}
      {step === 6 && confirmedAppt && (
        <div
          role="status"
          className="space-y-6 rounded-editorial border border-border bg-card p-5 shadow-editorial sm:p-8"
        >
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-1 h-7 w-7 shrink-0 text-success" />
            <div>
              <Badge
                variant={
                  confirmedAppt.status === "CONFIRMED" ? "success" : "warning"
                }
              >
                {confirmedAppt.status === "CONFIRMED"
                  ? "Cita confirmada"
                  : "Solicitud pendiente de confirmación"}
              </Badge>
              <h2 className="mt-2 font-serif text-3xl">
                {confirmedAppt.status === "CONFIRMED"
                  ? "Tu cita está reservada"
                  : "Hemos recibido tu solicitud de cita"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Código de referencia:{" "}
                <strong className="text-foreground">
                  {confirmedAppt.referenceCode}
                </strong>
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background/80 p-5 text-sm space-y-1.5">
            <p>
              <strong>Servicio:</strong> {confirmedAppt.serviceName} (
              {confirmedAppt.durationMin} min)
            </p>
            <p>
              <strong>Profesional:</strong> {confirmedAppt.professionalName}
            </p>
            <p>
              <strong>Fecha y hora:</strong> {confirmedAppt.dateStrMadrid} ·{" "}
              {confirmedAppt.startTimeMadrid} – {confirmedAppt.endTimeMadrid}
            </p>
            <p className="flex flex-wrap items-center gap-2">
              <strong>Importe:</strong>{" "}
              {confirmedAppt.appliedCoupon &&
                confirmedAppt.appliedCoupon.originalPriceCents !== null && (
                  <span className="text-xs text-muted-foreground line-through">
                    {formatPrice(
                      confirmedAppt.priceType,
                      confirmedAppt.appliedCoupon.originalPriceCents,
                      confirmedAppt.currency
                    )}
                  </span>
                )}
              <span>
                {formatPrice(
                  confirmedAppt.priceType,
                  confirmedAppt.priceCents,
                  confirmedAppt.currency
                )}
              </span>
              {confirmedAppt.appliedCoupon && (
                <Badge variant="secondary">
                  Cupón {confirmedAppt.appliedCoupon.code} (−
                  {confirmedAppt.appliedCoupon.discountPercent} % Black Friday)
                </Badge>
              )}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {confirmedAppt.manageUrl && (
              <Button asChild>
                <Link href={confirmedAppt.manageUrl}>
                  Gestionar o reprogramar mi cita
                </Link>
              </Button>
            )}
            <Button asChild variant="outline">
              <Link href="/">Volver al inicio</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
