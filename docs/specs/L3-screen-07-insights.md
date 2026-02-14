# L3 — Plan de Issues: Insights / Comparar Periodos

> **Input**: `docs/specs/L2-screen-07-insights.md`
> **Fase**: Fase 2
> **Fecha**: 2026-02-14

---

## Issue 1: Crear schemas Zod para Insights en packages/shared

**Labels**: `type:feature`, `priority:p1`, `phase:2`
**Depende de**: —
**Estimación**: ~0.5h

### Descripción

Crear los schemas Zod y tipos TypeScript compartidos para la pantalla de Insights: `PeriodRange`, `ComparisonMetric`, `RadarDimension`, `InsightsAnalysis`.

### Criterios de Aceptación

- [ ] Schema `periodRangeSchema` con start, end, label
- [ ] Schema `comparisonMetricSchema` con metric, valueA, valueB, unit, color, inverse
- [ ] Schema `radarDimensionSchema` con metric, A, B
- [ ] Schema `insightsAnalysisSchema` con summary, alert (opcional), recommendation
- [ ] Tipos exportados: `PeriodRange`, `ComparisonMetric`, `RadarDimension`, `InsightsAnalysis`
- [ ] `index.ts` actualizado re-exportando todo
- [ ] `pnpm build` pasa sin errores
- [ ] `pnpm typecheck` pasa sin errores

### Archivos Afectados

**Crear**:
- `packages/shared/src/schemas/insights.ts` — Schemas Zod

**Modificar**:
- `packages/shared/src/index.ts` — Re-exportar schemas

### Notas Técnicas

- `inverse` en `comparisonMetricSchema` es opcional (default false)
- `alert` en `insightsAnalysisSchema` es opcional (no siempre hay alerta)
- Ref: L2 §3 para los schemas completos

### Referencia de Diseño

- Diseño técnico L2: §3 (Schemas Zod nuevos)

---

## Issue 2: Crear funciones de cálculo para Insights

**Labels**: `type:feature`, `priority:p1`, `phase:2`
**Depende de**: Issue 1
**Estimación**: ~2h

### Descripción

Implementar las funciones puras de cálculo para Insights: métricas por periodo, métricas de comparación, dimensiones del radar, generación de análisis con heurísticas, y cálculo de periodos por defecto.

### Criterios de Aceptación

- [ ] `calculatePeriodMetrics()` calcula distancia, tiempo, potencia, FC, TSS, sesiones
- [ ] `calculatePeriodMetrics()` maneja arrays vacíos y valores null correctamente
- [ ] `buildComparisonMetrics()` genera las 6 métricas de comparación con los colores correctos
- [ ] `calculateRadarDimensions()` genera 5 dimensiones normalizadas 0-100
- [ ] `generateSimpleAnalysis()` genera análisis con heurísticas (summary, alert, recommendation)
- [ ] `generateSimpleAnalysis()` retorna null si no hay datos
- [ ] `getDefaultPeriods()` calcula semana anterior y semana actual correctamente
- [ ] Tests unitarios para cada función
- [ ] `pnpm test` pasa sin errores
- [ ] `pnpm typecheck` pasa sin errores

### Archivos Afectados

**Crear**:
- `apps/web/src/lib/insights/calculations.ts` — Funciones de cálculo de métricas y radar
- `apps/web/src/lib/insights/periods.ts` — Cálculo de periodos por defecto
- `apps/web/src/lib/insights/calculations.test.ts` — Tests unitarios

### Notas Técnicas

- `calculatePeriodMetrics` filtra nulls antes de promediar potencia y FC
- `calculateRadarDimensions` usa heurísticas simplificadas (ref: ADR-028). Valores siempre en rango [0, 100]
- `generateSimpleAnalysis` cubre: potencia sube/baja, TSS alto, recomendación de sesiones
- La lógica `inverse` para FC (bajar es positivo) se resuelve en `ComparisonMetricCard`, no en las funciones de cálculo
- Ref: L2 §3 para las firmas y lógica completa

### Referencia de Diseño

- Diseño técnico L2: §3 (Funciones de cálculo)
- Spec funcional L1: §3.3 (lógica del delta), §5 (Datos Necesarios)

---

## Issue 3: Crear componente ComparisonMetricCard

**Labels**: `type:feature`, `priority:p1`, `phase:2`
**Depende de**: —
**Estimación**: ~1h

### Descripción

Crear el componente reutilizable `ComparisonMetricCard` que muestra la comparación de una métrica entre dos periodos: valor A → valor B + delta porcentual con color semántico.

### Criterios de Aceptación

- [ ] Muestra label de la métrica
- [ ] Muestra valor A (azul) → valor B (grande, blanco) + unidad
- [ ] Calcula y muestra delta % con color: verde si es positivo (o negativo con inverse), rojo si es negativo
- [ ] Badge delta con fondo sutil (verde/rojo al 10%)
- [ ] Prop `inverse` invierte la lógica del color (bajar = verde)
- [ ] Funciona en dark/light mode
- [ ] Grid responsivo: 3 cols desktop, 2 cols mobile (se gestiona en el padre)
- [ ] `pnpm build` pasa sin errores
- [ ] `pnpm typecheck` pasa sin errores

### Archivos Afectados

**Crear**:
- `apps/web/src/components/comparison-metric-card.tsx` — Componente ComparisonMetricCard

### Notas Técnicas

- Delta: `((valueB - valueA) / valueA * 100).toFixed(1)`. Si valueA es 0, delta = "—"
- Formato: `+13.3%` (con signo +) o `-1.4%`
- Valor A en `text-blue-500`, valor B en `text-slate-900 dark:text-slate-100` grande (text-lg md:text-[22px])
- Ref: L1 §3.3 para layout exacto, L1 §9 para transformaciones Tailwind

### Referencia de Diseño

- Spec funcional L1: §3.3 (ComparisonMetricCard)
- Diseño técnico L2: §2.2 (ComparisonMetricCard), ADR-029

---

## Issue 4: Crear componente PerformanceRadarChart

**Labels**: `type:feature`, `priority:p1`, `phase:2`
**Depende de**: —
**Estimación**: ~1h

### Descripción

Crear el componente `PerformanceRadarChart` usando Recharts (RadarChart) con 2 series superpuestas (Periodo A en azul, Periodo B en naranja) y leyenda personalizada.

### Criterios de Aceptación

- [ ] RadarChart con 5 dimensiones (Volumen, Intensidad, Consistencia, Recuperación, Progresión)
- [ ] 2 series: Anterior (azul `#3b82f6`) y Actual (naranja `#f97316`)
- [ ] Fill opacity 12% para cada serie
- [ ] PolarGrid con stroke sutil
- [ ] PolarAngleAxis con labels en color `t2`
- [ ] Leyenda HTML debajo del chart (no leyenda nativa de Recharts)
- [ ] ResponsiveContainer: 260px desktop, 220px mobile
- [ ] Card wrapper con fondo y borde del design system
- [ ] Funciona en dark/light mode
- [ ] `pnpm build` pasa sin errores
- [ ] `pnpm typecheck` pasa sin errores

### Archivos Afectados

**Crear**:
- `apps/web/src/components/charts/performance-radar-chart.tsx` — RadarChart con Recharts

### Notas Técnicas

- Requiere `recharts` instalado (prerequisito del Dashboard)
- `'use client'` obligatorio (Recharts necesita DOM)
- Leyenda: 2 items centrados, cuadrado 8x8px con borderRadius 2px + texto
- La leyenda NO usa el componente `<Legend>` de Recharts (más control visual)
- Ref: L1 §3.4 para configuración de Recharts, L1 §9 para transformaciones

### Referencia de Diseño

- Spec funcional L1: §3.4 (PerformanceRadarChart)
- DESIGN-SYSTEM.md: §2.7 (Gráficas Recharts)

---

## Issue 5: Crear componente AIInsightsCard

**Labels**: `type:feature`, `priority:p1`, `phase:2`
**Depende de**: —
**Estimación**: ~0.5h

### Descripción

Crear el componente `AIInsightsCard` que muestra el análisis comparativo de la IA. Variante del patrón visual de tarjeta IA (badge + gradient + texto con highlights).

### Criterios de Aceptación

- [ ] Badge "ANÁLISIS IA" con icono Zap + gradient naranja
- [ ] Fondo `aiBg` (gradient naranja sutil) + borde `aiB`
- [ ] 2-3 párrafos de análisis con highlights en color (t1, naranja, amarillo, azul)
- [ ] Estado vacío cuando `analysis` es null: mensaje placeholder
- [ ] Funciona en dark/light mode
- [ ] `pnpm build` pasa sin errores
- [ ] `pnpm typecheck` pasa sin errores

### Archivos Afectados

**Crear**:
- `apps/web/src/components/ai-insights-card.tsx` — Tarjeta de análisis IA

### Notas Técnicas

- Patrón visual compartido con AICoachCard (Dashboard) y AIAnalysisCard (Detalle). Componente separado por ahora (ref: ADR-019 del Detalle)
- CSS vars: `--ai-bg`, `--ai-border` (definidas en globals.css)
- Texto con `<strong>` para highlights, coloreados con clases Tailwind
- Ref: L1 §3.5 para tokens y estructura

### Referencia de Diseño

- Spec funcional L1: §3.5 (AIInsightsCard)
- DESIGN-SYSTEM.md: §2.5 (Tarjeta Entrenador IA)

---

## Issue 6: Implementar pantalla de Insights completa

**Labels**: `type:feature`, `priority:p1`, `phase:2`
**Depende de**: Issue 1, Issue 2, Issue 3, Issue 4, Issue 5
**Estimación**: ~2.5h

### Descripción

Implementar la pantalla completa de Insights: Server Component page con queries de actividades de 2 periodos, cálculos de métricas, radar y análisis, Client Component wrapper, y composición de todos los componentes.

### Criterios de Aceptación

- [ ] `page.tsx` verifica auth, calcula periodos por defecto, obtiene actividades de ambos periodos
- [ ] Si no hay datos suficientes, muestra estado vacío con mensaje motivacional
- [ ] PeriodSelectors muestra las 2 semanas (no interactivos en MVP)
- [ ] 6 ComparisonMetricCards en grid 3 cols desktop / 2 cols mobile
- [ ] FC media usa lógica inverse (bajar = verde)
- [ ] PerformanceRadarChart muestra 5 dimensiones con 2 series
- [ ] AIInsightsCard muestra análisis generado por heurísticas
- [ ] Header con título "Comparar periodos" + subtítulo
- [ ] Dark/light mode funciona
- [ ] `pnpm build` pasa sin errores
- [ ] `pnpm lint` pasa sin errores
- [ ] `pnpm typecheck` pasa sin errores

### Archivos Afectados

**Crear**:
- `apps/web/src/app/(app)/insights/page.tsx` — Server Component
- `apps/web/src/app/(app)/insights/insights-content.tsx` — Client Component wrapper

### Notas Técnicas

- Periodos por defecto: semana pasada (Periodo A) vs semana actual (Periodo B)
- El Server Component hace 2 queries a Supabase (actividades de cada periodo)
- Los cálculos (métricas, radar, análisis) se ejecutan server-side
- Si solo un periodo tiene datos, mostrar parcialmente (valor "—" en el otro)
- El radar no se renderiza si `hasEnoughData === false`
- Ref: L1 §6 para flujos de interacción, L2 §2 para arquitectura

### Referencia de Diseño

- Spec funcional L1: completo
- Diseño técnico L2: §2 (Arquitectura), §3 (Modelo de Datos), §5 (Estructura de Archivos)
- DESIGN-SYSTEM.md: §1 Screen-07

---

## Resumen de Dependencias

```
Issue 1: Schemas Zod                           ← base (sin dependencias)
Issue 3: ComparisonMetricCard                  ← base (sin dependencias)
Issue 4: PerformanceRadarChart                 ← base (sin dependencias)
Issue 5: AIInsightsCard                        ← base (sin dependencias)
Issue 2: Funciones de cálculo                  ← depende de 1
Issue 6: Pantalla completa                     ← depende de 1, 2, 3, 4, 5
```

---

## Orden de Implementación Recomendado

### Capa 1 — Infraestructura y componentes (paralelizable)
1. **Issue 1**: Schemas Zod en shared
2. **Issue 3**: Componente ComparisonMetricCard
3. **Issue 4**: Componente PerformanceRadarChart
4. **Issue 5**: Componente AIInsightsCard

### Capa 2 — Lógica
5. **Issue 2**: Funciones de cálculo

### Capa 3 — Pantalla
6. **Issue 6**: Pantalla completa de Insights
