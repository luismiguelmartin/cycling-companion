# Spec Fase 0: Infraestructura — Migración BD, Schemas Zod, Servicio Strava Base

**PRD**: `docs/PRD-STRAVA-API.md`
**Prioridad**: P0 (Crítico — base para todo lo demás)
**Estimación**: ~30 tests nuevos
**Dependencias**: Ninguna

---

## Objetivo

Crear la infraestructura necesaria para la integración con Strava: tabla en BD, schemas de validación, servicio base para comunicación con la API de Strava, y utilidades de cifrado de tokens.

---

## Orden de Implementación

```
1. Migración SQL (007_strava_connections.sql)
2. Schemas Zod en packages/shared
3. Constantes Strava en packages/shared
4. Utilidad de cifrado de tokens (apps/api)
5. Servicio Strava HTTP client (apps/api)
6. Servicio de conexiones Strava — CRUD BD (apps/api)
7. Tests
```

---

## 0.1 — Migración SQL: `supabase/migrations/007_strava_connections.sql`

### DDL

```sql
-- Tabla de conexiones Strava
CREATE TABLE public.strava_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  strava_athlete_id BIGINT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  scope TEXT NOT NULL DEFAULT 'activity:read_all',
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Constraints de unicidad
ALTER TABLE public.strava_connections
  ADD CONSTRAINT strava_connections_user_id_unique UNIQUE (user_id);
ALTER TABLE public.strava_connections
  ADD CONSTRAINT strava_connections_athlete_id_unique UNIQUE (strava_athlete_id);

-- Índice para búsqueda por strava_athlete_id (webhooks)
CREATE INDEX idx_strava_connections_athlete_id
  ON public.strava_connections (strava_athlete_id);

-- Trigger updated_at
CREATE TRIGGER set_strava_connections_updated_at
  BEFORE UPDATE ON public.strava_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE public.strava_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own strava connection"
  ON public.strava_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own strava connection"
  ON public.strava_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own strava connection"
  ON public.strava_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own strava connection"
  ON public.strava_connections FOR DELETE
  USING (auth.uid() = user_id);

-- Añadir campos a activities para tracking de origen
ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS strava_id BIGINT,
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual';

-- Constraint de unicidad parcial (solo para actividades con strava_id)
CREATE UNIQUE INDEX idx_activities_strava_id
  ON public.activities (strava_id)
  WHERE strava_id IS NOT NULL;

-- Check constraint para source
ALTER TABLE public.activities
  ADD CONSTRAINT activities_source_check
  CHECK (source IN ('manual', 'upload', 'strava'));
```

### Notas

- `update_updated_at_column()` ya existe (creada en migración 001)
- Los tokens se guardan cifrados desde la capa de aplicación (no en SQL)
- `source` default `'manual'` mantiene retrocompatibilidad con actividades existentes
- El índice parcial en `strava_id` permite NULL (actividades sin Strava) pero evita duplicados cuando hay valor

---

## 0.2 — Schema Zod: `packages/shared/src/schemas/strava.ts`

### Exports

```typescript
import { z } from "zod";

/** Estado de la conexión Strava (respuesta al frontend) */
export const stravaConnectionStatusSchema = z.object({
  connected: z.boolean(),
  athlete_name: z.string().nullable(),
  strava_athlete_id: z.number().nullable(),
  connected_at: z.string().datetime().nullable(),
  last_sync_at: z.string().datetime().nullable(),
  activities_count: z.number().int().nonnegative(),
});

export type StravaConnectionStatus = z.infer<typeof stravaConnectionStatusSchema>;

/** Resultado de sincronización / backfill */
export const stravaSyncResultSchema = z.object({
  imported: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
  errors: z.number().int().nonnegative(),
});

export type StravaSyncResult = z.infer<typeof stravaSyncResultSchema>;

/** Origen de la actividad */
export const activitySourceEnum = z.enum(["manual", "upload", "strava"]);
export type ActivitySource = z.infer<typeof activitySourceEnum>;
```

### Modificación: `packages/shared/src/schemas/activity.ts`

Añadir campos al `activitySchema`:

```typescript
// Añadir después de raw_file_url
strava_id: z.number().int().positive().nullable(),
source: activitySourceEnum.default("manual"),
```

Y al `activityCreateSchema.omit()`:

```typescript
strava_id: true,
source: true,
```

### Barrel export: `packages/shared/src/index.ts`

Añadir:

```typescript
export * from "./schemas/strava.js";
```

**Nota**: extensión `.js` obligatoria (Node ESM).

---

## 0.3 — Constantes Strava: `packages/shared/src/constants/strava.ts`

### Exports

```typescript
/** Mapeo de sport_type de Strava a nuestro activity_type */
export const STRAVA_SPORT_TYPE_MAP: Record<string, string> = {
  Ride: "endurance",
  MountainBikeRide: "endurance",
  GravelRide: "endurance",
  EBikeRide: "endurance",
  EMountainBikeRide: "endurance",
  VirtualRide: "endurance",
  Velodrome: "intervals",
  Handcycle: "endurance",
} as const;

/** sport_types de Strava que son ciclismo (filtrar otros deportes) */
export const STRAVA_CYCLING_SPORT_TYPES = Object.keys(STRAVA_SPORT_TYPE_MAP);

/** Streams de datos a solicitar a Strava */
export const STRAVA_STREAM_KEYS = [
  "time",
  "latlng",
  "distance",
  "altitude",
  "heartrate",
  "cadence",
  "watts",
  "velocity_smooth",
] as const;

/** Configuración de la API de Strava */
export const STRAVA_CONFIG = {
  BASE_URL: "https://www.strava.com",
  API_URL: "https://www.strava.com/api/v3",
  OAUTH_AUTHORIZE: "https://www.strava.com/oauth/authorize",
  OAUTH_TOKEN: "https://www.strava.com/oauth/token",
  OAUTH_DEAUTHORIZE: "https://www.strava.com/oauth/deauthorize",
  DEFAULT_SCOPE: "activity:read_all",
  TOKEN_EXPIRY_BUFFER_SECONDS: 300, // refrescar 5 min antes de expirar
  BACKFILL_DEFAULT_COUNT: 30,
  BACKFILL_MAX_COUNT: 100,
  BACKFILL_PAGE_SIZE: 30,
  RATE_LIMIT_15MIN: 200,
  RATE_LIMIT_DAILY: 2000,
} as const;
```

### Barrel export: `packages/shared/src/index.ts`

Añadir:

```typescript
export * from "./constants/strava.js";
```

---

## 0.4 — Utilidad de Cifrado: `apps/api/src/utils/crypto.ts`

### Exports

```typescript
/**
 * Cifra un string con AES-256-GCM.
 * @param plaintext - El texto a cifrar
 * @returns string cifrado en formato "iv:authTag:ciphertext" (hex)
 */
export function encrypt(plaintext: string): string;

/**
 * Descifra un string cifrado con AES-256-GCM.
 * @param encrypted - El texto cifrado en formato "iv:authTag:ciphertext"
 * @returns El texto original
 */
export function decrypt(encrypted: string): string;
```

### Implementación

- Usa `crypto` de Node.js (sin dependencias externas)
- Clave de cifrado: `process.env.STRAVA_TOKEN_ENCRYPTION_KEY` (32 bytes, base64)
- Algoritmo: `aes-256-gcm`
- IV: 12 bytes random por operación
- Auth tag: 16 bytes
- Formato de salida: `${iv_hex}:${authTag_hex}:${ciphertext_hex}`

### Validación

- Si `STRAVA_TOKEN_ENCRYPTION_KEY` no está configurada, lanzar error al arrancar el servidor
- La clave debe decodificarse de base64 a un Buffer de exactamente 32 bytes

### Tests

| Test | Input | Expected |
|------|-------|----------|
| Cifra y descifra correctamente | `"my-secret-token"` | Descifrado === input |
| Cifrados distintos para mismo input | `"same-text"` dos veces | Ciphertexts diferentes (IV random) |
| Falla con clave inválida | Clave modificada | Throw Error |
| Falla con ciphertext corrupto | Texto modificado | Throw Error |

---

## 0.5 — Servicio Strava HTTP: `apps/api/src/services/strava/strava-api.service.ts`

### Exports

```typescript
/** Intercambia auth code por tokens OAuth */
export async function exchangeAuthCode(code: string): Promise<StravaTokenResponse>;

/** Refresca un access token expirado */
export async function refreshAccessToken(refreshToken: string): Promise<StravaTokenResponse>;

/** Revoca el acceso (deauthorize) */
export async function deauthorizeAthlete(accessToken: string): Promise<void>;

/** Obtiene el detalle completo de una actividad */
export async function getStravaActivity(
  accessToken: string,
  activityId: number,
): Promise<StravaDetailedActivity>;

/** Obtiene los streams de datos de una actividad */
export async function getStravaActivityStreams(
  accessToken: string,
  activityId: number,
): Promise<StravaStreams>;

/** Lista actividades del atleta (para backfill) */
export async function listStravaActivities(
  accessToken: string,
  options: { after?: number; before?: number; page?: number; perPage?: number },
): Promise<StravaSummaryActivity[]>;

/** Obtiene el perfil del atleta */
export async function getStravaAthlete(accessToken: string): Promise<StravaAthlete>;
```

### Tipos internos (no exportados a shared — solo backend)

```typescript
interface StravaTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number; // epoch seconds
  expires_in: number;
  athlete: {
    id: number;
    firstname: string;
    lastname: string;
  };
}

interface StravaDetailedActivity {
  id: number;
  name: string;
  sport_type: string;
  type: string;
  distance: number; // metros
  moving_time: number; // segundos
  elapsed_time: number;
  total_elevation_gain: number;
  start_date: string; // ISO
  start_date_local: string; // ISO
  average_speed: number; // m/s
  max_speed: number; // m/s
  average_heartrate?: number;
  max_heartrate?: number;
  average_watts?: number;
  weighted_average_watts?: number;
  max_watts?: number;
  average_cadence?: number;
  kilojoules?: number;
  has_heartrate: boolean;
  device_watts: boolean;
  trainer: boolean;
  device_name?: string;
}

interface StravaStreams {
  time?: { data: number[] };
  latlng?: { data: [number, number][] };
  altitude?: { data: number[] };
  heartrate?: { data: number[] };
  cadence?: { data: number[] };
  watts?: { data: number[] };
  velocity_smooth?: { data: number[] };
  distance?: { data: number[] };
}

interface StravaSummaryActivity {
  id: number;
  name: string;
  sport_type: string;
  type: string;
  distance: number;
  moving_time: number;
  start_date_local: string;
  average_heartrate?: number;
  max_heartrate?: number;
  average_watts?: number;
  has_heartrate: boolean;
}

interface StravaAthlete {
  id: number;
  firstname: string;
  lastname: string;
}
```

### Implementación

- Usar `fetch` nativo (no axios/got — consistencia con el proyecto)
- Timeout: 15 segundos por llamada (AbortSignal.timeout)
- Headers: `Authorization: Bearer {accessToken}`, `Accept: application/json`
- Error handling: si Strava devuelve 401 → token expirado (propagar para refresh)
- Si 429 → rate limited (leer headers `X-RateLimit-Usage`, lanzar error específico)
- Variables de entorno: `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`

### Tests (mocks de fetch)

| Test | Escenario | Expected |
|------|-----------|----------|
| exchangeAuthCode éxito | Mock 200 con tokens | Retorna StravaTokenResponse |
| exchangeAuthCode fallo | Mock 400 | Throw Error con mensaje |
| refreshAccessToken éxito | Mock 200 con tokens nuevos | Retorna StravaTokenResponse |
| getStravaActivity éxito | Mock 200 con actividad | Retorna StravaDetailedActivity |
| getStravaActivity 404 | Mock 404 | Throw Error "Activity not found" |
| getStravaActivityStreams éxito | Mock 200 con streams | Retorna StravaStreams |
| listStravaActivities éxito | Mock 200 con array | Retorna StravaSummaryActivity[] |
| listStravaActivities vacío | Mock 200 con [] | Retorna [] |
| Rate limit 429 | Mock 429 | Throw StravaRateLimitError |
| Token expirado 401 | Mock 401 | Throw StravaAuthError |
| Timeout | fetch que no responde | Throw Error (timeout) |

---

## 0.6 — Servicio de Conexiones: `apps/api/src/services/strava/strava-connection.service.ts`

### Exports

```typescript
/** Guarda o actualiza una conexión Strava (cifra tokens antes de guardar) */
export async function saveStravaConnection(
  userId: string,
  tokens: StravaTokenResponse,
): Promise<void>;

/** Obtiene la conexión Strava de un usuario (descifra tokens) */
export async function getStravaConnection(
  userId: string,
): Promise<DecryptedStravaConnection | null>;

/** Obtiene la conexión por strava_athlete_id (para webhooks) */
export async function getStravaConnectionByAthleteId(
  athleteId: number,
): Promise<DecryptedStravaConnection | null>;

/** Elimina la conexión Strava de un usuario */
export async function deleteStravaConnection(userId: string): Promise<void>;

/** Actualiza los tokens (tras refresh) */
export async function updateStravaTokens(
  userId: string,
  accessToken: string,
  refreshToken: string,
  expiresAt: Date,
): Promise<void>;

/** Actualiza last_sync_at */
export async function updateLastSyncAt(userId: string): Promise<void>;

/** Obtiene un access token válido (refresca si necesario) */
export async function getValidAccessToken(userId: string): Promise<string>;
```

### Tipo DecryptedStravaConnection

```typescript
interface DecryptedStravaConnection {
  id: string;
  user_id: string;
  strava_athlete_id: number;
  access_token: string; // ya descifrado
  refresh_token: string; // ya descifrado
  token_expires_at: Date;
  scope: string;
  connected_at: Date;
  last_sync_at: Date | null;
}
```

### Lógica clave: `getValidAccessToken`

```
1. Obtener conexión del usuario
2. Si token_expires_at > now + BUFFER → retornar access_token
3. Si no → llamar refreshAccessToken(refresh_token)
4. Actualizar tokens en BD
5. Retornar nuevo access_token
```

### Tests

| Test | Escenario | Expected |
|------|-----------|----------|
| saveStravaConnection éxito | Datos válidos | INSERT en BD con tokens cifrados |
| saveStravaConnection upsert | Conexión ya existe | UPDATE (no error) |
| getStravaConnection éxito | Conexión existe | Retorna con tokens descifrados |
| getStravaConnection null | No existe | Retorna null |
| getStravaConnectionByAthleteId | Athlete ID existe | Retorna conexión correcta |
| deleteStravaConnection | Conexión existe | DELETE exitoso |
| getValidAccessToken fresco | Token válido 5h | Retorna sin refrescar |
| getValidAccessToken expirado | Token expira en 1min | Refresca y retorna nuevo |
| getValidAccessToken sin conexión | No hay conexión | Throw Error |

---

## 0.7 — Servicio Mapper: `apps/api/src/services/strava/strava-mapper.service.ts`

### Exports

```typescript
/** Mapea datos de Strava (actividad + streams) a nuestro formato de importación */
export function mapStravaToActivity(
  stravaActivity: StravaDetailedActivity,
  streams: StravaStreams | null,
): { activityData: MappedActivityData; trackPoints: TrackPoint[]; metrics: ParsedMetric[] };

/** Verifica si un sport_type de Strava es ciclismo */
export function isStravaCyclingActivity(sportType: string): boolean;
```

### Tipo MappedActivityData

```typescript
interface MappedActivityData {
  name: string;
  date: string; // YYYY-MM-DD
  type: ActivityType; // nuestro enum
  duration_seconds: number;
  distance_km: number | null;
  avg_power_watts: number | null;
  avg_hr_bpm: number | null;
  max_hr_bpm: number | null;
  avg_cadence_rpm: number | null;
  strava_id: number;
  source: "strava";
}
```

### Lógica de mapeo

**Actividad:**
- `name` → directo
- `date` → extraer `YYYY-MM-DD` de `start_date_local`
- `type` → buscar `sport_type` en `STRAVA_SPORT_TYPE_MAP`, default `"endurance"`
- `duration_seconds` → `moving_time`
- `distance_km` → `distance / 1000` (Strava envía metros)
- `avg_power_watts` → redondear `average_watts`
- `avg_hr_bpm` → redondear `average_heartrate`
- `max_hr_bpm` → redondear `max_heartrate`
- `avg_cadence_rpm` → redondear `average_cadence`
- `strava_id` → `id`

**Streams → TrackPoint[]:**
- Iterar por índice sobre `time.data`
- Para cada índice `i`:
  - `timestamp` → `startTimeEpoch + time.data[i] * 1000` (convertir a epoch ms)
  - `lat` → `latlng.data[i][0]` o `0` si no hay GPS
  - `lon` → `latlng.data[i][1]` o `0` si no hay GPS
  - `elevation` → `altitude.data[i]` o `null`
  - `power` → `watts.data[i]` o `null`
  - `hr` → `heartrate.data[i]` o `null`
  - `cadence` → `cadence.data[i]` o `null`

**Streams → ParsedMetric[]:**
- Para cada índice `i`:
  - `timestampSeconds` → `time.data[i]`
  - `powerWatts` → `watts.data[i]` o `null`
  - `hrBpm` → `heartrate.data[i]` o `null`
  - `cadenceRpm` → `cadence.data[i]` o `null`
  - `speedKmh` → `velocity_smooth.data[i] * 3.6` o `null` (m/s → km/h)

### Tests

| Test | Input | Expected |
|------|-------|----------|
| Mapea actividad completa | Actividad con todos los campos | Todos los campos mapeados correctamente |
| Mapea actividad sin potencia | `average_watts` undefined | `avg_power_watts: null` |
| Mapea actividad sin HR | `has_heartrate: false` | `avg_hr_bpm: null`, `max_hr_bpm: null` |
| Convierte distancia correctamente | `distance: 45230.5` | `distance_km: 45.23` |
| Convierte velocidad m/s a km/h | `velocity_smooth: 8.33` | `speedKmh: 29.99` |
| Mapea sport_type Ride | `sport_type: "Ride"` | `type: "endurance"` |
| Mapea sport_type VirtualRide | `sport_type: "VirtualRide"` | `type: "endurance"` |
| Mapea sport_type Velodrome | `sport_type: "Velodrome"` | `type: "intervals"` |
| sport_type desconocido | `sport_type: "Run"` | `isStravaCyclingActivity → false` |
| Streams completos → TrackPoints | Streams con todos los keys | Array de TrackPoints con todos los campos |
| Streams sin GPS | Solo time + watts | TrackPoints con lat=0, lon=0 |
| Streams vacíos | `{}` o `null` | trackPoints: [], metrics: [] |
| Extrae fecha de start_date_local | `"2026-02-25T09:00:00+01:00"` | `date: "2026-02-25"` |

---

## Archivos a Crear/Modificar

| # | Archivo | Acción |
|---|---------|--------|
| 1 | `supabase/migrations/007_strava_connections.sql` | Crear |
| 2 | `packages/shared/src/schemas/strava.ts` | Crear |
| 3 | `packages/shared/src/schemas/activity.ts` | Modificar (añadir strava_id, source) |
| 4 | `packages/shared/src/constants/strava.ts` | Crear |
| 5 | `packages/shared/src/index.ts` | Modificar (barrel exports) |
| 6 | `apps/api/src/utils/crypto.ts` | Crear |
| 7 | `apps/api/src/services/strava/strava-api.service.ts` | Crear |
| 8 | `apps/api/src/services/strava/strava-connection.service.ts` | Crear |
| 9 | `apps/api/src/services/strava/strava-mapper.service.ts` | Crear |
| 10 | `apps/api/src/services/strava/index.ts` | Crear (barrel export) |
| 11 | `apps/api/src/utils/crypto.test.ts` | Crear |
| 12 | `apps/api/src/services/strava/strava-api.service.test.ts` | Crear |
| 13 | `apps/api/src/services/strava/strava-connection.service.test.ts` | Crear |
| 14 | `apps/api/src/services/strava/strava-mapper.service.test.ts` | Crear |
