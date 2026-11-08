# Prompt maestro · ESPACIO Q

> **Uso:** crea un proyecto en **Fullstack Builder** de Emergent y pega este documento. También puedes adjuntarlo como archivo. Las secciones entre «INICIO DEL PROMPT» y «FIN DEL PROMPT» son instrucciones para el agente constructor.
>
> El documento Word aportado es la fuente de los requisitos de negocio y de las referencias de los componentes `PerspectiveTunnelHero` y `NewsletterDialog`. Las tres capturas son la referencia cromática, no una petición de reproducir el dashboard financiero de la demostración.
>
> **Consejo de ejecución:** usa este documento como especificación persistente y ejecuta las fases de una en una. Si el contexto o los créditos son limitados, no intentes construir todos los módulos en una sola generación. Al terminar una fase, continúa con: «Implementa la siguiente fase del prompt maestro, conserva lo construido, ejecuta las pruebas y actualiza la matriz de requisitos».

---

# INICIO DEL PROMPT

## 1. Misión y resultado esperado

Actúa como un equipo sénior integrado por dirección de arte, diseño UX/UI, arquitectura full-stack, desarrollo Next.js/TypeScript, ingeniería de backend, SEO técnico, automatización de email y QA.

Diseña e implementa una aplicación web completa para **ESPACIO Q**, un salón de belleza en Madrid, con tres experiencias conectadas:

1. **Web pública editorial y premium**, diseñada para transmitir confianza, mostrar servicios y convertir visitas en reservas.
2. **Sistema real de reservas**, con elección de servicio, profesional y disponibilidad calculada en el servidor.
3. **Panel de administración completo**, moderno, elegante y responsive, para que el salón gestione su web, imágenes, servicios, equipo, horarios, clientes, agenda, newsletter, email marketing y automatizaciones sin modificar código.

No construyas únicamente una landing page, un prototipo visual ni un dashboard con datos hardcodeados. El resultado debe tener frontend cuidado, backend funcional, persistencia real, permisos, validaciones, pruebas y documentación de puesta en producción.

La estética y la ingeniería tienen igual importancia. «Backend moderno y estilizado» significa una arquitectura mantenible y segura y una interfaz de administración tan cuidada como la web pública; no significa maquillar endpoints sin funcionalidad.

### Requisitos no negociables

- Next.js con App Router y TypeScript; Next.js es el framework, no el lenguaje.
- Tailwind CSS y shadcn/ui, con componentes reutilizables en `components/ui`.
- Web pública y administración responsive en móvil, tablet, portátil y escritorio.
- Identidad visual basada en **Zen Linen**, detallada más adelante.
- Hero con tarjetas fotográficas y profundidad 3D inspirado fielmente en `perspective-tunnel-hero.tsx` del material original.
- Newsletter inspirado en `newsletter-dialog.tsx`, conectado al backend y sin duplicarlo.
- Imágenes del hero, newsletter y resto de la web gestionables desde el dashboard, tanto mediante subida como mediante enlaces externos.
- CRUD real de clientes e importación/exportación Excel.
- Reservas por servicio y profesional, sin sobreventas de disponibilidad.
- Horarios conectables a la ficha correcta de Google mediante APIs oficiales, con configuración manual segura como alternativa.
- Email marketing y correos automáticos de bienvenida, solicitud/confirmación de cita, cambios y recordatorios.
- SEO técnico, accesibilidad, protección de datos y seguridad desde el diseño.

## 2. Cómo debes trabajar

Antes de programar, revisa el repositorio y el entorno. Confirma que puedes ejecutar Next.js de verdad, identifica las versiones compatibles y comprueba la conectividad con la base de datos y el almacenamiento.

Guarda esta especificación como `docs/MASTER_SPEC.md` y crea:

- `docs/IMPLEMENTATION_PLAN.md`: fases, decisiones y dependencias.
- `docs/REQUIREMENTS_MATRIX.md`: cada requisito con estado, archivos, prueba y bloqueo si lo hubiera.
- `docs/INTEGRATIONS.md`: proveedores, credenciales, permisos, costes externos y pasos pendientes.
- `docs/OPERATIONS.md`: despliegue, backups, tareas programadas y recuperación.

Distingue siempre entre **implementado**, **probado**, **pendiente de credenciales** y **no implementado**. No declares lista una integración que solo tiene interfaz.

Si faltan datos de negocio o credenciales, solicita únicamente lo imprescindible y continúa con lo que no dependa de ello. No hagas una entrevista larga ni sustituyas decisiones expresas del usuario por preferencias del template.

No cambies silenciosamente Next.js por una SPA React/Vite. Si hay una limitación real del entorno, explícalo antes de cambiar el framework, la base de datos o el alcance. No prometas una funcionalidad que el despliegue elegido no pueda ejecutar.

Mantén un solo producto coherente; no generes una colección de demos inconexas.

## 3. Datos y límites de contenido

### Datos confirmados para iniciar

- Marca: **ESPACIO Q**.
- Actividad: salón de belleza.
- Ciudad de referencia: Madrid, España.
- Idioma inicial de web, dashboard y comunicaciones: español de España.
- Moneda: EUR.
- Zona horaria del negocio: `Europe/Madrid`.
- Ficha de Google proporcionada por el propietario del proyecto:

```text
https://www.google.com/maps/place/Espacio+Q/@40.4280874,-3.6965673,2467m/data=!3m1!1e3!4m6!3m5!1s0xd4228618d8af967:0xa4f32211fe6d024d!8m2!3d40.4241269!4d-3.6976262!16s%2Fg%2F1q65y9wd5?authuser=0&entry=ttu&g_ep=EgoyMDI2MTAyMC4wIKXMDSoASAFQAw%3D%3D
```

### No inventes información del negocio

No inventes horarios, servicios realmente ofrecidos, tarifas, duración de tratamientos, nombre de profesionales, dirección postal, teléfono, WhatsApp, correos, redes sociales, testimonios, valoraciones, premios ni descuentos.

Crea un asistente de configuración inicial para completar estos datos y un indicador claro de información pendiente. Un enlace de Maps no equivale a tener acceso a una API ni permite identificar con certeza cualquier negocio homónimo.

La web puede incluir textos editoriales originales provisionales, editables y sin afirmaciones no verificadas. Usa, por ejemplo, «Un espacio para cuidar de ti» como propuesta de copy, no como eslogan oficial confirmado.

Si faltan servicios, precios, horarios o profesionales reales, no habilites reservas de producción con datos ficticios. Permite configurar el catálogo y muestra un estado amable de «Reservas online próximamente» hasta completar los mínimos.

No publiques fotografías de archivo como si fueran trabajos del salón. Si se usan imágenes provisionales para maquetar, identifícalas en administración, comprueba sus permisos y permite sustituirlas. No inventes URLs de imágenes.

No hay una petición inicial de e-commerce, cobros con tarjeta, TPV, inventario ni facturación fiscal. No los conviertas en dependencias obligatorias. Un precio de servicio no es un cobro recibido.

## 4. Dirección de arte

### Concepto visual

Un salón contemporáneo con sensibilidad editorial: lino, piedra clara, marfil, gris cálido y carbón. Resultado sobrio, luminoso, sofisticado y acogedor; con fotografía protagonista y aire suficiente entre bloques.

La captura de 21st.dev es una referencia de colores y superficies. **No copies** sus textos «Total Revenue», «Subscriptions», «Move Goal» ni «Exercise Minutes». Tampoco copies el azul del botón «Save», el rosa del navegador, la barra de Windows o la interfaz del editor de temas.

Evita el aspecto genérico de una plantilla SaaS: nada de gradientes morados, neón, rosa dominante, fondos azulados, brillos tecnológicos ni tarjetas repetidas sin jerarquía. Tampoco uses dorado como sustituto automático de «lujo».

### Paleta principal

Los colores claros base corresponden al tema Zen Linen; los colores de gráficos visibles en las capturas se reservan principalmente para analítica. Los tokens complementarios completan el sistema de diseño y deben conservar el contraste.

```css
:root {
  --background: #E9E4D8;
  --foreground: #1E1E1E;
  --card: #F4EFE4;
  --card-foreground: #1E1E1E;
  --popover: #F4EFE4;
  --popover-foreground: #1E1E1E;
  --primary: #2E2E2E;
  --primary-foreground: #E6E4D7;
  --secondary: #D8D2C4;
  --secondary-foreground: #2E2E2E;
  --accent: #E6E4D7;
  --accent-foreground: #2E2E2E;
  --muted: #CFC8B8;
  --muted-foreground: #5E5A52;
  --border: #D2CBBB;
  --input: #D2CBBB;
  --ring: #2E2E2E;
  --destructive: #DC2626;
  --destructive-foreground: #FFFFFF;
  --chart-1: #F26A4B;
  --chart-2: #1E1E1E;
  --chart-3: #5E5A52;
  --chart-4: #A89F8F;
  --chart-5: #CFC8B8;
  --radius: 0.5rem;
  --sidebar: #F4EFE4;
  --sidebar-foreground: #1E1E1E;
  --sidebar-accent: #E6E4D7;
  --sidebar-border: #D2CBBB;
}
```

Los valores son colores CSS completos. Configura correctamente su consumo según la versión instalada de Tailwind/shadcn: no envuelvas estos HEX dentro de `hsl(var(...))`. Si el proyecto usa HSL u OKLCH, convierte los valores manteniendo la misma apariencia. Centraliza la paleta; no repartas HEX arbitrarios por los componentes.

### Aplicación del color

- Fondo general lino `#E9E4D8` y superficies/tarjetas marfil `#F4EFE4`.
- Botones principales carbón `#2E2E2E` con texto claro y estados hover discretos.
- Texto principal `#1E1E1E` y secundario `#5E5A52`.
- Bordes piedra `#D2CBBB`, sombras suaves y nunca halos azulados.
- Coral `#F26A4B` solo en detalles puntuales y gráficos; no como color dominante de marca ni como texto pequeño sin verificar contraste.
- Estados de éxito, aviso y error con tokens semánticos propios, icono y etiqueta; no comunicar únicamente mediante color.
- Las series claras de los gráficos llevan etiquetas, trazos o marcadores adicionales para distinguirse del fondo.

El modo claro es el diseño de referencia. Puedes ofrecer modo oscuro opcional en el dashboard, sin que retrase el alcance principal. Si lo implementas, usa la familia Zen Linen oscura: fondo `#141414`, texto `#E8E3DA`, tarjetas `#1C1C1C`, primario `#D1CFC0`, texto sobre primario `#363636`, secundario `#222222`, acento `#363636`, muted `#2A2A2A`, texto muted `#8E8A83` y borde `#2C2C2C`. Valida el contraste; no basta con invertir colores.

### Tipografía, composición y movimiento

- Propuesta tipográfica: **Cormorant Garamond** para grandes titulares editoriales y **Manrope** para párrafos, formularios y dashboard; cargar con `next/font` y buenos fallbacks.
- No uses la tipografía ornamental en tablas, datos de agenda o textos pequeños.
- Logotipo tipográfico provisional «ESPACIO Q» si no hay archivo oficial, sin fingir que es la marca gráfica definitiva.
- Titulares fluidos mediante `clamp()`, párrafos legibles y ancho de lectura controlado.
- Layout público con contenedor aproximado de 1200–1320 px, padding fluido y alternancia de composiciones editoriales.
- Radio base 8 px; tarjetas editoriales y modales pueden usar 12–18 px de forma coherente.
- Microinteracciones discretas, principalmente de 150–300 ms; movimientos largos solo cuando aporten a la experiencia.
- `prefers-reduced-motion` debe afectar tanto a CSS como a animaciones JavaScript.

## 5. Stack y arquitectura

### Arquitectura objetivo

- Next.js, React y TypeScript en versiones estables compatibles entre sí; fija versiones y conserva el lockfile.
- App Router, Server Components por defecto y componentes cliente solo para interacción.
- Tailwind CSS, shadcn/ui y Radix compatibles con la versión elegida.
- `lucide-react` para iconos de interfaz, no para sustituir logos oficiales de terceros.
- `framer-motion` para las referencias animadas, usando una única dependencia/versionado consistente. No instales simultáneamente dos variantes de Motion sin necesidad.
- React Hook Form y Zod para formularios y validaciones compartidas, con validación efectiva también en el servidor.
- **PostgreSQL gestionado** como base de datos objetivo y Prisma como ORM; migraciones SQL explícitas cuando una restricción no pueda expresarse en el esquema del ORM.
- Almacenamiento de objetos persistente para imágenes. El sistema de archivos efímero del despliegue no es almacenamiento de producción.
- Autenticación mantenida, compatible con Next.js y sesiones seguras; prioriza el proveedor gestionado disponible, verificando integración real, o una alternativa mantenida documentada.
- Servicio de email con API y webhooks; proveedor objetivo Resend mediante un adaptador intercambiable.
- Registro persistente de trabajos y outbox transaccional para automatizaciones y recordatorios.
- Vitest o equivalente para lógica y Playwright para flujos end-to-end.

**Verificación del entorno:** no presupongas que Emergent provisiona PostgreSQL por defecto. Comprueba si hay que conectar una base externa y solicita la URL mediante secretos. Prioriza región UE cuando sea viable, sin afirmar que el resto de proveedores queda automáticamente dentro de la UE.

Si solo está disponible la base nativa de la plataforma, plantea la alternativa y su coste técnico antes de cambiar PostgreSQL. No implementes dos bases de datos en paralelo ni rebajes las garantías anti-solapamiento. Si se aprueba otra base, documenta el mecanismo atómico equivalente y pruébalo con concurrencia real.

No añadas FastAPI, GraphQL, microservicios ni Redis solo por apariencia de complejidad. Usa Route Handlers/Server Actions y una capa de dominio bien separada. Introduce otro servicio solo si existe una necesidad concreta del despliegue.

### Organización orientativa

```text
app/
  (public)/
    page.tsx
    servicios/page.tsx
    servicios/[slug]/page.tsx
    equipo/page.tsx
    galeria/page.tsx
    contacto/page.tsx
    reservar/page.tsx
    privacidad/page.tsx
    cookies/page.tsx
    aviso-legal/page.tsx
    condiciones-reserva/page.tsx
  admin/
    layout.tsx
    page.tsx
    agenda/
    clientes/
    servicios/
    equipo/
    contenido/
    multimedia/
    marketing/
    automatizaciones/
    horarios/
    informes/
    configuracion/
  api/
    v1/
    webhooks/email/
    integrations/google/callback/
    internal/jobs/
  sitemap.ts
  robots.ts
components/
  ui/
  public/
  booking/
  admin/
lib/
  auth/
  db/
  domain/
  validation/
  integrations/
  security/
  storage/
  email/
  jobs/
prisma/
  schema.prisma
  migrations/
emails/
tests/
docs/
```

Puedes adaptar carpetas sin perder separación de responsabilidades. Nunca expongas código de acceso a base de datos o secretos desde módulos importados por el cliente.

## 6. Web pública

### Navegación

Cabecera elegante con marca, Servicios, Equipo, Galería, Contacto y CTA visible **«Reservar cita»**. Navegación sticky discreta con fondo legible; menú móvil accesible mediante drawer. Marca el estado activo y añade enlace para saltar al contenido.

Footer con identidad, navegación útil, contacto confirmado, horarios actualizados, newsletter, enlaces legales y acceso discreto al panel. Solo muestra redes, teléfono y WhatsApp cuando estén configurados y sean válidos.

### Inicio

Construye estas secciones con contenido administrable:

1. Hero inmersivo con la referencia de túnel 3D.
2. Introducción del salón, con composición editorial y fotografía.
3. Servicios destacados desde catálogo real, con duración y precio solo si existen.
4. Propuesta de experiencia del salón sin claims inventados.
5. Equipo con profesionales reales y acceso a reservar con cada uno.
6. Galería de trabajos/fotografías autorizadas, filtrable si existen categorías.
7. Reseñas únicamente si hay una fuente válida y permisos/atribución resueltos; si no, oculta el bloque.
8. Preguntas frecuentes editables.
9. Ubicación, horarios y enlaces de contacto.
10. Newsletter y CTA final a reservas.

No hagas toda la home con el mismo patrón de tres tarjetas. Alterna imagen/texto, espacios en blanco, fotografía a sangre contenida y bloques de contenido con jerarquía.

### Rutas complementarias

- `/servicios`: categorías, búsqueda/filtro útil y servicios activos.
- `/servicios/[slug]`: descripción, precio/tipo de precio, duración, profesionales disponibles, preguntas relevantes y CTA preseleccionado.
- `/equipo`: perfiles públicos y especialidades confirmadas.
- `/galeria`: imágenes publicadas con alt y lightbox accesible opcional.
- `/contacto`: datos reales, horario y formulario conectado al backend con protección antispam.
- `/reservar`: flujo de reserva descrito más adelante.
- Rutas legales independientes, editables y revisables antes de producción.

El blog no es obligatorio para completar este alcance. No crees artículos ficticios para rellenar SEO.

## 7. Hero `PerspectiveTunnelHero`

### Fidelidad a la referencia

Implementa el componente en `components/ui/perspective-tunnel-hero.tsx`. Conserva la identidad de la referencia del Word: tarjetas fotográficas verticales distribuidas alrededor del centro, profundidad en eje Z, rotaciones alternas, entrada/salida con opacidad, perspectiva y parallax suave.

No lo sustituyas por un slider genérico, un vídeo de fondo o una imagen estática como solución principal de escritorio. La alternativa estática se reserva para accesibilidad, ausencia de imágenes o dispositivos que la necesiten.

Reinterpreta el componente para un salón: elimina el copy espacial en inglés, los nombres abstractos de imágenes, las tramas tecnológicas intensas y los brillos índigo. Usa el sistema Zen Linen, fotografías apropiadas y una composición editorial premium.

### Contrato de datos orientativo

```ts
type SalonHeroPhoto = {
  id: string;
  assetId: string;
  src: string;
  alt: string;
  caption?: string;
  focalPoint?: { x: number; y: number };
  order: number;
};

type SalonHeroContent = {
  eyebrow?: string;
  title: string;
  description?: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  photos: SalonHeroPhoto[];
  animationEnabled: boolean;
};
```

El contenido se obtiene del CMS en el servidor y se pasa al componente interactivo. No uses una constante global `IMAGES` como única fuente ni calcules las tarjetas una sola vez a nivel de módulo impidiendo que cambien tras editar el CMS.

### Movimiento y geometría

- Distribución radial orgánica, con avance angular aproximado de 137,5 grados entre tarjetas y radios alternos.
- Tarjetas con proporción cercana a 4:5 y radios suaves; número recomendado configurable de 4 a 9, sin obligar a rellenar nueve imágenes.
- Profundidad y perspectiva en la línea de la referencia: unos 1200 px en escritorio y 900 px en móvil, ajustables tras pruebas.
- Recorrido Z orientativo desde -1700 hasta 500 en escritorio, reducido en móvil para evitar recortes y exceso de coste gráfico.
- Rotaciones alternas moderadas, aproximadamente 3–11 grados.
- Opacidad escalonada según progreso local, con entradas y salidas suaves.
- Parallax de puntero solo en dispositivos con puntero preciso y cuando no haya reducción de movimiento.
- Usa transforms/opacidad y valores de animación; evita provocar render React en cada movimiento del ratón.
- Suspende trabajo de animación cuando el hero no sea visible o la pestaña esté oculta.

### Correcciones obligatorias

La referencia original intercepta la rueda dentro del hero y parte de un estado que puede dejar las tarjetas invisibles al inicio. **No reproduzcas esos problemas**.

- Vincula el progreso preferentemente al scroll nativo, con contenedor de recorrido y zona sticky razonable. No bloquees el scroll global ni uses `preventDefault()` para atrapar al visitante.
- Debe ser posible salir del hero hacia la siguiente sección con rueda, trackpad, teclado y gesto táctil.
- El primer render ya debe mostrar una composición atractiva; no empezar con una pantalla vacía esperando interacción.
- Mantén el H1, subtítulo y CTA legibles, visibles y clicables desde el primer momento.
- Las imágenes no deben tapar el área central ni interceptar el CTA; controla capas, escalado máximo y zona de exclusión.
- No animes a opacidad cero el único H1 ni el CTA antes de que el usuario pueda utilizarlos.
- El contenido semántico se renderiza en HTML; no depende de canvas ni de una animación para existir.
- Evita `w-screen` dentro de contenedores con padding si produce overflow; usa anchuras relativas.
- Usa dimensiones del contenedor mediante una solución tipo ResizeObserver, no solo `window.innerWidth`. Evita diferencias de hidratación y muestra un fallback inicial de dimensiones estables hasta medir el contenedor.
- Añade una salida/ancla «Descubrir el salón» que funcione con teclado.
- No pongas cursor de enlace a una imagen que no abre nada. Si es puramente decorativa, no la metas en el orden de tabulación.

### Móvil y accesibilidad

En pantallas estrechas simplifica a 3–5 tarjetas, reduce la profundidad y elimina el parallax de puntero. Si no se consigue rendimiento estable, usa una composición fotográfica estática equivalente con el mismo contenido y CTA; no simules gestos de escritorio.

Con `prefers-reduced-motion`, desactiva el túnel, la escala ligada al scroll y el parallax; muestra imágenes estables y deja el scroll convencional.

Usa `next/image` o una solución optimizada equivalente con tamaños, dimensiones y gestión de dominios seguros. No precargues nueve imágenes grandes. Prioriza solo el recurso LCP pertinente y sirve variantes más pequeñas para las demás.

El dashboard permite cambiar títulos, subtítulo, textos/enlaces de CTA, imágenes, orden, alt, encuadre y activación de la animación; incluye previsualización móvil/escritorio y publicación.

## 8. Newsletter `NewsletterDialog`

Implementa una única versión en `components/ui/newsletter-dialog.tsx`. El Word repite el bloque: trátalo como **una sola funcionalidad**, no como dos popups.

Conserva su identidad: modal con imagen superior, titular, descripción, campo email, botón de ancho completo y animación discreta. Adapta el diseño a Zen Linen y traduce todos los textos al español.

### Configuración desde el dashboard

- Activación/desactivación.
- Imagen mediante biblioteca, subida o enlace externo validado.
- Título, descripción, texto del botón y confirmación.
- Texto promocional opcional.
- Modo de apertura manual, por tiempo o por profundidad de lectura; el modo automático queda desactivado inicialmente.
- Frecuencia máxima configurable y período de no repetición tras cerrar o suscribirse.
- Preview responsive y opción de newsletter también como formulario integrado en footer.

No heredes automáticamente el descuento del 10% del ejemplo. No publiques una oferta que el salón no haya aprobado. Si se configura un descuento real, define condiciones y cómo se valida; no anuncies un beneficio inexistente.

### Suscripción real

- Validación de formato de email en cliente y servidor.
- Consentimiento de marketing explícito, separado y sin premarcar, con enlace a privacidad.
- Double opt-in como comportamiento por defecto: estado pendiente, email de verificación y activación tras confirmación válida.
- No sustituir la API por `console.log()`, `alert()` ni mensajes de éxito sin persistencia.
- Estados idle, enviando, pendiente de verificación, suscripción confirmada, error y límite alcanzado.
- Manejo de duplicados sin revelar innecesariamente si una dirección ya está registrada.
- El correo de bienvenida promocional se envía tras confirmar la suscripción, no por importar un cliente o iniciar una reserva.
- Soporte de `onSubscribe` asíncrono o acción equivalente, con deshabilitado durante envío y error recuperable.
- Solo cierra automáticamente cuando corresponda al resultado real, no inmediatamente al llamar al callback.

Usa el comportamiento accesible de Dialog: foco atrapado, cierre con Escape, restauración del foco, título y descripción asociados. Corrige la referencia para no eliminar la descripción accesible ni renderizar dos botones de cierre.

Las imágenes y textos dinámicos de newsletter usan contenido estructurado seguro; no guardes objetos React en la base de datos ni inyectes HTML sin sanear.

## 9. Reservas públicas

### Flujo

1. Elegir servicio.
2. Elegir profesional compatible o «Cualquier profesional disponible».
3. Elegir fecha y una hora realmente disponible.
4. Introducir nombre, email, teléfono si es necesario y observación opcional breve.
5. Revisar servicio, profesional, fecha, hora, duración, precio si está definido y condiciones de cancelación.
6. Confirmar y recibir referencia, resultado claro y email transaccional.

Permite llegar con servicio y/o profesional preseleccionados desde otras páginas. Conserva selecciones al retroceder; si cambia el servicio, revalida profesional, duración, precio y horario.

No exijas crear una cuenta para reservar. Un área de cliente con autenticación puede añadirse después, pero no debe bloquear el flujo básico.

### Cálculo de disponibilidad

Toda disponibilidad se calcula en el servidor cruzando:

- Horario del salón para esa fecha, incluidos horarios partidos y excepciones.
- Turno y servicios habilitados del profesional.
- Vacaciones, ausencias, descansos y bloqueos.
- Duración del servicio y posibles variaciones por profesional.
- Buffers de preparación/limpieza antes y después.
- Citas existentes y bloqueos temporales todavía válidos.
- Recursos compartidos si se configuran expresamente.
- Antelación mínima, horizonte de reserva y cadencia de inicio configurables.

Una cita debe caber **completa**, con buffers, dentro de un intervalo permitido; no basta con que empiece antes del cierre. Una cadencia de inicio de 15 minutos no implica que todos los servicios duren 15 minutos.

Al elegir «Cualquier profesional», asigna uno real dentro de la misma operación atómica de confirmación. No permitas reservar un intervalo sin profesional resuelto.

### Consistencia y concurrencia

No uses el patrón inseguro «consultar disponibilidad y después insertar» como única protección.

- Mantén intervalos ocupados con inicio/fin en UTC y semántica de intervalo semiabierto `[inicio, fin)`.
- Implementa protección anti-solapamiento en base de datos para el mismo profesional y recurso, considerando buffers y estados que bloquean agenda.
- En PostgreSQL, utiliza restricciones de exclusión sobre rangos temporales y, cuando proceda, bloqueos/transacciones para cambios de horario, reservas y recursos.
- Las actualizaciones de horario y la creación de citas deben coordinarse para no aceptar reservas contra un horario que cambia concurrentemente.
- Si hay bloqueos temporales con caducidad, expíralos mediante estado explícito y trabajo persistente; no bases un índice parcial en `now()`.
- No dejes que el cliente elija directamente estados, duración, precio final ni identificadores fuera de su alcance.
- Usa idempotencia al confirmar para que doble clic, reintentos o pérdida de conexión no dupliquen la cita.
- Ante conflicto concurrente devuelve un error de dominio/HTTP 409 y alternativas, sin una pantalla de éxito falsa.

Para cada reserva guarda un snapshot del nombre/duración/precio aplicable del servicio, además de sus referencias. Cambiar el catálogo no debe reescribir la historia de citas anteriores.

### Estados y acciones

Estados mínimos: `pending_approval`, `confirmed`, `completed`, `cancelled`, `no_show`. Si añades estados operativos, define qué intervalos bloquean agenda y sus transiciones.

Modo inicial: confirmación automática después de una transacción válida. Modo alternativo configurable: aprobación manual, con comunicación explícita de «solicitud pendiente», retención/expiración documentada y aviso al salón. No confundas «solicitud recibida» con «cita confirmada».

La confirmación de asistencia del cliente, si se activa, es un dato separado del estado de aceptación de la cita.

Permite cancelación y reprogramación según política del salón. La reprogramación debe ser atómica: si la nueva hora ya no está disponible, la cita original permanece intacta. Registra cambios y reprograma los recordatorios.

Enlaces de gestión con tokens opacos de alta entropía, almacenados de forma segura, con caducidad y revocación. Un ID incremental o un email en la URL no autoriza a ver una cita. Las URLs de gestión no se indexan, no filtran datos a analítica y no contienen PII.

No ejecutes cancelaciones, confirmaciones ni bajas destructivas solo con un GET: los escáneres de correo pueden abrir enlaces. Muestra una pantalla de revisión y exige la acción correspondiente mediante POST validado.

## 10. Panel de administración

### Diseño y navegación

Diseña una aplicación de gestión premium, no una tabla CRUD sin estilo. Mismo sistema Zen Linen, tipografía de interfaz clara, iconos consistentes, filtros útiles, breadcrumbs, acciones contextuales y estados completos.

Escritorio: sidebar colapsable y topbar. Móvil: navegación por drawer y acceso rápido a Agenda, Clientes y Nueva cita; evita barras que oculten formularios o botones.

Cada módulo debe tener estados de carga, vacío, sin resultados, permiso insuficiente, error recuperable, guardando y guardado. Incluye confirmaciones para acciones destructivas, avisos de cambios sin guardar y mensajes útiles de validación.

### Resumen

Dashboard con métricas obtenidas de datos reales:

- Citas de hoy y próximas citas.
- Confirmadas, pendientes, canceladas y ausencias.
- Clientes nuevos del período.
- Ocupación, con fórmula y denominador definidos a partir del horario disponible.
- Servicios/profesionales con más reservas.
- Suscripciones activas y campañas recientes.
- Estado de integraciones, recordatorios y tareas fallidas.

No copies cifras del dashboard de la captura ni presentes reservas valoradas como ingresos cobrados. Si no existe módulo de cobros, etiqueta el dato como «Importe estimado de servicios completados», si se calcula, y explica qué incluye. Sin datos, muestra cero o estado vacío, no cifras inventadas.

### Agenda

- Vistas día, semana y lista; mensual si aporta utilidad.
- Filtro por profesional, servicio y estado.
- Crear citas manualmente usando las mismas reglas del motor público.
- Ver ficha de cita y cliente, cambiar estado, cancelar y reprogramar.
- Bloquear franjas, gestionar ausencias y turnos.
- Arrastrar para reprogramar solo si se implementa validación real y confirmación; en móvil, alternativa mediante formulario.
- Detectar conflictos y explicar el motivo.
- Actualizar disponibilidad sin recargar toda la aplicación y sin exponer datos de clientes al público.

### Clientes / CRM

- Crear, ver, editar, archivar y buscar clientes.
- Nombre, apellidos opcionales, email, teléfono, etiquetas y notas internas mínimas.
- Historial de citas y preferencias de comunicación.
- Estado y evidencia del consentimiento de marketing, solo visibles para roles autorizados.
- Filtros, paginación en servidor y acciones masivas con permisos.
- Normalización y detección de duplicados sin fusionar automáticamente personas distintas con un teléfono compartido.
- El cliente no necesita tener email si lo añade recepción y la operativa lo permite; informa de que no recibirá comunicaciones por email. La reserva pública sí puede requerirlo.
- No expongas notas internas en emails ni en páginas públicas.
- No recojas datos de salud, alergias u otras categorías sensibles por defecto. Si se consideran necesarios, requiere una definición separada de finalidad, acceso y base jurídica.
- Diferencia archivar, anonimizar y eliminar, preservando obligaciones de conservación cuando correspondan.

### Servicios

CRUD de categorías y servicios con nombre, slug, descripción, imagen, duración, buffers, profesionales habilitados, orden, estado y SEO.

Precio con tipo explícito: fijo, desde o consultar. Importes en unidades menores/céntimos y moneda EUR, sin flotantes para cálculos monetarios. Si el precio es variable, no lo presentes como un total cerrado.

No elimines físicamente un servicio con citas históricas sin una estrategia segura: desactívalo para nuevas reservas y conserva referencias históricas.

### Equipo

CRUD de profesionales: perfil público, foto, bio, especialidades, servicios habilitados, turnos, ausencias, orden y estado activo. Una ficha pública de profesional no equivale automáticamente a una cuenta con permisos de administración.

Desactivar a alguien no debe dejar citas futuras sin gestión: muestra las afectadas y propone reasignación, sin enviar correos masivos sin confirmación del administrador.

### Contenido / CMS

Gestiona la web completa mediante formularios estructurados y previsualización, sin obligar a tocar JSX:

- Cabecera, navegación y footer.
- Hero y sus imágenes/animación.
- Texto y fotografía de presentación.
- Servicios destacados y orden de secciones.
- Bloques de experiencia, galería y preguntas frecuentes.
- Equipo, contacto, horarios visibles y redes.
- Reseñas autorizadas, sin cifras o autores ficticios.
- Newsletter, imagen y textos.
- Metadatos SEO, Open Graph y páginas legales.

Incluye borrador/publicado, previsualización protegida y despublicación/ocultación de secciones vacías. No implementes un constructor libre gigantesco si un CMS estructurado resuelve el requisito.

Publicar cambios debe actualizar el contenido público y su caché de forma controlada. Borradores y notas internas nunca deben salir en endpoints públicos ni en previsualizaciones sin autorización.

### Configuración

Identidad, datos de contacto, logo/favicon, horarios, reservas, zona horaria, email remitente, integraciones, usuarios/roles, SEO general, políticas de cancelación, consentimientos y estado de puesta en producción.

No muestres secretos completos en formularios de configuración ni los envíes al navegador. Presenta estado de conexión y acciones seguras; configura claves mediante el gestor de secretos.

## 11. Imágenes y biblioteca multimedia

Todas las imágenes importantes de la web se administran desde la misma biblioteca: hero, newsletter, presentación, servicios, equipo, galería y Open Graph.

### Funciones

- Subida desde dispositivo y alta mediante URL externa HTTPS.
- Vista previa, selección de destino, nombre interno, alt, caption, categorías, orden y punto focal.
- Registrar autoría/licencia o autorización cuando sea pertinente.
- Reutilizar una imagen en varias secciones.
- Detectar dónde está en uso antes de borrarla; impedir enlaces rotos.
- Validar límites de tamaño y dimensiones, MIME real y formatos permitidos.
- Optimizar variantes y formatos de entrega; evitar servir originales enormes.
- Tratar los SVG con una política explícita: no aceptar SVG sin sanear.
- Gestión segura de URLs rotas, hotlink bloqueado y formatos no válidos.

### Enlaces externos

Ofrece dos modos cuando sea técnicamente viable y esté permitido por derechos/condiciones:

1. Referenciar una URL externa de un dominio autorizado.
2. Importar una copia al almacenamiento propio después de validar destino, tipo, tamaño y autorización de uso.

No intentes «saltarte CORS» con un proxy abierto. Si un enlace de Drive/Dropbox no es un recurso de imagen válido, explica cómo obtener un enlace accesible o pide subir el archivo.

Toda descarga, vista previa de servidor y optimización de imagen remota debe estar protegida frente a SSRF:

- HTTPS y puertos permitidos, dominios autorizados y política de salida de red.
- Validar resolución IPv4/IPv6; bloquear localhost, redes privadas, link-local y endpoints de metadatos.
- Evitar redirecciones o revalidar cada salto, DNS rebinding y cambios de destino entre comprobación y conexión.
- Límites estrictos de tiempo, bytes, dimensiones y descompresión.
- No aceptar credenciales incrustadas ni URLs con esquemas arbitrarios.
- No usar comodines globales en `remotePatterns` como forma de soportar cualquier dominio.

No almacenes tokens privados dentro de URLs públicas de imágenes ni publiques datos EXIF innecesarios. Una imagen pública no debe compartir bucket o permisos con los Excel privados.

## 12. Importación y exportación Excel

Implementa importación y exportación reales de clientes en **`.xlsx`**. CSV puede ser adicional, nunca sustituto del Excel solicitado.

### Importación

- Plantilla descargable sin datos personales reales.
- Selector de archivo y validación de extensión, contenido, tamaño, hojas y número máximo de filas.
- No ejecutar macros ni fórmulas; rechazar formatos con macros si no hay necesidad explícita.
- Leer columnas de forma segura y permitir mapear encabezados.
- Preview con filas válidas, advertencias, errores y potenciales duplicados.
- Modo «añadir nuevos» o «actualizar existentes», con clave de coincidencia explícita y confirmación.
- Normalizar espacios, email y teléfonos; no crear duplicados por mayúsculas del correo.
- Reporte con creados, actualizados, omitidos y errores por fila, descargable.
- Proceso por lotes con estado y reintento idempotente; informa si la política es todo-o-nada o parcial.
- Auditoría de usuario, fecha, fichero, resultado y cambios, sin conservar el archivo indefinidamente.

Columnas propuestas: `id_externo`, `nombre`, `apellidos`, `email`, `telefono`, `etiquetas`, `notas` y, solo cuando exista evidencia, datos de consentimiento como origen, fecha y versión del aviso.

**Regla crítica:** un Excel importado no autoriza por sí mismo a enviar marketing. Si no hay evidencia verificable o existe una baja previa, el contacto queda no suscrito. No envíes campañas ni un email promocional de «reconfirmación» a una lista sin base válida.

El importador ordinario no puede reactivar una baja por encontrar una celda «sí». Un procedimiento excepcional de migración de consentimientos debe estar restringido, validado y auditado.

### Exportación

- Exportar resultado filtrado o selección, con alcance explícito y autorización.
- `.xlsx` con cabeceras comprensibles, fechas legibles y teléfonos como texto para conservar prefijos y ceros.
- Selector de columnas; no exportar tokens, secretos ni datos internos fuera de permiso.
- Evitar inyección de fórmulas: exportar campos del usuario como texto seguro. Proteger también CSV si se ofrece.
- Generar en backend o mecanismo equivalente seguro; las descargas privadas no tienen URL pública permanente.
- Registrar quién exportó y el alcance. Caducar enlaces temporales y purgar archivos según política.

## 13. Email marketing y automatizaciones

### Proveedor y separación

Implementa un adaptador de correo; proveedor inicial propuesto Resend, sustituible sin rehacer el dominio. Configura remitente y dominio verificado antes de envíos reales. Documenta SPF/DKIM y la política DMARC apropiada al dominio.

Distingue claramente:

- **Transaccional:** información necesaria de una reserva o consulta.
- **Marketing:** newsletter, promociones, reactivación y campañas.

Reservar no suscribe automáticamente. Darse de baja de marketing no elimina la posibilidad de recibir comunicaciones necesarias sobre una cita vigente. Los correos transaccionales no deben camuflar promociones sin base válida.

### Área de campañas

- Gestión de suscriptores con estados pendiente, activo, baja, rebote y supresión.
- Segmentos por datos permitidos: etiquetas, servicio reservado, actividad y consentimiento válido.
- Campañas en borrador, listas, programadas, en envío, completadas, canceladas y fallidas.
- Editor de contenido seguro con asunto, preheader, imagen y bloques sencillos.
- Preview móvil/escritorio y envío de prueba a destinatarios autorizados.
- Cálculo de destinatarios válidos antes de enviar y revalidación de supresión justo antes de cada envío.
- Confirmación explícita antes de una campaña real y estimación de volumen.
- Programación con zona horaria `Europe/Madrid` y almacenamiento UTC.
- Límites, lotes, reintentos y cuotas del proveedor; evita enviar una lista como CC/BCC.
- Enlace de baja claro, sin login, y centro sencillo de preferencias.
- Supresión inmediata de marketing tras baja, queja o rebote permanente.
- Métricas reales de envío, aceptación por proveedor, entrega, rebote, quejas y bajas.

Aperturas y clics solo si están habilitados y la configuración de privacidad lo permite; preséntalos como indicadores imperfectos, no como prueba de que una persona leyó el correo. No inventes métricas si el proveedor no emite el evento.

### Automatizaciones mínimas

| Automatización | Evento | Reglas |
|---|---|---|
| Verificación newsletter | Solicitud de suscripción | Mensaje de verificación, token seguro y estado pendiente |
| Bienvenida newsletter | Double opt-in confirmado | Una vez por alta válida; sin descuento no configurado |
| Solicitud de cita | Reserva en aprobación manual | Explicar que no está confirmada todavía |
| Confirmación de cita | Cita confirmada | Servicio, profesional, fecha/hora, ubicación validada y gestión |
| Aviso al salón | Nueva cita o solicitud | Destinatarios internos configurados, sin exceso de PII |
| Recordatorio | Antes de cita confirmada | Propuesta inicial configurable: 24 h y 2 h antes |
| Reprogramación | Cambio de fecha/hora | Informar cambio y anular recordatorios antiguos |
| Cancelación | Cancelación válida | Confirmar resultado y liberar disponibilidad |
| Respuesta a contacto | Consulta recibida | Acuse de recibo y aviso interno si se configura |

La bienvenida al CRM, si se solicita, debe definirse por separado; no debe activar marketing por crear o importar un cliente. Campañas de cumpleaños o reactivación quedan como extensión opcional, no como requisito que exija recoger más datos.

### Fiabilidad

- Reserva y evento de notificación se guardan de forma atómica mediante outbox.
- Jobs persistidos con `scheduledAt`, estado, intentos, próximo intento, clave de deduplicación y error seguro.
- Worker o scheduler real que funcione aunque nadie tenga el navegador abierto.
- Si el alojamiento no admite worker persistente, usa un disparador externo autenticado y documentado; no dejes un `setTimeout` o pestaña abierta como «automatización».
- Claim de trabajos atómico, lease, recuperación de procesos caídos y política de reintentos con backoff.
- Idempotencia en aplicación y en proveedor cuando sea posible; la deduplicación propia no debe depender únicamente de la ventana temporal del proveedor.
- Antes de enviar recordatorios, volver a comprobar estado y versión de la cita; descartar jobs obsoletos.
- Si la cita se reserva con menos antelación que un recordatorio, no mandarlo «atrasado» como si fuera vigente.
- Webhooks con verificación de firma sobre payload correcto, tolerancia temporal, deduplicación y procesamiento idempotente.
- Un email aceptado por API no se marca como entregado hasta tener evidencia del proveedor.
- Si falla el correo tras una reserva guardada, la reserva sigue existiendo y la incidencia se ve en el panel.
- Plantillas HTML de email compatibles, con alternativa de texto, diseño responsive y variables escapadas.
- No hagas lógica crítica dependiente de aperturas de correo.

Sin credenciales, mostrar «Pendiente de configurar» y permitir preview o buzón de pruebas local aislado. Nunca fingir que se ha enviado un correo real.

## 14. Google, horarios y ficha del negocio

### Objetivo

Mostrar horarios reales y mantener el sistema de reservas alineado con el horario del negocio, sin scraping de Google Maps ni horarios hardcodeados.

Implementa un módulo de horarios con **origen, fecha de actualización, estado de sincronización y excepciones**. Que la web muestre «abierto» no implica que haya citas libres.

### Fuente preferida: Google Business Profile

Cuando el salón autorice una cuenta propietaria/gestora y el proyecto tenga acceso aprobado:

- OAuth 2.0 con credenciales y redirecciones correctas.
- Selección explícita de la ubicación correcta de ESPACIO Q; validar nombre y ubicación, no solo texto de búsqueda.
- Lectura de horario regular, especial y estado operativo mediante la API oficial pertinente.
- Normalizar horarios partidos, cierres, festivos, vacaciones y períodos que crucen medianoche.
- Sincronización programada configurable; propuesta inicial cada 6 horas, sujeta a cuotas y permisos, no una promesa de actualización instantánea.
- Botón «Sincronizar ahora», historial de resultado y alertas por fallo.
- Tokens de refresco cifrados, desconexión y revocación; ningún token en cliente.

No prometas activar Business Profile únicamente con pegar el enlace. Hay requisitos de acceso y autorización externa. No escribas de vuelta en Google sin un alcance y consentimiento adicionales explícitos: esta primera integración es de lectura.

### Alternativa: Places API

Si no hay acceso a Business Profile pero se configura Places API:

- Resolver y verificar un Place ID real mediante herramientas oficiales.
- No asumir que el identificador hexadecimal, CID o segmento interno de la URL de Maps es ya el Place ID de Places API.
- Consultar los campos de horario disponibles mediante la API vigente y sus field masks.
- Distinguir horario semanal de las excepciones disponibles para próximos días; no extender una excepción de pocos días a todo el calendario.
- Cumplir atribución, licencia, políticas de almacenamiento/caché y términos aplicables de Google; no persistir indiscriminadamente respuestas completas.
- Separar información de Google mostrada en vivo de los horarios propios del salón aprobados para operar reservas.

No conviertas Places en una base de datos paralela de contenido de Google. Si sus términos no permiten el almacenamiento previsto, usa lectura y visualización permitidas y horarios propios confirmados por el administrador para el motor de reservas.

### Alternativa manual operativa

Mientras no haya una integración válida:

- Editor semanal y por fecha desde el dashboard.
- Etiqueta interna de «Manual», «Google conectado», «Desactualizado» o «Error».
- Nunca mostrar «Sincronizado con Google» sin sincronización real.
- Si no hay horario confirmado de ninguna fuente válida, no ofrecer citas ficticias.

### Política de precedencia y cambios

- Horario efectivo del salón: excepción local autorizada para una fecha, después excepción Google aplicable, después horario regular de la fuente activa.
- Los turnos del profesional solo pueden restringir ese horario, no ampliarlo silenciosamente.
- Cambios externos que afecten citas existentes generan una alerta y listado de conflictos. No cancelar, mover o borrar citas automáticamente.
- Registra fuente, actor, fecha de entrada en vigor y cambios.
- Si una sincronización falla, utiliza el último horario válido solo cuando su almacenamiento esté permitido y dentro de un umbral de vigencia documentado; para contenido de Places respeta sus límites en lugar de asumir caché libre.
- Al superar el umbral, solicita revisión y aplica una política conservadora para nuevas reservas.

No uses la zona horaria del navegador para decidir el horario del salón. Almacena instantes UTC y convierte con una biblioteca que soporte zonas IANA y cambios de horario de verano. Prueba las transiciones de `Europe/Madrid`.

## 15. Modelo de datos

Diseña entidades persistentes con claves, índices, restricciones, timestamps y políticas de acceso. Como mínimo:

| Entidad | Responsabilidad |
|---|---|
| User / Session / Role | Autenticación y autorización del personal |
| SalonSettings | Identidad, configuración y estado de publicación |
| ServiceCategory / Service | Catálogo, duración, precio, buffers y SEO |
| Professional / ProfessionalService | Equipo y servicios habilitados |
| WorkingSchedule / ScheduleException | Horario de salón y turnos/excepciones |
| Client | CRM e identidad de cliente separada de acceso al panel |
| Appointment / AppointmentEvent | Cita, snapshots y auditoría de transiciones |
| Occupancy / ResourceReservation | Intervalos protegidos de profesionales/recursos |
| MediaAsset / MediaUsage | Imágenes, metadatos y referencias de uso |
| PageContent / ContentRevision | CMS, borradores y publicaciones |
| Subscriber / ConsentEvent / Suppression | Newsletter, evidencia de consentimiento y bajas |
| Campaign / CampaignRecipient | Campañas y estado por destinatario |
| EmailTemplate / AutomationRule | Contenido y reglas editables |
| OutboxEvent / NotificationJob / EmailDelivery | Entrega fiable y trazabilidad |
| ImportJob / ImportRowResult | Importaciones y errores por fila |
| ExportJob | Exportaciones privadas y caducidad |
| IntegrationConnection / SyncEvent | Conexiones y resultados sin secretos expuestos |
| AuditEvent | Acciones sensibles del equipo |
| ContactMessage | Consultas y su gestión autorizada |

Evita una tabla JSON gigante para todo. Usa contenido estructurado donde tenga sentido y relaciones para el dominio de reservas/CRM.

No impongas una unicidad irreal de teléfono compartido. Define normalización de correo y políticas de deduplicación. Los IDs externos del Excel no se convierten en claves internas sin validación.

Los tokens de acción se almacenan preferentemente como hashes y las credenciales que necesitan recuperación se cifran con gestión segura de claves. No guardes secretos en logs ni en JSON públicos.

## 16. Contratos de backend

Puedes usar Route Handlers o Server Actions donde corresponda, pero la autorización y las reglas de negocio deben existir en el servidor, no solo en botones ocultos.

### Superficie pública mínima

- Consultar servicios, profesionales y contenido publicado.
- Consultar disponibilidad por servicio/profesional/fecha, sin PII.
- Crear una reserva de forma idempotente.
- Consultar y gestionar una cita con autorización/token apropiado.
- Solicitar suscripción, verificarla y gestionar la baja/preferencias.
- Enviar formulario de contacto con rate limiting y validación.

### Superficie privada mínima

- CRUD de catálogo, profesionales, horarios y CRM.
- Agenda y transiciones de cita.
- Subida/importación de medios con validación.
- Importación/exportación Excel y consulta de sus estados.
- CMS y publicación.
- Campañas, pruebas, programación y cancelación de envíos pendientes.
- Reglas automáticas, plantillas y logs de entrega.
- Integraciones Google/email y estado de sincronización.
- Informes y auditoría según permisos.

### Convenciones

- Validación Zod en entradas y esquemas explícitos de salida.
- HTTP coherente: 400/422 validación, 401 no autenticado, 403 prohibido, 404 no disponible, 409 conflicto y 429 límite.
- Errores de usuario comprensibles, sin stacks, SQL ni secretos.
- Paginación y filtros en servidor para conjuntos grandes.
- Índices para rango de fechas, profesional, email normalizado y estados usados por jobs.
- DTO públicos que no incluyan notas internas, datos de clientes o tokens.
- No usar GET para mutaciones.
- No confiar en `clientId`, `role`, precios ni permisos enviados por el navegador.
- Rate limiting distribuido o persistente cuando el despliegue tenga varias instancias; no depender solo de memoria local.
- Logs estructurados con IDs de correlación y redacción de PII.

## 17. Acceso, roles y seguridad

### Roles

- **Propietario/admin:** configuración completa, usuarios, integraciones, publicación y datos sensibles autorizados.
- **Recepción/gestión:** agenda y CRM necesarios para operar; marketing y exportación solo con permisos explícitos.
- **Profesional:** agenda propia y datos mínimos de sus citas; sin acceso global al CRM o campañas por defecto.

Si una persona tiene varios roles, documenta su alcance. Añade comprobaciones por recurso, no solo un `isAdmin` global. Una URL `/admin` protegida visualmente no sustituye permisos en API.

### Autenticación

Ruta de acceso independiente, por ejemplo `/acceso`, para evitar bucles de redirección con el layout protegido de `/admin`. Acceso privado por invitación o bootstrap seguro de propietario; no permitir que un registro público cree administradores. Sin contraseña por defecto compartida ni credenciales incrustadas en el repositorio.

Implementa sesiones seguras, cierre de sesión y recuperación según el proveedor. Si hay contraseñas propias, utiliza hashing robusto y una biblioteca mantenida; no inventes criptografía. Ofrece MFA cuando el proveedor lo permita y documenta su activación.

### Controles

- HTTPS, cookies seguras `HttpOnly`/`Secure` y estrategia SameSite apropiada.
- Protección CSRF/origen en mutaciones con sesión y CORS restringido donde proceda.
- Protección XSS, escape y sanitización del contenido administrable.
- Consultas parametrizadas/ORM y prevención de asignación masiva de campos.
- Validación y autorización de ficheros y URLs.
- Secretos solo en servidor/gestor de secretos, nunca bajo `NEXT_PUBLIC_*` salvo configuración realmente pública.
- Verificación de firmas de webhooks y OAuth state/redirect URIs.
- Cabeceras de seguridad y CSP compatibles con las integraciones necesarias.
- Auditoría de cambios sensibles, exportaciones, permisos, campañas y reservas.
- No registrar formularios completos, notas de clientes, tokens o archivos personales en herramientas de analítica.
- Separación de entornos y bloqueo de envío real desde pruebas.

Protege `/admin` con autenticación y marca sus páginas `noindex`. `robots.txt` no es una medida de seguridad ni evita por sí mismo fugas.

## 18. Privacidad y requisitos legales

Implementa herramientas que permitan operar conforme al contexto español/UE; no afirmes «cumplimiento RGPD garantizado» por añadir un banner.

### Captación y comunicaciones

- Avisos claros de privacidad, finalidad y responsable.
- Marketing opcional y separado de la reserva.
- Registro de eventos de consentimiento con fecha, canal/origen, versión del texto y cambios; minimiza IP u otros datos técnicos si no son necesarios.
- Baja sencilla y gratuita en cada comunicación comercial.
- Como política inicial, las campañas se envían solo a contactos con consentimiento válido confirmado y sin supresión.
- No actives automáticamente otras bases/excepciones comerciales sin revisión del responsable y configuración documentada.

### Cookies y terceros

Si solo hay tecnologías estrictamente necesarias, no añadas un consentimiento ficticio para todo. Si se incorporan analítica, publicidad o recursos de terceros que lo requieran:

- Bloquearlos antes del consentimiento aplicable.
- Botones «Aceptar» y «Rechazar» de prominencia equivalente en primera capa.
- Configuración granular por finalidades y revocación accesible.
- No inferir consentimiento por seguir navegando.
- Revisar mapa embebido y otros widgets externos; si procede, usar carga bajo consentimiento o enlace externo como alternativa.

### Operativa de datos

- Herramientas para localizar/exportar datos de una persona y tramitar rectificación, supresión o anonimización según obligaciones aplicables.
- Política configurable de retención para consultas, archivos importados/exportados, logs y datos inactivos.
- Acceso mínimo, backups seguros, restauración probada y acuerdos con encargados.
- Verificar ubicaciones de tratamiento de hosting, base de datos, email, almacenamiento, logs y plataforma de desarrollo.
- No asegurar residencia íntegra UE solo por elegir una base de datos europea. Documentar transferencias y medidas que deba revisar el responsable.
- Los textos legales son borradores a revisar y completar con titular, NIF/datos empresariales, contacto y políticas reales. No inventes esos datos.

No uses datos de clientes reales para demos, tests, prompts del constructor o servicios de IA externos. La app no requiere incorporar un chatbot ni un LLM para cumplir este alcance.

## 19. SEO y rendimiento

### SEO técnico y local

- Páginas públicas renderizadas en servidor o prerenderizadas según contenido.
- HTML inicial con contenido útil; no convertir todo el sitio a `use client` por el hero.
- Metadata por ruta mediante mecanismos nativos de Next.js, canonical y Open Graph/Twitter.
- Slugs legibles, jerarquía de títulos y enlaces internos descriptivos.
- Sitemap solo de contenido público publicado e indexable.
- Robots y `noindex` adecuados para admin, previews, confirmaciones, gestión de citas y URLs con tokens.
- Estados 404 y redirecciones cuando cambie un slug.
- JSON-LD de negocio local/salón con datos verificados; servicios y breadcrumbs cuando proceda.
- No publicar aggregateRating ni reseñas estructuradas inventadas. Respetar las políticas aplicables; no prometer estrellas en Google.
- Consistencia de nombre, dirección y teléfono una vez confirmados.
- No prometer posiciones concretas en buscadores por usar Next.js.

### Rendimiento

- Optimización de imágenes y fuentes, lazy loading bajo el primer viewport y carga diferida del código pesado.
- Reservar dimensiones para imágenes y componentes para evitar saltos de layout.
- Hero con presupuesto de imágenes/animación y fallback de bajo movimiento.
- Caché pública con invalidación tras publicación y configuración explícita de los datos dinámicos.
- Disponibilidad, sesiones y datos privados nunca en caché pública compartida; no asumir que una opción por defecto de Next.js es correcta para toda la app.
- Consultas eficientes y métricas de rendimiento de backend.
- Objetivos orientativos de experiencia: LCP ≤ 2,5 s, CLS ≤ 0,1 e INP ≤ 200 ms cuando existan datos de campo suficientes; no presentarlos como resultados medidos sin medición.
- Lighthouse móvil como comprobación de laboratorio, con dispositivo/condiciones documentados; no confundir su resultado con INP de campo.

## 20. Responsive y accesibilidad

No basta con que la home «quepa» en un móvil. Revisa también agenda, tablas, filtros, editor de campañas, importador Excel, modales y configuración.

### Comportamiento esperado

- Validar al menos anchos 360, 390, 768, 1024, 1440 y 1920 px; añadir comprobación de reflow/zoom cuando corresponda.
- Sin scroll horizontal de página. Para tablas densas, vista de tarjetas o scroll **local**, con columnas prioritarias y controles utilizables.
- Controles táctiles cercanos a 44 px cuando sea posible, texto de formulario legible y buen espacio entre acciones.
- Diálogos que quepan en pantalla y tengan scroll interno; en móvil, sheets/fullscreen cuando proceda.
- Teclado virtual sin ocultar el botón principal.
- Agenda móvil con vista lista/día realmente utilizable; no miniaturizar una semana de escritorio.
- Sticky CTA respetando `safe-area-inset-bottom`, sin ocultar footer, consentimientos o formularios.
- Menús, selectores de fecha y filtros utilizables con teclado y lector de pantalla.
- Sin funciones exclusivas de hover.

Apunta a WCAG 2.2 AA: contraste, foco visible, orden lógico, etiquetas, errores asociados, estados anunciados, alternativas de texto y reducción de movimiento. Ejecuta comprobaciones automáticas y revisión manual; no declares certificación automática.

## 21. Variables e integraciones

Genera `.env.example` sin valores secretos, adaptado a las decisiones finalmente implementadas. No inventes claves que el código nunca utiliza. Lista orientativa:

```dotenv
APP_URL=
DATABASE_URL=
AUTH_SECRET=
EMAIL_PROVIDER_API_KEY=
EMAIL_FROM=
EMAIL_REPLY_TO=
EMAIL_WEBHOOK_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
GOOGLE_BUSINESS_LOCATION_ID=
GOOGLE_PLACES_API_KEY=
GOOGLE_PLACE_ID=
STORAGE_ENDPOINT=
STORAGE_BUCKET=
STORAGE_REGION=
STORAGE_ACCESS_KEY_ID=
STORAGE_SECRET_ACCESS_KEY=
CRON_SECRET=
TOKEN_ENCRYPTION_KEY=
```

Si un proveedor necesita otros nombres, documenta el mapeo. El secreto de cifrado no se reutiliza para sesiones o firma de cron. Las claves de Maps/Places se restringen por API y contexto; una clave pública permitida por un servicio concreto no se trata igual que una credencial de servidor.

Para cada integración entrega una ficha: finalidad, proveedor, credenciales, permisos, coste/cuota pendiente de confirmar, estado, prueba realizada y comportamiento degradado.

No contrates servicios de pago ni realices campañas masivas sin aprobación. Aísla los destinatarios de prueba y usa allowlist en entornos no productivos.

## 22. Pruebas y aceptación

Ejecuta typecheck, lint, pruebas y build de producción. Revisa la aplicación en el navegador, no solo el compilador. Usa datos de prueba claramente aislados, nunca estadísticas inventadas presentadas como reales.

### Matriz mínima de pruebas

| Área | Criterio verificable |
|---|---|
| Stack | El proyecto ejecuta Next.js/App Router real, sin reemplazo silencioso por SPA |
| Identidad | Web pública y dashboard usan Zen Linen; el azul/rosa del navegador no se trasladan a la marca |
| Hero | Hay profundidad y tarjetas en escritorio; contenido visible al cargar y salida natural por scroll |
| Hero accesible | Con reducción de movimiento hay composición estática legible y CTA funcional |
| CMS | Cambiar texto/imagen, previsualizar y publicar actualiza la web sin editar código |
| Multimedia | Subida y URL válida funcionan; URL privada/interna, archivo inválido y dominio no permitido se rechazan |
| Servicios | Alta/edición/desactivación persisten y se reflejan en catálogo y reservas |
| Equipo | Solo aparecen profesionales activos habilitados para el servicio |
| Horario | Turnos partidos, pausas, festivos, buffers y servicios largos no generan huecos ilegales |
| Concurrencia | Dos confirmaciones simultáneas solapadas para el mismo profesional no crean dos citas |
| Idempotencia | Repetir la misma solicitud no crea reservas ni correos duplicados |
| Reprogramación | Si la nueva franja falla, permanece la cita original y sus datos consistentes |
| Cambios de horario | Una sincronización que afecta citas genera conflicto visible, no cancelaciones ocultas |
| Zona horaria | Casos de cambio de hora en Europe/Madrid sin duplicados ni horarios inexistentes ofrecidos |
| Cliente | CRUD, búsqueda, filtros y permisos funcionan con persistencia real |
| Excel | Importar, mapear, actualizar, detectar errores y exportar `.xlsx` funciona |
| Consentimiento | Importar un contacto no lo suscribe ni reactiva bajas |
| Newsletter | Un solo modal, double opt-in real, duplicados seguros y sin descuento ficticio |
| Email | Diferenciar programado, aceptado, entregado y fallido usando evidencia real |
| Jobs | Los recordatorios funcionan sin navegador abierto; reintentos no duplican y citas canceladas no los reciben |
| Webhooks | Firma inválida rechazada y evento repetido sin efectos duplicados |
| Marketing | Un contacto de baja no recibe una campaña aunque estaba en la segmentación inicial |
| Google | Estado real, ubicación validada, fallo visible y alternativa manual; sin scraping |
| Permisos | Profesional A no accede a agenda privada de B ni a exportaciones globales |
| Seguridad | Sin secretos en bundle, respuestas públicas, logs o repositorio |
| Responsive | Reserva y administración completas utilizables en móvil, tablet y escritorio |
| Accesibilidad | Navegación por teclado, foco, etiquetas, contraste y diálogos revisados |
| SEO | Metadatos, canonical, sitemap y HTML público correctos; tokens y admin no indexables |
| Persistencia | Datos, imágenes y jobs sobreviven reinicios y despliegues |

Corrige cualquier texto de esta tabla que no coincida con la implementación final, pero no rebajes las garantías para declarar éxito. Si una prueba depende de credenciales ausentes, márcala como bloqueada, no como aprobada.

Añade pruebas de regresión para los bugs encontrados. Prueba con más de una sesión/solicitud concurrente: una demo manual con una sola pestaña no valida el motor de reservas.

## 23. Fases de implementación

El alcance final es el conjunto completo, pero ejecútalo por entregas verificables. No intentes esconder módulos pendientes detrás de menús sin funcionamiento.

### Fase 0 · Base y decisiones

Revisar entorno, configurar Next.js/TypeScript/Tailwind/shadcn, acordar conexión de PostgreSQL/almacenamiento, definir tokens, modelo de datos y documentación. Entregar checklist de datos faltantes y arquitectura efectiva.

### Fase 1 · Diseño público y CMS mínimo

Construir shell, home, hero 3D, newsletter visual único, rutas públicas, biblioteca multimedia y edición/publicación básica. Incluir estados honestos mientras faltan datos. Verificar la dirección de arte antes de propagar componentes a todo el panel.

### Fase 2 · Administración, catálogo y CRM

Autenticación, roles, servicios, profesionales, horarios manuales, CRM e importación/exportación `.xlsx`. Persistencia real y pruebas de permisos.

### Fase 3 · Motor de reservas

Disponibilidad, agenda pública/privada, restricciones de concurrencia, creación, cancelación, reprogramación y gestión segura por enlace. Pruebas de buffers, turnos y zona horaria.

### Fase 4 · Newsletter y email

Suscripciones/consentimientos, double opt-in, plantillas, outbox, jobs, confirmaciones, recordatorios y webhooks. Configurar proveedor real cuando estén las credenciales.

### Fase 5 · Marketing y Google

Campañas, segmentos, bajas/supresión, programación, panel de entrega e integración de horarios Google. Mantener claro lo pendiente de autorización externa.

### Fase 6 · Endurecimiento y entrega

SEO final, accesibilidad, rendimiento, responsive completo, seguridad, backups, build y revisión end-to-end. No declarar producción antes de cerrar o aceptar explícitamente los bloqueos.

Al finalizar cada fase informa de: rutas operativas, requisitos cerrados, pruebas ejecutadas, resultados y credenciales/datos pendientes. Conserva diseño, datos y contratos de fases previas.

## 24. Entrega final obligatoria

Entrega:

1. Código completo, coherente y ejecutable.
2. Esquema, migraciones, índices y restricciones de base de datos.
3. Componentes del hero y newsletter integrados, no demos sueltas.
4. Web pública y panel conectados a datos reales.
5. Motor de reservas y procesos de email con pruebas.
6. `.env.example` seguro y documentación de integraciones.
7. README con instalación, desarrollo, build, despliegue y comandos reales.
8. Guía breve para que el salón edite contenido, gestione citas/clientes, importe/exporte Excel y envíe campañas.
9. Operativa de backups, restauración y scheduler/worker.
10. Matriz requisito → implementación → prueba → estado.
11. Lista de datos de negocio/credenciales pendientes y checklist de lanzamiento.

No termines con «todo funciona» si hay botones sin acción, pantallas sin backend, correos simulados, horario ficticio, credenciales pendientes o datos que desaparecen al reiniciar.

**Empieza por la Fase 0 y continúa con una primera entrega funcional. Mantén esta especificación como contrato del producto. El objetivo no es solo una web bonita: es una web editorial de ESPACIO Q con un sistema de gestión fiable, elegante y cómodo en cualquier dispositivo.**

# FIN DEL PROMPT

---

## Notas de preparación

Estas notas no son contenido para publicar en la web.

- El contenido funcional procede del Word aportado; los bloques repetidos del newsletter se han consolidado. Las ampliaciones técnicas y de UX convierten las peticiones en condiciones de implementación y aceptación, sin añadir e-commerce obligatorio.
- La paleta base se contrastó con [Zen Linen en 21st.dev](https://21st.dev/@serafimcloud/themes/zen-linen); los colores de gráficos se transcribieron de las capturas. Los tokens complementarios, la propuesta tipográfica y las decisiones de arquitectura son especificaciones propuestas, no datos extraídos del salón.
- [Emergent](https://help.emergent.sh/faqs) admite Next.js, describe MongoDB gestionado y recomienda solicitudes pequeñas. Por eso se verifica PostgreSQL y se ejecuta por fases.
- La sincronización de horarios requiere [configuración y autorización oficiales de Google Business Profile](https://developers.google.com/my-business/content/basic-setup), además de sus [requisitos de acceso](https://developers.google.com/my-business/content/prereqs). No se han verificado los horarios actuales del salón ni se han inventado.
- Para un fallback con Places hay que respetar sus [políticas de atribución y almacenamiento](https://developers.google.com/maps/documentation/places/web-service/policies); una copia persistente indiscriminada no es el comportamiento por defecto propuesto.
- El diseño anti-solapamiento puede apoyarse en [rangos y restricciones de exclusión de PostgreSQL](https://www.postgresql.org/docs/current/rangetypes.html). El importador de imágenes debe considerar las [medidas SSRF de OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html).
- Las instrucciones de marketing y cookies deben revisarse en el contexto real del responsable; referencias de partida: [artículo 21 de la LSSI](https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758) y [guía de cookies de la AEPD](https://www.aepd.es/guias/guia-cookies.pdf). El prompt no sustituye asesoramiento jurídico ni garantiza cumplimiento automático.
