# Spec Fase 3: Extras — Alto Valor, Bajo Impacto

**PRD**: `docs/PRD-ADVANCED-METRICS.md`
**Prioridad**: P2
**Dependencia**: Fases 0 y 1 completadas
**Estimación**: ~25 tests nuevos

---

## Objetivo

Implementar funcionalidades complementarias de alto valor para el usuario pero bajo impacto en la arquitectura existente: distribución de tiempo en zonas, best efforts de potencia, recálculo al cambiar FTP, y hrTSS como fallback.

---

## 3.1 — Distribución de Tiempo en Zonas

### Concepto
Calcular cuánto tiempo ha pasado el ciclista en cada zona de potencia y/o FC durante una actividad. Visualización estándar en apps de ciclismo (Strava, Garmin Connect, TrainingPeaks).

### Backend — `packages/shared/src/metrics/zone-distribution.ts`

```typescript
import type { TrackPoint } from "./types.js";
import type { ZoneDefinition } from "../constants/zones.js";

export interface ZoneTimeDistribution {
  zone: string;        // "Z1", "Z2", etc.
  name: string;        // "Recuperación", "Resistencia", etc.
  seconds: number;     // tiempo en esta zona
  percentage: number;  // 0-100
  color: string;       // color de la zona
}

/**
 * Distribución de tiempo en zonas de potencia.
 * Requiere serie resampleada a 1Hz (cada punto = 1 segundo).
 * Usa % del FTP como referencia.
 */
export function powerZoneDistribution(
  points: TrackPoint[],
  ftp: number,
  zones: readonly ZoneDefinition[],
): ZoneTimeDistribution[];

/**
 * Distribución de tiempo en zonas de FC.
 * Usa % de max_hr como referencia.
 */
export function hrZoneDistribution(
  points: TrackPoint[],
  maxHr: number,
  zones: readonly ZoneDefinition[],
): ZoneTimeDistribution[];
```

### Lógica
1. Para cada punto con valor (power o hr), calcular ratio vs referencia (ftp o maxHr)
2. Clasificar en zona según `minPct` / `maxPct`
3. Contar segundos por zona
4. Calcular porcentaje sobre total de puntos con valor

### Reutilización
- `POWER_ZONES` y `HR_ZONES` ya existen en `packages/shared/src/constants/zones.ts`
- El tipo `ZoneDefinition` ya está exportado

### Tests (`zone-distribution.test.ts`)

| Test | Input | Expected |
|------|-------|----------|
| 100% en Z2 | 600 puntos a 175W, FTP 250 (0.70) | Z2 = 100%, resto = 0% |
| Distribución mixta | 300pts@125W + 300pts@275W, FTP 250 | Z1~50%, Z5~50% |
| Sin datos power | Todos null | Array vacío |
| FC zones | 600pts@130bpm, maxHr 190 (0.68) | Z2 = 100% |
| Sin FTP | ftp = 0 | Array vacío (guard clause) |

### Frontend — Componente `ZoneDistributionChart`

**Archivo**: `apps/web/src/components/charts/zone-distribution-chart.tsx`

Barras horizontales apiladas con colores de zona. Muestra:
- Nombre de zona + porcentaje
- Barra de progreso coloreada
- Tiempo en cada zona (h:mm:ss)

Se integra en la página de detalle de actividad, debajo de `ActivityChart`:

```tsx
{hasAdvancedMetrics && zoneData.length > 0 && (
  <ZoneDistributionChart data={zoneData} title="Zonas de potencia" />
)}
```

**Nota**: Los datos de zona se calculan en el frontend a partir de `activity_metrics` (serie temporal) + FTP del usuario. No se persisten en BD — son derivados.

---

## 3.2 — Best Efforts (Potencia Máxima por Ventana)

### Concepto
Calcular la máxima potencia sostenida en ventanas estándar: 5s, 20s, 1min, 5min, 20min. Estándar de la industria (TrainingPeaks, Intervals.icu).

### Backend — `packages/shared/src/metrics/best-efforts.ts`

```typescript
import type { TrackPoint } from "./types.js";

export interface BestEffort {
  windowSeconds: number;  // 5, 20, 60, 300, 1200
  label: string;          // "5s", "20s", "1 min", "5 min", "20 min"
  power: number;          // W — máxima potencia sostenida en esa ventana
}

const EFFORT_WINDOWS = [
  { seconds: 5, label: "5s" },
  { seconds: 20, label: "20s" },
  { seconds: 60, label: "1 min" },
  { seconds: 300, label: "5 min" },
  { seconds: 1200, label: "20 min" },
] as const;

/**
 * Calcula la máxima potencia sostenida en ventanas estándar.
 * Requiere serie 1Hz de potencia.
 * Usa sliding window con suma acumulada — O(n) por ventana.
 * Ventanas más largas que la actividad se omiten.
 */
export function computeBestEfforts(points: TrackPoint[]): BestEffort[];
```

### Algoritmo (por ventana)
```
prefixSum[0] = 0
prefixSum[i] = prefixSum[i-1] + power[i] (null → 0)
maxAvg = 0
for i in [windowSize..n]:
  avg = (prefixSum[i] - prefixSum[i - windowSize]) / windowSize
  maxAvg = max(maxAvg, avg)
return round(maxAvg)
```

### Tests (`best-efforts.test.ts`)

| Test | Input | Expected |
|------|-------|----------|
| Potencia constante | 200W × 1200pts | Todos = 200W |
| Pico 5s | 5s a 500W en medio de 200W | 5s = 500, 20s < 500 |
| Serie corta (30s) | 30 puntos | Solo 5s y 20s (60s/5min/20min omitidos) |
| Sin potencia | Todos null | Array vacío |
| Pico largo | 300s a 400W → 900s a 150W | 5min = 400, 20min < 400 |

### Frontend

Best efforts se pueden mostrar como tabla compacta en el detalle de actividad:

```
5s    │  650 W
20s   │  420 W
1 min │  350 W
5 min │  280 W
20 min│  240 W
```

Se calcula en frontend a partir de `activity_metrics`. No se persiste en BD.

---

## 3.3 — hrTSS (Fallback sin Potenciómetro)

### Concepto
Muchos ciclistas amateur (40+, target de esta app) NO tienen potenciómetro. Para ellos, calcular una estimación de TSS basada en frecuencia cardíaca.

### Implementación

Ya incluido en `computeActivitySummary` (Fase 0), pero documentado aquí como feature:

```
LTHR = max_hr × 0.85  (Lactate Threshold HR, estimación estándar)
IF_hr = avg_hr / LTHR
hrTSS = (duration_seconds × IF_hr²) / 3600 × 100
```

### Condiciones
- Solo se calcula si: no hay datos de potencia AND hay datos de HR AND el usuario tiene `max_hr` configurado
- Se persiste en el campo `tss` de la actividad (el frontend no distingue entre TSS y hrTSS)

### Precisión
- hrTSS es menos preciso que TSS basado en potencia (~±15%)
- Pero es significativamente mejor que no tener TSS en absoluto
- Standard en la industria (TrainingPeaks lo hace igual)

---

## 3.4 — Recálculo de Métricas al Cambiar FTP

### Concepto
Cuando el usuario actualiza su FTP en el perfil, las métricas derivadas (TSS, IF, VI) de TODAS sus actividades con `normalized_power` deben recalcularse con el nuevo FTP.

### Backend — `apps/api/src/services/recalculate.service.ts`

```typescript
import { supabaseAdmin } from "./supabase.js";

/**
 * Recalcula TSS, IF y VI para todas las actividades de un usuario
 * que tengan normalized_power guardado.
 * Fire-and-forget: no bloquea la respuesta del PATCH /profile.
 *
 * @returns Número de actividades actualizadas
 */
export async function recalculateMetricsForUser(
  userId: string,
  newFtp: number,
): Promise<number> {
  // 1. Fetch actividades con NP
  const { data: activities } = await supabaseAdmin
    .from("activities")
    .select("id, normalized_power, avg_power_watts, duration_seconds")
    .eq("user_id", userId)
    .not("normalized_power", "is", null);

  if (!activities || activities.length === 0) return 0;

  let updated = 0;
  for (const act of activities) {
    const np = act.normalized_power;
    const avgPow = act.avg_power_watts;
    const durationHours = act.duration_seconds / 3600;

    const intensityFactor = np / newFtp;
    const tss = Math.round(intensityFactor * intensityFactor * durationHours * 100);
    const vi = avgPow ? Math.round((np / avgPow) * 100) / 100 : null;

    await supabaseAdmin
      .from("activities")
      .update({
        tss,
        intensity_factor: Math.round(intensityFactor * 100) / 100,
        variability_index: vi,
      })
      .eq("id", act.id);

    updated++;
  }

  return updated;
}
```

### Integración en PATCH /profile

**Archivo**: `apps/api/src/routes/profile.ts`

Tras actualizar el perfil, si FTP cambió:

```typescript
// Después del update exitoso:
if (updatedProfile.ftp && updatedProfile.ftp !== previousFtp) {
  recalculateMetricsForUser(userId, updatedProfile.ftp).catch(() => {
    /* silenciar — fire-and-forget */
  });
}
```

### Tests

| Test | Descripción |
|------|-------------|
| Recálculo básico | 3 actividades con NP → TSS/IF actualizados |
| Sin actividades con NP | 0 actividades → retorna 0 |
| FTP nuevo correcto | NP=200, FTP=250 → IF=0.80, TSS correcto |

---

## 3.5 — Efficiency Factor (NP / avg_hr)

### Concepto
El Efficiency Factor mide cuánta potencia produces por latido. A mayor EF, mejor eficiencia aeróbica. Útil para tracking de fitness a largo plazo.

### Implementación

**Solo frontend** — cálculo trivial:

```typescript
const ef = activity.normalized_power != null && activity.avg_hr_bpm != null && activity.avg_hr_bpm > 0
  ? (activity.normalized_power / activity.avg_hr_bpm).toFixed(2)
  : null;
```

Se puede mostrar como tooltip o métrica adicional en la fila avanzada. No requiere cambios en BD ni API.

---

## Verificación

```bash
pnpm test --filter=shared   # Zone distribution + best efforts tests
pnpm test --filter=api      # Recalculate service tests
pnpm build                  # Build completo
```

### Checklist
- [ ] Zone distribution calcula correctamente para archivos reales
- [ ] Best efforts muestra valores coherentes vs Strava/Garmin
- [ ] Actividades sin power pero con HR → hrTSS calculado
- [ ] Cambiar FTP → TSS de actividades antiguas se actualiza
- [ ] EF visible en detalle de actividad (si NP y HR disponibles)
