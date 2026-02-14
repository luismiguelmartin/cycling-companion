# L1 — Spec Funcional: Importar Actividad

> **Fuente**: `docs/design/screen-import-activity.jsx`
> **Requisito PRD**: F04 — Importación de actividades (P0)
> **Fecha**: 2026-02-14

---

## 1. Resumen de la Pantalla

La pantalla de Importar Actividad permite al usuario registrar una nueva sesión de ciclismo de dos formas: cargando un archivo `.fit` o `.gpx` de su dispositivo, o introduciendo los datos manualmente. Incluye validación de campos obligatorios, selector de RPE interactivo, y opción de generar datos mock para desarrollo.

| Pantalla | Componente JSX | Propósito |
|----------|---------------|-----------|
| **Importar Actividad** | `ImportActivityScreen` | Registrar una nueva actividad por archivo o entrada manual, con validación, RPE interactivo y persistencia en Supabase. |

**Requisito PRD asociado**: F04 — Importar actividades desde archivo (.fit/.gpx) o entrada manual. El usuario debe poder registrar nombre, fecha, tipo, duración, métricas opcionales (distancia, potencia, FC, cadencia), RPE y notas.

---

## 2. Ruta y Navegación

### Rutas propuestas

| Pantalla | Ruta | Route Group |
|----------|------|-------------|
| Importar Actividad | `/activities/import` | `(app)` |

### Flujo de navegación

```
Activities → Botón "Importar" → /activities/import
                                      │
                              ┌───────┴────────┐
                              │                │
                        Modo Archivo      Modo Manual
                              │                │
                       FileDropZone      Formulario completo
                              │                │
                       Datos opcionales  Campos obligatorios
                              │          + opcionales
                              └───────┬────────┘
                                      │
                               Guardar actividad
                                      │
                              redirect → /activities
```

### Condiciones de acceso

| Ruta | Auth requerida | Condición adicional |
|------|---------------|---------------------|
| `/activities/import` | Sí | Si no completó onboarding → redirect a `/onboarding` |

---

## 3. Componentes Identificados

### 3.1 ImportModeToggle

| Campo | Valor |
|-------|-------|
| **Nombre** | `ImportModeToggle` |
| **Tipo** | Client Component — gestiona el modo activo |
| **Props** | `mode: 'file' \| 'manual'` (obligatoria), `onModeChange: (mode: 'file' \| 'manual') => void` (obligatoria) |
| **Estados** | Archivo activo (fondo `actBg`, borde accent, texto accent). Manual activo (ídem). |
| **Tokens** | Container: fondo `inBg`, borde `inB`, radius 12, padding 4. Opción activa: fondo `actBg`, borde `acc` al 30%, texto `acc`, weight 600. Opción inactiva: transparente, texto `t2`, weight 400. Font 13px. |
| **Responsive** | Desktop: padding `9px 18px`. Mobile: padding `8px 14px`. |
| **Contenido** | Dos botones: Upload icon + "Archivo .fit/.gpx", Edit3 icon + "Manual" |
| **Reutilizable** | No — específico de esta pantalla |

### 3.2 FileDropZone

| Campo | Valor |
|-------|-------|
| **Nombre** | `FileDropZone` |
| **Tipo** | Client Component — gestiona drag & drop y selección de archivo |
| **Props** | `file: FileInfo \| null` (obligatoria), `onFile: (file: FileInfo) => void` (obligatoria), `onClear: () => void` (obligatoria) |
| **Estados** | 3 estados: Vacío (borde dashed `inB`), Dragging (borde dashed `acc`, fondo `dropBg`), Con archivo (fondo `successBg`, borde `successB`). |
| **Tokens** | Vacío: borde `2px dashed inB`, padding 40px desktop / 28px mobile. Icono Upload 26px en contenedor 56×56 radius 16, fondo `t4` al 15%. Título 15px weight 600 `t1`. Subtítulo 13px `t3`. Badges extensión: 11px weight 600, fondo `t4` al 12%, radius 6. Dragging: borde `acc`, fondo `dropBg`, icono fondo `acc` al 20%. Con archivo: fondo `successBg`, borde `successB`, icono Check 22px `#22c55e` en contenedor 44×44 radius 12, nombre 14px weight 600, info 12px `#22c55e`, botón "Quitar" fondo `rgba(239,68,68,0.08)` borde `rgba(239,68,68,0.2)` texto `#ef4444`. |
| **Responsive** | Padding 40px desktop, 28px mobile. Ancho máximo 640px heredado del contenedor. |
| **Contenido** | Estado vacío: icono + "Arrastra tu archivo aquí" + "o haz clic para seleccionar" + badges [.FIT] [.GPX]. Con archivo: Check + nombre + tamaño/extensión + botón "Quitar". |
| **Reutilizable** | Sí — podría usarse en otras pantallas de importación |

**Tipo FileInfo**:
```typescript
interface FileInfo {
  name: string;
  size: number;
  ext: string;
}
```

### 3.3 FilePreviewGrid

| Campo | Valor |
|-------|-------|
| **Nombre** | `FilePreviewGrid` |
| **Tipo** | Presentacional — solo renderiza datos estáticos |
| **Props** | Ninguna — contenido estático para MVP |
| **Estados** | Default único — muestra 6 items con "Automático" o "Si disponible" |
| **Tokens** | Card: fondo `card`, borde `cardB`, radius 14, padding 20. Título: 14px weight 600 `t1`. Items: padding `10px 12px`, radius 8, fondo `t4` al 8%. Item label: 11px `t3` con icono 12px. Item valor: 13px weight 500 `t2`. Separador: `1px solid sep`. |
| **Responsive** | Grid 3 cols desktop, 2 cols mobile. |
| **Contenido** | 6 items: Fecha y hora (Calendar), Distancia (Activity), Duración (Clock), Potencia media (Zap), FC media (Heart), Cadencia (TrendingUp). Cada uno con icono + label + valor placeholder. |
| **Reutilizable** | No — placeholder visual, se reemplazará cuando se implemente parseo real |

**Datos adicionales (sección debajo del preview)**:
- Separador con título "Datos adicionales (opcionales)"
- Campo: nombre de la actividad (Field)
- Campo: tipo de salida (SelectField)
- RPEInput
- Campo: notas (Field)

### 3.4 Field

| Campo | Valor |
|-------|-------|
| **Nombre** | `Field` |
| **Tipo** | Presentacional — input controlado |
| **Props** | `label: string` (obligatoria), `value: string` (obligatoria), `onChange: (value: string) => void` (obligatoria), `placeholder?: string`, `unit?: string`, `type?: string` (default "text"), `required?: boolean`, `hint?: string`, `half?: boolean` |
| **Estados** | Default. Con unidad (muestra a la derecha). Required (asterisco rojo). Con hint (texto debajo). |
| **Tokens** | Label: 12px weight 500 `t1`. Required: `#ef4444`. Input: padding `10px 14px`, radius 9, fontSize 14, fondo `inBg`, borde `inB`, texto `t1`. Unit: 12px `t3`. Hint: 11px `t4`. |
| **Responsive** | Si `half=true`, ocupa flex 1 (media fila en layout flex). |
| **Contenido** | Label (con asterisco si required) + input + unidad opcional + hint opcional |
| **Reutilizable** | Sí — reutiliza patrón de OnboardingField (DESIGN-SYSTEM §2.5) |

### 3.5 SelectField

| Campo | Valor |
|-------|-------|
| **Nombre** | `SelectField` |
| **Tipo** | Presentacional — select controlado |
| **Props** | `label: string` (obligatoria), `value: string` (obligatoria), `onChange: (value: string) => void` (obligatoria), `options: Array<{ value: string; label: string }>` (obligatoria), `required?: boolean` |
| **Estados** | Default único. |
| **Tokens** | Label: 12px weight 500 `t1`. Select: width 100%, padding `10px 14px`, radius 9, appearance none, fondo `inBg`, borde `inB`, fontSize 14, texto `t1`. Icono ChevronDown: 14px `t3`, posición absoluta derecha 12px. |
| **Responsive** | Flex 1 dentro del contenedor padre. |
| **Contenido** | Label (con asterisco si required) + select nativo con icono ChevronDown |
| **Reutilizable** | Sí — útil en cualquier formulario |

### 3.6 DurationInput

| Campo | Valor |
|-------|-------|
| **Nombre** | `DurationInput` |
| **Tipo** | Client Component — gestiona 3 inputs |
| **Props** | `hours: string` (obligatoria), `minutes: string` (obligatoria), `seconds: string` (obligatoria), `onHoursChange: (v: string) => void` (obligatoria), `onMinutesChange: (v: string) => void` (obligatoria), `onSecondsChange: (v: string) => void` (obligatoria), `required?: boolean` |
| **Estados** | Default único. |
| **Tokens** | Label: 12px weight 500 `t1`. Inputs: padding `10px 12px`, radius 9, fondo `inBg`, borde `inB`, fontSize 14, textAlign center. Units: 12px `t3`. |
| **Responsive** | 3 inputs en flex row con gap 8. Cada input flex 1. |
| **Contenido** | Label "Duración" + 3 inputs (h / min / seg) con unidades al lado |
| **Reutilizable** | Sí — útil para cualquier campo de duración |

### 3.7 RPEInput

| Campo | Valor |
|-------|-------|
| **Nombre** | `RPEInput` |
| **Tipo** | Client Component — gestiona selección interactiva de RPE |
| **Props** | `value: number` (obligatoria), `onChange: (value: number) => void` (obligatoria) |
| **Estados** | Sin selección (value=0): todas las barras inactivas. Con selección: barras 1..value activas con color y altura 36px, resto inactivas 28px. Label semántico visible si value > 0. |
| **Tokens** | Label: 12px weight 500 `t1`. Barras: width 100% (flex), gap 4, radius 5. Activas: color por valor individual, height 36px, número blanco 10px weight 700. Inactivas: fondo `t4` al 15%, height 28px, número `t4` 10px weight 700. Label semántico: 12px weight 500, color del valor activo. |
| **Responsive** | Sin diferencias — las barras se adaptan por flex. |
| **Contenido** | Label "Esfuerzo percibido (RPE)" + 10 barras clicables + label "{value}/10 — {nombre}" |
| **Reutilizable** | Sí — para cualquier formulario que necesite RPE interactivo |

**Colores por barra individual**:

| Barra | Color |
|-------|-------|
| 1-3 | `#22c55e` (verde) |
| 4 | `#84cc16` (lima) |
| 5-6 | `#eab308` (amarillo) |
| 7-8 | `#f97316` (naranja) |
| 9-10 | `#ef4444` (rojo) |

**Labels semánticos**:

| RPE | Label |
|-----|-------|
| 1 | Muy fácil |
| 2 | Fácil |
| 3 | Ligero |
| 4 | Moderado |
| 5 | Algo duro |
| 6 | Duro |
| 7 | Muy duro |
| 8 | Intenso |
| 9 | Máximo |
| 10 | Límite absoluto |

### 3.8 ActionBar

| Campo | Valor |
|-------|-------|
| **Nombre** | `ActionBar` |
| **Tipo** | Client Component — gestiona acciones de guardar/cancelar |
| **Props** | `mode: 'file' \| 'manual'` (obligatoria), `canSave: boolean` (obligatoria), `isSaved: boolean` (obligatoria), `onCancel: () => void` (obligatoria), `onGenerateMock: () => void` (obligatoria), `onSave: () => void` (obligatoria) |
| **Estados** | canSave=false: botón guardar disabled (fondo `t4` al 25%, texto `t4`, cursor not-allowed). canSave=true: gradient naranja + shadow. isSaved=true: texto "¡Guardada!" con Check. |
| **Tokens** | Container: flex, justify-between, maxWidth 640. Cancelar: transparente, borde `inB`, texto `t2`, 14px weight 500, padding `10px 18px`, radius 10. Mock: fondo `inBg`, borde `inB`, texto `t2`, 13px weight 500, icono FileText 14px. Guardar (activo): gradient `linear-gradient(135deg, #f97316, #ea580c)`, blanco, 14px weight 600, padding `10px 24px`, shadow `0 4px 16px rgba(249,115,22,0.25)`. Guardar (disabled): fondo `t4` al 25%, texto `t4`. |
| **Responsive** | Flex-wrap con gap 10. En mobile los botones se reorganizan. |
| **Contenido** | Botón "Cancelar" + (solo manual) Botón "Generar datos mock" con FileText + Botón "Guardar actividad" con Upload/Check |
| **Reutilizable** | No — específico de esta pantalla |

---

## 4. Jerarquía de Componentes

```
AppLayout (layout.tsx — Server Component)
├── Sidebar (Client) ♻️
│
└── ImportActivityPage (page.tsx — Server Component)
    └── ImportActivityContent (Client Component — gestiona todo el estado)
        ├── Header
        │   ├── Título "Importar actividad" (h1)
        │   └── Subtítulo descriptivo
        │
        ├── ImportModeToggle
        │   ├── Botón "Archivo .fit/.gpx" (Upload icon)
        │   └── Botón "Manual" (Edit3 icon)
        │
        ├── [Modo Archivo]
        │   ├── FileDropZone
        │   │   ├── Estado vacío (Upload + texto + badges)
        │   │   ├── Estado dragging (borde accent)
        │   │   └── Estado con archivo (Check + nombre + Quitar)
        │   │
        │   └── FilePreviewGrid (solo si archivo cargado)
        │       ├── Grid datos a extraer (6 items)
        │       ├── Separador
        │       └── Datos adicionales opcionales
        │           ├── Field (nombre)
        │           ├── SelectField (tipo)
        │           ├── RPEInput
        │           └── Field (notas)
        │
        ├── [Modo Manual]
        │   └── Card formulario
        │       ├── Info banner azul (AlertCircle)
        │       ├── Sección "Datos obligatorios" (accent)
        │       │   ├── Field (nombre) *
        │       │   ├── Row: Field (fecha) * + SelectField (tipo) *
        │       │   └── DurationInput (h/m/s) *
        │       ├── Sección "Métricas (opcionales)" (t2)
        │       │   ├── Row: Field (distancia) + Field (potencia)
        │       │   ├── Row: Field (FC media) + Field (FC máxima)
        │       │   └── Row: Field (cadencia) + [spacer]
        │       ├── RPEInput
        │       └── Textarea (notas)
        │
        ├── ActionBar
        │   ├── Botón "Cancelar"
        │   ├── Botón "Generar datos mock" (solo manual)
        │   └── Botón "Guardar actividad"
        │
        └── Toast de éxito (fixed, condicional)
```

**Leyenda**: ♻️ = Componente reutilizable existente, * = Campo obligatorio

---

## 5. Datos Necesarios

### Datos del Servidor

| Dato | Fuente | Cuándo |
|------|--------|--------|
| Ninguno | — | La pantalla no necesita datos del servidor al cargar |

**Nota**: Esta pantalla solo escribe datos (INSERT). No necesita queries de lectura.

### Datos del Cliente (Estado Local)

| Dato | Tipo | Componente | Valor inicial |
|------|------|-----------|---------------|
| `mode` | `'file' \| 'manual'` | ImportActivityContent | `'file'` |
| `file` | `FileInfo \| null` | ImportActivityContent | `null` |
| `form.name` | `string` | ImportActivityContent | `''` |
| `form.date` | `string` | ImportActivityContent | `''` |
| `form.type` | `string` | ImportActivityContent | `'outdoor'` |
| `form.duration_h` | `string` | ImportActivityContent | `''` |
| `form.duration_m` | `string` | ImportActivityContent | `''` |
| `form.duration_s` | `string` | ImportActivityContent | `''` |
| `form.distance` | `string` | ImportActivityContent | `''` |
| `form.avgPower` | `string` | ImportActivityContent | `''` |
| `form.avgHR` | `string` | ImportActivityContent | `''` |
| `form.maxHR` | `string` | ImportActivityContent | `''` |
| `form.avgCadence` | `string` | ImportActivityContent | `''` |
| `form.rpe` | `number` | ImportActivityContent | `0` |
| `form.notes` | `string` | ImportActivityContent | `''` |
| `isSaving` | `boolean` | ImportActivityContent | `false` |
| `errors` | `Record<string, string>` | ImportActivityContent | `{}` |

### Contrato de datos

```typescript
// Payload para crear una actividad (modo manual)
interface CreateActivityPayload {
  name: string;                    // Obligatorio
  date: string;                    // Obligatorio, ISO date
  type: string;                    // Obligatorio: 'outdoor' | 'indoor' | 'recovery'
  duration_seconds: number;        // Obligatorio, calculado de h/m/s
  distance_km: number | null;      // Opcional
  avg_power_watts: number | null;  // Opcional
  avg_hr_bpm: number | null;       // Opcional
  max_hr_bpm: number | null;       // Opcional
  avg_cadence_rpm: number | null;  // Opcional
  rpe: number | null;              // Opcional (1-10, 0 = no definido)
  notes: string | null;            // Opcional
}
```

**Validación para habilitar "Guardar"**:
- Modo archivo: `file !== null`
- Modo manual: `name !== '' && date !== '' && (duration_h !== '' || duration_m !== '')`

---

## 6. Flujos de Interacción

### Flujo 1: Carga inicial

1. Usuario navega a `/activities/import` desde el botón "Importar" en la lista de actividades.
2. Se muestra el modo "Archivo" por defecto.
3. FileDropZone en estado vacío (borde dashed, icono Upload).
4. Botón "Guardar actividad" deshabilitado (no hay archivo).

### Flujo 2: Cambiar modo

1. Usuario hace clic en "Manual" en el toggle.
2. El toggle marca "Manual" como activo (fondo `actBg`, texto `acc`).
3. Se oculta FileDropZone y se muestra el formulario manual.
4. Botón "Guardar" deshabilitado (campos obligatorios vacíos).
5. Aparece botón "Generar datos mock".

### Flujo 3: Drag & drop de archivo

1. Usuario arrastra un archivo sobre la zona de drop.
2. Durante el drag: borde cambia a `acc` dashed, fondo a `dropBg`, icono Upload se colorea `acc`.
3. Al soltar: se valida la extensión (.fit o .gpx).
4. Si válido: FileDropZone cambia a estado "con archivo" (fondo verde, Check, nombre, botón Quitar).
5. Se muestra el FilePreviewGrid con los datos a extraer.
6. Se muestran campos opcionales (nombre, tipo, RPE, notas).
7. Botón "Guardar actividad" se habilita (gradient naranja).
8. Si extensión inválida: no se hace nada (el archivo se ignora).

### Flujo 4: Clic para seleccionar archivo

1. Usuario hace clic en la zona de drop.
2. Se abre el selector de archivos del navegador (accept=".fit,.gpx").
3. Si selecciona un archivo válido: mismo comportamiento que Flujo 3 paso 4-7.
4. Si cancela el selector: no pasa nada.

### Flujo 5: Quitar archivo

1. Usuario hace clic en botón "Quitar" (Trash2 rojo).
2. FileDropZone vuelve a estado vacío.
3. FilePreviewGrid desaparece.
4. Botón "Guardar actividad" se deshabilita.

### Flujo 6: Rellenar formulario manual

1. Usuario está en modo manual.
2. Rellena nombre (obligatorio) → campo se actualiza en tiempo real.
3. Selecciona fecha con input type="date" (obligatorio).
4. Selecciona tipo de salida en SelectField.
5. Introduce duración en los 3 inputs h/m/s (al menos h o m obligatorio).
6. Opcionalmente rellena métricas: distancia, potencia, FC, cadencia.
7. Selecciona RPE haciendo clic en las barras (opcional).
8. Escribe notas en textarea (opcional).
9. Botón "Guardar" se habilita cuando nombre + fecha + duración están completos.

### Flujo 7: Generar datos mock

1. Usuario en modo manual, hace clic en "Generar datos mock".
2. Se rellenan automáticamente todos los campos del formulario con datos realistas:
   - Nombre: "Ruta de entrenamiento" o similar
   - Fecha: hoy
   - Tipo: aleatorio
   - Duración: 1-3 horas
   - Distancia: 30-100 km
   - Potencia: 150-220 W
   - FC media: 135-165 bpm
   - FC máxima: 165-185 bpm
   - Cadencia: 80-95 rpm
   - RPE: 5-8
   - Notas: texto descriptivo
3. Botón "Guardar" se habilita.

### Flujo 8: Guardar actividad (flujo feliz)

1. Usuario hace clic en "Guardar actividad" (habilitado).
2. Botón cambia a estado "saving" (spinner o disabled).
3. Se convierte duración h/m/s a segundos.
4. Se hace INSERT en `activities` vía Supabase con RLS.
5. Toast verde: "Actividad guardada correctamente" (fixed bottom-right).
6. Tras 2s, redirect a `/activities`.

### Flujo 9: Cancelar

1. Usuario hace clic en "Cancelar".
2. Se navega de vuelta a `/activities` sin guardar datos.
3. No hay confirmación (los datos se pierden).

### Flujo 10: Errores de validación

1. Si el INSERT falla (error de Supabase o validación Zod).
2. Se muestra error genérico: "No se pudo guardar la actividad. Inténtalo de nuevo."
3. El formulario mantiene los datos (no se resetea).
4. El usuario puede corregir y reintentar.

---

## 7. Tokens de Tema Aplicables

### Importar Actividad

| Elemento | Token | Dark | Light |
|----------|-------|------|-------|
| Fondo página | `bg` | `#0c1320` | `#f8f9fb` |
| Card fondo | `card` | `rgba(255,255,255,0.02)` | `#ffffff` |
| Card borde | `cardB` | `rgba(255,255,255,0.06)` | `#e2e8f0` |
| Título (h1) | `t1` | `#f1f5f9` | `#0f172a` |
| Subtítulo | `t3` | `#64748b` | `#64748b` |
| Input fondo | `inBg` | `rgba(255,255,255,0.04)` | `#f8fafc` |
| Input borde | `inB` | `rgba(255,255,255,0.08)` | `#e2e8f0` |
| Toggle activo fondo | `actBg` | `rgba(249,115,22,0.12)` | `rgba(249,115,22,0.08)` |
| Acento | `acc` | `#f97316` | `#ea580c` |
| Separador | `sep` | `rgba(255,255,255,0.04)` | `#e2e8f0` |
| Drop vacío borde | `inB` (dashed) | `rgba(255,255,255,0.08)` | `#e2e8f0` |
| Drop dragging borde | `acc` (dashed) | `#f97316` | `#ea580c` |
| Drop dragging fondo | `dropBg` | `rgba(249,115,22,0.04)` | `rgba(249,115,22,0.03)` |
| Drop dragging borde solid | `dropB` | `rgba(249,115,22,0.2)` | `rgba(249,115,22,0.25)` |
| Archivo cargado fondo | `successBg` | `rgba(34,197,94,0.08)` | `rgba(34,197,94,0.06)` |
| Archivo cargado borde | `successB` | `rgba(34,197,94,0.2)` | `rgba(34,197,94,0.25)` |
| Botón quitar fondo | — | `rgba(239,68,68,0.08)` | `rgba(239,68,68,0.08)` |
| Botón quitar borde | — | `rgba(239,68,68,0.2)` | `rgba(239,68,68,0.2)` |
| Botón quitar texto | — | `#ef4444` | `#ef4444` |
| Info banner fondo | — | `rgba(59,130,246,0.06)` | `rgba(59,130,246,0.06)` |
| Info banner borde | — | `rgba(59,130,246,0.15)` | `rgba(59,130,246,0.15)` |
| Toast fondo | — | `#22c55e` | `#22c55e` |
| Toast texto | — | `#ffffff` | `#ffffff` |

---

## 8. Componentes Reutilizables

| Componente | Usado en Import | Reutilizado de | shadcn/ui base | Crear custom |
|------------|----------------|----------------|----------------|--------------|
| **Sidebar** | Layout | Dashboard (compartido) | No — custom | Ya existe ♻️ |
| **ThemeToggle** | Sidebar | Auth flow (ya existe) | No — custom | Ya existe ♻️ |
| **Field** | Formulario | Onboarding (patrón similar) | No — custom | Sí (nuevo) |
| **SelectField** | Tipo de salida | Nuevo | No — custom | Sí (nuevo) |
| **DurationInput** | Duración h/m/s | Nuevo | No — custom | Sí (nuevo) |
| **RPEInput** | RPE interactivo | Nuevo | No — custom | Sí (nuevo) |
| **FileDropZone** | Carga de archivo | Nuevo | No — custom | Sí (nuevo) |
| **ImportModeToggle** | Toggle de modo | Nuevo | No — custom | Sí (nuevo) |

**Nota**: Field reutiliza el patrón visual de OnboardingField pero es un componente nuevo más genérico (sin el contexto del onboarding). RPEInput es diferente de RPEIndicator (que es solo visual, no interactivo).

---

## 9. Transformaciones JSX Necesarias

### Mode toggle → Tailwind

```jsx
// ❌ Mockup (inline)
<div style={{
  display: "inline-flex", gap: 4, padding: 4, borderRadius: 12,
  background: theme.inBg, border: `1px solid ${theme.inB}`,
}}>

// ✅ Proyecto (Tailwind)
<div className="inline-flex gap-1 p-1 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)]">
```

### FileDropZone vacío → Tailwind

```jsx
// ❌ Mockup (inline)
<div style={{
  border: `2px dashed ${dragging ? t.acc : t.inB}`,
  borderRadius: 16, padding: mob ? 28 : 40,
  background: dragging ? t.dropBg : "transparent",
}}>

// ✅ Proyecto (Tailwind + CSS vars)
<div className={cn(
  "border-2 border-dashed rounded-2xl p-7 md:p-10 text-center cursor-pointer transition-all",
  isDragging
    ? "border-orange-500 dark:border-orange-400 bg-[var(--drop-bg)]"
    : "border-[var(--input-border)]"
)}>
```

### FileDropZone con archivo → Tailwind

```jsx
// ❌ Mockup (inline)
<div style={{
  background: t.successBg, border: `1px solid ${t.successB}`,
  borderRadius: 14, padding: 20,
}}>

// ✅ Proyecto (Tailwind + CSS vars)
<div className="bg-[var(--success-bg)] border border-[var(--success-border)] rounded-[14px] p-5 flex items-center gap-3.5">
```

### RPEInput barras → Tailwind

```jsx
// ❌ Mockup (inline)
<button style={{
  width: "100%", height: active ? 36 : 28, borderRadius: 5,
  background: active ? c : `${t.t4}15`,
}}>

// ✅ Proyecto (Tailwind + style dinámico)
<button
  className={cn(
    "flex-1 rounded-[5px] flex items-center justify-center transition-all border-none cursor-pointer",
    isActive ? "h-9" : "h-7"
  )}
  style={{ backgroundColor: isActive ? color : undefined }}
>
```

### DurationInput → Tailwind

```jsx
// ❌ Mockup (inline)
<div style={{ display: "flex", gap: 8, alignItems: "center" }}>
  <input style={{ textAlign: "center", padding: "10px 12px" }} />
  <span style={{ fontSize: 12, color: t.t3 }}>h</span>
</div>

// ✅ Proyecto (Tailwind)
<div className="flex gap-2 items-center">
  <input className="flex-1 text-center px-3 py-2.5 rounded-[9px] bg-[var(--input-bg)] border border-[var(--input-border)] text-sm text-[var(--t1)] outline-none" />
  <span className="text-xs text-slate-500">h</span>
</div>
```

---

## 10. Dependencias Externas

### Paquetes npm

| Paquete | Uso | Ya instalado |
|---------|-----|-------------|
| `lucide-react` | Iconos: Upload, Edit3, FileText, Trash2, Check, AlertCircle, ChevronDown, Calendar, Activity, Clock, Zap, Heart, TrendingUp | Sí |
| `next-themes` | Toggle de tema en Sidebar | Sí |
| `@supabase/ssr` | Insert a Supabase (server action o client) | Sí |

### Componentes shadcn/ui a instalar

Ninguno nuevo para esta pantalla.

### Integraciones

| Servicio | Uso | Estado |
|----------|-----|--------|
| Supabase DB (tabla `activities`) | INSERT de nueva actividad | ✅ Tabla creada |
| Supabase Storage | Upload de archivos .fit/.gpx | ❌ Por implementar (fuera de alcance MVP) |

---

## Apéndice: Datos Mock del Formulario

```typescript
export function generateMockActivity(): FormData {
  const names = [
    "Ruta de entrenamiento",
    "Intervalos matutinos",
    "Salida larga fin de semana",
    "Recuperación activa",
    "Tempo en llano",
    "Subida al puerto",
  ];
  const types = ["outdoor", "indoor", "recovery"] as const;

  return {
    name: names[Math.floor(Math.random() * names.length)],
    date: new Date().toISOString().split("T")[0],
    type: types[Math.floor(Math.random() * types.length)],
    duration_h: String(1 + Math.floor(Math.random() * 3)),
    duration_m: String(Math.floor(Math.random() * 60)).padStart(2, "0"),
    duration_s: "00",
    distance: String((30 + Math.random() * 70).toFixed(1)),
    avgPower: String(150 + Math.floor(Math.random() * 70)),
    avgHR: String(135 + Math.floor(Math.random() * 30)),
    maxHR: String(165 + Math.floor(Math.random() * 20)),
    avgCadence: String(80 + Math.floor(Math.random() * 15)),
    rpe: 5 + Math.floor(Math.random() * 4),
    notes: "Buen día, sensaciones positivas. Viento moderado del SO.",
  };
}
```

### Opciones de SelectField (Tipo de salida)

| Valor | Label | Contexto |
|-------|-------|----------|
| `outdoor` | 🚴 Exterior | Modo manual (obligatorio) |
| `indoor` | 🏠 Rodillo | Modo manual (obligatorio) |
| `recovery` | 🔵 Recuperación | Modo manual (obligatorio) |
| `outdoor` | Exterior | Modo archivo (opcional, sin emoji) |
| `indoor` | Rodillo | Modo archivo (opcional, sin emoji) |
| `recovery` | Recuperación | Modo archivo (opcional, sin emoji) |
