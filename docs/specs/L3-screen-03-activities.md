# L3 — Plan de Issues: Lista de Actividades

> **Input**: `docs/specs/L2-screen-03-activities.md`
> **Fase**: Fase 2
> **Fecha**: 2026-02-14

---

## Issue 1: Crear constantes compartidas para filtros y RPE

**Labels**: `type:feature`, `priority:p0`, `phase:2`
**Depende de**: —
**Estimación**: ~0.5h

### Descripción

Crear las constantes y funciones de utilidad necesarias para la pantalla de actividades: filtros de tipo de actividad y colores RPE con su función de cálculo. Estas constantes se alojan en `packages/shared` para reutilización en frontend y backend.

### Criterios de Aceptación

- [ ] Constante `ACTIVITY_FILTERS` exportada con 5 filtros: all, intervals, endurance, recovery, tempo
- [ ] Tipo `ActivityFilterKey` exportado
- [ ] Constante `RPE_COLORS` exportada con 4 rangos: low, moderate, high, max
- [ ] Función `getRPEColor(value: number): string` exportada y funcional
- [ ] `packages/shared/src/index.ts` actualizado con los re-exports
- [ ] `pnpm build` pasa sin errores
- [ ] `pnpm typecheck` pasa sin errores

### Archivos Afectados

**Crear**:
- `packages/shared/src/constants/activity-filters.ts` — Filtros de tipo de actividad
- `packages/shared/src/constants/rpe.ts` — Colores RPE + función `getRPEColor`

**Modificar**:
- `packages/shared/src/index.ts` — Re-exportar nuevas constantes

### Notas Técnicas

- `ACTIVITY_FILTERS` no incluye `rest` (los descansos no son actividades con métricas filtrables)
- `getRPEColor` devuelve: `#22c55e` (1-3), `#eab308` (4-6), `#f97316` (7-8), `#ef4444` (9-10)
- Usar `as const` en ambas constantes para type-safety
- Ref: L2 §3 para definiciones exactas

### Referencia de Diseño

- Diseño técnico L2: §3 (Constantes nuevas)
- DESIGN-SYSTEM.md: §2.2 (Colores RPE)

---

## Issue 2: Crear componente RPEIndicator

**Labels**: `type:feature`, `priority:p0`, `phase:2`
**Depende de**: Issue 1
**Estimación**: ~1h

### Descripción

Crear el componente visual `RPEIndicator` que renderiza 10 barras verticales coloreadas según el valor RPE (1-10). Las barras activas toman el color del rango al que pertenece el valor, las inactivas son grises. Se oculta en mobile.

### Criterios de Aceptación

- [ ] Componente `RPEIndicator` creado con prop `value: number | null`
- [ ] Renderiza 10 barras de 4×12px con borderRadius 2px y gap 2px
- [ ] Barras activas (i < value) toman el color del rango RPE
- [ ] Barras inactivas usan `t4` al 20% de opacidad
- [ ] Si value es null, todas las barras son inactivas
- [ ] Incluye `aria-label="RPE {value} de 10"` (o "RPE no registrado" si null)
- [ ] Dark/light mode funciona correctamente
- [ ] `pnpm build` pasa sin errores
- [ ] `pnpm lint` pasa sin errores

### Archivos Afectados

**Crear**:
- `apps/web/src/components/rpe-indicator.tsx` — Componente presentacional (10 barras)

### Notas Técnicas

- No necesita `'use client'` propio — funciona como hijo presentacional de Client Components
- Usa `getRPEColor()` de `packages/shared` para determinar el color
- Las barras se implementan como `<div>` con `style={{ backgroundColor }}` dinámico (el color depende del valor RPE, no de clases estáticas)
- Ref: L1 §3.5 para diseño visual, L2 §2.2 para interface

### Referencia de Diseño

- Spec funcional L1: §3.5 (RPEIndicator)
- Diseño técnico L2: §2.2 (RPEIndicator interface)
- DESIGN-SYSTEM.md: §2.5 (Indicador RPE)

---

## Issue 3: Crear componente ActivityListItem

**Labels**: `type:feature`, `priority:p0`, `phase:2`
**Depende de**: Issue 2
**Estimación**: ~2h

### Descripción

Crear el componente `ActivityListItem`: card clicable que muestra una actividad con icono de tipo, nombre, badge de tipo, fecha, métricas (distancia, tiempo, potencia, FC) e indicador RPE. Tiene dos layouts: desktop (todo en una fila) y mobile (info arriba, métricas en grid 4 cols abajo).

### Criterios de Aceptación

- [ ] Componente `ActivityListItem` creado con todas las props definidas en L2
- [ ] Envuelto en `next/link` para navegación a `/activities/${id}`
- [ ] Icono de tipo: contenedor 36px desktop / 32px mobile con icono `Activity` coloreado
- [ ] Badge de tipo con colores de `ACTIVITY_TYPES`
- [ ] Nombre truncado con ellipsis si es largo
- [ ] Fecha en formato compacto (ej: "14 feb")
- [ ] Desktop: métricas en línea (dist, tiempo, potencia en naranja, FC en rojo) + RPEIndicator + ChevronRight
- [ ] Mobile: métricas en grid 4 cols con labels (Dist., Pot., FC, Tiempo)
- [ ] Sin RPE en mobile
- [ ] Hover en desktop: fondo cambia a `hover` (con `hover:` de Tailwind)
- [ ] Valores null muestran "—"
- [ ] Dark/light mode funciona correctamente
- [ ] `pnpm build` pasa sin errores
- [ ] `pnpm lint` pasa sin errores

### Archivos Afectados

**Crear**:
- `apps/web/src/components/activity-list-item.tsx` — Card de actividad individual

### Notas Técnicas

- Usar `next/link` envolviendo toda la card para accesibilidad (navegable con teclado)
- El hover se implementa con Tailwind `hover:bg-[var(--hover)]` — Tailwind aplica `@media (hover: hover)` automáticamente
- La duración se pasa ya formateada (`durationFormatted`) — la conversión se hace en el componente padre
- Potencia en `#f97316` con weight 600, FC en `#ef4444`, distancia y tiempo en colores estándar (`t1`/`t2`)
- Card: `border-radius: 12px`, padding 14px desktop / 12px mobile, margin-bottom 8px
- Ref: L1 §3.4 para layout completo, L2 §2.2 para interface

### Referencia de Diseño

- Spec funcional L1: §3.4 (ActivityListItem)
- Diseño técnico L2: §2.2 (ActivityListItem interface y decisiones)
- DESIGN-SYSTEM.md: §2.2 (colores por tipo), §2.5 (Badge de tipo)

---

## Issue 4: Implementar página de Lista de Actividades

**Labels**: `type:feature`, `priority:p0`, `phase:2`
**Depende de**: Issue 3
**Estimación**: ~3h

### Descripción

Implementar la pantalla completa de Lista de Actividades: Server Component (`page.tsx`) que obtiene las actividades de Supabase, y Client Component (`ActivitiesContent`) que gestiona búsqueda por nombre, filtro por tipo (chips desplegables), y renderiza la lista filtrada. Incluye header con contador y botón "Importar" (placeholder), estados vacíos.

### Criterios de Aceptación

- [ ] `page.tsx` (Server Component) obtiene actividades del usuario ordenadas por fecha DESC
- [ ] Solo selecciona campos necesarios (sin `ai_analysis`)
- [ ] `ActivitiesContent` (Client Component) renderiza header, búsqueda, filtros y lista
- [ ] Header: título "Actividades" + "{N} registradas" + botón "Importar" (gradient naranja)
- [ ] Input de búsqueda con icono `Search` — filtra por nombre en tiempo real (case-insensitive)
- [ ] Botón toggle filtros con icono `Filter` — muestra/oculta chips
- [ ] Filtro activo: fondo `actBg`, borde `acc` al 40%, texto `acc`
- [ ] Filtro inactivo: fondo `inBg`, borde `inB`, texto `t2`
- [ ] Chips: "Todas", "Intervalos", "Resistencia", "Recuperación", "Tempo"
- [ ] Búsqueda y filtro se combinan (ambos aplican simultáneamente)
- [ ] Estado vacío (sin actividades): mensaje invitando a importar
- [ ] Estado sin resultados (filtros activos): "No se encontraron actividades."
- [ ] Botón "Importar" funciona como placeholder (muestra toast o navega a form futuro)
- [ ] Duración formateada con `formatDuration` (reutilizada del Dashboard)
- [ ] Responsive: métricas inline en desktop, grid 4 cols en mobile
- [ ] Dark/light mode funciona correctamente
- [ ] `pnpm build` pasa sin errores
- [ ] `pnpm lint` pasa sin errores
- [ ] `pnpm typecheck` pasa sin errores

### Archivos Afectados

**Crear**:
- `apps/web/src/app/(app)/activities/page.tsx` — Server Component: query + render
- `apps/web/src/app/(app)/activities/activities-content.tsx` — Client Component: búsqueda + filtros + lista

### Notas Técnicas

- El filtrado es client-side con `useMemo` (ref: ADR-016). Para el MVP, se cargan todas las actividades — paginación server-side se añadirá si el volumen crece
- La query Supabase selecciona solo los campos necesarios: `id, name, date, type, distance_km, duration_seconds, avg_power_watts, avg_hr_bpm, rpe`
- El botón "Importar" puede usar `next/link` a `/activities/import` o un `onClick` con toast `sonner`/`alert`
- Si `formatDuration` no existe aún (se define en L2-screen-01), crear una versión local en `lib/activities/` o en el componente
- Manejar la discrepancia de `activity_type` ENUM (outdoor/indoor/recovery vs intervals/endurance/recovery/tempo/rest) — `ACTIVITY_TYPES` incluye ambos mapeos
- Input de búsqueda: `aria-label="Buscar actividades"`, `role="searchbox"`
- Filter chips: `role="radiogroup"` con `role="radio"` y `aria-checked`

### Referencia de Diseño

- Spec funcional L1: §3.1-3.3 (Header, Search, FilterChips), §4 (jerarquía), §5 (datos), §6 (flujos)
- Diseño técnico L2: §2 (arquitectura), §3 (queries), §6 (ADRs)
- DESIGN-SYSTEM.md: §1.2 (Lista de Actividades), §2.5 (Input de búsqueda)

---

## Issue 5: Tests de constantes RPE y componente RPEIndicator

**Labels**: `type:test`, `priority:p1`, `phase:2`
**Depende de**: Issue 1, Issue 2
**Estimación**: ~1h

### Descripción

Crear tests unitarios para las constantes de RPE, la función `getRPEColor`, y el componente `RPEIndicator`.

### Criterios de Aceptación

- [ ] Tests de `getRPEColor`: retorna verde para 1-3, amarillo para 4-6, naranja para 7-8, rojo para 9-10
- [ ] Tests de `RPE_COLORS`: tiene 4 entries (low, moderate, high, max)
- [ ] Tests de `ACTIVITY_FILTERS`: tiene 5 entries, no incluye `rest`
- [ ] Tests de `RPEIndicator`: renderiza 10 barras, colorea correctamente según valor, maneja null
- [ ] `pnpm test` pasa sin errores

### Archivos Afectados

**Crear**:
- `packages/shared/src/constants/rpe.test.ts` — Tests de getRPEColor y RPE_COLORS
- `packages/shared/src/constants/activity-filters.test.ts` — Tests de ACTIVITY_FILTERS
- `apps/web/src/components/rpe-indicator.test.tsx` — Tests de RPEIndicator

### Notas Técnicas

- Para tests en `packages/shared`: vitest
- Para tests en `apps/web`: vitest + @testing-library/react
- RPEIndicator test: verificar número de barras con `role="img"` o por estructura DOM, verificar `aria-label`
- Priorizar tests de `getRPEColor` (lógica pura, alta cobertura)

### Referencia de Diseño

- Diseño técnico L2: §3 (constantes y función getRPEColor)
- CLAUDE.md: "Unitarios para lógica compleja"

---

## Resumen de Dependencias

```
Issue 1: Constantes RPE + filtros (shared)         ← base (sin dependencias)
Issue 2: Componente RPEIndicator                    ← depende de 1
Issue 3: Componente ActivityListItem                ← depende de 2
Issue 4: Página Lista de Actividades                ← depende de 3
Issue 5: Tests de constantes y RPEIndicator         ← depende de 1, 2
```

---

## Orden de Implementación Recomendado

### Capa 1 — Constantes y utilidades
1. **Issue 1**: Constantes compartidas (filtros + RPE)

### Capa 2 — Componentes reutilizables
2. **Issue 2**: RPEIndicator
3. **Issue 3**: ActivityListItem

### Capa 3 — Pantalla completa
4. **Issue 4**: Página de Lista de Actividades

### Capa 4 — Calidad
5. **Issue 5**: Tests unitarios

---

## Prerequisitos externos (de otras specs)

| Prerequisito | Spec origen | ¿Bloqueante? |
|-------------|-------------|-------------|
| Layout `(app)` con Sidebar | L2-screen-01 (Dashboard) | Sí — necesario para que exista la ruta `(app)/activities` |
| `ACTIVITY_TYPES` constante | L2-screen-01 (Dashboard) | Sí — necesario para badges de tipo |
| `formatDuration` función | L2-screen-01 (Dashboard) | No — se puede crear versión local como fallback |
| Tabla `activities` con datos | Supabase migration 001 | Sí — necesario para que la query devuelva datos |
