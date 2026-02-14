# L1 — Spec Funcional: Lista de Actividades

> **Fuente**: `docs/design/cycling-companion-full-app.jsx`
> **Requisito PRD**: F03 — Lista de actividades (P0)
> **Fecha**: 2026-02-14

---

## 1. Resumen de la Pantalla

La pantalla de Lista de Actividades muestra un listado de todas las sesiones de entrenamiento del usuario, con búsqueda, filtros por tipo y acceso al detalle de cada actividad. Incluye un botón para importar nuevas actividades.

| Pantalla | Componente JSX | Propósito |
|----------|---------------|-----------|
| **Lista de Actividades** | `ActivitiesPage` | Listado completo de actividades con búsqueda, filtros por tipo, métricas resumidas, indicador RPE y acceso al detalle. |

**Requisito PRD asociado**: F03 — Listado paginado de actividades con filtros. Columnas: fecha, nombre, tipo, distancia, tiempo, potencia, FC, RPE, acciones. Filtros: rango de fechas, tipo, búsqueda por nombre.

---

## 2. Ruta y Navegación

### Rutas propuestas

| Pantalla | Ruta | Route Group |
|----------|------|-------------|
| Lista de Actividades | `/activities` | `(app)` |

### Flujo de navegación

```
Sidebar "Actividades" → /activities
Dashboard "Ver todas →" → /activities
                            │
                ┌───────────┴───────────┐
                │                       │
        Clic en actividad          Clic "Importar"
                │                       │
      /activities/:id           Modal/Drawer de importación
      (Detalle actividad)       (F04 — fuera de scope)
```

### Condiciones de acceso

| Ruta | Auth requerida | Condición adicional |
|------|---------------|---------------------|
| `/activities` | Sí | Si no completó onboarding → redirect a `/onboarding` |

---

## 3. Componentes Identificados

### 3.1 ActivitiesHeader

| Campo | Valor |
|-------|-------|
| **Nombre** | `ActivitiesHeader` |
| **Tipo** | Server Component — renderiza título y contador |
| **Props** | `activityCount: number` (obligatoria) |
| **Estados** | Default único |
| **Tokens** | Título: `t1` (26px desktop / 22px mobile, weight 700). Contador: `t3` (13px desktop / 11px mobile). |
| **Responsive** | Desktop: título y botón en línea. Mobile: título 22px, botón más compacto. |
| **Contenido** | Título "Actividades" + subtítulo "{N} registradas" + botón "Importar" |
| **Reutilizable** | No — específico de esta pantalla |

**Botón "Importar"**:
- Gradient naranja: `linear-gradient(135deg, #f97316, #ea580c)`
- Icono `Upload` (14px) + texto "Importar"
- Font: 13px desktop / 12px mobile, weight 600, color blanco
- Padding: `9px 18px` desktop / `7px 12px` mobile
- BorderRadius: 10px

**Nota**: El botón "Importar" en esta fase es un placeholder. La funcionalidad de importación (F04) se implementará en una fase posterior. Al hacer clic, puede navegar a un form de importación manual o mostrar un toast "Próximamente".

### 3.2 SearchAndFilter

| Campo | Valor |
|-------|-------|
| **Nombre** | `SearchAndFilter` |
| **Tipo** | Client Component — gestiona estado de búsqueda y filtros |
| **Props** | `onSearchChange: (query: string) => void` (obligatoria), `onFilterChange: (type: string) => void` (obligatoria), `activeFilter: string` (obligatoria) |
| **Estados** | **Búsqueda**: texto del input. **Filtros**: panel visible/oculto (toggle). **Filtro activo**: tipo seleccionado (`all` por defecto). |
| **Tokens** | Input fondo: `inBg`. Input borde: `inB`. Input texto: `t1` (13px). Placeholder: `t3`. Botón filtro inactivo: fondo `inBg`, borde `inB`, texto `t2` (12px). Botón filtro activo: fondo `actBg`, borde `acc` al 40%, texto `acc`. |
| **Responsive** | Sin diferencias significativas. Input flex:1, botón filtro fijo. |
| **Contenido** | Input de búsqueda con icono `Search` + botón toggle filtros con icono `Filter` |
| **Reutilizable** | Parcialmente — el input de búsqueda es un patrón reutilizable |

**Input de búsqueda**:
- Icono `Search` (15px, color `t3`) a la izquierda
- Placeholder: "Buscar..."
- Fondo: `inBg`, borde: `1px solid inB`, borderRadius: 10px
- Padding: `10px 12px` (con icono)
- Font: 13px, color `t1`

**Botón toggle filtros**:
- Icono `Filter` (13px)
- Padding: `9px 12px`, borderRadius: 10px
- Inactivo: fondo `inBg`, borde `inB`, color `t2`
- Activo: fondo `actBg`, borde `acc` al 40%, color `acc`

### 3.3 FilterChips

| Campo | Valor |
|-------|-------|
| **Nombre** | `FilterChips` |
| **Tipo** | Client Component — selección de filtro |
| **Props** | `activeFilter: string` (obligatoria), `onFilterChange: (type: string) => void` (obligatoria) |
| **Estados** | Chip activo: fondo `actBg`, borde `acc` al 40%, texto `acc`. Chip inactivo: fondo `inBg`, borde `inB`, texto `t2`. |
| **Tokens** | Chip activo: fondo `actBg`, borde `rgba(249,115,22,0.4)`, texto `acc`. Chip inactivo: fondo `inBg`, borde `inB`, texto `t2`. Font: 11px, weight 500. |
| **Responsive** | Chips con flex-wrap si no caben en una línea |
| **Contenido** | Chips: "Todas", "Intervalos", "Resistencia", "Recuperación", "Tempo" |
| **Reutilizable** | Parcialmente — patrón de chips seleccionables |

**Chips disponibles**:

| Key | Label |
|-----|-------|
| `all` | Todas |
| `intervals` | Intervalos |
| `endurance` | Resistencia |
| `recovery` | Recuperación |
| `tempo` | Tempo |

**Nota**: No se incluye `rest` (descanso) como filtro porque los días de descanso no son actividades con métricas.

**Estilo de chips**:
- Padding: `4px 10px`, borderRadius: 7px
- Font: 11px, weight 500

### 3.4 ActivityListItem

| Campo | Valor |
|-------|-------|
| **Nombre** | `ActivityListItem` |
| **Tipo** | Client Component — necesita onClick para navegar a detalle + hover |
| **Props** | `id: string` (obligatoria), `name: string` (obligatoria), `date: string` (obligatoria), `type: ActivityType` (obligatoria), `distanceKm: number \| null` (obligatoria), `durationFormatted: string` (obligatoria), `avgPower: number \| null` (obligatoria), `avgHR: number \| null` (obligatoria), `rpe: number \| null` (obligatoria) |
| **Estados** | Default. Hover (desktop): fondo cambia a `hover`. |
| **Tokens** | Card fondo: `card`. Card borde: `cardB`. BorderRadius: 12px. Padding: 14px desktop / 12px mobile. Nombre: `t1` (13px, weight 600). Badge tipo: color por tipo (ver tabla). Fecha: `t3` (11px). Métricas: `t1` (12px). Potencia: `#f97316` (weight 600). FC: `#ef4444`. Chevron: `t4` (14px). |
| **Responsive** | Desktop: icono + info + métricas en línea + RPE + chevron. Mobile: icono + info arriba, métricas en grid 4 cols abajo. Sin RPE visual en mobile. |
| **Contenido** | Icono tipo + nombre + badge tipo + fecha + métricas (dist, tiempo, potencia, FC) + indicador RPE + chevron |
| **Reutilizable** | Sí — evolución de `RecentActivityItem` del Dashboard con métricas extendidas y RPE |

**Icono de tipo** (a la izquierda):
- Contenedor: 36px desktop / 32px mobile, borderRadius 8px
- Fondo: color del tipo al 10% (`tc.bg`)
- Icono: `Activity` (15px), color del tipo (`tc.c`)

**Layout desktop** (una sola fila):
```
[Icono] [Nombre + Badge + Fecha]          [Dist] [Tiempo] [Potencia] [FC] [RPE ████████░░] [>]
```

**Layout mobile** (dos filas):
```
[Icono] [Nombre + Badge + Fecha]
[Dist.  ] [Pot.  ] [FC    ] [Tiempo]
  52.3km   205W    156bpm   1:45
```

**Métricas mobile** (grid 4 cols):

| Label | Valor | Color |
|-------|-------|-------|
| Dist. | `{dist}km` | `t1` |
| Pot. | `{pw}W` | `#f97316` |
| FC | `{hr}bpm` | `#ef4444` |
| Tiempo | `{time}` | `t1` |

- Label: 10px, color `t3`
- Valor: 12px, weight 600

### 3.5 RPEIndicator

| Campo | Valor |
|-------|-------|
| **Nombre** | `RPEIndicator` |
| **Tipo** | Server Component — solo renderiza basado en props |
| **Props** | `value: number \| null` (obligatoria, 1-10) |
| **Estados** | Con valor: 10 barras coloreadas según RPE. Sin valor (null): 10 barras grises. |
| **Tokens** | Barra activa: color según rango RPE. Barra inactiva: `t4` al 20%. |
| **Responsive** | Solo visible en desktop. Oculto en mobile. |
| **Contenido** | 10 barras verticales de 4x12px |
| **Reutilizable** | Sí — usado en Lista de Actividades, potencialmente en Detalle |

**Barras**:
- Dimensiones: 4px ancho × 12px alto
- BorderRadius: 2px
- Gap entre barras: 2px
- Barra activa (i < rpe): color según rango
- Barra inactiva (i >= rpe): `t4` al 20% opacidad (`${t.t4}20`)

**Colores por rango RPE** (ref: DESIGN-SYSTEM.md §2.2):

| Rango RPE | Color | Hex |
|-----------|-------|-----|
| 1-3 | Verde | `#22c55e` |
| 4-6 | Amarillo | `#eab308` |
| 7-8 | Naranja | `#f97316` |
| 9-10 | Rojo | `#ef4444` |

**Nota**: Todas las barras activas toman el color del rango al que pertenece el valor RPE (ej: RPE=8 → las 8 barras son naranja).

---

## 4. Jerarquía de Componentes

```
AppLayout (layout.tsx — Server Component)
├── Sidebar (Client) ♻️
│
└── ActivitiesPage (page.tsx — Server Component)
    ├── ActivitiesHeader (Server)
    │   ├── Título "Actividades" + "{N} registradas"
    │   └── Botón "Importar" (Upload icon)
    │
    ├── ActivitiesContent (Client — gestiona búsqueda, filtros, lista filtrada)
    │   ├── SearchAndFilter (Client)
    │   │   ├── Input de búsqueda (Search icon)
    │   │   └── Botón toggle filtros (Filter icon)
    │   │
    │   ├── FilterChips (Client, condicional — visible solo si filtros abiertos)
    │   │   └── Chip ×5 (Todas, Intervalos, Resistencia, Recuperación, Tempo)
    │   │
    │   └── ActivityListItem ×N ♻️
    │       ├── Icono tipo (Activity icon + color)
    │       ├── Nombre + Badge tipo + Fecha
    │       ├── Métricas (dist, tiempo, potencia, FC)
    │       ├── RPEIndicator ♻️ (solo desktop)
    │       └── ChevronRight (solo desktop)
    │
    └── EmptyState (Server, condicional — si no hay actividades)
```

**Leyenda**: ♻️ = Componente reutilizable

---

## 5. Datos Necesarios

### Datos del Servidor

| Dato | Fuente | Cuándo |
|------|--------|--------|
| Lista de actividades del usuario | `supabase.from('activities').select('*')` | Al cargar `/activities` |
| Perfil del usuario (para layout) | Compartido desde layout `(app)` | Al cargar la página |

### Datos del Cliente (Estado Local)

| Dato | Tipo | Componente | Valor inicial |
|------|------|-----------|---------------|
| `searchQuery` | `string` | ActivitiesContent | `""` |
| `activeFilter` | `string` | ActivitiesContent | `"all"` |
| `showFilters` | `boolean` | ActivitiesContent | `false` |
| `filteredActivities` | `Activity[]` | ActivitiesContent | Derivado (memo) |

### Contrato de datos

```typescript
interface ActivitiesPageData {
  activities: Array<{
    id: string;
    name: string;
    date: string;               // ISO date
    type: ActivityType;          // intervals | endurance | recovery | tempo | rest
    distance_km: number | null;
    duration_seconds: number;
    avg_power_watts: number | null;
    avg_hr_bpm: number | null;
    rpe: number | null;         // 1-10
  }>;
  totalCount: number;
}
```

### Lógica de filtrado (client-side)

```typescript
const filteredActivities = useMemo(() => {
  return activities.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = activeFilter === 'all' || a.type === activeFilter;
    return matchesSearch && matchesType;
  });
}, [activities, searchQuery, activeFilter]);
```

---

## 6. Flujos de Interacción

### Flujo 1: Carga de la lista (flujo feliz)

1. Usuario navega a `/activities` desde el Sidebar o desde "Ver todas →" del Dashboard.
2. Server Component obtiene todas las actividades del usuario, ordenadas por fecha DESC.
3. Renderiza el header con el total de actividades.
4. Renderiza la lista con todos los items.
5. Filtros ocultos por defecto, búsqueda vacía.

### Flujo 2: Búsqueda por nombre

1. Usuario escribe "Sierra" en el input de búsqueda.
2. La lista se filtra en tiempo real mostrando solo actividades cuyo nombre contiene "Sierra" (case-insensitive).
3. Si no hay resultados, mostrar: "No se encontraron actividades."
4. Al borrar el texto, vuelve a mostrar todas.

### Flujo 3: Filtrar por tipo

1. Usuario hace clic en el botón de filtros (icono `Filter`).
2. Se despliegan los chips de tipo debajo de la barra de búsqueda.
3. "Todas" está activa por defecto (fondo naranja).
4. El usuario hace clic en "Intervalos".
5. "Intervalos" se activa (fondo naranja), "Todas" se desactiva.
6. La lista muestra solo actividades de tipo `intervals`.
7. El filtro se combina con la búsqueda (ambos aplican simultáneamente).

### Flujo 4: Ver detalle de actividad

1. Usuario hace clic en un item de la lista.
2. Navega a `/activities/:id` (pantalla de Detalle).

### Flujo 5: Lista vacía (sin actividades)

1. Usuario nuevo sin actividades registradas.
2. El header muestra "0 registradas".
3. En lugar de la lista, se muestra un estado vacío: "Aún no tienes actividades. ¡Importa tu primera sesión!"
4. El botón "Importar" está visible y activo.

### Flujo 6: Importar actividad (placeholder)

1. Usuario hace clic en "Importar".
2. En esta fase: navega a `/activities/import` (form manual de creación) o muestra un toast indicando funcionalidad próxima.
3. La funcionalidad completa de importación (F04) se implementará en una fase posterior.

---

## 7. Tokens de Tema Aplicables

### Lista de Actividades

| Elemento | Token | Dark | Light |
|----------|-------|------|-------|
| Fondo página | `bg` | `#0c1320` | `#f8f9fb` |
| Título | `t1` | `#f1f5f9` | `#0f172a` |
| Contador | `t3` | `#64748b` | `#64748b` |
| Card actividad fondo | `card` | `rgba(255,255,255,0.02)` | `#ffffff` |
| Card actividad borde | `cardB` | `rgba(255,255,255,0.06)` | `#e2e8f0` |
| Card hover | `hover` | `rgba(255,255,255,0.04)` | `rgba(0,0,0,0.02)` |
| Input búsqueda fondo | `inBg` | `rgba(255,255,255,0.03)` | `#f8fafc` |
| Input búsqueda borde | `inB` | `rgba(255,255,255,0.08)` | `#e2e8f0` |
| Input texto | `t1` | `#f1f5f9` | `#0f172a` |
| Placeholder | `t3` | `#64748b` | `#64748b` |
| Filtro activo fondo | `actBg` | `rgba(249,115,22,0.12)` | `rgba(249,115,22,0.08)` |
| Filtro activo borde | — | `rgba(249,115,22,0.4)` | `rgba(249,115,22,0.4)` |
| Filtro activo texto | `acc` | `#f97316` | `#ea580c` |
| Filtro inactivo fondo | `inBg` | `rgba(255,255,255,0.03)` | `#f8fafc` |
| Filtro inactivo borde | `inB` | `rgba(255,255,255,0.08)` | `#e2e8f0` |
| Filtro inactivo texto | `t2` | `#94a3b8` | `#475569` |
| Nombre actividad | `t1` | `#f1f5f9` | `#0f172a` |
| Fecha | `t3` | `#64748b` | `#64748b` |
| Métrica distancia | `t1` | `#f1f5f9` | `#0f172a` |
| Métrica tiempo | `t2` | `#94a3b8` | `#475569` |
| Métrica potencia | — | `#f97316` | `#f97316` |
| Métrica FC | — | `#ef4444` | `#ef4444` |
| RPE barra inactiva | — | `${t4}20` | `${t4}20` |
| Chevron | `t4` | `#475569` | `#94a3b8` |

---

## 8. Componentes Reutilizables

| Componente | Usado en Actividades | Reutilizable en | shadcn/ui base | Crear custom |
|------------|---------------------|-----------------|----------------|--------------|
| **Sidebar** | Layout (compartido) | Todas las pantallas app | No — custom | Ya existe (Dashboard) ♻️ |
| **ActivityListItem** | Lista (N items) | Dashboard (RecentActivityItem es versión simplificada) | No — custom | Sí — extender `RecentActivityItem` |
| **RPEIndicator** | Dentro de cada ActivityListItem | Detalle de actividad, posiblemente Insights | No — custom | Sí |
| **SearchAndFilter** | Barra superior | Potencialmente en otras listas | No — custom | Sí |
| **FilterChips** | Debajo de búsqueda | Potencialmente en Insights | No — custom | Sí |

---

## 9. Transformaciones JSX Necesarias

### Lista de actividades — Layout

| Patrón mockup | Transformación Tailwind |
|---------------|------------------------|
| `display:"flex",justifyContent:"space-between"` | `flex justify-between items-center` |
| `marginBottom:mob?14:24` | `mb-3.5 md:mb-6` |
| `flexWrap:"wrap",gap:10` | `flex-wrap gap-2.5` |
| `fontSize:mob?22:26,fontWeight:700` | `text-[22px] md:text-[26px] font-bold` |

### Input de búsqueda

| Patrón mockup | Transformación Tailwind |
|---------------|------------------------|
| `flex:1,display:"flex",alignItems:"center",gap:8` | `flex-1 flex items-center gap-2` |
| `background:t.inBg,border:"1px solid "+t.inB,borderRadius:10` | `bg-[var(--input-bg)] border border-[var(--input-border)] rounded-[10px]` |
| `padding:"0 12px"` | `px-3` |
| `fontSize:13,color:t.t1,padding:"10px 0"` | `text-[13px] text-[var(--text-primary)] py-2.5` |

### Filter Chips

| Patrón mockup | Transformación Tailwind |
|---------------|------------------------|
| `padding:"4px 10px",borderRadius:7` | `px-2.5 py-1 rounded-[7px]` |
| `fontSize:11,fontWeight:500` | `text-[11px] font-medium` |
| activo: `border:"1px solid "+t.acc+"40",background:t.actBg` | `border border-orange-500/40 bg-[var(--active-bg)] text-[var(--accent)]` |

### Activity Item Card

| Patrón mockup | Transformación Tailwind |
|---------------|------------------------|
| `borderRadius:12,padding:mob?12:14` | `rounded-xl p-3 md:p-3.5` |
| `marginBottom:8` | `mb-2` |
| `cursor:"pointer"` | `cursor-pointer` |
| Hover: `background:t.hover` | `hover:bg-[var(--hover)]` |

### RPE Indicator

| Patrón mockup | Transformación Tailwind |
|---------------|------------------------|
| `display:"flex",gap:2` | `flex gap-0.5` |
| `width:4,height:12,borderRadius:2` | `w-1 h-3 rounded-sm` |
| color dinámico (por rango) | `style={{ backgroundColor }}` (prop dinámica) |

### Grid mobile métricas

| Patrón mockup | Transformación Tailwind |
|---------------|------------------------|
| `gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:6` | `grid grid-cols-4 gap-1.5` |
| Label: `fontSize:10,color:t.t3` | `text-[10px] text-[var(--text-tertiary)]` |
| Valor: `fontSize:12,fontWeight:600` | `text-xs font-semibold` |

---

## 10. Dependencias Externas

### Paquetes npm

| Paquete | Uso | Ya instalado |
|---------|-----|-------------|
| `lucide-react` | Iconos: Search, Filter, Upload, Activity, ChevronRight, Clock, Zap, Heart | Sí |
| `next-themes` | Toggle de tema en Sidebar | Sí |
| `@supabase/ssr` | Query de actividades (server-side) | Sí |

### Componentes shadcn/ui a instalar

| Componente | Uso |
|------------|-----|
| `input` | Posible base para input de búsqueda (evaluar) |

### Integraciones

| Servicio | Uso | Estado |
|----------|-----|--------|
| Supabase DB (tabla `activities`) | Query de actividades del usuario | ✅ Tabla creada |
| Supabase Auth | Verificación de sesión | ✅ Implementado |

---

## Apéndice: Datos Mock de Actividades

```typescript
const MOCK_ACTIVITIES = [
  { id: '1', name: 'Intervalos Sierra Norte',  date: '2026-02-14', type: 'intervals', distance_km: 52.3,  duration_seconds: 6300,  avg_power_watts: 205, avg_hr_bpm: 156, rpe: 8 },
  { id: '2', name: 'Rodaje Casa de Campo',     date: '2026-02-13', type: 'recovery',  distance_km: 28.1,  duration_seconds: 4200,  avg_power_watts: 152, avg_hr_bpm: 128, rpe: 4 },
  { id: '3', name: 'Ruta Navacerrada',         date: '2026-02-08', type: 'endurance', distance_km: 78.5,  duration_seconds: 12000, avg_power_watts: 188, avg_hr_bpm: 145, rpe: 7 },
  { id: '4', name: 'Tempo M-607',              date: '2026-02-07', type: 'tempo',     distance_km: 42.0,  duration_seconds: 5400,  avg_power_watts: 195, avg_hr_bpm: 151, rpe: 7 },
  { id: '5', name: 'Recuperación Retiro',       date: '2026-02-06', type: 'recovery',  distance_km: 18.5,  duration_seconds: 3000,  avg_power_watts: 130, avg_hr_bpm: 118, rpe: 3 },
  { id: '6', name: 'Intervalos Tres Cantos',   date: '2026-02-04', type: 'intervals', distance_km: 35.2,  duration_seconds: 4500,  avg_power_watts: 210, avg_hr_bpm: 162, rpe: 9 },
];
```

---

## Apéndice: Constantes de Filtros

```typescript
export const ACTIVITY_FILTERS = [
  { key: 'all',       label: 'Todas' },
  { key: 'intervals', label: 'Intervalos' },
  { key: 'endurance', label: 'Resistencia' },
  { key: 'recovery',  label: 'Recuperación' },
  { key: 'tempo',     label: 'Tempo' },
] as const;
```
