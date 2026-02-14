# L3 — Plan de Issues: Detalle de Actividad

> **Input**: `docs/specs/L2-screen-04-activity-detail.md`
> **Fase**: Fase 2
> **Fecha**: 2026-02-14

---

## Issue 1: Crear componente BackButton reutilizable

**Labels**: `type:feature`, `priority:p0`, `phase:2`
**Depende de**: —
**Estimación**: ~0.5h

### Descripción

Crear un componente `BackButton` reutilizable que muestra un icono `ArrowLeft` en un contenedor cuadrado + texto "Volver". Por defecto usa `router.back()`, pero acepta un `href` opcional para forzar destino.

### Criterios de Aceptación

- [ ] Componente `BackButton` creado con props opcionales `href` y `label`
- [ ] Si se proporciona `href`, renderiza un `next/link`
- [ ] Si no, usa `router.back()` con fallback a `/activities` si no hay historial
- [ ] Icono en contenedor 28×28px, borderRadius 6px, fondo `inBg`, borde `inB`
- [ ] Icono `ArrowLeft` 14px, color `t2`
- [ ] Texto "Volver" (o label custom) 12px, color `t3`
- [ ] Cursor pointer, gap 8px entre icono y texto
- [ ] `aria-label="Volver a la lista de actividades"` (o label custom)
- [ ] Dark/light mode funciona correctamente
- [ ] `pnpm build` pasa sin errores
- [ ] `pnpm lint` pasa sin errores

### Archivos Afectados

**Crear**:
- `apps/web/src/components/back-button.tsx` — Client Component con `useRouter`

### Notas Técnicas

- Client Component porque usa `useRouter()` de `next/navigation`
- Fallback de `router.back()`: verificar `window.history.length > 1` antes de llamar; si no hay historial, navegar a `/activities`
- Ref: L1 §3.1 para diseño visual, L2 §2.2 (ADR-022) para la decisión de fallback

### Referencia de Diseño

- Spec funcional L1: §3.1 (BackButton)
- Diseño técnico L2: §2.2 (BackButton interface), ADR-022
- DESIGN-SYSTEM.md: §2.4 (espaciado, bordes)

---

## Issue 2: Crear componente MetricsGrid

**Labels**: `type:feature`, `priority:p0`, `phase:2`
**Depende de**: —
**Estimación**: ~1.5h

### Descripción

Crear el componente `MetricsGrid`: grid de metric cards compactas que muestra icono coloreado + label + valor grande + unidad. Acepta un array genérico de métricas, responsive 6 cols desktop / 3 cols mobile.

### Criterios de Aceptación

- [ ] Componente `MetricsGrid` creado con props `metrics: MetricItem[]`
- [ ] Interface `MetricItem` exportada: `{ icon, iconColor, label, value, unit }`
- [ ] Grid responsive: 6 cols desktop, 3 cols mobile (2 filas de 3)
- [ ] Cada card: fondo `card`, borde `cardB`, borderRadius 10px, padding 12px desktop / 8px mobile
- [ ] Icono (12px) + label (`t3`, 10px) en línea con gap 5px
- [ ] Valor: `t1`, 20px desktop / 16px mobile, weight 700
- [ ] Unidad: `t3`, 10px, marginLeft 2px
- [ ] Valores "—" cuando la métrica es null
- [ ] Dark/light mode funciona correctamente
- [ ] `pnpm build` pasa sin errores
- [ ] `pnpm lint` pasa sin errores

### Archivos Afectados

**Crear**:
- `apps/web/src/components/metrics-grid.tsx` — Grid de metric cards compactas

### Notas Técnicas

- No necesita `'use client'` propio — componente presentacional puro
- Los valores se pasan pre-formateados como string (la conversión se hace en el server/padre)
- Es diferente de `KPICard` del Dashboard (sin badge de tendencia, más compacto)
- El array acepta cualquier número de métricas — 6 para detalle de actividad, potencialmente distinto en otros contextos
- Ref: L1 §3.3 para las 6 métricas y sus iconos/colores, L2 §2.2 (ADR-021) para la decisión de separar de KPICard

### Referencia de Diseño

- Spec funcional L1: §3.3 (MetricsGrid)
- Diseño técnico L2: §2.2 (MetricsGrid interface), ADR-021
- DESIGN-SYSTEM.md: §2.5 (KPI Card — variante compacta)

---

## Issue 3: Crear componente ActivityChart con selector de serie

**Labels**: `type:feature`, `priority:p0`, `phase:2`
**Depende de**: —
**Estimación**: ~2.5h

### Descripción

Crear el componente `ActivityChart`: gráfica temporal usando Recharts con selector de serie (Potencia / FC / Cadencia). Muestra un `AreaChart` con gradient que cambia de color según la tab activa. Incluye tabs de selección estilizadas con el color de cada serie.

### Criterios de Aceptación

- [ ] Componente `ActivityChart` creado con prop `data` (array de puntos con min, power, hr, cadence)
- [ ] 3 tabs de selección: Potencia (naranja `#f97316`), FC (rojo `#ef4444`), Cadencia (violeta `#8b5cf6`)
- [ ] Tab activa: fondo al 15% del color, borde al 40%, texto del color
- [ ] Tab inactiva: fondo transparente, borde `inB`, texto `t3`
- [ ] AreaChart de Recharts con gradient SVG vertical (color al 25% → 0%)
- [ ] XAxis con minutos (`{v}'`), YAxis sin axisLine/tickLine, ambos fontSize 10 color `t3`
- [ ] CartesianGrid con stroke sutil (`grid` token)
- [ ] Tooltip con fondo `ttBg`, borde `ttB`, borderRadius 8, fontSize 11
- [ ] Area: type monotone, strokeWidth 1.5, dot false
- [ ] Al cambiar de tab, el gráfico se actualiza con el dataKey y color correspondiente
- [ ] No hay colisión de gradient SVG ID (usar `useId()` o ID dinámico)
- [ ] Responsive: height 220px desktop, 160px mobile
- [ ] Card contenedora: fondo `card`, borde `cardB`, borderRadius 14px, padding 18px desktop / 12px mobile
- [ ] Estado vacío si `data` está vacío: "No hay datos de series temporales para esta actividad."
- [ ] Dark/light mode funciona correctamente
- [ ] `pnpm build` pasa sin errores
- [ ] `pnpm lint` pasa sin errores

### Archivos Afectados

**Crear**:
- `apps/web/src/components/charts/activity-chart.tsx` — Client Component con Recharts

### Notas Técnicas

- Client Component obligatorio por Recharts (acceso al DOM)
- Estado interno: `activeChart` con tipo `'power' | 'hr' | 'cadence'`, default `'power'`
- Gradient SVG: usar `useId()` (React 18+) o `chart-gradient-${activeChart}` para evitar colisiones (ref: L2 §8 Riesgo 5)
- Reutiliza el mismo patrón de AreaChart con gradient del `PowerTrendChart` del Dashboard, pero con tabs y dataKey dinámico
- Tooltip debe funcionar en dark/light (usar CSS variables)
- Ref: L1 §3.4 para configuración Recharts exacta, L2 §2.2 para interface

### Referencia de Diseño

- Spec funcional L1: §3.4 (ActivityChart)
- Diseño técnico L2: §2.2 (ActivityChart interface y estado)
- DESIGN-SYSTEM.md: §1.3 (Gráficas con selector)

---

## Issue 4: Crear componente AIAnalysisCard

**Labels**: `type:feature`, `priority:p0`, `phase:2`
**Depende de**: —
**Estimación**: ~1.5h

### Descripción

Crear el componente `AIAnalysisCard`: tarjeta con análisis IA de una sesión de entrenamiento. Incluye badge "ANÁLISIS IA" con icono Zap, texto de análisis con highlights coloreados, separador, y 3 tips (hidratación, nutrición, sueño). Variante de `AICoachCard` del Dashboard con contenido específico de sesión.

### Criterios de Aceptación

- [ ] Componente `AIAnalysisCard` creado con prop `analysis: AIAnalysis | null`
- [ ] Fondo gradient naranja sutil (`aiBg`), borde `aiB`, borderRadius 14px
- [ ] Badge: icono Zap (13px, blanco) en contenedor gradient naranja (28×28px, borderRadius 8px) + texto "ANÁLISIS IA" (12px, weight 700, uppercase, naranja)
- [ ] Texto de análisis: summary + recommendation, 13px, line-height 1.7, color `t2`
- [ ] Tips debajo del separador con iconos coloreados: Droplets (azul), Sun (amarillo), Moon (violeta)
- [ ] Separador: `1px solid rgba(249,115,22,0.12)`, marginTop 12px, paddingTop 10px
- [ ] Tips con flex-wrap, gap 14px desktop / 8px mobile
- [ ] Estado vacío (analysis null): badge + texto "El análisis IA se generará automáticamente cuando esté disponible."
- [ ] Dark/light mode funciona correctamente
- [ ] `pnpm build` pasa sin errores
- [ ] `pnpm lint` pasa sin errores

### Archivos Afectados

**Crear**:
- `apps/web/src/components/ai-analysis-card.tsx` — Componente presentacional

### Notas Técnicas

- No necesita `'use client'` propio — componente presentacional
- Los highlights en el texto (potencia en naranja, positivo en verde, recomendación en azul) se implementan con `<strong>` tags que vienen en el HTML del campo `ai_analysis`
- Para el MVP, el `ai_analysis` de la DB contendrá texto simple. Los highlights se pueden implementar como texto plano sin HTML parsing
- Diferencia con `AICoachCard`: badge dice "ANÁLISIS IA" (no "ENTRENADOR IA"), contenido es análisis de sesión (no recomendación diaria), tips son de recuperación post-sesión
- Ref: L1 §3.5 para diseño, L2 §2.2 (ADR-019) para la decisión de separar de AICoachCard

### Referencia de Diseño

- Spec funcional L1: §3.5 (AIAnalysisCard)
- Diseño técnico L2: §2.2 (AIAnalysisCard interface), ADR-019
- DESIGN-SYSTEM.md: §2.5 (Tarjeta Entrenador IA — variante)

---

## Issue 5: Crear funciones de utilidad para el detalle de actividad

**Labels**: `type:feature`, `priority:p0`, `phase:2`
**Depende de**: —
**Estimación**: ~1h

### Descripción

Crear las funciones de utilidad necesarias para la pantalla de detalle: transformación de series temporales (de formato DB a formato Recharts) y formateo de fecha en español. Incluye schema Zod para validar la estructura de `ai_analysis`.

### Criterios de Aceptación

- [ ] Función `transformTimeSeries` creada: convierte `timestamp_seconds` a minutos, mapea campos
- [ ] Función `formatActivityDate` creada: convierte ISO date a "14 feb 2026"
- [ ] Schema `aiAnalysisSchema` creado para validar estructura del campo JSONB
- [ ] Todas las funciones exportadas correctamente
- [ ] `pnpm build` pasa sin errores
- [ ] `pnpm typecheck` pasa sin errores

### Archivos Afectados

**Crear**:
- `apps/web/src/lib/activities/transform-time-series.ts` — Transformación de series temporales
- `apps/web/src/lib/activities/format-date.ts` — Formateo de fecha en español

### Notas Técnicas

- `transformTimeSeries`: recibe array de `{ timestamp_seconds, power_watts, hr_bpm, cadence_rpm }` y devuelve array de `{ min, power, hr, cadence }` donde `min = Math.round(timestamp_seconds / 60)`
- `formatActivityDate`: usa array de meses abreviados en español (`ene`, `feb`, ..., `dic`). No usar `Intl.DateTimeFormat` para evitar inconsistencias entre server y client
- `aiAnalysisSchema`: valida `{ summary: string, recommendation: string, tips: { hydration?, nutrition?, sleep? } }`. Si la validación falla, tratar como null
- Ref: L2 §3 para definiciones exactas

### Referencia de Diseño

- Diseño técnico L2: §3 (Transformación de series temporales, Formato de fecha, Schema ai_analysis)

---

## Issue 6: Implementar página de Detalle de Actividad

**Labels**: `type:feature`, `priority:p0`, `phase:2`
**Depende de**: Issue 1, Issue 2, Issue 3, Issue 4, Issue 5
**Estimación**: ~3h

### Descripción

Implementar la pantalla completa de Detalle de Actividad: Server Component (`page.tsx`) que obtiene la actividad y sus series temporales de Supabase, y Client Component (`ActivityDetailContent`) que compone todas las secciones: BackButton, DetailHeader, MetricsGrid, ActivityChart, AIAnalysisCard. Incluye manejo de 404 y estados vacíos.

### Criterios de Aceptación

- [ ] `page.tsx` (Server Component) obtiene actividad por ID con verificación de propiedad (RLS)
- [ ] Si la actividad no existe, llama a `notFound()` (Next.js 404)
- [ ] Obtiene series temporales de `activity_metrics` ordenadas por `timestamp_seconds`
- [ ] Transforma series temporales al formato de gráfica
- [ ] Valida `ai_analysis` con schema Zod (si inválido, pasa null)
- [ ] `ActivityDetailContent` (Client Component) compone todas las secciones
- [ ] BackButton navega atrás con fallback a `/activities`
- [ ] DetailHeader muestra nombre (h1), badge de tipo, fecha formateada
- [ ] MetricsGrid muestra 6 métricas: Dist, Tiempo, Pot, FC, Cadencia, TSS
- [ ] Métricas null muestran "—"
- [ ] ActivityChart muestra gráfica con 3 tabs (Potencia/FC/Cadencia)
- [ ] Si no hay series temporales, la gráfica muestra estado vacío
- [ ] AIAnalysisCard muestra análisis o placeholder
- [ ] Sidebar marca "Actividades" como activa (`pathname.startsWith('/activities')`)
- [ ] Responsive: metrics grid 3 cols mobile, chart height 160px mobile
- [ ] Dark/light mode funciona correctamente
- [ ] `pnpm build` pasa sin errores
- [ ] `pnpm lint` pasa sin errores
- [ ] `pnpm typecheck` pasa sin errores

### Archivos Afectados

**Crear**:
- `apps/web/src/app/(app)/activities/[id]/page.tsx` — Server Component: queries + validación + render
- `apps/web/src/app/(app)/activities/[id]/activity-detail-content.tsx` — Client Component: composición
- `apps/web/src/app/(app)/activities/[id]/detail-header.tsx` — Presentacional: nombre + badge + fecha

### Notas Técnicas

- `page.tsx` recibe `params: { id: string }` de Next.js dynamic route
- Dos queries Supabase secuenciales: actividad primero (para validar existencia), luego métricas
- La query de actividad incluye `ai_analysis` (JSONB) — validar estructura antes de pasar al componente
- `formatDuration` para la métrica de tiempo — reutilizar del Dashboard o del utility local
- Preparar el array de `MetricItem` en el server (pre-formatear valores)
- `ActivityDetailContent` es Client Component porque contiene `ActivityChart` (Recharts) y `BackButton` (useRouter)
- `DetailHeader` no necesita `'use client'` — presentacional
- Ref: L2 §2 para árbol de componentes, §3 para queries, §8 para riesgos

### Referencia de Diseño

- Spec funcional L1: §4 (jerarquía), §5 (datos), §6 (flujos 1-7)
- Diseño técnico L2: §2 (arquitectura completa), §3 (queries y transformaciones), §5 (estructura de archivos)
- DESIGN-SYSTEM.md: §1.3 (Detalle de Actividad)

---

## Issue 7: Tests de funciones de utilidad y componentes del detalle

**Labels**: `type:test`, `priority:p1`, `phase:2`
**Depende de**: Issue 2, Issue 4, Issue 5
**Estimación**: ~1.5h

### Descripción

Crear tests unitarios para las funciones de utilidad (transformTimeSeries, formatActivityDate, aiAnalysisSchema) y los componentes del detalle (MetricsGrid, AIAnalysisCard).

### Criterios de Aceptación

- [ ] Tests de `transformTimeSeries`: convierte timestamps a minutos correctamente, maneja array vacío
- [ ] Tests de `formatActivityDate`: formatea "2026-02-14" → "14 feb 2026", maneja diferentes meses
- [ ] Tests de `aiAnalysisSchema`: valida estructura correcta, rechaza estructura inválida, acepta null
- [ ] Tests de `MetricsGrid`: renderiza el número correcto de cards, muestra "—" para null
- [ ] Tests de `AIAnalysisCard`: renderiza análisis con tips, renderiza estado vacío cuando null
- [ ] `pnpm test` pasa sin errores

### Archivos Afectados

**Crear**:
- `apps/web/src/lib/activities/transform-time-series.test.ts` — Tests de transformación
- `apps/web/src/lib/activities/format-date.test.ts` — Tests de formateo de fecha
- `apps/web/src/components/metrics-grid.test.tsx` — Tests de MetricsGrid
- `apps/web/src/components/ai-analysis-card.test.tsx` — Tests de AIAnalysisCard

### Notas Técnicas

- Priorizar tests de funciones puras (transformTimeSeries, formatActivityDate) — alta cobertura, bajo coste
- Para tests de componentes: @testing-library/react + vitest
- MetricsGrid test: pasar array de métricas mock, verificar que renderiza el valor y la unidad de cada una
- AIAnalysisCard test: verificar presencia de badge "ANÁLISIS IA", tips, y mensaje de estado vacío
- No testear ActivityChart (Recharts en tests es complejo y de bajo valor)

### Referencia de Diseño

- Diseño técnico L2: §3 (funciones de utilidad)
- CLAUDE.md: "Unitarios para lógica compleja"

---

## Resumen de Dependencias

```
Issue 1: BackButton                                ← base (sin dependencias)
Issue 2: MetricsGrid                               ← base (sin dependencias)
Issue 3: ActivityChart (Recharts)                   ← base (sin dependencias)
Issue 4: AIAnalysisCard                            ← base (sin dependencias)
Issue 5: Funciones de utilidad                     ← base (sin dependencias)
Issue 6: Página Detalle de Actividad               ← depende de 1, 2, 3, 4, 5
Issue 7: Tests                                     ← depende de 2, 4, 5
```

---

## Orden de Implementación Recomendado

### Capa 1 — Componentes y utilidades (paralelizable)
1. **Issue 1**: BackButton
2. **Issue 2**: MetricsGrid
3. **Issue 3**: ActivityChart
4. **Issue 4**: AIAnalysisCard
5. **Issue 5**: Funciones de utilidad

### Capa 2 — Pantalla completa
6. **Issue 6**: Página de Detalle de Actividad

### Capa 3 — Calidad
7. **Issue 7**: Tests unitarios

---

## Prerequisitos externos (de otras specs)

| Prerequisito | Spec origen | ¿Bloqueante? |
|-------------|-------------|-------------|
| Layout `(app)` con Sidebar | L2-screen-01 (Dashboard) | Sí — ruta `(app)/activities/[id]` necesita el layout |
| `recharts` instalado | L2-screen-01 (Dashboard) | Sí — ActivityChart depende de Recharts |
| `ACTIVITY_TYPES` constante | L2-screen-01 (Dashboard) | Sí — badge de tipo en DetailHeader |
| `formatDuration` función | L2-screen-01 (Dashboard) | No — se puede crear versión local |
| Tabla `activities` con datos | Supabase migration 001 | Sí — query por ID |
| Tabla `activity_metrics` | Supabase migration 001 | Sí — series temporales |
| Página Lista de Actividades | L3-screen-03 | No — el detalle puede implementarse antes, pero la navegación "Volver" apunta a `/activities` |
