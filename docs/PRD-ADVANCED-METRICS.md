# PRD: Motor de Métricas Avanzadas de Ciclismo v2

## 1. Contexto y Motivación

El motor de métricas actual de Cycling Companion (implementado en Fase 3 del proyecto original) cubre el ~65% de la especificación definida en `docs/CYCLING-METRICS.md`. Parsea archivos .fit/.gpx y extrae datos agregados básicos, pero tiene **3 gaps críticos** que producen métricas imprecisas:

| Gap | Impacto | Detalle |
|-----|---------|---------|
| Sin resampleo a 1 Hz | NP ±5-15% incorrecto | Los datos raw del archivo llegan a frecuencia irregular; el algoritmo de NP asume intervalos uniformes |
| Sin detección de movimiento | Velocidad media y cadencia infladas | Las paradas (semáforos, descansos) se incluyen en los promedios cinemáticos |
| Sin cálculo Haversine | Usuarios sin sensor = sin velocidad | La velocidad depende de extensiones del dispositivo; sin sensor de velocidad, el campo queda vacío |

Además faltan campos clave en la base de datos (`elevation_gain`, `max_power`, `normalized_power`, `duration_moving`, etc.) y el frontend solo muestra 6 métricas básicas.

### Especificación de referencia

`docs/CYCLING-METRICS.md` define el pipeline completo:

```
Upload .fit/.gpx → Parse → Sort + Dedup → Resample 1Hz → Compute speed (Haversine)
→ Detect movement → Compute metrics → Persist ActivitySummary
```

### Regla clave de separación

- **Métricas cinemáticas** (velocidad, distancia, cadencia) → usar tiempo en movimiento
- **Métricas fisiológicas** (NP, TSS, FC media total) → usar serie completa

---

## 2. Objetivos

1. **Mejorar precisión** de métricas existentes (NP, TSS, velocidad media, cadencia)
2. **Añadir métricas faltantes** (duration_moving, elevation_gain, max_power, NP persistido, VI, IF, etc.)
3. **Extras de alto valor y bajo impacto** (distribución en zonas, best efforts, recálculo al cambiar FTP)
4. **Mantener retrocompatibilidad** total con datos existentes

### No-goals

- No se implementa parseo de archivos .tcx
- No se implementan métricas avanzadas de fisiología (cardiac decoupling, W' balance, CTL/ATL por zona)
- No se cambian endpoints de API existentes (solo se añaden campos opcionales)

---

## 3. Estado Actual vs Target

### Campos en BD (`activities`)

| Campo | Actual | Target | Prioridad |
|-------|--------|--------|-----------|
| `duration_seconds` | `INTEGER` | Sin cambio | — |
| `duration_moving` | No existe | `INTEGER NULL` | P0 |
| `distance_km` | `DECIMAL(8,2)` | Sin cambio | — |
| `avg_speed` | No existe | `DECIMAL(6,2) NULL` | P1 |
| `max_speed` | No existe | `DECIMAL(6,2) NULL` | P2 |
| `avg_power_watts` | `INTEGER` | Sin cambio | — |
| `avg_power_non_zero` | No existe | `INTEGER NULL` | P2 |
| `normalized_power` | No existe | `INTEGER NULL` | P0 |
| `max_power` | No existe | `INTEGER NULL` | P2 |
| `variability_index` | No existe | `DECIMAL(4,2) NULL` | P2 |
| `intensity_factor` | No existe | `DECIMAL(4,2) NULL` | P2 |
| `avg_hr_bpm` | `INTEGER` | Sin cambio (serie completa) | — |
| `avg_hr_moving` | No existe | `INTEGER NULL` | P2 |
| `max_hr_bpm` | `INTEGER` | Sin cambio | — |
| `avg_cadence_rpm` | `INTEGER` | Pasa a ser "moving" | P1 |
| `avg_cadence_moving` | No existe | `INTEGER NULL` | P1 |
| `tss` | `INTEGER` | Recalculado con NP real | P0 |
| `elevation_gain` | No existe | `INTEGER NULL` | P2 |

### Campos en BD (`activity_metrics`)

| Campo | Actual | Target |
|-------|--------|--------|
| `lat` | No existe | `DECIMAL(10,7) NULL` |
| `lon` | No existe | `DECIMAL(10,7) NULL` |
| `elevation` | No existe | `DECIMAL(7,2) NULL` |

---

## 4. Modelo de Datos

### TrackPoint (interno, tras parseo)

```typescript
interface TrackPoint {
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
```

### ActivitySummary (output del pipeline)

```typescript
interface ActivitySummary {
  duration_total: number;           // segundos
  duration_moving: number;          // segundos
  distance_km: number;              // km
  avg_speed: number;                // km/h (basado en moving time)
  max_speed: number;                // km/h
  avg_power: number | null;         // W (incluyendo ceros)
  avg_power_non_zero: number | null; // W (excluyendo ceros)
  normalized_power: number | null;  // W (NP, Coggan)
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
```

### Umbrales de validación

```typescript
const METRICS_THRESHOLDS = {
  MAX_POWER_WATTS: 2000,          // Aberración sensor potencia
  MAX_HR_BPM: 230,                // Aberración sensor FC
  MAX_SPEED_KMH: 100,             // Aberración GPS
  MIN_MOVING_SPEED_KMH: 1,       // Umbral movimiento
  MIN_MOVING_BLOCK_SECONDS: 3,    // Anti-jitter GPS
  MIN_DURATION_FOR_NP_SECONDS: 600, // 10 min mínimo para NP/TSS
  MAX_GAP_INTERPOLATION_SECONDS: 30, // Gaps > 30s no se interpolan
  ELEVATION_SMOOTHING_WINDOW: 5,  // Media móvil para suavizar elevación
};
```

---

## 5. Reglas de Cálculo

### 5.1 Sanitización
- Power > 2000W → null
- HR > 230 bpm o ≤ 0 → null
- Cadence < 0 → null
- No mutar original — devolver copia limpia

### 5.2 Resampleo a 1 Hz
1. Ordenar por timestamp, eliminar duplicados
2. Iterar de `t_start` a `t_end` en pasos de 1000ms
3. Interpolar linealmente: lat, lon, elevation
4. Forward-fill: power, hr, cadence (último valor conocido)
5. Gaps ≥ 30s: insertar puntos con power=0, hr=null, cadence=0

### 5.3 Velocidad (Haversine)
```
speed_i = haversine(point_i, point_i-1) / delta_t
```
- Filtro: speed > 100 km/h → speed = 0 (aberración GPS)
- Distancia total: `sum(haversine(p_i, p_i-1))` excluyendo aberraciones

### 5.4 Detección de movimiento
```
isMoving_raw = (speed > 1 km/h) OR (power > 0) OR (cadence > 0)
```
- Bloque mínimo activo: 3 segundos continuos (anti-jitter)
- Bloque mínimo parado: 3 segundos continuos

### 5.5 Métricas cinemáticas (basadas en movimiento)
| Métrica | Fórmula |
|---------|---------|
| Tiempo en movimiento | `count(points where isMoving)` (cada punto = 1s a 1Hz) |
| Velocidad media | `distance_total / t_moving` |
| Velocidad máxima | `max(speed where isMoving)` |
| Cadencia media | `mean(cadence where isMoving AND cadence > 0)` |

### 5.6 Métricas fisiológicas (serie completa)
| Métrica | Fórmula |
|---------|---------|
| Potencia media | `mean(power)` incluyendo ceros |
| Potencia media (non-zero) | `mean(power where power > 0)` |
| Potencia máxima | `max(power)` |
| FC media total | `mean(hr)` incluyendo paradas |
| FC media moving | `mean(hr where isMoving)` |

### 5.7 Potencia Normalizada (NP) — Algoritmo de Coggan
```
1. Serie completa de potencia a 1Hz (con ceros)
2. Media móvil 30 segundos: P30[i] = mean(power[i-29 : i+1])
3. Elevar a 4ª potencia: P4[i] = P30[i]^4
4. Media de todos los P4: mean_P4
5. Raíz cuarta: NP = mean_P4^0.25
```
- No excluir paradas (fisiológicamente correcto)
- Excluir segmentos con gap ≥ 30s del rolling average
- Retornar null si duración < 10 minutos

### 5.8 TSS (Training Stress Score)
```
IF = NP / FTP
TSS = (t_total_seconds × NP²) / (FTP² × 3600) × 100
```
- `t_total` = duración total con datos válidos de potencia
- Requiere FTP configurado en perfil de usuario
- Fallback hrTSS si no hay potencia: `hrTSS = (duration × (avg_hr / LTHR)²) / 3600 × 100` donde `LTHR = max_hr × 0.85`

### 5.9 Desnivel acumulado
```
1. Suavizar elevación con media móvil de 5 puntos
2. elevation_gain = sum(max(0, elev[i] - elev[i-1]))
```

---

## 6. Edge Cases

| Caso | Acción |
|------|--------|
| Actividad < 10 min | No calcular NP ni TSS |
| Sin datos de potencia | Calcular hrTSS si hay FC + max_hr del usuario |
| Gap en datos < 30s | Interpolar |
| Gap en datos ≥ 30s | Excluir del cálculo de NP, insertar puntos vacíos |
| Power > 2000W | Descartar como aberración |
| HR > 230 bpm | Descartar como aberración |
| Speed > 100 km/h | Descartar punto GPS |
| Sin FTP configurado | TSS = null |
| Sin max_hr configurado | hrTSS = null |
| Archivo sin lat/lon (indoor) | distance = 0, speed = 0, usar power/cadence para movement |

---

## 7. Arquitectura de Implementación

### Estructura de archivos

```
packages/shared/src/metrics/
  types.ts              → TrackPoint, ActivitySummary, METRICS_THRESHOLDS
  haversine.ts          → haversineDistance()
  sanitize.ts           → sanitizeTrackPoints()
  resample.ts           → sortAndDeduplicate(), resampleTo1Hz()
  speed.ts              → computeSpeed()
  movement.ts           → detectMovement()
  power-metrics.ts      → avgPower(), avgPowerNonZero(), maxPower(), normalizedPower(), variabilityIndex()
  elevation.ts          → elevationGain()
  compute-summary.ts    → computeActivitySummary() — orquestador
  zone-distribution.ts  → powerZoneDistribution(), hrZoneDistribution() (Fase 3)
  best-efforts.ts       → computeBestEfforts() (Fase 3)
  index.ts              → barrel export

apps/api/src/services/
  import.service.ts     → parsers adaptados para generar TrackPoint[]
  activity.service.ts   → persistencia de ActivitySummary
  recalculate.service.ts → recálculo al cambiar FTP (Fase 3)
```

### Pipeline de procesamiento (compute-summary.ts)

```
rawPoints: TrackPoint[]
    │
    ├─ sanitizeTrackPoints()     → Limpiar aberraciones
    ├─ sortAndDeduplicate()      → Ordenar, deduplicar
    ├─ resampleTo1Hz()           → Interpolar a 1 segundo
    ├─ computeSpeed()            → Haversine entre consecutivos
    ├─ detectMovement()          → Marcar isMoving
    │
    ├─ Calcular métricas cinemáticas (sobre isMoving=true)
    ├─ Calcular métricas fisiológicas (sobre serie completa)
    ├─ Calcular NP + TSS + IF + VI
    ├─ Calcular elevation gain
    │
    └─ return ActivitySummary
```

---

## 8. Fases de Implementación

| Fase | Descripción | Archivos nuevos | Tests nuevos | Prioridad |
|------|-------------|-----------------|--------------|-----------|
| **0** | Núcleo computacional en shared/metrics | 18 (9 módulos + 9 tests) | ~70 | P0 |
| **1** | Migración BD + integración API | 1 SQL + modificar 6 archivos | ~20 | P0/P1 |
| **2** | Frontend métricas ampliadas | Modificar 1-2 archivos | — | P1 |
| **3** | Extras: zonas, best efforts, recálculo FTP | 5 archivos + 3 tests | ~25 | P2 |

Specs detalladas por fase en `docs/specs-advanced-metrics/`.

---

## 9. Compatibilidad

- **Actividades existentes**: campos nuevos = NULL, frontend muestra "—"
- **API**: contrato no rompe (solo añade campos opcionales)
- **Creación manual**: sigue funcionando sin summary (TSS se calcula con avg_power)
- **Recálculo futuro**: con lat/lon en activity_metrics, se puede reprocessar actividades antiguas

---

## 10. Validación y Referencia

### Tests unitarios requeridos por módulo

| Módulo | Tests clave |
|--------|------------|
| haversine | Distancia conocida ±1%, puntos idénticos, meridiano |
| resample | Identidad, interpolación, gaps, dedup |
| movement | Todo moving, todo parado, jitter, rodillo |
| NP | Constante = avg, variable > avg, < 10min, gap |
| TSS | 1h a FTP = 100, sin FTP = null |
| elevation | Ascendente, descendente = 0, ruido suavizado |
| compute-summary | Pipeline completo, con paradas, sin power |

### Datos de referencia

Comparar resultados con Strava/Garmin para los 4 archivos GPX reales en `docs/data/*.gpx`:
- Tolerancia aceptable: ±2% en NP, ±3% en TSS, ±1% en distancia

---

## Documentos Relacionados

| Documento | Ruta |
|-----------|------|
| Especificación técnica de métricas | `docs/CYCLING-METRICS.md` |
| Spec Fase 0: Núcleo computacional | `docs/specs-advanced-metrics/fase-0-nucleo-computacional.md` |
| Spec Fase 1: Migración BD + API | `docs/specs-advanced-metrics/fase-1-migracion-bd-api.md` |
| Spec Fase 2: Frontend | `docs/specs-advanced-metrics/fase-2-frontend.md` |
| Spec Fase 3: Extras | `docs/specs-advanced-metrics/fase-3-extras.md` |
