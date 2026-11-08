# Manual de Operaciones, Despliegue y Recuperación · ESPACIO Q

## 1. Requisitos de Puesta en Producción

1. **Variables de Entorno Obligatorias:**
   - `APP_URL`: URL pública canónica con HTTPS (ej. `https://espacioq.es`).
   - `DATABASE_URL`: Cadena de conexión a PostgreSQL 16+ con TLS habilitado y extensión `btree_gist`.
   - `AUTH_SECRET`: Secreto criptográfico de al menos 32 bytes aleatorios para firma de sesiones (`openssl rand -hex 32`).
   - `TOKEN_ENCRYPTION_KEY`: Clave de 32 bytes (64 caracteres hex) independiente de `AUTH_SECRET` para cifrar tokens OAuth en reposo mediante AES-256-GCM.
   - `CRON_SECRET`: Token exclusivo para autenticar llamadas al worker de trabajos programados (`/api/internal/jobs`).

2. **Base de Datos y Migraciones:**
   - En entorno local, el servidor PostgreSQL 16 se inicia con:
     ```powershell
     & "C:\Program Files\PostgreSQL\16\bin\pg_ctl.exe" -D "d:\ESPACIO Q APP WEB\.pgdata" -l "d:\ESPACIO Q APP WEB\.pgdata\postgres.log" -o "-p 5433" start
     ```
   - Aplicar migraciones y restricciones SQL (incluida la restricción `EXCLUDE USING gist` anti-solapamiento en `Occupancy`):
     ```bash
     npm run db:migrate
     npm run db:seed
     ```

---

## 2. Tareas Programadas (Scheduler / Worker)

El sistema no depende de tener un navegador abierto ni de `setTimeout` en memoria para enviar correos, procesar el outbox, enviar recordatorios de citas (24 h y 2 h antes), ejecutar campañas programadas o sincronizar horarios con Google.

- **Endpoint del Worker:** `POST /api/internal/jobs`
- **Autenticación:** Cabecera `Authorization: Bearer <CRON_SECRET>`
- **Frecuencia recomendada:**
  - Procesamiento de Outbox, Recordatorios y Campañas: cada **1 a 5 minutos** (`*/2 * * * *`).
  - Sincronización de horarios con Google (cuando esté activa): cada **6 horas** (`0 */6 * * *`), enviando `{"includeGoogleSync": true}`.
- **Garantías de ejecución:**
  - Reclamo atómico de trabajos con `lockedUntil` (lease temporal) para evitar ejecución duplicada entre instancias y permitir recuperación automática de procesos caídos.
  - Antes de enviar un recordatorio, el worker revalida en la base de datos que la cita siga en estado `confirmed` y que la fecha/hora (`version` / `startAtUtc`) no haya cambiado ni haya quedado en el pasado.

---

## 3. Copias de Seguridad (Backups) y Restauración

### 3.1. Backup de Base de Datos PostgreSQL
- Ejecutar diariamente y antes de cualquier migración:
  ```bash
  pg_dump --format=custom --no-owner --no-privileges "$DATABASE_URL" -f "backup_espacio_q_$(date +%Y%m%d_%H%M).dump"
  ```
- Cifrar el archivo `.dump` antes de transferirlo al almacenamiento de copias de seguridad con retención recomendada de 30 días.

### 3.2. Prueba de Restauración
- Restaurar en una base de datos limpia de verificación:
  ```bash
  pg_restore --clean --if-exists --no-owner -d "$RESTORE_DATABASE_URL" backup_espacio_q_YYYYMMDD_HHMM.dump
  ```
- Verificar la integridad de las restricciones `EXCLUDE USING gist` ejecutando `npm run test`.

---

## 4. Política de Retención y Privacidad (RGPD)

- **Archivos de importación/exportación Excel:** No tienen URL pública; las exportaciones caducan automáticamente tras su ventana de descarga y son purgadas por el worker.
- **Derechos ARSOPOL (Acceso, Rectificación, Supresión, Oposición, Portabilidad y Limitación):**
  - Desde `/admin/clientes`, el administrador puede exportar la ficha completa de un cliente, archivar su perfil o ejecutar la **anonimización irreversible** de sus datos personales conservando únicamente la integridad estadística/histórica de las citas pasadas sin PII.
