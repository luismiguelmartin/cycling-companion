# Spec Fase 0: Núcleo Computacional — `packages/shared/src/metrics/`

**PRD**: `docs/PRD-ADVANCED-METRICS.md`
**Prioridad**: P0 (Crítico)
**Estimación**: ~70 tests nuevos
**Dependencias**: Ninguna — módulos puros sin dependencias externas

---

## Objetivo

Crear el motor de cálculo de métricas ciclistas como módulos puros, sin dependencias de I/O ni BD, 100% testeables. Todos los archivos en `packages/shared/src/metrics/` con imports relativos usando extensión `.js`.

---

## Orden de Implementación

```
1. types.ts           (sin dependencias)
2. haversine.ts       (sin dependencias)
3. sanitize.ts        (depende de types)
4. resample.ts        (depende de types)
5. speed.ts           (depende de types + haversine)
6. movement.ts        (depende de types)
7. power-metrics.ts   (depende de types)
8. elevation.ts       (depende de types)
9. compute-summary.ts (depende de todo lo anterior)
10. index.ts          (barrel export)
```

---

## 0.1 — `types.ts`

### Exports

```typescript
/** Punto interno unificado tras parseo de .fit o .gpx */
export interface TrackPoint {
  timestamp: number;       // epoch ms
  lat: number;
  lon: number;
  elevation: number | null;
  power: number | null;
  hr: number | null;
  cadence: number | null;
  speed?: number;          // calculado por Haversine (km/h)
  isMoving?: boolean;      // calculado por movement detection
}

/** Resumen completo de métricas de una actividad */
export interface ActivitySummary {
  duration_total: number;           // segundos
  duration_moving: number;          // segundos
  distance_km: number;              // km
  avg_speed: number;                // km/h (basado en moving time)
  max_speed: number;                // km/h
  avg_power: number | null;         // W (incluyendo ceros)
  avg_power_non_zero: number | null; // W (excluyendo ceros)
  normalized_power: number | null;  // W (NP)
  variability_index: number | null; // NP / avg_power
  intensity_factor: number | null;  // NP / FTP
  avg_hr: number | null;            // bpm (serie completa)
  avg_hr_moving: number | null;     // bpm (solo en movimiento)
  max_hr: number | null;            // bpm
  avg_cadence_moving: number | null; // rpm (solo en movimiento)
  tss: number | null;               // Training Stress Score
  elevation_gain: number | null;    // metros
  max_power: number | null;         // W
}

/** Umbrales de validación de sensores y movimiento */
export const METRICS_THRESHOLDS = {
  MAX_POWER_WATTS: 2000,
  MAX_HR_BPM: 230,
  MAX_SPEED_KMH: 100,
  MIN_MOVING_SPEED_KMH: 1,
  MIN_MOVING_BLOCK_SECONDS: 3,
  MIN_DURATION_FOR_NP_SECONDS: 600,
  MAX_GAP_INTERPOLATION_SECONDS: 30,
  ELEVATION_SMOOTHING_WINDOW: 5,
} as const;
```

### Tests
- Verificar que `METRICS_THRESHOLDS` exporta valores correctos

---

## 0.2 — `haversine.ts`

### API

```typescript
/**
 * Distancia en metros entre dos puntos GPS (fórmula de Haversine).
 * Precisión: ~0.3% para distancias < 20km.
 */
export function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number;
```

### Implementación
- Radio terrestre: 6,371,000 metros
- `dLat = toRad(lat2 - lat1)`, `dLon = toRad(lon2 - lon1)`
- `a = sin²(dLat/2) + cos(lat1) × cos(lat2) × sin²(dLon/2)`
- `return R × 2 × atan2(√a, √(1-a))`

### Tests (`haversine.test.ts`)

| Test | Input | Expected |
|------|-------|----------|
| Madrid → Barcelona | (40.4168, -3.7038) → (41.3874, 2.1686) | ~504 km ±1% |
| Puntos idénticos | (0, 0) → (0, 0) | 0 |
| Puntos muy cercanos (1m) | Coordenadas a 1m | ~1m ±10% |
| Cruce de meridiano | (0, 179.9) → (0, -179.9) | ~22 km |
| Hemisferios opuestos | (90, 0) → (-90, 0) | ~20,015 km |

---

## 0.3 — `sanitize.ts`

### API

```typescript
/**
 * Limpia valores aberrantes de sensores, reemplazando con null.
 * Devuelve copia — no muta el original.
 */
export function sanitizeTrackPoints(points: TrackPoint[]): TrackPoint[];
```

### Reglas
- `power > 2000` → null
- `power < 0` → null
- `hr > 230` → null
- `hr ≤ 0` → null
- `cadence < 0` → null
- Valores dentro de rango → se mantienen

### Tests (`sanitize.test.ts`)

| Test | Input | Expected |
|------|-------|----------|
| Power 2001 | `{ power: 2001 }` | `{ power: null }` |
| Power 2000 (límite) | `{ power: 2000 }` | `{ power: 2000 }` |
| Power -5 | `{ power: -5 }` | `{ power: null }` |
| HR 231 | `{ hr: 231 }` | `{ hr: null }` |
| HR 0 | `{ hr: 0 }` | `{ hr: null }` |
| HR 230 (límite) | `{ hr: 230 }` | `{ hr: 230 }` |
| Cadence -1 | `{ cadence: -1 }` | `{ cadence: null }` |
| Valores normales | `{ power: 200, hr: 150, cadence: 90 }` | Sin cambio |
| Array vacío | `[]` | `[]` |

---

## 0.4 — `resample.ts`

### API

```typescript
/**
 * Ordena por timestamp y elimina duplicados (mantiene el primero).
 */
export function sortAndDeduplicate(points: TrackPoint[]): TrackPoint[];

/**
 * Resamplea una serie de TrackPoints a intervalos de 1 segundo.
 * - Interpolación lineal: lat, lon, elevation
 * - Forward-fill: power, hr, cadence (mantener último valor conocido)
 * - Gaps ≥ 30s: insertar puntos con power=0, hr=null, cadence=0
 *
 * Prerequisito: points DEBEN estar ordenados por timestamp.
 */
export function resampleTo1Hz(points: TrackPoint[]): TrackPoint[];
```

### Lógica de `resampleTo1Hz`
1. Iterar de `points[0].timestamp` a `points[last].timestamp` en pasos de 1000ms
2. Para cada segundo, encontrar los dos trackpoints que lo rodean (binary search o pointer)
3. Si delta entre trackpoints < 30s: interpolar linealmente lat/lon/elevation, forward-fill sensores
4. Si delta ≥ 30s: insertar punto con `power=0`, `hr=null`, `cadence=0`, `elevation=null`

### Tests (`resample.test.ts`)

| Test | Descripción | Verificación |
|------|-------------|--------------|
| Identidad | Serie ya a 1Hz (t=0,1,2,3) | Output === input (mismos valores) |
| Interpolación | Serie a 2Hz (t=0, 2, 4) → output t=0,1,2,3,4 | lat/lon interpolados al punto medio |
| Gap corto (5s) | t=0, t=5 | Interpolación en t=1,2,3,4 |
| Gap largo (35s) | t=0, t=35 | Puntos t=1..34 con power=0, hr=null |
| Duplicados | t=0, t=0, t=1 | Primer t=0 mantenido, segundo eliminado |
| Desordenado | t=3, t=1, t=2 | Reordenado a t=1, t=2, t=3 |
| Array vacío | `[]` | `[]` |
| Un solo punto | 1 punto | Array de 1 punto |
| Forward-fill | t=0 (power=200), t=3 (power=300) | t=1,2 → power=200 (last known) |

---

## 0.5 — `speed.ts`

### API

```typescript
/**
 * Calcula velocidad para cada TrackPoint usando Haversine entre consecutivos.
 * - Primer punto: speed = 0
 * - Velocidades > 100 km/h → speed = 0 (aberración GPS)
 */
export function computeSpeed(points: TrackPoint[]): TrackPoint[];
```

### Fórmula
```
distance_m = haversineDistance(lat_prev, lon_prev, lat_curr, lon_curr)
delta_t_s = (timestamp_curr - timestamp_prev) / 1000
speed_kmh = (distance_m / delta_t_s) * 3.6
```

### Tests (`speed.test.ts`)

| Test | Descripción |
|------|-------------|
| Velocidad conocida | 2 puntos a 1s de distancia → velocidad correcta en km/h |
| Aberración filtrada | speed calculado > 100 km/h → speed = 0 |
| Punto único | 1 punto → speed = 0 |
| Misma coordenada | lat/lon idénticos → speed = 0 |
| Serie normal | 5 puntos con movimiento gradual → velocidades crecientes |

---

## 0.6 — `movement.ts`

### API

```typescript
/**
 * Marca cada TrackPoint con isMoving.
 * Criterio: speed > 1 km/h OR power > 0 OR cadence > 0
 * Filtro de bloques mínimos de 3 segundos para anti-jitter.
 *
 * Prerequisito: speed ya calculado.
 */
export function detectMovement(points: TrackPoint[]): TrackPoint[];
```

### Algoritmo
1. Primer paso: marcar `isMoving` raw por criterio
2. Segundo paso: bloques de movimiento < 3s → set to false
3. Tercer paso: bloques de parada < 3s → set to true

### Tests (`movement.test.ts`)

| Test | Descripción |
|------|-------------|
| Todo movimiento | speed > 1 en todos → todos true |
| Todo parado | speed=0, power=0, cad=0 → todos false |
| Jitter 2s | 2s de speed>1 entre paradas largas → false (filtrado) |
| Parada corta 2s | 2s de speed=0 entre movimiento → true (filtrado) |
| Transición real | >3s parado → >3s moviendo → respetado |
| Rodillo (indoor) | power>0 sin speed → moving (no hay GPS) |
| Solo cadencia | cadence>0 sin speed ni power → moving |
| Array vacío | `[]` → `[]` |

---

## 0.7 — `power-metrics.ts`

### API

```typescript
/** Potencia media total (incluyendo ceros). Null si no hay datos. */
export function avgPower(points: TrackPoint[]): number | null;

/** Potencia media excluyendo ceros. Null si no hay datos > 0. */
export function avgPowerNonZero(points: TrackPoint[]): number | null;

/** Potencia máxima. Null si no hay datos. */
export function maxPower(points: TrackPoint[]): number | null;

/**
 * Normalized Power (NP) - Algoritmo de Coggan sobre serie 1Hz.
 * 1. Rolling avg 30s sobre potencia (incluyendo ceros)
 * 2. Elevar a 4ª potencia
 * 3. Media
 * 4. Raíz 4ª
 *
 * Retorna null si duración < 10 min.
 * Excluye segmentos con gap ≥ 30s del rolling average.
 */
export function normalizedPower(points: TrackPoint[]): number | null;

/** Variability Index = NP / avg_power. */
export function variabilityIndex(np: number, avgPow: number): number;
```

### Nota sobre `calculateNP` existente
La función `calculateNP` en `training-calculations.ts` se mantiene para retrocompatibilidad (usada por tests existentes y para cálculos sin TrackPoints). Se marca con `@deprecated` apuntando a `normalizedPower` como reemplazo para el pipeline de upload.

### Tests (`power-metrics.test.ts`)

| Test | Descripción |
|------|-------------|
| NP constante | 200W constante × 1200 puntos → NP ≈ 200 |
| NP variable | 100W/300W alternando → NP > 200 (penaliza variabilidad) |
| NP < 10 min | 500 puntos (8.3 min) → null |
| NP con gap 35s | Gap largo → segmento excluido |
| avgPower con ceros | [200, 0, 200, 0] → 100 |
| avgPowerNonZero | [200, 0, 300, 0] → 250 |
| maxPower | [100, 300, 200] → 300 |
| Sin datos power | Todos null → null |
| variabilityIndex | NP=220, avg=200 → 1.10 |

---

## 0.8 — `elevation.ts`

### API

```typescript
/**
 * Desnivel positivo acumulado con suavizado media móvil de 5 puntos.
 * Retorna null si no hay datos de elevación.
 */
export function elevationGain(points: TrackPoint[]): number | null;
```

### Algoritmo
1. Extraer serie de elevación (filtrar nulls)
2. Aplicar media móvil de 5 puntos: `smoothed[i] = mean(elev[i-2]..elev[i+2])`
3. `gain = sum(max(0, smoothed[i] - smoothed[i-1]))`

### Tests (`elevation.test.ts`)

| Test | Descripción |
|------|-------------|
| Serie ascendente | [100, 200, 300, 400, 500] → ~400m (con suavizado) |
| Serie descendente | [500, 400, 300, 200, 100] → 0 |
| Ruido ±1m | Serie plana con ±1m de variación → ≈ 0 (suavizado absorbe) |
| Serie mixta | Subida 200m + bajada 100m + subida 150m → ~350m |
| Sin datos | Todos null → null |
| Menos de 5 puntos | 3 puntos → calcula sin suavizado |

---

## 0.9 — `compute-summary.ts` (Orquestador)

### API

```typescript
/**
 * Pipeline completo: TrackPoint[] → ActivitySummary.
 *
 * 1. sanitizeTrackPoints()
 * 2. sortAndDeduplicate()
 * 3. resampleTo1Hz()
 * 4. computeSpeed()
 * 5. detectMovement()
 * 6. Compute all metrics
 *
 * @param rawPoints - Puntos crudos del parser
 * @param userFtp - FTP del usuario (null si no configurado)
 * @param userMaxHr - Max HR del usuario (para hrTSS fallback, opcional)
 */
export function computeActivitySummary(
  rawPoints: TrackPoint[],
  userFtp: number | null,
  userMaxHr?: number | null,
): ActivitySummary;
```

### Lógica de cálculo post-pipeline
```
duration_total = (last.timestamp - first.timestamp) / 1000
duration_moving = count(points where isMoving)
distance_km = sum(haversine(consecutive moving points)) / 1000
avg_speed = distance_km / (duration_moving / 3600)
max_speed = max(speed where isMoving)

avg_power = mean(power over all points, null→0)
avg_power_non_zero = mean(power where power > 0)
max_power = max(power)
normalized_power = NP algorithm (null if < 10min)

variability_index = NP / avg_power (if both exist)
intensity_factor = NP / FTP (if both exist)
tss = (duration_total × NP²) / (FTP² × 3600) × 100
  OR hrTSS fallback if no power data

avg_hr = mean(hr over all points with hr != null)
avg_hr_moving = mean(hr where isMoving AND hr != null)
max_hr = max(hr)
avg_cadence_moving = mean(cadence where isMoving AND cadence > 0)
elevation_gain = elevationGain(processed points)
```

### Tests (`compute-summary.test.ts`)

| Test | Descripción |
|------|-------------|
| Pipeline completo 30min | Datos sintéticos con movimiento continuo → todas las métricas calculadas |
| Con paradas | 20min moving + 10min parado → duration_moving < duration_total |
| Sin datos de potencia | Solo hr + cadence → power metrics = null, no crashea |
| < 10 minutos | 5 min de datos → NP = null, TSS = null |
| Con elevación | Subida 300m → elevation_gain ≈ 300 |
| Con FTP | FTP = 250 → TSS, IF calculados |
| Sin FTP | FTP = null → TSS = null, IF = null |
| hrTSS fallback | Sin power, con hr + maxHr → TSS calculado via hrTSS |
| Array vacío | `[]` → valores por defecto (0s, 0km, nulls) |
| Indoor (sin GPS) | lat/lon = 0, power > 0 → distance = 0, movement via power |

---

## 0.10 — `index.ts` + actualización de `packages/shared/src/index.ts`

### `packages/shared/src/metrics/index.ts`
```typescript
export type { TrackPoint, ActivitySummary } from "./types.js";
export { METRICS_THRESHOLDS } from "./types.js";
export { haversineDistance } from "./haversine.js";
export { sanitizeTrackPoints } from "./sanitize.js";
export { sortAndDeduplicate, resampleTo1Hz } from "./resample.js";
export { computeSpeed } from "./speed.js";
export { detectMovement } from "./movement.js";
export {
  avgPower, avgPowerNonZero, maxPower, normalizedPower, variabilityIndex,
} from "./power-metrics.js";
export { elevationGain } from "./elevation.js";
export { computeActivitySummary } from "./compute-summary.js";
```

### Cambio en `packages/shared/src/index.ts`
Añadir al final:
```typescript
// Metrics engine v2
export * from "./metrics/index.js";
```

---

## Verificación

```bash
pnpm test --filter=shared     # ~160 tests (90 existentes + ~70 nuevos)
pnpm typecheck --filter=shared # Sin errores
pnpm build --filter=shared     # Build limpio
```
