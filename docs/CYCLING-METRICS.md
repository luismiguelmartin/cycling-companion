# Resumen de Conversación: Motor de Métricas de Ciclismo

## Contexto

Conversación técnica sobre cómo calcular correctamente las métricas de rendimiento ciclista a partir de archivos GPX/FIT, comparando el enfoque de Strava y Garmin Connect y definiendo una especificación para el backend de Cycling Companion.

## Temas Tratados

### 1. TSS (Training Stress Score)
- Fórmula: `TSS = (t × NP × IF) / (FTP × 3600) × 100`
- Donde IF = NP / FTP
- 100 TSS = 1 hora exactamente a FTP
- Requiere FTP configurado por el usuario

### 2. Potencia Normalizada (NP)
- Algoritmo de Coggan: media móvil 30s → elevar a 4ª potencia → media → raíz 4ª
- Penaliza fuertemente los picos de intensidad (no es una media simple)
- Se calcula sobre la serie **completa** (incluyendo ceros), no solo en movimiento

### 3. Procesamiento de archivos GPX
- GPX = XML con trackpoints (lat, lon, elevation, time) + extensions (potencia, FC, cadencia)
- El archivo NO define qué es "movimiento" — eso lo decide la lógica de negocio
- Nunca modificar el archivo original; filtrar solo para cálculos

### 4. Detección de movimiento (enfoque híbrido)
- Movimiento si: `speed > 1 km/h` OR `power > 0` OR `cadence > 0`
- Filtro temporal mínimo: 3 segundos (evitar jitter GPS)
- Similar a lo que hacen Strava/Garmin

### 5. Diferencia Strava vs Garmin
- **Moving time**: Garmin usa sensor de velocidad; Strava recalcula con GPS
- **NP y TSS**: ambos usan serie completa (incluyendo ceros y paradas)
- **Potencia media**: Garmin muestra con y sin ceros; Strava incluye ceros por defecto
- **FC media**: ambos incluyen todo el tiempo (la carga cardiovascular continúa en paradas)
- **Distancia**: Garmin prioriza sensor rueda; Strava recalcula con GPS

### 6. Regla clave de separación
- **Métricas cinemáticas** (velocidad, distancia) → usar tiempo en movimiento
- **Métricas fisiológicas** (NP, TSS, FC) → usar serie completa

---

# Especificación: Motor de Métricas de Ciclismo para Cycling Companion

## Objetivo

Implementar un motor de cálculo de métricas ciclistas en el backend de Cycling Companion que sea:
- Fisiológicamente correcto
- Reproducible (mismo input → mismo output)
- Determinista
- Transparente (reglas explícitas, no implícitas como Strava)

## Estado Actual

Cycling Companion actualmente usa **datos mock** para las métricas. El backend (Fastify 5) tiene endpoints planificados pero no implementa cálculo real desde archivos GPX/FIT.

## Alcance

### Incluido
- Parseo de archivos `.gpx` y `.fit`
- Resampleo a 1 Hz
- Detección de movimiento
- Cálculo de métricas base y de potencia
- Cálculo de TSS
- Persistencia de agregados en Supabase

### Fuera de alcance (futuro)
- Métricas avanzadas (cardiac decoupling, W/kg dinámico, CTL/ATL/TSB)
- Parseo de archivos `.tcx`
- Cálculo de métricas por segmento/zona

---

## Pipeline de Procesamiento

```
Upload .fit/.gpx
      ↓
Parse (fast-xml-parser / fit-file-parser)
      ↓
Extract Trackpoints
      ↓
Sort + Deduplicate by timestamp
      ↓
Resample to 1 Hz (interpolación lineal)
      ↓
Compute speed (Haversine)
      ↓
Detect movement (híbrido: speed + power + cadence)
      ↓
Compute metrics
      ↓
Persist ActivitySummary en Supabase
```

---

## Modelo de Datos

### Input: TrackPoint (interno, tras parseo)

```typescript
type TrackPoint = {
  timestamp: number       // epoch ms
  lat: number
  lon: number
  elevation: number | null
  power: number | null
  hr: number | null
  cadence: number | null
  speed?: number          // calculado
  isMoving?: boolean      // calculado
}
```

### Output: ActivitySummary (persistido)

```typescript
type ActivitySummary = {
  duration_total: number       // segundos
  duration_moving: number      // segundos
  distance: number             // metros
  avg_speed: number            // km/h (basado en moving time)
  avg_power: number            // W (incluyendo ceros)
  avg_power_non_zero: number   // W (excluyendo ceros)
  normalized_power: number     // W (NP)
  variability_index: number    // NP / avg_power
  intensity_factor: number     // NP / FTP
  avg_hr_total: number         // bpm (serie completa)
  avg_hr_moving: number        // bpm (solo en movimiento)
  avg_cadence_moving: number   // rpm (solo en movimiento)
  tss: number                  // Training Stress Score
  max_power: number            // W
  max_hr: number               // bpm
  max_speed: number            // km/h
  elevation_gain: number       // metros
}
```

---

## Reglas de Cálculo

### 1. Normalización

| Paso | Detalle |
|------|---------|
| Ordenar | Por timestamp ascendente |
| Deduplicar | Eliminar timestamps duplicados |
| Resamplear | Interpolación lineal a 1 Hz para potencia, FC, cadencia, elevación |
| GPS | Interpolación lineal para lat/lon (suficiente para intervalos ≤5s) |

### 2. Velocidad

```
speed_i = haversine(point_i, point_i-1) / delta_t
```

- Filtro: descartar si `speed > 100 km/h` (aberración GPS)
- Distancia total: `sum(haversine(p_i, p_i-1))` excluyendo puntos aberrantes

### 3. Detección de movimiento

```
isMoving = (speed > 1 km/h) OR (power > 0) OR (cadence > 0)
```

- Bloque mínimo activo: 3 segundos continuos
- Bloque mínimo parado: 3 segundos continuos
- Esto evita falsos positivos por jitter GPS

### 4. Métricas cinemáticas (basadas en movimiento)

| Métrica | Fórmula |
|---------|---------|
| Tiempo en movimiento | `sum(delta_t where isMoving)` |
| Velocidad media | `distance_total / t_moving` |
| Cadencia media | `mean(cadence where isMoving)` |

### 5. Métricas fisiológicas (serie completa)

| Métrica | Fórmula |
|---------|---------|
| Potencia media | `mean(power)` — incluyendo ceros |
| Potencia media (non-zero) | `mean(power where power > 0)` |
| FC media total | `mean(hr)` — incluyendo paradas |
| FC media moving | `mean(hr where isMoving)` |

### 6. Potencia Normalizada (NP)

```
1. Tomar serie completa de potencia (con ceros)
2. Media móvil 30 segundos:
   P30[i] = mean(power[max(0, i-29) : i+1])
3. Elevar a cuarta potencia:
   P4[i] = P30[i] ^ 4
4. Media de todos los P4:
   mean_P4 = mean(P4)
5. Raíz cuarta:
   NP = mean_P4 ^ 0.25
```

**No excluir paradas**: la carga muscular en parado es 0, lo cual es correcto fisiológicamente.

### 7. TSS

```
IF = NP / FTP
TSS = (t_total × NP × IF) / (FTP × 3600) × 100
```

Forma simplificada equivalente:
```
TSS = (t_total × NP²) / (FTP² × 3600) × 100
```

- `t_total` = duración total con datos válidos de potencia (NO moving time)
- Requiere FTP configurado por el usuario en su perfil

### 8. Desnivel acumulado

```
elevation_gain = sum(max(0, elevation[i] - elevation[i-1]))
```

- Aplicar filtro de suavizado previo (media móvil 5 puntos) para evitar ruido del barómetro/GPS

---

## Edge Cases

| Caso | Acción |
|------|--------|
| Actividad < 10 min | No calcular NP ni TSS |
| Sin datos de potencia | Calcular hrTSS: `(duration × IF_hr) / 3600 × 100` donde `IF_hr = avg_hr / hr_threshold` |
| Gap en datos < 30s | Interpolar |
| Gap en datos ≥ 30s | Excluir segmento del cálculo de NP |
| Potencia > 2000W | Descartar como aberración del sensor |
| FC > 230 bpm | Descartar como aberración del sensor |
| Velocidad > 100 km/h | Descartar punto GPS |

---

## Implementación Sugerida

### Estructura en el monorepo

```
packages/shared/
  src/metrics/
    types.ts           → TrackPoint, ActivitySummary
    haversine.ts        → cálculo de distancia
    resample.ts         → interpolación a 1 Hz
    movement.ts         → detección de movimiento
    power-metrics.ts    → avg_power, NP, VI
    tss.ts              → TSS, IF
    compute-summary.ts  → orquestador principal

apps/api/
  src/services/
    gpx-parser.ts       → parseo GPX a TrackPoint[]
    fit-parser.ts       → parseo FIT a TrackPoint[]
    activity-processor.ts → pipeline completo
```

### Dependencias

| Librería | Uso |
|----------|-----|
| `fast-xml-parser` | Parseo GPX |
| `fit-file-parser` | Parseo FIT (binario) |
| Módulo propio | Haversine, resampleo, NP |

### Performance

- NP es CPU-intensive (media móvil + potencia cuarta sobre miles de puntos)
- Para actividades largas (>4h, >14.000 puntos a 1Hz): considerar Worker Thread
- Persistir `ActivitySummary` en Supabase tras cálculo — no recalcular en cada request

---

## Validación

### Tests unitarios necesarios

| Test | Descripción |
|------|-------------|
| `haversine` | Distancia conocida entre 2 puntos GPS |
| `resample` | Serie irregular → serie uniforme a 1 Hz |
| `movement detection` | Serie con paradas → isMoving correcto |
| `NP - constant power` | 200W constante → NP = 200W |
| `NP - variable power` | 100W/300W alternando → NP > 200W |
| `TSS - 1h at FTP` | 1h exacta a FTP → TSS = 100 |
| `TSS - edge case < 10min` | → null |
| `elevation gain` | Serie conocida → desnivel correcto |

### Datos de referencia

Comparar resultados con Strava/Garmin para un mismo archivo GPX real:
- Tolerancia aceptable: ±2% en NP, ±3% en TSS, ±1% en distancia

---

## Prioridad de Implementación

| Prioridad | Módulo | Motivo |
|-----------|--------|--------|
| P0 | GPX/FIT parser | Sin parseo no hay nada |
| P0 | Resampleo 1 Hz | Prerequisito para NP correcto |
| P0 | Métricas base (tiempo, distancia, velocidad) | Son las más visibles al usuario |
| P1 | NP + TSS | Core de la propuesta de valor (IA usa TSS para recomendaciones) |
| P1 | Detección movimiento | Necesario para velocidad media correcta |
| P2 | hrTSS (sin potencia) | Fallback para usuarios sin potenciómetro |
| P2 | Desnivel acumulado | Complementario |
| P3 | Métricas avanzadas | Cardiac decoupling, W/kg, etc. |
```
