# Guía de Uso del Panel · ESPACIO Q

Esta guía explica al equipo de **ESPACIO Q** cómo gestionar toda la web pública, los textos legales, las reservas, el CRM en Excel y las comunicaciones sin tocar código.

---

## 1. Acceso y Perfiles de Usuario (`/acceso`)

- **Propietaria/o (`OWNER_ADMIN`):** acceso completo a todos los módulos, incluyendo `Configuración`, datos fiscales/legales, creación de usuarios internos, anonimización RGPD y auditoría.
- **Recepción (`RECEPTION`):** gestión diaria de `Agenda`, `Clientes`, `Servicios`, `Equipo`, `Horarios`, `Contenido y legales`, `Multimedia`, `Automatizaciones` e `Informes`. La exportación a Excel y el envío de campañas de `Marketing` se activan individualmente por usuario desde `Configuración → Usuarios y permisos`.
- **Profesional (`PROFESSIONAL`):** acceso exclusivo a su propia `Agenda` del día/semana. No tiene acceso al CRM global ni a exportaciones.

---

## 2. Completar Datos del Salón y Titularidad Legal (`/admin/configuracion`)

1. Entra en **Configuración → Identidad y contacto** para introducir la dirección postal exacta en Madrid, teléfono, WhatsApp, email de contacto y redes sociales. Si un dato se deja vacío, la web pública lo oculta limpiamente sin mostrar enlaces rotos.
2. Entra en **Configuración → Datos fiscales y legales** y rellena:
   - **Titular / Razón social**
   - **NIF / CIF**
   - **Domicilio social**
   - **Datos registrales** (si es sociedad mercantil)
   - **Email RGPD / Privacidad**
   Al guardar, estos datos se insertan automáticamente en **Aviso Legal**, **Términos y Condiciones**, **Condiciones de Reserva**, **Política de Privacidad** y **Política de Cookies**.

---

## 3. Editar Cualquier Texto de la Web y las Páginas Legales (`/admin/contenido`)

Todo el texto visible en la web es editable desde **Contenido y legales**:
- **Global:** barra de navegación, botón de reserva, pie de página y textos del diálogo/formulario de Newsletter.
- **Portada (Home):** Hero inmersivo 3D (título, subtítulo, botones, interruptor `Activar animación 3D de scroll` y selección/orden de fotos), bloques editoriales y sección de llamada a la acción.
- **Páginas secundarias:** encabezados e introducciones de Servicios, Equipo, Galería, Contacto y Asistente de Reserva.
- **Documentos legales:** `/aviso-legal`, `/terminos-y-condiciones`, `/condiciones-reserva`, `/privacidad` y `/cookies` (organizados por secciones editables con título y párrafos).

**Flujo seguro de edición:**
1. Pulsa **Guardar borrador** para conservar cambios sin alterarlos todavía para los visitantes.
2. Usa **Vista previa** para comprobar cómo queda en la web real.
3. Pulsa **Publicar cambios** para aplicar la nueva versión inmediatamente y guardar un punto de restauración en el historial de revisiones.

---

## 4. Gestionar Fotografías (`/admin/multimedia`)

- Sube imágenes propias desde tu ordenador (`JPG`, `PNG`, `WebP`, `AVIF` hasta 8 MB) o registra URLs HTTPS de dominios autorizados.
- Cada imagen requiere un **texto alternativo (`alt`)** descriptivo para accesibilidad y SEO.
- Puedes ajustar el punto focal (`X% / Y%`) y sustituir las imágenes marcadas como *Provisional* por fotografías reales de ESPACIO Q.
- Si una fotografía está en uso en el Hero o en una ficha, el sistema avisa e impide su borrado accidental hasta que asignes otra.

---

## 5. Activar las Reservas Online (`Servicios` → `Equipo` → `Horarios`)

Mientras falte cualquiera de estos tres pasos, `/reservar` mostrará de forma honesta **«Reservas online próximamente»**:
1. **Servicios (`/admin/servicios`):** crea las categorías y servicios indicando duración en minutos, buffers antes/después (tiempo de preparación o limpieza entre clientes) y tipo de precio (`Precio cerrado`, `Desde` o `A consultar tras diagnóstico`).
2. **Equipo (`/admin/equipo`):** da de alta a cada profesional y marca las casillas de los servicios que realiza.
3. **Horarios (`/admin/horarios`):** configura los días abiertos (admite **turno partido**, por ejemplo `10:00–14:00` y `16:00–20:00`), marca **Horario del salón confirmado** y activa **Habilitar reservas online públicas** en `Configuración → Políticas de reserva`.

---

## 6. Operativa Diaria de Agenda (`/admin/agenda`)

- Alterna entre vista **Día**, **Semana** o **Lista** (optimizada para móvil).
- **+ Nueva cita manual:** registra reservas telefónicas o presenciales pasando por la misma validación anti-solapamiento.
- **Bloquear franja:** reserva tiempos de descanso, mantenimiento o formación.
- En cada cita puedes **Aprobar** (si usas modo manual), marcar **Completada**, **No presentado**, **Reprogramar** o **Cancelar** (liberando el hueco al instante y anulando recordatorios pendientes).

---

## 7. Clientes e Importación / Exportación Excel `.xlsx` (`/admin/clientes`)

- **Importar desde Excel (`.xlsx`):**
  1. Abre **Importar / Exportar Excel (.xlsx)** y descarga la plantilla oficial.
  2. Selecciona tu archivo `.xlsx` y pulsa **1. Previsualizar (Dry-Run)** para revisar cuántos clientes se crearán, actualizarán o tienen errores de formato antes de escribir en la base de datos.
  3. Pulsa **2. Confirmar importación definitiva**. *Por cumplimiento RGPD/LSSI, importar un Excel jamás suscribe automáticamente a los clientes a correos publicitarios ni reactiva bajas previas.*
- **Exportar a Excel (`.xlsx`):** elige las columnas deseadas y descarga el archivo `.xlsx` filtrado.

---

## 8. Newsletter, Campañas y Buzón de Correos (`/admin/marketing` y `/admin/automatizaciones`)

- Solo reciben campañas los contactos en estado `ACTIVE` que han pulsado el enlace de confirmación **double opt-in** en su correo y no figuran en la tabla **Supresión**.
- Antes de lanzar una campaña en `/admin/marketing`, utiliza **Enviar prueba** para revisar el diseño en tu propio correo.
- En `/admin/automatizaciones` puedes inspeccionar el HTML exacto de cada correo enviado (o guardado en buzón local `SIMULATED_LOCAL` si aún no se ha configurado `EMAIL_PROVIDER_API_KEY`).
