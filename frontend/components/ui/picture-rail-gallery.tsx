/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, RotateCw, Scissors, Sparkles, X } from "lucide-react";

export type PictureFrameStyle = "black" | "oak" | "white";

export interface PictureRailItem {
  id?: string;
  /** Nombre accesible, título en pie de galería y cabecera de la ficha. */
  title: string;
  /** Descripción del peinado, corte o trabajo capilar realizado. */
  description: string;
  /** Técnica o especialidad aplicada (ej. «Corte en seco y desfilado interno»). */
  technique?: string;
  /** Etiqueta breve de categoría bajo el marco (ej. «Corte & Textura», «Peinado»). */
  categoryTag?: string;
  /** Enlace externo HTTPS de la imagen (editable desde el panel) o ruta local (/media/...). */
  url: string;
  /** Alias opcional de compatibilidad para la URL de imagen. */
  image?: string;
  /** Relación ancho ÷ alto de la fotografía. Por defecto 0.8 (retrato 4:5). */
  aspect?: number;
  /** Moldura del marco. Por defecto "oak". */
  frame?: PictureFrameStyle;
  /** Añade paspartú biselado alrededor de la fotografía. */
  mat?: boolean;
  /** Longitud extra del cable en unidades de marco (-0.1 a 0.3). */
  drop?: number;
  /** Notas técnicas o de acabado impresas en la ficha del reverso. */
  details?: string[];
}

export interface PictureRailGalleryLabels {
  front: string;
  back: string;
  close: string;
  /** Indicación interactiva mostrada cuando un cuadro está iluminado. */
  open: string;
}

export interface PictureRailGalleryProps extends React.ComponentProps<"section"> {
  items?: PictureRailItem[];
  eyebrow?: string;
  heading?: string;
  /** Texto mostrado bajo el riel cuando no hay ningún trabajo seleccionado. */
  caption?: string;
  /** Llamada a la acción opcional bajo la descripción. */
  action?: React.ReactNode;
  /** Ilumina los trabajos uno a uno automáticamente hasta que la persona interactúa. */
  autoplay?: boolean;
  /** Milisegundos que permanece iluminado cada trabajo durante el recorrido automático. */
  interval?: number;
  /** Índice iluminado controlado externamente (opcional). */
  active?: number | null;
  onActiveChange?: (index: number | null) => void;
  onOpenChange?: (index: number | null) => void;
  labels?: PictureRailGalleryLabels;
}

export const DEFAULT_SALON_RAIL_ITEMS: PictureRailItem[] = [
  {
    id: "look-bob-organico",
    title: "Corte Bob Orgánico con Textura",
    technique: "Corte en seco y desfilado interno",
    categoryTag: "Corte & Textura",
    description:
      "Línea bob a la altura de la mandíbula trabajada en seco para acompañar el remolino y la caída natural del cabello, logrando volumen ligero sin rigidez.",
    url: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=900&q=80",
    aspect: 0.78,
    frame: "oak",
    mat: true,
    drop: 0.04,
    details: [
      "Adaptado a la estructura facial",
      "Secado al aire o con difusor suave",
      "Crecimiento armónico entre visitas",
    ],
  },
  {
    id: "look-ondas-abiertas",
    title: "Ondas Abiertas y Brillo Natural",
    technique: "Pulido térmico suave y acabado flexible",
    categoryTag: "Peinado & Movimiento",
    description:
      "Peinado de ondas amplias y deshechas trabajadas con temperatura controlada para conservar la elasticidad de la fibra capilar y un movimiento fluido.",
    url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&q=80",
    aspect: 1.25,
    frame: "white",
    mat: true,
    drop: 0.12,
    details: [
      "Textura sedosa sin apelmazar",
      "Protección térmica previa",
      "Movimiento ligero de medios a puntas",
    ],
  },
  {
    id: "look-capas-invisibles",
    title: "Melena Larga a Capas Invisibles",
    technique: "Capas envolventes y contorno frontal",
    categoryTag: "Corte & Caída",
    description:
      "Corte de capas largas conectadas suavemente alrededor del rostro para descargar peso excesivo, aportar ligereza y realzar la dimensión natural de la melena.",
    url: "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=900&q=80",
    aspect: 0.76,
    frame: "oak",
    mat: false,
    drop: -0.02,
    details: [
      "Contorno frontal personalizado",
      "Respeta la densidad en las puntas",
      "Peinado cotidiano sencillo en casa",
    ],
  },
  {
    id: "look-luz-dimensional",
    title: "Iluminación Sutil Efecto Sol",
    technique: "Reflejos a mano alzada sobre corte escalado",
    categoryTag: "Luz & Dimensión",
    description:
      "Trabajo de iluminación gradual integrado desde la base natural para aportar relieve cálido al corte escalado, acompañado de hidratación nutritiva.",
    url: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=900&q=80",
    aspect: 1,
    frame: "black",
    mat: true,
    drop: 0.15,
    details: [
      "Transición suave sin marca en raíz",
      "Reflejo cálido multidimensional",
      "Sellado nutritivo de cutícula",
    ],
  },
  {
    id: "look-media-melena-flequillo",
    title: "Media Melena Desfilada con Flequillo Cortina",
    technique: "Puntas texturizadas y apertura frontal",
    categoryTag: "Corte & Flequillo",
    description:
      "Media melena versátil apoyada sobre las clavículas con flequillo cortina abierto que suaviza las facciones y permite recoger el cabello con caída orgánica.",
    url: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=900&q=80",
    aspect: 0.8,
    frame: "white",
    mat: true,
    drop: 0.02,
    details: [
      "Flequillo integrable hacia los pómulos",
      "Volumen natural en coronilla",
      "Versátil suelto o en recogido relajado",
    ],
  },
  {
    id: "look-acabado-pulido",
    title: "Estilismo Pulido de Salón",
    technique: "Brushing de precisión y nutrición ligera",
    categoryTag: "Estilismo",
    description:
      "Secado direccional con cepillo de cerdas naturales para alinear la cutícula, potenciar el reflejo limpio de la luz y dejar las puntas con giro suave.",
    url: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?auto=format&fit=crop&w=900&q=80",
    aspect: 1.3,
    frame: "oak",
    mat: true,
    drop: 0.08,
    details: [
      "Alineado respetuoso de la fibra",
      "Control duradero del encrespamiento",
      "Tacto ligero y brillo espejo",
    ],
  },
];

const DEFAULT_LABELS: PictureRailGalleryLabels = {
  front: "Fotografía",
  back: "Ficha del peinado",
  close: "Cerrar",
  open: "Ampliar y ver ficha del trabajo",
};

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

const DEFAULT_DROPS = [0.04, 0.12, -0.02, 0.15, 0.02, 0.08, 0.05, 0.11];
const PERSPECTIVE = 1200;
const GAP = 0.3;
const BREATH = 0.1;
const MARGIN = 0.05;
const EDGE = 36;
const RAIL_MIN_UNIT = 90;
const RAIL_MAX_UNIT = 150;
const CAROUSEL_MAX_UNIT = 128;
const LIFT_SCALE = 0.06;
/**
 * Supermuestreo 2× bajo perspectiva 3D para mantener máxima nitidez en pantallas retina.
 */
const SUPERSAMPLE = 2;
const LIFT_GROW = 1.12;
const LIFT_Z = 26;
const TILT_X = -6;
const TILT_Y = 4;
const SWING_MAX = 14;
const SWING_DAMP = 2.2;
const SWING_G = 3900;
const SWING_COUPLING = 0.08;
const DRAG_COUPLING = 0.16;
const NEIGHBOUR_KICK = 12;
const DEG = 180 / Math.PI;

const FRAME_BASE = {
  black: "color-mix(in oklab, black 82%, white)",
  oak: "color-mix(in oklab, burlywood 62%, peru)",
  white: "color-mix(in oklab, white 96%, wheat)",
} as const;
const FRAME_RELIEF = {
  black: [-0.45, 0.22, 0.06, -0.14, -0.5, 1],
  oak: [-0.36, 0.18, 0.05, -0.12, -0.42, 1],
  white: [-0.15, 0.05, 0.02, -0.05, -0.2, 0.55],
} as const;
const BRASS =
  "linear-gradient(to bottom, color-mix(in oklab, gold 35%, white) 0%, color-mix(in oklab, goldenrod 80%, white) 32%, color-mix(in oklab, darkgoldenrod 85%, black) 72%, color-mix(in oklab, darkgoldenrod 55%, black) 100%)";
const BRASS_DIM =
  "linear-gradient(to bottom, color-mix(in oklab, goldenrod 50%, white) 0%, color-mix(in oklab, darkgoldenrod 78%, black) 38%, color-mix(in oklab, darkgoldenrod 48%, black) 100%)";
const BRASS_SIDE =
  "linear-gradient(to right, color-mix(in oklab, goldenrod 70%, white), color-mix(in oklab, darkgoldenrod 80%, black) 70%, color-mix(in oklab, darkgoldenrod 50%, black))";
const WARM = "color-mix(in oklab, white 55%, gold)";
const PAPER = "color-mix(in oklab, white 95%, wheat)";
const INK = "color-mix(in oklab, black 84%, white)";

function resolveImageUrl(item: PictureRailItem): string {
  return (item.url || item.image || "").trim();
}

function normalizeFrame(frame?: string): PictureFrameStyle {
  if (frame === "black" || frame === "oak" || frame === "white") return frame;
  return "oak";
}

function stamp(event: { timeStamp: number }) {
  const now = performance.now();
  return event.timeStamp > 0 && event.timeStamp <= now + 1 ? event.timeStamp : now;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function mix(color: string, amount: number) {
  if (amount === 0) return color;
  const keep = Math.round((1 - Math.min(1, Math.abs(amount))) * 1000) / 10;
  return `color-mix(in oklab, ${color} ${keep}%, ${amount > 0 ? "white" : "black"})`;
}

function tone(amount: number) {
  const c = `color-mix(in oklab, ${amount > 0 ? "white" : "black"} ${Math.round(Math.abs(amount) * 100)}%, transparent)`;
  return `linear-gradient(${c}, ${c})`;
}

function restTilt(i: number) {
  return (((i * 37 + 11) % 7) - 3) * 0.5;
}

type Shape = {
  frame: PictureFrameStyle;
  mold: number;
  mat: number;
  matB: number;
  w: number;
  h: number;
};

function shapeOf(item: PictureRailItem): Shape {
  const rawAspect = Number(item.aspect);
  const aspect = clamp(Number.isFinite(rawAspect) && rawAspect > 0 ? rawAspect : 0.8, 0.4, 2.5);
  const frame = normalizeFrame(item.frame);
  const mold = frame === "oak" ? 0.068 : frame === "white" ? 0.058 : 0.046;
  const mat = item.mat !== false ? 0.11 : 0;
  const matB = item.mat !== false ? 0.022 : 0;
  const iw = Math.sqrt(aspect);
  return {
    frame,
    mold,
    mat,
    matB,
    w: iw + 2 * (mold + mat),
    h: 1 / iw + 2 * (mold + mat) + matB,
  };
}

type Layout = {
  width: number;
  unit: number;
  carousel: boolean;
  railTop: number;
  railT: number;
  pivotY: number;
  tops: number[];
  stageH: number;
};

function layoutFor(shapes: Shape[], drops: number[], width: number): Layout {
  const n = shapes.length;
  const sumW = shapes.reduce((sum, s) => sum + s.w, 0);
  const maxW = shapes.reduce((m, s) => Math.max(m, s.w), 0);
  const fit = n
    ? (width - 2 * EDGE) /
      (sumW + Math.max(0, n - 1) * GAP + 2 * BREATH + maxW * (LIFT_GROW - 1))
    : RAIL_MAX_UNIT;
  const carousel = fit < RAIL_MIN_UNIT;
  const unit = carousel
    ? clamp(width * 0.24, 92, CAROUSEL_MAX_UNIT)
    : Math.min(RAIL_MAX_UNIT, fit);
  const railTop = 6;
  const railT = Math.round(clamp(unit * 0.11, 9, 16));
  const pivotY = railTop + railT + Math.round(unit * 0.045) + 2;
  const maxH = shapes.reduce((m, s) => Math.max(m, s.h), 0) * unit;
  const centre = pivotY + unit * 0.22 + maxH / 2;
  const tops = shapes.map((s, i) =>
    Math.round(
      Math.max(
        pivotY + unit * 0.08,
        centre - (s.h * unit) / 2 + clamp(drops[i] ?? 0, -0.15, 0.6) * unit
      )
    )
  );
  const bottom = shapes.reduce(
    (m, s, i) => Math.max(m, (tops[i] ?? 0) + s.h * unit),
    pivotY
  );
  return {
    width,
    unit,
    carousel,
    railTop,
    railT,
    pivotY,
    tops,
    stageH: Math.round(bottom + 36),
  };
}

type Sim = {
  x: number[];
  vx: number[];
  tx: number[];
  sw: number[];
  vsw: number[];
  e: number[];
  ve: number[];
  te: number[];
  ty: number[];
  vty: number[];
  tty: number[];
  drag: number;
  grab: number;
  free: number;
  last: number;
  raf: number;
  hx: number[];
  hv: number[];
};

function emptySim(): Sim {
  return {
    x: [],
    vx: [],
    tx: [],
    sw: [],
    vsw: [],
    e: [],
    ve: [],
    te: [],
    ty: [],
    vty: [],
    tty: [],
    drag: -1,
    grab: 0,
    free: 0,
    last: 0,
    raf: 0,
    hx: [],
    hv: [],
  };
}

function pendulum(lay: Layout, shape: Shape, i: number) {
  return Math.max(30, (lay.tops[i] ?? 0) - lay.pivotY + (shape.h * lay.unit) / 2);
}

function reach(s: Sim, lay: Layout, shape: Shape, i: number) {
  const e = clamp(s.e[i] ?? 0, 0, 1);
  const half = (shape.w * lay.unit * (1 + (LIFT_GROW - 1) * e)) / 2;
  const top = (lay.tops[i] ?? 0) - lay.pivotY;
  const bottom = top + shape.h * lay.unit;
  const r = (s.sw[i] ?? 0) / DEG;
  const c = Math.cos(r);
  const sn = Math.sin(r);
  return [
    Math.min(-half * c - top * sn, -half * c - bottom * sn),
    Math.max(half * c - top * sn, half * c - bottom * sn),
  ] as const;
}

function resolveContacts(s: Sim, lay: Layout, list: Shape[], margin: number) {
  const n = list.length;
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i < n - 1; i++) {
      const a = list[i];
      const b = list[i + 1];
      if (!a || !b) continue;
      const overlap =
        (s.x[i] ?? 0) +
        reach(s, lay, a, i)[1] -
        ((s.x[i + 1] ?? 0) + reach(s, lay, b, i + 1)[0]) +
        margin;
      if (overlap <= 0) continue;
      if (i === s.drag) s.x[i + 1] = (s.x[i + 1] ?? 0) + overlap;
      else if (i + 1 === s.drag) s.x[i] = (s.x[i] ?? 0) - overlap;
      else {
        s.x[i] = (s.x[i] ?? 0) - overlap / 2;
        s.x[i + 1] = (s.x[i + 1] ?? 0) + overlap / 2;
      }
      const va = s.vx[i] ?? 0;
      const vb = s.vx[i + 1] ?? 0;
      if (va > vb) {
        const shared = (va + vb) / 2;
        if (i !== s.drag) s.vx[i] = shared;
        if (i + 1 !== s.drag) s.vx[i + 1] = shared;
      }
    }
  }
  if (!lay.carousel && n > 0) {
    const lo = 6;
    const hi = lay.width - 6;
    const first = list[0];
    const last = list[n - 1];
    if (first) {
      const l0 = reach(s, lay, first, 0)[0];
      if ((s.x[0] ?? 0) + l0 < lo) {
        s.x[0] = lo - l0;
        s.vx[0] = Math.abs(s.vx[0] ?? 0) * 0.3;
      }
    }
    for (let i = 0; i < n - 1; i++) {
      const a = list[i];
      const b = list[i + 1];
      if (!a || !b) continue;
      const min =
        (s.x[i] ?? 0) + reach(s, lay, a, i)[1] - reach(s, lay, b, i + 1)[0] + margin;
      if ((s.x[i + 1] ?? 0) < min) s.x[i + 1] = min;
    }
    if (last) {
      const rn = reach(s, lay, last, n - 1)[1];
      if ((s.x[n - 1] ?? 0) + rn > hi) {
        s.x[n - 1] = hi - rn;
        s.vx[n - 1] = -Math.abs(s.vx[n - 1] ?? 0) * 0.3;
      }
    }
    for (let i = n - 2; i >= 0; i--) {
      const a = list[i];
      const b = list[i + 1];
      if (!a || !b) continue;
      const max =
        (s.x[i + 1] ?? 0) + reach(s, lay, b, i + 1)[0] - reach(s, lay, a, i)[1] - margin;
      if ((s.x[i] ?? 0) > max) s.x[i] = max;
    }
  }
}

export function PictureRailGallery({
  items: rawItems,
  eyebrow,
  heading,
  caption,
  action,
  autoplay = false,
  interval = 3200,
  active: activeProp,
  onActiveChange,
  onOpenChange,
  labels = DEFAULT_LABELS,
  className,
  ...rest
}: PictureRailGalleryProps) {
  const uid = React.useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const items = React.useMemo(() => {
    const source = rawItems ?? DEFAULT_SALON_RAIL_ITEMS;
    const filtered = source.filter((item) => Boolean(item && resolveImageUrl(item)));
    return filtered.length > 0 ? filtered : DEFAULT_SALON_RAIL_ITEMS;
  }, [rawItems]);

  const count = items.length;
  const controlled = activeProp !== undefined;
  const stageRef = React.useRef<HTMLDivElement | null>(null);
  const hangs = React.useRef<(HTMLDivElement | null)[]>([]);
  const backs = React.useRef<(HTMLDivElement | null)[]>([]);
  const swings = React.useRef<(HTMLSpanElement | null)[]>([]);
  const slots = React.useRef<(HTMLButtonElement | null)[]>([]);
  const tilts = React.useRef<(HTMLSpanElement | null)[]>([]);
  const lights = React.useRef<(HTMLSpanElement | null)[]>([]);
  const glares = React.useRef<(HTMLSpanElement | null)[]>([]);
  const dims = React.useRef<(HTMLSpanElement | null)[]>([]);
  const shadows = React.useRef<(HTMLSpanElement | null)[]>([]);
  const washes = React.useRef<(HTMLSpanElement | null)[]>([]);
  const sim = React.useRef(emptySim());

  const shapes = React.useMemo(() => items.map(shapeOf), [items]);
  const drops = React.useMemo(
    () =>
      items.map((item, idx) =>
        typeof item.drop === "number" && Number.isFinite(item.drop)
          ? item.drop
          : DEFAULT_DROPS[idx % DEFAULT_DROPS.length] ?? 0
      ),
    [items]
  );

  const [width, setWidth] = React.useState(0);
  const layout = React.useMemo(() => layoutFor(shapes, drops, width), [shapes, drops, width]);
  const [activeState, setActiveState] = React.useState<number | null>(null);
  const requested = React.useRef<number | null | undefined>(undefined);
  const raw = controlled ? (activeProp ?? null) : activeState;
  const current = raw !== null && raw >= 0 && raw < count ? raw : null;
  const [focusIndex, setFocusIndex] = React.useState(0);
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);
  const [reduced, setReduced] = React.useState(false);
  const [tabHidden, setTabHidden] = React.useState(false);
  const [playing, setPlaying] = React.useState(autoplay);
  const [lifted, setLifted] = React.useState<number | null>(null);
  const returnFocus = React.useRef<number | null>(null);
  const pendingOpen = React.useRef(-1);
  const pointer = React.useRef({
    id: -1,
    index: -1,
    x: 0,
    y: 0,
    moved: false,
    kind: "",
    swipe: 0,
    lastX: 0,
    lastT: 0,
    v: 0,
  });

  const live = React.useRef({
    active: null as number | null,
    layout,
    shapes,
    reduced,
    count,
    openIndex: null as number | null,
    carouselIndex: Math.min(1, Math.max(0, count - 1)),
  });
  live.current = {
    ...live.current,
    active: current,
    layout,
    shapes,
    reduced,
    count,
    openIndex,
  };

  const host = React.useRef({ controlled, onActiveChange, onOpenChange });
  host.current = { controlled, onActiveChange, onOpenChange };

  const carouselIndex = layout.carousel ? (current ?? live.current.carouselIndex) : null;

  React.useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  React.useEffect(() => {
    const onVis = () => setTabHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  React.useEffect(() => {
    setPlaying(autoplay);
  }, [autoplay]);

  useIsomorphicLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = (next: number) =>
      setWidth((old) => (Math.abs(old - next) < 0.5 ? old : Math.round(next * 100) / 100));
    measure(stage.clientWidth);
    const observer = new ResizeObserver((entries) => {
      const box = entries[0];
      if (box) measure(box.contentRect.width);
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  const targetsFor = React.useCallback(
    (lay: Layout, front: number | null, centreIndex: number) => {
      const n = shapes.length;
      const feet = shapes.map((s, i) => s.w * lay.unit * (i === front ? LIFT_GROW : 1));
      const gapAfter = (a: number) =>
        lay.unit * (GAP + (front !== null && (a === front || a + 1 === front) ? BREATH : 0));
      const xs = feet.map(() => 0);
      if (lay.carousel) {
        const c = clamp(front ?? centreIndex, 0, Math.max(0, n - 1));
        xs[c] = lay.width / 2;
        for (let i = c + 1; i < n; i++) {
          xs[i] = (xs[i - 1] ?? 0) + ((feet[i - 1] ?? 0) + (feet[i] ?? 0)) / 2 + gapAfter(i - 1);
        }
        for (let i = c - 1; i >= 0; i--) {
          xs[i] = (xs[i + 1] ?? 0) - ((feet[i + 1] ?? 0) + (feet[i] ?? 0)) / 2 - gapAfter(i);
        }
        return xs;
      }
      let total = 0;
      for (let i = 0; i < n; i++) total += (feet[i] ?? 0) + (i < n - 1 ? gapAfter(i) : 0);
      let cursor = (lay.width - total) / 2;
      for (let i = 0; i < n; i++) {
        xs[i] = cursor + (feet[i] ?? 0) / 2;
        cursor += (feet[i] ?? 0) + gapAfter(i);
      }
      return xs;
    },
    [shapes]
  );

  const paint = React.useCallback((i: number) => {
    const s = sim.current;
    const { layout: lay, shapes: list, count: n } = live.current;
    const shape = list[i];
    if (!shape) return;
    const w = shape.w * lay.unit;
    const x = s.x[i] ?? 0;
    const theta = s.sw[i] ?? 0;
    const e = clamp(s.e[i] ?? 0, 0, 1.2);
    const lit = clamp(e, 0, 1);
    const ty = (s.ty[i] ?? 0) * lit;
    const left = `translate3d(${(x - w / 2).toFixed(2)}px,0,0)`;
    const hang = hangs.current[i];
    if (hang) hang.style.transform = left;
    const back = backs.current[i];
    if (back) back.style.transform = `${left} rotate(${theta.toFixed(3)}deg)`;
    const swing = swings.current[i];
    if (swing) swing.style.transform = `rotate(${theta.toFixed(3)}deg)`;
    const tilt = tilts.current[i];
    if (tilt) {
      tilt.style.transform = `perspective(${PERSPECTIVE}px) translateZ(${(LIFT_Z * e).toFixed(2)}px) rotateX(${(TILT_X * e).toFixed(3)}deg) rotateY(${ty.toFixed(3)}deg) scale(${((1 + LIFT_SCALE * e) / SUPERSAMPLE).toFixed(4)})`;
    }
    const light = lights.current[i];
    if (light) light.style.opacity = lit.toFixed(3);
    const wash = washes.current[i];
    if (wash) wash.style.opacity = lit.toFixed(3);
    const glare = glares.current[i];
    if (glare) glare.style.transform = `translate3d(${(-ty * 3 - theta * 1.6).toFixed(2)}%,0,0)`;
    const shadow = shadows.current[i];
    if (shadow) {
      shadow.style.transform = `translate3d(${(-ty * 1.4).toFixed(2)}px,${(lay.unit * 0.04 + 10 * e).toFixed(2)}px,0) scale(${(1 + 0.035 * e).toFixed(4)},${(1 + 0.07 * e).toFixed(4)})`;
      shadow.style.opacity = (1 - 0.3 * lit).toFixed(3);
    }
    let others = 0;
    for (let k = 0; k < n; k++) if (k !== i) others = Math.max(others, s.e[k] ?? 0);
    const dim = dims.current[i];
    if (dim) dim.style.opacity = (0.08 * clamp(others, 0, 1) * (1 - lit)).toFixed(4);
  }, []);

  const step = React.useCallback(
    (now: number) => {
      const s = sim.current;
      const { layout: lay, shapes: list, count: n } = live.current;
      const dt = s.last ? Math.min(0.1, (now - s.last) / 1000) : 1 / 60;
      s.last = now;
      const sub = Math.max(3, Math.ceil(dt / 0.0115));
      const h = dt / sub;
      const margin = MARGIN * lay.unit;
      const restoring = now > s.free;
      for (let k = 0; k < sub; k++) {
        for (let i = 0; i < n; i++) {
          const shape = list[i];
          if (!shape) continue;
          const len = pendulum(lay, shape, i);
          if (i !== s.drag) {
            const before = s.vx[i] ?? 0;
            const stiff = restoring ? 130 : 0;
            const damp = restoring ? 2 * Math.sqrt(130) * 0.86 : 3.2;
            const ax = -stiff * ((s.x[i] ?? 0) - (s.tx[i] ?? 0)) - damp * before;
            s.vx[i] = before + ax * h;
            s.x[i] = (s.x[i] ?? 0) + (s.vx[i] ?? 0) * h;
          }
          const ae =
            -150 * ((s.e[i] ?? 0) - (s.te[i] ?? 0)) -
            2 * Math.sqrt(150) * 0.78 * (s.ve[i] ?? 0);
          s.ve[i] = (s.ve[i] ?? 0) + ae * h;
          s.e[i] = (s.e[i] ?? 0) + (s.ve[i] ?? 0) * h;
          const at =
            -110 * ((s.ty[i] ?? 0) - (s.tty[i] ?? 0)) -
            2 * Math.sqrt(110) * 0.72 * (s.vty[i] ?? 0);
          s.vty[i] = (s.vty[i] ?? 0) + at * h;
          s.ty[i] = (s.ty[i] ?? 0) + (s.vty[i] ?? 0) * h;
          const rest = restTilt(i) * (1 - clamp(s.e[i] ?? 0, 0, 1));
          const as = -(SWING_G / len) * ((s.sw[i] ?? 0) - rest) - SWING_DAMP * (s.vsw[i] ?? 0);
          s.vsw[i] = (s.vsw[i] ?? 0) + as * h;
          s.sw[i] = clamp((s.sw[i] ?? 0) + (s.vsw[i] ?? 0) * h, -SWING_MAX, SWING_MAX);
        }
        resolveContacts(s, lay, list, margin);
      }
      const follow = 1 - Math.exp(-dt / 0.035);
      for (let i = 0; i < n; i++) {
        const shape = list[i];
        const x = s.x[i] ?? 0;
        const was = s.hv[i] ?? 0;
        const hv = was + ((x - (s.hx[i] ?? x)) / dt - was) * follow;
        s.hx[i] = x;
        s.hv[i] = hv;
        if (shape) {
          s.vsw[i] =
            (s.vsw[i] ?? 0) +
            clamp(
              (hv - was) *
                (DEG / pendulum(lay, shape, i)) *
                (i === s.drag ? DRAG_COUPLING : SWING_COUPLING),
              -40,
              40
            );
        }
      }
      if (s.drag >= 0) s.vx[s.drag] = s.hv[s.drag] ?? 0;
      let busy = s.drag >= 0 || now < s.free;
      for (let i = 0; i < n; i++) {
        paint(i);
        const rest = restTilt(i) * (1 - clamp(s.e[i] ?? 0, 0, 1));
        if (
          Math.abs(s.vx[i] ?? 0) > 0.4 ||
          (restoring && Math.abs((s.x[i] ?? 0) - (s.tx[i] ?? 0)) > 0.25) ||
          Math.abs((s.e[i] ?? 0) - (s.te[i] ?? 0)) > 0.002 ||
          Math.abs(s.ve[i] ?? 0) > 0.01 ||
          Math.abs((s.ty[i] ?? 0) - (s.tty[i] ?? 0)) > 0.02 ||
          Math.abs(s.vty[i] ?? 0) > 0.05 ||
          Math.abs((s.sw[i] ?? 0) - rest) > 0.02 ||
          Math.abs(s.vsw[i] ?? 0) > 0.05
        ) {
          busy = true;
        }
      }
      if (busy) s.raf = requestAnimationFrame(step);
      else {
        s.raf = 0;
        s.last = 0;
        for (let i = 0; i < n; i++) {
          if (restoring) s.x[i] = s.tx[i] ?? 0;
          s.hx[i] = s.x[i] ?? 0;
          s.hv[i] = 0;
          s.vx[i] = 0;
          s.e[i] = s.te[i] ?? 0;
          s.ve[i] = 0;
          s.ty[i] = s.tty[i] ?? 0;
          s.vty[i] = 0;
          s.sw[i] = restTilt(i) * (1 - clamp(s.e[i] ?? 0, 0, 1));
          s.vsw[i] = 0;
          paint(i);
        }
      }
    },
    [paint]
  );

  const kick = React.useCallback(() => {
    const s = sim.current;
    if (live.current.reduced) {
      for (let i = 0; i < live.current.count; i++) {
        s.x[i] = s.tx[i] ?? 0;
        s.vx[i] = 0;
        s.hx[i] = s.x[i] ?? 0;
        s.hv[i] = 0;
        s.e[i] = s.te[i] ?? 0;
        s.ve[i] = 0;
        s.ty[i] = s.tty[i] ?? 0;
        s.vty[i] = 0;
        s.sw[i] = restTilt(i) * (1 - clamp(s.e[i] ?? 0, 0, 1));
        s.vsw[i] = 0;
        paint(i);
      }
      return;
    }
    if (!s.raf) {
      s.last = 0;
      s.raf = requestAnimationFrame(step);
    }
  }, [paint, step]);

  const impulse = React.useCallback(
    (i: number, amount: number) => {
      const s = sim.current;
      if (live.current.reduced || i < 0 || i >= live.current.count) return;
      s.vsw[i] = (s.vsw[i] ?? 0) + amount;
      kick();
    },
    [kick]
  );

  useIsomorphicLayoutEffect(() => {
    if (!layout.width) return;
    const s = sim.current;
    const xs = targetsFor(layout, current, live.current.carouselIndex);
    const fresh = s.x.length !== count;
    for (let i = 0; i < count; i++) {
      s.tx[i] = (xs[i] ?? 0) + (layout.carousel ? pointer.current.swipe : 0);
      s.te[i] = i === current ? 1 : 0;
      if (i !== current) s.tty[i] = 0;
      if (fresh || reduced) {
        s.x[i] = s.tx[i] ?? 0;
        s.vx[i] = 0;
        s.hx[i] = s.x[i] ?? 0;
        s.hv[i] = 0;
        s.e[i] = s.te[i] ?? 0;
        s.ve[i] = 0;
        s.ty[i] = s.tty[i] ?? 0;
        s.vty[i] = 0;
        s.sw[i] = restTilt(i) * (1 - (s.e[i] ?? 0));
        s.vsw[i] = 0;
      }
    }
    if (fresh) {
      for (const list of [
        s.x,
        s.vx,
        s.tx,
        s.sw,
        s.vsw,
        s.e,
        s.ve,
        s.te,
        s.ty,
        s.vty,
        s.tty,
        s.hx,
        s.hv,
      ]) {
        list.length = count;
      }
    }
    for (let i = 0; i < count; i++) paint(i);
    kick();
  }, [layout, current, count, reduced, targetsFor, paint, kick]);

  const previous = React.useRef<number | null>(null);
  React.useEffect(() => {
    const old = previous.current;
    previous.current = current;
    requested.current = undefined;
    if (old === current) return;
    if (current !== null) {
      live.current.carouselIndex = current;
      impulse(current - 1, NEIGHBOUR_KICK);
      impulse(current + 1, -NEIGHBOUR_KICK);
    }
    if (old !== null) {
      impulse(old - 1, -NEIGHBOUR_KICK * 0.5);
      impulse(old + 1, NEIGHBOUR_KICK * 0.5);
    }
  }, [current, impulse]);

  const brushed = React.useRef({ done: false, timers: [] as number[] });
  React.useEffect(() => {
    const b = brushed.current;
    if (!layout.width || b.done || reduced) return;
    b.done = true;
    for (let i = 0; i < count; i++) {
      b.timers.push(window.setTimeout(() => impulse(i, 18 - i * 1.2), 140 + i * 60));
    }
  }, [layout.width, reduced, count, impulse]);

  React.useEffect(
    () => () => {
      const b = brushed.current;
      b.timers.forEach((t) => window.clearTimeout(t));
      b.timers = [];
      b.done = false;
    },
    []
  );

  React.useEffect(
    () => () => {
      cancelAnimationFrame(sim.current.raf);
      sim.current.raf = 0;
    },
    []
  );

  useIsomorphicLayoutEffect(() => {
    if (openIndex !== null || lifted !== null || returnFocus.current === null) return;
    const index = returnFocus.current;
    returnFocus.current = null;
    slots.current[index]?.focus({ preventScroll: true });
  }, [openIndex, lifted]);

  const choose = React.useCallback((index: number | null) => {
    if (index === live.current.active || index === requested.current) return;
    requested.current = index;
    if (!host.current.controlled) setActiveState(index);
    host.current.onActiveChange?.(index);
  }, []);

  const stop = React.useCallback(() => setPlaying(false), []);

  const beat = React.useRef(0);
  React.useEffect(() => {
    if (!playing || reduced || tabHidden || openIndex !== null || count === 0 || !layout.width) {
      beat.current = 0;
      return;
    }
    const start = performance.now();
    if (!beat.current || beat.current < start - interval) {
      beat.current = start + (current === null ? 900 : interval);
    }
    let timer = window.setTimeout(function advance() {
      const now = live.current.active;
      beat.current += interval;
      choose(
        now === null
          ? live.current.layout.carousel
            ? live.current.carouselIndex
            : 0
          : (now + 1) % live.current.count
      );
      timer = window.setTimeout(advance, Math.max(0, beat.current - performance.now()));
    }, Math.max(0, beat.current - start));
    return () => window.clearTimeout(timer);
  }, [playing, reduced, tabHidden, openIndex, count, interval, layout.width, choose, current]);

  const open = React.useCallback(
    (index: number) => {
      stop();
      choose(index);
      setOpenIndex(index);
      host.current.onOpenChange?.(index);
    },
    [choose, stop]
  );

  const sourceRect = React.useCallback(
    () => (openIndex === null ? null : tilts.current[openIndex]?.getBoundingClientRect() ?? null),
    [openIndex]
  );
  const onLift = React.useCallback((lift: boolean) => setLifted(lift ? openIndex : null), [openIndex]);
  const onDetailClose = React.useCallback(() => {
    const index = openIndex;
    if (index === null) return;
    returnFocus.current = index;
    setOpenIndex(null);
    host.current.onOpenChange?.(null);
    impulse(index, index % 2 ? 22 : -22);
  }, [openIndex, impulse]);

  function nearest(clientX: number, clientY: number) {
    const stage = stageRef.current;
    if (!stage) return null;
    const box = stage.getBoundingClientRect();
    const x = clientX - box.left;
    const y = clientY - box.top;
    const { layout: lay, shapes: list, count: n } = live.current;
    const s = sim.current;
    let best: number | null = null;
    let distance = Infinity;
    for (let i = 0; i < n; i++) {
      const shape = list[i];
      if (!shape) continue;
      const [l, r] = reach(s, lay, shape, i);
      const cx = s.x[i] ?? 0;
      const bottom = (lay.tops[i] ?? 0) + shape.h * lay.unit + 30;
      if (x < cx + l - 4 || x > cx + r + 4 || y < lay.railTop - 4 || y > bottom) continue;
      const d = Math.abs(x - cx);
      if (d < distance) {
        best = i;
        distance = d;
      }
    }
    return best;
  }

  function aim(index: number, clientX: number) {
    const stage = stageRef.current;
    const shape = live.current.shapes[index];
    if (!stage || !shape) return;
    const s = sim.current;
    const local = clientX - stage.getBoundingClientRect().left;
    const half = (shape.w * live.current.layout.unit) / 2;
    for (let i = 0; i < live.current.count; i++) {
      s.tty[i] = i === index ? clamp((local - (s.x[index] ?? 0)) / half, -1, 1) * TILT_Y : 0;
    }
    kick();
  }

  const onPointerMove = (event: React.PointerEvent) => {
    const p = pointer.current;
    const s = sim.current;
    const stage = stageRef.current;
    const lay = live.current.layout;
    if (p.id === event.pointerId && stage) {
      const dx = event.clientX - p.x;
      const now = stamp(event);
      if (!p.moved && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(event.clientY - p.y)) {
        p.moved = true;
        stop();
        if (stage.isConnected) stage.setPointerCapture(event.pointerId);
        if (!lay.carousel && p.index >= 0) {
          s.drag = p.index;
          s.grab = event.clientX - stage.getBoundingClientRect().left - (s.x[p.index] ?? 0);
        }
      }
      if (p.moved) {
        const v = (event.clientX - p.lastX) / Math.max(1, now - p.lastT);
        p.v = p.v * 0.6 + v * 0.4;
        p.lastX = event.clientX;
        p.lastT = now;
        if (s.drag >= 0) {
          s.x[s.drag] = event.clientX - stage.getBoundingClientRect().left - s.grab;
          s.free = now + 900;
          kick();
        } else if (lay.carousel) {
          p.swipe = dx;
          const xs = targetsFor(lay, live.current.active, live.current.carouselIndex);
          for (let i = 0; i < live.current.count; i++) s.tx[i] = (xs[i] ?? 0) + dx;
          kick();
        }
      }
      return;
    }
    if (event.pointerType !== "mouse" || lay.carousel || live.current.openIndex !== null) return;
    const hit = nearest(event.clientX, event.clientY);
    const now = live.current.active;
    if (now !== null && hit !== now && stage) {
      const shape = live.current.shapes[now];
      const box = stage.getBoundingClientRect();
      const local = event.clientX - box.left;
      const keep = shape
        ? Math.abs(local - (s.x[now] ?? 0)) < (shape.w * lay.unit * LIFT_GROW) / 2 + 10
        : false;
      if (keep && event.clientY - box.top < lay.stageH) {
        aim(now, event.clientX);
        return;
      }
    }
    if (hit !== null) {
      stop();
      choose(hit);
      aim(hit, event.clientX);
    }
  };

  const onPointerDown = (event: React.PointerEvent) => {
    if (event.button !== 0) return;
    const hit = nearest(event.clientX, event.clientY);
    const now = stamp(event);
    pendingOpen.current = -1;
    pointer.current = {
      id: event.pointerId,
      index: hit ?? -1,
      x: event.clientX,
      y: event.clientY,
      moved: false,
      kind: event.pointerType,
      swipe: 0,
      lastX: event.clientX,
      lastT: now,
      v: 0,
    };
  };

  const finishPointer = (event: React.PointerEvent, cancelled: boolean) => {
    const p = pointer.current;
    if (p.id !== event.pointerId) return;
    const s = sim.current;
    const stage = stageRef.current;
    if (stage?.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
    pointer.current = { ...p, id: -1 };
    if (s.drag >= 0) {
      const idle = stamp(event) - p.lastT;
      s.vx[s.drag] = idle < 140 ? p.v * 1000 * (1 - idle / 140) : 0;
      s.drag = -1;
      s.free = performance.now() + 700;
      kick();
      return;
    }
    const lay = live.current.layout;
    if (p.moved && lay.carousel) {
      const dx = event.clientX - p.x;
      const from = live.current.active ?? live.current.carouselIndex;
      const delta = Math.abs(dx) > 40 || Math.abs(p.v) > 0.45 ? (dx < 0 ? 1 : -1) : 0;
      pointer.current.swipe = 0;
      const next = clamp(from + delta, 0, live.current.count - 1);
      live.current.carouselIndex = next;
      if (next === live.current.active || controlled) {
        const xs = targetsFor(lay, controlled ? live.current.active : next, next);
        for (let i = 0; i < live.current.count; i++) s.tx[i] = xs[i] ?? 0;
        kick();
      }
      choose(next);
      return;
    }
    if (cancelled || p.moved || p.index < 0) return;
    stop();
    if ((p.kind !== "mouse" || lay.carousel) && live.current.active !== p.index) choose(p.index);
    else pendingOpen.current = p.index;
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    stop();
    const from = current ?? focusIndex;
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? count - 1
          : clamp(from + (event.key === "ArrowRight" ? 1 : -1), 0, count - 1);
    setFocusIndex(next);
    choose(next);
    slots.current[next]?.focus({ preventScroll: true });
  };

  const stepCarousel = (delta: number) => {
    if (count === 0) return;
    stop();
    const from = current ?? carouselIndex ?? 0;
    const next = (from + delta + count) % count;
    live.current.carouselIndex = next;
    choose(next);
  };

  const currentItem = current === null ? null : items[current];
  const metaLine = currentItem
    ? [currentItem.categoryTag, currentItem.technique].filter(Boolean).join(" · ")
    : "";
  const U = layout.unit;
  const blur = Math.max(3, U * 0.05);

  return (
    <section
      {...rest}
      data-slot="picture-rail-gallery"
      data-mode={layout.carousel ? "carousel" : "rail"}
      data-active={current ?? ""}
      aria-roledescription="galería colgante de trabajos de peluquería"
      className={`relative isolate w-full overflow-hidden bg-background text-foreground ${className ?? ""}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(72% 58% at 50% 44%, color-mix(in oklab, var(--foreground) 4%, transparent), transparent 78%)",
        }}
      />

      {(eyebrow || heading) && (
        <header className="relative z-10 mx-auto flex max-w-2xl flex-col items-center gap-2.5 px-4 pt-6 text-center sm:px-6 sm:pt-8">
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {eyebrow}
            </p>
          )}
          {heading && (
            <h2
              style={{ fontSize: "clamp(1.85rem, 3.4vw, 2.85rem)" }}
              className="text-balance font-serif font-normal leading-tight text-foreground"
            >
              {heading}
            </h2>
          )}
        </header>
      )}

      <div
        ref={stageRef}
        data-stage
        role="group"
        aria-label={heading ?? "Galería de peinados y cortes realizados"}
        className="relative mt-5 w-full touch-pan-y select-none"
        style={{ height: layout.stageH, overflowX: "clip" }}
        onPointerMove={onPointerMove}
        onPointerDown={onPointerDown}
        onPointerUp={(event) => finishPointer(event, false)}
        onPointerCancel={(event) => finishPointer(event, true)}
        onPointerLeave={(event) => {
          if (event.pointerType !== "mouse" || pointer.current.id >= 0 || layout.carousel) return;
          for (let i = 0; i < count; i++) sim.current.tty[i] = 0;
          if (!document.activeElement?.matches("[data-frame]:focus-visible")) choose(null);
          kick();
        }}
        onKeyDown={onKeyDown}
      >
        {/* Riel arquitectónico superior */}
        <div
          aria-hidden="true"
          data-rail
          className="pointer-events-none absolute inset-x-0 z-[1]"
          style={{ top: layout.railTop, height: layout.railT }}
        >
          <div className="absolute inset-x-0 top-full h-3 bg-black opacity-[0.07] blur-[5px] dark:opacity-40" />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, color-mix(in oklab, var(--card) 70%, white) 0%, var(--card) 16%, color-mix(in oklab, var(--card) 90%, black) 30%, color-mix(in oklab, var(--card) 96%, white) 46%, var(--card) 62%, color-mix(in oklab, var(--card) 84%, black) 86%, color-mix(in oklab, var(--card) 72%, black) 100%)",
              boxShadow:
                "0 1px 0 color-mix(in oklab, var(--foreground) 14%, transparent), 0 -1px 0 color-mix(in oklab, var(--foreground) 8%, transparent)",
            }}
          />
          <div className="absolute inset-x-0 top-[30%] h-px bg-black opacity-10 dark:opacity-40" />
          <div className="absolute inset-x-0 top-0 h-px bg-white opacity-80 dark:opacity-15" />
        </div>

        {/* Halos cálidos y sombras proyectadas */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[2]">
          {items.map((item, i) => {
            const shape = shapes[i];
            if (!shape) return null;
            const w = shape.w * U;
            const h = shape.h * U;
            const top = layout.tops[i] ?? 0;
            const itemKey = item.id || `back-${i}`;
            return (
              <div
                key={itemKey}
                ref={(node) => {
                  backs.current[i] = node;
                }}
                className="absolute left-0 top-0"
                style={{
                  width: w,
                  height: 0,
                  transformOrigin: `${w / 2}px ${layout.pivotY + 1}px`,
                  visibility: lifted === i ? "hidden" : undefined,
                }}
              >
                <span
                  ref={(node) => {
                    washes.current[i] = node;
                  }}
                  data-wash
                  className="absolute opacity-0 [--wash:color-mix(in_oklab,gold_28%,transparent)] dark:[--wash:color-mix(in_oklab,gold_30%,transparent)]"
                  style={{
                    left: -w * 0.5,
                    width: w * 2,
                    top: top - h * 0.5,
                    height: h * 1.75,
                    background: "radial-gradient(closest-side, var(--wash), transparent)",
                  }}
                />
                <span
                  className="absolute opacity-[0.22] dark:opacity-70"
                  style={{
                    left: 0,
                    top,
                    width: w,
                    height: h,
                    filter: `blur(${blur.toFixed(1)}px)`,
                  }}
                >
                  <span
                    ref={(node) => {
                      shadows.current[i] = node;
                    }}
                    className="absolute inset-0 rounded-[2px] bg-black"
                  />
                </span>
              </div>
            );
          })}
        </div>

        {/* Cuadros colgantes */}
        {items.map((item, i) => {
          const shape = shapes[i];
          if (!shape) return null;
          const w = shape.w * U;
          const h = shape.h * U;
          const top = layout.tops[i] ?? 0;
          const lit = current === i;
          const ringY = top + h * 0.07;
          const itemKey = item.id || `hang-${i}`;
          return (
            <div
              key={itemKey}
              ref={(node) => {
                hangs.current[i] = node;
              }}
              data-hang={i}
              className="pointer-events-none absolute left-0 top-0"
              style={{ width: w, height: 0, zIndex: lit ? 30 : 10 + i }}
            >
              <Hook x={w / 2} railTop={layout.railTop} railT={layout.railT} pivotY={layout.pivotY} />
              {item.categoryTag && (
                <span
                  data-label
                  className={`absolute max-w-full truncate whitespace-nowrap rounded-[3px] border border-border bg-card px-2 py-[3px] text-[10px] font-medium leading-none tracking-wide shadow-[0_1px_2px_color-mix(in_oklab,var(--foreground)_10%,transparent)] ${
                    lit ? "text-card-foreground" : "text-muted-foreground"
                  }`}
                  style={{ top: top + h + 10, right: 0 }}
                >
                  {lit && (
                    <span
                      aria-hidden="true"
                      className="mr-1 inline-block size-1.5 rounded-full bg-chart-1 align-middle"
                    />
                  )}
                  {item.categoryTag}
                </span>
              )}
              <span
                ref={(node) => {
                  swings.current[i] = node;
                }}
                data-swing
                className="absolute left-0 top-0"
                style={{
                  width: w,
                  height: 0,
                  transformOrigin: `${w / 2}px ${layout.pivotY + 1}px`,
                  visibility: lifted === i ? "hidden" : undefined,
                }}
              >
                <svg
                  aria-hidden="true"
                  className="pointer-events-none absolute left-0 top-0 overflow-visible text-foreground"
                  width={Math.max(1, w)}
                  height={Math.max(1, ringY)}
                >
                  {[w * 0.2, w * 0.8].map((rx) => (
                    <g key={rx}>
                      <line
                        x1={w / 2 + 0.7}
                        y1={layout.pivotY + 1.8}
                        x2={rx + 0.7}
                        y2={ringY + 0.8}
                        stroke="black"
                        strokeOpacity="0.14"
                        strokeWidth="1.4"
                      />
                      <line
                        x1={w / 2}
                        y1={layout.pivotY + 1}
                        x2={rx}
                        y2={ringY}
                        stroke="currentColor"
                        strokeOpacity="0.6"
                        strokeWidth="1"
                      />
                      <line
                        x1={w / 2 - 0.3}
                        y1={layout.pivotY + 1}
                        x2={rx - 0.3}
                        y2={ringY}
                        stroke="white"
                        strokeOpacity="0.35"
                        strokeWidth="0.4"
                      />
                    </g>
                  ))}
                </svg>
                <button
                  ref={(node) => {
                    slots.current[i] = node;
                  }}
                  type="button"
                  data-frame={i}
                  data-lit={lit || undefined}
                  tabIndex={i === (current ?? focusIndex) ? 0 : -1}
                  aria-label={`${item.title}${item.technique ? ` — ${item.technique}` : ""}`}
                  aria-describedby={`${uid}-caption`}
                  aria-pressed={lit}
                  className="pointer-events-auto absolute cursor-pointer rounded-[2px] outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[6px] focus-visible:outline-ring"
                  style={{ left: 0, top, width: w, height: h }}
                  onFocus={() => {
                    setFocusIndex(i);
                    if (pointer.current.id < 0) {
                      stop();
                      choose(i);
                    }
                  }}
                  onClick={(event) => {
                    const pending = pendingOpen.current;
                    pendingOpen.current = -1;
                    if (event.detail === 0 || pending === i) open(i);
                  }}
                >
                  <span
                    ref={(node) => {
                      tilts.current[i] = node;
                    }}
                    data-tilt
                    className="absolute block"
                    style={{
                      left: (-(SUPERSAMPLE - 1) * w) / 2,
                      top: (-(SUPERSAMPLE - 1) * h) / 2,
                      width: w * SUPERSAMPLE,
                      height: h * SUPERSAMPLE,
                      transform: `scale(${1 / SUPERSAMPLE})`,
                    }}
                  >
                    <span
                      className="absolute inset-0 block"
                      style={{ zoom: SUPERSAMPLE } as React.CSSProperties}
                    >
                      <FrameArt
                        item={item}
                        shape={shape}
                        unit={U}
                        lightRef={(node) => {
                          lights.current[i] = node;
                        }}
                        glareRef={(node) => {
                          glares.current[i] = node;
                        }}
                        dimRef={(node) => {
                          dims.current[i] = node;
                        }}
                      />
                    </span>
                  </span>
                </button>
              </span>
            </div>
          );
        })}
      </div>

      {/* Controles táctiles accesibles en modo carrusel móvil/tablet */}
      {layout.carousel && count > 1 && (
        <div
          className="relative z-10 mt-2 flex items-center justify-center gap-2 px-4"
          role="group"
          aria-label="Navegación de trabajos de la galería"
        >
          <button
            type="button"
            onClick={() => stepCarousel(-1)}
            aria-label="Trabajo anterior"
            className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-card/85 text-foreground transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronLeft className="size-4" />
          </button>
          <div className="flex items-center gap-1">
            {items.map((item, i) => (
              <button
                key={item.id || `dot-${i}`}
                type="button"
                aria-label={`Ver ${item.title}`}
                aria-current={carouselIndex === i ? "true" : undefined}
                onClick={() => {
                  stop();
                  live.current.carouselIndex = i;
                  choose(i);
                }}
                className="inline-flex min-h-[36px] min-w-[24px] items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span
                  className={`block h-1.5 rounded-full transition-[width,background-color] duration-300 motion-reduce:transition-none ${
                    carouselIndex === i
                      ? "w-6 bg-foreground"
                      : "w-1.5 bg-foreground/25 hover:bg-foreground/45"
                  }`}
                />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => stepCarousel(1)}
            aria-label="Siguiente trabajo"
            className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-card/85 text-foreground transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}

      {/* Descripción del peinado o corte realizado */}
      <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center gap-4 px-4 pb-6 pt-4 text-center sm:px-6 sm:pb-8">
        <div
          id={`${uid}-caption`}
          aria-live="polite"
          className="flex min-h-[6.25rem] flex-col items-center justify-center rounded-editorial border border-border/70 bg-card/75 px-5 py-4 shadow-subtle backdrop-blur-sm transition-colors w-full"
        >
          {currentItem ? (
            <>
              {metaLine && (
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {metaLine}
                </p>
              )}
              <h3 className="mt-1 font-serif text-xl font-normal leading-snug text-foreground sm:text-2xl">
                {currentItem.title}
              </h3>
              {currentItem.description && (
                <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  {currentItem.description}
                </p>
              )}
              {current !== null && (
                <button
                  type="button"
                  onClick={() => open(current)}
                  className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-foreground/85 underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Sparkles className="size-3.5" aria-hidden="true" />
                  <span>{labels.open}</span>
                </button>
              )}
            </>
          ) : (
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {caption ||
                "Desliza el cursor por el riel o pulsa cada cuadro para iluminar el trabajo y descubrir la descripción del corte o peinado realizado."}
            </p>
          )}
        </div>
        {action && <div className="pt-1">{action}</div>}
      </div>

      {openIndex !== null && items[openIndex] && shapes[openIndex] && (
        <Detail
          uid={uid}
          item={items[openIndex]}
          shape={shapes[openIndex]}
          index={openIndex}
          total={count}
          labels={labels}
          reduced={reduced}
          source={sourceRect}
          onLift={onLift}
          onClose={onDetailClose}
        />
      )}
    </section>
  );
}

function Hook({
  x,
  railTop,
  railT,
  pivotY,
}: {
  x: number;
  railTop: number;
  railT: number;
  pivotY: number;
}) {
  const plate = clamp(railT * 0.36, 3, 6);
  const height = pivotY - railTop + 6;
  return (
    <span
      aria-hidden="true"
      className="absolute"
      style={{ left: x - plate, top: railTop - 3, width: plate * 2, height }}
    >
      <span
        className="absolute inset-x-0 top-0 rounded-full"
        style={{
          height: 4,
          background: BRASS,
          boxShadow: "0 1px 1px color-mix(in oklab, black 30%, transparent)",
        }}
      />
      <span
        className="absolute top-[3px] rounded-b-[1px]"
        style={{
          left: plate * 0.5,
          width: plate,
          bottom: 5,
          background: BRASS_SIDE,
          boxShadow: "1px 1px 1.5px color-mix(in oklab, black 28%, transparent)",
        }}
      />
      <svg
        aria-hidden="true"
        className="absolute bottom-0 left-0 overflow-visible"
        width={plate * 2}
        height={7}
        style={{ color: "color-mix(in oklab, darkgoldenrod 80%, black)" }}
      >
        <path
          d={`M${plate * 0.62},0 Q${plate * 0.62},6.2 ${plate},6.2 Q${plate * 1.38},6.2 ${plate * 1.38},2.4`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

function Moulding({ frame, m }: { frame: PictureFrameStyle; m: number }) {
  const base = FRAME_BASE[frame];
  const [outer, crest, shoulder, cove, lip, light] = FRAME_RELIEF[frame];
  const sides = [
    {
      key: "t",
      style: {
        left: 0,
        right: 0,
        top: 0,
        height: m,
        clipPath: `polygon(0 0, 100% 0, calc(100% - ${m}px) 100%, ${m}px 100%)`,
      },
      dir: "to bottom",
      along: "178.6deg",
      light: 0.16,
    },
    {
      key: "l",
      style: {
        left: 0,
        top: 0,
        bottom: 0,
        width: m,
        clipPath: `polygon(0 0, 100% ${m}px, 100% calc(100% - ${m}px), 0 100%)`,
      },
      dir: "to right",
      along: "91.2deg",
      light: 0.04,
    },
    {
      key: "r",
      style: {
        right: 0,
        top: 0,
        bottom: 0,
        width: m,
        clipPath: `polygon(0 ${m}px, 100% 0, 100% 100%, 0 calc(100% - ${m}px))`,
      },
      dir: "to left",
      along: "88.9deg",
      light: -0.14,
    },
    {
      key: "b",
      style: {
        left: 0,
        right: 0,
        bottom: 0,
        height: m,
        clipPath: `polygon(${m}px 0, calc(100% - ${m}px) 0, 100% 100%, 0 100%)`,
      },
      dir: "to top",
      along: "1.3deg",
      light: -0.24,
    },
  ];
  return (
    <>
      {sides.map((side) => {
        const layers = [tone(side.light * light)];
        if (frame === "oak") {
          layers.push(
            `repeating-linear-gradient(${side.along}, transparent 0 1.7px, color-mix(in oklab, sienna 26%, transparent) 1.7px 2.3px, transparent 2.3px 4.4px, color-mix(in oklab, saddlebrown 16%, transparent) 4.4px 4.9px, transparent 4.9px 7.6px)`
          );
        }
        layers.push(
          `linear-gradient(${side.dir}, ${mix(base, outer)} 0%, ${mix(base, crest)} 16%, ${mix(base, shoulder)} 32%, ${base} 56%, ${mix(base, cove)} 82%, ${mix(base, lip)} 100%)`
        );
        return (
          <span
            key={side.key}
            aria-hidden="true"
            className="absolute"
            style={{ ...side.style, background: layers.join(", ") }}
          />
        );
      })}
    </>
  );
}

function Fixture({ width, hood, arm }: { width: number; hood: number; arm: number }) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 -translate-x-1/2"
      style={{ bottom: "100%", width, height: arm + hood }}
    >
      {[0.26, 0.74].map((p) => (
        <span
          key={p}
          className="absolute bottom-0"
          style={{
            left: `calc(${p * 100}% - 0.75px)`,
            width: 1.5,
            height: arm + hood * 0.5,
            background:
              "linear-gradient(to right, color-mix(in oklab, goldenrod 60%, white), color-mix(in oklab, darkgoldenrod 70%, black))",
          }}
        />
      ))}
      <span
        className="absolute inset-x-0 top-0 rounded-full"
        style={{
          height: hood,
          background: BRASS_DIM,
          boxShadow: "0 1px 2px color-mix(in oklab, black 35%, transparent)",
        }}
      />
      <span
        className="absolute top-0 rounded-full bg-white opacity-30"
        style={{
          left: "8%",
          right: "8%",
          height: Math.max(1, hood * 0.22),
          marginTop: hood * 0.12,
        }}
      />
    </span>
  );
}

function FrameArt({
  item,
  shape,
  unit,
  lit,
  lightRef,
  glareRef,
  dimRef,
}: {
  item: PictureRailItem;
  shape: Shape;
  unit: number;
  lit?: number;
  lightRef?: (node: HTMLSpanElement | null) => void;
  glareRef?: (node: HTMLSpanElement | null) => void;
  dimRef?: (node: HTMLSpanElement | null) => void;
}) {
  const m = Math.max(2, shape.mold * unit);
  const mat = shape.mat * unit;
  const matB = shape.matB * unit;
  const fixture = clamp(shape.w * unit * 0.46, 30, 190);
  const hood = clamp(unit * 0.05, 4, 12);
  const arm = clamp(unit * 0.07, 5, 20);
  const above = arm + hood;
  const bevel = clamp(unit * 0.012, 1, 3);
  const imgSrc = resolveImageUrl(item);

  return (
    <>
      <Fixture width={fixture} hood={hood} arm={arm} />
      <span
        className="absolute inset-0 block rounded-[1.5px]"
        style={{ boxShadow: "0 0 0 0.6px color-mix(in oklab, black 45%, transparent)" }}
      >
        <Moulding frame={shape.frame} m={m} />
        <span
          className="absolute block overflow-hidden"
          style={{
            inset: m,
            background: mat
              ? `linear-gradient(to bottom, ${PAPER}, color-mix(in oklab, white 89%, wheat))`
              : "var(--muted)",
          }}
        >
          <span
            className="absolute block overflow-hidden bg-muted"
            style={{
              backgroundImage:
                "radial-gradient(120% 90% at 28% 18%, color-mix(in oklab, var(--foreground) 9%, transparent), transparent 70%)",
              left: mat,
              right: mat,
              top: mat,
              bottom: mat + matB,
              boxShadow: mat
                ? `0 0 0 ${bevel}px color-mix(in oklab, white 97%, wheat), 0 0 0 ${bevel + 0.6}px color-mix(in oklab, black 16%, transparent), ${bevel * 0.6}px ${bevel}px ${bevel * 1.6}px ${bevel}px color-mix(in oklab, black 9%, transparent)`
                : undefined,
            }}
          >
            <img
              src={imgSrc}
              alt=""
              draggable={false}
              decoding="async"
              ref={(node) => {
                if (node?.complete && node.naturalWidth > 0) node.dataset.loaded = "true";
              }}
              onLoad={(event) => {
                event.currentTarget.dataset.loaded = "true";
              }}
              onError={(event) => {
                event.currentTarget.dataset.failed = "true";
              }}
              className="pointer-events-none absolute inset-0 size-full select-none object-cover opacity-0 transition-opacity duration-500 data-[failed]:hidden data-[loaded]:opacity-100 motion-reduce:transition-none"
            />
          </span>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 block"
            style={{
              boxShadow: `inset 0 ${(m * 0.45).toFixed(1)}px ${(m * 0.9).toFixed(1)}px color-mix(in oklab, black 30%, transparent), inset ${(m * 0.2).toFixed(1)}px 0 ${(m * 0.5).toFixed(1)}px color-mix(in oklab, black 12%, transparent), inset 0 0 0 0.5px color-mix(in oklab, black 45%, transparent)`,
            }}
          />
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 block overflow-hidden">
            <span
              className="absolute inset-0 block"
              style={{
                background:
                  "linear-gradient(to bottom, color-mix(in oklab, white 9%, transparent), transparent 30%)",
              }}
            />
            <span
              ref={glareRef}
              data-glare
              className="absolute inset-y-0 -left-1/2 block w-[200%]"
              style={{
                background:
                  "linear-gradient(112deg, transparent 37%, color-mix(in oklab, white 10%, transparent) 43.5%, color-mix(in oklab, white 4%, transparent) 50%, transparent 56%)",
              }}
            />
          </span>
        </span>
        <span
          ref={lightRef}
          data-light
          aria-hidden="true"
          className="pointer-events-none absolute block opacity-0 mix-blend-screen"
          style={{
            left: 0,
            right: 0,
            top: -above,
            bottom: 0,
            ...(lit === undefined ? null : { opacity: lit }),
          }}
        >
          <span
            className="absolute left-1/2 block -translate-x-1/2 rounded-full"
            style={{ top: 0, width: fixture, height: hood, background: BRASS, opacity: 0.55 }}
          />
          <span
            className="absolute left-1/2 block -translate-x-1/2 rounded-full"
            style={{
              top: hood * 0.6,
              width: fixture * 0.86,
              height: Math.max(2, hood * 0.45),
              background: WARM,
              boxShadow: `0 0 ${(hood * 1.8).toFixed(1)}px ${(hood * 0.6).toFixed(1)}px color-mix(in oklab, gold 55%, transparent)`,
            }}
          />
          <span
            className="absolute block"
            style={{
              left: m * 0.4,
              right: m * 0.4,
              top: above - 1,
              height: m * 1.8,
              background: `radial-gradient(55% 100% at 50% 0%, color-mix(in oklab, ${WARM} 75%, transparent), transparent)`,
            }}
          />
          <span
            className="absolute block"
            style={{
              left: m,
              right: m,
              top: above + m * 0.2,
              bottom: m,
              background: `radial-gradient(95% 78% at 50% 0%, color-mix(in oklab, ${WARM} 50%, transparent) 0%, color-mix(in oklab, ${WARM} 18%, transparent) 46%, transparent 80%)`,
            }}
          />
        </span>
        <span
          ref={dimRef}
          data-dim
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 block bg-black opacity-0"
        />
      </span>
    </>
  );
}

function FrameBack({ item, shape, unit }: { item: PictureRailItem; shape: Shape; unit: number }) {
  const w = shape.w * unit;
  const h = shape.h * unit;
  const edge = Math.max(4, shape.mold * unit * 0.85);
  const cw = w - edge * 2;
  const ch = h - edge * 2;
  const tape = clamp(unit * 0.035, 4, 12);
  const ringY = ch * 0.22;
  const rings = [cw * 0.16, cw * 0.84];
  const sag = ringY + ch * 0.11;
  const font = clamp(unit * 0.033, 8.5, 12.5);

  return (
    <div
      className="absolute inset-0 overflow-hidden rounded-[2px]"
      style={{
        background: `repeating-linear-gradient(90.6deg, transparent 0 3px, color-mix(in oklab, sienna 12%, transparent) 3px 3.6px, transparent 3.6px 8px), linear-gradient(to bottom, color-mix(in oklab, burlywood 70%, white), color-mix(in oklab, burlywood 85%, sienna))`,
        boxShadow: "inset 0 0 0 0.6px color-mix(in oklab, black 40%, transparent)",
      }}
    >
      <div
        className="absolute"
        style={{
          inset: edge,
          background:
            "repeating-linear-gradient(33deg, transparent 0 2.6px, color-mix(in oklab, sienna 7%, transparent) 2.6px 3.4px), repeating-linear-gradient(-61deg, transparent 0 4px, color-mix(in oklab, white 6%, transparent) 4px 4.8px), linear-gradient(160deg, color-mix(in oklab, tan 82%, white), color-mix(in oklab, tan 70%, sienna))",
          boxShadow: `inset 0 0 0 ${tape}px color-mix(in oklab, peru 52%, tan), inset 0 0 0 ${tape + 0.6}px color-mix(in oklab, sienna 30%, transparent), 0 0 0 0.5px color-mix(in oklab, black 30%, transparent)`,
        }}
      >
        <svg aria-hidden="true" className="absolute inset-0 overflow-visible" width={cw} height={ch}>
          <path
            d={`M${rings[0]},${ringY + 5} Q${cw / 2},${sag + 10} ${rings[1]},${ringY + 5}`}
            fill="none"
            stroke="color-mix(in oklab, black 30%, transparent)"
            strokeWidth="2.2"
            transform="translate(0.8 1.4)"
          />
          <path
            d={`M${rings[0]},${ringY + 5} Q${cw / 2},${sag + 10} ${rings[1]},${ringY + 5}`}
            fill="none"
            stroke="color-mix(in oklab, gray 70%, white)"
            strokeWidth="1.6"
          />
          <path
            d={`M${rings[0]},${ringY + 5} Q${cw / 2},${sag + 10} ${rings[1]},${ringY + 5}`}
            fill="none"
            stroke="white"
            strokeOpacity="0.55"
            strokeWidth="0.5"
            strokeDasharray="1.2 1.6"
          />
          {rings.map((rx, k) => (
            <g key={rx}>
              <path
                d={`M${rx + (k ? -4 : 4)},${ringY + 5} l${k ? -9 : 9},2.2 l${k ? 1.6 : -1.6},1.4 l${k ? -8 : 8},1.6`}
                fill="none"
                stroke="color-mix(in oklab, gray 60%, white)"
                strokeWidth="1.1"
                strokeLinecap="round"
              />
              <rect
                x={rx - 5}
                y={ringY - 9}
                width="10"
                height="13"
                rx="2"
                fill="color-mix(in oklab, gray 55%, white)"
                stroke="color-mix(in oklab, black 35%, transparent)"
                strokeWidth="0.6"
              />
              <circle cx={rx} cy={ringY - 5} r="1.5" fill="color-mix(in oklab, gray 70%, black)" />
              <circle cx={rx} cy={ringY + 0.4} r="1.5" fill="color-mix(in oklab, gray 70%, black)" />
              <path
                d={`M${rx - 4.5},${ringY + 3} Q${rx - 4.5},${ringY + 10} ${rx},${ringY + 10} Q${rx + 4.5},${ringY + 10} ${rx + 4.5},${ringY + 3}`}
                fill="none"
                stroke="color-mix(in oklab, gray 45%, white)"
                strokeWidth="2"
              />
              <path
                d={`M${rx - 4.5},${ringY + 3} Q${rx - 4.5},${ringY + 10} ${rx},${ringY + 10}`}
                fill="none"
                stroke="white"
                strokeOpacity="0.6"
                strokeWidth="0.6"
              />
            </g>
          ))}
          {[
            [tape * 2.2, ch - tape * 2.2],
            [cw - tape * 2.2, ch - tape * 2.2],
          ].map(([bx, by]) => (
            <g key={`${bx}`}>
              <circle
                cx={bx}
                cy={by}
                r={clamp(unit * 0.03, 3, 7)}
                fill="color-mix(in oklab, black 70%, white)"
              />
              <circle
                cx={(bx ?? 0) - 0.8}
                cy={(by ?? 0) - 0.9}
                r={clamp(unit * 0.012, 1, 2.6)}
                fill="white"
                fillOpacity="0.35"
              />
            </g>
          ))}
        </svg>

        {/* Etiqueta técnica trasera del trabajo de peluquería */}
        <div
          data-back-label
          className="absolute left-1/2 -translate-x-1/2 overflow-hidden rounded-[2px] text-left"
          style={{
            bottom: ch * 0.1,
            width: clamp(cw * 0.74, 130, 320),
            maxHeight: ch * 0.56,
            padding: `${font * 0.75}px ${font}px`,
            fontSize: font,
            lineHeight: 1.35,
            background: PAPER,
            color: INK,
            boxShadow:
              "0 1px 2px color-mix(in oklab, black 25%, transparent), inset 0 0 0 0.5px color-mix(in oklab, black 12%, transparent)",
          }}
        >
          <p
            className="flex items-center gap-1 uppercase"
            style={{ fontSize: "0.68em", letterSpacing: "0.18em", opacity: 0.65 }}
          >
            <Scissors style={{ width: "0.95em", height: "0.95em" }} aria-hidden="true" />
            <span>ESPACIO Q · Ficha de estilismo</span>
          </p>
          <p className="font-serif font-semibold" style={{ fontSize: "1.18em", marginTop: "0.22em" }}>
            {item.title}
          </p>
          {item.technique && (
            <p style={{ fontSize: "0.88em", opacity: 0.78, marginTop: "0.1em" }}>
              {item.technique}
            </p>
          )}
          {item.description && (
            <p
              className="line-clamp-3"
              style={{ fontSize: "0.86em", opacity: 0.9, marginTop: "0.35em" }}
            >
              {item.description}
            </p>
          )}
          {item.details && item.details.length > 0 && (
            <ul
              className="mt-[0.35em] border-t pt-[0.32em]"
              style={{
                borderColor: "color-mix(in oklab, black 14%, transparent)",
                fontSize: "0.82em",
              }}
            >
              {item.details.slice(0, 3).map((line) => (
                <li key={line} className="truncate">
                  · {line}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function fitUnit(shape: Shape) {
  if (typeof window === "undefined") return 260;
  const wide = window.innerWidth >= 768;
  const shortLandscape = window.innerHeight < 520 && window.innerWidth > window.innerHeight;
  if (shortLandscape) {
    const maxW = Math.min(340, window.innerWidth * 0.42);
    const maxH = Math.max(150, window.innerHeight * 0.68);
    return Math.max(72, Math.min(maxW / shape.w, maxH / shape.h));
  }
  const maxW = wide ? Math.min(500, window.innerWidth * 0.44) : window.innerWidth * 0.78;
  const maxH = wide ? Math.min(480, window.innerHeight * 0.62) : window.innerHeight * 0.38;
  return Math.max(76, Math.min(maxW / shape.w, maxH / shape.h));
}

function Detail({
  uid,
  item,
  shape,
  index,
  total,
  labels,
  reduced,
  source,
  onLift,
  onClose,
}: {
  uid: string;
  item: PictureRailItem;
  shape: Shape;
  index: number;
  total: number;
  labels: PictureRailGalleryLabels;
  reduced: boolean;
  source: () => DOMRect | null;
  onLift: (lifted: boolean) => void;
  onClose: () => void;
}) {
  const dialogRef = React.useRef<HTMLDivElement | null>(null);
  const figureRef = React.useRef<HTMLDivElement | null>(null);
  const spinRef = React.useRef<HTMLDivElement | null>(null);
  const closeRef = React.useRef<HTMLButtonElement | null>(null);
  const [side, setSide] = React.useState<"front" | "back">("front");
  const [shown, setShown] = React.useState(false);
  const [unit, setUnit] = React.useState(() => fitUnit(shape));
  const angle = React.useRef({
    value: 0,
    target: 0,
    velocity: 0,
    raf: 0,
    last: 0,
    dragging: false,
    startX: 0,
    startAngle: 0,
  });
  const closing = React.useRef(false);
  const titleId = `${uid}-detail-title`;

  React.useEffect(() => {
    const onResize = () => setUnit(fitUnit(shape));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [shape]);

  const spin = React.useCallback(() => {
    const a = angle.current;
    const node = spinRef.current;
    const loop = (now: number) => {
      const dt = a.last ? Math.min(0.1, (now - a.last) / 1000) : 1 / 60;
      a.last = now;
      const sub = Math.ceil(dt / 0.012);
      for (let k = 0; k < sub; k++) {
        const accel = -90 * (a.value - a.target) - 2 * Math.sqrt(90) * 0.82 * a.velocity;
        a.velocity += (accel * dt) / sub;
        a.value += (a.velocity * dt) / sub;
      }
      if (node) node.style.transform = `rotateY(${a.value.toFixed(2)}deg)`;
      if (Math.abs(a.value - a.target) < 0.05 && Math.abs(a.velocity) < 0.05) {
        a.value = a.target;
        if (node) node.style.transform = `rotateY(${a.value}deg)`;
        a.raf = 0;
        a.last = 0;
        return;
      }
      a.raf = requestAnimationFrame(loop);
    };
    if (reduced) {
      a.value = a.target;
      if (node) node.style.transform = `rotateY(${a.value}deg)`;
      return;
    }
    if (!a.raf) a.raf = requestAnimationFrame(loop);
  }, [reduced]);

  const turnTo = React.useCallback(
    (next: "front" | "back") => {
      const a = angle.current;
      const base = Math.round(a.value / 360) * 360;
      a.target = base + (next === "back" ? 180 : 0);
      if (Math.abs(a.target - a.value) > 180) {
        a.target -= 360 * Math.sign(a.target - a.value);
      }
      setSide(next);
      spin();
    },
    [spin]
  );

  useIsomorphicLayoutEffect(() => {
    const figure = figureRef.current;
    const from = source();
    closeRef.current?.focus({ preventScroll: true });
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    let animation: Animation | null = null;
    if (figure && from && !reduced && from.width > 0) {
      const to = figure.getBoundingClientRect();
      const scale = from.width / to.width;
      const dx = from.left + from.width / 2 - (to.left + to.width / 2);
      const dy = from.top + from.height / 2 - (to.top + to.height / 2);
      const lift = Math.min(90, Math.abs(dy) * 0.25 + 30);
      onLift(true);
      animation = figure.animate(
        [
          { transform: `translate(${dx}px, ${dy}px) scale(${scale})` },
          {
            transform: `translate(${dx * 0.4}px, ${dy * 0.4 - lift}px) scale(${((scale + 1) / 2) * 1.03}) rotate(${dx > 0 ? -2.5 : 2.5}deg)`,
            offset: 0.5,
          },
          { transform: "none" },
        ],
        { duration: 680, easing: "cubic-bezier(.22,.85,.3,1)" }
      );
    } else {
      onLift(true);
    }
    const raf = requestAnimationFrame(() => setShown(true));
    const spinState = angle.current;
    return () => {
      cancelAnimationFrame(raf);
      animation?.cancel();
      document.body.style.overflow = overflow;
      cancelAnimationFrame(spinState.raf);
      spinState.raf = 0;
      onLift(false);
    };
  }, [source, reduced, onLift]);

  const dismiss = React.useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    setShown(false);
    const figure = figureRef.current;
    const to = source();
    if (!figure || !to || reduced || to.width === 0) {
      onClose();
      return;
    }
    const from = figure.getBoundingClientRect();
    const scale = to.width / from.width;
    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top + to.height / 2 - (from.top + from.height / 2);
    const animation = figure.animate(
      [
        { transform: "none" },
        {
          transform: `translate(${dx * 0.6}px, ${dy * 0.6 - 30}px) scale(${(scale + 1) / 2})`,
          offset: 0.55,
        },
        { transform: `translate(${dx}px, ${dy}px) scale(${scale})` },
      ],
      { duration: 560, easing: "cubic-bezier(.45,0,.55,1)", fill: "forwards" }
    );
    animation.onfinish = () => onClose();
  }, [source, reduced, onClose]);

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const dialog = dialogRef.current;
      if (!dialog || dialog.contains(event.target as Node)) return;
      if (event.key === "Escape") {
        event.preventDefault();
        dismiss();
      } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        turnTo(side === "front" ? "back" : "front");
      } else if (event.key === "Tab") {
        const first = dialog.querySelector("button");
        if (first) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [dismiss, turnTo, side]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      dismiss();
      return;
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      turnTo(side === "front" ? "back" : "front");
      return;
    }
    if (event.key !== "Tab") return;
    const controls = Array.from(dialogRef.current?.querySelectorAll("button") ?? []).filter(
      (node) => !node.disabled
    );
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  if (typeof document === "undefined") return null;

  const w = shape.w * unit;
  const h = shape.h * unit;

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex min-h-[100dvh] items-center justify-center overflow-y-auto p-4 pb-8 pt-16 text-foreground sm:p-6 sm:pt-16"
      onKeyDown={onKeyDown}
    >
      <div
        aria-hidden="true"
        className={`fixed inset-0 bg-background/92 backdrop-blur-xl transition-opacity duration-300 motion-reduce:transition-none ${
          shown ? "opacity-100" : "opacity-0"
        }`}
        onClick={dismiss}
      />

      <button
        ref={closeRef}
        type="button"
        onClick={dismiss}
        className={`fixed right-3 top-3 z-20 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-border bg-card/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-foreground shadow-subtle backdrop-blur-sm outline-none transition-[opacity,background-color] duration-300 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring sm:right-5 sm:top-5 motion-reduce:transition-none ${
          shown ? "opacity-100" : "opacity-0"
        }`}
      >
        <span>{labels.close}</span>
        <X className="size-4" aria-hidden="true" />
      </button>

      <div className="relative z-10 grid w-full max-w-5xl items-center justify-items-center gap-7 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] md:gap-12">
        <div ref={figureRef} data-figure className="relative" style={{ width: w, height: h }}>
          <div
            aria-hidden="true"
            className="absolute inset-x-[10%] -bottom-[7%] h-[16%] rounded-[50%] bg-black opacity-[0.18] blur-xl dark:opacity-60"
          />
          <div
            data-spin-area
            className="absolute inset-0 cursor-grab touch-pan-y active:cursor-grabbing"
            style={{ perspective: "1600px" }}
            onPointerDown={(event) => {
              const a = angle.current;
              a.dragging = true;
              a.startX = event.clientX;
              a.startAngle = a.value;
              cancelAnimationFrame(a.raf);
              a.raf = 0;
              a.last = 0;
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={(event) => {
              const a = angle.current;
              if (!a.dragging) return;
              a.value = clamp(
                a.startAngle + (event.clientX - a.startX) * 0.45,
                a.startAngle - 220,
                a.startAngle + 220
              );
              if (spinRef.current) {
                spinRef.current.style.transform = `rotateY(${a.value.toFixed(2)}deg)`;
              }
            }}
            onPointerUp={() => {
              const a = angle.current;
              if (!a.dragging) return;
              a.dragging = false;
              const facing = ((a.value % 360) + 360) % 360;
              turnTo(facing > 90 && facing < 270 ? "back" : "front");
            }}
            onPointerCancel={() => {
              angle.current.dragging = false;
              turnTo(side);
            }}
          >
            <div ref={spinRef} className="absolute inset-0 [transform-style:preserve-3d]">
              <div data-face="front" className="absolute inset-0 [backface-visibility:hidden]">
                <FrameArt item={item} shape={shape} unit={unit} lit={0.85} />
              </div>
              <div
                data-face="back"
                className="absolute inset-0 [backface-visibility:hidden]"
                style={{ transform: "rotateY(180deg)" }}
              >
                <FrameBack item={item} shape={shape} unit={unit} />
              </div>
            </div>
          </div>
        </div>

        <div
          className={`flex max-w-md flex-col gap-3.5 text-center transition-[opacity,transform] delay-150 duration-500 motion-reduce:transition-none md:text-left ${
            shown ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
          }`}
        >
          <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
            <span className="font-mono text-[11px] tracking-[0.2em] text-muted-foreground">
              {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </span>
            {item.categoryTag && (
              <span className="rounded-full border border-border bg-card px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {item.categoryTag}
              </span>
            )}
          </div>

          <h3
            id={titleId}
            className="font-serif text-2xl font-normal leading-tight text-foreground sm:text-3xl"
          >
            {item.title}
          </h3>

          {item.technique && (
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {item.technique}
            </p>
          )}

          {item.description && (
            <p className="text-sm leading-relaxed text-foreground/90 sm:text-base">
              {item.description}
            </p>
          )}

          {item.details && item.details.length > 0 && (
            <ul className="flex flex-wrap justify-center gap-2 pt-1 md:justify-start">
              {item.details.map((detail) => (
                <li
                  key={detail}
                  className="rounded-full border border-border bg-card/80 px-3 py-1 text-xs text-muted-foreground"
                >
                  {detail}
                </li>
              ))}
            </ul>
          )}

          <div
            role="group"
            aria-label={`${labels.front} / ${labels.back}`}
            className="mt-2 inline-flex flex-wrap items-center justify-center gap-5 md:justify-start"
          >
            {(["front", "back"] as const).map((face) => (
              <button
                key={face}
                type="button"
                aria-pressed={side === face}
                onClick={() => turnTo(face)}
                className={`relative inline-flex min-h-[40px] items-center gap-1.5 rounded-[3px] pb-1 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background motion-reduce:transition-none ${
                  side === face
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {face === "back" && <RotateCw className="size-3.5" aria-hidden="true" />}
                <span>{face === "front" ? labels.front : labels.back}</span>
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-0 bottom-0 h-px origin-left bg-foreground transition-transform duration-300 motion-reduce:transition-none ${
                    side === face ? "scale-x-100" : "scale-x-0"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default PictureRailGallery;
