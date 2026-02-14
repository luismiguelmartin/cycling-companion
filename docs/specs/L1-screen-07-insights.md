# L1 — Spec Funcional: Insights / Comparar Periodos

> **Fuente**: `docs/design/cycling-companion-full-app.jsx`
> **Requisito PRD**: F07 — Comparar semanas / tendencias (P1)
> **Fecha**: 2026-02-14

---

## 1. Resumen de la Pantalla

La pantalla de Insights permite al usuario comparar dos periodos de entrenamiento (semanas) para visualizar su progresión. Muestra métricas comparativas, un radar de rendimiento multidimensional, y un análisis IA de la evolución.

| Pantalla | Componente JSX | Propósito |
|----------|---------------|-----------|
| **Insights / Comparar** | `InsightsPage` | Comparar dos periodos de entrenamiento con métricas cuantitativas, radar de rendimiento y análisis IA. |

**Requisito PRD asociado**: F07 — Comparativas de semanas y tendencias. Métricas comparadas: distancia, tiempo, potencia, FC, TSS, sesiones. Radar de rendimiento. Análisis IA.

---

## 2. Ruta y Navegación

### Rutas propuestas

| Pantalla | Ruta | Route Group |
|----------|------|-------------|
| Insights | `/insights` | `(app)` |

### Flujo de navegación

```
Sidebar "Insights" → /insights
                       │
               ┌───────┴────────┐
               │                │
       Con datos (≥2 sem)   Sin datos
               │                │
     Comparar periodos    "Necesitas al menos
               │           2 semanas de datos"
       ┌───────┼──────┐
       │       │      │
   Cambiar   Ver     Ver
   periodos  radar  análisis IA
```

### Condiciones de acceso

| Ruta | Auth requerida | Condición adicional |
|------|---------------|---------------------|
| `/insights` | Sí | Si no completó onboarding → redirect a `/onboarding` |

---

## 3. Componentes Identificados

### 3.1 InsightsHeader

| Campo | Valor |
|-------|-------|
| **Nombre** | `InsightsHeader` |
| **Tipo** | Server Component — solo renderiza texto |
| **Props** | Ninguna |
| **Estados** | Default único |
| **Tokens** | Título: `t1` (26px desktop / 22px mobile, weight 700). Subtítulo: `t3` (12-13px). |
| **Responsive** | Sin diferencias significativas. |
| **Contenido** | Título "Comparar periodos" + subtítulo "Analiza tu progresión entre semanas" |
| **Reutilizable** | No — específico de la pantalla Insights |

### 3.2 PeriodSelectors

| Campo | Valor |
|-------|-------|
| **Nombre** | `PeriodSelectors` |
| **Tipo** | Client Component — selectores interactivos |
| **Props** | `periodA: PeriodRange` (obligatoria), `periodB: PeriodRange` (obligatoria), `onChangePeriodA: (range: PeriodRange) => void` (obligatoria), `onChangePeriodB: (range: PeriodRange) => void` (obligatoria) |
| **Estados** | Default: dos badges con rango de fechas. Activo: selector de fechas abierto (futuro). |
| **Tokens** | Periodo A fondo: `rgba(59,130,246,0.08)`. Periodo A borde: `rgba(59,130,246,0.25)`. Periodo A indicador: `#3b82f6`. Periodo B fondo: `rgba(249,115,22,0.08)`. Periodo B borde: `rgba(249,115,22,0.25)`. Periodo B indicador: `#f97316`. Label: `t3` (10px). Rango: `t1` (13px, weight 600). Flecha: `t4` (16px). |
| **Responsive** | Desktop: en línea con flecha entre los dos. Mobile: wrap si es necesario. |
| **Contenido** | Badge Periodo A (azul) + flecha ArrowRight + Badge Periodo B (naranja) |
| **Reutilizable** | No — específico de la pantalla Insights |

**Diseño del badge de periodo**:

```
┌──────────────────────────┐
│ ■  Periodo A             │  ← Cuadrado color (10x10, radius 2) + label (10px, t3)
│    3 — 9 feb             │  ← Rango (13px, weight 600, t1)
└──────────────────────────┘
```

- Padding: `8px 14px`
- BorderRadius: 10px
- Cuadrado indicador: 10x10px, borderRadius 2px

**Nota MVP**: En la primera versión, los periodos son las dos últimas semanas (automáticos). La selección personalizada de periodos se implementará en una fase posterior. Los badges son informativos pero no interactivos inicialmente.

### 3.3 ComparisonMetricCard

| Campo | Valor |
|-------|-------|
| **Nombre** | `ComparisonMetricCard` |
| **Tipo** | Server Component — solo renderiza datos |
| **Props** | `metric: string` (obligatoria), `valueA: number` (obligatoria), `valueB: number` (obligatoria), `unit: string` (obligatoria), `inverse?: boolean` (opcional, default false) |
| **Estados** | Default único |
| **Tokens** | Card fondo: `card`. Card borde: `cardB`. Metric label: `t3` (11px). Valor A: `#3b82f6` (13px). Flecha: `t4` (separador "→"). Valor B: `t1` (18-22px, weight 700). Unidad: `t3` (11px). Delta positivo: `#22c55e` fondo `rgba(34,197,94,0.1)`. Delta negativo: `#ef4444` fondo `rgba(239,68,68,0.1)`. |
| **Responsive** | Desktop: grid 3 columnas. Mobile: grid 2 columnas. Padding 16px desktop, 12px mobile. |
| **Contenido** | Label métrica + valor A → valor B + unidad + badge delta % |
| **Reutilizable** | Sí — componente genérico de comparación reutilizable |

**Layout de la card**:

```
┌────────────────────────────────┐
│ Distancia                      │  ← Label (11px, t3)
│                                │
│ 165  →  187 km        +13.3%  │  ← Valor A (azul) → Valor B (grande) + delta
└────────────────────────────────┘
```

**Lógica del delta**:

```typescript
const delta = ((valueB - valueA) / valueA * 100).toFixed(1);
const isUp = delta > 0;
const isGood = inverse ? !isUp : isUp;
// isGood determina el color (verde=bueno, rojo=malo)
```

**Las 6 métricas comparadas**:

| # | Métrica | Unidad | Color | Inverse |
|---|---------|--------|-------|---------|
| 1 | Distancia | km | `#3b82f6` | false |
| 2 | Tiempo | h | `#8b5cf6` | false |
| 3 | Potencia | W | `#f97316` | false |
| 4 | FC media | bpm | `#ef4444` | **true** (bajar es positivo) |
| 5 | TSS | — | `#eab308` | false |
| 6 | Sesiones | — | `#22c55e` | false |

### 3.4 PerformanceRadarChart

| Campo | Valor |
|-------|-------|
| **Nombre** | `PerformanceRadarChart` |
| **Tipo** | Client Component — Recharts requiere acceso al DOM |
| **Props** | `data: Array<{ metric: string, A: number, B: number }>` (obligatoria) |
| **Estados** | Default único (sin interacción) |
| **Tokens** | Card fondo: `card`. Card borde: `cardB`. Título: `t1` (13px, weight 600). Grid polar: `t4` al 30%. Labels polares: `t2` (11px). Serie A: stroke `#3b82f6`, fill `#3b82f6` al 12%. Serie B: stroke `#f97316`, fill `#f97316` al 12%. |
| **Responsive** | Height 260px desktop, 220px mobile. |
| **Contenido** | Título "Perfil de rendimiento" + RadarChart con 2 series + leyenda |
| **Reutilizable** | No — específico de la pantalla Insights |

**Configuración Recharts**:
- `RadarChart` con 5 dimensiones
- `PolarGrid`: stroke `{t4}30` (sutil)
- `PolarAngleAxis`: dataKey `"m"`, tick color `t2`, fontSize 11
- `Radar` serie A: `dataKey="A"`, stroke `#3b82f6`, fill `#3b82f6`, fillOpacity 0.12, strokeWidth 2
- `Radar` serie B: `dataKey="B"`, stroke `#f97316`, fill `#f97316`, fillOpacity 0.12, strokeWidth 2

**Las 5 dimensiones del radar**:

| Dimensión | Cálculo (aproximado) |
|-----------|---------------------|
| Volumen | Basado en distancia total + duración |
| Intensidad | Basado en potencia media + TSS/hora |
| Consistencia | Basado en frecuencia de sesiones + varianza |
| Recuperación | Basado en días de descanso + sesiones recovery |
| Progresión | Basado en delta de potencia + tendencia FTP |

**Valores**: Escala 0-100 para cada dimensión. Normalizados respecto a objetivos del usuario.

**Leyenda**:

| Color | Indicador | Label |
|-------|-----------|-------|
| `#3b82f6` | Cuadrado 8x8px, radius 2px | "Anterior" |
| `#f97316` | Cuadrado 8x8px, radius 2px | "Actual" |

Centrada debajo del radar, con gap 16px entre items.

### 3.5 AIInsightsCard

| Campo | Valor |
|-------|-------|
| **Nombre** | `AIInsightsCard` |
| **Tipo** | Server Component — renderiza texto |
| **Props** | `analysis: InsightsAnalysis` (obligatoria) |
| **Estados** | Default único |
| **Tokens** | Fondo: `aiBg` (gradient naranja sutil). Borde: `aiB`. Badge "ANÁLISIS IA": gradient naranja + texto `#f97316` uppercase (12px, weight 700). Texto: `t2` (13px, line-height 1.7). Highlights: `t1` para strong, `#f97316` para potencia, `#eab308` para alertas, `#3b82f6` para recomendaciones. |
| **Responsive** | Padding 20px desktop, 14px mobile. |
| **Contenido** | Badge "ANÁLISIS IA" (Zap icon) + 2-3 párrafos de análisis con highlights en color |
| **Reutilizable** | Sí — variante de AICoachCard. Mismo patrón visual (badge + gradient). |

**Estructura del análisis**:

| Párrafo | Contenido | Highlights |
|---------|-----------|------------|
| 1 | Resumen principal | "Progresión positiva" en `t1`. Potencia delta en `#f97316`. |
| 2 | Alertas/atención | "Atención:" en `#eab308`. Datos de TSS y recuperación. |
| 3 | Recomendación | Sugerencia de ajuste para la próxima semana. |

**Datos del análisis**:

```typescript
interface InsightsAnalysis {
  summary: string;       // "Progresión positiva. Potencia +5% con FC estable..."
  alert?: string;        // "TSS +17%, recuperación bajó..."
  recommendation: string; // "Mantén 5-6 sesiones..."
}
```

---

## 4. Jerarquía de Componentes

```
AppLayout (layout.tsx — Server Component)
├── Sidebar (Client) ♻️
│
└── InsightsPage (page.tsx — Server Component)
    ├── InsightsHeader (Server)
    │   ├── Título "Comparar periodos"
    │   └── Subtítulo
    │
    ├── PeriodSelectors (Client)
    │   ├── Badge Periodo A (azul)
    │   ├── ArrowRight
    │   └── Badge Periodo B (naranja)
    │
    ├── ComparisonGrid (Server)
    │   └── ComparisonMetricCard ×6
    │       ├── Distancia
    │       ├── Tiempo
    │       ├── Potencia
    │       ├── FC media (inverse)
    │       ├── TSS
    │       └── Sesiones
    │
    ├── PerformanceRadarChart (Client — Recharts)
    │   ├── RadarChart (2 series)
    │   └── Leyenda (Anterior / Actual)
    │
    └── AIInsightsCard (Server) ♻️
        ├── Badge "ANÁLISIS IA"
        └── Párrafos de análisis con highlights
```

**Leyenda**: ♻️ = Componente reutilizable

---

## 5. Datos Necesarios

### Datos del Servidor

| Dato | Fuente | Cuándo |
|------|--------|--------|
| Actividades periodo A | `supabase.from('activities').select(...)` filtradas por rango de fechas del periodo A | Al cargar `/insights` |
| Actividades periodo B | `supabase.from('activities').select(...)` filtradas por rango de fechas del periodo B | Al cargar `/insights` |
| Perfil del usuario | `supabase.from('users').select('ftp, goal')` | Al cargar `/insights` |

### Datos calculados (server-side)

| Dato | Cálculo | Componente consumidor |
|------|---------|----------------------|
| Métricas periodo A | Agregaciones (SUM dist, SUM time, AVG power, AVG hr, SUM tss, COUNT) | ComparisonMetricCard |
| Métricas periodo B | Agregaciones (SUM dist, SUM time, AVG power, AVG hr, SUM tss, COUNT) | ComparisonMetricCard |
| Deltas porcentuales | `((B - A) / A) * 100` por cada métrica | ComparisonMetricCard |
| Dimensiones radar | Normalización 0-100 de volumen, intensidad, consistencia, recuperación, progresión | PerformanceRadarChart |
| Análisis IA | Claude API o heurísticas simples | AIInsightsCard |

### Datos del Cliente (Estado Local)

| Dato | Tipo | Componente | Valor inicial |
|------|------|-----------|---------------|
| `periodA` | `PeriodRange` | PeriodSelectors | Semana anterior (calculada) |
| `periodB` | `PeriodRange` | PeriodSelectors | Semana actual (calculada) |

### Contrato de datos

```typescript
interface PeriodRange {
  start: string;  // ISO date
  end: string;    // ISO date
  label: string;  // "3 — 9 feb"
}

interface PeriodMetrics {
  distanceKm: number;
  durationHours: number;
  avgPower: number | null;
  avgHR: number | null;
  totalTSS: number;
  sessionCount: number;
}

interface ComparisonMetric {
  metric: string;
  valueA: number;
  valueB: number;
  unit: string;
  color: string;
  inverse?: boolean;
}

interface RadarDimension {
  metric: string;   // "Volumen", "Intensidad", etc.
  A: number;        // Valor periodo A (0-100)
  B: number;        // Valor periodo B (0-100)
}

interface InsightsAnalysis {
  summary: string;
  alert?: string;
  recommendation: string;
}

interface InsightsData {
  periodA: PeriodRange;
  periodB: PeriodRange;
  metricsA: PeriodMetrics;
  metricsB: PeriodMetrics;
  comparisonMetrics: ComparisonMetric[];
  radarData: RadarDimension[];
  aiAnalysis: InsightsAnalysis | null;
}
```

---

## 6. Flujos de Interacción

### Flujo 1: Carga inicial de Insights (flujo feliz)

1. Usuario navega a `/insights` desde el Sidebar.
2. Server Component calcula los periodos por defecto (semana anterior vs semana actual).
3. Obtiene actividades de ambos periodos de Supabase.
4. Calcula métricas agregadas por periodo.
5. Calcula deltas porcentuales y dimensiones del radar.
6. Genera análisis IA (heurísticas o caché).
7. Renderiza todas las secciones.

### Flujo 2: Insights sin datos suficientes

1. Usuario nuevo con menos de 2 semanas de datos.
2. Se muestra estado vacío: "Necesitas al menos 2 semanas de datos para comparar periodos."
3. Subtexto: "Sigue entrenando y podrás ver tu progresión aquí."
4. Las secciones de métricas, radar y análisis no se renderizan.

### Flujo 3: Insights con un periodo vacío

1. Usuario tiene datos en periodo B (actual) pero no en periodo A (anterior).
2. Las metric cards del periodo A muestran "—" o "0".
3. Los deltas no se calculan (se muestran como "—" en lugar de porcentaje).
4. El radar solo muestra la serie B (la serie A no se renderiza o se muestra en 0).
5. El análisis IA se adapta: "Esta es tu primera semana con datos. La comparativa estará disponible la próxima semana."

### Flujo 4: Cambiar periodos (futuro)

1. En el MVP, los periodos se calculan automáticamente.
2. En futuro: usuario hace clic en un badge de periodo.
3. Se abre un selector de rango de fechas.
4. Selecciona nuevas fechas → se recalculan todas las métricas.
5. El radar y el análisis IA se actualizan.

### Flujo 5: FC baja = positivo (inverse logic)

1. El periodo A tiene FC media 145 bpm.
2. El periodo B tiene FC media 143 bpm.
3. Delta: -1.4%.
4. Con `inverse: true`, bajar la FC se interpreta como positivo.
5. El badge delta muestra "-1.4%" en **verde** (no rojo).
6. Esto indica mejor eficiencia cardiovascular.

---

## 7. Tokens de Tema Aplicables

### Insights

| Elemento | Token | Dark | Light |
|----------|-------|------|-------|
| Fondo página | `bg` | `#0c1320` | `#f8f9fb` |
| Card fondo | `card` | `rgba(255,255,255,0.02)` | `#ffffff` |
| Card borde | `cardB` | `rgba(255,255,255,0.06)` | `#e2e8f0` |
| Título (h1) | `t1` | `#f1f5f9` | `#0f172a` |
| Subtítulo | `t3` | `#64748b` | `#64748b` |
| Periodo A fondo | — | `rgba(59,130,246,0.08)` | `rgba(59,130,246,0.08)` |
| Periodo A borde | — | `rgba(59,130,246,0.25)` | `rgba(59,130,246,0.25)` |
| Periodo A indicador | — | `#3b82f6` | `#3b82f6` |
| Periodo B fondo | — | `rgba(249,115,22,0.08)` | `rgba(249,115,22,0.08)` |
| Periodo B borde | — | `rgba(249,115,22,0.25)` | `rgba(249,115,22,0.25)` |
| Periodo B indicador | — | `#f97316` | `#f97316` |
| Metric label | `t3` | `#64748b` | `#64748b` |
| Valor A | — | `#3b82f6` | `#3b82f6` |
| Valor B | `t1` | `#f1f5f9` | `#0f172a` |
| Flecha separador | `t4` | `#475569` | `#94a3b8` |
| Delta positivo texto | — | `#22c55e` | `#22c55e` |
| Delta positivo fondo | — | `rgba(34,197,94,0.1)` | `rgba(34,197,94,0.1)` |
| Delta negativo texto | — | `#ef4444` | `#ef4444` |
| Delta negativo fondo | — | `rgba(239,68,68,0.1)` | `rgba(239,68,68,0.1)` |
| Radar grid | `t4` al 30% | `rgba(71,85,105,0.3)` | `rgba(148,163,184,0.3)` |
| Radar labels | `t2` | `#94a3b8` | `#475569` |
| Radar serie A | — | `#3b82f6` | `#3b82f6` |
| Radar serie B | — | `#f97316` | `#f97316` |
| AI Coach fondo | `aiBg` | `linear-gradient(135deg, rgba(249,115,22,0.08), rgba(234,88,12,0.04))` | `linear-gradient(135deg, rgba(249,115,22,0.06), rgba(234,88,12,0.02))` |
| AI Coach borde | `aiB` | `rgba(249,115,22,0.18)` | `rgba(249,115,22,0.2)` |

---

## 8. Componentes Reutilizables

| Componente | Usado en Insights | Reutilizado de | shadcn/ui base | Crear custom |
|------------|------------------|----------------|----------------|--------------|
| **Sidebar** | Layout | Dashboard (compartido) | No — custom | Ya existe ♻️ |
| **ThemeToggle** | Sidebar | Auth flow (ya existe) | No — custom | Ya existe ♻️ |
| **ComparisonMetricCard** | Grid de métricas (6) | Nuevo | No — custom | Sí |
| **PerformanceRadarChart** | Radar central | Nuevo — Recharts | No — Recharts | Sí |
| **AIInsightsCard** | Análisis IA | Variante de AICoachCard | No — custom | Sí (patrón AICard) |
| **PeriodSelectors** | Selectores de periodo | Nuevo | No — custom | Sí |

---

## 9. Transformaciones JSX Necesarias

### Grid de métricas → Tailwind responsive

```jsx
// ❌ Mockup (inline)
<div style={{
  display: "grid",
  gridTemplateColumns: mob ? "repeat(2,1fr)" : "repeat(3,1fr)",
  gap: 10
}}>

// ✅ Proyecto (Tailwind)
<div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
```

### Comparison metric card

```jsx
// ❌ Mockup (inline)
<div style={{
  background: t.card,
  border: `1px solid ${t.cardB}`,
  borderRadius: 12,
  padding: mob ? 12 : 16
}}>
  <div style={{ fontSize: 11, color: t.t3 }}>{m.m}</div>
  <div>
    <span style={{ fontSize: 13, color: "#3b82f6" }}>{m.A}</span>
    <span style={{ color: t.t4, margin: "0 6px" }}>→</span>
    <span style={{ fontSize: mob ? 18 : 22, fontWeight: 700, color: t.t1 }}>{m.B}</span>
    <span style={{ fontSize: 11, color: t.t3, marginLeft: 3 }}>{m.u}</span>
  </div>
  <span style={{
    color: good ? "#22c55e" : "#ef4444",
    background: good ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
  }}>{delta}%</span>
</div>

// ✅ Proyecto (Tailwind)
<div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-3 md:p-4">
  <div className="text-[11px] text-slate-500 mb-2">{metric}</div>
  <div className="flex items-baseline justify-between">
    <div>
      <span className="text-[13px] text-blue-500">{valueA}</span>
      <span className="text-slate-400 dark:text-slate-600 mx-1.5">→</span>
      <span className="text-lg md:text-[22px] font-bold text-slate-900 dark:text-slate-100">{valueB}</span>
      <span className="text-[11px] text-slate-500 ml-1">{unit}</span>
    </div>
    <span className={cn(
      "text-xs font-semibold px-1.5 py-0.5 rounded-[5px]",
      isGood ? "text-green-500 bg-green-500/10" : "text-red-500 bg-red-500/10"
    )}>
      {delta}%
    </span>
  </div>
</div>
```

### Period selector badges

```jsx
// ❌ Mockup (inline)
<div style={{
  display: "flex", alignItems: "center", gap: 8,
  padding: "8px 14px", borderRadius: 10,
  background: "rgba(59,130,246,0.08)",
  border: "1px solid rgba(59,130,246,0.25)"
}}>

// ✅ Proyecto (Tailwind)
<div className="flex items-center gap-2 px-3.5 py-2 rounded-[10px] bg-blue-500/[0.08] border border-blue-500/25">
```

### RadarChart (Recharts — se reutiliza directamente)

```jsx
// ❌ Mockup
<RadarChart data={radarD}>
  <PolarGrid stroke={`${t.t4}30`} />
  <PolarAngleAxis dataKey="m" tick={{ fill: t.t2, fontSize: 11 }} />
  <Radar name="Anterior" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.12} strokeWidth={2} />
  <Radar name="Actual" dataKey="B" stroke="#f97316" fill="#f97316" fillOpacity={0.12} strokeWidth={2} />
</RadarChart>

// ✅ Proyecto (Recharts — misma API, solo cambiar tokens a CSS vars)
<RadarChart data={radarData}>
  <PolarGrid stroke="var(--grid-color)" />
  <PolarAngleAxis dataKey="metric" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
  <Radar name="Anterior" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.12} strokeWidth={2} />
  <Radar name="Actual" dataKey="B" stroke="#f97316" fill="#f97316" fillOpacity={0.12} strokeWidth={2} />
</RadarChart>
```

---

## 10. Dependencias Externas

### Paquetes npm

| Paquete | Uso | Ya instalado |
|---------|-----|-------------|
| `lucide-react` | Iconos: Zap, ArrowRight | Sí |
| `recharts` | RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer | Por instalar (con Dashboard) |
| `next-themes` | Toggle de tema en Sidebar | Sí |
| `@supabase/ssr` | Queries a Supabase (server-side) | Sí |

### Componentes shadcn/ui a instalar

Ninguno nuevo para esta pantalla.

### Integraciones

| Servicio | Uso | Estado |
|----------|-----|--------|
| Supabase DB (tabla `activities`) | Queries de actividades por rango de fechas | ✅ Tabla creada |
| Supabase DB (tabla `users`) | Perfil del usuario (FTP, goal) | ✅ Tabla creada |
| Fastify API (GET /api/v1/insights) | Endpoint de comparativa | ❌ Por implementar (alternativa: cálculo en Server Component) |
| Claude API | Análisis comparativo IA | ❌ Por implementar |

---

## Apéndice: Datos Mock de Insights

```typescript
export const MOCK_COMPARISON_METRICS: ComparisonMetric[] = [
  { metric: "Distancia", valueA: 165, valueB: 187, unit: "km", color: "#3b82f6" },
  { metric: "Tiempo", valueA: 7.5, valueB: 8.75, unit: "h", color: "#8b5cf6" },
  { metric: "Potencia", valueA: 182, valueB: 191, unit: "W", color: "#f97316" },
  { metric: "FC media", valueA: 145, valueB: 143, unit: "bpm", color: "#ef4444", inverse: true },
  { metric: "TSS", valueA: 350, valueB: 410, unit: "", color: "#eab308" },
  { metric: "Sesiones", valueA: 5, valueB: 6, unit: "", color: "#22c55e" },
];

export const MOCK_RADAR_DATA: RadarDimension[] = [
  { metric: "Volumen", A: 75, B: 88 },
  { metric: "Intensidad", A: 70, B: 78 },
  { metric: "Consistencia", A: 80, B: 90 },
  { metric: "Recuperación", A: 85, B: 72 },
  { metric: "Progresión", A: 65, B: 82 },
];

export const MOCK_AI_ANALYSIS: InsightsAnalysis = {
  summary: "Progresión positiva. Potencia +5% con FC estable: mejor eficiencia cardiovascular.",
  alert: "TSS +17%, recuperación bajó del 85% al 72%. Próxima semana debería ser de descarga (-30% volumen).",
  recommendation: "Mantén 5-6 sesiones. Para descarga, reduce a 4 con intensidad baja-media.",
};
```
