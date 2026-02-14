# L2 — Diseño Técnico: Insights / Comparar Periodos

> **Input**: `docs/specs/L1-screen-07-insights.md`
> **Requisito PRD**: F07 — Comparar semanas / tendencias (P1)
> **Fecha**: 2026-02-14

---

## 1. Resumen del Alcance

### Qué se construye

1. **Página de Insights** (`(app)/insights/page.tsx`): Server Component que obtiene actividades de dos periodos, calcula métricas y genera análisis.
2. **InsightsContent** (Client Component): Wrapper para gestión de periodos (futuro).
3. **ComparisonMetricCard** (Presentacional): Card de comparación A vs B con delta.
4. **PerformanceRadarChart** (Client Component): RadarChart de Recharts con 2 series.
5. **AIInsightsCard** (Presentacional): Variante de tarjeta IA para análisis comparativo.
6. **Funciones de cálculo**: Agregaciones por periodo, radar dimensions, delta logic.
7. **Schemas y tipos compartidos**: Tipos en `packages/shared`.

### Fuera de alcance

- Selector personalizado de periodos (date picker). En MVP, los periodos son las 2 últimas semanas.
- Endpoint de análisis IA comparativo (`GET /api/v1/ai/weekly-summary`). Se usarán heurísticas simples o placeholder.
- Comparación de más de 2 periodos.
- Exportar datos de comparación.

### Prerequisitos técnicos

- Auth con Google OAuth: **implementado**.
- Tabla `activities`: **creada** (migration 001).
- Layout con Sidebar (route group `(app)`): prerequisito (Dashboard).
- `recharts` instalado: prerequisito (Dashboard — ADR-009).
- Constantes `ACTIVITY_TYPES`: definidas en `packages/shared`.

---

## 2. Arquitectura de Componentes

### 2.1 Árbol de componentes

```
app/(app)/insights/page.tsx (Server Component)
│   → Calcula periodos (2 últimas semanas)
│   → Obtiene actividades de ambos periodos
│   → Calcula métricas, deltas, radar, análisis
│
└── InsightsContent (Client Component — futuro: selector de periodos)
    ├── InsightsHeader (presentacional)
    │   ├── Título "Comparar periodos"
    │   └── Subtítulo
    │
    ├── PeriodSelectors (presentacional — no interactivo en MVP)
    │   ├── Badge Periodo A (azul)
    │   ├── ArrowRight
    │   └── Badge Periodo B (naranja)
    │
    ├── ComparisonGrid (presentacional)
    │   └── ComparisonMetricCard ×6
    │
    ├── PerformanceRadarChart (Client — Recharts)
    │   ├── RadarChart (2 series)
    │   └── Leyenda
    │
    └── AIInsightsCard (presentacional) ♻️
```

### 2.2 Detalle por componente

#### InsightsContent

```typescript
// Ruta: apps/web/src/app/(app)/insights/insights-content.tsx
// Tipo: Client Component

interface InsightsContentProps {
  periodA: PeriodRange;
  periodB: PeriodRange;
  comparisonMetrics: ComparisonMetric[];
  radarData: RadarDimension[];
  aiAnalysis: InsightsAnalysis | null;
  hasEnoughData: boolean;
}
```

- **Responsabilidad**: Compone todas las secciones de Insights. En MVP es un wrapper simple. En futuro: gestiona estado de selección de periodos.
- **Fuente de datos**: Props del Server Component.
- **Dependencias**: PeriodSelectors, ComparisonMetricCard, PerformanceRadarChart, AIInsightsCard.
- **Decisiones**: Client Component para preparar la futura interactividad de selección de periodos. En el MVP, solo renderiza las props sin estado.

#### ComparisonMetricCard

```typescript
// Ruta: apps/web/src/components/comparison-metric-card.tsx
// Tipo: Presentacional

interface ComparisonMetricCardProps {
  metric: string;
  valueA: number;
  valueB: number;
  unit: string;
  inverse?: boolean;
}
```

- **Responsabilidad**: Card de comparación con valor A → valor B + delta % (ref: L1 §3.3).
- **Fuente de datos**: Props. Valores numéricos, el componente calcula el delta.
- **Dependencias**: Ninguna externa.
- **Decisiones**: Componente reutilizable genérico. La lógica de `inverse` (FC baja = positivo) se resuelve internamente. El formateo del valor se hace en el componente (toFixed para decimales).

**Lógica del delta**:
```typescript
const delta = valueA !== 0 ? ((valueB - valueA) / valueA * 100) : 0;
const isUp = delta > 0;
const isGood = inverse ? !isUp : isUp;
const formattedDelta = `${isUp ? '+' : ''}${delta.toFixed(1)}%`;
```

#### PerformanceRadarChart

```typescript
// Ruta: apps/web/src/components/charts/performance-radar-chart.tsx
// Tipo: Client Component

interface PerformanceRadarChartProps {
  data: Array<{
    metric: string;
    A: number;
    B: number;
  }>;
}
```

- **Responsabilidad**: RadarChart con 2 series superpuestas (ref: L1 §3.4).
- **Fuente de datos**: Props.
- **Dependencias**: `recharts` (RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer).
- **Decisiones**: Client Component obligatorio por Recharts. Los colores de las series son fijos (#3b82f6 para A, #f97316 para B). La leyenda se renderiza como HTML debajo del chart, no con la leyenda nativa de Recharts (más control visual).

#### AIInsightsCard

```typescript
// Ruta: apps/web/src/components/ai-insights-card.tsx
// Tipo: Presentacional

interface AIInsightsCardProps {
  analysis: InsightsAnalysis | null;
}
```

- **Responsabilidad**: Tarjeta de análisis IA comparativo (ref: L1 §3.5).
- **Fuente de datos**: Props.
- **Dependencias**: `lucide-react` (Zap).
- **Decisiones**: Variante de AICoachCard. Comparte el patrón visual (badge + gradient + texto) pero con estructura de contenido diferente (múltiples párrafos con highlights). Componente separado por simplicidad (consistente con ADR-019 del Detalle de Actividad).

**Estado vacío** (cuando `analysis` es null):
```typescript
if (!analysis) {
  return (
    <div className="...ai-card-styles...">
      {/* Badge "ANÁLISIS IA" */}
      <p className="text-[13px] text-[var(--text-secondary)]">
        El análisis comparativo estará disponible cuando haya datos de al menos 2 semanas.
      </p>
    </div>
  );
}
```

---

## 3. Modelo de Datos

### Queries necesarios

#### Query: Actividades por rango de fechas

```typescript
// En page.tsx (Server Component)
async function getActivitiesByPeriod(
  supabase: SupabaseClient,
  userId: string,
  start: string,
  end: string
) {
  const { data } = await supabase
    .from('activities')
    .select('id, date, distance_km, duration_seconds, avg_power_watts, avg_hr_bpm, tss, type')
    .eq('user_id', userId)
    .gte('date', start)
    .lte('date', end)
    .order('date', { ascending: true });
  return data ?? [];
}
```

### Funciones de cálculo

```typescript
// lib/insights/calculations.ts

interface PeriodMetrics {
  distanceKm: number;
  durationHours: number;
  avgPower: number | null;
  avgHR: number | null;
  totalTSS: number;
  sessionCount: number;
}

/**
 * Calcula métricas agregadas de un periodo
 */
export function calculatePeriodMetrics(
  activities: Activity[]
): PeriodMetrics {
  if (activities.length === 0) {
    return { distanceKm: 0, durationHours: 0, avgPower: null, avgHR: null, totalTSS: 0, sessionCount: 0 };
  }

  const distanceKm = activities.reduce((sum, a) => sum + (a.distance_km ?? 0), 0);
  const durationHours = activities.reduce((sum, a) => sum + a.duration_seconds, 0) / 3600;

  const withPower = activities.filter(a => a.avg_power_watts != null);
  const avgPower = withPower.length > 0
    ? Math.round(withPower.reduce((sum, a) => sum + a.avg_power_watts!, 0) / withPower.length)
    : null;

  const withHR = activities.filter(a => a.avg_hr_bpm != null);
  const avgHR = withHR.length > 0
    ? Math.round(withHR.reduce((sum, a) => sum + a.avg_hr_bpm!, 0) / withHR.length)
    : null;

  const totalTSS = activities.reduce((sum, a) => sum + (a.tss ?? 0), 0);

  return { distanceKm, durationHours, avgPower, avgHR, totalTSS, sessionCount: activities.length };
}

/**
 * Genera las 6 comparison metrics a partir de dos PeriodMetrics
 */
export function buildComparisonMetrics(
  metricsA: PeriodMetrics,
  metricsB: PeriodMetrics
): ComparisonMetric[] {
  return [
    { metric: 'Distancia', valueA: round1(metricsA.distanceKm), valueB: round1(metricsB.distanceKm), unit: 'km', color: '#3b82f6' },
    { metric: 'Tiempo', valueA: round1(metricsA.durationHours), valueB: round1(metricsB.durationHours), unit: 'h', color: '#8b5cf6' },
    { metric: 'Potencia', valueA: metricsA.avgPower ?? 0, valueB: metricsB.avgPower ?? 0, unit: 'W', color: '#f97316' },
    { metric: 'FC media', valueA: metricsA.avgHR ?? 0, valueB: metricsB.avgHR ?? 0, unit: 'bpm', color: '#ef4444', inverse: true },
    { metric: 'TSS', valueA: metricsA.totalTSS, valueB: metricsB.totalTSS, unit: '', color: '#eab308' },
    { metric: 'Sesiones', valueA: metricsA.sessionCount, valueB: metricsB.sessionCount, unit: '', color: '#22c55e' },
  ];
}

/**
 * Calcula dimensiones del radar (0-100)
 */
export function calculateRadarDimensions(
  metricsA: PeriodMetrics,
  metricsB: PeriodMetrics
): RadarDimension[] {
  // Normalización simplificada para MVP
  const maxDist = Math.max(metricsA.distanceKm, metricsB.distanceKm, 1);
  const maxTSS = Math.max(metricsA.totalTSS, metricsB.totalTSS, 1);
  const maxPower = Math.max(metricsA.avgPower ?? 0, metricsB.avgPower ?? 0, 1);

  return [
    {
      metric: 'Volumen',
      A: normalize(metricsA.distanceKm + metricsA.durationHours * 10, maxDist + 100),
      B: normalize(metricsB.distanceKm + metricsB.durationHours * 10, maxDist + 100),
    },
    {
      metric: 'Intensidad',
      A: normalize((metricsA.avgPower ?? 0) + metricsA.totalTSS / 10, maxPower + maxTSS / 10),
      B: normalize((metricsB.avgPower ?? 0) + metricsB.totalTSS / 10, maxPower + maxTSS / 10),
    },
    {
      metric: 'Consistencia',
      A: normalize(metricsA.sessionCount, 7) * 100,
      B: normalize(metricsB.sessionCount, 7) * 100,
    },
    {
      metric: 'Recuperación',
      A: calculateRecoveryScore(metricsA),
      B: calculateRecoveryScore(metricsB),
    },
    {
      metric: 'Progresión',
      A: 50, // Baseline
      B: calculateProgressionScore(metricsA, metricsB),
    },
  ];
}

function normalize(value: number, max: number): number {
  return Math.min(100, Math.round((value / max) * 100));
}

function calculateRecoveryScore(metrics: PeriodMetrics): number {
  // Heurística simple: más sesiones de baja intensidad = mejor recuperación
  // En futuro: basarse en datos reales de tipos de actividad
  const idealTSS = 350; // TSS semanal ideal
  const ratio = metrics.totalTSS / idealTSS;
  return Math.min(100, Math.max(0, Math.round((1 - Math.abs(1 - ratio)) * 100)));
}

function calculateProgressionScore(prev: PeriodMetrics, curr: PeriodMetrics): number {
  if (!prev.avgPower || !curr.avgPower) return 50;
  const delta = ((curr.avgPower - prev.avgPower) / prev.avgPower) * 100;
  return Math.min(100, Math.max(0, Math.round(50 + delta * 5)));
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Genera análisis basado en heurísticas (placeholder para Claude API)
 */
export function generateSimpleAnalysis(
  metricsA: PeriodMetrics,
  metricsB: PeriodMetrics
): InsightsAnalysis | null {
  if (metricsA.sessionCount === 0 && metricsB.sessionCount === 0) {
    return null;
  }

  const parts: InsightsAnalysis = {
    summary: '',
    recommendation: '',
  };

  // Summary
  if (metricsB.avgPower && metricsA.avgPower) {
    const powerDelta = ((metricsB.avgPower - metricsA.avgPower) / metricsA.avgPower * 100).toFixed(1);
    const hrDelta = metricsB.avgHR && metricsA.avgHR
      ? ` con FC ${metricsB.avgHR < metricsA.avgHR ? 'estable' : 'en aumento'}`
      : '';
    parts.summary = `${Number(powerDelta) > 0 ? 'Progresión positiva' : 'Semana de mantenimiento'}. Potencia ${Number(powerDelta) > 0 ? '+' : ''}${powerDelta}%${hrDelta}.`;
  } else {
    parts.summary = 'Datos insuficientes para un análisis detallado de potencia.';
  }

  // Alert
  if (metricsB.totalTSS > metricsA.totalTSS * 1.15) {
    const tssDelta = ((metricsB.totalTSS - metricsA.totalTSS) / metricsA.totalTSS * 100).toFixed(0);
    parts.alert = `TSS +${tssDelta}%. Considera una semana de descarga si continúa la tendencia.`;
  }

  // Recommendation
  const idealSessions = 5;
  if (metricsB.sessionCount < idealSessions) {
    parts.recommendation = `Intenta mantener ${idealSessions}-6 sesiones semanales para una progresión consistente.`;
  } else {
    parts.recommendation = `Buen volumen de sesiones (${metricsB.sessionCount}). Mantén la consistencia.`;
  }

  return parts;
}
```

### Cálculo de periodos por defecto

```typescript
// lib/insights/periods.ts

export function getDefaultPeriods(): { periodA: PeriodRange; periodB: PeriodRange } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  // Periodo B = semana actual (lunes a domingo)
  const bStart = new Date(now);
  bStart.setDate(now.getDate() + mondayOffset);
  bStart.setHours(0, 0, 0, 0);
  const bEnd = new Date(bStart);
  bEnd.setDate(bStart.getDate() + 6);

  // Periodo A = semana anterior
  const aStart = new Date(bStart);
  aStart.setDate(bStart.getDate() - 7);
  const aEnd = new Date(bStart);
  aEnd.setDate(bStart.getDate() - 1);

  const formatRange = (start: Date, end: Date): string => {
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun',
                    'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${start.getDate()} — ${end.getDate()} ${months[end.getMonth()]}`;
  };

  return {
    periodA: {
      start: aStart.toISOString().split('T')[0],
      end: aEnd.toISOString().split('T')[0],
      label: formatRange(aStart, aEnd),
    },
    periodB: {
      start: bStart.toISOString().split('T')[0],
      end: bEnd.toISOString().split('T')[0],
      label: formatRange(bStart, bEnd),
    },
  };
}
```

### Schemas Zod nuevos (en `packages/shared`)

```typescript
// packages/shared/src/schemas/insights.ts

import { z } from 'zod';

export const periodRangeSchema = z.object({
  start: z.string(),
  end: z.string(),
  label: z.string(),
});
export type PeriodRange = z.infer<typeof periodRangeSchema>;

export const comparisonMetricSchema = z.object({
  metric: z.string(),
  valueA: z.number(),
  valueB: z.number(),
  unit: z.string(),
  color: z.string(),
  inverse: z.boolean().optional(),
});
export type ComparisonMetric = z.infer<typeof comparisonMetricSchema>;

export const radarDimensionSchema = z.object({
  metric: z.string(),
  A: z.number(),
  B: z.number(),
});
export type RadarDimension = z.infer<typeof radarDimensionSchema>;

export const insightsAnalysisSchema = z.object({
  summary: z.string(),
  alert: z.string().optional(),
  recommendation: z.string(),
});
export type InsightsAnalysis = z.infer<typeof insightsAnalysisSchema>;
```

---

## 4. Endpoints API

**No se requieren endpoints Fastify nuevos** para Insights en esta fase.

**Justificación**: Todos los datos se obtienen directamente desde Supabase en el Server Component (actividades por rango de fechas). Los cálculos son funciones puras ejecutadas server-side.

**Endpoints futuros pendientes**:
- `GET /api/v1/ai/weekly-summary`: Para análisis comparativo IA detallado con Claude API.
- `GET /api/v1/insights?periodA=...&periodB=...`: Si se necesita endpoint para selección dinámica de periodos.

---

## 5. Estructura de Archivos

### Archivos nuevos

```
packages/shared/src/schemas/insights.ts                  ← Schemas Zod para Insights

apps/web/src/app/(app)/insights/page.tsx                  ← Server Component: queries + cálculos
apps/web/src/app/(app)/insights/insights-content.tsx       ← Client Component: wrapper

apps/web/src/components/comparison-metric-card.tsx         ← Card de comparación A vs B
apps/web/src/components/ai-insights-card.tsx               ← Tarjeta de análisis IA comparativo
apps/web/src/components/charts/performance-radar-chart.tsx  ← RadarChart de Recharts

apps/web/src/lib/insights/calculations.ts                  ← Funciones de cálculo de métricas y radar
apps/web/src/lib/insights/periods.ts                       ← Cálculo de periodos por defecto
```

### Archivos a modificar

```
packages/shared/src/index.ts                               ← Añadir exports de insights schemas
```

### Dependencias con otras specs

| Dependencia | Spec origen | Estado |
|-------------|-------------|--------|
| Layout `(app)` con Sidebar | L2-screen-01 (Dashboard) | Prerequisito |
| `recharts` instalado | L2-screen-01 (Dashboard) | Prerequisito |
| `ACTIVITY_TYPES` constante | L2-screen-01 (Dashboard) | Prerequisito |
| Tabla `activities` | Migration 001 | ✅ Creada |

---

## 6. ADRs (Decisiones Arquitectónicas)

### ADR-027: Periodos fijos en MVP, selector en futuro

- **Contexto**: La pantalla muestra 2 periodos comparados. El usuario podría querer seleccionar periodos personalizados.
- **Decisión**: En MVP, los periodos son fijos (semana anterior vs semana actual). Los badges de periodo son informativos, no interactivos.
- **Alternativas descartadas**:
  - Date picker desde el inicio: Añade complejidad de UI (date range picker), dependencia nueva (react-datepicker o similar), y lógica de validación de rangos.
- **Consecuencias**:
  - (+) Implementación simple y rápida.
  - (+) El componente `PeriodSelectors` acepta props — la interactividad se añade después sin cambiar la estructura.
  - (-) No se pueden comparar periodos arbitrarios en el MVP.

### ADR-028: Cálculos de radar con heurísticas simples

- **Contexto**: Las 5 dimensiones del radar (Volumen, Intensidad, Consistencia, Recuperación, Progresión) requieren normalización a escala 0-100. No hay una fórmula estándar para ciclismo amateur.
- **Decisión**: Usar heurísticas simples basadas en los datos disponibles. Las fórmulas se pueden refinar cuando haya más datos y feedback.
- **Alternativas descartadas**:
  - Modelo estadístico complejo: Overkill para MVP, requiere dataset de referencia.
  - Delegar a Claude API: Añade latencia y coste por cada carga de página.
- **Consecuencias**:
  - (+) El radar es visual y funcional desde el primer momento.
  - (+) Las funciones son puras y fáciles de ajustar/testear.
  - (-) Los valores pueden no ser precisos para todos los perfiles de usuario. Se mejorará con feedback.

### ADR-029: ComparisonMetricCard como componente genérico reutilizable

- **Contexto**: Las 6 metric cards de comparación comparten la misma estructura visual (label, valor A → B, delta).
- **Decisión**: Un solo componente `ComparisonMetricCard` que acepta props genéricas.
- **Consecuencias**:
  - (+) DRY. El grid de métricas es un `.map()` sobre el array de métricas.
  - (+) Reutilizable si se necesita comparación en otros contextos.

### ADR-030: Análisis IA con heurísticas hasta integración de Claude

- **Contexto**: Similar a ADR-010 (Dashboard) y ADR-026 (Plan). El análisis comparativo requiere Claude API.
- **Decisión**: Generar análisis con heurísticas simples basadas en las métricas calculadas.
- **Consecuencias**:
  - (+) La tarjeta IA tiene contenido relevante desde el primer momento.
  - (+) La interfaz `InsightsAnalysis` está preparada para recibir análisis real.
  - (-) El análisis no es verdaderamente inteligente. Las heurísticas cubren los casos básicos (potencia sube/baja, TSS alto/bajo, recomendaciones genéricas).

---

## 7. Dependencias y Prerequisitos

### Paquetes npm a instalar

| Paquete | Workspace | Justificación |
|---------|-----------|---------------|
| Ninguno nuevo | — | `recharts` se instala con el Dashboard |

### Paquetes ya instalados (o por instalar con Dashboard)

| Paquete | Uso |
|---------|-----|
| `recharts` | RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer |
| `lucide-react` | Iconos: Zap, ArrowRight |
| `@supabase/ssr` | Queries a Supabase server-side |

### Componentes ya creados

| Componente | Fuente | Uso en Insights |
|-----------|--------|----------------|
| `Sidebar` | `components/sidebar.tsx` | Layout compartido |
| `AICoachCard` | `components/ai-coach-card.tsx` | Referencia visual (no se reutiliza directamente) |

### Tablas Supabase

- ✅ `activities`: Queries por rango de fechas para ambos periodos.
- ✅ `users`: Perfil del usuario (FTP, goal para contexto IA).

---

## 8. Riesgos y Consideraciones

### Riesgo 1: Sin datos suficientes para comparar

**Descripción**: Un usuario nuevo no tiene 2 semanas de actividades.

**Mitigación**: Verificar al inicio:
```typescript
const hasEnoughData = activitiesA.length > 0 || activitiesB.length > 0;
```
Si `!hasEnoughData`, mostrar estado vacío: "Necesitas al menos 2 semanas de datos para comparar periodos." con subtexto motivacional.

Si solo un periodo tiene datos, mostrar las métricas del periodo con datos y "—" para el otro. El radar solo muestra una serie.

### Riesgo 2: Valores null en métricas

**Descripción**: Actividades sin potencia, FC o TSS generan nulls en los cálculos.

**Mitigación**: La función `calculatePeriodMetrics` filtra nulls antes de promediar. Si todas las actividades de un periodo carecen de potencia, `avgPower` será null. `ComparisonMetricCard` muestra "—" en lugar de 0 para valores null, y el delta no se calcula.

### Riesgo 3: RadarChart sin datos = crash

**Descripción**: Si `radarData` está vacío, Recharts puede crashear.

**Mitigación**: No renderizar `PerformanceRadarChart` si `!hasEnoughData`. El radar siempre recibe 5 dimensiones (pueden ser 0 si no hay datos).

### Riesgo 4: Performance del RadarChart

**Descripción**: RadarChart con 5 puntos y 2 series es ligero. No debería haber problemas.

**Mitigación**: Ninguna necesaria. El dataset es pequeño (5 × 2 = 10 puntos).

### Riesgo 5: Heurísticas de radar imprecisas

**Descripción**: Las fórmulas simplificadas pueden dar valores extraños para perfiles extremos.

**Mitigación**: Limitar todos los valores a rango [0, 100]. Documentar las fórmulas para facilitar ajustes. En futuro, personalizar las fórmulas según el objetivo del usuario (performance vs health vs weight_loss).

### Consideraciones de accesibilidad

- ComparisonMetricCard: `aria-label` descriptivo (ej: "Distancia: 165 km a 187 km, subida del 13.3%").
- RadarChart: contenedor con `role="img"` y `aria-label="Perfil de rendimiento comparativo"`.
- Leyenda del radar: HTML semántico, no decorativo.
- PeriodSelectors: `aria-label` en cada badge indicando el rango de fechas.
- Delta colores: No depender solo del color (verde/rojo). Usar `+`/`-` y texto descriptivo.
- AIInsightsCard: estructura semántica con `<article>`.
