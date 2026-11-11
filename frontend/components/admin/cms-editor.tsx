"use client";

import React, { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  History,
  ImageIcon,
  Loader2,
  Monitor,
  Plus,
  RotateCcw,
  Save,
  Send,
  Smartphone,
  Tablet,
  Trash2,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  discardDraftAction,
  restoreRevisionAction,
  saveCmsBlockAction,
} from "@/app/admin/contenido/actions";

export type PickerAsset = {
  id: string;
  src: string;
  altText: string;
  internalName: string;
  category: string;
  focalPointX: number;
  focalPointY: number;
  isProvisional: boolean;
};

type Json = any;

/* ---------- Etiquetas legibles en español ---------- */
const LABELS: Record<string, string> = {
  directions: "Cómo llegar (bajo el mapa; deja vacío un apartado para ocultarlo)", metro: "Metro", bus: "Autobús", parking: "Aparcamiento",
  brandName: "Nombre de marca", brandSubtitle: "Subtítulo de marca", ctaLabel: "Texto del botón", ctaHref: "Enlace del botón",
  newsletterTriggerLabel: "Texto del acceso a newsletter", navItems: "Elementos de navegación", label: "Texto", href: "Enlace",
  visible: "Visible", footerTagline: "Frase del pie", footerCopyright: "Texto de copyright", legalLinks: "Enlaces legales del pie",
  eyebrow: "Antetítulo", title: "Título", subtitle: "Subtítulo", description: "Descripción", primaryCta: "Botón principal",
  secondaryCta: "Botón secundario", discoverLabel: "Texto del ancla «Descubrir»", animationEnabled: "Animación 3D activada",
  photos: "Fotografías del hero", src: "Imagen", alt: "Texto alternativo (accesibilidad)", caption: "Pie de foto",
  focalPoint: "Punto focal (%)", x: "Horizontal", y: "Vertical", order: "Orden", intro: "Introducción (2.ª sección)", lead: "Entradilla",
  body: "Cuerpo", quote: "Cita destacada", imageUrl: "Imagen", imageAlt: "Texto alternativo de la imagen",
  flipImages: "Galería Flip 3D · Imágenes del salón (enlaces externos HTTPS)", url: "Enlace externo de imagen (https://...) o biblioteca",
  featuredServices: "Servicios destacados", emptyStateMessage: "Mensaje si no hay datos", experience: "Experiencia del salón (4.ª sección)",
  pillars: "Pasos de atención (interactivos)", badge: "Etiqueta breve del paso", teamSection: "Sección de equipo",
  showcaseMembers: "Equipo en escaparate interactivo (provisionales o definitivos · enlaces externos HTTPS)",
  provisionalNote: "Nota informativa opcional bajo el equipo",
  name: "Nombre completo", role: "Cargo o especialidad principal", specialty: "Descripción breve de especialidad",
  instagramHref: "Enlace a Instagram (opcional)", linkedinHref: "Enlace a LinkedIn (opcional)",
  gallerySection: "Sección de galería",
  railItems: "Galería colgante · Peinados y cortes realizados (enlaces externos HTTPS)",
  railEyebrow: "Antetítulo del riel interactivo", railTitle: "Título del riel interactivo", railCaption: "Texto guía bajo el riel",
  archiveTitle: "Título del archivo fotográfico adicional",
  technique: "Técnica o especialidad realizada", categoryTag: "Etiqueta breve bajo el marco (ej. Corte, Peinado, Luz)",
  frame: "Moldura del marco", aspect: "Proporción ancho/alto (ej. 0.8 vertical, 1 cuadrado, 1.25 horizontal)",
  mat: "Incluir paspartú biselado", details: "Notas de acabado y mantenimiento (ficha trasera)",
  reviewsSection: "Reseñas (solo verificadas)",
  sourceNote: "Nota de procedencia", items: "Elementos", author: "Autor/a", text: "Texto", date: "Fecha", faqSection: "Preguntas frecuentes",
  question: "Pregunta", answer: "Respuesta", locationSection: "Ubicación y CTA final", mapLinkLabel: "Texto del enlace a Maps",
  bookingCtaTitle: "Título del CTA de reserva", bookingCtaDescription: "Descripción del CTA de reserva", bookingCtaLabel: "Botón del CTA de reserva",
  searchPlaceholder: "Texto del buscador", pricingNotice: "Nota sobre precios", emptyCatalogTitle: "Título sin catálogo",
  emptyCatalogDescription: "Descripción sin catálogo", bottomCtaTitle: "Título del CTA inferior", bottomCtaDescription: "Descripción del CTA inferior",
  bottomCtaLabel: "Botón del CTA inferior", bottomCtaHref: "Enlace del CTA inferior", philosophyTitle: "Título de filosofía",
  philosophyBody: "Texto de filosofía", emptyTeamTitle: "Título sin equipo", emptyTeamDescription: "Descripción sin equipo",
  provisionalBannerText: "Aviso de imágenes provisionales", formTitle: "Título del formulario", formSubtitle: "Subtítulo del formulario",
  privacyConsentLabel: "Texto de consentimiento de privacidad", submitButtonLabel: "Texto del botón de envío", successTitle: "Título de éxito",
  successDescription: "Descripción de éxito", standbyTitle: "Título «Reservas próximamente»", standbyDescription: "Descripción «Reservas próximamente»",
  anyProfessionalLabel: "Texto «Cualquier profesional»", anyProfessionalDescription: "Descripción «Cualquier profesional»",
  cancellationSummary: "Resumen de cancelación", marketingOptInLabel: "Casilla opcional de newsletter", termsAcceptLabel: "Casilla de aceptación de condiciones",
  enabled: "Activado", openMode: "Modo de apertura", delaySeconds: "Retraso (segundos)", scrollPercent: "Profundidad de lectura (%)",
  cooldownDays: "Días sin volver a mostrar", promoText: "Texto promocional (solo ofertas aprobadas)", inputPlaceholder: "Placeholder del email",
  firstNamePlaceholder: "Placeholder del nombre", consentLabel: "Texto de consentimiento", submitLabel: "Texto del botón",
  submittingLabel: "Texto mientras se envía", pendingTitle: "Título «pendiente de verificación»", pendingDescription: "Descripción «pendiente de verificación»",
  confirmedTitle: "Título «confirmada»", confirmedDescription: "Descripción «confirmada»", footerTitle: "Título en el pie", footerDescription: "Descripción en el pie",
  acceptAllLabel: "Botón «Aceptar»", rejectAllLabel: "Botón «Rechazar»", configureLabel: "Botón «Configurar»", savePreferencesLabel: "Botón «Guardar preferencias»",
  necessaryTitle: "Título cookies necesarias", necessaryDescription: "Descripción cookies necesarias", analyticsTitle: "Título cookies analíticas",
  analyticsDescription: "Descripción cookies analíticas", marketingTitle: "Título cookies de terceros/marketing", marketingDescription: "Descripción cookies de terceros/marketing",
  lastUpdated: "Fecha de última actualización", sections: "Cláusulas", heading: "Título de la cláusula", content: "Texto de la cláusula",
};

const HIDDEN_KEYS = new Set(["id", "assetId", "slug"]);
const LONG_TEXT = /(description|body|content|intro|answer|lead|text|quote|tagline|notice|summary|railCaption|specialty|label$|^metro$|^bus$|^parking$)/i;
const ENUMS: Record<string, Array<{ value: string; label: string }>> = {
  openMode: [
    { value: "manual", label: "Manual (solo al pulsar)" },
    { value: "timer", label: "Por tiempo" },
    { value: "scroll", label: "Por profundidad de lectura" },
  ],
  frame: [
    { value: "oak", label: "Madera de roble" },
    { value: "white", label: "Blanco lino" },
    { value: "black", label: "Grafito oscuro" },
  ],
};

function humanize(key: string) {
  return LABELS[key] ?? key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function templateFor(path: string[], sample: Json): Json {
  const joined = path.join(".");
  if (joined.endsWith("flipImages")) return { title: "Vista del salón ESPACIO Q", url: "" };
  if (joined.endsWith("photos")) return { id: uid("hero-photo"), assetId: "", src: "", alt: "", caption: "", focalPoint: { x: 50, y: 50 }, order: 0 };
  if (joined.endsWith("sections")) return { id: uid("clausula"), heading: "Nueva cláusula", content: "" };
  if (joined.includes("reviewsSection") && joined.endsWith("items")) return { author: "", text: "", date: "" };
  if (joined.includes("faqSection") && joined.endsWith("items")) return { question: "", answer: "" };
  if (joined === "items") return { question: "Nueva pregunta", answer: "" };
  if (joined.endsWith("navItems") || joined.endsWith("legalLinks")) return { label: "", href: "/", visible: true };
  if (joined.endsWith("pillars")) return { title: "", badge: "", description: "", url: "" };
  if (joined.endsWith("showcaseMembers")) {
    return {
      id: uid("team"),
      name: "Nuevo integrante",
      role: "ESPECIALISTA CAPILAR",
      specialty: "",
      url: "",
      instagramHref: "",
      linkedinHref: "",
    };
  }
  if (joined.endsWith("railItems")) {
    return {
      id: uid("look"),
      title: "Nuevo corte o peinado",
      technique: "Estilismo personalizado",
      categoryTag: "Corte & Estilo",
      description: "",
      url: "",
      frame: "oak",
      aspect: 0.8,
      mat: true,
      details: ["Acabado natural adaptado en salón"],
    };
  }
  const blank = (v: Json): Json => {
    if (typeof v === "string") return "";
    if (typeof v === "number") return 0;
    if (typeof v === "boolean") return true;
    if (Array.isArray(v)) return [];
    if (v && typeof v === "object") {
      const o: Record<string, Json> = {};
      for (const [k, val] of Object.entries(v)) o[k] = k === "id" ? uid("item") : blank(val);
      return o;
    }
    return "";
  };
  return sample !== undefined ? blank(sample) : "";
}

function setIn(obj: Json, path: (string | number)[], value: Json): Json {
  if (path.length === 0) return value;
  const [head, ...rest] = path;
  const clone: Json = Array.isArray(obj) ? [...obj] : { ...(obj ?? {}) };
  clone[head as any] = setIn(clone[head as any], rest, value);
  return clone;
}

/* ---------- Selector de imágenes de la biblioteca ---------- */
function MediaPicker({
  open,
  onOpenChange,
  assets,
  onPick,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  assets: PickerAsset[];
  onPick: (a: PickerAsset) => void;
}) {
  const [filter, setFilter] = useState("");
  const filtered = assets.filter(
    (a) => !filter || `${a.internalName} ${a.altText} ${a.category}`.toLowerCase().includes(filter.toLowerCase())
  );
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Biblioteca multimedia</DialogTitle>
          <DialogDescription>
            Elige una imagen. Para subir nuevas o añadir enlaces externos, usa el módulo Multimedia.
          </DialogDescription>
        </DialogHeader>
        <Input placeholder="Filtrar por nombre, alt o categoría…" value={filter} onChange={(e) => setFilter(e.target.value)} />
        <ul className="grid max-h-[55vh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 md:grid-cols-4">
          {filtered.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => {
                  onPick(a);
                  onOpenChange(false);
                }}
                className="group w-full overflow-hidden rounded-lg border border-border bg-card text-left focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="relative aspect-[4/5] bg-secondary">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.src} alt={a.altText} className="h-full w-full object-cover" />
                  {a.isProvisional && (
                    <span className="absolute left-1.5 top-1.5 rounded bg-card/90 px-1.5 py-0.5 text-[10px]">Provisional</span>
                  )}
                </div>
                <p className="truncate px-2 py-1.5 text-xs">{a.internalName}</p>
              </button>
            </li>
          ))}
          {filtered.length === 0 && <li className="col-span-full text-sm text-muted-foreground">Sin resultados.</li>}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Renderizado recursivo de campos ---------- */
type FieldProps = {
  value: Json;
  path: (string | number)[];
  keyName: string;
  onChange: (path: (string | number)[], value: Json) => void;
  assets: PickerAsset[];
  errors: string[];
};

function ImageField({
  value,
  id,
  onChangeValue,
  onPickAsset,
  assets,
}: {
  value: string;
  id: string;
  onChangeValue: (v: string) => void;
  onPickAsset: (a: PickerAsset) => void;
  assets: PickerAsset[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-lg border border-border bg-secondary">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <ImageIcon className="m-auto mt-10 h-6 w-6 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 space-y-2">
        <Input id={id} value={value} onChange={(e) => onChangeValue(e.target.value)} placeholder="https://enlace-externo-imagen.com/foto.jpg o /media/…" />
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
          <ImageIcon className="h-4 w-4" /> Elegir de la biblioteca
        </Button>
      </div>
      <MediaPicker open={open} onOpenChange={setOpen} assets={assets} onPick={onPickAsset} />
    </div>
  );
}

function FieldNode({ value, path, keyName, onChange, assets, errors }: FieldProps) {
  const id = `f-${path.join("-")}`;
  const label = humanize(keyName);

  if (typeof value === "boolean") {
    return (
      <label htmlFor={id} className="flex min-h-[40px] items-center gap-2.5 text-sm">
        <input id={id} type="checkbox" checked={value} onChange={(e) => onChange(path, e.target.checked)} className="h-4 w-4" />
        {label}
      </label>
    );
  }

  if (typeof value === "number") {
    return (
      <div className="space-y-1.5">
        <label htmlFor={id} className="text-sm font-medium">{label}</label>
        <Input
          id={id}
          type="number"
          step={keyName === "aspect" ? "0.05" : "any"}
          value={value}
          onChange={(e) => onChange(path, Number(e.target.value))}
          className="max-w-[160px]"
        />
      </div>
    );
  }

  if (typeof value === "string" || value === null) {
    const str = value ?? "";
    if (ENUMS[keyName]) {
      return (
        <div className="space-y-1.5">
          <label htmlFor={id} className="text-sm font-medium">{label}</label>
          <select id={id} value={str} onChange={(e) => onChange(path, e.target.value)} className="min-h-[44px] w-full rounded-lg border border-input bg-card px-3 text-base sm:text-sm">
            {ENUMS[keyName].map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      );
    }
    const long = LONG_TEXT.test(keyName) && !/^(ctaLabel|label|submitLabel|.*ButtonLabel|.*Label)$/.test(keyName)
      ? true
      : str.length > 90;
    const fieldErrors = errors.filter((e) => e.startsWith(path.join(".").replace(/\.(\d+)/g, (_, n) => `[${Number(n) + 1}]`)));
    return (
      <div className="space-y-1.5">
        <label htmlFor={id} className="text-sm font-medium">{label}</label>
        {long ? (
          <Textarea id={id} value={str} rows={keyName === "content" ? 10 : str.length > 240 ? 6 : 3} onChange={(e) => onChange(path, e.target.value)} aria-invalid={fieldErrors.length > 0} />
        ) : (
          <Input id={id} value={str} onChange={(e) => onChange(path, e.target.value)} aria-invalid={fieldErrors.length > 0} />
        )}
        {fieldErrors.map((e) => <p key={e} className="text-xs text-destructive">{e}</p>)}
      </div>
    );
  }

  if (Array.isArray(value)) {
    const isPrimitive = value.length > 0 && typeof value[0] !== "object";
    const move = (from: number, to: number) => {
      if (to < 0 || to >= value.length) return;
      const next = [...value];
      const [it] = next.splice(from, 1);
      next.splice(to, 0, it);
      onChange(path, next.map((x: Json, i: number) => (x && typeof x === "object" && "order" in x ? { ...x, order: i + 1 } : x)));
    };
    return (
      <fieldset className="space-y-3 rounded-editorial border border-border p-3 sm:p-4">
        <legend className="px-1 text-sm font-semibold">{label} <span className="font-normal text-muted-foreground">({value.length})</span></legend>
        {value.map((item: Json, i: number) => {
          const itemTitle = item && typeof item === "object" ? item.name || item.heading || item.label || item.title || item.question || item.alt || item.author || `Elemento ${i + 1}` : `Elemento ${i + 1}`;
          return (
            <div key={(item && item.id) || i} className="rounded-lg border border-border bg-background/60 p-3 sm:p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium">{i + 1}. {String(itemTitle).slice(0, 80)}</p>
                <div className="flex shrink-0 gap-1">
                  <Button type="button" variant="ghost" size="icon" aria-label="Subir" onClick={() => move(i, i - 1)} disabled={i === 0}><ArrowUp className="h-4 w-4" /></Button>
                  <Button type="button" variant="ghost" size="icon" aria-label="Bajar" onClick={() => move(i, i + 1)} disabled={i === value.length - 1}><ArrowDown className="h-4 w-4" /></Button>
                  <Button
                    type="button" variant="ghost" size="icon" aria-label="Eliminar"
                    onClick={() => { if (window.confirm("¿Eliminar este elemento?")) onChange(path, value.filter((_: Json, j: number) => j !== i)); }}
                  ><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
              {isPrimitive ? (
                <Input value={item} onChange={(e) => onChange([...path, i], e.target.value)} aria-label={`${label} ${i + 1}`} />
              ) : (
                <ObjectFields value={item} path={[...path, i]} onChange={onChange} assets={assets} errors={errors} />
              )}
            </div>
          );
        })}
        <Button
          type="button" variant="outline" size="sm"
          onClick={() => {
            const tpl = templateFor(path.map(String), value[0]);
            const withOrder = tpl && typeof tpl === "object" && "order" in tpl ? { ...tpl, order: value.length + 1 } : tpl;
            onChange(path, [...value, withOrder]);
          }}
        >
          <Plus className="h-4 w-4" /> Añadir
        </Button>
      </fieldset>
    );
  }

  if (value && typeof value === "object") {
    return (
      <fieldset className="space-y-4 rounded-editorial border border-border p-3 sm:p-4">
        <legend className="px-1 text-sm font-semibold">{label}</legend>
        <ObjectFields value={value} path={path} onChange={onChange} assets={assets} errors={errors} />
      </fieldset>
    );
  }
  return null;
}

function ObjectFields({ value, path, onChange, assets, errors }: Omit<FieldProps, "keyName">) {
  return (
    <div className="space-y-4">
      {Object.entries(value as Record<string, Json>).map(([k, v]) => {
        if (HIDDEN_KEYS.has(k)) return null;
        if ((k === "src" || k === "imageUrl" || k === "url") && (typeof v === "string" || v === null)) {
          const fieldPathLabel = [...path, k]
            .join(".")
            .replace(/\.(\d+)/g, (_, n) => `[${Number(n) + 1}]`);
          const fieldErrors = errors.filter((e) => e.startsWith(fieldPathLabel));
          return (
            <div key={k} className="space-y-1.5">
              <p className="text-sm font-medium">{humanize(k)}</p>
              <ImageField
                id={`f-${[...path, k].join("-")}`}
                value={v ?? ""}
                assets={assets}
                onChangeValue={(nv) => onChange([...path, k], nv)}
                onPickAsset={(a) => {
                  const next: Record<string, Json> = { ...(value as object), [k]: a.src };
                  if ("alt" in next) next.alt = a.altText;
                  if ("imageAlt" in next) next.imageAlt = a.altText;
                  if (
                    "title" in next &&
                    (!next.title ||
                      next.title === "Vista del salón ESPACIO Q" ||
                      next.title === "Nuevo corte o peinado")
                  ) {
                    next.title = a.altText || a.internalName;
                  }
                  if ("name" in next && (!next.name || next.name === "Nuevo integrante")) {
                    next.name = a.internalName || a.altText;
                  }
                  if ("assetId" in next) next.assetId = a.id;
                  if ("focalPoint" in next) next.focalPoint = { x: a.focalPointX, y: a.focalPointY };
                  onChange(path, next);
                }}
              />
              {fieldErrors.map((e) => (
                <p key={e} className="text-xs text-destructive">{e}</p>
              ))}
            </div>
          );
        }
        return <FieldNode key={k} value={v} keyName={k} path={[...path, k]} onChange={onChange} assets={assets} errors={errors} />;
      })}
    </div>
  );
}

/* ---------- Editor principal ---------- */
export function CmsEditor(props: {
  blockKey: string;
  title: string;
  category: string;
  previewPath: string;
  initialDraft: Json;
  seoTitle: string | null;
  seoDescription: string | null;
  hasUnpublished: boolean;
  version: number;
  revisions: Array<{ id: string; version: number; changeNote: string | null; createdBy: string | null; createdAt: string }>;
  assets: PickerAsset[];
  placeholders?: Array<{ token: string; description: string; value: string | null }>;
}) {
  const router = useRouter();
  const [data, setData] = useState<Json>(props.initialDraft);
  const [seoTitle, setSeoTitle] = useState(props.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(props.seoDescription ?? "");
  const [changeNote, setChangeNote] = useState("");
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [viewport, setViewport] = useState<"mobile" | "tablet" | "desktop">("desktop");
  const [previewNonce, setPreviewNonce] = useState(0);

  useEffect(() => {
    setData(props.initialDraft);
  }, [props.initialDraft]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const onChange = useCallback((path: (string | number)[], value: Json) => {
    setData((prev: Json) => setIn(prev, path, value));
    setDirty(true);
  }, []);

  const submit = (publish: boolean) => {
    if (publish && !window.confirm("¿Publicar estos cambios en la web pública?")) return;
    setMessage(null);
    setErrors([]);
    startTransition(async () => {
      const res = await saveCmsBlockAction({ key: props.blockKey, data, seoTitle, seoDescription, publish, changeNote });
      if (!res.ok) {
        setErrors(res.errors ?? []);
        setMessage({ type: "error", text: res.error ?? "No se pudo guardar." });
        return;
      }
      setDirty(false);
      setChangeNote("");
      setPreviewNonce((n) => n + 1);
      setMessage({ type: "ok", text: publish ? `Publicado (versión ${res.version}).` : "Borrador guardado. Puedes previsualizarlo de forma privada." });
      router.refresh();
    });
  };

  const previewUrl = useMemo(() => {
    const base = props.previewPath || "/";
    return `${base}${base.includes("?") ? "&" : "?"}preview=1&n=${previewNonce}`;
  }, [props.previewPath, previewNonce]);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <div className="min-w-0 space-y-6 xl:col-span-8">
        {props.placeholders && props.placeholders.length > 0 && (
          <div className="rounded-editorial border border-border bg-card p-4 text-xs">
            <p className="font-semibold">Variables disponibles en los textos legales</p>
            <p className="mt-1 text-muted-foreground">Se sustituyen automáticamente con los datos de Configuración. Si un dato falta, la web muestra un aviso «pendiente» en lugar de inventarlo.</p>
            <ul className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {props.placeholders.map((p) => (
                <li key={p.token} className="flex items-start justify-between gap-2">
                  <code className="rounded bg-secondary px-1.5 py-0.5">{p.token}</code>
                  <span className={p.value ? "text-right text-muted-foreground" : "text-right text-warning"}>{p.value || "Pendiente"}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-editorial border border-border bg-card p-4 sm:p-6">
          <ObjectFields value={data} path={[]} onChange={onChange} assets={props.assets} errors={errors} />
        </div>

        <div className="space-y-4 rounded-editorial border border-border bg-card p-4 sm:p-6">
          <h2 className="text-sm font-semibold">SEO de la página</h2>
          <div className="space-y-1.5">
            <label htmlFor="seo-title" className="text-sm font-medium">Título SEO <span className="text-xs text-muted-foreground">({seoTitle.length}/160)</span></label>
            <Input id="seo-title" value={seoTitle} maxLength={160} onChange={(e) => { setSeoTitle(e.target.value); setDirty(true); }} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="seo-desc" className="text-sm font-medium">Meta descripción <span className="text-xs text-muted-foreground">({seoDescription.length}/320)</span></label>
            <Textarea id="seo-desc" value={seoDescription} maxLength={320} rows={3} onChange={(e) => { setSeoDescription(e.target.value); setDirty(true); }} />
          </div>
        </div>
      </div>

      <aside className="min-w-0 xl:col-span-4 xl:self-start">
        <div className="space-y-4 xl:sticky xl:top-6 xl:max-h-[calc(100vh-3rem)] xl:overflow-y-auto">
          <div className="space-y-4 rounded-editorial border border-border bg-card p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={props.hasUnpublished || dirty ? "warning" : "success"}>
                {dirty ? "Cambios sin guardar" : props.hasUnpublished ? "Borrador sin publicar" : "Publicado"}
              </Badge>
              <span className="text-xs text-muted-foreground">Versión publicada v{props.version}</span>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="change-note" className="text-xs font-medium">Nota del cambio (opcional)</label>
              <Input id="change-note" value={changeNote} maxLength={300} onChange={(e) => setChangeNote(e.target.value)} placeholder="Ej.: actualizar datos fiscales" />
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Button type="button" variant="outline" onClick={() => submit(false)} disabled={pending}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Guardar borrador
              </Button>
              <Button
                type="button" variant="outline" disabled={pending || dirty}
                title={dirty ? "Guarda el borrador antes de previsualizar" : undefined}
                onClick={() => setPreviewOpen(true)}
              >
                <Eye className="h-4 w-4" /> Previsualizar (privado)
              </Button>
              <Button type="button" onClick={() => submit(true)} disabled={pending}>
                <Send className="h-4 w-4" /> Publicar
              </Button>
              {props.hasUnpublished && !dirty && (
                <Button
                  type="button" variant="ghost" size="sm" disabled={pending}
                  onClick={() => {
                    if (!window.confirm("¿Descartar el borrador y volver a la versión publicada?")) return;
                    startTransition(async () => { await discardDraftAction(props.blockKey); router.refresh(); });
                  }}
                >
                  <Undo2 className="h-4 w-4" /> Descartar borrador
                </Button>
              )}
            </div>
            {message && (
              <p role="status" className={message.type === "ok" ? "text-sm text-success" : "text-sm text-destructive"}>{message.text}</p>
            )}
            {errors.length > 0 && (
              <ul className="list-disc space-y-1 pl-5 text-xs text-destructive">
                {errors.slice(0, 8).map((e) => <li key={e}>{e}</li>)}
              </ul>
            )}
          </div>

          <div className="rounded-editorial border border-border bg-card p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold"><History className="h-4 w-4" /> Historial de publicaciones</h2>
            {props.revisions.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">Aún no hay publicaciones registradas desde el panel.</p>
            ) : (
              <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto">
                {props.revisions.map((r) => (
                  <li key={r.id} className="flex items-start justify-between gap-2 text-xs">
                    <div>
                      <p className="font-medium">v{r.version} · {new Date(r.createdAt).toLocaleString("es-ES", { timeZone: "Europe/Madrid", dateStyle: "short", timeStyle: "short" })}</p>
                      <p className="text-muted-foreground">{r.changeNote || "Sin nota"}{r.createdBy ? ` · ${r.createdBy}` : ""}</p>
                    </div>
                    <Button
                      type="button" variant="ghost" size="sm" disabled={pending}
                      onClick={() => {
                        if (!window.confirm(`¿Cargar la versión v${r.version} como borrador?`)) return;
                        startTransition(async () => { await restoreRevisionAction(props.blockKey, r.id); router.refresh(); });
                      }}
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Restaurar
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </aside>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-[min(96vw,1400px)] p-3 sm:p-4">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Previsualización privada del borrador</DialogTitle>
            <DialogDescription>Solo visible con sesión del panel. La web pública sigue mostrando la versión publicada.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" variant={viewport === "mobile" ? "default" : "outline"} onClick={() => setViewport("mobile")}><Smartphone className="h-4 w-4" /> Móvil</Button>
            <Button type="button" size="sm" variant={viewport === "tablet" ? "default" : "outline"} onClick={() => setViewport("tablet")}><Tablet className="h-4 w-4" /> Tablet</Button>
            <Button type="button" size="sm" variant={viewport === "desktop" ? "default" : "outline"} onClick={() => setViewport("desktop")}><Monitor className="h-4 w-4" /> Escritorio</Button>
            <a href={previewUrl} target="_blank" rel="noopener" className="ml-auto self-center text-xs underline">Abrir en pestaña</a>
          </div>
          <div className="flex justify-center overflow-auto rounded-lg border border-border bg-secondary p-2">
            <iframe
              key={previewUrl + viewport}
              src={previewUrl}
              title="Previsualización"
              className="h-[65dvh] rounded bg-background sm:h-[70dvh]"
              style={{
                width:
                  viewport === "mobile"
                    ? "min(390px, 100%)"
                    : viewport === "tablet"
                      ? "min(768px, 100%)"
                      : "100%",
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
