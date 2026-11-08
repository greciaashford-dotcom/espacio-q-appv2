export type RitualNeedKey =
  | "all"
  | "renovar-forma"
  | "luz-y-color"
  | "calma-y-salud"
  | "evento-especial"
  | "mirada-y-manos";

export interface RitualNeedOption {
  key: RitualNeedKey;
  label: string;
  subtitle: string;
}

export const RITUAL_NEED_OPTIONS: RitualNeedOption[] = [
  {
    key: "all",
    label: "Toda la carta",
    subtitle: "Recorre los 6 capítulos completos de ESPACIO Q.",
  },
  {
    key: "renovar-forma",
    label: "Renovar forma y caída",
    subtitle: "Cortes a medida, movimiento ligero y fácil peinado en casa.",
  },
  {
    key: "luz-y-color",
    label: "Ganar luz y dimensión",
    subtitle: "Reflejos orgánicos, baños de brillo y coloración respetuosa.",
  },
  {
    key: "calma-y-salud",
    label: "Hidratar y desconectar",
    subtitle: "Head Spa, reconstrucción capilar y masaje bienestar.",
  },
  {
    key: "evento-especial",
    label: "Ocasión especial",
    subtitle: "Ondas editoriales, recogidos contemporáneos y novias.",
  },
  {
    key: "mirada-y-manos",
    label: "Mirada, rostro y manos",
    subtitle: "Diseño de cejas, lifting, masaje Kobido y manicura consciente.",
  },
];

export interface DefaultServiceCategorySeed {
  id: string;
  roman: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  coverUrl: string;
  sortOrder: number;
}

export interface DefaultServiceSeed {
  id: string;
  categorySlug: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  durationMin: number;
  bufferBeforeMin: number;
  bufferAfterMin: number;
  priceType: "FIXED" | "FROM" | "CONSULT";
  priceCents: number | null;
  featured: boolean;
  sortOrder: number;
  mediaAssetId?: string;
  needs: Exclude<RitualNeedKey, "all">[];
  ritualIncludes: string[];
  idealFor: string;
  faqJson: Array<{ question: string; answer: string }>;
}

export const DEFAULT_SERVICE_CATEGORIES: DefaultServiceCategorySeed[] = [
  {
    id: "cat-corte-arquitectura",
    roman: "Capítulo I",
    name: "Corte y Arquitectura Capilar",
    slug: "corte-y-arquitectura",
    tagline: "Geometría suave adaptada a tu caída natural",
    description:
      "Trabajamos la estructura en húmedo y el detalle en seco para respetar remolinos, densidad y estilo de vida, logrando cortes que envejecen con armonía semana tras semana.",
    coverUrl:
      "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=900&q=80",
    sortOrder: 1,
  },
  {
    id: "cat-color-luz",
    roman: "Capítulo II",
    name: "Color Consciente y Luz Natural",
    slug: "color-y-luz",
    tagline: "Dimensión translúcida sin efecto raíz artificial",
    description:
      "Iluminaciones trazadas a mano alzada, baños de brillo ácidos y fórmulas ricas en lípidos botánicos que cuidan la cutícula mientras aportan relieve cálido.",
    coverUrl:
      "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=900&q=80",
    sortOrder: 2,
  },
  {
    id: "cat-rituales-spa",
    roman: "Capítulo III",
    name: "Salud Capilar y Head Spa",
    slug: "rituales-capilares",
    tagline: "Pausa sensorial y recuperación profunda de la fibra",
    description:
      "Tratamientos terapéuticos para cuero cabelludo y medios a puntas acompañados de aromaterapia sutil, vapor templado y masaje craneocervical sin prisas.",
    coverUrl:
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=80",
    sortOrder: 3,
  },
  {
    id: "cat-estilismo-eventos",
    roman: "Capítulo IV",
    name: "Estilismo, Movimiento y Novias",
    slug: "estilismo-y-eventos",
    tagline: "Acabados flexibles con luz y naturalidad",
    description:
      "Desde un brushing pulido para tu semana hasta el diseño integral de peinados de invitada y novia con tacto sedoso y fijación invisible.",
    coverUrl:
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&q=80",
    sortOrder: 4,
  },
  {
    id: "cat-mirada-rostro",
    roman: "Capítulo V",
    name: "Mirada, Rostro y Bienestar Facial",
    slug: "mirada-y-rostro",
    tagline: "Equilibrio de facciones y piel descansada",
    description:
      "Diseño respetuoso de cejas y pestañas junto a rituales escultóricos faciales que liberan la tensión acumulada y devuelven jugosidad inmediata.",
    coverUrl:
      "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=900&q=80",
    sortOrder: 5,
  },
  {
    id: "cat-manos-pies",
    roman: "Capítulo VI",
    name: "Cuidado Consciente de Manos y Pies",
    slug: "manos-y-pies",
    tagline: "Belleza limpia, uñas sanas y calma táctil",
    description:
      "Rituales minimalistas de manicura japonesa, fórmulas libres de HEMA y pedicura wellness orientados a la salud real de la uña y la piel.",
    coverUrl:
      "https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?auto=format&fit=crop&w=900&q=80",
    sortOrder: 6,
  },
];

export const DEFAULT_SERVICES_CATALOG: DefaultServiceSeed[] = [
  // ── CAPÍTULO I: CORTE Y ARQUITECTURA CAPILAR ──
  {
    id: "svc-corte-autor",
    categorySlug: "corte-y-arquitectura",
    name: "Corte de Autor y Visagismo Personalizado",
    slug: "corte-de-autor-visagismo",
    shortDescription:
      "Diagnóstico facial, lavado relajante con masaje craneal, corte adaptado en húmedo y seco, y peinado de acabado natural.",
    description:
      "Nuestro servicio esencial de corte comienza con una conversación tranquila para comprender la textura de tu cabello, cómo lo peinas en tu día a día y qué proporciones favorecen tus rasgos.\n\nIncluye ritual de lavado sensorial con productos botánicos adaptados a tu cuero cabelludo, construcción precisa de la forma en húmedo, texturizado final en seco para observar la caída real y secado personalizado.",
    durationMin: 60,
    bufferBeforeMin: 0,
    bufferAfterMin: 10,
    priceType: "FIXED",
    priceCents: 5800,
    featured: true,
    sortOrder: 1,
    mediaAssetId: "media-hero-5",
    needs: ["renovar-forma"],
    ritualIncludes: [
      "Escucha y estudio de facciones y remolinos",
      "Lavado botánico con masaje craneal relajante",
      "Texturizado en seco y pauta de peinado en casa",
    ],
    idealFor: "Mantener o actualizar tu corte respetando la caída natural.",
    faqJson: [
      {
        question: "¿Incluye el lavado y el secado final?",
        answer:
          "Sí, todos nuestros servicios de corte incluyen lavado específico según tu cuero cabelludo y secado o definición final.",
      },
    ],
  },
  {
    id: "svc-corte-rizo-textura",
    categorySlug: "corte-y-arquitectura",
    name: "Corte en Seco Texturizado y Rizo Orgánico",
    slug: "corte-en-seco-rizo-organico",
    shortDescription:
      "Esculpido rizo a rizo en seco para ondas y cabellos rizados, seguido de hidratación ligera y definición con difusor.",
    description:
      "Diseñado específicamente para ondas, bucles y rizos que necesitan ser comprendidos en su encogimiento natural antes de lavar.\n\nEsculpimos la silueta en seco mecha a mecha para equilibrar volúmenes sin crear efecto pirámide, realizamos un baño de hidratación libre de sulfatos y definimos con técnicas suaves de secado.",
    durationMin: 65,
    bufferBeforeMin: 0,
    bufferAfterMin: 10,
    priceType: "FIXED",
    priceCents: 6400,
    featured: false,
    sortOrder: 2,
    needs: ["renovar-forma"],
    ritualIncludes: [
      "Corte inicial en seco sobre el patrón real del rizo",
      "Ritual de hidratación elástica sin siliconas pesadas",
      "Definición suave con difusor a baja temperatura",
    ],
    idealFor: "Cabellos ondulados y rizados que buscan volumen armónico.",
    faqJson: [
      {
        question: "¿Cómo debo acudir a la cita?",
        answer:
          "Recomendamos acudir con el cabello suelto, seco y con tu caída habitual, sin gomas ni trenzas que alteren la forma del rizo.",
      },
    ],
  },
  {
    id: "svc-transformacion-estilo",
    categorySlug: "corte-y-arquitectura",
    name: "Transformación de Estilo · Nuevo Look",
    slug: "transformacion-de-estilo-nuevo-look",
    shortDescription:
      "Tiempo extendido de asesoría y ejecución para cambios de melena larga a bob, pixie o rediseño completo de imagen.",
    description:
      "Cuando deseas dar un giro importante a tu imagen dedicamos tiempo adicional a explorar referencias, analizar la textura al cambiar de longitud y diseñar una transición cómoda.\n\nFinalizamos enseñándote paso a paso cómo moldear tu nueva longitud en pocos minutos cada mañana.",
    durationMin: 75,
    bufferBeforeMin: 0,
    bufferAfterMin: 15,
    priceType: "FIXED",
    priceCents: 7200,
    featured: false,
    sortOrder: 3,
    needs: ["renovar-forma"],
    ritualIncludes: [
      "Asesoría creativa extendida sin prisas",
      "Doble fase de corte arquitectónico y pulido",
      "Guía práctica de estilismo diario para tu nueva forma",
    ],
    idealFor: "Cambios significativos de longitud o rediseño completo.",
    faqJson: [],
  },
  {
    id: "svc-flequillo-contorno",
    categorySlug: "corte-y-arquitectura",
    name: "Diseño de Flequillo y Contorno Facial",
    slug: "diseno-flequillo-y-contorno",
    shortDescription:
      "Creación o retoque en seco de flequillo cortina, desfilado o recto y mechones que enmarcan los pómulos.",
    description:
      "Un gesto sutil capaz de refrescar por completo la expresión del rostro entre cortes completos. Trabajamos sobre cabello limpio y seco para calibrar con milimétrica precisión la apertura sobre cejas y pómulos.",
    durationMin: 25,
    bufferBeforeMin: 0,
    bufferAfterMin: 5,
    priceType: "FIXED",
    priceCents: 2200,
    featured: false,
    sortOrder: 4,
    needs: ["renovar-forma"],
    ritualIncludes: [
      "Estudio de proporción en frente y pómulos",
      "Corte de precisión en seco",
      "Toque final de pulido frontal",
    ],
    idealFor: "Refrescar la mirada o estrenar flequillo sin cortar el largo.",
    faqJson: [],
  },

  // ── CAPÍTULO II: COLOR CONSCIENTE Y LUZ NATURAL ──
  {
    id: "svc-balayage-organico",
    categorySlug: "color-y-luz",
    name: "Balayage Orgánico a Mano Alzada",
    slug: "balayage-organico-mano-alzada",
    shortDescription:
      "Iluminación gradual pintada a pincel libre para un degradado solar sin marcas en raíz, con matiz translúcido y tratamiento.",
    description:
      "Nuestra técnica insignia de iluminación respeta tu fondo natural para que el crecimiento sea imperceptible durante meses.\n\nDibujamos puntos de luz estratégicos alrededor del rostro y en velos internos, protegemos los enlaces de la fibra durante todo el proceso y sellamos con un baño de brillo ácido a medida.",
    durationMin: 150,
    bufferBeforeMin: 0,
    bufferAfterMin: 15,
    priceType: "FROM",
    priceCents: 13500,
    featured: true,
    sortOrder: 5,
    mediaAssetId: "media-hero-1",
    needs: ["luz-y-color"],
    ritualIncludes: [
      "Diseño de luz personalizado y protector de fibra",
      "Matiz gloss de brillo espejo sin amoníaco",
      "Lavado nutritivo y secado de acabado natural",
    ],
    idealFor: "Aportar relieve luminoso de bajo mantenimiento.",
    faqJson: [
      {
        question: "¿Cada cuánto tiempo requiere mantenimiento?",
        answer:
          "Al respetar la raíz natural, suele mantenerse impecable entre 3 y 5 meses, pudiendo refrescar solo el matiz si lo deseas.",
      },
    ],
  },
  {
    id: "svc-babylights-dimension",
    categorySlug: "color-y-luz",
    name: "Babylights y Micro-Iluminación Sutil",
    slug: "babylights-micro-iluminacion",
    shortDescription:
      "Finísimos hilos de luz tejidos desde la raíz para un aclarado delicado, uniforme y lleno de movimiento.",
    description:
      "Inspirado en los reflejos naturales de la infancia, este trabajo teje micro-secciones ultrafinas que se funden con tu color base sin líneas visibles, aportando luminosidad global y sensación de mayor densidad.",
    durationMin: 165,
    bufferBeforeMin: 0,
    bufferAfterMin: 15,
    priceType: "FROM",
    priceCents: 14500,
    featured: false,
    sortOrder: 6,
    needs: ["luz-y-color"],
    ritualIncludes: [
      "Tejido ultrafino de alta precisión",
      "Tonalización personalizada y sellado cuticular",
      "Peinado revelador de brillo",
    ],
    idealFor: "Rubios lino, castaños luminosos y transiciones suaves.",
    faqJson: [],
  },
  {
    id: "svc-color-botanico-raiz",
    categorySlug: "color-y-luz",
    name: "Coloración Respetuosa y Cobertura Natural",
    slug: "coloracion-respetuosa-cobertura",
    shortDescription:
      "Fórmulas delicadas ricas en aceites botánicos para cubrir canas o unificar el tono cuidando el confort del cuero cabelludo.",
    description:
      "Trabajamos el color global o el retoque de raíz con pigmentos de alta pureza libres de olores agresivos, logrando una cobertura translúcida y luminosa que evita el efecto bloque opaco.",
    durationMin: 90,
    bufferBeforeMin: 0,
    bufferAfterMin: 10,
    priceType: "FROM",
    priceCents: 6800,
    featured: false,
    sortOrder: 7,
    needs: ["luz-y-color"],
    ritualIncludes: [
      "Protección calmante en línea de contorno",
      "Aplicación precisa y emulsión de brillo en medios",
      "Lavado equilibrante de pH y secado",
    ],
    idealFor: "Cobertura armónica de canas o riqueza cromática uniforme.",
    faqJson: [],
  },
  {
    id: "svc-bano-brillo-gloss",
    categorySlug: "color-y-luz",
    name: "Baño de Brillo y Matiz Cristal (Gloss)",
    slug: "bano-de-brillo-gloss",
    shortDescription:
      "Tratamiento de color ácido sin aclarado que reaviva el tono, neutraliza reflejos apagados y aporta efecto espejo.",
    description:
      "El secreto entre sesiones de mechas o para cabellos vírgenes que buscan un velo extraordinario de luz. Su pH ácido cierra suavemente la cutícula, multiplica la reflexión de la luz y deja el cabello sedoso.",
    durationMin: 50,
    bufferBeforeMin: 0,
    bufferAfterMin: 10,
    priceType: "FIXED",
    priceCents: 5200,
    featured: false,
    sortOrder: 8,
    needs: ["luz-y-color", "calma-y-salud"],
    ritualIncludes: [
      "Fórmula gloss a medida (con pigmento sutil o cristal transparente)",
      "Masaje de infusión capilar en lavacabezas",
      "Secado ligero con acabado luminoso",
    ],
    idealFor: "Devolver vida al color o potenciar el brillo natural sin compromiso.",
    faqJson: [],
  },
  {
    id: "svc-correccion-color",
    categorySlug: "color-y-luz",
    name: "Corrección de Color y Proyecto a Medida",
    slug: "correccion-de-color-proyecto",
    shortDescription:
      "Plan técnico personalizado tras diagnóstico en salón para armonizar tonos previos priorizando la salud capilar.",
    description:
      "Para cabellos con acumulaciones de pigmento, bandas cromáticas o transiciones hacia la cana natural. Evaluamos la elasticidad de la fibra mediante prueba previa y confirmamos tiempos y presupuesto exacto antes de iniciar.",
    durationMin: 180,
    bufferBeforeMin: 0,
    bufferAfterMin: 15,
    priceType: "CONSULT",
    priceCents: null,
    featured: false,
    sortOrder: 9,
    needs: ["luz-y-color"],
    ritualIncludes: [
      "Diagnóstico técnico previo y test de elasticidad",
      "Reconstrucción de enlaces incluida durante el proceso",
      "Presupuesto cerrado confirmado antes de empezar",
    ],
    idealFor: "Unificar tonos complejos o iniciar transición a cana natural.",
    faqJson: [],
  },

  // ── CAPÍTULO III: SALUD CAPILAR Y HEAD SPA ──
  {
    id: "svc-ritual-head-spa",
    categorySlug: "rituales-capilares",
    name: "Ritual Head Spa Botánico y Oxigenación",
    slug: "ritual-head-spa-botanico",
    shortDescription:
      "Experiencia inmersiva de bienestar: exfoliación suave del cuero cabelludo, bruma tibia aromática y masaje craneocervical largo.",
    description:
      "Un refugio de silencio en mitad de Madrid. Liberamos el cuero cabelludo de impurezas y tensión acumulada mediante cepillado estimulante, peeling botánico oxigenante, baño de vapor tibio y 25 minutos de masaje lento en cráneo, sien, nuca y hombros, culminando con mascarilla nutritiva y secado suave.",
    durationMin: 65,
    bufferBeforeMin: 5,
    bufferAfterMin: 10,
    priceType: "FIXED",
    priceCents: 7800,
    featured: true,
    sortOrder: 10,
    mediaAssetId: "media-hero-6",
    needs: ["calma-y-salud"],
    ritualIncludes: [
      "Diagnóstico capilar y exfoliación oxigenante suave",
      "Vapor templado con aceites esenciales y masaje craneocervical",
      "Mascarilla profunda y secado relajado",
    ],
    idealFor: "Desconectar profundamente y revitalizar la raíz desde el origen.",
    faqJson: [],
  },
  {
    id: "svc-reconstruccion-molecular",
    categorySlug: "rituales-capilares",
    name: "Reconstrucción Molecular de Fibra y Enlaces",
    slug: "reconstruccion-molecular-fibra",
    shortDescription:
      "Terapia intensiva de péptidos y aminoácidos que repara la estructura interna del cabello fragilizado o decolorado.",
    description:
      "Actúa en el córtex capilar reconectando las cadenas de queratina debilitadas por herramientas térmicas, sol o procesos técnicos, devolviendo fuerza, cuerpo y resistencia a la rotura desde la primera sesión.",
    durationMin: 60,
    bufferBeforeMin: 0,
    bufferAfterMin: 10,
    priceType: "FROM",
    priceCents: 7400,
    featured: false,
    sortOrder: 11,
    needs: ["calma-y-salud"],
    ritualIncludes: [
      "Quelación purificante de metales y residuos minerales",
      "Doble infusión molecular de péptidos bio-afines",
      "Sellado térmico suave de cutícula",
    ],
    idealFor: "Cabellos finos, quebradizos o tratados químicamente.",
    faqJson: [],
  },
  {
    id: "svc-cura-hidratacion-lino",
    categorySlug: "rituales-capilares",
    name: "Cura de Hidratación en Lino y Seda Vegetal",
    slug: "cura-hidratacion-lino-seda",
    shortDescription:
      "Baño nutritivo ultraligero que devuelve elasticidad, suavidad táctil y movimiento fluido sin apelmazar.",
    description:
      "Formulado con extractos de semilla de lino, ceramidas vegetales y mantecas ligeras emulsionadas en templado para saciar la sed de medios y puntas manteniendo todo el volumen natural.",
    durationMin: 45,
    bufferBeforeMin: 0,
    bufferAfterMin: 10,
    priceType: "FIXED",
    priceCents: 5600,
    featured: false,
    sortOrder: 12,
    needs: ["calma-y-salud"],
    ritualIncludes: [
      "Preparación con champú micelar suave",
      "Compresa templada de infusión lipídica",
      "Peinado de acabado sedoso",
    ],
    idealFor: "Melenas apagadas o secas que no quieren perder ligereza.",
    faqJson: [],
  },
  {
    id: "svc-alisado-organico-antifrizz",
    categorySlug: "rituales-capilares",
    name: "Disciplinado Orgánico y Control Anti-Frizz",
    slug: "disciplinado-organico-antifrizz",
    shortDescription:
      "Tratamiento termo-activo libre de formol que elimina el encrespamiento y reduce a la mitad el tiempo de secado en casa.",
    description:
      "A base de ácidos orgánicos, taninos suaves y proteínas vegetales, alinea la fibra respetando su movimiento natural. Puedes optar por un acabado liso sedoso o por domar el encrespamiento conservando una onda suave.",
    durationMin: 165,
    bufferBeforeMin: 0,
    bufferAfterMin: 15,
    priceType: "FROM",
    priceCents: 17500,
    featured: false,
    sortOrder: 13,
    needs: ["calma-y-salud", "renovar-forma"],
    ritualIncludes: [
      "Fórmula 100 % libre de formol y derivados agresivos",
      "Personalización del grado de reducción de volumen",
      "Duración progresiva de 3 a 5 meses sin corte de raíz",
    ],
    idealFor: "Olvidarse de la humedad manteniendo brillo y suavidad.",
    faqJson: [],
  },

  // ── CAPÍTULO IV: ESTILISMO, MOVIMIENTO Y NOVIAS ──
  {
    id: "svc-brushing-ondas-editorial",
    categorySlug: "estilismo-y-eventos",
    name: "Brushing Editorial y Ondas Abiertas",
    slug: "brushing-editorial-ondas",
    shortDescription:
      "Lavado sensorial y secado con cepillo o herramienta térmica controlada para un cabello pulido, con cuerpo y movimiento.",
    description:
      "Nuestro peinado de salón huye de las lacas rígidas: trabajamos la raíz con aire direccional y las puntas con giro flexible u ondas deshechas para que el cabello acompañe cada gesto con naturalidad.",
    durationMin: 45,
    bufferBeforeMin: 0,
    bufferAfterMin: 5,
    priceType: "FROM",
    priceCents: 3800,
    featured: true,
    sortOrder: 14,
    mediaAssetId: "media-hero-2",
    needs: ["evento-especial"],
    ritualIncludes: [
      "Lavado relajante adaptado a tu tipo de cabello",
      "Protector térmico invisible de alto brillo",
      "Acabado a elegir: liso pulido, puntas con giro u ondas suaves",
    ],
    idealFor: "Cenas, reuniones clave o disfrutar de tu melena impecable.",
    faqJson: [],
  },
  {
    id: "svc-recogido-invitada",
    categorySlug: "estilismo-y-eventos",
    name: "Recogido Contemporáneo de Invitada",
    slug: "recogido-contemporaneo-invitada",
    shortDescription:
      "Moños bajos arquitectónicos, coletas pulidas o semirrecogidos orgánicos diseñados en armonía con tu vestido.",
    description:
      "Creamos recogidos que se sienten actuales, cómodos y seguros durante horas. Prepararemos previamente la textura del cabello para asegurar sujeción interna invisible sin tirantez.",
    durationMin: 60,
    bufferBeforeMin: 0,
    bufferAfterMin: 10,
    priceType: "FIXED",
    priceCents: 7500,
    featured: false,
    sortOrder: 15,
    needs: ["evento-especial"],
    ritualIncludes: [
      "Asesoría según escote, pendientes y horario del evento",
      "Preparación de textura y volumen duradero",
      "Colocación delicada de tocado o accesorio si lo traes",
    ],
    idealFor: "Bodas, celebraciones y eventos especiales.",
    faqJson: [],
  },
  {
    id: "svc-experiencia-novia",
    categorySlug: "estilismo-y-eventos",
    name: "Experiencia Novia ESPACIO Q (Prueba + Día B)",
    slug: "experiencia-novia-espacio-q",
    shortDescription:
      "Acompañamiento personalizado con sesión creativa previa, calendario de preparación capilar y estilismo para tu gran día.",
    description:
      "Un proceso sereno y cercano pensado para que te reconozcas a ti misma en tu mejor versión. Incluye asesoramiento de preparación de brillo y corte en las semanas previas, prueba completa sin límite rígido de propuestas y atención dedicada.",
    durationMin: 120,
    bufferBeforeMin: 0,
    bufferAfterMin: 15,
    priceType: "CONSULT",
    priceCents: null,
    featured: false,
    sortOrder: 16,
    needs: ["evento-especial"],
    ritualIncludes: [
      "Reunión inicial y plan de cuidado capilar previo",
      "Prueba completa de estilismo y adaptación de velo/tocado",
      "Atención exclusiva en salón o consulta de desplazamiento en Madrid",
    ],
    idealFor: "Novias que buscan elegancia atemporal y calma absoluta.",
    faqJson: [],
  },
  {
    id: "svc-styling-express-seco",
    categorySlug: "estilismo-y-eventos",
    name: "Estilismo Express · Toque de Luz en Seco",
    slug: "estilismo-express-en-seco",
    shortDescription:
      "Repaso rápido de ondas o pulido sobre cabello limpio y seco con bruma nutritiva de acabado.",
    description:
      "Pensado para cuando tienes treinta minutos entre compromisos y quieres transformar tu cabello limpio en unas ondas frescas o un acabado pulido de última hora.",
    durationMin: 30,
    bufferBeforeMin: 0,
    bufferAfterMin: 5,
    priceType: "FIXED",
    priceCents: 2900,
    featured: false,
    sortOrder: 17,
    needs: ["evento-especial"],
    ritualIncludes: [
      "Protección térmica sobre cabello seco",
      "Moldeado rápido de ondas o pulido",
      "Bruma botánica anti-encrespamiento",
    ],
    idealFor: "Un retoque impecable en solo 30 minutos.",
    faqJson: [],
  },

  // ── CAPÍTULO V: MIRADA, ROSTRO Y BIENESTAR FACIAL ──
  {
    id: "svc-arquitectura-cejas",
    categorySlug: "mirada-y-rostro",
    name: "Arquitectura de Cejas y Visagismo",
    slug: "arquitectura-de-cejas-visagismo",
    shortDescription:
      "Mapeo de proporciones faciales, diseño delicado con pinza e hilo orgánico y bálsamo calmante.",
    description:
      "Respetamos el grosor y la personalidad natural de tus cejas limpiando únicamente el vello que resta luz al párpado, equilibrando asimetrías con suavidad milimétrica.",
    durationMin: 30,
    bufferBeforeMin: 0,
    bufferAfterMin: 5,
    priceType: "FIXED",
    priceCents: 2800,
    featured: true,
    sortOrder: 18,
    needs: ["mirada-y-manos"],
    ritualIncludes: [
      "Diseño personalizado según estructura ósea",
      "Depilación precisa respetuosa con pieles sensibles",
      "Masaje descongestivo en arco superciliar",
    ],
    idealFor: "Enmarcar la mirada manteniendo total naturalidad.",
    faqJson: [],
  },
  {
    id: "svc-laminado-cejas-nutritivo",
    categorySlug: "mirada-y-rostro",
    name: "Laminado Orgánico de Cejas con Queratina",
    slug: "laminado-organico-cejas",
    shortDescription:
      "Redirección flexible del vello para unas cejas más pobladas, ordenadas y nutridas, con opción de matiz suave.",
    description:
      "Suaviza remolinos o pelos rebeldes permitiendo peinar la ceja con amplitud y ligereza natural, sin aspecto rígido ni pegado a la piel. Finaliza con concentrado de aceites fortalecedores.",
    durationMin: 45,
    bufferBeforeMin: 0,
    bufferAfterMin: 5,
    priceType: "FIXED",
    priceCents: 4800,
    featured: false,
    sortOrder: 19,
    needs: ["mirada-y-manos"],
    ritualIncludes: [
      "Laminado suave y diseño de forma incluido",
      "Opción de tinte translúcido natural",
      "Sérum nutritivo de queratina vegetal y argán",
    ],
    idealFor: "Cejas indómitas o con pequeñas calvas que buscan densidad visual.",
    faqJson: [],
  },
  {
    id: "svc-lifting-pestanas-queratina",
    categorySlug: "mirada-y-rostro",
    name: "Lifting de Pestañas y Baño de Queratina",
    slug: "lifting-pestanas-queratina",
    shortDescription:
      "Elevación natural de tus propias pestañas desde la raíz con tinte profundo y tratamiento fortalecedor.",
    description:
      "Abre e ilumina la mirada sin necesidad de rizador ni máscara diaria. Seleccionamos la curvatura exacta según la forma de tu ojo para lograr longitud elegante durante 6 a 8 semanas.",
    durationMin: 50,
    bufferBeforeMin: 0,
    bufferAfterMin: 10,
    priceType: "FIXED",
    priceCents: 5400,
    featured: false,
    sortOrder: 20,
    needs: ["mirada-y-manos", "evento-especial"],
    ritualIncludes: [
      "Elevación a medida desde la base de la pestaña",
      "Tinte negro o marrón intenso opcional",
      "Baño vitamínico regenerador",
    ],
    idealFor: "Despertar cada mañana con mirada descansada y luminosa.",
    faqJson: [],
  },
  {
    id: "svc-ritual-facial-kobido",
    categorySlug: "mirada-y-rostro",
    name: "Ritual Facial Escultórico Kobido",
    slug: "ritual-facial-kobido",
    shortDescription:
      "Masaje lifting japonés de rostro, mandíbula, cuello y escote que drena, redefine el óvalo e ilumina la piel al instante.",
    description:
      "Una coreografía manual profunda que combina maniobras drenantes lentas, percusiones rítmicas tonificantes y liberación miofascial del bruxismo mandibular, acompañada de aceites botánicos prensados en frío.",
    durationMin: 60,
    bufferBeforeMin: 5,
    bufferAfterMin: 10,
    priceType: "FIXED",
    priceCents: 8400,
    featured: false,
    sortOrder: 21,
    mediaAssetId: "media-hero-4",
    needs: ["mirada-y-manos", "calma-y-salud"],
    ritualIncludes: [
      "Doble limpieza botánica con toallas calientes",
      "45 minutos de masaje Kobido craneofacial y cervical",
      "Velo hidratante iluminador final",
    ],
    idealFor: "Rostros fatigados, tensión mandibular o búsqueda de luz inmediata.",
    faqJson: [],
  },

  // ── CAPÍTULO VI: CUIDADO CONSCIENTE DE MANOS Y PIES ──
  {
    id: "svc-manicura-japonesa",
    categorySlug: "manos-y-pies",
    name: "Manicura Japonesa · Salud y Brillo Natural",
    slug: "manicura-japonesa-brillo-natural",
    shortDescription:
      "Ritual ancestral sin esmalte a base de cera de abeja y polvo mineral que nutre y aporta un brillo perlado natural.",
    description:
      "Ideal para recuperar uñas debilitadas o para quienes aman la elegancia de una mano limpia e impecable. Sellamos nutrientes directamente en la lámina ungueal con gamuza tradicional.",
    durationMin: 45,
    bufferBeforeMin: 0,
    bufferAfterMin: 5,
    priceType: "FIXED",
    priceCents: 3800,
    featured: false,
    sortOrder: 22,
    needs: ["mirada-y-manos", "calma-y-salud"],
    ritualIncludes: [
      "Cuidado delicado de cutículas y limado anatómico",
      "Pulido nutritivo con pasta mineral y cera natural",
      "Masaje hidratante de manos y antebrazos",
    ],
    idealFor: "Uñas sanas con aspecto pulido natural que no se descama.",
    faqJson: [],
  },
  {
    id: "svc-manicura-spa-hema-free",
    categorySlug: "manos-y-pies",
    name: "Manicura Spa Minimalista (HEMA-Free)",
    slug: "manicura-spa-minimalista",
    shortDescription:
      "Preparación meticulosa de la uña, exfoliación botánica y esmaltado tradicional o semipermanente respetuoso libre de HEMA.",
    description:
      "Una carta curada de tonos nude lino, tierra, burdeos profundo y rojos clásicos con fórmulas respetuosas que protegen la salud de la uña natural en cada aplicación y retirada.",
    durationMin: 55,
    bufferBeforeMin: 0,
    bufferAfterMin: 10,
    priceType: "FIXED",
    priceCents: 4400,
    featured: true,
    sortOrder: 23,
    mediaAssetId: "media-hero-3",
    needs: ["mirada-y-manos", "evento-especial"],
    ritualIncludes: [
      "Trabajo preciso de cutícula y nivelación suave",
      "Esmaltado vegano o semipermanente HEMA-Free",
      "Exfoliación suave e hidratación con aceite tibio",
    ],
    idealFor: "Manos cuidadas durante semanas en tonos atemporales.",
    faqJson: [],
  },
  {
    id: "svc-pedicura-wellness",
    categorySlug: "manos-y-pies",
    name: "Pedicura Wellness Calmante",
    slug: "pedicura-wellness-calmante",
    shortDescription:
      "Baño aromático templado, perfeccionamiento completo de pies y uñas, masaje descansante y acabado natural o color.",
    description:
      "Un momento reparador para desconectar de pies a cabeza. Trabajamos con suavidad callosidades y cutículas, exfoliamos con sales finas y dedicamos un masaje lento que devuelve ligereza inmediata al caminar.",
    durationMin: 65,
    bufferBeforeMin: 5,
    bufferAfterMin: 10,
    priceType: "FIXED",
    priceCents: 5800,
    featured: false,
    sortOrder: 24,
    needs: ["mirada-y-manos", "calma-y-salud"],
    ritualIncludes: [
      "Baño botánico templado y exfoliación renovadora",
      "Cuidado integral de uñas y piel plantar",
      "Masaje descongestivo y esmaltado a elección",
    ],
    idealFor: "Regalar descanso profundo e hidratación duradera a tus pies.",
    faqJson: [],
  },
];

export const CHAPTER_META_BY_SLUG: Record<string, DefaultServiceCategorySeed> =
  Object.fromEntries(DEFAULT_SERVICE_CATEGORIES.map((c) => [c.slug, c]));

export const SERVICE_META_BY_SLUG: Record<string, DefaultServiceSeed> =
  Object.fromEntries(DEFAULT_SERVICES_CATALOG.map((s) => [s.slug, s]));

/**
 * Ubicación verificada y ficha pública de Espacio Q en Madrid (Calle de Pelayo, 41 · Chueca / Justicia).
 */
export const ESPACIO_Q_LOCATION_METADATA = {
  addressLine: "Calle de Pelayo, 41",
  postalCode: "28004",
  neighborhood: "Justicia · Chueca",
  city: "Madrid",
  country: "España",
  phone: "+34 914 45 21 31",
  latitude: 40.4241269,
  longitude: -3.6976262,
  googleMapsUrl:
    "https://www.google.com/maps/place/Espacio+Q/@40.424131,-3.7002011,17z/data=!4m15!1m8!3m7!1s0xd4228618d8af967:0xa4f32211fe6d024d!2sEspacio+Q!8m2!3d40.4241269!4d-3.6976262!10e1!16s%2Fg%2F1q65y9wd5!3m5!1s0xd4228618d8af967:0xa4f32211fe6d024d!8m2!3d40.4241269!4d-3.6976262!16s%2Fg%2F1q65y9wd5",
} as const;

/**
 * Horario oficial de atención de Espacio Q (Europe/Madrid):
 * - Lunes: Cerrado
 * - Martes a Viernes: 10:30 – 21:00 (jornada continua)
 * - Sábado: 09:00 – 16:00 (jornada continua)
 * - Domingo: Cerrado
 */
export const ESPACIO_Q_WEEKLY_SCHEDULE: Array<{
  dayOfWeek: number;
  isOpen: boolean;
  intervals: Array<{ start: string; end: string }>;
}> = [
  { dayOfWeek: 0, isOpen: false, intervals: [] }, // Domingo
  { dayOfWeek: 1, isOpen: false, intervals: [] }, // Lunes
  { dayOfWeek: 2, isOpen: true, intervals: [{ start: "10:30", end: "21:00" }] }, // Martes
  { dayOfWeek: 3, isOpen: true, intervals: [{ start: "10:30", end: "21:00" }] }, // Miércoles
  { dayOfWeek: 4, isOpen: true, intervals: [{ start: "10:30", end: "21:00" }] }, // Jueves
  { dayOfWeek: 5, isOpen: true, intervals: [{ start: "10:30", end: "21:00" }] }, // Viernes
  { dayOfWeek: 6, isOpen: true, intervals: [{ start: "09:00", end: "16:00" }] }, // Sábado
];

export interface DefaultProfessionalSeed {
  id: string;
  mediaAssetId: string;
  name: string;
  slug: string;
  roleTitle: string;
  bio: string;
  specialties: string[];
  photoUrl: string;
  sortOrder: number;
  serviceSlugs: string[];
}

export const DEFAULT_PROFESSIONALS_CATALOG: DefaultProfessionalSeed[] = [
  {
    id: "pro-clara-mendoza",
    mediaAssetId: "media-team-1",
    name: "Clara Mendoza",
    slug: "clara-mendoza",
    roleTitle: "DIRECCIÓN ARTÍSTICA · CORTE Y FORMA",
    bio: "Corte en seco, líneas orgánicas y estudio personalizado de facciones.",
    specialties: ["Corte en seco", "Visagismo", "Transformación de estilo", "Novias"],
    photoUrl:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=700&q=80",
    sortOrder: 1,
    serviceSlugs: [
      "corte-de-autor-visagismo",
      "corte-en-seco-rizo-organico",
      "transformacion-de-estilo-nuevo-look",
      "diseno-flequillo-y-contorno",
      "balayage-organico-mano-alzada",
      "bano-de-brillo-gloss",
      "brushing-editorial-ondas",
      "recogido-contemporaneo-invitada",
      "experiencia-novia-espacio-q",
      "estilismo-express-en-seco",
    ],
  },
  {
    id: "pro-mateo-valdes",
    mediaAssetId: "media-team-2",
    name: "Mateo Valdés",
    slug: "mateo-valdes",
    roleTitle: "ESPECIALISTA EN COLOR Y LUZ NATURAL",
    bio: "Iluminación a mano alzada, matices cálidos y coloración respetuosa.",
    specialties: ["Balayage orgánico", "Babylights", "Color botánico", "Corrección de color"],
    photoUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=700&q=80",
    sortOrder: 2,
    serviceSlugs: [
      "balayage-organico-mano-alzada",
      "babylights-micro-iluminacion",
      "coloracion-respetuosa-cobertura",
      "bano-de-brillo-gloss",
      "correccion-de-color-proyecto",
      "ritual-head-spa-botanico",
      "reconstruccion-molecular-fibra",
      "cura-hidratacion-lino-seda",
      "disciplinado-organico-antifrizz",
    ],
  },
  {
    id: "pro-sofia-alarcon",
    mediaAssetId: "media-team-3",
    name: "Sofía Alarcón",
    slug: "sofia-alarcon",
    roleTitle: "ESTILISMO EDITORIAL Y RECOGIDOS",
    bio: "Peinados con movimiento natural, ondas abiertas y estilismo de eventos.",
    specialties: ["Brushing editorial", "Recogidos de invitada", "Novias", "Acabado luminoso"],
    photoUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=700&q=80",
    sortOrder: 3,
    serviceSlugs: [
      "corte-de-autor-visagismo",
      "diseno-flequillo-y-contorno",
      "brushing-editorial-ondas",
      "recogido-contemporaneo-invitada",
      "experiencia-novia-espacio-q",
      "estilismo-express-en-seco",
      "manicura-spa-minimalista",
    ],
  },
  {
    id: "pro-lucas-ferrer",
    mediaAssetId: "media-team-4",
    name: "Lucas Ferrer",
    slug: "lucas-ferrer",
    roleTitle: "CORTE CONTEMPORÁNEO Y TEXTURA",
    bio: "Capas invisibles, cabello rizado u ondulado y cortes de fácil mantenimiento.",
    specialties: ["Rizo orgánico", "Capas invisibles", "Iluminación sutil", "Anti-frizz"],
    photoUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=700&q=80",
    sortOrder: 4,
    serviceSlugs: [
      "corte-de-autor-visagismo",
      "corte-en-seco-rizo-organico",
      "transformacion-de-estilo-nuevo-look",
      "diseno-flequillo-y-contorno",
      "balayage-organico-mano-alzada",
      "babylights-micro-iluminacion",
      "coloracion-respetuosa-cobertura",
      "bano-de-brillo-gloss",
      "disciplinado-organico-antifrizz",
    ],
  },
  {
    id: "pro-valeria-soto",
    mediaAssetId: "media-team-5",
    name: "Valeria Soto",
    slug: "valeria-soto",
    roleTitle: "SALUD CAPILAR Y RITUALES BOTÁNICOS",
    bio: "Diagnóstico del cuero cabelludo, hidratación profunda y recuperación de fibra.",
    specialties: ["Head Spa", "Reconstrucción molecular", "Botánica capilar", "Kobido"],
    photoUrl:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=700&q=80",
    sortOrder: 5,
    serviceSlugs: [
      "ritual-head-spa-botanico",
      "reconstruccion-molecular-fibra",
      "cura-hidratacion-lino-seda",
      "disciplinado-organico-antifrizz",
      "coloracion-respetuosa-cobertura",
      "bano-de-brillo-gloss",
      "ritual-facial-kobido",
    ],
  },
  {
    id: "pro-elena-quiroga",
    mediaAssetId: "media-team-6",
    name: "Elena Quiroga",
    slug: "elena-quiroga",
    roleTitle: "CUIDADO ESTÉTICO Y ARMONÍA FACIAL",
    bio: "Diseño de mirada, rituales calmantes y acabado luminoso de la piel.",
    specialties: ["Diseño de cejas", "Lifting de pestañas", "Masaje Kobido", "Manicura consciente"],
    photoUrl:
      "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=700&q=80",
    sortOrder: 6,
    serviceSlugs: [
      "arquitectura-de-cejas-visagismo",
      "laminado-organico-cejas",
      "lifting-pestanas-queratina",
      "ritual-facial-kobido",
      "manicura-japonesa-brillo-natural",
      "manicura-spa-minimalista",
      "pedicura-wellness-calmante",
    ],
  },
];
