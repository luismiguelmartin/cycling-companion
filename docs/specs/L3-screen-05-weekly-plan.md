# L3 — Plan de Issues: Planificación Semanal

> **Input**: `docs/specs/L2-screen-05-weekly-plan.md`
> **Fase**: Fase 2
> **Fecha**: 2026-02-14

---

## Issue 1: Crear tabla weekly_plans en Supabase con RLS

**Labels**: `type:feature`, `priority:p1`, `phase:2`
**Depende de**: —
**Estimación**: ~1h

### Descripción

Crear la tabla `public.weekly_plans` en Supabase para almacenar los planes semanales generados por la IA. Incluye campo JSONB para los 7 días del plan, políticas RLS, constraint de unicidad (user_id + week_start) y trigger de `updated_at`.

### Criterios de Aceptación

- [ ] Tabla `public.weekly_plans` creada con todos los campos: id, user_id, week_start, week_end, plan_data (JSONB), ai_rationale, created_at, updated_at
- [ ] `user_id` referencia `public.users(id)` con ON DELETE CASCADE
- [ ] UNIQUE constraint en `(user_id, week_start)`
- [ ] CHECK constraint: `week_end = week_start + INTERVAL '6 days'`
- [ ] RLS habilitado con 3 políticas: SELECT, INSERT, UPDATE (usando `auth.uid() = user_id`)
- [ ] Trigger `set_updated_at` configurado
- [ ] Script SQL guardado en `supabase/migrations/`
- [ ] `pnpm build` pasa sin errores

### Archivos Afectados

**Crear**:
- `supabase/migrations/XXX_create_weekly_plans_table.sql` — Script SQL completo

### Notas Técnicas

- El SQL debe ser idempotente
- `plan_data` es JSONB con array de 7 objetos PlanDay (ref: L2 §3, ADR-023)
- Reutilizar la función `set_updated_at()` si ya existe (creada en migration de users)
- Ref: L2 §3 para el SQL completo

### Referencia de Diseño

- Diseño técnico L2: §3 (Modelo de Datos — Tabla weekly_plans)
- PRD: §3.3 (modelo weekly_plans)

---

## Issue 2: Crear schemas Zod y constantes para plan semanal en packages/shared

**Labels**: `type:feature`, `priority:p1`, `phase:2`
**Depende de**: —
**Estimación**: ~1h

### Descripción

Crear los schemas Zod de validación y las constantes compartidas para el plan semanal: `planDaySchema`, `weeklyPlanSchema`, `intensityLevelEnum` y la constante `INTENSITY_LEVELS`.

### Criterios de Aceptación

- [ ] Schema `planDaySchema` creado con todos los campos (day, date, type, title, intensity, duration, description, nutrition, rest, done, actual_power)
- [ ] Schema `weeklyPlanSchema` creado (plan_data con array de 7 PlanDay)
- [ ] Enum `intensityLevelEnum` con 5 valores: alta, media-alta, media, baja, —
- [ ] Constante `INTENSITY_LEVELS` con colores por nivel
- [ ] Tipos exportados: `PlanDay`, `WeeklyPlan`, `IntensityLevel`
- [ ] `index.ts` actualizado re-exportando todo
- [ ] `pnpm build` pasa sin errores
- [ ] `pnpm typecheck` pasa sin errores

### Archivos Afectados

**Crear**:
- `packages/shared/src/schemas/weekly-plan.ts` — Schemas Zod
- `packages/shared/src/constants/intensity-levels.ts` — Constantes de intensidad

**Modificar**:
- `packages/shared/src/index.ts` — Re-exportar schemas y constantes

### Notas Técnicas

- `intensityLevelEnum` reutiliza `activityTypeEnum` de `schemas/activity.ts` para el campo `type`
- Ref: L2 §3 para los schemas completos

### Referencia de Diseño

- Diseño técnico L2: §3 (Schemas Zod nuevos)
- Spec funcional L1: §5 (Contrato de datos)

---

## Issue 3: Crear funciones de cálculo del plan semanal

**Labels**: `type:feature`, `priority:p1`, `phase:2`
**Depende de**: Issue 2
**Estimación**: ~1.5h

### Descripción

Implementar las funciones puras de cálculo para la pantalla del plan: cruce plan-actividades, cálculo de TSS semanal, obtención de inicio de semana, formateo de rango, e identificación del día actual.

### Criterios de Aceptación

- [ ] `mergePlanWithActivities()` cruza plan con actividades reales correctamente
- [ ] `calculateWeeklyTSS()` suma TSS de un array de actividades
- [ ] `getWeekStart()` devuelve el lunes de la semana (con offset opcional)
- [ ] `formatWeekRange()` formatea "10 — 16 feb 2026" correctamente
- [ ] `getTodayIndex()` devuelve 0-6 si el día actual está en la semana, -1 si no
- [ ] Tests unitarios para cada función
- [ ] `pnpm test` pasa sin errores
- [ ] `pnpm typecheck` pasa sin errores

### Archivos Afectados

**Crear**:
- `apps/web/src/lib/plan/calculations.ts` — Funciones de cálculo
- `apps/web/src/lib/plan/calculations.test.ts` — Tests unitarios

### Notas Técnicas

- `mergePlanWithActivities` debe comparar día+mes+año (no solo día del mes) para evitar falsos positivos entre meses
- `getWeekStart` con offset=0 devuelve el lunes de esta semana, offset=-1 la anterior, offset=1 la siguiente
- Días de descanso (`rest`) con fecha pasada se consideran `done: true` automáticamente
- Ref: L2 §3 para las firmas y L2 ADR-025 para la lógica de detección

### Referencia de Diseño

- Diseño técnico L2: §3 (Funciones de cálculo)
- Spec funcional L1: §5 (Datos Necesarios)

---

## Issue 4: Crear componente TipCard (nutrición/descanso)

**Labels**: `type:feature`, `priority:p1`, `phase:2`
**Depende de**: —
**Estimación**: ~0.5h

### Descripción

Crear el componente reutilizable `TipCard` con dos variantes: nutrición (amarillo, icono Sun) y descanso (violeta, icono Moon). Implementado con Tailwind CSS y tema dark/light.

### Criterios de Aceptación

- [ ] `TipCard` con prop `variant: 'nutrition' | 'rest'` y `text: string`
- [ ] Variante nutrición: fondo amarillo sutil, borde amarillo, icono Sun, título "Nutrición"
- [ ] Variante descanso: fondo violeta sutil, borde violeta, icono Moon, título "Descanso"
- [ ] Funciona en dark/light mode
- [ ] `pnpm build` pasa sin errores
- [ ] `pnpm typecheck` pasa sin errores

### Archivos Afectados

**Crear**:
- `apps/web/src/components/tip-card.tsx` — Componente TipCard

### Notas Técnicas

- Usar objeto `VARIANTS` con configuración por variante (ref: L2 §2.2 TipCard)
- Extensible: se puede añadir variant 'hydration' en futuro
- Padding 14px (p-3.5), radius 12px (rounded-xl)
- Ref: L1 §3.5 y §3.6 para tokens exactos

### Referencia de Diseño

- Spec funcional L1: §3.5 (NutritionCard), §3.6 (RestCard)
- Diseño técnico L2: §2.2 (TipCard), ADR-024

---

## Issue 5: Crear componente WeeklyLoadBar

**Labels**: `type:feature`, `priority:p1`, `phase:2`
**Depende de**: —
**Estimación**: ~0.5h

### Descripción

Crear el componente `WeeklyLoadBar` que muestra la barra de carga semanal con gradient (verde→amarillo→naranja), valor TSS actual, y escala de referencia.

### Criterios de Aceptación

- [ ] Barra degradada (verde→amarillo→naranja) con ancho proporcional al TSS
- [ ] Label "Carga semanal" + valor TSS con color según nivel (verde/amarillo/rojo)
- [ ] Icono ⚠️ cuando TSS > media
- [ ] Escala inferior: 0 / Media: {avg} / {max}
- [ ] Funciona en dark/light mode
- [ ] `pnpm build` pasa sin errores
- [ ] `pnpm typecheck` pasa sin errores

### Archivos Afectados

**Crear**:
- `apps/web/src/components/weekly-load-bar.tsx` — Componente WeeklyLoadBar

### Notas Técnicas

- Barra: `h-[7px] rounded-full bg-gradient-to-r from-green-500 via-yellow-500 to-orange-500`
- Ancho dinámico via style inline: `width: ${(currentTSS / maxTSS) * 100}%`
- `maxTSS` default: `avgTSS * 1.5`
- Ref: L1 §3.2 para tokens exactos

### Referencia de Diseño

- Spec funcional L1: §3.2 (WeeklyLoadBar)
- DESIGN-SYSTEM.md: §1 Screen-05

---

## Issue 6: Implementar pantalla de Planificación Semanal

**Labels**: `type:feature`, `priority:p1`, `phase:2`
**Depende de**: Issue 1, Issue 2, Issue 3, Issue 4, Issue 5
**Estimación**: ~3h

### Descripción

Implementar la pantalla completa de Planificación Semanal: Server Component page con query de plan y actividades, Client Component con grid de 7 días seleccionable, detalle del día, tips de nutrición/descanso, y barra de carga. Usar datos mock hasta integración con IA.

### Criterios de Aceptación

- [ ] `page.tsx` verifica auth, obtiene plan de `weekly_plans` y actividades de la semana
- [ ] Si no hay plan, muestra estado vacío con mensaje y botón placeholder
- [ ] Grid de 7 días visible: desktop 7 cols, mobile 2 cols
- [ ] Día actual marcado con badge "HOY"
- [ ] Seleccionar un día actualiza el detalle inferior
- [ ] Días completados (con actividad) muestran "✓ {pw}W" o "✓ Cumplido"
- [ ] Días completados tienen opacidad 0.7
- [ ] Detalle muestra: emoji + título + fecha + descripción + duración
- [ ] TipCard nutrición y TipCard descanso muestran tips del día
- [ ] WeeklyLoadBar muestra TSS de la semana
- [ ] Botón "Recalcular" muestra toast "Funcionalidad próximamente" (sin API)
- [ ] Navegación de semana (← →) deshabilitada o funcional con searchParams
- [ ] Dark/light mode funciona
- [ ] `pnpm build` pasa sin errores
- [ ] `pnpm lint` pasa sin errores
- [ ] `pnpm typecheck` pasa sin errores

### Archivos Afectados

**Crear**:
- `apps/web/src/app/(app)/plan/page.tsx` — Server Component
- `apps/web/src/app/(app)/plan/plan-content.tsx` — Client Component
- `apps/web/src/app/(app)/plan/day-grid.tsx` — Grid de días
- `apps/web/src/app/(app)/plan/day-detail.tsx` — Detalle del día

### Notas Técnicas

- El día inicial seleccionado es el día actual de la semana (o 0 si la semana no contiene hoy)
- Color de selección: background del tipo de actividad al 10% + borde al 40%
- Badge de intensidad: color según `INTENSITY_LEVELS`
- Para el MVP sin API: insertar datos mock en `weekly_plans` via seed o mostrar datos mock directamente
- Ref: L1 §6 para todos los flujos de interacción
- Ref: L2 §2 para la arquitectura de componentes

### Referencia de Diseño

- Spec funcional L1: completo (todos los componentes y flujos)
- Diseño técnico L2: §2 (Arquitectura), §3 (Modelo de Datos), §5 (Estructura de Archivos)
- DESIGN-SYSTEM.md: §1 Screen-05

---

## Issue 7: Seed de datos mock para plan semanal

**Labels**: `type:feature`, `priority:p2`, `phase:2`
**Depende de**: Issue 1
**Estimación**: ~0.5h

### Descripción

Crear un script o datos de seed que inserte un plan semanal de ejemplo en `weekly_plans` para poder visualizar la pantalla sin integración con IA.

### Criterios de Aceptación

- [ ] Script o datos JSON que insertan 1 registro en `weekly_plans`
- [ ] Los datos corresponden al `MOCK_PLAN` del L1 (7 días con tipos variados)
- [ ] El campo `ai_rationale` tiene un texto explicativo de ejemplo
- [ ] El script es idempotente (usa UPSERT o verifica existencia)

### Archivos Afectados

**Crear**:
- `data/mock/weekly-plan.json` — Datos mock del plan

**Modificar (opcional)**:
- Script de seed existente

### Notas Técnicas

- Usar los datos del apéndice del L1 (MOCK_PLAN)
- `week_start` debe ser un lunes válido cercano a la fecha actual
- Ref: L1 Apéndice para los datos exactos

### Referencia de Diseño

- Spec funcional L1: Apéndice (Datos Mock del Plan Semanal)

---

## Resumen de Dependencias

```
Issue 1: Tabla weekly_plans                    ← base (sin dependencias)
Issue 2: Schemas Zod + constantes              ← base (sin dependencias)
Issue 4: Componente TipCard                    ← base (sin dependencias)
Issue 5: Componente WeeklyLoadBar              ← base (sin dependencias)
Issue 3: Funciones de cálculo                  ← depende de 2
Issue 6: Pantalla completa                     ← depende de 1, 2, 3, 4, 5
Issue 7: Seed datos mock                       ← depende de 1
```

---

## Orden de Implementación Recomendado

### Capa 1 — Infraestructura (paralelizable)
1. **Issue 1**: Tabla weekly_plans en Supabase
2. **Issue 2**: Schemas Zod + constantes en shared
3. **Issue 4**: Componente TipCard
4. **Issue 5**: Componente WeeklyLoadBar

### Capa 2 — Lógica
5. **Issue 3**: Funciones de cálculo

### Capa 3 — Pantalla
6. **Issue 6**: Pantalla completa de Planificación Semanal

### Capa 4 — Datos
7. **Issue 7**: Seed de datos mock
