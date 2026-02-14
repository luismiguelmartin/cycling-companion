# L1 — Spec Funcional: Detalle de Actividad

> **Fuente**: `docs/design/cycling-companion-full-app.jsx`
> **Requisito PRD**: F05 — Detalle de actividad (P0)
> **Fecha**: 2026-02-14

---

## 1. Resumen de la Pantalla

La pantalla de Detalle de Actividad muestra la vista completa de una sesión de entrenamiento: métricas clave en cards, gráficas temporales interactivas (potencia, FC, cadencia) y un análisis generado por IA con recomendaciones.

| Pantalla | Componente JSX | Propósito |
|----------|---------------|-----------|
| **Detalle de Actividad** | `DetailPage` | Vista completa de una sesión: 6 KPI cards, gráficas temporales con selector, análisis IA con tips. |

**Requisito PRD asociado**: F05 — Vista completa de una sesión. KPI Cards (6), gráficas temporales (potencia/FC/cadencia), RPE, análisis IA, notas personales, checkbox sesión de referencia.

---

## 2. Ruta y Navegación

### Rutas propuestas

| Pantalla | Ruta | Route Group |
|----------|------|-------------|
| Detalle de Actividad | `/activities/[id]` | `(app)` |

### Flujo de navegación

```
/activities (lista) → clic en actividad → /activities/:id
/ (dashboard) → clic en actividad reciente → /activities/:id
                                                    │
                                            ┌───────┴────────┐
                                            │                │
                                      Botón "Volver"    Ver gráficas
                                            │            (tabs: Potencia/FC/Cadencia)
                                    /activities (lista)        │
                                                          Cambiar tab
```

### Condiciones de acceso

| Ruta | Auth requerida | Condición adicional |
|------|---------------|---------------------|
| `/activities/[id]` | Sí | La actividad debe pertenecer al usuario (RLS) |

---

## 3. Componentes Identificados

### 3.1 BackButton

| Campo | Valor |
|-------|-------|
| **Nombre** | `BackButton` |
| **Tipo** | Client Component — navega al hacer clic |
| **Props** | Ninguna (usa `router.back()` o navega a `/activities`) |
| **Estados** | Default único |
| **Tokens** | Contenedor icono: 28x28px, borderRadius 6px, fondo `inBg`, borde `inB`. Icono `ArrowLeft`: 14px, color `t2`. Texto "Volver": 12px, color `t3`. |
| **Responsive** | Sin diferencias |
| **Contenido** | Icono contenedor + `ArrowLeft` + texto "Volver" |
| **Reutilizable** | Sí — patrón de navegación de retorno reutilizable en cualquier pantalla de detalle |

### 3.2 DetailHeader

| Campo | Valor |
|-------|-------|
| **Nombre** | `DetailHeader` |
| **Tipo** | Server Component — renderiza datos de la actividad |
| **Props** | `name: string` (obligatoria), `type: ActivityType` (obligatoria), `date: string` (obligatoria) |
| **Estados** | Default único |
| **Tokens** | Nombre: `t1` (26px desktop / 20px mobile, weight 700). Badge tipo: color por tipo (ver tabla). Fecha: `t3` (12px). |
| **Responsive** | Desktop: título 26px. Mobile: título 20px. |
| **Contenido** | Nombre de la actividad (h1) + badge de tipo + fecha formateada |
| **Reutilizable** | No — específico del detalle |

**Badge de tipo**: Mismo estilo que en la Lista de Actividades.
- Font: 11px, weight 500
- Padding: `2px 8px`, borderRadius: 5px
- Fondo: color del tipo al 10%, texto: color sólido

**Fecha**: Formato "14 feb 2026" (día + mes abreviado + año).

### 3.3 MetricsGrid

| Campo | Valor |
|-------|-------|
| **Nombre** | `MetricsGrid` |
| **Tipo** | Server Component — renderiza 6 metric cards |
| **Props** | `metrics: MetricItem[]` (obligatoria, array de 6 items) |
| **Estados** | Default único |
| **Tokens** | Card fondo: `card`. Card borde: `cardB`. BorderRadius: 10px. Padding: 12px desktop / 8px mobile. Icono: 12px, color semántico. Label: `t3` (10px). Valor: `t1` (20px desktop / 16px mobile, weight 700). Unidad: `t3` (10px, marginLeft 2px). |
| **Responsive** | Desktop: grid 6 cols. Mobile: grid 3 cols (2 filas de 3). |
| **Contenido** | 6 cards con icono + label + valor + unidad |
| **Reutilizable** | Parcialmente — reutiliza el patrón de `KPICard` con diseño más compacto |

**Las 6 métricas**:

| # | Icono | Color | Label | Valor fuente | Unidad |
|---|-------|-------|-------|-------------|--------|
| 1 | `Activity` | `#3b82f6` (azul) | Dist. | `distance_km` | km |
| 2 | `Clock` | `#8b5cf6` (violeta) | Tiempo | `duration_seconds` (formateado) | h |
| 3 | `Zap` | `#f97316` (naranja) | Pot. | `avg_power_watts` | W |
| 4 | `Heart` | `#ef4444` (rojo) | FC | `avg_hr_bpm` | bpm |
| 5 | `TrendingUp` | `#22c55e` (verde) | Cadencia | `avg_cadence_rpm` | rpm |
| 6 | `Zap` | `#eab308` (amarillo) | TSS | `tss` | — |

**Diseño de cada metric card**:
```
┌──────────────────┐
│ [Icon] Label     │
│                  │
│ 52.3 km          │
└──────────────────┘
```
- Icono (12px) + label en línea arriba, con gap de 5px
- Valor grande debajo, con unidad en `t3` pegada al número

### 3.4 ActivityChart

| Campo | Valor |
|-------|-------|
| **Nombre** | `ActivityChart` |
| **Tipo** | Client Component — Recharts + selector de tab interactivo |
| **Props** | `data: Array<{ min: number, power: number, hr: number, cadence: number }>` (obligatoria) |
| **Estados** | Tab activa: `power` (default) / `hr` / `cadence`. |
| **Tokens** | Card fondo: `card`. Card borde: `cardB`. BorderRadius: 14px. Padding: 18px desktop / 12px mobile. Título: `t1` (13px, weight 600). Tab activa: fondo `{color}15`, borde `{color}40`, texto `{color}`. Tab inactiva: fondo transparente, borde `inB`, texto `t3`. Grid: `rgba(255,255,255,0.04)` (dark) / `#e2e8f0` (light). |
| **Responsive** | Height: 220px desktop, 160px mobile. Card padding: 18px desktop, 12px mobile. |
| **Contenido** | Título "Gráficas" + selector de tabs (Potencia/FC/Cadencia) + AreaChart |
| **Reutilizable** | Parcialmente — el patrón de AreaChart con gradient reutiliza el de `PowerTrendChart` del Dashboard |

**Tabs de selección**:

| Tab | Key | Color | Label |
|-----|-----|-------|-------|
| Potencia | `power` | `#f97316` | Potencia |
| FC | `hr` | `#ef4444` | FC |
| Cadencia | `cadence` | `#8b5cf6` | Cadencia |

**Estilo de tabs**:
- Padding: `3px 10px`, borderRadius: 5px
- Font: 11px
- Activa: fondo `{color}` al 15%, borde `1px solid {color}40`, texto `{color}`
- Inactiva: fondo transparente, borde `1px solid inB`, texto `t3`

**Configuración Recharts (AreaChart)**:
- `AreaChart` con datos de series temporales
- `defs` → `linearGradient` vertical: color de la serie al 25% opacidad → 0%
- `CartesianGrid`: stroke `t.grid`
- `XAxis`: dataKey `min`, tick fontSize 10 color `t3`, axisLine/tickLine false, formatter `` `${v}'` ``
- `YAxis`: tick fontSize 10 color `t3`, axisLine/tickLine false
- `Tooltip`: fondo `ttBg`, borde `ttB`, borderRadius 8, fontSize 11, color `t1`
- `Area`: type `monotone`, dataKey según tab activa, stroke `{color}`, strokeWidth 1.5, fill `url(#dg)`, dot false

### 3.5 AIAnalysisCard

| Campo | Valor |
|-------|-------|
| **Nombre** | `AIAnalysisCard` |
| **Tipo** | Server Component — renderiza texto de análisis |
| **Props** | `analysis: AIAnalysis` (obligatoria) |
| **Estados** | Con análisis: contenido completo. Sin análisis (null): placeholder "Análisis no disponible todavía." |
| **Tokens** | Fondo: `aiBg` (gradient naranja sutil). Borde: `aiB`. BorderRadius: 14px. Padding: 20px desktop / 14px mobile. Badge: gradient naranja, texto `#f97316` uppercase (12px, weight 700). Texto análisis: `t2` (13px, line-height 1.7). Highlights: `#f97316` (potencia), `#22c55e` (positivo), `#3b82f6` (recomendación). Separador tips: `rgba(249,115,22,0.12)`. |
| **Responsive** | Sin diferencias significativas. Padding 20px desktop, 14px mobile. Tips con flex-wrap. |
| **Contenido** | Badge "ANÁLISIS IA" (Zap icon + texto) + texto de análisis con highlights + separador + 3 tips |
| **Reutilizable** | Sí — variante de `AICoachCard` del Dashboard. Patrón compartido con badge, separador y tips |

**Badge "ANÁLISIS IA"**:
- Icono Zap (13px, blanco) sobre fondo gradient naranja (28x28px, borderRadius 8px)
- Texto "ANÁLISIS IA": 12px, weight 700, uppercase, color `#f97316`
- Gap: 8px entre icono y texto

**Texto de análisis**:
- Dos párrafos:
  1. Resumen de la sesión con highlights en colores semánticos (potencia en naranja, eficiencia en verde)
  2. Recomendación para la siguiente sesión (en azul)
- Font: 13px, line-height 1.7, color `t2`
- `<strong>` tags para highlights con colores semánticos

**Tips (debajo del separador)**:

| Icono | Color | Ejemplo contenido |
|-------|-------|------------------|
| `Droplets` | `#3b82f6` (azul) | "Electrolitos +500ml" |
| `Sun` | `#eab308` (amarillo) | "60g carbs 2h" |
| `Moon` | `#8b5cf6` (violeta) | "Mín 8h sueño" |

- Font: 11px, color `t2`
- Separador: `1px solid rgba(249,115,22,0.12)`, marginTop 12px, paddingTop 10px
- Tips en flex con gap 14px desktop / 8px mobile, flex-wrap

**Diferencia con AICoachCard del Dashboard**: El badge dice "ANÁLISIS IA" en vez de "ENTRENADOR IA". El contenido es específico de la actividad en lugar de una recomendación diaria general. Los tips son de recuperación post-sesión en lugar de tips generales.

---

## 4. Jerarquía de Componentes

```
AppLayout (layout.tsx — Server Component)
├── Sidebar (Client) ♻️
│
└── ActivityDetailPage (page.tsx — Server Component)
    ├── BackButton (Client)
    │   ├── Icono contenedor (ArrowLeft)
    │   └── Texto "Volver"
    │
    ├── DetailHeader (Server)
    │   ├── Nombre de la actividad (h1)
    │   ├── Badge de tipo
    │   └── Fecha
    │
    ├── MetricsGrid (Server)
    │   └── MetricCard ×6
    │       ├── Icono + Label
    │       └── Valor + Unidad
    │
    ├── ActivityChart (Client — Recharts)
    │   ├── Título "Gráficas"
    │   ├── Tabs selector (Potencia / FC / Cadencia)
    │   └── AreaChart con gradient
    │       └── Series temporales (min → valor)
    │
    └── AIAnalysisCard (Server) ♻️
        ├── Badge "ANÁLISIS IA" (Zap icon)
        ├── Texto de análisis (2 párrafos, highlights)
        ├── Separador
        └── Tips ×3 (Droplets, Sun, Moon)
```

**Leyenda**: ♻️ = Componente reutilizable

---

## 5. Datos Necesarios

### Datos del Servidor

| Dato | Fuente | Cuándo |
|------|--------|--------|
| Actividad completa | `supabase.from('activities').select('*').eq('id', params.id)` | Al cargar `/activities/:id` |
| Series temporales | `supabase.from('activity_metrics').select('*').eq('activity_id', params.id).order('timestamp_seconds')` | Al cargar la página |
| Perfil del usuario (para layout) | Compartido desde layout `(app)` | Al cargar la página |

### Datos calculados (server-side)

| Dato | Cálculo | Componente consumidor |
|------|---------|----------------------|
| Duración formateada | `formatDuration(duration_seconds)` → "1:45" | MetricsGrid |
| Fecha formateada | `formatDate(date)` → "14 feb 2026" | DetailHeader |
| Series temporales procesadas | Mapear `activity_metrics` a formato Recharts | ActivityChart |

### Contrato de datos

```typescript
interface ActivityDetailData {
  activity: {
    id: string;
    name: string;
    date: string;               // ISO date
    type: ActivityType;
    distance_km: number | null;
    duration_seconds: number;
    avg_power_watts: number | null;
    avg_hr_bpm: number | null;
    max_hr_bpm: number | null;
    avg_cadence_rpm: number | null;
    tss: number | null;
    rpe: number | null;
    ai_analysis: AIAnalysis | null;
    notes: string | null;
    is_reference: boolean;
  };

  timeSeries: Array<{
    min: number;               // minuto (offset desde inicio)
    power: number;             // watts
    hr: number;                // bpm
    cadence: number;           // rpm
  }>;
}

interface AIAnalysis {
  summary: string;              // Texto del análisis (HTML con <strong> tags)
  recommendation: string;       // Recomendación para siguiente sesión
  tips: {
    hydration?: string;         // Ej: "Electrolitos +500ml"
    nutrition?: string;         // Ej: "60g carbs 2h"
    sleep?: string;             // Ej: "Mín 8h sueño"
  };
}
```

---

## 6. Flujos de Interacción

### Flujo 1: Carga del detalle (flujo feliz)

1. Usuario navega a `/activities/:id` (desde la lista o el dashboard).
2. Server Component obtiene la actividad y sus series temporales de Supabase.
3. Renderiza el header con nombre, badge de tipo y fecha.
4. Renderiza las 6 métricas en grid.
5. Renderiza la gráfica con tab "Potencia" activa por defecto.
6. Renderiza el análisis IA (si existe).

### Flujo 2: Cambiar gráfica

1. La gráfica muestra "Potencia" por defecto (AreaChart naranja).
2. Usuario hace clic en tab "FC".
3. La gráfica cambia a AreaChart rojo con datos de frecuencia cardíaca.
4. El gradient y el color de la línea se actualizan al color de la serie (rojo).
5. El usuario puede cambiar a "Cadencia" (violeta).

### Flujo 3: Volver a la lista

1. Usuario hace clic en "Volver" (esquina superior izquierda).
2. Navega de vuelta a `/activities`.

### Flujo 4: Actividad sin series temporales

1. La actividad se creó manualmente (form mock) sin datos de series.
2. Las métricas (KPI cards) se muestran normalmente con los valores disponibles.
3. La sección de gráficas muestra un estado vacío: "No hay datos de series temporales para esta actividad."
4. El análisis IA se muestra si existe (puede haberse generado solo con las métricas agregadas).

### Flujo 5: Actividad sin análisis IA

1. La actividad no tiene `ai_analysis` (null).
2. El AIAnalysisCard muestra un placeholder: "El análisis IA se generará automáticamente cuando esté disponible."
3. En futuro: botón "Generar análisis" que llama a la API de Claude.

### Flujo 6: Actividad no encontrada

1. El usuario navega a `/activities/:id` con un ID inexistente o de otro usuario.
2. Supabase devuelve null (RLS bloquea acceso a actividades de otros usuarios).
3. Mostrar pantalla de error: "Actividad no encontrada" con enlace "Volver a actividades".

### Flujo 7: Métricas con valores null

1. Algunos campos pueden ser null (cadencia, TSS, potencia).
2. En el MetricsGrid, las métricas con valor null muestran "—" en lugar del número.
3. En la gráfica, si no hay datos de una serie, la tab correspondiente puede ocultarse o mostrar estado vacío.

---

## 7. Tokens de Tema Aplicables

### Detalle de Actividad

| Elemento | Token | Dark | Light |
|----------|-------|------|-------|
| Fondo página | `bg` | `#0c1320` | `#f8f9fb` |
| Botón volver fondo | `inBg` | `rgba(255,255,255,0.03)` | `#f8fafc` |
| Botón volver borde | `inB` | `rgba(255,255,255,0.08)` | `#e2e8f0` |
| Botón volver icono | `t2` | `#94a3b8` | `#475569` |
| Botón volver texto | `t3` | `#64748b` | `#64748b` |
| Nombre actividad (h1) | `t1` | `#f1f5f9` | `#0f172a` |
| Fecha | `t3` | `#64748b` | `#64748b` |
| Metric card fondo | `card` | `rgba(255,255,255,0.02)` | `#ffffff` |
| Metric card borde | `cardB` | `rgba(255,255,255,0.06)` | `#e2e8f0` |
| Metric label | `t3` | `#64748b` | `#64748b` |
| Metric valor | `t1` | `#f1f5f9` | `#0f172a` |
| Metric unidad | `t3` | `#64748b` | `#64748b` |
| Gráfica card fondo | `card` | `rgba(255,255,255,0.02)` | `#ffffff` |
| Gráfica card borde | `cardB` | `rgba(255,255,255,0.06)` | `#e2e8f0` |
| Gráfica grid | `grid` | `rgba(255,255,255,0.04)` | `#e2e8f0` |
| Gráfica ejes texto | `t3` | `#64748b` | `#64748b` |
| Gráfica tooltip fondo | `ttBg` | `rgba(15,25,35,0.95)` | `#ffffff` |
| Gráfica tooltip borde | `ttB` | `rgba(255,255,255,0.1)` | `#e2e8f0` |
| Tab gráfica activa fondo | — | `{color}15` | `{color}10` |
| Tab gráfica activa borde | — | `{color}40` | `{color}40` |
| Tab gráfica activa texto | — | `{color}` | `{color}` |
| Tab gráfica inactiva borde | `inB` | `rgba(255,255,255,0.08)` | `#e2e8f0` |
| Tab gráfica inactiva texto | `t3` | `#64748b` | `#64748b` |
| AI fondo | `aiBg` | `linear-gradient(135deg, rgba(249,115,22,0.08), rgba(234,88,12,0.04))` | `linear-gradient(135deg, rgba(249,115,22,0.06), rgba(234,88,12,0.02))` |
| AI borde | `aiB` | `rgba(249,115,22,0.18)` | `rgba(249,115,22,0.2)` |
| AI badge texto | — | `#f97316` | `#ea580c` |
| AI análisis texto | `t2` | `#94a3b8` | `#475569` |
| AI separador | — | `rgba(249,115,22,0.12)` | `rgba(249,115,22,0.12)` |

### Colores semánticos en análisis IA

| Uso | Color | Aplicación |
|-----|-------|------------|
| Potencia / acento | `#f97316` | Highlight de valores de potencia |
| Positivo / mejora | `#22c55e` | "eficiencia aeróbica está mejorando" |
| Recomendación | `#3b82f6` | "recuperación activa" |
| Advertencia | `#ef4444` | "Evita intervalos 48h" (si aplica) |

---

## 8. Componentes Reutilizables

| Componente | Usado en Detalle | Reutilizable en | shadcn/ui base | Crear custom |
|------------|-----------------|-----------------|----------------|--------------|
| **Sidebar** | Layout (compartido) | Todas las pantallas app | No — custom | Ya existe ♻️ |
| **BackButton** | Navegación de retorno | Cualquier pantalla de detalle futura | No — custom | Sí |
| **MetricsGrid / MetricCard** | 6 métricas | Reutiliza patrón de `KPICard` (variante compacta) | No — custom | Sí |
| **AIAnalysisCard** | Análisis IA | Variante de `AICoachCard` del Dashboard. Compartir base. | No — custom | Sí — patrón base compartido |
| **ActivityChart** | Gráfica temporal | Patrón de AreaChart reutiliza el de `PowerTrendChart` | No — Recharts | Sí |
| **RPEIndicator** | Potencialmente añadible aquí | Ya creado en Lista de Actividades | No — custom | Ya existe ♻️ |

---

## 9. Transformaciones JSX Necesarias

### Botón Volver

| Patrón mockup | Transformación Tailwind |
|---------------|------------------------|
| `width:28,height:28,borderRadius:6` | `w-7 h-7 rounded-md` |
| `background:t.inBg,border:"1px solid "+t.inB` | `bg-[var(--input-bg)] border border-[var(--input-border)]` |
| `display:"flex",alignItems:"center",justifyContent:"center"` | `flex items-center justify-center` |

### Metrics Grid

| Patrón mockup | Transformación Tailwind |
|---------------|------------------------|
| `gridTemplateColumns:mob?"repeat(3,1fr)":"repeat(6,1fr)"` | `grid grid-cols-3 md:grid-cols-6` |
| `gap:mob?6:10` | `gap-1.5 md:gap-2.5` |
| `borderRadius:10,padding:mob?8:12` | `rounded-[10px] p-2 md:p-3` |
| Icono + label: `gap:5,marginBottom:4` | `flex items-center gap-1.5 mb-1` |
| Valor: `fontSize:mob?16:20,fontWeight:700` | `text-base md:text-xl font-bold` |
| Unidad: `fontSize:10,color:t.t3,marginLeft:2` | `text-[10px] text-[var(--text-tertiary)] ml-0.5` |

### Gráfica — Card Container

| Patrón mockup | Transformación Tailwind |
|---------------|------------------------|
| `borderRadius:14,padding:mob?12:18` | `rounded-[14px] p-3 md:p-[18px]` |
| Título: `fontSize:13,fontWeight:600` | `text-[13px] font-semibold` |
| Tabs: `gap:4` | `flex gap-1` |
| Tab: `padding:"3px 10px",borderRadius:5` | `px-2.5 py-0.5 rounded-[5px]` |

### AI Analysis Card

| Patrón mockup | Transformación Tailwind |
|---------------|------------------------|
| `background:t.aiBg,border:"1px solid "+t.aiB,borderRadius:14` | `bg-[var(--ai-bg)] border border-[var(--ai-border)] rounded-[14px]` |
| `padding:mob?14:20` | `p-3.5 md:p-5` |
| Badge icono: `width:28,height:28,borderRadius:8` | `w-7 h-7 rounded-lg` |
| Badge texto: `fontSize:12,fontWeight:700,textTransform:"uppercase"` | `text-xs font-bold uppercase` |
| Análisis: `fontSize:13,lineHeight:1.7` | `text-[13px] leading-[1.7]` |
| Separador: `borderTop:"1px solid rgba(249,115,22,0.12)"` | `border-t border-orange-500/12` |
| Tips: `gap:mob?8:14,marginTop:12,paddingTop:10` | `flex gap-2 md:gap-3.5 mt-3 pt-2.5 flex-wrap` |

### Series Temporales — Formato de datos

```typescript
// Transformar activity_metrics (DB) → formato Recharts
function transformTimeSeries(metrics: ActivityMetric[]): ChartDataPoint[] {
  return metrics.map(m => ({
    min: Math.round(m.timestamp_seconds / 60),
    power: m.power_watts,
    hr: m.hr_bpm,
    cadence: m.cadence_rpm,
  }));
}
```

---

## 10. Dependencias Externas

### Paquetes npm

| Paquete | Uso | Ya instalado |
|---------|-----|-------------|
| `lucide-react` | Iconos: ArrowLeft, Activity, Clock, Zap, Heart, TrendingUp, Droplets, Sun, Moon | Sí |
| `recharts` | AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, defs, linearGradient | Por instalar (se instala con Dashboard) |
| `@supabase/ssr` | Queries a Supabase (server-side) | Sí |

### Componentes shadcn/ui a instalar

Ninguno nuevo específico para esta pantalla.

### Integraciones

| Servicio | Uso | Estado |
|----------|-----|--------|
| Supabase DB (tabla `activities`) | Query de actividad por ID | ✅ Tabla creada |
| Supabase DB (tabla `activity_metrics`) | Query de series temporales | ✅ Tabla creada |
| Supabase Auth | Verificación de sesión + RLS | ✅ Implementado |
| Claude API (vía Fastify) | Análisis IA de la sesión | ❌ Por implementar |

---

## Apéndice: Generador de Series Temporales Mock

```typescript
/**
 * Genera series temporales realistas para una actividad mock.
 * Simula fases: warmup → intervalos → recuperación → cooldown.
 */
export function generateMockTimeSeries(): Array<{
  min: number;
  power: number;
  hr: number;
  cadence: number;
}> {
  const data = [];
  for (let i = 0; i <= 105; i++) {
    // Fases: warmup (0-10), intervalo1 (10-30), rec1 (30-40),
    //         intervalo2 (40-60), rec2 (60-70), intervalo3 (70-90), cooldown (90-105)
    const phase =
      i < 10 ? 'warmup' :
      i < 30 ? 'interval' :
      i < 40 ? 'recovery' :
      i < 60 ? 'interval' :
      i < 70 ? 'recovery' :
      i < 90 ? 'interval' :
      'cooldown';

    const basePower =
      phase === 'interval' ? 240 + Math.random() * 40 :
      phase === 'recovery' ? 140 + Math.random() * 20 :
      phase === 'warmup' ? 120 + i * 8 :
      130 - (i - 90) * 3;

    const baseHR =
      phase === 'interval' ? 158 + Math.random() * 12 :
      phase === 'recovery' ? 135 + Math.random() * 8 :
      phase === 'warmup' ? 110 + i * 3 :
      140 - (i - 90) * 2;

    const cadence =
      phase === 'interval' ? 92 + Math.random() * 8 :
      80 + Math.random() * 8;

    data.push({
      min: i,
      power: Math.round(Math.max(80, basePower + Math.random() * 15)),
      hr: Math.round(Math.max(95, Math.min(175, baseHR + Math.random() * 5))),
      cadence: Math.round(cadence),
    });
  }
  return data;
}
```

---

## Apéndice: Formato del campo `ai_analysis` (JSONB)

```typescript
// Estructura del campo ai_analysis en la tabla activities
interface AIAnalysisDB {
  summary: string;           // "Sesión bien ejecutada. Potencia media..."
  recommendation: string;    // "Mañana recuperación activa (1h Z1)..."
  tips: {
    hydration?: string;      // "Electrolitos +500ml"
    nutrition?: string;      // "60g carbs 2h"
    sleep?: string;          // "Mín 8h sueño"
  };
  generated_at: string;      // ISO datetime
  model_version: string;     // "claude-sonnet-4-5-20250929"
}
```
