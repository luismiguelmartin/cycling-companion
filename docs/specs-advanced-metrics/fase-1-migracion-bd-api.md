# Spec Fase 1: Migración BD + Integración API

**PRD**: `docs/PRD-ADVANCED-METRICS.md`
**Prioridad**: P0/P1
**Dependencia**: Fase 0 completada
**Estimación**: ~15-20 tests nuevos/modificados

---

## Objetivo

Ampliar la base de datos con 11 campos nuevos de métricas, actualizar el schema Zod, adaptar los parsers para generar `TrackPoint[]`, e integrar `computeActivitySummary` en el pipeline de upload.

---

## 1.1 — Migración SQL

**Archivo**: `supabase/migrations/006_enhanced_metrics.sql`

### Cambios en `activities`

```sql
ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS duration_moving INTEGER CHECK (duration_moving > 0),
  ADD COLUMN IF NOT EXISTS normalized_power INTEGER CHECK (normalized_power >= 0),
  ADD COLUMN IF NOT EXISTS max_power INTEGER CHECK (max_power >= 0),
  ADD COLUMN IF NOT EXISTS max_speed DECIMAL(6,2) CHECK (max_speed >= 0),
  ADD COLUMN IF NOT EXISTS avg_speed DECIMAL(6,2) CHECK (avg_speed >= 0),
  ADD COLUMN IF NOT EXISTS avg_power_non_zero INTEGER CHECK (avg_power_non_zero >= 0),
  ADD COLUMN IF NOT EXISTS variability_index DECIMAL(4,2),
  ADD COLUMN IF NOT EXISTS intensity_factor DECIMAL(4,2),
  ADD COLUMN IF NOT EXISTS elevation_gain INTEGER CHECK (elevation_gain >= 0),
  ADD COLUMN IF NOT EXISTS avg_hr_moving INTEGER CHECK (avg_hr_moving > 0 AND avg_hr_moving <= 220),
  ADD COLUMN IF NOT EXISTS avg_cadence_moving INTEGER CHECK (avg_cadence_moving >= 0);
```

### Cambios en `activity_metrics`

```sql
ALTER TABLE public.activity_metrics
  ADD COLUMN IF NOT EXISTS lat DECIMAL(10,7),
  ADD COLUMN IF NOT EXISTS lon DECIMAL(10,7),
  ADD COLUMN IF NOT EXISTS elevation DECIMAL(7,2);
```

### Comentarios SQL

```sql
COMMENT ON COLUMN public.activities.duration_moving IS 'Duración en movimiento (segundos), excluye paradas';
COMMENT ON COLUMN public.activities.normalized_power IS 'Potencia Normalizada (W) - algoritmo Coggan';
COMMENT ON COLUMN public.activities.max_power IS 'Potencia máxima (W)';
COMMENT ON COLUMN public.activities.max_speed IS 'Velocidad máxima (km/h)';
COMMENT ON COLUMN public.activities.avg_speed IS 'Velocidad media en movimiento (km/h)';
COMMENT ON COLUMN public.activities.avg_power_non_zero IS 'Potencia media excluyendo ceros (W)';
COMMENT ON COLUMN public.activities.variability_index IS 'VI = NP / avg_power';
COMMENT ON COLUMN public.activities.intensity_factor IS 'IF = NP / FTP';
COMMENT ON COLUMN public.activities.elevation_gain IS 'Desnivel positivo acumulado (metros)';
COMMENT ON COLUMN public.activities.avg_hr_moving IS 'FC media en movimiento (bpm)';
COMMENT ON COLUMN public.activities.avg_cadence_moving IS 'Cadencia media en movimiento (rpm)';
```

### Notas
- Todas las columnas son `NULL` por defecto → actividades existentes no se afectan
- `IF NOT EXISTS` previene errores si la migración se ejecuta parcialmente
- RLS existente aplica automáticamente (la policy es sobre la tabla, no columnas)

---

## 1.2 — Actualizar schema Zod

**Archivo**: `packages/shared/src/schemas/activity.ts`

### Cambios en `activitySchema`

Añadir después de `raw_file_url`:

```typescript
// Métricas avanzadas v2 (nullable para retrocompatibilidad)
duration_moving: z.number().int().positive().nullable(),
normalized_power: z.number().int().nonnegative().nullable(),
max_power: z.number().int().nonnegative().nullable(),
max_speed: z.number().nonnegative().nullable(),
avg_speed: z.number().nonnegative().nullable(),
avg_power_non_zero: z.number().int().nonnegative().nullable(),
variability_index: z.number().nonnegative().nullable(),
intensity_factor: z.number().nonnegative().nullable(),
elevation_gain: z.number().int().nonnegative().nullable(),
avg_hr_moving: z.number().int().positive().max(220).nullable(),
avg_cadence_moving: z.number().int().nonnegative().nullable(),
```

### Cambios en `activityCreateSchema`

Añadir al `.omit()`:

```typescript
.omit({
  // ... existentes ...
  duration_moving: true,
  normalized_power: true,
  max_power: true,
  max_speed: true,
  avg_speed: true,
  avg_power_non_zero: true,
  variability_index: true,
  intensity_factor: true,
  elevation_gain: true,
  avg_hr_moving: true,
  avg_cadence_moving: true,
})
```

Estos campos se calculan automáticamente en el pipeline — nunca los envía el usuario.

---

## 1.3 — Adaptar parsers para generar TrackPoints

**Archivo**: `apps/api/src/services/import.service.ts`

### Cambios en `ParsedActivityData`

Añadir campo:

```typescript
export interface ParsedActivityData {
  // ... campos existentes ...
  trackPoints: TrackPoint[];  // NUEVO — puntos con lat/lon/elevation
}
```

### Cambios en `parseFitBuffer`

Extraer lat/lon/elevation de los records FIT:

```typescript
import { type TrackPoint } from "shared";

// Dentro del loop de records:
const trackPoints: TrackPoint[] = [];
for (const record of records) {
  if (!record.timestamp) continue;
  trackPoints.push({
    timestamp: new Date(record.timestamp).getTime(),
    lat: record.position_lat ?? 0,
    lon: record.position_long ?? 0,
    elevation: record.altitude ?? null,
    power: record.power ?? null,
    hr: record.heart_rate ?? null,
    cadence: record.cadence ?? null,
  });
}

// Añadir al return:
return {
  // ... campos existentes ...
  trackPoints,
};
```

### Cambios en `parseGpxString`

Extraer lat/lon/elevation de los puntos GPX:

```typescript
const trackPoints: TrackPoint[] = [];
for (const point of track.points) {
  const ext = point.extensions;
  const power = ext ? extractFromExtensions(ext, "power", "watts") : null;
  const hr = ext ? extractFromExtensions(ext, "hr", "heartRate", "heart_rate") : null;
  const cadence = ext ? extractFromExtensions(ext, "cad", "cadence") : null;

  trackPoints.push({
    timestamp: point.time ? new Date(point.time).getTime() : 0,
    lat: point.latitude ?? 0,
    lon: point.longitude ?? 0,
    elevation: point.elevation ?? null,
    power,
    hr,
    cadence,
  });
}
```

### Deprecar `computeNP` local

Marcar la función local `computeNP` como `@deprecated`:

```typescript
/**
 * @deprecated Usar computeActivitySummary() de shared/metrics para el pipeline v2.
 * Se mantiene para retrocompatibilidad con actividades sin trackPoints.
 */
function computeNP(metrics: ParsedMetric[]): number | null { ... }
```

---

## 1.4 — Integrar `computeActivitySummary` en `processUpload`

**Archivo**: `apps/api/src/services/import.service.ts`

### Cambios en `processUpload`

```typescript
import { computeActivitySummary, type ActivitySummary } from "shared";

export async function processUpload(
  userId: string,
  fileBuffer: Buffer,
  fileName: string,
  overrides?: { name?: string; type?: ActivityType; rpe?: number; notes?: string },
): Promise<{ activityId: string; metricsCount: number }> {
  // ... parseo existente (sin cambios) ...

  const profile = await getProfile(userId);

  // NUEVO: calcular métricas avanzadas si hay trackPoints
  let summary: ActivitySummary | undefined;
  if (parsed.trackPoints.length > 0) {
    summary = computeActivitySummary(
      parsed.trackPoints,
      profile.ftp ?? null,
      profile.max_hr ?? null,
    );
  }

  const activity = await createActivity(
    userId,
    {
      name: overrides?.name || parsed.name,
      date: parsed.date,
      type: overrides?.type ?? "endurance",
      // Preferir datos del summary si existen
      duration_seconds: summary?.duration_total ?? parsed.durationSeconds,
      distance_km: summary?.distance_km ?? parsed.distanceKm,
      avg_power_watts: summary?.avg_power != null ? Math.round(summary.avg_power) : parsed.avgPowerWatts,
      avg_hr_bpm: summary?.avg_hr != null ? Math.round(summary.avg_hr) : parsed.avgHrBpm,
      max_hr_bpm: summary?.max_hr != null ? Math.round(summary.max_hr) : parsed.maxHrBpm,
      avg_cadence_rpm: parsed.avgCadenceRpm, // Mantener para retrocompatibilidad
      rpe: overrides?.rpe ?? null,
      notes: overrides?.notes ?? null,
    },
    profile.ftp,
    summary?.normalized_power ?? parsed.normalizedPowerWatts,
    summary,  // NUEVO parámetro
  );

  // Insertar métricas con lat/lon/elevation
  if (parsed.metrics.length > 0) {
    const metricsRows = parsed.metrics.map((m, i) => ({
      activity_id: activity.id,
      timestamp_seconds: m.timestampSeconds,
      power_watts: m.powerWatts,
      hr_bpm: m.hrBpm,
      cadence_rpm: m.cadenceRpm,
      speed_kmh: m.speedKmh,
      // NUEVO: lat/lon/elevation del trackpoint correspondiente
      lat: parsed.trackPoints[i]?.lat ?? null,
      lon: parsed.trackPoints[i]?.lon ?? null,
      elevation: parsed.trackPoints[i]?.elevation ?? null,
    }));
    // ... batch insert existente ...
  }

  // ... rest sin cambios ...
}
```

---

## 1.5 — Actualizar `createActivity`

**Archivo**: `apps/api/src/services/activity.service.ts`

### Cambios en firma

```typescript
import { type ActivitySummary } from "shared";

export async function createActivity(
  userId: string,
  data: ActivityCreateInput,
  userFtp?: number | null,
  normalizedPowerWatts?: number | null,
  summary?: ActivitySummary,  // NUEVO
): Promise<Activity> {
```

### Cambios en insert

```typescript
const { data: activity, error } = await supabaseAdmin
  .from("activities")
  .insert({
    ...parsedData,
    user_id: userId,
    tss: summary?.tss ?? tss,  // Preferir TSS del summary
    // Métricas v2 (null si no hay summary)
    duration_moving: summary?.duration_moving ?? null,
    normalized_power: summary?.normalized_power != null
      ? Math.round(summary.normalized_power) : null,
    max_power: summary?.max_power != null
      ? Math.round(summary.max_power) : null,
    max_speed: summary?.max_speed != null
      ? Math.round(summary.max_speed * 100) / 100 : null,
    avg_speed: summary?.avg_speed != null
      ? Math.round(summary.avg_speed * 100) / 100 : null,
    avg_power_non_zero: summary?.avg_power_non_zero != null
      ? Math.round(summary.avg_power_non_zero) : null,
    variability_index: summary?.variability_index != null
      ? Math.round(summary.variability_index * 100) / 100 : null,
    intensity_factor: summary?.intensity_factor != null
      ? Math.round(summary.intensity_factor * 100) / 100 : null,
    elevation_gain: summary?.elevation_gain != null
      ? Math.round(summary.elevation_gain) : null,
    avg_hr_moving: summary?.avg_hr_moving != null
      ? Math.round(summary.avg_hr_moving) : null,
    avg_cadence_moving: summary?.avg_cadence_moving != null
      ? Math.round(summary.avg_cadence_moving) : null,
  })
  .select()
  .single();
```

### Retrocompatibilidad
- Si `summary` es `undefined` (creación manual sin upload) → todos los campos v2 = null
- El cálculo de TSS existente se mantiene como fallback cuando no hay summary

---

## 1.6 — Actualizar tests

### `import.service.test.ts`

Tests nuevos/modificados:

| Test | Descripción |
|------|-------------|
| `parseFitBuffer devuelve trackPoints` | Verificar que `result.trackPoints` es array con lat/lon |
| `parseGpxString devuelve trackPoints` | Verificar lat/lon/elevation desde puntos GPX |
| `processUpload usa computeActivitySummary` | Mock computeActivitySummary, verificar que se llama con trackPoints y FTP |
| `processUpload inserta lat/lon en metrics` | Verificar que batch insert incluye lat, lon, elevation |

### `activity.service.test.ts`

Tests nuevos/modificados:

| Test | Descripción |
|------|-------------|
| `createActivity persiste campos v2` | Pasar summary mock → verificar insert incluye duration_moving, normalized_power, etc. |
| `createActivity sin summary` | No pasar summary → campos v2 = null, TSS se calcula con avg_power |
| `createActivity con TSS de summary` | Summary con tss → se usa en vez del calculado localmente |

---

## Verificación

```bash
# Ejecutar migración en Supabase (SQL Editor o CLI)
# Luego:
pnpm test --filter=api          # ~170 tests (151 existentes + ~20 nuevos)
pnpm test --filter=shared       # ~160 tests (verificar que shared sigue verde)
pnpm typecheck                  # Sin errores en 3 paquetes
pnpm build                      # Build limpio
```

### Checklist manual
- [ ] Migración 006 ejecutada en Supabase
- [ ] Upload de .fit real → nuevos campos poblados en BD
- [ ] Upload de .gpx real → nuevos campos poblados en BD
- [ ] Creación manual de actividad → campos v2 = null (no crashea)
- [ ] Actividades existentes → siguen mostrándose correctamente
