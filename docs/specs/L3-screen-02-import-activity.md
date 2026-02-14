# L3 — Plan de Issues: Importar Actividad

> **Input**: `docs/specs/L2-screen-02-import-activity.md`
> **Fase**: Fase 2
> **Fecha**: 2026-02-14

---

## Issue 1: Crear componentes SelectField y DurationInput

**Labels**: `type:feature`, `priority:p0`, `phase:2`
**Depende de**: —
**Estimación**: ~1.5h

### Descripción

Crear dos componentes de formulario reutilizables: `SelectField` (select nativo con label y estilo consistente) y `DurationInput` (3 inputs para horas/minutos/segundos). Ambos siguen el patrón visual de OnboardingField del design system.

### Criterios de Aceptación

- [ ] `SelectField` creado con props: label, value, onChange, options, required
- [ ] SelectField renderiza select nativo con `appearance: none` e icono ChevronDown
- [ ] SelectField muestra asterisco rojo si `required=true`
- [ ] `DurationInput` creado con props: hours, minutes, seconds, onChange handlers, required
- [ ] DurationInput renderiza 3 inputs numéricos con labels "h", "min", "seg"
- [ ] DurationInput: inputs con `textAlign: center` y placeholder descriptivo
- [ ] Ambos componentes funcionan en dark/light mode
- [ ] `pnpm build` pasa sin errores
- [ ] `pnpm lint` pasa sin errores

### Archivos Afectados

**Crear**:
- `apps/web/src/components/select-field.tsx` — Select nativo con label
- `apps/web/src/components/duration-input.tsx` — Input de duración h/m/s

### Notas Técnicas

- SelectField usa un `<div style={{ position: 'relative' }}>` para posicionar el ChevronDown absoluto
- DurationInput: 3 inputs en flex row con gap 8, cada uno flex 1
- No necesitan `'use client'` propio si se usan dentro de Client Components, pero DurationInput puede necesitarlo si gestiona estado interno
- Estilos: padding `10px 14px`, radius 9, fondo `var(--input-bg)`, borde `var(--input-border)`
- Ref: L2 §2.2 para interfaces exactas

### Referencia de Diseño

- Spec funcional L1: §3.5 (SelectField), §3.6 (DurationInput)
- Diseño técnico L2: §2.2 (interfaces)
- DESIGN-SYSTEM.md: §2.5 (Onboarding Field — patrón visual), §2.5 (SelectField, nuevo)

---

## Issue 2: Crear componente RPEInput interactivo

**Labels**: `type:feature`, `priority:p0`, `phase:2`
**Depende de**: —
**Estimación**: ~2h

### Descripción

Crear el componente `RPEInput`: selector interactivo de esfuerzo percibido (RPE) con 10 barras clicables. Cada barra tiene un color individual, las activas son más altas (36px vs 28px), y se muestra un label semántico debajo (ej: "7/10 — Muy duro"). Es diferente de `RPEIndicator` (que es solo visual).

### Criterios de Aceptación

- [ ] Componente `RPEInput` creado con props: value (number), onChange (callback)
- [ ] Renderiza 10 barras clicables (buttons) con números 1-10
- [ ] Barras activas (n ≤ value): altura 36px, color por barra individual, número blanco
- [ ] Barras inactivas: altura 28px, fondo `t4` al 15%, número en `t4`
- [ ] Colores por barra: 1-3 verde `#22c55e`, 4 lima `#84cc16`, 5-6 amarillo `#eab308`, 7-8 naranja `#f97316`, 9-10 rojo `#ef4444`
- [ ] Al hacer clic en una barra, llama `onChange(n)` con el número de la barra
- [ ] Si value > 0, muestra label semántico: "{value}/10 — {nombre}" con color del valor
- [ ] Labels: Muy fácil, Fácil, Ligero, Moderado, Algo duro, Duro, Muy duro, Intenso, Máximo, Límite absoluto
- [ ] Label superior: "Esfuerzo percibido (RPE)" en 12px weight 500
- [ ] Transición suave en height (transition 0.15s)
- [ ] Accesibilidad: `role="slider"`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`
- [ ] Dark/light mode funciona correctamente
- [ ] `pnpm build` pasa sin errores
- [ ] `pnpm lint` pasa sin errores

### Archivos Afectados

**Crear**:
- `apps/web/src/components/rpe-input.tsx` — RPE interactivo con 10 barras

### Notas Técnicas

- NO reutilizar ni extender RPEIndicator — son componentes con responsabilidades diferentes (ADR-025)
- Los colores son por barra individual (no por rango como RPEIndicator que usa `getRPEColor`)
- Las barras usan `flex-1` para ocupar todo el ancho disponible
- Style dinámico para `backgroundColor` y `height` (no se puede hacer con clases estáticas de Tailwind)
- Cada barra es un `<button>` para accesibilidad (focusable, clickable)
- Ref: L2 §2.2 para constantes RPE_LABELS y RPE_BAR_COLORS

### Referencia de Diseño

- Spec funcional L1: §3.7 (RPEInput detallado)
- Diseño técnico L2: §2.2 (RPEInput interface y constantes)
- DESIGN-SYSTEM.md: §2.5 (RPEInput, nuevo)

---

## Issue 3: Crear componente FileDropZone + CSS variables

**Labels**: `type:feature`, `priority:p0`, `phase:2`
**Depende de**: —
**Estimación**: ~2h

### Descripción

Crear el componente `FileDropZone` con 3 estados visuales (vacío, dragging, con archivo) y soporte para drag & drop + clic para seleccionar archivo. También añadir las CSS variables nuevas para los tokens `success*` y `drop*` en `globals.css`.

### Criterios de Aceptación

- [ ] Componente `FileDropZone` creado con props: file, onFile, onClear
- [ ] Estado vacío: borde 2px dashed, icono Upload (26px), texto "Arrastra tu archivo aquí", "o haz clic para seleccionar", badges [.FIT] [.GPX]
- [ ] Estado dragging: borde accent dashed, fondo `dropBg`, icono Upload en color accent
- [ ] Estado con archivo: fondo `successBg`, borde `successB`, icono Check verde, nombre archivo, tamaño/extensión, botón "Quitar"
- [ ] Drag & drop funciona: `onDragOver`, `onDragLeave`, `onDrop`
- [ ] Clic abre selector de archivos con `accept=".fit,.gpx"`
- [ ] Solo acepta extensiones .fit y .gpx (ignora otros archivos silenciosamente)
- [ ] Botón "Quitar" llama `onClear()` y vuelve a estado vacío
- [ ] CSS variables añadidas en `globals.css`: `--success-bg`, `--success-border`, `--drop-bg`, `--drop-border`
- [ ] Dark/light mode funciona correctamente
- [ ] `pnpm build` pasa sin errores
- [ ] `pnpm lint` pasa sin errores

### Archivos Afectados

**Crear**:
- `apps/web/src/components/file-drop-zone.tsx` — Zona de carga drag & drop

**Modificar**:
- `apps/web/src/app/globals.css` — Añadir CSS variables para tokens success y drop

### Notas Técnicas

- Usa `useCallback` para handlers de drag/drop (performance)
- Input `type="file"` oculto (`display: none`), activado por clic en la zona
- Transición suave: `transition: all 0.2s`
- `onDragOver`: `e.preventDefault()` + `setDragging(true)` (necesario para permitir drop)
- `onDrop`: `e.preventDefault()` + extraer archivo + validar extensión
- Contenedor 56×56 radius 16 para el icono (estado vacío)
- Botón "Quitar": fondo `rgba(239,68,68,0.08)`, borde `rgba(239,68,68,0.2)`, icono Trash2 13px
- CSS variables en `:root` y `.dark` (mismo patrón que `--ai-bg` existente)
- Ref: L2 §2.2 para interface, L1 §3.2 para diseño visual

### Referencia de Diseño

- Spec funcional L1: §3.2 (FileDropZone 3 estados)
- Diseño técnico L2: §2.2 (FileDropZone interface)
- DESIGN-SYSTEM.md: §2.5 (FileDropZone, nuevo), §2.1 (tokens success/drop)

---

## Issue 4: Crear schema activityCreateSchema + utilidades de duración y mock

**Labels**: `type:feature`, `priority:p0`, `phase:2`
**Depende de**: —
**Estimación**: ~1h

### Descripción

Crear el schema Zod `activityCreateSchema` para validación del payload de creación de actividades, y las funciones de utilidad `durationToSeconds()`, `secondsToDuration()` y `generateMockActivity()`.

### Criterios de Aceptación

- [ ] `activityCreateSchema` añadido a `packages/shared/src/schemas/activity.ts`
- [ ] Schema valida: name (string min 1), date (regex YYYY-MM-DD), type (enum outdoor/indoor/recovery), duration_seconds (int positive), campos opcionales nullable
- [ ] Tipo `ActivityCreate` exportado (`z.infer<typeof activityCreateSchema>`)
- [ ] `packages/shared/src/index.ts` actualizado con re-exports
- [ ] `durationToSeconds(h, m, s)` convierte strings a número de segundos
- [ ] `secondsToDuration(seconds)` convierte a `{ h, m, s }` como strings
- [ ] `generateMockActivity()` genera datos realistas: nombre aleatorio, fecha hoy, tipo aleatorio, duración 1-3h, métricas en rangos ciclistas
- [ ] `pnpm build` pasa sin errores
- [ ] `pnpm typecheck` pasa sin errores

### Archivos Afectados

**Crear**:
- `apps/web/src/lib/activities/duration-utils.ts` — Funciones durationToSeconds y secondsToDuration
- `apps/web/src/lib/activities/generate-mock-activity.ts` — Generador de datos mock

**Modificar**:
- `packages/shared/src/schemas/activity.ts` — Añadir activityCreateSchema
- `packages/shared/src/index.ts` — Re-exportar activityCreateSchema y ActivityCreate

### Notas Técnicas

- `activityCreateSchema` NO incluye `id`, `user_id`, `created_at`, `updated_at`, `ai_analysis`, `tss` — estos se generan automáticamente
- `durationToSeconds('', '', '')` devuelve 0 — la validación Zod (`positive()`) lo rechazará
- `generateMockActivity` devuelve un `ImportFormData` (tipo definido en el componente principal)
- Mock genera: distancia 30-100km, potencia 150-220W, FC 135-165bpm, cadencia 80-95rpm, RPE 5-8
- Ref: L2 §3 para schemas y funciones exactas

### Referencia de Diseño

- Diseño técnico L2: §3 (Modelo de Datos)
- Spec funcional L1: Apéndice (Datos Mock)

---

## Issue 5: Crear componente ImportModeToggle

**Labels**: `type:feature`, `priority:p1`, `phase:2`
**Depende de**: —
**Estimación**: ~0.5h

### Descripción

Crear el componente `ImportModeToggle`: toggle inline con dos opciones (Archivo .fit/.gpx y Manual) con iconos. La opción activa tiene fondo `actBg`, borde accent y texto accent.

### Criterios de Aceptación

- [ ] Componente `ImportModeToggle` creado con props: mode, onModeChange
- [ ] Renderiza 2 botones: "Archivo .fit/.gpx" (Upload icon) y "Manual" (Edit3 icon)
- [ ] Opción activa: fondo `actBg`, borde accent al 30%, texto accent, weight 600
- [ ] Opción inactiva: transparente, borde transparente, texto `t2`, weight 400
- [ ] Container: inline-flex, gap 4px, padding 4px, radius 12, fondo `inBg`, borde `inB`
- [ ] Iconos: 15px, junto al texto con gap 7px
- [ ] Transición suave (0.15s)
- [ ] Responsive: padding `9px 18px` desktop, `8px 14px` mobile
- [ ] Dark/light mode funciona correctamente
- [ ] `pnpm build` pasa sin errores

### Archivos Afectados

**Crear**:
- `apps/web/src/app/(app)/activities/import/import-mode-toggle.tsx` — Toggle archivo/manual

### Notas Técnicas

- Componente local al directorio de la página (no reutilizable)
- Cada opción es un `<button>` con `type="button"`
- Usar `cn()` (clsx/tailwind-merge) para clases condicionales
- Ref: L2 §2.2 para interface

### Referencia de Diseño

- Spec funcional L1: §3.1 (ImportModeToggle)
- Diseño técnico L2: §2.2 (interface)
- DESIGN-SYSTEM.md: §2.5 (ImportModeToggle, nuevo)

---

## Issue 6: Implementar página ImportActivity completa

**Labels**: `type:feature`, `priority:p0`, `phase:2`
**Depende de**: Issue 1, Issue 2, Issue 3, Issue 4, Issue 5
**Estimación**: ~4h

### Descripción

Implementar la pantalla completa de Importar Actividad: Server Component minimal (`page.tsx`), Client Component principal (`ImportActivityContent`) que integra todos los componentes creados en Issues 1-5, gestiona el estado completo del formulario (modo, archivo, campos, validación), y persiste la actividad en Supabase.

### Criterios de Aceptación

- [ ] `page.tsx` (Server Component) renderiza ImportActivityContent
- [ ] `ImportActivityContent` (Client Component) gestiona todo el estado
- [ ] Header: título "Importar actividad" (26px desktop / 22px mobile) + subtítulo
- [ ] ImportModeToggle funciona para cambiar entre archivo y manual
- [ ] **Modo Archivo**:
  - [ ] FileDropZone renderizada correctamente
  - [ ] Al cargar archivo: muestra preview grid con 6 items de datos
  - [ ] Muestra campos adicionales opcionales (nombre, tipo, RPE, notas)
  - [ ] Botón guardar habilitado cuando hay archivo
- [ ] **Modo Manual**:
  - [ ] Info banner azul con AlertCircle + texto descriptivo
  - [ ] Sección "Datos obligatorios" con título en accent
  - [ ] Campos obligatorios: nombre, fecha (date input), tipo (SelectField), duración (DurationInput)
  - [ ] Sección "Métricas (opcionales)" con título en t2
  - [ ] Campos opcionales: distancia, potencia, FC media, FC máxima, cadencia (en rows de 2)
  - [ ] RPEInput funcional
  - [ ] Textarea para notas
- [ ] **ActionBar**:
  - [ ] Botón "Cancelar" → navega a `/activities`
  - [ ] Botón "Generar datos mock" (solo modo manual) → rellena todos los campos
  - [ ] Botón "Guardar actividad" → habilitado/deshabilitado según validación
  - [ ] Guardar: valida con Zod, insert en Supabase, toast éxito, redirect a `/activities`
- [ ] Validación canSave: archivo mode → file !== null; manual → name + date + (h||m)
- [ ] Toast de éxito: fixed bottom-right, fondo verde, "Actividad guardada correctamente"
- [ ] Error al guardar: muestra mensaje genérico, no resetea formulario
- [ ] `generateMockActivity()` produce datos realistas
- [ ] `durationToSeconds()` calcula correctamente
- [ ] MaxWidth 640px para el contenido del formulario
- [ ] Responsive: grid preview 3→2 cols, campos apilados, botones wrap
- [ ] Dark/light mode funciona correctamente
- [ ] `pnpm build` pasa sin errores
- [ ] `pnpm lint` pasa sin errores
- [ ] `pnpm typecheck` pasa sin errores

### Archivos Afectados

**Crear**:
- `apps/web/src/app/(app)/activities/import/page.tsx` — Server Component
- `apps/web/src/app/(app)/activities/import/import-activity-content.tsx` — Client Component principal

### Notas Técnicas

- El Client Component usa `createBrowserClient` de `@supabase/ssr` para INSERT directo (ADR-023)
- Supabase RLS asigna `user_id` automáticamente del auth token
- Toast: usar estado local `isSaved` con timeout de 3s, o integrar `sonner` si ya está instalado
- `useRouter().push('/activities')` para navegación post-guardado (con pequeño delay para toast)
- FilePreviewGrid es inline (no un componente separado) — es contenido estático para el MVP
- Info banner azul: `rgba(59,130,246,0.06)` fondo, `rgba(59,130,246,0.15)` borde
- Sección obligatorios: título en `acc`, uppercase, letterSpacing 0.04em
- Sección opcionales: título en `t2`, uppercase, letterSpacing 0.04em
- Field para notas usa `<textarea>` directamente (no el componente Field)
- Ref: L2 §2-3 para arquitectura completa, L1 §4-6 para jerarquía y flujos

### Referencia de Diseño

- Spec funcional L1: §4 (jerarquía), §5 (datos), §6 (flujos 1-10)
- Diseño técnico L2: §2 (arquitectura), §3 (modelo datos), §5 (archivos)
- DESIGN-SYSTEM.md: Screen-04b (Importar Actividad)

---

## Issue 7: Tests de componentes y utilidades de importación

**Labels**: `type:test`, `priority:p1`, `phase:2`
**Depende de**: Issue 1, Issue 2, Issue 4
**Estimación**: ~1.5h

### Descripción

Crear tests unitarios para los componentes reutilizables y utilidades creadas para la pantalla de importación: SelectField, DurationInput, RPEInput, durationToSeconds, secondsToDuration, generateMockActivity, y activityCreateSchema.

### Criterios de Aceptación

- [ ] Tests de `durationToSeconds`: convierte correctamente "1"/"30"/"0" → 5400, ""/""/""→ 0, "0"/"0"/"30" → 30
- [ ] Tests de `secondsToDuration`: convierte correctamente 5400 → {h:"1", m:"30", s:"00"}, 0 → {h:"0", m:"00", s:"00"}
- [ ] Tests de `generateMockActivity`: retorna objeto con todos los campos, valores en rangos esperados
- [ ] Tests de `activityCreateSchema`: valida payload correcto, rechaza name vacío, rechaza date inválida, rechaza duration_seconds ≤ 0, acepta campos opcionales null
- [ ] Tests de `SelectField`: renderiza label, opciones, icono ChevronDown, asterisco si required
- [ ] Tests de `DurationInput`: renderiza 3 inputs con labels h/min/seg
- [ ] Tests de `RPEInput`: renderiza 10 barras, llama onChange al hacer clic, muestra label semántico
- [ ] `pnpm test` pasa sin errores

### Archivos Afectados

**Crear**:
- `apps/web/src/lib/activities/duration-utils.test.ts` — Tests de durationToSeconds y secondsToDuration
- `apps/web/src/lib/activities/generate-mock-activity.test.ts` — Tests de generateMockActivity
- `apps/web/src/components/select-field.test.tsx` — Tests de SelectField
- `apps/web/src/components/duration-input.test.tsx` — Tests de DurationInput
- `apps/web/src/components/rpe-input.test.tsx` — Tests de RPEInput

### Notas Técnicas

- Para tests en `packages/shared`: vitest
- Para tests en `apps/web`: vitest + @testing-library/react
- RPEInput: simular click en barra n, verificar que `onChange` se llama con n
- SelectField: verificar que las options se renderizan como `<option>` elements
- DurationInput: verificar que onChange handlers se llaman al escribir
- generateMockActivity: verificar que los valores están dentro de los rangos definidos (no es determinista — verificar rangos)
- activityCreateSchema: testear con `safeParse` los casos válidos e inválidos

### Referencia de Diseño

- Diseño técnico L2: §3 (schemas y funciones)
- CLAUDE.md: "Unitarios para lógica compleja (utils, hooks, reglas de entrenamiento)"

---

## Resumen de Dependencias

```
Issue 1: SelectField + DurationInput                ← sin dependencias (paralelizable)
Issue 2: RPEInput interactivo                        ← sin dependencias (paralelizable)
Issue 3: FileDropZone + CSS variables                ← sin dependencias (paralelizable)
Issue 4: activityCreateSchema + utilidades            ← sin dependencias (paralelizable)
Issue 5: ImportModeToggle                            ← sin dependencias (paralelizable)
Issue 6: Página ImportActivity completa              ← depende de 1, 2, 3, 4, 5
Issue 7: Tests de componentes y utilidades           ← depende de 1, 2, 4
```

---

## Orden de Implementación Recomendado

### Capa 1 — Componentes y utilidades (paralelizable)
1. **Issue 1**: SelectField + DurationInput
2. **Issue 2**: RPEInput interactivo
3. **Issue 3**: FileDropZone + CSS variables
4. **Issue 4**: activityCreateSchema + utilidades
5. **Issue 5**: ImportModeToggle

### Capa 2 — Pantalla completa
6. **Issue 6**: Página ImportActivity completa

### Capa 3 — Calidad
7. **Issue 7**: Tests de componentes y utilidades

---

## Prerequisitos externos (de otras specs)

| Prerequisito | Spec origen | ¿Bloqueante? |
|-------------|-------------|-------------|
| Layout `(app)` con Sidebar | L2-screen-01 (Dashboard) | Sí — necesario para que exista la ruta `(app)/activities/import` |
| Tabla `activities` | Supabase migration 001 | Sí — necesario para INSERT |
| `activitySchema` en shared | L2-screen-01 (Dashboard) | No — se modifica para añadir `activityCreateSchema` |
| Botón "Importar" en Lista de Actividades | L3-screen-03 Issue 4 | No — se puede navegar directamente a `/activities/import` |
