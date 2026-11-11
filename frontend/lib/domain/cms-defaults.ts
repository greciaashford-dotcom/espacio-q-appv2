export type SalonHeroPhoto = {
  id: string;
  assetId: string;
  src: string;
  alt: string;
  caption?: string;
  focalPoint?: { x: number; y: number };
  order: number;
};

export type SalonHeroContent = {
  eyebrow?: string;
  title: string;
  description?: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  discoverLabel?: string;
  photos: SalonHeroPhoto[];
  animationEnabled: boolean;
};

export type LegalSection = {
  id: string;
  heading: string;
  content: string;
};

export type LegalDocumentData = {
  title: string;
  subtitle: string;
  slug: string;
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
};

export const DEFAULT_MEDIA_ASSETS = [
  {
    id: "media-hero-1",
    internalName: "Textura capilar editorial lino",
    src: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&q=80",
    sourceType: "EXTERNAL_URL" as const,
    mimeType: "image/jpeg",
    width: 900,
    height: 1125,
    sizeBytes: 0,
    altText: "Ambiente sereno de salón de belleza contemporáneo con luz natural",
    caption: "Imagen editorial provisional de referencia estética",
    category: "hero",
    focalPointX: 50,
    focalPointY: 45,
    sortOrder: 1,
    authorCredit: "Unsplash (Licencia Unsplash)",
    licenseNote: "Provisional de maquetación — sustituir por fotografía propia de ESPACIO Q",
    isProvisional: true,
    publicVisible: true,
  },
  {
    id: "media-hero-2",
    internalName: "Detalle de estilismo y cuidado orgánico",
    src: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&q=80",
    sourceType: "EXTERNAL_URL" as const,
    mimeType: "image/jpeg",
    width: 900,
    height: 1125,
    sizeBytes: 0,
    altText: "Cuidado capilar personalizado con acabado natural",
    caption: "Imagen editorial provisional de referencia estética",
    category: "hero",
    focalPointX: 50,
    focalPointY: 40,
    sortOrder: 2,
    authorCredit: "Unsplash (Licencia Unsplash)",
    licenseNote: "Provisional de maquetación — sustituir por fotografía propia de ESPACIO Q",
    isProvisional: true,
    publicVisible: true,
  },
  {
    id: "media-hero-3",
    internalName: "Arquitectura interior cálida en tonos piedra",
    src: "https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?auto=format&fit=crop&w=900&q=80",
    sourceType: "EXTERNAL_URL" as const,
    mimeType: "image/jpeg",
    width: 900,
    height: 1125,
    sizeBytes: 0,
    altText: "Tocadores minimalistas en tonos piedra y madera clara",
    caption: "Imagen editorial provisional de referencia estética",
    category: "hero",
    focalPointX: 50,
    focalPointY: 50,
    sortOrder: 3,
    authorCredit: "Unsplash (Licencia Unsplash)",
    licenseNote: "Provisional de maquetación — sustituir por fotografía propia de ESPACIO Q",
    isProvisional: true,
    publicVisible: true,
  },
  {
    id: "media-hero-4",
    internalName: "Ritual de bienestar y belleza consciente",
    src: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=900&q=80",
    sourceType: "EXTERNAL_URL" as const,
    mimeType: "image/jpeg",
    width: 900,
    height: 1125,
    sizeBytes: 0,
    altText: "Herramientas profesionales de peluquería y cosmética sobre lino",
    caption: "Imagen editorial provisional de referencia estética",
    category: "hero",
    focalPointX: 50,
    focalPointY: 50,
    sortOrder: 4,
    authorCredit: "Unsplash (Licencia Unsplash)",
    licenseNote: "Provisional de maquetación — sustituir por fotografía propia de ESPACIO Q",
    isProvisional: true,
    publicVisible: true,
  },
  {
    id: "media-hero-5",
    internalName: "Luz cálida sobre cabello trabajado",
    src: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=900&q=80",
    sourceType: "EXTERNAL_URL" as const,
    mimeType: "image/jpeg",
    width: 900,
    height: 1125,
    sizeBytes: 0,
    altText: "Detalle de peinado con movimiento suave y luz natural",
    caption: "Imagen editorial provisional de referencia estética",
    category: "hero",
    focalPointX: 50,
    focalPointY: 35,
    sortOrder: 5,
    authorCredit: "Unsplash (Licencia Unsplash)",
    licenseNote: "Provisional de maquetación — sustituir por fotografía propia de ESPACIO Q",
    isProvisional: true,
    publicVisible: true,
  },
  {
    id: "media-hero-6",
    internalName: "Detalle botánico y calma en salón",
    src: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=80",
    sourceType: "EXTERNAL_URL" as const,
    mimeType: "image/jpeg",
    width: 900,
    height: 1125,
    sizeBytes: 0,
    altText: "Texturas naturales de lino y cerámica en zona de espera",
    caption: "Imagen editorial provisional de referencia estética",
    category: "hero",
    focalPointX: 50,
    focalPointY: 50,
    sortOrder: 6,
    authorCredit: "Unsplash (Licencia Unsplash)",
    licenseNote: "Provisional de maquetación — sustituir por fotografía propia de ESPACIO Q",
    isProvisional: true,
    publicVisible: true,
  },
];

export const DEFAULT_INTRO_FLIP_IMAGES = [
  {
    title: "Interior sereno en tonos lino y piedra clara",
    url: "https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?auto=format&fit=crop&w=1000&q=80",
  },
  {
    title: "Ambiente luminoso del salón con luz natural",
    url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1000&q=80",
  },
  {
    title: "Estilismo y cuidado capilar personalizado",
    url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80",
  },
  {
    title: "Herramientas de oficio y cosmética consciente",
    url: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=1000&q=80",
  },
  {
    title: "Movimiento natural y acabado luminoso",
    url: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=1000&q=80",
  },
  {
    title: "Detalles de calma y bienestar en ESPACIO Q",
    url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=80",
  },
];

export const DEFAULT_GALLERY_RAIL_ITEMS = [
  {
    id: "look-bob-organico",
    title: "Corte Bob Orgánico con Textura",
    technique: "Corte en seco y desfilado interno",
    categoryTag: "Corte & Textura",
    description:
      "Línea bob a la altura de la mandíbula trabajada en seco para acompañar el remolino y la caída natural del cabello, logrando volumen ligero sin rigidez.",
    url: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=900&q=80",
    frame: "oak" as const,
    aspect: 0.78,
    mat: true,
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
    frame: "white" as const,
    aspect: 1.25,
    mat: true,
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
    frame: "oak" as const,
    aspect: 0.76,
    mat: false,
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
    frame: "black" as const,
    aspect: 1,
    mat: true,
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
    frame: "white" as const,
    aspect: 0.8,
    mat: true,
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
    frame: "oak" as const,
    aspect: 1.3,
    mat: true,
    details: [
      "Alineado respetuoso de la fibra",
      "Control duradero del encrespamiento",
      "Tacto ligero y brillo espejo",
    ],
  },
];

export const DEFAULT_TEAM_SHOWCASE_MEMBERS = [
  {
    id: "eq-team-1",
    name: "Clara Mendoza",
    role: "DIRECCIÓN ARTÍSTICA · CORTE Y FORMA",
    specialty: "Corte en seco, líneas orgánicas y estudio personalizado de facciones.",
    url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=700&q=80",
    instagramHref: "https://instagram.com",
    linkedinHref: "",
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
    linkedinHref: "",
  },
  {
    id: "eq-team-4",
    name: "Lucas Ferrer",
    role: "CORTE CONTEMPORÁNEO Y TEXTURA",
    specialty: "Capas invisibles, cabello rizado u ondulado y cortes de fácil mantenimiento.",
    url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=700&q=80",
    instagramHref: "",
    linkedinHref: "https://linkedin.com",
  },
  {
    id: "eq-team-5",
    name: "Valeria Soto",
    role: "SALUD CAPILAR Y RITUALES BOTÁNICOS",
    specialty: "Diagnóstico del cuero cabelludo, hidratación profunda y recuperación de fibra.",
    url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=700&q=80",
    instagramHref: "https://instagram.com",
    linkedinHref: "",
  },
  {
    id: "eq-team-6",
    name: "Elena Quiroga",
    role: "CUIDADO ESTÉTICO Y ARMONÍA FACIAL",
    specialty: "Diseño de mirada, rituales calmantes y acabado luminoso de la piel.",
    url: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=700&q=80",
    instagramHref: "https://instagram.com",
    linkedinHref: "",
  },
];

export const COOKIES_MAPS_MENTION =
  "\n\n3. Mapas de terceros (Google Maps) (Desactivada por defecto):\nEn la página de Contacto mostramos por defecto un mapa de OpenStreetMap que no instala cookies. Solo si activas la categoría «Mapas de terceros (Google Maps)» (o pulsas «Aceptar y cargar Google Maps» junto al mapa) se carga el mapa de Google, que puede instalar cookies propias y tratar datos de navegación conforme a la política de privacidad de Google. Puedes retirar este consentimiento en cualquier momento desde el panel de preferencias.";

export const DEFAULT_CONTACT_DIRECTIONS = {
  title: "Cómo llegar",
  metro: "Chueca (L5), a pocos pasos · Alonso Martínez (L4, L5, L10)",
  bus: "",
  parking:
    "Zona SER y Zona de Bajas Emisiones de Madrid: recomendamos parkings públicos cercanos (p. ej. Calle Hernán Cortés o Fuencarral – Santa Bárbara)",
};

export const DEFAULT_MAPS_COOKIE_TEXTS = {
  mapsTitle: "Mapas de terceros (Google Maps)",
  mapsDescription:
    "Permiten mostrar el mapa interactivo de Google Maps en la página de Contacto. Sin esta opción verás un mapa de OpenStreetMap sin cookies.",
};

export const LEGACY_HOME_SEO_TITLE = "ESPACIO Q · Salón de Belleza en Madrid";
export const HOME_SEO = {
  seoTitle: "ESPACIO Q · Peluquería y salón de belleza en Chueca, Madrid",
  seoDescription:
    "Peluquería y salón de belleza en Chueca, Madrid (Calle de Pelayo 41): corte, color, head spa, estilismo y estética. Reserva tu cita online en ESPACIO Q.",
};

export const DEFAULT_FAQ_ITEMS = [
  {
    question: "¿Dónde está ESPACIO Q y cómo llego en metro?",
    answer:
      "Estamos en la Calle de Pelayo, 41, 28004 Madrid, en el barrio de Chueca (Justicia). Las estaciones de metro más cercanas son Chueca (L5), a pocos pasos, y Alonso Martínez (L4, L5, L10).",
  },
  {
    question: "¿Cuál es el horario del salón?",
    answer:
      "De martes a viernes abrimos de 10:30 a 21:00 y los sábados de 09:00 a 16:00, en jornada continua. Domingos y lunes, cerrado.",
  },
  {
    question: "¿Cómo puedo reservar cita?",
    answer:
      "Puedes reservar online en la página Reservar cita: eliges el servicio, tu profesional (o «Cualquier profesional disponible»), la fecha y una hora libre calculada en tiempo real. Recibirás un correo con el resumen y un enlace seguro para gestionar tu cita. También puedes llamarnos al {{phone}}.",
  },
  {
    question: "¿Puedo cambiar o cancelar mi cita?",
    answer:
      "Sí. Desde el enlace de gestión incluido en tu correo de confirmación puedes reprogramar o cancelar tu cita sin coste hasta {{cancellationFreeHours}} horas antes de la hora reservada, sin necesidad de crear una cuenta. Consulta los detalles en nuestras Condiciones de Reserva.",
  },
  {
    question: "¿Dónde puedo aparcar cerca del salón?",
    answer:
      "La zona tiene estacionamiento regulado (Zona SER) y forma parte de la Zona de Bajas Emisiones de Madrid, por lo que recomendamos los parkings públicos cercanos, por ejemplo en la Calle Hernán Cortés o en Fuencarral – Santa Bárbara.",
  },
  {
    question: "¿Qué servicios ofrecéis y cuánto cuestan?",
    answer:
      "Nuestra carta se organiza en seis capítulos: Corte y Arquitectura Capilar; Color Consciente y Luz Natural; Salud Capilar y Head Spa; Estilismo, Movimiento y Novias; Mirada, Rostro y Bienestar Facial; y Cuidado Consciente de Manos y Pies. En la carta de servicios verás la duración y el precio de cada uno (IVA incluido). Los precios «Desde» o «A consultar» se confirman en el salón tras el diagnóstico y antes de empezar.",
  },
];

export const DEFAULT_CMS_PAGES: Array<{
  key: string;
  title: string;
  category: "GLOBAL" | "PAGE" | "SECTION" | "LEGAL";
  slug: string | null;
  seoTitle: string;
  seoDescription: string;
  data: Record<string, unknown>;
}> = [
  {
    key: "header_footer",
    title: "Cabecera, Navegación y Pie de Página",
    category: "GLOBAL",
    slug: null,
    seoTitle: "ESPACIO Q · Salón de Belleza en Madrid",
    seoDescription: "Un espacio para cuidar de ti en Madrid. Estilismo, cuidado capilar y rituales de belleza personalizados.",
    data: {
      brandName: "ESPACIO Q",
      brandSubtitle: "MADRID",
      ctaLabel: "Reservar cita",
      ctaHref: "/reservar",
      newsletterTriggerLabel: "Newsletter",
      navItems: [
        { label: "Servicios", href: "/servicios", visible: true },
        { label: "Equipo", href: "/equipo", visible: true },
        { label: "Galería", href: "/galeria", visible: true },
        { label: "Contacto", href: "/contacto", visible: true },
      ],
      footerTagline: "Un espacio para cuidar de ti. Cuidado capilar y belleza consciente con cita previa en el corazón de Madrid.",
      footerCopyright: "ESPACIO Q. Todos los derechos reservados.",
      legalLinks: [
        { label: "Aviso Legal", href: "/aviso-legal", visible: true },
        { label: "Términos y Condiciones", href: "/terminos-y-condiciones", visible: true },
        { label: "Condiciones de Reserva", href: "/condiciones-reserva", visible: true },
        { label: "Política de Privacidad", href: "/privacidad", visible: true },
        { label: "Política de Cookies", href: "/cookies", visible: true },
      ],
    },
  },
  {
    key: "home_hero",
    title: "Inicio · Hero 3D (Perspective Tunnel)",
    category: "SECTION",
    slug: "/",
    seoTitle: HOME_SEO.seoTitle,
    seoDescription: HOME_SEO.seoDescription,
    data: {
      eyebrow: "ESPACIO Q · MADRID",
      title: "Un espacio para cuidar de ti",
      description:
        "Belleza serena, escucha atenta y tiempos pensados para cada persona. Una experiencia de salón contemporánea en Madrid.",
      primaryCta: { label: "Reservar cita", href: "/reservar" },
      secondaryCta: { label: "Explorar servicios", href: "/servicios" },
      discoverLabel: "Descubrir el salón",
      animationEnabled: true,
      photos: DEFAULT_MEDIA_ASSETS.map((m, idx) => ({
        id: `hero-photo-${idx + 1}`,
        assetId: m.id,
        src: m.src,
        alt: m.altText,
        caption: m.caption,
        focalPoint: { x: m.focalPointX, y: m.focalPointY },
        order: idx + 1,
      })),
    } satisfies SalonHeroContent,
  },
  {
    key: "home_sections",
    title: "Inicio · Bloques Editoriales, Experiencia, FAQ y Contacto",
    category: "PAGE",
    slug: "/",
    seoTitle: "ESPACIO Q · Salón de Belleza en Madrid",
    seoDescription: "Descubre la propuesta de ESPACIO Q en Madrid: cuidado capilar, tratamientos personalizados y reserva online.",
    data: {
      intro: {
        visible: true,
        eyebrow: "FILOSOFÍA EDITORIAL",
        title: "La calma como punto de partida",
        lead: "En ESPACIO Q entendemos cada visita como una pausa dedicada a escuchar lo que tu cabello y tu piel necesitan hoy.",
        body: "Trabajamos desde el diagnóstico honesto, respetando la textura natural, los tiempos de cada proceso y la armonía de tus rasgos. Todo este bloque editorial es editable desde el panel de administración.",
        quote: "Menos artificio, más tiempo de calidad y oficio en cada detalle.",
        flipImages: DEFAULT_INTRO_FLIP_IMAGES,
      },
      featuredServices: {
        visible: true,
        eyebrow: "CARTA DE SERVICIOS Y RITUALES",
        title: "Seis capítulos pensados a tu medida",
        description: "Recorre nuestros capítulos de corte, color consciente, head spa, estilismo, armonía facial y cuidado de manos. Cada servicio incluye tiempo de valoración inicial y procede directamente del catálogo oficial del salón.",
        ctaLabel: "Leer la carta completa",
        emptyStateMessage: "El catálogo de servicios se encuentra en actualización. Consulta con el salón o vuelve muy pronto.",
      },
      experience: {
        visible: true,
        eyebrow: "LA EXPERIENCIA ESPACIO Q",
        title: "Atención pausada, técnica precisa",
        description: "Diseñamos una agenda equilibrada para evitar esperas innecesarias y dedicar a cada cita la atención que merece.",
        imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80",
        imageAlt: "Detalle de trabajo técnico en el salón",
        pillars: [
          {
            title: "Diagnóstico previo",
            badge: "Escucha y valoración",
            description: "Valoramos el estado real, el historial y tus objetivos antes de recomendar o aplicar cualquier servicio.",
            url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80",
          },
          {
            title: "Agenda sin prisas",
            badge: "Tiempo dedicado",
            description: "Calculamos duraciones reales con márgenes de preparación e higiene entre citas para respetar tu tiempo.",
            url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1000&q=80",
          },
          {
            title: "Seguimiento honesto",
            badge: "Cuidado continuo",
            description: "Te orientamos sobre cómo mantener el resultado en casa sin rutinas complicadas ni recomendaciones innecesarias.",
            url: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=1000&q=80",
          },
        ],
      },
      teamSection: {
        visible: true,
        eyebrow: "EQUIPO PROFESIONAL",
        title: "Manos expertas a tu cuidado",
        description: "Pasa el cursor o pulsa sobre cada integrante para conocer a las manos creativas de ESPACIO Q.",
        ctaLabel: "Conocer al equipo",
        provisionalNote: "Perfiles de muestra iniciales configurables desde el panel del salón.",
        showcaseMembers: DEFAULT_TEAM_SHOWCASE_MEMBERS,
      },
      gallerySection: {
        visible: true,
        eyebrow: "TRABAJOS Y ESTILISMO",
        title: "Cortes, peinados y mirada estética",
        description: "Desliza por el riel para iluminar cada cuadro, reorganizarlo suavemente o abrir la ficha técnica del peinado o corte realizado.",
        ctaLabel: "Ver galería completa",
        railItems: DEFAULT_GALLERY_RAIL_ITEMS,
      },
      reviewsSection: {
        visible: false, // Oculto por defecto hasta contar con fuente verificada y permisos reales
        eyebrow: "OPINIONES VERIFICADAS",
        title: "La experiencia de quienes nos visitan",
        sourceNote: "Reseñas verificadas con autorización expresa.",
        items: [],
      },
      faqSection: {
        visible: true,
        eyebrow: "PREGUNTAS FRECUENTES",
        title: "Todo lo que conviene saber antes de tu cita",
        description: "Resolvemos las dudas habituales sobre reservas, cambios de hora y funcionamiento del salón.",
        items: [
          {
            question: "¿Cómo funciona la reserva online?",
            answer: "Eliges el servicio, tu profesional preferido (o «Cualquier profesional disponible»), la fecha y la hora libre calculada en tiempo real. Recibirás un correo con el resumen y un enlace seguro para gestionar tu cita.",
          },
          {
            question: "¿Puedo modificar o cancelar mi cita?",
            answer: "Sí. Desde el enlace incluido en tu correo de confirmación puedes reprogramar o cancelar tu cita dentro del plazo gratuito indicado en nuestras Condiciones de Reserva.",
          },
          {
            question: "¿Qué significa un precio «Desde» o «A consultar»?",
            answer: "En servicios técnicos o personalizados la dedicación y el producto varían según longitud, densidad o diagnóstico previo. Antes de comenzar el tratamiento te confirmaremos el presupuesto exacto en el salón.",
          },
          {
            question: "¿Necesito crear una cuenta con contraseña para reservar?",
            answer: "No. Puedes reservar directamente indicando tus datos de contacto básicos sin necesidad de registrarte previamente.",
          },
        ],
      },
      locationSection: {
        visible: true,
        eyebrow: "ENCUÉNTRANOS EN MADRID",
        title: "Visítanos o reserva tu próximo momento",
        description: "Consulta nuestro horario actualizado y cómo llegar en Google Maps.",
        mapLinkLabel: "Abrir ubicación en Google Maps",
        bookingCtaTitle: "¿Lista o listo para tu próxima visita?",
        bookingCtaDescription: "Consulta la disponibilidad real por servicio y profesional en pocos segundos.",
        bookingCtaLabel: "Reservar ahora",
      },
    },
  },
  {
    key: "page_servicios",
    title: "Página · Servicios (/servicios)",
    category: "PAGE",
    slug: "/servicios",
    seoTitle: "Carta de Servicios y Rituales · ESPACIO Q Madrid",
    seoDescription: "Explora los 6 capítulos de la carta de servicios de ESPACIO Q en Madrid. Duraciones reales, información transparente y reserva online.",
    data: {
      eyebrow: "CARTA EDITORIAL · ESPACIO Q",
      title: "Carta de servicios y rituales de cuidado",
      description: "Seis capítulos concebidos para acompañarte sin prisas: desde la arquitectura del corte y la luz natural del color hasta rituales de Head Spa, estilismo de invitadas y cuidado consciente de rostro y manos.",
      searchPlaceholder: "Buscar corte, balayage, head spa, kobido, manicura...",
      pricingNotice: "Los importes expresados como «Desde» o «A consultar» son orientativos y se confirman en el salón tras el diagnóstico personalizado, antes de iniciar el trabajo.",
      emptyCatalogTitle: "Carta de servicios en preparación",
      emptyCatalogDescription: "Estamos actualizando los tratamientos y tarifas oficiales de ESPACIO Q. Muy pronto podrás consultarlos y reservar desde aquí.",
      bottomCtaTitle: "¿Dudas sobre cómo combinar tus rituales?",
      bottomCtaDescription: "Escríbenos desde la página de contacto y nuestro equipo diseñará contigo la secuencia y el tiempo ideales antes de reservar.",
      bottomCtaLabel: "Contactar con el salón",
      bottomCtaHref: "/contacto",
    },
  },
  {
    key: "page_equipo",
    title: "Página · Equipo (/equipo)",
    category: "PAGE",
    slug: "/equipo",
    seoTitle: "Nuestro Equipo · ESPACIO Q Madrid",
    seoDescription: "Conoce al equipo profesional de ESPACIO Q en Madrid y reserva cita con tu especialista.",
    data: {
      eyebrow: "PROFESIONALES",
      title: "El equipo detrás de ESPACIO Q",
      description: "Especialistas en corte, color, salud capilar y cuidado estético comprometidos con una atención cercana y rigurosa.",
      provisionalNote: "Perfiles representativos de muestra mientras se incorporan las fotografías definitivas del equipo de ESPACIO Q.",
      showcaseMembers: DEFAULT_TEAM_SHOWCASE_MEMBERS,
      philosophyTitle: "Oficio compartido y formación continua",
      philosophyBody: "Cada miembro del equipo tiene habilitados únicamente los servicios de su especialidad para garantizar que tu reserva se asigne siempre al perfil idóneo.",
      emptyTeamTitle: "Perfiles del equipo próximamente",
      emptyTeamDescription: "El salón está completando las fichas públicas de sus profesionales.",
    },
  },
  {
    key: "page_galeria",
    title: "Página · Galería (/galeria)",
    category: "PAGE",
    slug: "/galeria",
    seoTitle: "Galería · ESPACIO Q Madrid",
    seoDescription: "Trabajos de corte y peinado, texturas e inspiración visual de ESPACIO Q en Madrid.",
    data: {
      eyebrow: "UNIVERSO VISUAL",
      title: "Galería de peinados, cortes y estilo",
      description: "Explora nuestra selección interactiva de trabajos capilares y el ambiente de ESPACIO Q en Madrid.",
      railEyebrow: "EXPOSICIÓN INTERACTIVA",
      railTitle: "Peinados y cortes realizados",
      railCaption: "Recorre el riel para iluminar cada trabajo, deslízalo o púlsalo para girar el cuadro y leer los detalles técnicos del corte o peinado.",
      railItems: DEFAULT_GALLERY_RAIL_ITEMS,
      archiveTitle: "Atmósfera y espacio del salón",
      provisionalBannerText: "Las imágenes marcadas como «Referencia editorial provisional» corresponden a la maquetación estética inicial y pueden sustituirse en cualquier momento desde el panel de Contenidos o Multimedia.",
    },
  },
  {
    key: "page_contacto",
    title: "Página · Contacto (/contacto)",
    category: "PAGE",
    slug: "/contacto",
    seoTitle: "Contacto y Ubicación · ESPACIO Q Madrid",
    seoDescription: "Contacta con ESPACIO Q en Madrid, consulta horarios de apertura y envíanos tu consulta.",
    data: {
      eyebrow: "ATENCIÓN AL CLIENTE",
      title: "Estamos a tu disposición",
      description: "Si necesitas asesoramiento previo a tu cita o tienes cualquier consulta, envíanos un mensaje y te responderemos a la mayor brevedad.",
      formTitle: "Envíanos una consulta",
      formSubtitle: "Responderemos a tu correo electrónico en horario de apertura del salón.",
      privacyConsentLabel: "He leído y acepto la Política de Privacidad para la gestión y respuesta de mi consulta.",
      submitButtonLabel: "Enviar consulta",
      successTitle: "Consulta recibida correctamente",
      successDescription: "Gracias por escribir a ESPACIO Q. Hemos registrado tu mensaje y te responderemos muy pronto.",
      directions: DEFAULT_CONTACT_DIRECTIONS,
    },
  },
  {
    key: "page_faq",
    title: "Página · Preguntas frecuentes (/preguntas-frecuentes)",
    category: "PAGE",
    slug: "/preguntas-frecuentes",
    seoTitle: "Preguntas frecuentes · Peluquería ESPACIO Q en Chueca, Madrid",
    seoDescription:
      "Resolvemos tus dudas sobre ESPACIO Q: dónde estamos en Chueca, horario, cómo reservar, cambiar o cancelar tu cita, aparcamiento, servicios y precios.",
    data: {
      eyebrow: "PREGUNTAS FRECUENTES",
      title: "Preguntas frecuentes",
      description: "Todo lo que conviene saber antes de tu visita a ESPACIO Q, en Chueca (Madrid).",
      emptyStateMessage: "Estamos preparando las respuestas a las preguntas más habituales. Mientras tanto, escríbenos desde Contacto.",
      items: DEFAULT_FAQ_ITEMS,
    },
  },
  {
    key: "page_reservar",
    title: "Página · Reservar Cita (/reservar)",
    category: "PAGE",
    slug: "/reservar",
    seoTitle: "Reservar Cita Online · ESPACIO Q Madrid",
    seoDescription: "Reserva tu cita online en ESPACIO Q Madrid. Elige servicio, profesional y horario disponible en tiempo real.",
    data: {
      eyebrow: "RESERVA ONLINE",
      title: "Reserva tu momento en ESPACIO Q",
      description: "Disponibilidad calculada en tiempo real según el horario oficial del salón y de cada profesional.",
      standbyTitle: "Reservas online próximamente",
      standbyDescription: "Estamos ultimando la configuración de horarios y servicios para abrir la agenda online. Mientras tanto, puedes enviarnos tu solicitud desde la página de contacto.",
      anyProfessionalLabel: "Cualquier profesional disponible",
      anyProfessionalDescription: "Te asignaremos automáticamente un especialista habilitado en la franja elegida.",
      cancellationSummary: "Puedes cancelar o reprogramar sin coste hasta con {{cancellationFreeHours}} horas de antelación desde el enlace seguro que recibirás por email.",
      marketingOptInLabel: "Deseo suscribirme a la newsletter de ESPACIO Q para recibir novedades y comunicaciones comerciales (opcional, requiere confirmación por email).",
      termsAcceptLabel: "He leído y acepto las Condiciones de Reserva y la Política de Privacidad para tramitar mi cita.",
    },
  },
  {
    key: "newsletter_config",
    title: "Newsletter · Modal y Formulario de Suscripción",
    category: "GLOBAL",
    slug: null,
    seoTitle: "Newsletter · ESPACIO Q",
    seoDescription: "Suscríbete a la newsletter de ESPACIO Q.",
    data: {
      enabled: true,
      openMode: "manual", // manual | timer | scroll (desactivado en automático por defecto según especificación)
      delaySeconds: 18,
      scrollPercent: 60,
      cooldownDays: 14,
      imageUrl: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=80",
      imageAlt: "Detalle editorial Zen Linen de ESPACIO Q",
      eyebrow: "NEWSLETTER EDITORIAL",
      title: "Notas de calma y cuidado desde Madrid",
      description: "Recibe puntualmente nuestras novedades de temporada, rituales de cuidado capilar y apertura de fechas especiales en el salón.",
      promoText: "", // Vacío por defecto: nunca anunciar un 10% no aprobado por el salón
      inputPlaceholder: "tu@email.com",
      firstNamePlaceholder: "Tu nombre (opcional)",
      consentLabel: "Acepto recibir comunicaciones comerciales de ESPACIO Q y he leído la Política de Privacidad.",
      submitLabel: "Suscribirme a la newsletter",
      submittingLabel: "Procesando solicitud...",
      pendingTitle: "Revisa tu bandeja de entrada",
      pendingDescription: "Te hemos enviado un enlace de confirmación (double opt-in) para verificar tu dirección de correo antes de activar tu suscripción.",
      confirmedTitle: "Suscripción confirmada",
      confirmedDescription: "Gracias por unirte a la comunidad de ESPACIO Q.",
      footerTitle: "Únete a nuestra carta editorial",
      footerDescription: "Novedades del salón y consejos de cuidado consciente, sin spam y con baja inmediata en un clic.",
    },
  },
  {
    key: "cookie_banner",
    title: "Privacidad · Banner y Panel de Cookies",
    category: "GLOBAL",
    slug: null,
    seoTitle: "Preferencias de Cookies · ESPACIO Q",
    seoDescription: "Configuración de cookies de ESPACIO Q.",
    data: {
      title: "Respetamos tu privacidad",
      description: "Utilizamos cookies técnicas estrictamente necesarias para el funcionamiento seguro de la web y de las reservas. Solo activaremos cookies analíticas o de terceros si nos das tu consentimiento expreso.",
      acceptAllLabel: "Aceptar todas",
      rejectAllLabel: "Rechazar opcionales",
      configureLabel: "Configurar cookies",
      savePreferencesLabel: "Guardar mis preferencias",
      necessaryTitle: "Cookies técnicas necesarias (Siempre activas)",
      necessaryDescription: "Imprescindibles para mantener la sesión de seguridad, recordar tus preferencias de privacidad y procesar reservas de forma segura.",
      analyticsTitle: "Cookies de análisis y medición",
      analyticsDescription: "Nos permiten comprender de forma agregada cómo se navega por la web para mejorar su estructura y rendimiento.",
      marketingTitle: "Cookies de contenido externo y marketing",
      marketingDescription: "Permiten cargar widgets externos opcionales (como mapas interactivos embebidos) o medir campañas.",
      ...DEFAULT_MAPS_COOKIE_TEXTS,
    },
  },
  // ============================================================================
  // 5 DOCUMENTOS LEGALES IDEALES PARA EL NEGOCIO (100% EDITABLES DESDE DASHBOARD)
  // ============================================================================
  {
    key: "legal_aviso_legal",
    title: "Legal · Aviso Legal (/aviso-legal)",
    category: "LEGAL",
    slug: "/aviso-legal",
    seoTitle: "Aviso Legal · ESPACIO Q Madrid",
    seoDescription: "Aviso Legal e información general en cumplimiento de la Ley 34/2002 (LSSI-CE) de ESPACIO Q.",
    data: {
      title: "Aviso Legal",
      subtitle: "Información general en cumplimiento de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE)",
      slug: "/aviso-legal",
      lastUpdated: "Octubre 2026",
      intro:
        "El presente Aviso Legal regula el acceso, navegación y uso del sitio web de {{brandName}}, salón de belleza ubicado en Madrid (España).",
      sections: [
        {
          id: "identificacion-titular",
          heading: "1. Datos identificativos del titular",
          content:
            "En cumplimiento del artículo 10 de la Ley 34/2002 (LSSI-CE), se informa de los datos del titular del sitio web:\n\n• Denominación comercial: {{brandName}}\n• Titular / Razón social: {{legalOwnerName}}\n• NIF / CIF: {{legalTaxId}}\n• Domicilio social / establecimiento: {{legalRegisteredAddress}}\n• Datos registrales: {{legalRegistryInfo}}\n• Correo electrónico de contacto: {{contactEmail}}\n• Teléfono de contacto: {{phone}}",
        },
        {
          id: "objeto-y-ambito",
          heading: "2. Objeto y ámbito de aplicación",
          content:
            "El sitio web tiene por objeto ofrecer información sobre los servicios de peluquería, estilismo y cuidado personal de {{brandName}}, permitir la solicitud y gestión de citas online y facilitar el contacto con el salón. El acceso y utilización del sitio web atribuye la condición de persona usuaria e implica la aceptación de las disposiciones incluidas en este Aviso Legal en la versión publicada en el momento del acceso.",
        },
        {
          id: "propiedad-intelectual",
          heading: "3. Propiedad intelectual e industrial",
          content:
            "Todos los contenidos del sitio web (textos editoriales, diseño gráfico, fotografías propias, logotipos, código fuente y estructura de navegación) son titularidad de {{brandName}} o de terceros que han autorizado legítimamente su uso, y están protegidos por la legislación española e internacional sobre propiedad intelectual e industrial. Queda prohibida su reproducción, distribución, comunicación pública o transformación con fines comerciales sin autorización previa y por escrito.",
        },
        {
          id: "responsabilidad-uso",
          heading: "4. Responsabilidad y condiciones de uso",
          content:
            "La persona usuaria se compromete a hacer un uso adecuado y lícito del sitio web y de sus sistemas de reserva, absteniéndose de realizar reservas falsas, automatizadas o fraudulentas que bloqueen injustificadamente la agenda del salón. {{brandName}} adopta medidas técnicas de seguridad razonables, pero no puede garantizar la ausencia absoluta de interrupciones temporales del servicio por tareas de mantenimiento o causas ajenas a su control.",
        },
        {
          id: "legislacion-y-fuero",
          heading: "5. Legislación aplicable y jurisdicción",
          content:
            "El presente Aviso Legal se rige íntegramente por la legislación española. Para la resolución de cualquier controversia que pudiera derivarse del acceso o uso del sitio web, las partes se someten a los Juzgados y Tribunales de Madrid, salvo que la normativa de protección de consumidores y usuarios establezca de forma imperativa el fuero correspondiente al domicilio de la persona consumidora.",
        },
      ],
    } satisfies LegalDocumentData,
  },
  {
    key: "legal_terminos_condiciones",
    title: "Legal · Términos y Condiciones (/terminos-y-condiciones)",
    category: "LEGAL",
    slug: "/terminos-y-condiciones",
    seoTitle: "Términos y Condiciones Generales · ESPACIO Q Madrid",
    seoDescription: "Términos y condiciones generales de prestación de servicios y uso de la web de ESPACIO Q.",
    data: {
      title: "Términos y Condiciones Generales",
      subtitle: "Marco contractual aplicable al uso del portal y a la prestación de servicios en el salón ESPACIO Q",
      slug: "/terminos-y-condiciones",
      lastUpdated: "Octubre 2026",
      intro:
        "Estos Términos y Condiciones regulan la relación entre {{brandName}} y las personas clientas o usuarias que utilizan nuestro sitio web o acuden a nuestro salón de belleza en Madrid.",
      sections: [
        {
          id: "prestacion-servicios",
          heading: "1. Naturaleza de los servicios del salón",
          content:
            "{{brandName}} presta servicios profesionales de peluquería, coloración, tratamientos capilares y estética de forma presencial en su establecimiento de Madrid. Cada servicio comienza con una valoración profesional para confirmar su idoneidad técnica conforme a las características del cabello o piel de la persona clienta.",
        },
        {
          id: "informacion-precios",
          heading: "2. Precios, impuestos y presupuestos previos",
          content:
            "Todos los precios mostrados en el sitio web se expresan en Euros (EUR) e incluyen el Impuesto sobre el Valor Añadido (IVA) legalmente aplicable.\n\n• Servicios de precio fijo: el importe reflejado en la reserva corresponde al coste total del servicio estándar seleccionado.\n• Servicios «Desde» o «A consultar»: en trabajos técnicos de coloración, mechas, correcciones o rituales específicos, el importe final depende de la longitud, volumen, estado previo del cabello y producto requerido. En todos los casos, el profesional informará del presupuesto cerrado en el salón tras el diagnóstico inicial y antes de comenzar la realización del servicio.",
        },
        {
          id: "pago-en-salon",
          heading: "3. Abono de los servicios",
          content:
            "La reserva online a través de este sitio web es gratuita y no implica un cobro automático con tarjeta en el momento de solicitar la cita, salvo que en el futuro se indique expresamente lo contrario para servicios especiales. El abono del servicio se realiza directamente en el salón al finalizar la cita mediante los medios de pago admitidos en el establecimiento.",
        },
        {
          id: "normas-convivencia-y-seguridad",
          heading: "4. Diagnóstico técnico y seguridad cosmética",
          content:
            "Con el fin de proteger la salud capilar y cutánea de la persona clienta, el equipo de {{brandName}} podrá desaconsejar o declinar la realización de un proceso químico si aprecia incompatibilidades técnicas o riesgo de deterioro severo, proponiendo alternativas seguras. Es responsabilidad de la persona clienta advertir verbalmente al profesional antes del servicio si conoce alguna sensibilidad específica a productos cosméticos.",
        },
        {
          id: "atencion-y-reclamaciones",
          heading: "5. Atención al cliente y hojas de reclamaciones",
          content:
            "Para cualquier consulta, sugerencia o incidencia relacionada con nuestros servicios, puedes dirigirte a {{contactEmail}} o a través de nuestro formulario de contacto. Asimismo, {{brandName}} tiene Hojas Oficiales de Reclamaciones de la Comunidad de Madrid a disposición de las personas consumidoras que las soliciten en el propio establecimiento.",
        },
      ],
    } satisfies LegalDocumentData,
  },
  {
    key: "legal_condiciones_reserva",
    title: "Legal · Condiciones de Reserva (/condiciones-reserva)",
    category: "LEGAL",
    slug: "/condiciones-reserva",
    seoTitle: "Condiciones de Reserva y Cancelación · ESPACIO Q Madrid",
    seoDescription: "Política de reservas online, modificaciones, cancelaciones y puntualidad de ESPACIO Q.",
    data: {
      title: "Condiciones de Reserva y Cancelación",
      subtitle: "Normas de funcionamiento de la agenda online, puntualidad, cambios y cancelaciones de citas",
      slug: "/condiciones-reserva",
      lastUpdated: "Octubre 2026",
      intro:
        "En {{brandName}} reservamos tiempo exclusivo de nuestros profesionales para cada cita. Estas condiciones nos permiten garantizar una agenda puntual y sin esperas para todas las personas que nos visitan.",
      sections: [
        {
          id: "proceso-de-reserva",
          heading: "1. Solicitud y confirmación de cita",
          content:
            "Al completar el formulario en /reservar, el sistema verifica en tiempo real la disponibilidad del servicio y del profesional elegido. Según el modo operativo vigente del salón:\n\n• Confirmación inmediata: recibirás un correo electrónico con el estado «Cita confirmada», tu código de referencia y un enlace privado de gestión.\n• Solicitud sujeta a revisión: cuando un servicio requiera validación manual del salón, recibirás primero un acuse de «Solicitud pendiente de confirmación» y un segundo correo en cuanto recepción confirme la cita.",
        },
        {
          id: "modificaciones-y-cancelaciones",
          heading: "2. Modificación y cancelación gratuita",
          content:
            "Si no puedes acudir a tu cita o necesitas cambiarla de día u hora, te rogamos que lo gestiones con al menos {{cancellationFreeHours}} horas de antelación respecto a la hora de inicio reservada.\n\nPuedes cancelar o reprogramar tu cita de forma rápida y segura utilizando el enlace incluido en tu correo de confirmación, sin necesidad de crear una cuenta ni iniciar sesión.",
        },
        {
          id: "puntualidad-y-retrasos",
          heading: "3. Puntualidad y margen de cortesía",
          content:
            "Te recomendamos llegar al salón unos minutos antes de la hora programada. Si prevés un retraso, avísanos lo antes posible. Si el retraso supera los 15 minutos y compromete la duración necesaria para realizar el servicio sin perjudicar a la siguiente cita programada, el salón podrá adaptar el alcance del servicio o proponer su reprogramación para otra fecha.",
        },
        {
          id: "ausencias-no-show",
          heading: "4. Ausencias sin aviso previo (No-Show)",
          content:
            "La no asistencia reiterada a citas confirmadas sin aviso previo impide que otras personas puedan utilizar ese tiempo de agenda. En caso de acumular ausencias injustificadas, {{brandName}} se reserva el derecho de requerir confirmación telefónica previa para futuras reservas.",
        },
        {
          id: "cambios-por-el-salon",
          heading: "5. Reasignación o imprevistos del salón",
          content:
            "En caso de indisposición sobrevenida del profesional asignado o causa de fuerza mayor, {{brandName}} se pondrá en contacto contigo a la mayor brevedad para ofrecerte la atención de otro profesional cualificado del equipo en el mismo horario o, si lo prefieres, reprogramar tu cita con prioridad absoluta.",
        },
      ],
    } satisfies LegalDocumentData,
  },
  {
    key: "legal_privacidad",
    title: "Legal · Política de Privacidad (/privacidad)",
    category: "LEGAL",
    slug: "/privacidad",
    seoTitle: "Política de Privacidad y Protección de Datos · ESPACIO Q Madrid",
    seoDescription: "Información sobre protección de datos personales conforme al RGPD (UE) 2016/679 y la LOPDGDD 3/2018.",
    data: {
      title: "Política de Privacidad",
      subtitle: "Información transparente sobre el tratamiento de datos personales conforme al Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD)",
      slug: "/privacidad",
      lastUpdated: "Octubre 2026",
      intro:
        "En {{brandName}} tratamos tus datos personales con estricta confidencialidad, aplicando el principio de minimización de datos y separando claramente la gestión de tus citas de cualquier comunicación comercial.",
      sections: [
        {
          id: "responsable-tratamiento",
          heading: "1. Responsable del tratamiento",
          content:
            "• Responsable: {{legalOwnerName}} ({{brandName}})\n• NIF / CIF: {{legalTaxId}}\n• Dirección postal: {{legalRegisteredAddress}}\n• Correo electrónico de contacto / privacidad: {{legalDpoEmail}}",
        },
        {
          id: "finalidades-y-base-juridica",
          heading: "2. Finalidades del tratamiento y base jurídica",
          content:
            "Tratamos los datos personales que nos facilitas únicamente para las siguientes finalidades diferenciadas:\n\n1. Gestión de reservas y prestación de servicios en el salón: tramitar tu cita, enviarte confirmaciones transaccionales, enlaces de gestión y recordatorios antes de tu visita. Base jurídica: ejecución de medidas precontractuales y contractuales (art. 6.1.b RGPD).\n2. Atención de consultas de contacto: responder a las solicitudes enviadas mediante el formulario de contacto. Base jurídica: aplicación de medidas precontractuales o interés legítimo en atender tu solicitud (art. 6.1.b y 6.1.f RGPD).\n3. Envío de la Newsletter y comunicaciones comerciales: únicamente si marcas de forma expresa la casilla opcional correspondiente y confirmas tu correo mediante nuestro sistema de doble verificación (double opt-in). Base jurídica: tu consentimiento expreso e informado (art. 6.1.a RGPD y art. 21 LSSI-CE).",
        },
        {
          id: "minimizacion-y-categorias",
          heading: "3. Categorías de datos y minimización",
          content:
            "Recogemos exclusivamente datos identificativos y de contacto necesarios (nombre, apellidos opcionales, correo electrónico, teléfono y observaciones sobre el servicio solicitado). No solicitamos a través de los formularios web datos de salud ni categorías especiales de datos del artículo 9 del RGPD.",
        },
        {
          id: "plazos-conservacion",
          heading: "4. Plazos de conservación",
          content:
            "• Datos de clientes y citas: se conservarán mientras se mantenga la relación con el salón y, posteriormente, debidamente bloqueados durante los plazos legales de prescripción fiscal, mercantil o de atención de posibles responsabilidades.\n• Consultas web sin reserva posterior: se conservarán durante un plazo máximo orientativo de {{contactRetentionDays}} días desde su resolución.\n• Suscriptores de Newsletter: hasta que revoques tu consentimiento o solicites la baja mediante el enlace incluido en cada correo, pasando en ese momento a nuestra lista interna de supresión para garantizar que no vuelvas a recibir envíos comerciales.",
        },
        {
          id: "destinatarios-y-encargados",
          heading: "5. Destinatarios y encargados del tratamiento",
          content:
            "No vendemos ni cedemos tus datos a terceros con fines comerciales. Para el funcionamiento técnico de la aplicación contamos con proveedores tecnológicos que actúan como encargados del tratamiento bajo contrato conforme al artículo 28 del RGPD (alojamiento de infraestructura y base de datos, y proveedor de envío de correo transaccional/newsletter). En caso de que algún proveedor tecnológico implique tratamiento fuera del Espacio Económico Europeo, se exige la suscripción de Cláusulas Contractuales Tipo aprobadas por la Comisión Europea.",
        },
        {
          id: "derechos-personas-interesadas",
          heading: "6. Ejercicio de derechos (Acceso, Rectificación, Supresión, Oposición, Portabilidad y Limitación)",
          content:
            "Puedes ejercer en cualquier momento tus derechos de acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad, así como retirar tu consentimiento comercial con efectos inmediatos, enviando una solicitud a {{legalDpoEmail}}. Asimismo, si consideras que el tratamiento no se ajusta a la normativa vigente, tienes derecho a presentar una reclamación ante la Agencia Española de Protección de Datos (www.aepd.es).",
        },
      ],
    } satisfies LegalDocumentData,
  },
  {
    key: "legal_cookies",
    title: "Legal · Política de Cookies (/cookies)",
    category: "LEGAL",
    slug: "/cookies",
    seoTitle: "Política de Cookies · ESPACIO Q Madrid",
    seoDescription: "Información sobre el uso de cookies y tecnologías similares conforme a la Guía de la AEPD y el artículo 22.2 de la LSSI.",
    data: {
      title: "Política de Cookies",
      subtitle: "Información clara sobre las cookies y el almacenamiento local utilizado en este sitio web conforme a la Guía sobre el uso de las cookies de la AEPD",
      slug: "/cookies",
      lastUpdated: "Octubre 2026",
      intro:
        "En {{brandName}} utilizamos cookies y tecnologías de almacenamiento local de forma transparente y responsable. Puedes consultar y cambiar tu elección en cualquier momento desde el panel de configuración disponible en esta misma página y en el pie de la web.",
      sections: [
        {
          id: "que-son-las-cookies",
          heading: "1. ¿Qué son las cookies?",
          content:
            "Las cookies y tecnologías similares (como localStorage) son pequeños archivos o registros que el navegador almacena en tu dispositivo al visitar un sitio web para permitir su funcionamiento técnico, recordar tus preferencias de privacidad o, previo consentimiento, recopilar estadísticas de uso.",
        },
        {
          id: "cookies-utilizadas",
          heading: "2. Tipos de cookies utilizadas en esta web",
          content:
            "1. Cookies técnicas o estrictamente necesarias (Exentas de consentimiento según art. 22.2 LSSI):\n• `espacioq_cookie_consent`: guarda tu decisión sobre aceptación o rechazo de cookies opcionales (duración: 180 días).\n• `espacioq_newsletter_dismissed`: recuerda temporalmente si has cerrado el diálogo de newsletter para no volver a mostrártelo de forma intrusiva.\n• `espacioq_session`: cookie técnica `HttpOnly` utilizada exclusivamente para el personal autorizado que accede al panel de administración.\n\n2. Cookies opcionales de análisis o contenido de terceros (Desactivadas por defecto):\nSolo se cargan si el salón las habilita en su configuración y si la persona usuaria pulsa expresamente «Aceptar» en el banner o en el panel de preferencias." + COOKIES_MAPS_MENTION,
        },
        {
          id: "gestion-y-revocacion",
          heading: "3. Cómo configurar o revocar tu consentimiento",
          content:
            "En cualquier momento puedes modificar o retirar tu consentimiento utilizando el botón «Configurar mis preferencias de cookies» situado al principio de esta página o en el pie del sitio web, con la misma facilidad con la que lo prestaste. Adicionalmente, puedes bloquear o eliminar las cookies desde los ajustes de tu navegador (Chrome, Safari, Firefox o Edge).",
        },
      ],
    } satisfies LegalDocumentData,
  },
];
