# L2 — Diseño Técnico: Planificación Semanal

> **Input**: `docs/specs/L1-screen-05-weekly-plan.md`
> **Requisito PRD**: F06 — Planificación semanal (P1)
> **Fecha**: 2026-02-14

---

## 1. Resumen del Alcance

### Qué se construye

1. **Página de Plan** (`(app)/plan/page.tsx`): Server Component que obtiene el plan semanal, cruza con actividades reales y calcula la carga.
2. **PlanContent** (Client Component): Wrapper que gestiona la selección de día y compone las secciones.
3. **WeeklyLoadBar** (Presentacional): Barra de carga semanal con gradient.
4. **DayGrid** (Client Component): Grid de 7 cards con selección interactiva.
5. **DayDetail** (Presentacional): Detalle expandido del día seleccionado.
6. **TipCard** (Presentacional): Componente genérico para tips de nutrición y descanso.
7. **Constantes y tipos compartidos**: Tipos de PlanDay, IntensityLevel en `packages/shared`.

### Fuera de alcance

- Endpoint de generación IA del plan (`POST /api/v1/ai/weekly-plan`): se implementará en fase posterior. Se usarán datos mock inicialmente.
- Edición manual del plan (arrastrar días, cambiar tipos).
- Marcar manualmente días como completados (se detecta automáticamente desde actividades).
- Selector personalizado de semana (date picker).

### Prerequisitos técnicos

- Auth con Google OAuth: **implementado**.
- Tabla `activities`: **creada** (migration 001).
- Layout con Sidebar (route group `(app)`): prerequisito (Dashboard).
- Constantes `ACTIVITY_TYPES`: definidas en `packages/shared` (Dashboard).
- Función `formatDuration`: definida en `lib/dashboard/calculations.ts` (Dashboard).

---

## 2. Arquitectura de Componentes

### 2.1 Árbol de componentes

```
app/(app)/plan/page.tsx (Server Component)
│   → Obtiene plan semanal + actividades de la semana
│   → Cruza plan con actividades reales (done + actual_power)
│   → Calcula TSS total
│
└── PlanContent (Client Component — gestiona selección de día + semana)
    ├── PlanHeader (inline)
    │   ├── Título "Plan semanal"
    │   ├── WeekNavigation (← rango →)
    │   └── RecalculateButton
    │
    ├── WeeklyLoadBar (presentacional)
    │
    ├── DayGrid (presentacional + interacción)
    │   └── DayCard ×7
    │
    └── DetailSection (grid 2 cols)
        ├── DayDetail (presentacional)
        └── TipsColumn
            ├── TipCard variant="nutrition"
            └── TipCard variant="rest"
```

### 2.2 Detalle por componente

#### PlanContent

```typescript
// Ruta: apps/web/src/app/(app)/plan/plan-content.tsx
// Tipo: Client Component

interface PlanContentProps {
  initialPlan: WeeklyPlan | null;
  weekActivities: Array<{
    date: string;
    avg_power_watts: number | null;
    tss: number | null;
  }>;
  weekRange: {
    start: string;   // ISO date
    end: string;     // ISO date
    label: string;   // "10 — 16 feb 2026"
  };
}
```

- **Responsabilidad**: Gestiona estado de selección de día, navegación de semana, y acción de recalcular.
- **Fuente de datos**: Props del Server Component + estado local.
- **Dependencias**: WeeklyLoadBar, DayGrid, DayDetail, TipCard.
- **Decisiones**: Client Component por interactividad (selección de día, navegación semana). El plan se pasa como props desde el server, la recalculación se hace via server action o API call.

**Estado interno**:
```typescript
const [selectedDay, setSelectedDay] = useState<number>(() => {
  // Calcular índice del día actual (0=lun, 6=dom)
  const today = new Date().getDay();
  const index = today === 0 ? 6 : today - 1;
  return index;
});
const [isRecalculating, setIsRecalculating] = useState(false);
```

#### WeeklyLoadBar

```typescript
// Ruta: apps/web/src/components/weekly-load-bar.tsx
// Tipo: Presentacional

interface WeeklyLoadBarProps {
  currentTSS: number;
  avgTSS: number;
  maxTSS?: number;  // Default: avgTSS * 1.5
}
```

- **Responsabilidad**: Barra de carga semanal con gradient y escala (ref: L1 §3.2).
- **Fuente de datos**: Props.
- **Dependencias**: Ninguna externa.
- **Decisiones**: Componente presentacional puro. El gradient es CSS (`bg-gradient-to-r`), el ancho se calcula como porcentaje inline.

#### DayGrid / DayCard

```typescript
// Ruta: apps/web/src/app/(app)/plan/day-grid.tsx
// Tipo: Presentacional con interacción (onClick)

interface DayGridProps {
  days: PlanDay[];
  selectedIndex: number;
  todayIndex: number;    // -1 si el día actual no está en esta semana
  onSelect: (index: number) => void;
}
```

- **Responsabilidad**: Grid de 7 cards de día con selección (ref: L1 §3.3).
- **Fuente de datos**: Props.
- **Dependencias**: Constantes `ACTIVITY_TYPES`, `INTENSITY_LEVELS`.
- **Decisiones**: Las cards se renderizan inline en DayGrid (no componente separado) para simplicidad. El color de selección se calcula dinámicamente a partir del tipo de actividad del día.

#### DayDetail

```typescript
// Ruta: apps/web/src/app/(app)/plan/day-detail.tsx
// Tipo: Presentacional

interface DayDetailProps {
  day: PlanDay;
}
```

- **Responsabilidad**: Detalle expandido del día seleccionado (ref: L1 §3.4).
- **Fuente de datos**: Props.
- **Dependencias**: `lucide-react` (Clock), constantes `ACTIVITY_TYPES`.
- **Decisiones**: Componente presentacional puro. No tiene estado.

#### TipCard

```typescript
// Ruta: apps/web/src/components/tip-card.tsx
// Tipo: Presentacional

interface TipCardProps {
  variant: 'nutrition' | 'rest';
  text: string;
}
```

- **Responsabilidad**: Card de tip genérica para nutrición y descanso (ref: L1 §3.5, §3.6).
- **Fuente de datos**: Props.
- **Dependencias**: `lucide-react` (Sun, Moon).
- **Decisiones**: Componente genérico con 2 variantes en vez de 2 componentes separados. La variante determina icono, color y título.

**Configuración de variantes**:
```typescript
const VARIANTS = {
  nutrition: {
    icon: Sun,
    color: '#eab308',
    title: 'Nutrición',
    bgClass: 'bg-yellow-500/5',
    borderClass: 'border-yellow-500/15',
  },
  rest: {
    icon: Moon,
    color: '#8b5cf6',
    title: 'Descanso',
    bgClass: 'bg-violet-500/5',
    borderClass: 'border-violet-500/15',
  },
} as const;
```

---

## 3. Modelo de Datos

### Tabla `weekly_plans` (nueva)

```sql
CREATE TABLE IF NOT EXISTS public.weekly_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  plan_data JSONB NOT NULL,
  ai_rationale TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  UNIQUE(user_id, week_start),
  CHECK (week_end = week_start + INTERVAL '6 days')
);

-- RLS
ALTER TABLE public.weekly_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own plans"
  ON public.weekly_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own plans"
  ON public.weekly_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plans"
  ON public.weekly_plans FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.weekly_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
```

### Queries necesarios

#### Query 1: Plan de la semana

```typescript
const weekStart = getWeekStart(weekOffset); // Lunes de la semana

const { data: plan } = await supabase
  .from('weekly_plans')
  .select('*')
  .eq('user_id', user.id)
  .eq('week_start', weekStart.toISOString().split('T')[0])
  .single();
```

#### Query 2: Actividades de la semana

```typescript
const { data: activities } = await supabase
  .from('activities')
  .select('date, avg_power_watts, tss')
  .eq('user_id', user.id)
  .gte('date', weekStart.toISOString().split('T')[0])
  .lte('date', weekEnd.toISOString().split('T')[0])
  .order('date', { ascending: true });
```

### Funciones de cálculo

```typescript
// lib/plan/calculations.ts

/**
 * Cruza plan con actividades reales para marcar done + actual_power
 */
export function mergePlanWithActivities(
  plan: PlanDay[],
  activities: Array<{ date: string; avg_power_watts: number | null; tss: number | null }>
): PlanDay[] {
  return plan.map(day => {
    const activity = activities.find(a => {
      const actDate = new Date(a.date).getDate().toString();
      return actDate === day.date;
    });
    return {
      ...day,
      done: !!activity,
      actual_power: activity?.avg_power_watts ?? null,
    };
  });
}

/**
 * Calcula TSS total planificado y real de la semana
 */
export function calculateWeeklyTSS(
  activities: Array<{ tss: number | null }>
): number {
  return activities.reduce((sum, a) => sum + (a.tss ?? 0), 0);
}

/**
 * Obtiene el lunes de la semana actual (o con offset)
 */
export function getWeekStart(offset: number = 0): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Ajustar para que lunes = 0
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff + (offset * 7));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Formatea rango de semana: "10 — 16 feb 2026"
 */
export function formatWeekRange(start: Date): string {
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun',
                  'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${start.getDate()} — ${end.getDate()} ${months[end.getMonth()]} ${end.getFullYear()}`;
}

/**
 * Calcula el índice del día actual en la semana (0=lun, 6=dom, -1=fuera)
 */
export function getTodayIndex(weekStart: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
  return diff >= 0 && diff <= 6 ? diff : -1;
}
```

### Schemas Zod nuevos (en `packages/shared`)

```typescript
// packages/shared/src/schemas/weekly-plan.ts

import { z } from 'zod';
import { activityTypeEnum } from './activity';

export const intensityLevelEnum = z.enum([
  'alta', 'media-alta', 'media', 'baja', '—'
]);
export type IntensityLevel = z.infer<typeof intensityLevelEnum>;

export const planDaySchema = z.object({
  day: z.string(),
  date: z.string(),
  type: activityTypeEnum,
  title: z.string(),
  intensity: intensityLevelEnum,
  duration: z.string(),
  description: z.string(),
  nutrition: z.string(),
  rest: z.string(),
  done: z.boolean(),
  actual_power: z.number().nullable(),
});
export type PlanDay = z.infer<typeof planDaySchema>;

export const weeklyPlanSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  week_start: z.string(),
  week_end: z.string(),
  plan_data: z.array(planDaySchema).length(7),
  ai_rationale: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type WeeklyPlan = z.infer<typeof weeklyPlanSchema>;
```

### Constantes nuevas (en `packages/shared`)

```typescript
// packages/shared/src/constants/intensity-levels.ts

export const INTENSITY_LEVELS = {
  'alta':       { color: '#ef4444' },
  'media-alta': { color: '#f97316' },
  'media':      { color: '#eab308' },
  'baja':       { color: '#22c55e' },
  '—':          { color: '#64748b' },
} as const;
```

---

## 4. Endpoints API

### POST /api/v1/ai/weekly-plan (futuro)

**No se implementa en esta fase.** Se documenta como referencia.

```typescript
// Futuro: apps/api/src/routes/ai/weekly-plan.ts

// Request
interface GeneratePlanRequest {
  user_id: string;
  week_start: string; // ISO date
}

// Response
interface GeneratePlanResponse {
  plan: PlanDay[];
  rationale: string;
}
```

**Para el MVP**: El plan se carga desde datos mock o se genera una vez y se almacena en `weekly_plans`. El botón "Recalcular" está deshabilitado o muestra un toast "Funcionalidad próximamente".

---

## 5. Estructura de Archivos

### Archivos nuevos

```
packages/shared/src/schemas/weekly-plan.ts              ← Schema Zod para plan semanal
packages/shared/src/constants/intensity-levels.ts        ← Constantes de niveles de intensidad

apps/web/src/app/(app)/plan/page.tsx                     ← Server Component: query plan + actividades
apps/web/src/app/(app)/plan/plan-content.tsx              ← Client Component: gestión de estado
apps/web/src/app/(app)/plan/day-grid.tsx                  ← Grid de 7 días con selección
apps/web/src/app/(app)/plan/day-detail.tsx                ← Detalle del día seleccionado

apps/web/src/components/weekly-load-bar.tsx               ← Barra de carga semanal
apps/web/src/components/tip-card.tsx                      ← Card de tip (nutrición/descanso) reutilizable

apps/web/src/lib/plan/calculations.ts                     ← Funciones de cálculo de plan

supabase/migrations/XXX_create_weekly_plans_table.sql     ← Migración de la tabla
```

### Archivos a modificar

```
packages/shared/src/index.ts                              ← Añadir exports de weekly-plan schemas y constantes
```

### Dependencias con otras specs

| Dependencia | Spec origen | Estado |
|-------------|-------------|--------|
| Layout `(app)` con Sidebar | L2-screen-01 (Dashboard) | Prerequisito |
| `ACTIVITY_TYPES` constante | L2-screen-01 (Dashboard) | Prerequisito |
| `formatDuration` función | L2-screen-01 (Dashboard) | Prerequisito |
| Tabla `activities` | Migration 001 | ✅ Creada |
| Tabla `weekly_plans` | Esta spec | ❌ Por crear |

---

## 6. ADRs (Decisiones Arquitectónicas)

### ADR-023: Plan semanal como JSONB en vez de tabla normalizada

- **Contexto**: El plan tiene 7 días con estructura compleja (tipo, intensidad, duración, descripción, tips). Se puede modelar como: (a) tabla `plan_days` normalizada o (b) campo JSONB `plan_data` en `weekly_plans`.
- **Decisión**: JSONB.
- **Alternativas descartadas**:
  - Tabla `plan_days`: Añade JOINs, más migrations, más complejidad para 7 filas fijas por semana.
- **Consecuencias**:
  - (+) Query simple (un SELECT, no JOIN).
  - (+) La estructura del plan puede evolucionar sin migrations.
  - (+) El plan completo es la unidad atómica (se reemplaza entero al recalcular).
  - (-) No se pueden hacer queries SQL directos sobre campos individuales del plan (ej: "días de tipo intervals"). Para el MVP esto es aceptable.

### ADR-024: TipCard genérico con variantes

- **Contexto**: NutritionCard y RestCard (L1 §3.5, §3.6) comparten el 95% del código visual: icono + título + texto en card coloreada.
- **Decisión**: Un solo componente `TipCard` con prop `variant: 'nutrition' | 'rest'`.
- **Alternativas descartadas**:
  - Dos componentes separados: Duplicación innecesaria.
- **Consecuencias**:
  - (+) DRY, un solo archivo.
  - (+) Extensible (se puede añadir variant 'hydration' si se necesita).
  - (-) Ninguna significativa.

### ADR-025: Detección automática de "done" desde actividades

- **Contexto**: Un día del plan puede marcarse como "completado". El mockup muestra "✓ {pw}W". ¿El usuario lo marca manualmente o se detecta automáticamente?
- **Decisión**: Detección automática. Si existe una actividad en `activities` con la misma fecha, el día se marca como `done`.
- **Alternativas descartadas**:
  - Marcado manual: Añade interactividad (toggle/checkbox) y escritura en DB. Sobrecomplica el MVP.
  - Campo `done` persistido en `plan_data`: Se desincronizaría si el usuario borra/añade actividades.
- **Consecuencias**:
  - (+) Siempre sincronizado con los datos reales.
  - (+) Sin interacción adicional del usuario.
  - (-) No permite marcar "done" un día de descanso si no hay actividad registrada (el mockup sí lo hace). Mitigación: considerar días `rest` como `done` si su fecha ya pasó.

### ADR-026: Datos mock hasta integración de Claude API

- **Contexto**: La generación del plan requiere Claude API + backend Fastify. Ninguno está implementado.
- **Decisión**: Usar datos mock de plan (constante `MOCK_PLAN`) hasta que esté disponible la API. El botón "Recalcular" mostrará un toast informativo.
- **Consecuencias**:
  - (+) La pantalla es funcional visualmente desde la primera implementación.
  - (+) La interfaz `PlanContentProps` ya está preparada para recibir el plan real.
  - (-) No hay generación IA real hasta la integración.

---

## 7. Dependencias y Prerequisitos

### Paquetes npm a instalar

| Paquete | Workspace | Justificación |
|---------|-----------|---------------|
| Ninguno nuevo | — | Todos ya instalados o pendientes del Dashboard |

### Paquetes ya instalados

| Paquete | Uso |
|---------|-----|
| `lucide-react` | Iconos: ChevronLeft, ChevronRight, RefreshCw, Clock, Sun, Moon |
| `@supabase/ssr` | Queries a Supabase server-side |

### Componentes ya creados (o por crear con Dashboard)

| Componente | Fuente | Uso en Plan |
|-----------|--------|------------|
| `Sidebar` | `components/sidebar.tsx` | Layout compartido |

### Tablas Supabase

- ✅ `activities`: Query de actividades de la semana.
- ❌ `weekly_plans`: **Por crear** (migration en esta spec).

---

## 8. Riesgos y Consideraciones

### Riesgo 1: Sin plan generado (usuario nuevo)

**Descripción**: Un usuario nuevo no tendrá registros en `weekly_plans`.

**Mitigación**: Estado vacío explícito:
- Mensaje: "No hay plan generado para esta semana."
- Botón "Generar mi primer plan" (gradient naranja).
- En el MVP (sin Claude API): cargar datos mock automáticamente o mostrar placeholder.

### Riesgo 2: Detección de "done" imprecisa

**Descripción**: La detección por fecha puede ser imprecisa si el usuario registra múltiples actividades en un día, o si el tipo de actividad no coincide con el plan.

**Mitigación**: Para el MVP, la detección es por fecha (si existe cualquier actividad ese día, el día se marca como done). En futuro, se puede mejorar comparando también el tipo de actividad.

### Riesgo 3: Navegación de semana requiere nueva query

**Descripción**: Al cambiar de semana (← →), se necesitan nuevos datos del server.

**Mitigación**: Usar `useTransition` de React para la navegación de semana, actualizando los searchParams de la URL (`/plan?week=-1`) para que el Server Component re-fetche los datos. Esto evita estado client-side complejo.

**Alternativa**: Para el MVP, solo mostrar la semana actual y deshabilitar la navegación. Implementar navegación en fase posterior.

### Riesgo 4: Formato de fecha en cruce plan-actividades

**Descripción**: El plan tiene `date: "10"` (día del mes) y las actividades tienen `date: "2026-02-10"` (ISO). El cruce debe hacer match correcto.

**Mitigación**: La función `mergePlanWithActivities` compara el día del mes de la actividad con el campo `date` del plan. Se debe considerar el mes y año para evitar falsos positivos entre meses.

### Consideraciones de accesibilidad

- DayGrid: `role="listbox"` con `role="option"` por cada card. `aria-selected` en la card activa.
- Badge "HOY": además del visual, usar `aria-label="Hoy"` para screen readers.
- WeeklyLoadBar: `role="progressbar"` con `aria-valuenow`, `aria-valuemin`, `aria-valuemax`.
- Botón Recalcular: `aria-busy="true"` durante la recalculación.
- TipCard: estructura semántica con `<section>` y `aria-labelledby`.
