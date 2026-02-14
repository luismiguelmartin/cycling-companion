# L2 — Diseño Técnico: Dashboard

> **Input**: `docs/specs/L1-screen-01-dashboard.md`
> **Requisito PRD**: F02 — Dashboard principal (P0)
> **Fecha**: 2026-02-14

---

## 1. Resumen del Alcance

### Qué se construye

1. **App Layout** (`(app)/layout.tsx`): Layout con Sidebar compartido para todas las pantallas autenticadas (Dashboard, Actividades, Plan, Insights, Perfil).
2. **Sidebar** (`components/sidebar.tsx`): Navegación principal con 5 items, toggle de tema, info de usuario. Responsive: sidebar fija en desktop, overlay en mobile.
3. **Dashboard** (`(app)/page.tsx`): Pantalla principal con KPIs semanales, gráficas de tendencia y carga, tarjeta del coach IA, alerta de sobrecarga, actividades recientes.
4. **Schemas y constantes compartidas**: Tipos de actividad, items de navegación, zonas de potencia/FC (en `packages/shared`).

### Fuera de alcance

- Endpoint de recomendación IA (`/api/v1/ai/daily-recommendation`): se creará en fase posterior. Se usará un mensaje estático o placeholder hasta entonces.
- Importación de actividades (F04).
- Detalle de actividad (F05).
- Migración del ENUM `activity_type` (se documenta como pendiente).

### Prerequisitos técnicos

- Auth con Google OAuth: **implementado**.
- Onboarding flow: **implementado** (login → onboarding → dashboard).
- Tabla `users`: **creada** (migration 001 + 002).
- Tabla `activities`: **creada** (migration 001).
- ThemeProvider + `next-themes`: **implementado**.
- CSS custom properties en `globals.css`: **implementado** (parcialmente).

---

## 2. Arquitectura de Componentes

### 2.1 App Layout — Árbol de componentes

```
app/(app)/layout.tsx (Server Component)
│   → Verifica auth + perfil, obtiene datos del usuario
│
└── AppShell (Client Component — gestiona sidebar state)
    ├── Sidebar (Client) ♻️
    │   ├── Logo (Zap + "Cycling Companion")
    │   ├── NavItems ×5
    │   ├── ThemeToggle (Client) ♻️
    │   └── UserInfo (nombre + email)
    │
    ├── MobileHeader (Client, solo < 768px)
    │   ├── Logo
    │   └── Hamburger button
    │
    └── {children} (contenido de la página)
```

### 2.2 Dashboard — Árbol de componentes

```
app/(app)/page.tsx (Server Component)
│   → Obtiene perfil + actividades de últimas 4 semanas
│   → Calcula KPIs, tendencias, carga, overload
│
└── Dashboard Content
    ├── DashboardHeader (presentacional)
    ├── OverloadAlert (presentacional, condicional)
    ├── KPIGrid (presentacional, 4 KPICards)
    ├── ChartsSection
    │   ├── PowerTrendChart (Client — Recharts)
    │   └── DailyLoadChart (Client — Recharts)
    ├── AICoachCard (presentacional) ♻️
    └── RecentActivitiesSection (presentacional)
        └── RecentActivityItem ×4
```

### 2.3 Detalle por componente

#### AppShell

```typescript
// Ruta: apps/web/src/app/(app)/app-shell.tsx
// Tipo: Client Component

interface AppShellProps {
  userName: string;
  userEmail: string;
  children: React.ReactNode;
}
```

- **Responsabilidad**: Compone el layout con Sidebar + contenido. Gestiona el estado del menú mobile (abierto/cerrado).
- **Fuente de datos**: Props del Server Component layout.
- **Dependencias**: Sidebar, MobileHeader.
- **Decisiones**: Client Component porque gestiona el estado del menú mobile y necesita `usePathname()` para marcar la nav activa. Componente separado del layout para mantener el layout como Server Component.

#### Sidebar

```typescript
// Ruta: apps/web/src/components/sidebar.tsx
// Tipo: Client Component

interface SidebarProps {
  userName: string;
  userEmail: string;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}
```

- **Responsabilidad**: Navegación principal de la app. Desktop: sidebar fija 220px. Mobile: overlay fullscreen con backdrop blur.
- **Fuente de datos**: `usePathname()` de `next/navigation` para marcar la ruta activa.
- **Dependencias**: ThemeToggle, `lucide-react` (Activity, BarChart3, Calendar, TrendingUp, User, X), `next/link`.
- **Decisiones**: Client Component por `usePathname()` y estado del menú mobile. La lista de nav items se define como constante en `packages/shared` para reutilización.

#### KPICard

```typescript
// Ruta: apps/web/src/components/kpi-card.tsx
// Tipo: Server Component

interface KPICardProps {
  icon: LucideIcon;
  iconColor: string;
  value: string;          // Pre-formateado: "187", "4:32", etc.
  unit: string;
  label: string;
  trend?: {
    direction: 'up' | 'down';
    percentage: number;
  };
}
```

- **Responsabilidad**: Muestra un KPI con icono, valor, unidad, label y badge de tendencia (ref: L1 §3.2 KPICard).
- **Fuente de datos**: Props del Server Component padre.
- **Dependencias**: `lucide-react` (TrendingUp, TrendingDown para el badge).
- **Decisiones**: Server Component — no tiene estado ni interactividad. El valor se pasa pre-formateado para mantener la lógica de formateo en el server.

#### PowerTrendChart

```typescript
// Ruta: apps/web/src/components/charts/power-trend-chart.tsx
// Tipo: Client Component

interface PowerTrendChartProps {
  data: Array<{
    week: string;
    power: number;
    hr: number;
  }>;
}
```

- **Responsabilidad**: AreaChart de Recharts mostrando tendencia de potencia (4 semanas) con línea de FC superpuesta (ref: L1 §3.2 PowerTrendChart).
- **Fuente de datos**: Props con datos pre-calculados.
- **Dependencias**: `recharts` (AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, defs/linearGradient).
- **Decisiones**: Client Component obligatorio porque Recharts necesita acceso al DOM.

#### DailyLoadChart

```typescript
// Ruta: apps/web/src/components/charts/daily-load-chart.tsx
// Tipo: Client Component

interface DailyLoadChartProps {
  data: Array<{
    day: string;
    load: number;
  }>;
}
```

- **Responsabilidad**: BarChart de Recharts mostrando carga diaria (TSS) de la semana L-D (ref: L1 §3.2 DailyLoadChart).
- **Fuente de datos**: Props.
- **Dependencias**: `recharts` (BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer).
- **Decisiones**: Client Component por Recharts.

#### AICoachCard

```typescript
// Ruta: apps/web/src/components/ai-coach-card.tsx
// Tipo: Server Component

interface AICoachCardProps {
  recommendation: string;
  tips?: {
    hydration?: string;
    sleep?: string;
    nutrition?: string;
  };
}
```

- **Responsabilidad**: Tarjeta con la recomendación del coach IA y tips (ref: L1 §3.2 AICoachCard).
- **Fuente de datos**: Props.
- **Dependencias**: `lucide-react` (Zap, Droplets, Moon, Sun).
- **Decisiones**: Server Component — renderiza texto estático. Patrón similar a AICoachWelcome del onboarding, pero con tips adicionales y sin saludo personalizado.

#### OverloadAlert

```typescript
// Ruta: apps/web/src/components/overload-alert.tsx
// Tipo: Server Component

interface OverloadAlertProps {
  currentLoad: number;
  avgLoad: number;
}
```

- **Responsabilidad**: Banner de alerta cuando la carga semanal supera umbrales (ref: L1 §3.2 OverloadAlert, PRD §4 F09).
- **Fuente de datos**: Props calculados en el server.
- **Dependencias**: `lucide-react` (AlertTriangle).
- **Decisiones**: Server Component — se renderiza condicionalmente. No tiene interactividad.

#### RecentActivityItem

```typescript
// Ruta: apps/web/src/components/recent-activity-item.tsx
// Tipo: Client Component (onClick para navegar)

interface RecentActivityItemProps {
  id: string;
  name: string;
  date: string;
  type: string;           // activity_type
  distanceKm?: number;
  durationSeconds: number;
  avgPower?: number;
  avgHR?: number;
}
```

- **Responsabilidad**: Item individual de actividad reciente con badge de tipo y métricas resumidas (ref: L1 §3.2 RecentActivityItem).
- **Fuente de datos**: Props.
- **Dependencias**: `next/link`, constantes de tipos de actividad.
- **Decisiones**: Podría ser un `Link` wrapping en lugar de un Client Component con onClick. Usar `next/link` para navegación.

---

## 3. Modelo de Datos

### Queries necesarios

#### Query 1: Actividades de las últimas 4 semanas

```typescript
const fourWeeksAgo = new Date();
fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

const { data: activities } = await supabase
  .from('activities')
  .select('id, name, date, type, duration_seconds, distance_km, avg_power_watts, avg_hr_bpm, tss')
  .eq('user_id', user.id)
  .gte('date', fourWeeksAgo.toISOString().split('T')[0])
  .order('date', { ascending: false });
```

#### Query 2: Perfil del usuario

```typescript
const { data: profile } = await supabase
  .from('users')
  .select('display_name, ftp, max_hr, goal')
  .eq('id', user.id)
  .single();
```

### Funciones de cálculo (server-side)

```typescript
// lib/dashboard/calculations.ts

interface WeeklyKPIs {
  distanceKm: number;
  durationSeconds: number;
  avgPower: number | null;
  avgHR: number | null;
  activityCount: number;
}

/**
 * Calcula KPIs para un rango de fechas
 */
export function calculateWeeklyKPIs(
  activities: Activity[],
  startDate: Date,
  endDate: Date
): WeeklyKPIs;

/**
 * Calcula tendencias comparando semana actual vs anterior
 */
export function calculateTrends(
  currentWeek: WeeklyKPIs,
  previousWeek: WeeklyKPIs
): Record<string, { direction: 'up' | 'down'; percentage: number } | null>;

/**
 * Agrupa actividades por semana y calcula promedios
 */
export function calculateWeeklyTrend(
  activities: Activity[]
): Array<{ week: string; power: number; hr: number }>;

/**
 * Calcula carga diaria (TSS) para la semana actual
 */
export function calculateDailyLoad(
  activities: Activity[],
  weekStartDate: Date
): Array<{ day: string; load: number }>;

/**
 * Detecta sobrecarga comparando TSS semanal vs media de 4 semanas
 */
export function detectOverload(
  activities: Activity[]
): { currentLoad: number; avgLoad: number; percentage: number } | null;

/**
 * Formatea duración en segundos a "Xh YYm"
 */
export function formatDuration(seconds: number): string;

/**
 * Obtiene el número de semana del año (ISO)
 */
export function getWeekNumber(date: Date): number;

/**
 * Obtiene saludo según hora del día
 */
export function getGreeting(): string;
```

### Schemas Zod nuevos (en `packages/shared`)

```typescript
// packages/shared/src/schemas/activity.ts

import { z } from 'zod';

export const activityTypeEnum = z.enum([
  'intervals', 'endurance', 'recovery', 'tempo', 'rest',
  // Temporalmente incluir los del ENUM actual de DB:
  'outdoor', 'indoor',
]);
export type ActivityType = z.infer<typeof activityTypeEnum>;

export const activitySchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string().min(1),
  date: z.string(),  // ISO date string
  type: activityTypeEnum,
  duration_seconds: z.number().int().positive(),
  distance_km: z.number().nonnegative().nullable(),
  avg_power_watts: z.number().int().nonnegative().nullable(),
  avg_hr_bpm: z.number().int().positive().max(220).nullable(),
  max_hr_bpm: z.number().int().positive().max(220).nullable(),
  avg_cadence_rpm: z.number().int().nonnegative().nullable(),
  tss: z.number().int().nonnegative().nullable(),
  rpe: z.number().int().min(1).max(10).nullable(),
  ai_analysis: z.any().nullable(),
  notes: z.string().nullable(),
  is_reference: z.boolean(),
  raw_file_url: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type Activity = z.infer<typeof activitySchema>;
```

### Constantes nuevas (en `packages/shared`)

```typescript
// packages/shared/src/constants/navigation.ts

export const NAV_ITEMS = [
  { iconName: 'Activity' as const, label: 'Dashboard', href: '/' },
  { iconName: 'BarChart3' as const, label: 'Actividades', href: '/activities' },
  { iconName: 'Calendar' as const, label: 'Planificación', href: '/plan' },
  { iconName: 'TrendingUp' as const, label: 'Insights', href: '/insights' },
  { iconName: 'User' as const, label: 'Perfil', href: '/profile' },
] as const;
```

```typescript
// packages/shared/src/constants/activity-types.ts

export const ACTIVITY_TYPES = {
  intervals:  { label: 'Intervalos',    color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   emoji: '🔴' },
  endurance:  { label: 'Resistencia',   color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   emoji: '🟢' },
  recovery:   { label: 'Recuperación',  color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  emoji: '🔵' },
  tempo:      { label: 'Tempo',         color: '#f97316', bg: 'rgba(249,115,22,0.1)',  emoji: '🟠' },
  rest:       { label: 'Descanso',      color: '#64748b', bg: 'rgba(100,116,139,0.1)', emoji: '⚪' },
  // Tipos actuales del DB (mientras no se migre el ENUM)
  outdoor:    { label: 'Exterior',      color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   emoji: '🟢' },
  indoor:     { label: 'Interior',      color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)',  emoji: '🟣' },
} as const;
```

---

## 4. Endpoints API

**No se requieren endpoints Fastify nuevos** para el Dashboard en esta fase.

**Justificación**: Todos los datos del Dashboard se obtienen directamente desde Supabase en el Server Component:
- Perfil del usuario: `SELECT` de tabla `users`.
- Actividades: `SELECT` de tabla `activities` con filtros de fecha.
- Cálculos de KPIs/tendencias/carga: funciones puras ejecutadas server-side.

**Endpoint futuro pendiente**:
- `GET /api/v1/ai/daily-recommendation`: Se implementará cuando se integre la API de Claude. Hasta entonces, el AICoachCard mostrará un mensaje estático placeholder o uno generado a partir de heurísticas simples.

---

## 5. Estructura de Archivos

### Archivos nuevos

```
packages/shared/src/schemas/activity.ts               ← Schema Zod para actividades
packages/shared/src/constants/navigation.ts            ← Items de navegación del sidebar
packages/shared/src/constants/activity-types.ts        ← Tipos de actividad con colores
packages/shared/src/constants/zones.ts                 ← Zonas de potencia y FC (reutilizable en Perfil)
packages/shared/src/index.ts                           ← Actualizar: re-exportar nuevos schemas y constantes

apps/web/src/app/(app)/layout.tsx                      ← Layout con Sidebar para pantallas autenticadas
apps/web/src/app/(app)/app-shell.tsx                   ← Client Component wrapper (sidebar state)
apps/web/src/app/(app)/page.tsx                        ← Dashboard (reemplaza placeholder actual)

apps/web/src/components/sidebar.tsx                    ← Sidebar de navegación
apps/web/src/components/kpi-card.tsx                   ← KPI card reutilizable
apps/web/src/components/ai-coach-card.tsx              ← Tarjeta del coach IA reutilizable
apps/web/src/components/overload-alert.tsx             ← Banner de alerta de sobrecarga
apps/web/src/components/recent-activity-item.tsx       ← Item de actividad reciente
apps/web/src/components/charts/power-trend-chart.tsx   ← AreaChart de tendencia (Recharts)
apps/web/src/components/charts/daily-load-chart.tsx    ← BarChart de carga diaria (Recharts)

apps/web/src/lib/dashboard/calculations.ts             ← Funciones de cálculo de KPIs y agregaciones
```

### Archivos a modificar

```
apps/web/src/app/globals.css                           ← Añadir CSS variables para sidebar, grid, tooltip
apps/web/src/app/page.tsx                              ← Eliminar (se reemplaza por (app)/page.tsx)
packages/shared/src/index.ts                           ← Añadir exports nuevos
```

### Archivos a eliminar/mover

```
apps/web/src/app/page.tsx        → Reemplazar por apps/web/src/app/(app)/page.tsx
apps/web/src/app/logout-button.tsx → Integrar logout en Sidebar
```

**Nota sobre la migración de page.tsx**: La `page.tsx` actual en la raíz (`app/page.tsx`) es un placeholder que verifica auth + perfil y muestra "Dashboard (próximamente)". Se moverá a `app/(app)/page.tsx` con la lógica real del Dashboard. La verificación de auth se hace en el layout `app/(app)/layout.tsx`.

---

## 6. ADRs (Decisiones Arquitectónicas)

### ADR-007: Route group `(app)` para pantallas autenticadas con sidebar

- **Contexto**: Las pantallas autenticadas (Dashboard, Actividades, Plan, Insights, Perfil) comparten un layout con Sidebar, a diferencia de las pantallas de auth (Login, Onboarding) que son fullscreen. Ya existe el route group `(auth)` para login/onboarding (ref: ADR-006).
- **Decisión**: Crear route group `(app)` con su propio layout que incluye el Sidebar.
- **Alternativas descartadas**:
  - Layout condicional en `app/layout.tsx`: Complicado, mezcla responsabilidades.
  - Sidebar como componente dentro de cada page: Duplicación, no DRY.
- **Consecuencias**:
  - (+) Separación limpia entre layouts auth (fullscreen) y app (con sidebar).
  - (+) El Sidebar se renderiza una sola vez y se comparte entre todas las páginas.
  - (-) Requiere mover `page.tsx` de la raíz a `(app)/page.tsx`.

### ADR-008: Cálculos de dashboard server-side en funciones puras

- **Contexto**: Los KPIs, tendencias y carga diaria requieren agregar datos de actividades. Se puede hacer en el cliente (query raw + cálculo client-side), en el servidor (Server Component + funciones puras), o en la base de datos (SQL views/functions).
- **Decisión**: Funciones puras en TypeScript ejecutadas en el Server Component, con los datos ya obtenidos de Supabase.
- **Alternativas descartadas**:
  - SQL views/functions: Más eficiente para datasets grandes, pero añade complejidad en Supabase y dificulta testing. Para el volumen de datos del MVP (decenas de actividades, no miles), es innecesario.
  - Cálculo client-side: Aumentaría el bundle size y el tiempo de carga, los datos ya están disponibles en el servidor.
- **Consecuencias**:
  - (+) Funciones testables unitariamente sin dependencia de Supabase.
  - (+) Datos calculados antes del render, sin loading spinners.
  - (+) Si el volumen crece, se puede migrar a SQL views sin cambiar la interfaz.
  - (-) Todas las actividades de 4 semanas se transfieren al servidor Node.js para el cálculo.

### ADR-009: Recharts como librería de gráficas

- **Contexto**: El PRD menciona Recharts o Chart.js. El DESIGN-SYSTEM.md documenta configuración específica de Recharts.
- **Decisión**: Usar Recharts.
- **Alternativas descartadas**:
  - Chart.js: Requiere refs al canvas, menos idiomático con React, no tiene componentes declarativos.
  - Tremor: Buena integración con Tailwind pero menos flexible para customización detallada.
- **Consecuencias**:
  - (+) API declarativa nativa de React (componentes JSX).
  - (+) Soporta AreaChart, BarChart, RadarChart (todos los tipos del design system).
  - (+) Gradients SVG para el estilo visual del mockup.
  - (-) Bundle size significativo (~300KB minified). Se importará dinámicamente con `next/dynamic` si es necesario.

### ADR-010: Recomendación IA placeholder hasta integración de Claude API

- **Contexto**: El Dashboard incluye una tarjeta con recomendación IA generada por Claude API. La integración con Claude requiere el backend Fastify (no implementado aún) y la infraestructura de prompts.
- **Decisión**: En esta fase, el AICoachCard mostrará un mensaje placeholder o generado por heurísticas simples basadas en los datos del usuario (ej: "Tu potencia media ha subido un 5% esta semana. ¡Buen trabajo!").
- **Alternativas descartadas**:
  - Llamar a Claude API directamente desde el Server Component: Posible pero expone la API key en el frontend runtime, no deseable.
  - No mostrar la tarjeta: Pierde el valor visual del dashboard.
- **Consecuencias**:
  - (+) El Dashboard tiene aspecto completo desde la primera implementación.
  - (+) La interfaz `AICoachCardProps` ya está preparada para recibir la recomendación real.
  - (-) El mensaje no es verdaderamente inteligente hasta que se integre Claude.

### ADR-011: AppShell como Client Component separado del layout

- **Contexto**: El layout `(app)/layout.tsx` necesita verificar auth y obtener datos del usuario (Server Component). Pero el Sidebar necesita `usePathname()` y estado del menú mobile (Client Component).
- **Decisión**: El layout es Server Component y renderiza un `AppShell` Client Component que contiene Sidebar + children.
- **Alternativas descartadas**:
  - Layout como Client Component: Perdería la capacidad de hacer verificaciones server-side y data fetching.
  - Sidebar sin usePathname (pasar pathname como prop): El layout Server Component no tiene acceso a `pathname` fácilmente en App Router sin `headers()`.
- **Consecuencias**:
  - (+) Layout mantiene la capacidad de data fetching y auth checks.
  - (+) El AppShell encapsula toda la interactividad.
  - (-) Un nivel extra de nesting en el árbol de componentes.

---

## 7. Dependencias y Prerequisitos

### Paquetes npm a instalar

| Paquete | Workspace | Justificación |
|---------|-----------|---------------|
| `recharts` | `apps/web` | Gráficas: AreaChart (tendencia potencia), BarChart (carga diaria) — ADR-009 |

### Paquetes ya instalados

| Paquete | Workspace | Uso |
|---------|-----------|-----|
| `lucide-react` | `apps/web` | Iconos de navegación, KPIs, coach IA, alertas |
| `next-themes` | `apps/web` | Toggle de tema en Sidebar |
| `@supabase/ssr` | `apps/web` | Queries a Supabase server-side |
| `zod` | `packages/shared` | Schemas de validación |

### Componentes shadcn/ui a instalar

Ninguno nuevo en esta fase. El botón (`button`) ya está instalado.

### Tablas Supabase

- ✅ `users`: creada (migration 001 + 002)
- ✅ `activities`: creada (migration 001)
- ⚠️ `activity_type` ENUM: actualmente `('outdoor', 'indoor', 'recovery')`, target `('intervals', 'endurance', 'recovery', 'tempo', 'rest')`. Migración pendiente para fase posterior.

---

## 8. Riesgos y Consideraciones

### Riesgo 1: Discrepancia en activity_type ENUM

**Descripción**: La migration actual define `activity_type AS ENUM ('outdoor', 'indoor', 'recovery')`, pero el DESIGN-SYSTEM.md y el PRD usan `('intervals', 'endurance', 'recovery', 'tempo', 'rest')`.

**Mitigación**: El Dashboard debe funcionar con ambos sets de tipos. La constante `ACTIVITY_TYPES` incluye ambos mapeos. La migración del ENUM se planificará como issue separada. Mientras tanto, los badges de tipo mostrarán los labels correspondientes a los valores reales de la base de datos.

### Riesgo 2: Dashboard sin datos (usuario nuevo)

**Descripción**: Un usuario que acaba de completar el onboarding verá un dashboard vacío.

**Mitigación**: Diseñar estados vacíos para cada sección:
- KPIs: mostrar "—" o "0" sin badge de tendencia.
- Gráficas: ejes visibles pero sin datos (o mensaje "Sin datos suficientes").
- AICoachCard: mensaje genérico invitando a registrar la primera actividad.
- RecentActivities: "Aún no tienes actividades registradas. ¡Importa tu primera sesión!"

### Riesgo 3: Performance de Recharts en mobile

**Descripción**: Recharts renderiza SVGs que pueden ser pesados en mobile, especialmente con animaciones.

**Mitigación**:
- Desactivar animaciones en mobile (`isAnimationActive={false}`).
- Usar `ResponsiveContainer` para dimensiones adaptativas.
- Si el bundle es demasiado grande, importar con `next/dynamic` y `ssr: false`.

### Riesgo 4: Migración de page.tsx

**Descripción**: Mover `/page.tsx` a `/(app)/page.tsx` cambia la estructura pero la URL sigue siendo `/` (los route groups no afectan URLs).

**Mitigación**: Verificar que:
- Los redirects del middleware siguen funcionando (rutas URL no cambian).
- Los imports internos se actualizan correctamente.
- La lógica de auth + perfil check se mueve al layout `(app)/layout.tsx` para no duplicarla en cada page.

### Consideraciones de accesibilidad

- KPICards: incluir `aria-label` descriptivo (ej: "Distancia semanal: 187 kilómetros, subida del 12%").
- Gráficas: Recharts genera SVG accesible. Añadir `role="img"` y `aria-label` al contenedor.
- OverloadAlert: usar `role="alert"` para screen readers.
- Sidebar nav: usar `<nav>` con `aria-label="Navegación principal"`.
- Mobile menu: gestionar focus trap cuando el overlay está abierto.
