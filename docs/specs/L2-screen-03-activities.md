# L2 — Diseño Técnico: Lista de Actividades

> **Input**: `docs/specs/L1-screen-03-activities.md`
> **Requisito PRD**: F03 — Lista de actividades (P0)
> **Fecha**: 2026-02-14

---

## 1. Resumen del Alcance

### Qué se construye

1. **Página de Actividades** (`(app)/activities/page.tsx`): Server Component que obtiene las actividades del usuario y las pasa al componente cliente.
2. **ActivitiesContent** (Client Component): Gestiona búsqueda, filtros y renderiza la lista filtrada.
3. **ActivityListItem** (Client Component): Card individual de actividad con métricas, RPE y navegación al detalle.
4. **RPEIndicator** (Presentacional): Componente de 10 barras visuales para el RPE.
5. **Constante `ACTIVITY_FILTERS`**: Definición de los filtros disponibles.

### Fuera de alcance

- Importación de actividades (F04) — el botón "Importar" será un placeholder o link a form manual.
- Paginación server-side — para el MVP se cargan todas las actividades del usuario. Si el volumen crece (>100), se implementará paginación.
- Filtro por rango de fechas (mencionado en PRD pero no presente en el mockup).
- Ordenación de columnas (la lista se ordena siempre por fecha DESC).

### Prerequisitos técnicos

- Auth con Google OAuth: **implementado**.
- Tabla `activities`: **creada** (migration 001).
- Layout con Sidebar (route group `(app)`): se implementará en el Dashboard. Si las Actividades se implementan después, será prerequisito.
- Constantes `ACTIVITY_TYPES`: definidas en spec L2-screen-01 para `packages/shared`.
- Función `formatDuration`: definida en spec L2-screen-01 para `lib/dashboard/calculations.ts`.

---

## 2. Arquitectura de Componentes

### 2.1 Árbol de componentes

```
app/(app)/activities/page.tsx (Server Component)
│   → Obtiene actividades del usuario de Supabase
│   → Pasa array como prop a ActivitiesContent
│
└── ActivitiesContent (Client Component — gestiona búsqueda + filtros)
    ├── ActivitiesHeader (inline)
    │   ├── Título "Actividades" + "{N} registradas"
    │   └── Botón "Importar" (Link a /activities/import o placeholder)
    │
    ├── SearchBar (inline)
    │   ├── Input de búsqueda (Search icon)
    │   └── Botón toggle filtros (Filter icon)
    │
    ├── FilterChips (condicional — si showFilters)
    │   └── Chip ×5
    │
    ├── ActivityListItem ×N
    │   ├── Icono tipo (Activity icon)
    │   ├── Nombre + Badge + Fecha
    │   ├── Métricas (desktop: inline, mobile: grid 4 cols)
    │   ├── RPEIndicator (solo desktop)
    │   └── ChevronRight (solo desktop)
    │
    └── EmptyState (condicional)
```

### 2.2 Detalle por componente

#### ActivitiesContent

```typescript
// Ruta: apps/web/src/app/(app)/activities/activities-content.tsx
// Tipo: Client Component

interface ActivitiesContentProps {
  activities: Array<{
    id: string;
    name: string;
    date: string;
    type: string;
    distance_km: number | null;
    duration_seconds: number;
    avg_power_watts: number | null;
    avg_hr_bpm: number | null;
    rpe: number | null;
  }>;
}
```

- **Responsabilidad**: Gestiona estado de búsqueda y filtros. Filtra las actividades client-side y renderiza la lista.
- **Fuente de datos**: Props del Server Component. Estado local para búsqueda y filtros.
- **Dependencias**: ActivityListItem, RPEIndicator, `lucide-react` (Search, Filter, Upload, ChevronRight), `next/link`, constantes `ACTIVITY_TYPES` y `ACTIVITY_FILTERS`.
- **Decisiones**: Client Component porque necesita estado interactivo (búsqueda, filtros). El filtrado es client-side porque el dataset es pequeño (<100 actividades para el MVP).

**Estado interno**:
```typescript
const [searchQuery, setSearchQuery] = useState('');
const [activeFilter, setActiveFilter] = useState('all');
const [showFilters, setShowFilters] = useState(false);

const filteredActivities = useMemo(() => {
  return activities.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = activeFilter === 'all' || a.type === activeFilter;
    return matchesSearch && matchesType;
  });
}, [activities, searchQuery, activeFilter]);
```

#### ActivityListItem

```typescript
// Ruta: apps/web/src/components/activity-list-item.tsx
// Tipo: Client Component (wrapping Link)

interface ActivityListItemProps {
  id: string;
  name: string;
  date: string;
  type: string;
  distanceKm: number | null;
  durationFormatted: string;
  avgPower: number | null;
  avgHR: number | null;
  rpe: number | null;
}
```

- **Responsabilidad**: Card individual de actividad con icono de tipo, nombre, badge, fecha, métricas y RPE (ref: L1 §3.4).
- **Fuente de datos**: Props.
- **Dependencias**: `next/link`, RPEIndicator, constantes `ACTIVITY_TYPES`, `lucide-react` (Activity, ChevronRight).
- **Decisiones**: Usa `next/link` wrapping toda la card para navegación a `/activities/${id}`. Hover effect con CSS (no JS) para mejor performance.

#### RPEIndicator

```typescript
// Ruta: apps/web/src/components/rpe-indicator.tsx
// Tipo: Presentacional (sin 'use client' propio)

interface RPEIndicatorProps {
  value: number | null;
}
```

- **Responsabilidad**: Renderiza 10 barras verticales coloreadas según el valor RPE (ref: L1 §3.5).
- **Fuente de datos**: Props.
- **Dependencias**: Constantes `RPE_COLORS`.
- **Decisiones**: Componente presentacional puro. Sin `'use client'` propio — funciona como hijo de Client Components. Lógica de color encapsulada en función pura `getRPEColor(value)`.

**Lógica de color**:
```typescript
function getRPEColor(value: number): string {
  if (value <= 3) return '#22c55e';
  if (value <= 6) return '#eab308';
  if (value <= 8) return '#f97316';
  return '#ef4444';
}
```

---

## 3. Modelo de Datos

### Query de actividades

```typescript
// En app/(app)/activities/page.tsx (Server Component)
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();

const { data: activities, error } = await supabase
  .from('activities')
  .select('id, name, date, type, distance_km, duration_seconds, avg_power_watts, avg_hr_bpm, rpe')
  .eq('user_id', user.id)
  .order('date', { ascending: false });
```

**Nota**: No se seleccionan todos los campos — solo los necesarios para la lista. El campo `ai_analysis` (JSONB potencialmente grande) se omite deliberadamente.

### Schemas Zod (reutilizados)

No se requieren nuevos schemas. Se reutilizan:
- `activityTypeEnum` de `packages/shared/src/schemas/activity.ts` (definido en L2-screen-01).
- `ACTIVITY_TYPES` de `packages/shared/src/constants/activity-types.ts` (definido en L2-screen-01).

### Constantes nuevas

```typescript
// packages/shared/src/constants/activity-filters.ts

export const ACTIVITY_FILTERS = [
  { key: 'all',       label: 'Todas' },
  { key: 'intervals', label: 'Intervalos' },
  { key: 'endurance', label: 'Resistencia' },
  { key: 'recovery',  label: 'Recuperación' },
  { key: 'tempo',     label: 'Tempo' },
] as const;

export type ActivityFilterKey = typeof ACTIVITY_FILTERS[number]['key'];
```

```typescript
// packages/shared/src/constants/rpe.ts

export const RPE_COLORS = {
  low: '#22c55e',      // 1-3
  moderate: '#eab308', // 4-6
  high: '#f97316',     // 7-8
  max: '#ef4444',      // 9-10
} as const;

export function getRPEColor(value: number): string {
  if (value <= 3) return RPE_COLORS.low;
  if (value <= 6) return RPE_COLORS.moderate;
  if (value <= 8) return RPE_COLORS.high;
  return RPE_COLORS.max;
}
```

### Función `formatDuration` (reutilizada)

Se reutiliza la función `formatDuration(seconds: number): string` definida en `apps/web/src/lib/dashboard/calculations.ts` (spec L2-screen-01).

---

## 4. Endpoints API

**No se requieren endpoints Fastify nuevos** para la Lista de Actividades.

**Justificación**: Los datos se obtienen directamente de Supabase en el Server Component. El filtrado es client-side (dataset pequeño). No hay mutaciones en esta pantalla.

**Endpoint futuro pendiente**:
- `GET /api/v1/activities`: Se implementará si se necesita paginación server-side o filtros complejos (rango de fechas, ordenación dinámica).

---

## 5. Estructura de Archivos

### Archivos nuevos

```
packages/shared/src/constants/activity-filters.ts    ← Filtros de actividades
packages/shared/src/constants/rpe.ts                 ← Colores RPE + función getRPEColor

apps/web/src/app/(app)/activities/page.tsx            ← Server Component: query actividades
apps/web/src/app/(app)/activities/activities-content.tsx ← Client Component: búsqueda + filtros + lista

apps/web/src/components/activity-list-item.tsx        ← Card de actividad individual
apps/web/src/components/rpe-indicator.tsx              ← Indicador visual RPE (10 barras)
```

### Archivos a modificar

```
packages/shared/src/index.ts                          ← Añadir exports de activity-filters.ts y rpe.ts
```

### Dependencias con Dashboard

La Lista de Actividades comparte el layout `(app)/layout.tsx` con el Dashboard. Si el Dashboard se implementa primero, ya existirán:
- `apps/web/src/app/(app)/layout.tsx`
- `apps/web/src/app/(app)/app-shell.tsx`
- `apps/web/src/components/sidebar.tsx`
- `packages/shared/src/constants/activity-types.ts`
- `apps/web/src/lib/dashboard/calculations.ts` (para `formatDuration`)

Si la Lista de Actividades se implementa antes, estos archivos deben crearse aquí o la función `formatDuration` debe extraerse a un utility compartido.

---

## 6. ADRs (Decisiones Arquitectónicas)

### ADR-016: Filtrado client-side para la lista de actividades

- **Contexto**: La lista de actividades necesita filtro por tipo y búsqueda por nombre. Se puede hacer server-side (query params → nueva request) o client-side (filter en memoria).
- **Decisión**: Filtrado client-side con `useMemo`.
- **Alternativas descartadas**:
  - Server-side (query params + refetch): Añade latencia en cada filtro/búsqueda. Para el volumen del MVP (<100 actividades), es innecesario.
  - Server-side con URL search params (`useSearchParams`): Bueno para deep linking pero over-engineering para el MVP.
- **Consecuencias**:
  - (+) Filtrado instantáneo, sin loading states por cambio de filtro.
  - (+) Menos requests a Supabase.
  - (+) Simple de implementar.
  - (-) Todas las actividades se cargan en el cliente. Para >100, habrá que migrar a paginación server-side.
  - (-) No hay deep linking de filtros (no se preservan en la URL).

### ADR-017: ActivityListItem como extensión de RecentActivityItem

- **Contexto**: El Dashboard tiene `RecentActivityItem` (spec L2-screen-01) con un diseño similar pero más simple (sin RPE, sin métricas extendidas). La Lista de Actividades necesita un item más completo.
- **Decisión**: Crear `ActivityListItem` como componente independiente, más completo. `RecentActivityItem` del Dashboard puede evolucionar para usar `ActivityListItem` internamente (con props para ocultar RPE y métricas extendidas), o mantenerse como componente separado más simple.
- **Alternativas descartadas**:
  - Un solo componente con muchas props condicionales: Demasiada complejidad para dos vistas con diferencias claras.
  - Herencia de componentes: No es idiomático en React.
- **Consecuencias**:
  - (+) Cada componente tiene una responsabilidad clara.
  - (+) ActivityListItem puede evolucionar independientemente.
  - (-) Algo de duplicación en el diseño del badge de tipo y la estructura base.

### ADR-018: RPE como componente reutilizable separado

- **Contexto**: El indicador RPE (10 barras coloreadas) se usa en la Lista de Actividades y potencialmente en el Detalle de Actividad e Insights.
- **Decisión**: Extraer como componente reutilizable `RPEIndicator` en `components/`.
- **Alternativas descartadas**:
  - Inline en ActivityListItem: No sería reutilizable.
  - CSS-only (sin componente): La lógica de color por rango justifica un componente.
- **Consecuencias**:
  - (+) Reutilizable en múltiples pantallas.
  - (+) Lógica de colores encapsulada y testeable.
  - (-) Un componente más en el árbol.

---

## 7. Dependencias y Prerequisitos

### Paquetes npm a instalar

| Paquete | Workspace | Justificación |
|---------|-----------|---------------|
| Ninguno nuevo | — | — |

### Paquetes ya instalados

| Paquete | Uso |
|---------|-----|
| `lucide-react` | Iconos: Search, Filter, Upload, Activity, ChevronRight |
| `@supabase/ssr` | Query de actividades server-side |
| `next` | Link para navegación |

### Componentes ya creados (reutilizables)

| Componente | Fuente | Uso en Actividades |
|-----------|--------|-------------------|
| `Sidebar` | `apps/web/src/components/sidebar.tsx` | Layout compartido |
| `ThemeToggle` | `apps/web/src/components/theme-toggle.tsx` | En Sidebar |

### Tablas Supabase

- ✅ `activities`: creada (migration 001). Select con filtro de `user_id` (RLS).
- ⚠️ `activity_type` ENUM: actualmente `('outdoor', 'indoor', 'recovery')`, target `('intervals', 'endurance', 'recovery', 'tempo', 'rest')`. El componente debe manejar ambos sets de tipos.

---

## 8. Riesgos y Consideraciones

### Riesgo 1: Discrepancia en activity_type ENUM

**Descripción**: Igual que en el Dashboard (ADR del L2-screen-01). Los tipos del mockup no coinciden con los del ENUM actual.

**Mitigación**: `ACTIVITY_TYPES` incluye ambos mapeos. El filtrado funciona con cualquier tipo. Los badges de tipo muestran labels para todos los valores posibles.

### Riesgo 2: Performance con muchas actividades

**Descripción**: El filtrado client-side carga todas las actividades en memoria. Para un usuario con +200 actividades, el payload inicial podría ser significativo.

**Mitigación**:
- Para el MVP: aceptable. Un ciclista amateur típico genera ~3-4 actividades/semana → ~200/año.
- Si crece: implementar paginación server-side con `limit/offset` o cursor-based, y mover filtros a query params.
- Optimización inmediata: solo seleccionar los campos necesarios en la query (ya implementado — no se trae `ai_analysis`).

### Riesgo 3: Lista vacía para usuario nuevo

**Descripción**: Un usuario que acaba de completar el onboarding no tiene actividades.

**Mitigación**: Diseñar estado vacío con mensaje de invitación y CTA al botón "Importar":
```
"Aún no tienes actividades registradas.
¡Importa tu primera sesión para empezar!"
```

### Riesgo 4: Hover en mobile

**Descripción**: El mockup usa `onMouseEnter/onMouseLeave` para hover, que no funciona en mobile.

**Mitigación**: Usar `hover:` de Tailwind que ya maneja `@media (hover: hover)` correctamente. En mobile, no se aplica hover. Alternativamente, usar `active:` para feedback táctil en mobile.

### Consideraciones de accesibilidad

- Input de búsqueda: `aria-label="Buscar actividades"`, `role="searchbox"`.
- Botón filtros: `aria-label="Mostrar filtros"`, `aria-expanded={showFilters}`.
- Filter chips: usar `role="radiogroup"` y `role="radio"` con `aria-checked`.
- Lista de actividades: `<ul role="list">` con items `<li>`.
- ActivityListItem: `<Link>` envuelve la card completa → accesible por teclado.
- RPEIndicator: `aria-label="RPE {value} de 10"`, `role="img"`.
- Estado vacío: texto accesible (no solo visual).
