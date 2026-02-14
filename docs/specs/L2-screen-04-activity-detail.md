# L2 — Diseño Técnico: Detalle de Actividad

> **Input**: `docs/specs/L1-screen-04-activity-detail.md`
> **Requisito PRD**: F05 — Detalle de actividad (P0)
> **Fecha**: 2026-02-14

---

## 1. Resumen del Alcance

### Qué se construye

1. **Página de Detalle** (`(app)/activities/[id]/page.tsx`): Server Component que obtiene la actividad y sus series temporales.
2. **ActivityDetailContent** (Client Component): Wrapper que compone las secciones del detalle.
3. **MetricsGrid** (Presentacional): Grid de 6 metric cards compactas.
4. **ActivityChart** (Client Component): Gráfica temporal con selector de serie (Potencia/FC/Cadencia) usando Recharts.
5. **AIAnalysisCard** (Presentacional): Tarjeta de análisis IA — variante de AICoachCard.
6. **BackButton** (Client Component): Botón de retorno reutilizable.

### Fuera de alcance

- Generación de análisis IA en tiempo real (requiere integración con Claude API vía Fastify). Se mostrará análisis pre-existente del campo `ai_analysis` o placeholder.
- Edición de notas personales (F05 PRD menciona "notas editables" — se implementará en una fase posterior).
- Checkbox "sesión de referencia" (F05 PRD menciona `is_reference` — se implementará en una fase posterior).
- Compartir actividad o exportar datos.

### Prerequisitos técnicos

- Auth con Google OAuth: **implementado**.
- Tabla `activities`: **creada** (migration 001).
- Tabla `activity_metrics`: **creada** (migration 001).
- Layout con Sidebar (route group `(app)`): prerequisito (Dashboard o Actividades).
- Recharts: se instala con el Dashboard (spec L2-screen-01, ADR-009).
- Constantes `ACTIVITY_TYPES`: definidas en `packages/shared`.
- Función `formatDuration`: definida en `lib/dashboard/calculations.ts`.

---

## 2. Arquitectura de Componentes

### 2.1 Árbol de componentes

```
app/(app)/activities/[id]/page.tsx (Server Component)
│   → Obtiene actividad + métricas de Supabase
│   → Valida que la actividad existe
│   → Transforma series temporales al formato de gráfica
│
└── ActivityDetailContent (Client Component — gestiona tab de gráfica)
    ├── BackButton (Client)
    │   └── ArrowLeft + "Volver"
    │
    ├── DetailHeader (presentacional)
    │   ├── Nombre (h1)
    │   ├── Badge tipo
    │   └── Fecha
    │
    ├── MetricsGrid (presentacional)
    │   └── MetricCard ×6
    │
    ├── ActivityChart (Client — Recharts)
    │   ├── Título "Gráficas"
    │   ├── Tabs (Potencia / FC / Cadencia)
    │   └── AreaChart
    │
    └── AIAnalysisCard (presentacional) ♻️
        ├── Badge "ANÁLISIS IA"
        ├── Texto de análisis
        ├── Separador
        └── Tips ×3
```

### 2.2 Detalle por componente

#### ActivityDetailContent

```typescript
// Ruta: apps/web/src/app/(app)/activities/[id]/activity-detail-content.tsx
// Tipo: Client Component

interface ActivityDetailContentProps {
  activity: {
    id: string;
    name: string;
    date: string;
    type: string;
    distance_km: number | null;
    duration_seconds: number;
    avg_power_watts: number | null;
    avg_hr_bpm: number | null;
    avg_cadence_rpm: number | null;
    tss: number | null;
    rpe: number | null;
    ai_analysis: AIAnalysis | null;
  };
  timeSeries: Array<{
    min: number;
    power: number;
    hr: number;
    cadence: number;
  }>;
}
```

- **Responsabilidad**: Compone todas las secciones del detalle. Contiene el estado de la tab de gráfica activa.
- **Fuente de datos**: Props del Server Component.
- **Dependencias**: BackButton, DetailHeader, MetricsGrid, ActivityChart, AIAnalysisCard, `formatDuration`.
- **Decisiones**: Client Component porque contiene ActivityChart (Recharts) y BackButton (interactivo). El estado de la tab de gráfica se gestiona aquí para mantenerlo simple.

#### BackButton

```typescript
// Ruta: apps/web/src/components/back-button.tsx
// Tipo: Client Component

interface BackButtonProps {
  href?: string;   // Default: usa router.back()
  label?: string;  // Default: "Volver"
}
```

- **Responsabilidad**: Botón de retorno con icono ArrowLeft (ref: L1 §3.1).
- **Fuente de datos**: Props opcionales.
- **Dependencias**: `next/navigation` (useRouter), `lucide-react` (ArrowLeft).
- **Decisiones**: Si se proporciona `href`, usa `next/link`. Si no, usa `router.back()`. Esto permite reutilizarlo en contextos donde se quiere navegar a una ruta específica o simplemente "volver".

#### DetailHeader

```typescript
// Ruta: apps/web/src/app/(app)/activities/[id]/detail-header.tsx
// Tipo: Presentacional (sin 'use client' propio)

interface DetailHeaderProps {
  name: string;
  type: string;
  date: string;          // ISO date string
  dateFormatted: string; // "14 feb 2026"
}
```

- **Responsabilidad**: Muestra nombre de la actividad, badge de tipo y fecha formateada (ref: L1 §3.2).
- **Fuente de datos**: Props.
- **Dependencias**: Constantes `ACTIVITY_TYPES`.
- **Decisiones**: Componente presentacional puro. La fecha se pasa ya formateada desde el server.

#### MetricsGrid

```typescript
// Ruta: apps/web/src/components/metrics-grid.tsx
// Tipo: Presentacional (sin 'use client' propio)

interface MetricItem {
  icon: LucideIcon;
  iconColor: string;
  label: string;
  value: string;    // Pre-formateado: "52.3", "1:45", "—"
  unit: string;
}

interface MetricsGridProps {
  metrics: MetricItem[];
  columns?: 3 | 6;  // Default: auto-responsive (3 mobile, 6 desktop)
}
```

- **Responsabilidad**: Grid de metric cards compactas (ref: L1 §3.3).
- **Fuente de datos**: Props. Valores pre-formateados en el server.
- **Dependencias**: `lucide-react` (Activity, Clock, Zap, Heart, TrendingUp).
- **Decisiones**: Componente reutilizable genérico. Acepta cualquier array de métricas — útil para otros contextos (ej: Insights). La prop `columns` permite forzar un layout si se necesita.

#### ActivityChart

```typescript
// Ruta: apps/web/src/components/charts/activity-chart.tsx
// Tipo: Client Component

interface ActivityChartProps {
  data: Array<{
    min: number;
    power: number;
    hr: number;
    cadence: number;
  }>;
}
```

- **Responsabilidad**: Gráfica temporal con selector de serie (ref: L1 §3.4).
- **Fuente de datos**: Props con datos pre-procesados.
- **Dependencias**: `recharts` (AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, defs, linearGradient).
- **Decisiones**: Client Component obligatorio por Recharts. El gradient SVG se regenera al cambiar de tab (mismo `id` pero color diferente). Se usa un solo `AreaChart` que cambia de dataKey según la tab activa.

**Estado interno**:
```typescript
const [activeChart, setActiveChart] = useState<'power' | 'hr' | 'cadence'>('power');

const chartConfig = {
  power:    { key: 'power',    color: '#f97316', label: 'Potencia' },
  hr:       { key: 'hr',       color: '#ef4444', label: 'FC' },
  cadence:  { key: 'cadence',  color: '#8b5cf6', label: 'Cadencia' },
} as const;
```

#### AIAnalysisCard

```typescript
// Ruta: apps/web/src/components/ai-analysis-card.tsx
// Tipo: Presentacional (sin 'use client' propio)

interface AIAnalysisCardProps {
  analysis: {
    summary: string;
    recommendation: string;
    tips: {
      hydration?: string;
      nutrition?: string;
      sleep?: string;
    };
  } | null;
}
```

- **Responsabilidad**: Tarjeta con análisis IA de la sesión (ref: L1 §3.5).
- **Fuente de datos**: Props. El campo `ai_analysis` de la actividad.
- **Dependencias**: `lucide-react` (Zap, Droplets, Sun, Moon).
- **Decisiones**: Variante de `AICoachCard` del Dashboard. Comparten el mismo patrón visual (badge, gradient, separador, tips) pero con contenido diferente. Se podría crear un componente base `AICard` y derivar ambos, o mantenerlos separados por simplicidad. Para el MVP: componentes separados, refactorizar si se identifica duplicación significativa.

**Estado vacío** (cuando `analysis` es null):
```typescript
if (!analysis) {
  return (
    <div className="...ai-card-styles...">
      <div className="flex items-center gap-2 mb-3">
        {/* Badge "ANÁLISIS IA" */}
      </div>
      <p className="text-[13px] text-[var(--text-secondary)]">
        El análisis IA se generará automáticamente cuando esté disponible.
      </p>
    </div>
  );
}
```

---

## 3. Modelo de Datos

### Query de actividad

```typescript
// En app/(app)/activities/[id]/page.tsx (Server Component)
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();

// 1. Obtener actividad
const { data: activity, error } = await supabase
  .from('activities')
  .select('id, name, date, type, distance_km, duration_seconds, avg_power_watts, avg_hr_bpm, max_hr_bpm, avg_cadence_rpm, tss, rpe, ai_analysis, notes, is_reference')
  .eq('id', params.id)
  .eq('user_id', user.id)  // RLS ya lo filtra, pero doble check
  .single();

if (!activity) {
  notFound(); // Next.js 404
}
```

### Query de series temporales

```typescript
// 2. Obtener métricas temporales
const { data: metrics } = await supabase
  .from('activity_metrics')
  .select('timestamp_seconds, power_watts, hr_bpm, cadence_rpm')
  .eq('activity_id', params.id)
  .order('timestamp_seconds', { ascending: true });
```

### Transformación de series temporales

```typescript
// lib/activities/transform-time-series.ts

export function transformTimeSeries(
  metrics: Array<{
    timestamp_seconds: number;
    power_watts: number;
    hr_bpm: number;
    cadence_rpm: number;
  }>
): Array<{ min: number; power: number; hr: number; cadence: number }> {
  return metrics.map(m => ({
    min: Math.round(m.timestamp_seconds / 60),
    power: m.power_watts,
    hr: m.hr_bpm,
    cadence: m.cadence_rpm,
  }));
}
```

### Formato de fecha

```typescript
// lib/activities/format-date.ts

export function formatActivityDate(isoDate: string): string {
  const date = new Date(isoDate);
  const day = date.getDate();
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun',
                  'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}
```

### Preparación de métricas para MetricsGrid

```typescript
// En page.tsx o en ActivityDetailContent
import { Activity, Clock, Zap, Heart, TrendingUp } from 'lucide-react';

const metrics: MetricItem[] = [
  { icon: Activity,    iconColor: '#3b82f6', label: 'Dist.',    value: activity.distance_km?.toFixed(1) ?? '—', unit: 'km' },
  { icon: Clock,       iconColor: '#8b5cf6', label: 'Tiempo',   value: formatDuration(activity.duration_seconds),  unit: 'h' },
  { icon: Zap,         iconColor: '#f97316', label: 'Pot.',     value: activity.avg_power_watts?.toString() ?? '—', unit: 'W' },
  { icon: Heart,       iconColor: '#ef4444', label: 'FC',       value: activity.avg_hr_bpm?.toString() ?? '—',     unit: 'bpm' },
  { icon: TrendingUp,  iconColor: '#22c55e', label: 'Cadencia', value: activity.avg_cadence_rpm?.toString() ?? '—', unit: 'rpm' },
  { icon: Zap,         iconColor: '#eab308', label: 'TSS',      value: activity.tss?.toString() ?? '—',            unit: '' },
];
```

---

## 4. Endpoints API

**No se requieren endpoints Fastify nuevos** para el Detalle de Actividad en esta fase.

**Justificación**: Los datos se obtienen directamente de Supabase en el Server Component (actividad + métricas). RLS garantiza que solo el propietario puede acceder.

**Endpoints futuros pendientes**:
- `POST /api/v1/ai/analyze-activity`: Para generar análisis IA on-demand. Requiere integración con Claude API.
- `PATCH /api/v1/activities/:id`: Para editar notas y marcar como referencia. Puede hacerse directo a Supabase con RLS.

---

## 5. Estructura de Archivos

### Archivos nuevos

```
apps/web/src/app/(app)/activities/[id]/page.tsx                  ← Server Component: query actividad + métricas
apps/web/src/app/(app)/activities/[id]/activity-detail-content.tsx ← Client Component: wrapper del detalle
apps/web/src/app/(app)/activities/[id]/detail-header.tsx          ← Presentacional: nombre + badge + fecha

apps/web/src/components/back-button.tsx                           ← Botón de retorno reutilizable
apps/web/src/components/metrics-grid.tsx                          ← Grid de métricas compactas reutilizable
apps/web/src/components/ai-analysis-card.tsx                      ← Tarjeta de análisis IA
apps/web/src/components/charts/activity-chart.tsx                 ← Gráfica temporal con tabs (Recharts)

apps/web/src/lib/activities/transform-time-series.ts              ← Transformación de series temporales
apps/web/src/lib/activities/format-date.ts                        ← Formateo de fecha en español
```

### Archivos a modificar

Ninguno — todos son archivos nuevos.

### Dependencias con otras specs

| Dependencia | Spec origen | Estado |
|-------------|-------------|--------|
| Layout `(app)` con Sidebar | L2-screen-01 (Dashboard) | Prerequisito |
| `recharts` instalado | L2-screen-01 (Dashboard) | Prerequisito |
| `ACTIVITY_TYPES` constante | L2-screen-01 (Dashboard) | Prerequisito |
| `formatDuration` función | L2-screen-01 (Dashboard) | Prerequisito |
| `RPEIndicator` componente | L2-screen-03 (Lista Actividades) | Opcional (si se añade RPE al detalle) |

---

## 6. ADRs (Decisiones Arquitectónicas)

### ADR-019: Separar AIAnalysisCard de AICoachCard

- **Contexto**: El Detalle de Actividad y el Dashboard tienen tarjetas IA con el mismo patrón visual (badge, gradient, separador, tips) pero contenido diferente ("ANÁLISIS IA" vs "ENTRENADOR IA", análisis de sesión vs recomendación diaria).
- **Decisión**: Crear `AIAnalysisCard` como componente separado de `AICoachCard`.
- **Alternativas descartadas**:
  - Componente base `AICard` con variantes: Añade un nivel de abstracción prematuro para 2 variantes.
  - Un solo componente con prop `variant: 'coach' | 'analysis'`: Mezcla responsabilidades y hace el componente más complejo.
- **Consecuencias**:
  - (+) Cada componente tiene una responsabilidad clara y props simples.
  - (+) Pueden evolucionar independientemente (el análisis de sesión tiene estructura diferente al coach diario).
  - (-) Duplicación del patrón visual (badge + gradient + tips). Si aparece una tercera variante, refactorizar a componente base.

### ADR-020: Series temporales obtenidas en Server Component

- **Contexto**: Las series temporales (`activity_metrics`) pueden ser un dataset considerable (1 registro por minuto × 3h = 180 registros). Se pueden obtener server-side o client-side.
- **Decisión**: Obtener server-side en el Server Component y pasar como props.
- **Alternativas descartadas**:
  - Client-side fetch con loading state: Añade complejidad (useEffect, loading, error). Los datos no cambian durante la visualización.
  - Streaming con Suspense: Over-engineering para un dataset pequeño.
- **Consecuencias**:
  - (+) Sin loading spinner — los datos están disponibles en el primer render.
  - (+) La transformación de datos se hace en el servidor (menos JS en el cliente).
  - (-) El payload SSR incluye los datos de series temporales. Para actividades largas (3h+ → ~180 puntos), es aceptable.

### ADR-021: MetricsGrid como componente genérico reutilizable

- **Contexto**: El Detalle tiene 6 metric cards compactas. El Dashboard tiene 4 KPICards más grandes. Son visualmente similares pero con diferencias de tamaño y tendencia.
- **Decisión**: Crear `MetricsGrid` como componente genérico que acepta un array de métricas y renderiza cards compactas. No reutiliza `KPICard` del Dashboard.
- **Alternativas descartadas**:
  - Reutilizar `KPICard` con prop `compact`: `KPICard` tiene tendencia (badge up/down) que el detalle no necesita. Mezclar responsabilidades.
  - Un solo componente `MetricCard` con variantes: Posible pero las diferencias visuales (tamaño del valor, presencia de tendencia, padding) son suficientes para justificar componentes separados.
- **Consecuencias**:
  - (+) `MetricsGrid` es simple y genérico — acepta cualquier array de métricas.
  - (+) No tiene la complejidad del badge de tendencia.
  - (-) Algo de duplicación visual con `KPICard`. Aceptable para el MVP.

### ADR-022: BackButton con fallback a router.back()

- **Contexto**: El botón "Volver" puede navegar de vuelta a `/activities` (si el usuario viene de la lista) o al Dashboard (si viene de una actividad reciente). Se necesita determinar a dónde "volver".
- **Decisión**: Por defecto, usar `router.back()` que navega al entry anterior del historial. Opcionalmente, aceptar un `href` explícito.
- **Alternativas descartadas**:
  - Siempre navegar a `/activities`: Incorrecto si el usuario viene del Dashboard.
  - Usar referer header: No confiable en todos los navegadores y contextos.
- **Consecuencias**:
  - (+) Navega correctamente al origen real del usuario.
  - (+) Prop `href` permite forzar destino si se necesita.
  - (-) Si el usuario llega directamente por URL (deep link), `router.back()` sale de la app. Mitigación: verificar `window.history.length` y fallback a `/activities`.

---

## 7. Dependencias y Prerequisitos

### Paquetes npm a instalar

| Paquete | Workspace | Justificación |
|---------|-----------|---------------|
| Ninguno nuevo | — | `recharts` se instala con el Dashboard |

### Paquetes ya instalados (o por instalar con Dashboard)

| Paquete | Uso |
|---------|-----|
| `recharts` | AreaChart para gráficas temporales |
| `lucide-react` | Iconos: ArrowLeft, Activity, Clock, Zap, Heart, TrendingUp, Droplets, Sun, Moon |
| `@supabase/ssr` | Queries a Supabase server-side |
| `next` | Link, useRouter, notFound() |

### Componentes ya creados

| Componente | Fuente | Uso en Detalle |
|-----------|--------|---------------|
| `Sidebar` | `apps/web/src/components/sidebar.tsx` | Layout compartido |
| `RPEIndicator` | `apps/web/src/components/rpe-indicator.tsx` | Opcional — si se decide mostrar RPE en el detalle |

### Tablas Supabase

- ✅ `activities`: Query por ID con RLS.
- ✅ `activity_metrics`: Query por `activity_id`, ordenado por `timestamp_seconds`.

---

## 8. Riesgos y Consideraciones

### Riesgo 1: Actividad sin series temporales

**Descripción**: Las actividades creadas manualmente (form mock) no tendrán registros en `activity_metrics`. La gráfica no tendría datos.

**Mitigación**: Comprobar si `timeSeries` está vacío. Si lo está:
- La sección de gráficas muestra estado vacío: "No hay datos de series temporales para esta actividad."
- Las métricas (KPI cards) se muestran normalmente con los valores agregados.
- En futuro: para actividades mock, se podrían generar series temporales simuladas con `generateMockTimeSeries()`.

### Riesgo 2: ai_analysis con formato inesperado

**Descripción**: El campo `ai_analysis` es JSONB. Su estructura puede variar si se genera con diferentes versiones del prompt o si se edita manualmente.

**Mitigación**: Validar la estructura con un schema Zod antes de renderizar:
```typescript
const aiAnalysisSchema = z.object({
  summary: z.string(),
  recommendation: z.string(),
  tips: z.object({
    hydration: z.string().optional(),
    nutrition: z.string().optional(),
    sleep: z.string().optional(),
  }),
}).nullable();
```
Si la validación falla, tratar como null (mostrar placeholder).

### Riesgo 3: Actividad no encontrada (404)

**Descripción**: El usuario navega a `/activities/:id` con un ID inexistente, un UUID inválido, o una actividad de otro usuario.

**Mitigación**: Usar `notFound()` de Next.js que renderiza la página 404 del route group. El RLS de Supabase ya previene el acceso a actividades de otros usuarios (la query devuelve null).

### Riesgo 4: Performance de Recharts con muchos puntos

**Descripción**: Una actividad larga (3h+) genera ~180 data points. Recharts puede ser lento renderizando SVG con muchos puntos.

**Mitigación**:
- 180 puntos es un dataset pequeño para Recharts — no debería haber problemas de performance.
- Si fuese necesario, se puede hacer downsampling (ej: 1 punto cada 2 minutos para actividades >2h).
- Desactivar `dot={false}` en el `Area` para no renderizar puntos individuales (ya implementado en el mockup).

### Riesgo 5: Gradient SVG ID collision

**Descripción**: El mockup usa un `id="dg"` fijo para el gradient SVG del AreaChart. Si hay múltiples gráficas en la misma página, los IDs colisionan.

**Mitigación**: Usar un ID único por instancia del componente:
```typescript
const gradientId = useId(); // React 18+ hook
// o
const gradientId = `chart-gradient-${activeChart}`;
```

### Consideraciones de accesibilidad

- BackButton: `<button>` o `<Link>` con `aria-label="Volver a la lista de actividades"`.
- MetricsGrid: Cards con `aria-label` descriptivo (ej: "Distancia: 52.3 kilómetros").
- ActivityChart: Contenedor con `role="img"` y `aria-label="Gráfica de {serie activa} a lo largo del tiempo"`.
- Tabs de gráfica: `role="tablist"` con `role="tab"` y `aria-selected`.
- AIAnalysisCard: Estructura semántica con `<article>` o `<section>` y `aria-labelledby` al badge.
- Colores semánticos en análisis: No depender solo del color — el texto `<strong>` proporciona énfasis adicional.
