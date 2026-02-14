# L2 — Diseño Técnico: Importar Actividad

> **Input**: `docs/specs/L1-screen-02-import-activity.md`
> **Requisito PRD**: F04 — Importación de actividades (P0)
> **Fecha**: 2026-02-14

---

## 1. Resumen del Alcance

### Qué se construye

1. **Página de Importar Actividad** (`(app)/activities/import/page.tsx`): Server Component minimal que renderiza el Client Component principal.
2. **ImportActivityContent** (Client Component): Componente principal que gestiona todo el estado (modo, archivo, formulario, validación, guardado).
3. **ImportModeToggle** (Client Component): Toggle entre modo archivo y manual.
4. **FileDropZone** (Client Component): Zona de carga con drag & drop y selector de archivos.
5. **SelectField** (Presentacional): Select nativo con label y estilo consistente.
6. **DurationInput** (Client Component): 3 inputs para horas/minutos/segundos.
7. **RPEInput** (Client Component): Selector interactivo de RPE con 10 barras clicables.
8. **Schema `activityCreateSchema`** (Zod): Validación del payload de creación.
9. **Utilidades**: `generateMockActivity()`, `durationToSeconds()`, `secondsToDuration()`.

### Fuera de alcance

- Parseo real de archivos .fit/.gpx — el modo archivo es un placeholder visual en el MVP. Se muestra la UI completa pero no se extraen datos del archivo.
- Upload a Supabase Storage — los archivos no se almacenan en el MVP.
- Series temporales de la actividad — solo métricas agregadas.
- Análisis IA post-importación — se implementará en una issue posterior.
- Tipos de actividad extendidos (intervals, endurance, tempo) — se usa el ENUM actual de la DB (outdoor, indoor, recovery).

### Prerequisitos técnicos

- Auth con Google OAuth: **implementado**.
- Tabla `activities`: **creada** (migration 001).
- Layout con Sidebar (route group `(app)`): **implementado** (Dashboard).
- `packages/shared/src/schemas/activity.ts`: **existe** con `activitySchema`.

---

## 2. Arquitectura de Componentes

### 2.1 Árbol de componentes

```
app/(app)/activities/import/page.tsx (Server Component)
│   → Renderiza ImportActivityContent
│
└── ImportActivityContent (Client Component — TODO el estado)
    ├── Header (inline)
    │   ├── h1 "Importar actividad"
    │   └── p subtítulo
    │
    ├── ImportModeToggle
    │   ├── Botón "Archivo .fit/.gpx" (Upload icon)
    │   └── Botón "Manual" (Edit3 icon)
    │
    ├── [mode === 'file']
    │   ├── FileDropZone
    │   └── [file !== null] FilePreviewCard (inline)
    │       ├── Grid datos a extraer (6 items)
    │       ├── Separador
    │       └── Datos adicionales
    │           ├── Field (nombre)
    │           ├── SelectField (tipo)
    │           ├── RPEInput
    │           └── Field (notas)
    │
    ├── [mode === 'manual']
    │   └── Card formulario (inline)
    │       ├── Info banner (AlertCircle)
    │       ├── Sección obligatorios
    │       │   ├── Field (nombre)
    │       │   ├── Row: Field (fecha) + SelectField (tipo)
    │       │   └── DurationInput (h/m/s)
    │       ├── Sección métricas opcionales
    │       │   ├── Row: Field (distancia) + Field (potencia)
    │       │   ├── Row: Field (FC media) + Field (FC máxima)
    │       │   └── Row: Field (cadencia) + [spacer]
    │       ├── RPEInput
    │       └── Textarea (notas)
    │
    └── ActionBar (inline)
        ├── Botón "Cancelar"
        ├── Botón "Generar datos mock" (solo manual)
        └── Botón "Guardar actividad"
```

### 2.2 Detalle por componente

#### ImportActivityContent

```typescript
// Ruta: apps/web/src/app/(app)/activities/import/import-activity-content.tsx
// Tipo: Client Component ('use client')

// Sin props — obtiene user de Supabase client-side para INSERT
```

- **Responsabilidad**: Componente principal. Gestiona modo, archivo, estado del formulario completo, validación, guardado en Supabase, navegación post-guardado.
- **Fuente de datos**: Estado local (`useState`). No recibe datos del server.
- **Dependencias**: ImportModeToggle, FileDropZone, SelectField, DurationInput, RPEInput, Field (inline o extraído), `lucide-react`, `next/navigation` (useRouter), `@supabase/ssr` (createBrowserClient), schema Zod.
- **Decisiones**: Client Component porque es fundamentalmente interactivo. Todo el estado vive aquí (no hay data fetching server-side). Usa insert directo a Supabase (patrón ADR-005/015).

**Estado interno**:
```typescript
const [mode, setMode] = useState<'file' | 'manual'>('file');
const [file, setFile] = useState<FileInfo | null>(null);
const [form, setForm] = useState<ImportFormData>({
  name: '', date: '', type: 'outdoor',
  duration_h: '', duration_m: '', duration_s: '',
  distance: '', avgPower: '', avgHR: '', maxHR: '',
  avgCadence: '', rpe: 0, notes: '',
});
const [isSaving, setIsSaving] = useState(false);
const [errors, setErrors] = useState<Record<string, string>>({});
```

**Tipos**:
```typescript
interface ImportFormData {
  name: string;
  date: string;
  type: string;
  duration_h: string;
  duration_m: string;
  duration_s: string;
  distance: string;
  avgPower: string;
  avgHR: string;
  maxHR: string;
  avgCadence: string;
  rpe: number;
  notes: string;
}

interface FileInfo {
  name: string;
  size: number;
  ext: string;
}
```

#### ImportModeToggle

```typescript
// Ruta: apps/web/src/app/(app)/activities/import/import-mode-toggle.tsx
// Tipo: Client Component (inline en el directorio de la página)

interface ImportModeToggleProps {
  mode: 'file' | 'manual';
  onModeChange: (mode: 'file' | 'manual') => void;
}
```

- **Responsabilidad**: Toggle visual entre los dos modos de importación.
- **Fuente de datos**: Props.
- **Dependencias**: `lucide-react` (Upload, Edit3).
- **Decisiones**: Componente local a la pantalla (no reutilizable). Inline sería aceptable pero extraerlo mejora legibilidad.

#### FileDropZone

```typescript
// Ruta: apps/web/src/components/file-drop-zone.tsx
// Tipo: Client Component ('use client')

interface FileDropZoneProps {
  file: FileInfo | null;
  onFile: (file: FileInfo) => void;
  onClear: () => void;
}
```

- **Responsabilidad**: Zona de carga con drag & drop y clic para seleccionar. Gestiona 3 estados visuales (vacío, dragging, con archivo). Valida extensiones.
- **Fuente de datos**: Props.
- **Dependencias**: `lucide-react` (Upload, Check, Trash2).
- **Decisiones**: Componente reutilizable en `components/`. Usa `useCallback` para handlers de drag. Input `type="file"` oculto activado por clic. Solo valida extensión (no contenido del archivo).

#### SelectField

```typescript
// Ruta: apps/web/src/components/select-field.tsx
// Tipo: Presentacional

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
}
```

- **Responsabilidad**: Select nativo estilizado con label, icono ChevronDown, y asterisco required opcional.
- **Fuente de datos**: Props.
- **Dependencias**: `lucide-react` (ChevronDown).
- **Decisiones**: Select nativo con `appearance: none` (mejor accesibilidad y soporte mobile que un custom dropdown). Mismo patrón visual que OnboardingField.

#### DurationInput

```typescript
// Ruta: apps/web/src/components/duration-input.tsx
// Tipo: Client Component

interface DurationInputProps {
  hours: string;
  minutes: string;
  seconds: string;
  onHoursChange: (value: string) => void;
  onMinutesChange: (value: string) => void;
  onSecondsChange: (value: string) => void;
  required?: boolean;
}
```

- **Responsabilidad**: 3 inputs numéricos para horas, minutos y segundos con labels de unidad.
- **Fuente de datos**: Props.
- **Dependencias**: Ninguna externa.
- **Decisiones**: 3 inputs separados (no un solo input con máscara). Más accesible y simple. Validación numérica por tipo de input o filtrado en onChange.

#### RPEInput

```typescript
// Ruta: apps/web/src/components/rpe-input.tsx
// Tipo: Client Component ('use client')

interface RPEInputProps {
  value: number;
  onChange: (value: number) => void;
}
```

- **Responsabilidad**: Selector interactivo de RPE con 10 barras clicables. Muestra label semántico del valor seleccionado.
- **Fuente de datos**: Props.
- **Dependencias**: Constantes `RPE_LABELS` y `RPE_BAR_COLORS` (locales o en shared).
- **Decisiones**: Separado de `RPEIndicator` (ADR-025). Éste es interactivo (onClick por barra), aquél es solo visual. Los colores son por barra individual (no por rango como RPEIndicator).

**Constantes**:
```typescript
const RPE_LABELS = [
  '', 'Muy fácil', 'Fácil', 'Ligero', 'Moderado', 'Algo duro',
  'Duro', 'Muy duro', 'Intenso', 'Máximo', 'Límite absoluto',
];

const RPE_BAR_COLORS = [
  '', '#22c55e', '#22c55e', '#22c55e', '#84cc16', '#eab308',
  '#eab308', '#f97316', '#f97316', '#ef4444', '#ef4444',
];
```

---

## 3. Modelo de Datos

### Schema Zod para creación de actividad

```typescript
// packages/shared/src/schemas/activity.ts (MODIFICAR — añadir schema de creación)

import { z } from 'zod';

// Schema existente...
export const activitySchema = z.object({ /* ... ya existe ... */ });

// NUEVO: Schema para creación de actividad (sin campos auto-generados)
export const activityCreateSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha en formato YYYY-MM-DD'),
  type: z.enum(['outdoor', 'indoor', 'recovery']),
  duration_seconds: z.number().int().positive('La duración debe ser mayor a 0'),
  distance_km: z.number().positive().nullable().default(null),
  avg_power_watts: z.number().int().positive().nullable().default(null),
  avg_hr_bpm: z.number().int().positive().nullable().default(null),
  max_hr_bpm: z.number().int().positive().nullable().default(null),
  avg_cadence_rpm: z.number().int().positive().nullable().default(null),
  rpe: z.number().int().min(1).max(10).nullable().default(null),
  notes: z.string().nullable().default(null),
});

export type ActivityCreate = z.infer<typeof activityCreateSchema>;
```

### Insert directo a Supabase

```typescript
// En ImportActivityContent — handleSave
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

const payload: ActivityCreate = {
  name: form.name,
  date: form.date,
  type: form.type as 'outdoor' | 'indoor' | 'recovery',
  duration_seconds: durationToSeconds(form.duration_h, form.duration_m, form.duration_s),
  distance_km: form.distance ? parseFloat(form.distance) : null,
  avg_power_watts: form.avgPower ? parseInt(form.avgPower) : null,
  avg_hr_bpm: form.avgHR ? parseInt(form.avgHR) : null,
  max_hr_bpm: form.maxHR ? parseInt(form.maxHR) : null,
  avg_cadence_rpm: form.avgCadence ? parseInt(form.avgCadence) : null,
  rpe: form.rpe > 0 ? form.rpe : null,
  notes: form.notes || null,
};

// Validar con Zod
const result = activityCreateSchema.safeParse(payload);
if (!result.success) {
  // Mostrar errores
  return;
}

const { error } = await supabase
  .from('activities')
  .insert(result.data);
```

### Funciones de utilidad

```typescript
// apps/web/src/lib/activities/duration-utils.ts

/**
 * Convierte horas, minutos y segundos (strings) a segundos totales.
 */
export function durationToSeconds(h: string, m: string, s: string): number {
  const hours = parseInt(h) || 0;
  const minutes = parseInt(m) || 0;
  const seconds = parseInt(s) || 0;
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Convierte segundos totales a objeto { h, m, s } como strings.
 */
export function secondsToDuration(totalSeconds: number): { h: string; m: string; s: string } {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return {
    h: String(h),
    m: String(m).padStart(2, '0'),
    s: String(s).padStart(2, '0'),
  };
}
```

```typescript
// apps/web/src/lib/activities/generate-mock-activity.ts

import type { ImportFormData } from '@/app/(app)/activities/import/import-activity-content';

const MOCK_NAMES = [
  'Ruta de entrenamiento',
  'Intervalos matutinos',
  'Salida larga fin de semana',
  'Recuperación activa',
  'Tempo en llano',
  'Subida al puerto',
];

const MOCK_TYPES = ['outdoor', 'indoor', 'recovery'] as const;

export function generateMockActivity(): ImportFormData {
  return {
    name: MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)],
    date: new Date().toISOString().split('T')[0],
    type: MOCK_TYPES[Math.floor(Math.random() * MOCK_TYPES.length)],
    duration_h: String(1 + Math.floor(Math.random() * 3)),
    duration_m: String(Math.floor(Math.random() * 60)).padStart(2, '0'),
    duration_s: '00',
    distance: (30 + Math.random() * 70).toFixed(1),
    avgPower: String(150 + Math.floor(Math.random() * 70)),
    avgHR: String(135 + Math.floor(Math.random() * 30)),
    maxHR: String(165 + Math.floor(Math.random() * 20)),
    avgCadence: String(80 + Math.floor(Math.random() * 15)),
    rpe: 5 + Math.floor(Math.random() * 4),
    notes: 'Buen día, sensaciones positivas. Viento moderado del SO.',
  };
}
```

---

## 4. Endpoints API

**No se requieren endpoints Fastify nuevos** para Importar Actividad.

**Justificación**: El INSERT se hace directamente a Supabase desde el Client Component usando `createBrowserClient`. Este es el mismo patrón usado en otras pantallas de escritura (ADR-005 / ADR-015). El RLS de Supabase garantiza que el `user_id` se asigna correctamente.

**Endpoints futuros pendientes**:
- `POST /api/v1/activities/upload`: Para procesar archivos .fit/.gpx server-side (parsing + extracción de datos).
- `POST /api/v1/ai/analyze-activity`: Para generar análisis IA post-importación.

---

## 5. Estructura de Archivos

### Archivos nuevos

```
apps/web/src/app/(app)/activities/import/page.tsx              ← Server Component: renderiza ImportActivityContent
apps/web/src/app/(app)/activities/import/import-activity-content.tsx ← Client Component: estado + formulario
apps/web/src/app/(app)/activities/import/import-mode-toggle.tsx ← Toggle archivo/manual

apps/web/src/components/file-drop-zone.tsx                      ← Zona drag & drop (reutilizable)
apps/web/src/components/select-field.tsx                        ← Select nativo con label (reutilizable)
apps/web/src/components/duration-input.tsx                      ← Input de duración h/m/s (reutilizable)
apps/web/src/components/rpe-input.tsx                           ← RPE interactivo con 10 barras (reutilizable)

apps/web/src/lib/activities/generate-mock-activity.ts           ← Generador de datos mock
apps/web/src/lib/activities/duration-utils.ts                   ← Conversión duración ↔ segundos
```

### Archivos a modificar

```
packages/shared/src/schemas/activity.ts                        ← Añadir activityCreateSchema
packages/shared/src/index.ts                                    ← Re-exportar activityCreateSchema y ActivityCreate
apps/web/src/app/globals.css                                    ← Añadir CSS variables para tokens nuevos (success, drop)
```

### Dependencias con otras pantallas

La pantalla de Importar Actividad reutiliza:
- Layout `(app)/layout.tsx` con Sidebar — **implementado** (Dashboard).
- Tabla `activities` — **creada** (migration 001).
- `activitySchema` de `packages/shared` — **existe**.

No depende de:
- No depende de la Lista de Actividades (se puede implementar independientemente).
- No depende del Detalle de Actividad.

---

## 6. ADRs (Decisiones Arquitectónicas)

### ADR-023: Insert directo a Supabase (sin API intermedia)

- **Contexto**: La importación manual necesita persistir una actividad. Se puede hacer via endpoint Fastify o directamente a Supabase.
- **Decisión**: Insert directo usando `createBrowserClient` de `@supabase/ssr`, siguiendo el patrón de ADR-005 y ADR-015.
- **Alternativas descartadas**:
  - Endpoint Fastify POST /activities: Añade un salto innecesario para un INSERT simple. La validación con Zod se hace en el cliente.
  - Server Action de Next.js: Viable pero añade complejidad. El patrón directo es más simple y consistente con el resto del proyecto.
- **Consecuencias**:
  - (+) Consistente con el patrón del proyecto.
  - (+) RLS de Supabase asigna `user_id` automáticamente.
  - (+) Sin latencia del middleware Fastify.
  - (-) Validación Zod se ejecuta en el cliente (pero los datos vienen del propio formulario del usuario).

### ADR-024: Modo archivo como placeholder visual en MVP

- **Contexto**: El mockup muestra un flujo completo de importación de archivo con preview de datos extraídos. El parseo de .fit/.gpx requiere librerías específicas y lógica compleja.
- **Decisión**: Implementar toda la UI del modo archivo (FileDropZone, preview grid) pero sin parseo real. El archivo se selecciona visualmente pero no se procesa. El INSERT solo funciona en modo manual.
- **Alternativas descartadas**:
  - Implementar parseo .fit/.gpx completo: Demasiado scope para el MVP. Librerías como `fit-parser` y `gpx-parse` tienen dependencias complejas.
  - Ocultar modo archivo: Peor UX — el usuario no ve que la funcionalidad está planificada.
- **Consecuencias**:
  - (+) La UI está lista para cuando se implemente el parseo.
  - (+) Reduce scope del MVP significativamente.
  - (-) El usuario podría confundirse si intenta guardar un archivo sin datos — mitigar con mensaje claro.

### ADR-025: RPEInput separado de RPEIndicator

- **Contexto**: Ya existe `RPEIndicator` (spec L2-screen-03) como componente visual de solo lectura (10 barras coloreadas). La importación necesita un RPE interactivo (clicable).
- **Decisión**: Crear `RPEInput` como componente independiente. No extender RPEIndicator.
- **Alternativas descartadas**:
  - Añadir `interactive` prop a RPEIndicator: Mezcla dos responsabilidades muy diferentes (visualización vs input). El RPEInput tiene barras con diferente altura, números, labels semánticos, onClick — muy diferente de RPEIndicator.
  - Un solo componente con renderizado condicional: Demasiadas ramas condicionales para dos UIs distintas.
- **Consecuencias**:
  - (+) Cada componente tiene una responsabilidad clara.
  - (+) RPEInput puede evolucionar independientemente (validación, animaciones).
  - (+) Los colores de RPEInput son por barra individual (más granulares que los rangos de RPEIndicator).
  - (-) Dos componentes con nombre similar — documentar la diferencia claramente.

### ADR-026: OnboardingField como patrón, no como componente reutilizado

- **Contexto**: El OnboardingField (spec L2-screen-00) tiene un patrón visual similar al Field de importación (label + input + unit + hint). Pero el OnboardingField está en el contexto del onboarding con lógica específica.
- **Decisión**: Crear un nuevo componente `Field` genérico inspirado en OnboardingField pero sin dependencias del onboarding. Crear `SelectField` nuevo para selects nativos.
- **Alternativas descartadas**:
  - Reutilizar OnboardingField directamente: Tiene acoplamientos con el flujo de onboarding.
  - Usar componentes shadcn/ui Input directamente: No tienen label + unit + hint integrados.
- **Consecuencias**:
  - (+) Field y SelectField son genéricos y reutilizables en cualquier formulario.
  - (+) Patrón visual consistente con OnboardingField sin acoplamiento.
  - (-) Ligera duplicación del patrón visual (aceptable).

### ADR-027: DurationInput como 3 inputs separados

- **Contexto**: La duración puede implementarse como un input de texto con máscara (ej: "01:45:00"), un time picker, o 3 inputs separados.
- **Decisión**: 3 inputs separados (horas, minutos, segundos) con labels de unidad.
- **Alternativas descartadas**:
  - Input con máscara: Requiere librería de masking, mala experiencia en mobile.
  - Time picker nativo: `<input type="time">` no soporta más de 24h y tiene UX inconsistente entre navegadores.
  - Un solo input en minutos: Poco intuitivo para duraciones largas (ej: 180 min vs 3h 00min).
- **Consecuencias**:
  - (+) Intuitivo — el usuario piensa en horas y minutos naturalmente.
  - (+) Sin dependencias externas.
  - (+) Fácil de validar (cada campo es un número simple).
  - (-) 3 handlers de onChange — se encapsulan en DurationInput.

---

## 7. Dependencias y Prerequisitos

### Paquetes npm a instalar

| Paquete | Workspace | Justificación |
|---------|-----------|---------------|
| Ninguno nuevo | — | — |

### Paquetes ya instalados

| Paquete | Uso |
|---------|-----|
| `lucide-react` | Iconos: Upload, Edit3, FileText, Trash2, Check, AlertCircle, ChevronDown, Calendar, Activity, Clock, Zap, Heart, TrendingUp |
| `@supabase/ssr` | Insert a Supabase (createBrowserClient) |
| `next` | useRouter para navegación post-guardado |
| `zod` | Validación del payload (activityCreateSchema) |

### Componentes ya creados (reutilizables)

| Componente | Fuente | Uso en Import |
|-----------|--------|--------------|
| `Sidebar` | `apps/web/src/components/sidebar.tsx` | Layout compartido |
| `ThemeToggle` | `apps/web/src/components/theme-toggle.tsx` | En Sidebar |
| `RPEIndicator` | `apps/web/src/components/rpe-indicator.tsx` | NO se reutiliza — se crea RPEInput (diferente) |

### Tablas Supabase

- ✅ `activities`: creada (migration 001). INSERT con RLS (user_id del auth).
- ✅ `activity_type` ENUM: `('outdoor', 'indoor', 'recovery')` — compatible con las opciones del SelectField.

---

## 8. Riesgos y Consideraciones

### Riesgo 1: Validación de archivos solo por extensión

**Descripción**: FileDropZone solo valida la extensión del archivo (.fit/.gpx), no su contenido. Un usuario podría renombrar cualquier archivo a .fit y "cargarlo".

**Mitigación**:
- Para el MVP es aceptable — el modo archivo es un placeholder visual (ADR-024).
- Cuando se implemente parseo real, se validará el contenido (magic bytes, estructura interna).

### Riesgo 2: Tipos de actividad sin "rest"

**Descripción**: El ENUM de la DB es `('outdoor', 'indoor', 'recovery')`. El design system menciona tipos adicionales (intervals, endurance, tempo, rest) que no existen en la DB.

**Mitigación**:
- El SelectField solo ofrece los 3 tipos del ENUM actual.
- Cuando se migren los tipos (issue futura), se actualizará el SelectField.

### Riesgo 3: Formato de fecha en diferentes navegadores

**Descripción**: `<input type="date">` devuelve formato ISO (`YYYY-MM-DD`) en todos los navegadores modernos, pero la UI del datepicker varía (especialmente en mobile Safari).

**Mitigación**:
- Validar formato con Zod regex: `/^\d{4}-\d{2}-\d{2}$/`.
- En el MVP, aceptar el datepicker nativo. Si la UX no es buena, se puede reemplazar con un datepicker custom (shadcn/ui Calendar) en iteración futura.

### Riesgo 4: Duración 0 segundos

**Descripción**: Si el usuario deja los 3 campos de duración vacíos pero uno de los otros obligatorios está relleno, `durationToSeconds('', '', '')` devuelve 0.

**Mitigación**:
- `activityCreateSchema` requiere `duration_seconds > 0` (z.number().int().positive()).
- La validación client-side (`canSave`) requiere al menos horas o minutos no vacíos.

### Consideraciones de accesibilidad

- **FileDropZone**: `role="button"`, `tabIndex={0}`, `aria-label="Seleccionar archivo .fit o .gpx"`, keyboard handler para Enter/Space.
- **RPEInput**: `role="slider"`, `aria-valuemin={1}`, `aria-valuemax={10}`, `aria-valuenow={value}`, `aria-label="Esfuerzo percibido"`. Cada barra también tiene `aria-label="RPE {n}"`.
- **DurationInput**: Cada input con `aria-label="Horas"` / `"Minutos"` / `"Segundos"`.
- **SelectField**: Label asociado con `htmlFor`, `aria-required` si required.
- **Campos required**: `aria-required="true"` en inputs obligatorios.
- **Errores**: `aria-invalid="true"` + `aria-describedby` apuntando al mensaje de error.
- **Toast**: `role="status"`, `aria-live="polite"`.
