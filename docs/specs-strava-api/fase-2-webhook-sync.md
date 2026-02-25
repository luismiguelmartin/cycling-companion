# Spec Fase 2: Webhook + Sincronización Automática

**PRD**: `docs/PRD-STRAVA-API.md`
**Prioridad**: P0 (Crítico)
**Estimación**: ~25 tests nuevos
**Dependencias**: Fase 0 (infraestructura) + Fase 1 (OAuth)

---

## Objetivo

Implementar la recepción de webhooks de Strava y el pipeline de importación automática de actividades. Cuando un usuario sube una actividad a Strava, esta aparece automáticamente en Cycling Companion.

---

## Orden de Implementación

```
1. Servicio de importación Strava (orquestador)
2. Endpoints webhook (GET validación + POST eventos)
3. Integración en rutas existentes
4. Tests
```

---

## 2.1 — Servicio de Importación: `apps/api/src/services/strava/strava-import.service.ts`

### Exports

```typescript
/**
 * Importa una actividad individual desde Strava.
 * Flujo: fetch detalle → fetch streams → mapear → computar métricas → insertar en BD.
 *
 * @returns activityId si se importó, null si se saltó (no es ciclismo o ya existe)
 */
export async function importStravaActivity(
  userId: string,
  stravaActivityId: number,
  options?: { skipAiAnalysis?: boolean },
): Promise<string | null>;

/**
 * Procesa un evento de webhook de Strava.
 * Verifica que el athlete tenga conexión, refresca tokens, e importa la actividad.
 */
export async function processWebhookEvent(event: StravaWebhookEvent): Promise<void>;

/**
 * Importa múltiples actividades históricas (backfill).
 * Lista actividades de Strava, filtra ciclismo, importa las que no existan.
 *
 * @returns StravaSyncResult con contadores de importadas, saltadas, errores
 */
export async function backfillStravaActivities(
  userId: string,
  options?: { count?: number; after?: number },
): Promise<StravaSyncResult>;
```

### Tipo StravaWebhookEvent

```typescript
interface StravaWebhookEvent {
  object_type: "activity" | "athlete";
  object_id: number;
  aspect_type: "create" | "update" | "delete";
  updates: Record<string, string>;
  owner_id: number; // strava_athlete_id
  subscription_id: number;
  event_time: number; // epoch seconds
}
```

### Flujo detallado: `importStravaActivity`

```
1. Verificar que no exista actividad con strava_id en BD
   → SELECT id FROM activities WHERE strava_id = $1 AND user_id = $2
   → Si existe → retornar null (skip)

2. Obtener access token válido
   → getValidAccessToken(userId) — refresca si necesario

3. Fetch detalle de actividad
   → getStravaActivity(accessToken, stravaActivityId)

4. Verificar que sea ciclismo
   → isStravaCyclingActivity(activity.sport_type)
   → Si no → retornar null (skip)

5. Fetch streams de datos
   → getStravaActivityStreams(accessToken, stravaActivityId)
   → try/catch: si falla (ej: actividad manual sin streams), continuar con streams = null

6. Mapear a nuestro formato
   → mapStravaToActivity(activity, streams)
   → Retorna { activityData, trackPoints, metrics }

7. Obtener perfil del usuario (para FTP, max_hr)
   → getProfile(userId)

8. Computar métricas avanzadas (si hay trackPoints)
   → computeActivitySummary(trackPoints, ftp, max_hr)

9. Crear actividad en BD
   → createActivity(userId, activityData, ftp, NP, summary)
   → La función createActivity ya sabe insertar métricas v2

10. Insertar series temporales (metrics) en activity_metrics
    → Batches de 1000 (mismo patrón que processUpload)
    → MAX_METRICS = 100_000

11. Trigger análisis IA (si !skipAiAnalysis)
    → analyzeActivity(userId, activityId).catch(() => {})

12. Actualizar last_sync_at
    → updateLastSyncAt(userId)

13. Retornar activityId
```

### Flujo detallado: `processWebhookEvent`

```
1. Validar event
   → Si object_type !== "activity" → ignorar
   → Si aspect_type === "delete" → ignorar (no borramos actividades)
   → Si aspect_type === "update" → ignorar (no actualizamos)
   → Solo procesar aspect_type === "create"

2. Buscar conexión por strava_athlete_id
   → getStravaConnectionByAthleteId(event.owner_id)
   → Si no existe → log warning y retornar (atleta no conectado)

3. Importar actividad
   → importStravaActivity(connection.user_id, event.object_id)
   → try/catch: loguear error pero no relanzar (el webhook debe ser idempotente)
```

### Flujo detallado: `backfillStravaActivities`

```
1. Obtener access token válido
   → getValidAccessToken(userId)

2. Listar actividades de Strava
   → listStravaActivities(accessToken, { perPage: count, page: 1 })
   → Si se pide más de BACKFILL_PAGE_SIZE, paginar

3. Filtrar solo ciclismo
   → activities.filter(a => isStravaCyclingActivity(a.sport_type))

4. Para cada actividad (secuencial para respetar rate limits):
   a. Verificar si ya existe (strava_id)
   b. Si no existe → importStravaActivity(userId, id, { skipAiAnalysis: true })
   c. Contar: imported++, skipped++, o errors++

5. Actualizar last_sync_at

6. Retornar StravaSyncResult { imported, skipped, errors }
```

**Nota importante sobre backfill**: `skipAiAnalysis: true` para no saturar la API de Claude ni el rate limit IA propio. El usuario puede trigger el análisis IA individualmente después.

---

## 2.2 — Endpoints Webhook: añadir a `apps/api/src/routes/strava.ts`

### Endpoint: GET `/api/v1/strava/webhook`

**Auth**: NO requiere JWT — Strava envía este request para validar la suscripción

**Query params**:
- `hub.mode` — debe ser `"subscribe"`
- `hub.challenge` — string que debemos devolver
- `hub.verify_token` — debe coincidir con `STRAVA_WEBHOOK_VERIFY_TOKEN`

**Flujo**:
1. Verificar `hub.mode === "subscribe"`
2. Verificar `hub.verify_token === process.env.STRAVA_WEBHOOK_VERIFY_TOKEN`
3. Si OK → retornar `{ "hub.challenge": hub.challenge }` con status 200
4. Si falla → retornar 403

**Response (éxito)**:
```json
{
  "hub.challenge": "abc123def456"
}
```

---

### Endpoint: POST `/api/v1/strava/webhook`

**Auth**: NO requiere JWT — Strava envía eventos

**Body** (JSON):
```json
{
  "object_type": "activity",
  "object_id": 1234567890,
  "aspect_type": "create",
  "updates": {},
  "owner_id": 98765,
  "subscription_id": 12345,
  "event_time": 1709123456
}
```

**Flujo**:
1. **Responder 200 inmediatamente** — Strava requiere respuesta en < 2 segundos
2. En background (fire-and-forget): `processWebhookEvent(body).catch(err => log.error(err))`

**Response**: `200 OK` (body vacío o `"EVENT_RECEIVED"`)

**Nota crítica**: La respuesta debe ser inmediata. Todo el procesamiento es asíncrono. Esto es idéntico al patrón de `analyzeActivity` que ya usamos.

---

### Endpoint: POST `/api/v1/strava/sync`

**Auth**: Requiere JWT

**Body** (JSON, opcional):
```json
{
  "count": 30
}
```

**Flujo**:
1. Verificar que el usuario tiene conexión Strava activa
2. Validar `count` (1-100, default 30)
3. Ejecutar `backfillStravaActivities(userId, { count })`
4. Retornar `StravaSyncResult`

**Response**:
```json
{
  "data": {
    "imported": 12,
    "skipped": 18,
    "errors": 0
  }
}
```

**Errores**:
- 404 "No hay conexión con Strava" si no está conectado
- 400 "count debe estar entre 1 y 100"
- 429 "Rate limit de Strava alcanzado. Intenta más tarde" si Strava devuelve 429

---

## 2.3 — Suscripción al Webhook (Manual / Script)

La suscripción al webhook se crea **una sola vez por aplicación** y es un paso manual:

```bash
curl -X POST https://www.strava.com/api/v3/push_subscriptions \
  -F client_id=STRAVA_CLIENT_ID \
  -F client_secret=STRAVA_CLIENT_SECRET \
  -F callback_url=https://cycling-companion.onrender.com/api/v1/strava/webhook \
  -F verify_token=STRAVA_WEBHOOK_VERIFY_TOKEN
```

**Respuesta esperada**:
```json
{
  "id": 12345,
  "callback_url": "https://cycling-companion.onrender.com/api/v1/strava/webhook",
  "created_at": "2026-02-25T10:00:00Z",
  "updated_at": "2026-02-25T10:00:00Z"
}
```

**Prerequisitos**:
- El endpoint GET `/strava/webhook` debe estar deployed y accesible
- `verify_token` debe coincidir entre la variable de entorno y el curl

**Documentar**: Añadir instrucciones en el README o en un archivo `docs/STRAVA-SETUP.md`.

---

## 2.4 — Manejo de Rate Limits

### Estrategia

El servicio `strava-api.service.ts` (Fase 0) ya maneja 429 lanzando `StravaRateLimitError`. En esta fase añadimos:

1. **Headers tracking**: Leer `X-RateLimit-Usage` en cada respuesta y loguear si usage > 80%
2. **Backoff en backfill**: Si durante backfill recibimos 429:
   - Parar el backfill
   - Retornar resultado parcial con `errors` incrementado
   - No reintentar (el usuario puede volver a intentar después)
3. **Webhook resilience**: Si durante procesamiento de webhook recibimos 429:
   - Loguear warning
   - No reintentar (la actividad se puede importar manualmente después)

### No implementar en esta fase

- No implementar cola de jobs persistente (overkill para el volumen esperado)
- No implementar retry automático con backoff (complejidad innecesaria)
- No implementar tracking de rate limit en BD

---

## 2.5 — Manejo de Actividad Update/Delete desde Strava

### Update (`aspect_type: "update"`)

Strava envía updates cuando el usuario cambia nombre, tipo o privacidad. Para V1:
- **Ignorar completamente**. La actividad importada es un snapshot.
- Si el usuario quiere actualizar, puede editar manualmente en Cycling Companion.

### Delete (`aspect_type: "delete"`)

Strava envía delete cuando el usuario borra la actividad. Para V1:
- **Ignorar completamente**. No borramos datos del usuario sin su consentimiento explícito.
- La actividad permanece en Cycling Companion.

### Deauthorize (`object_type: "athlete"`, `updates.authorized: "false"`)

Strava notifica cuando el usuario revoca el acceso:
1. Buscar conexión por `owner_id`
2. Eliminar conexión: `deleteStravaConnection(userId)`
3. Log: "Strava access revoked by user {athleteId}"
4. Las actividades importadas permanecen.

---

## Tests

### Servicio: importStravaActivity

| Test | Escenario | Expected |
|------|-----------|----------|
| Éxito completo | Actividad ciclismo con streams | Retorna activityId, actividad + metrics en BD |
| Actividad ya existe | strava_id duplicado | Retorna null (skip) |
| No es ciclismo | sport_type: "Run" | Retorna null (skip) |
| Sin streams | Actividad manual en Strava | Importa sin trackPoints ni metrics |
| Con métricas avanzadas | Streams con power + HR + GPS | ActivitySummary calculado correctamente |
| Error en Strava API | 500 de Strava | Throw Error |
| skipAiAnalysis | options.skipAiAnalysis: true | No llama a analyzeActivity |

### Servicio: processWebhookEvent

| Test | Escenario | Expected |
|------|-----------|----------|
| Actividad nueva | create + activity | Llama importStravaActivity |
| Actividad update | update + activity | No hace nada |
| Actividad delete | delete + activity | No hace nada |
| Athlete deauthorize | athlete + update + authorized:false | Elimina conexión |
| Athlete desconocido | owner_id no registrado | Log warning, no error |

### Servicio: backfillStravaActivities

| Test | Escenario | Expected |
|------|-----------|----------|
| Importa 3 de 5 | 5 actividades, 2 ya existen | { imported: 3, skipped: 2, errors: 0 } |
| Filtra no-ciclismo | 3 Ride + 2 Run | { imported: 3, skipped: 2, errors: 0 } |
| Todo ya existe | 5 actividades, todas ya importadas | { imported: 0, skipped: 5, errors: 0 } |
| Rate limit | 429 en la 3ra actividad | Resultado parcial con errors > 0 |
| Sin actividades | Strava retorna [] | { imported: 0, skipped: 0, errors: 0 } |

### Ruta: GET /strava/webhook (validación)

| Test | Escenario | Expected |
|------|-----------|----------|
| Éxito | Params válidos | 200 + hub.challenge |
| verify_token inválido | Token incorrecto | 403 |
| mode inválido | hub.mode !== "subscribe" | 403 |
| Sin params | Query vacía | 403 |

### Ruta: POST /strava/webhook (eventos)

| Test | Escenario | Expected |
|------|-----------|----------|
| Actividad nueva | create event válido | 200 + procesamiento async |
| Evento inválido | Body vacío | 200 (no crashear) |
| object_type desconocido | "workout" | 200 (ignorar) |

### Ruta: POST /strava/sync (backfill)

| Test | Escenario | Expected |
|------|-----------|----------|
| Éxito | count: 10 | 200 + StravaSyncResult |
| Sin conexión | No hay strava_connection | 404 |
| count inválido | count: 500 | 400 |
| Sin auth | No hay JWT | 401 |

---

## Archivos a Crear/Modificar

| # | Archivo | Acción |
|---|---------|--------|
| 1 | `apps/api/src/services/strava/strava-import.service.ts` | Crear |
| 2 | `apps/api/src/routes/strava.ts` | Modificar (añadir webhook + sync endpoints) |
| 3 | `apps/api/src/services/strava/strava-import.service.test.ts` | Crear |
| 4 | `apps/api/src/routes/strava.test.ts` | Modificar (añadir tests de webhook + sync) |
