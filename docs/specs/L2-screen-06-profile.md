# L2 — Diseño Técnico: Perfil

> **Input**: `docs/specs/L1-screen-06-profile.md`
> **Requisito PRD**: F08 — Perfil y ajustes (P1)
> **Fecha**: 2026-02-14

---

## 1. Resumen del Alcance

### Qué se construye

1. **Perfil** (`(app)/profile/page.tsx`): Pantalla de gestión de datos personales, entrenamiento, zonas de potencia/FC y ajustes.
2. **ProfileTabs** (Client Component): Componente con 3 tabs (Datos / Zonas / Ajustes) que gestiona el formulario, dirty state y submit.
3. **ZoneTable** (Client Component): Tabla de zonas de potencia/FC calculadas reactivamente.
4. **Constantes de zonas** (`packages/shared`): Definición de zonas y función de cálculo reutilizable.
5. **Endpoint API** (`PUT /api/v1/profile`): O alternativamente, UPDATE directo a Supabase desde el cliente.

### Fuera de alcance

- Integración real con Garmin/Strava (placeholder en tab "Ajustes").
- Infraestructura de notificaciones push (los toggles son funcionales visualmente pero no disparan notificaciones reales).
- Upload/cambio de avatar (se usa avatar de iniciales).
- Campo de preferencia de unidades (km/mi) — mencionado en PRD pero no presente en el mockup.

### Prerequisitos técnicos

- Auth con Google OAuth: **implementado**.
- Tabla `users`: **creada** (migration 001 + 002) con todos los campos necesarios.
- Schema Zod `onboardingSchema` + `userProfileSchema`: **creados** en `packages/shared`.
- Constantes `GOALS`: **creadas** en `packages/shared`.
- Componentes `OnboardingField` y `GoalCard`: **creados** y funcionales.
- Layout con Sidebar (route group `(app)`): se implementará en el Dashboard (spec L2-screen-01). Si el Perfil se implementa después, será prerequisito. Si se implementa antes, el layout debe crearse aquí.

---

## 2. Arquitectura de Componentes

### 2.1 Perfil — Árbol de componentes

```
app/(app)/profile/page.tsx (Server Component)
│   → Obtiene perfil completo del usuario de Supabase
│   → Pasa datos como props a ProfileContent
│
└── ProfileContent (Client Component — gestiona todo el estado del formulario)
    ├── PageHeader (inline)
    │   ├── Título "Perfil"
    │   └── SaveButton (inline)
    │
    ├── ProfileHeader (presentacional)
    │   ├── Avatar (iniciales sobre gradient)
    │   ├── Nombre + Email
    │   └── Badges (FTP, Objetivo)
    │
    └── Tabs (shadcn/ui)
        ├── TabsTrigger ×3 (Datos, Zonas, Ajustes)
        │
        ├── [TabsContent "datos"]
        │   ├── BasicDataSection (inline)
        │   │   └── OnboardingField ×3 ♻️
        │   ├── TrainingDataSection (inline)
        │   │   └── OnboardingField ×3 ♻️
        │   └── GoalSection (inline)
        │       └── GoalCard ×4 ♻️
        │
        ├── [TabsContent "zonas"]
        │   ├── ZoneTable type="power"
        │   └── ZoneTable type="hr"
        │
        └── [TabsContent "ajustes"]
            ├── DevicesSection (inline, placeholder)
            └── NotificationsSection (inline)
                └── Switch ×3 (shadcn/ui)
```

### 2.2 Detalle por componente

#### ProfileContent

```typescript
// Ruta: apps/web/src/app/(app)/profile/profile-content.tsx
// Tipo: Client Component

interface ProfileContentProps {
  profile: {
    id: string;
    email: string;
    display_name: string;
    age: number;
    weight_kg: number;
    ftp: number | null;
    max_hr: number | null;
    rest_hr: number | null;
    goal: GoalType;
  };
}
```

- **Responsabilidad**: Gestiona todo el estado del formulario de perfil (dirty state, validación, submit). Contiene el ProfileHeader, Tabs y SaveButton.
- **Fuente de datos**: Props iniciales del Server Component. Estado local para ediciones.
- **Dependencias**: OnboardingField, GoalCard, ZoneTable, shadcn Tabs, shadcn Switch, `@/lib/supabase/client`, `@shared/schemas/user-profile`, `@shared/constants/goals`.
- **Decisiones**: Client Component porque gestiona formulario controlado, dirty state, y submit. Todo el estado del formulario vive aquí para poder calcular `isDirty` y enviar todos los cambios juntos.

**Estado interno**:
```typescript
const [formData, setFormData] = useState({
  display_name: profile.display_name,
  age: String(profile.age),
  weight_kg: String(profile.weight_kg),
  ftp: profile.ftp ? String(profile.ftp) : '',
  max_hr: profile.max_hr ? String(profile.max_hr) : '',
  rest_hr: profile.rest_hr ? String(profile.rest_hr) : '',
  goal: profile.goal,
});
const [isSaving, setIsSaving] = useState(false);
const [errors, setErrors] = useState<Record<string, string>>({});
```

#### ProfileHeader

```typescript
// Ruta: apps/web/src/app/(app)/profile/profile-header.tsx
// Tipo: Presentacional (hijo de Client, sin 'use client' propio)

interface ProfileHeaderProps {
  name: string;
  email: string;
  ftp: number | null;
  goal: GoalType;
}
```

- **Responsabilidad**: Muestra avatar, nombre, email y badges del perfil (ref: L1 §3.1 ProfileHeader).
- **Fuente de datos**: Props. Se actualiza reactivamente cuando `formData` cambia (lee los valores editados, no los originales).
- **Dependencias**: Constantes `GOALS` (para label del objetivo), `lucide-react` (User icon para avatar fallback).
- **Decisiones**: No necesita `'use client'` propio — funciona como hijo presentacional del Client Component padre.

**Lógica de iniciales del avatar**:
```typescript
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
```

#### ZoneTable

```typescript
// Ruta: apps/web/src/components/zone-table.tsx
// Tipo: Presentacional (hijo de Client)

interface ZoneTableProps {
  type: 'power' | 'hr';
  referenceValue: number | null;  // FTP para power, FCmax para HR
  label: string;                  // "Potencia" o "Frecuencia Cardíaca"
}
```

- **Responsabilidad**: Muestra tabla de zonas de entrenamiento con barras coloreadas (ref: L1 §3.4 ZoneTable).
- **Fuente de datos**: Props. Usa `calculateZones()` de `packages/shared` para calcular rangos.
- **Dependencias**: Constantes `POWER_ZONES`, `HR_ZONES`, función `calculateZones` de `packages/shared`.
- **Decisiones**: Componente reutilizable (se usa 2 veces: potencia y FC). Reactivo al cambio de `referenceValue` — cuando el usuario cambia FTP en tab "Datos" y navega a "Zonas", las zonas se recalculan sin guardar.

**Estado vacío**: Si `referenceValue` es null, mostrar mensaje:
- Power: "Introduce tu FTP en la pestaña Datos para ver las zonas de potencia."
- HR: "Introduce tu FC máxima en la pestaña Datos para ver las zonas de frecuencia cardíaca."

---

## 3. Modelo de Datos

### Query de carga

```typescript
// En app/(app)/profile/page.tsx (Server Component)
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();

const { data: profile, error } = await supabase
  .from('users')
  .select('id, email, display_name, age, weight_kg, ftp, max_hr, rest_hr, goal')
  .eq('id', user.id)
  .single();
```

### Operación de guardado

```typescript
// En ProfileContent (Client Component)
async function handleSave() {
  setIsSaving(true);
  setErrors({});

  // 1. Parsear y validar con Zod
  const parsed = onboardingSchema.safeParse({
    display_name: formData.display_name,
    age: parseInt(formData.age) || 0,
    weight_kg: parseFloat(formData.weight_kg) || 0,
    ftp: formData.ftp ? parseInt(formData.ftp) : null,
    max_hr: formData.max_hr ? parseInt(formData.max_hr) : null,
    rest_hr: formData.rest_hr ? parseInt(formData.rest_hr) : null,
    goal: formData.goal,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach(issue => {
      const field = issue.path[0];
      if (field) fieldErrors[String(field)] = issue.message;
    });
    setErrors(fieldErrors);
    setIsSaving(false);
    return;
  }

  // 2. Update en Supabase
  const supabase = createClient();
  const { error } = await supabase
    .from('users')
    .update({
      display_name: parsed.data.display_name,
      age: parsed.data.age,
      weight_kg: parsed.data.weight_kg,
      ftp: parsed.data.ftp ?? null,
      max_hr: parsed.data.max_hr ?? null,
      rest_hr: parsed.data.rest_hr ?? null,
      goal: parsed.data.goal,
    })
    .eq('id', profile.id);

  if (error) {
    setErrors({ _form: 'Error al guardar. Inténtalo de nuevo.' });
  } else {
    // Actualizar "original" para recalcular isDirty
    // router.refresh() para actualizar Server Component data
  }

  setIsSaving(false);
}
```

### Constantes de zonas (en `packages/shared`)

```typescript
// packages/shared/src/constants/zones.ts

export interface ZoneDefinition {
  zone: string;
  name: string;
  minPct: number;
  maxPct: number;
  color: string;
}

export const POWER_ZONES: readonly ZoneDefinition[] = [
  { zone: 'Z1', name: 'Recuperación',  minPct: 0,    maxPct: 0.56, color: '#94a3b8' },
  { zone: 'Z2', name: 'Resistencia',   minPct: 0.56, maxPct: 0.75, color: '#3b82f6' },
  { zone: 'Z3', name: 'Tempo',         minPct: 0.76, maxPct: 0.90, color: '#22c55e' },
  { zone: 'Z4', name: 'Umbral',        minPct: 0.91, maxPct: 1.05, color: '#f97316' },
  { zone: 'Z5', name: 'VO2máx',        minPct: 1.06, maxPct: 1.20, color: '#ef4444' },
  { zone: 'Z6', name: 'Anaeróbico',    minPct: 1.20, maxPct: Infinity, color: '#dc2626' },
] as const;

export const HR_ZONES: readonly ZoneDefinition[] = [
  { zone: 'Z1', name: 'Recuperación',  minPct: 0.50, maxPct: 0.60, color: '#94a3b8' },
  { zone: 'Z2', name: 'Resistencia',   minPct: 0.60, maxPct: 0.70, color: '#3b82f6' },
  { zone: 'Z3', name: 'Tempo',         minPct: 0.70, maxPct: 0.80, color: '#22c55e' },
  { zone: 'Z4', name: 'Umbral',        minPct: 0.80, maxPct: 0.90, color: '#f97316' },
  { zone: 'Z5', name: 'VO2máx',        minPct: 0.90, maxPct: 1.00, color: '#ef4444' },
] as const;

export interface CalculatedZone extends ZoneDefinition {
  min: number;
  max: number;
  label: string;
}

export function calculateZones(
  zones: readonly ZoneDefinition[],
  referenceValue: number,
  unit: string = 'W'
): CalculatedZone[] {
  return zones.map(z => {
    const min = Math.round(referenceValue * z.minPct);
    const max = z.maxPct === Infinity ? Infinity : Math.round(referenceValue * z.maxPct);
    const label = max === Infinity
      ? `>${min}${unit}`
      : `${min}-${max}${unit}`;
    return { ...z, min, max, label };
  });
}
```

---

## 4. Endpoints API

### Opción A: UPDATE directo a Supabase (recomendada para MVP)

**Justificación**: Igual que el onboarding escribe directamente a Supabase (ADR-005), la edición del perfil puede hacer lo mismo. RLS garantiza que el usuario solo puede actualizar su propio perfil. La validación se hace client-side con Zod (mismos constraints que la DB).

**Flujo**:
```
ProfileContent → Zod.safeParse() → supabase.from('users').update() → RLS check → DB
```

### Opción B: Endpoint Fastify (para fase posterior)

Si se decide centralizar la lógica de negocio en el backend:

```
PUT /api/v1/profile
```

- **Input**: Body validado con `onboardingSchema`
- **Auth**: JWT de Supabase (header `Authorization: Bearer ...`)
- **Lógica**: Validar con Zod → UPDATE en Supabase con service role key
- **Output**: `{ data: UserProfile }` o `{ error: string }`

**Decisión**: Usar Opción A (directo a Supabase) para el MVP. Se migrará a Opción B si se necesita lógica de negocio adicional (ej: recalcular planes IA al cambiar FTP).

---

## 5. Estructura de Archivos

### Archivos nuevos

```
packages/shared/src/constants/zones.ts                 ← Zonas de potencia y FC + función de cálculo

apps/web/src/app/(app)/profile/page.tsx                ← Server Component: obtiene perfil, renderiza ProfileContent
apps/web/src/app/(app)/profile/profile-content.tsx     ← Client Component: formulario completo con tabs
apps/web/src/app/(app)/profile/profile-header.tsx      ← Presentacional: avatar + nombre + badges

apps/web/src/components/zone-table.tsx                 ← Tabla de zonas de potencia/FC reutilizable
```

### Archivos a modificar

```
packages/shared/src/index.ts                           ← Añadir exports de zones.ts
```

### Dependencias con Dashboard

El Perfil comparte el layout `(app)/layout.tsx` con el Dashboard. Si el Dashboard se implementa primero, estos archivos ya existirán:
- `apps/web/src/app/(app)/layout.tsx`
- `apps/web/src/app/(app)/app-shell.tsx`
- `apps/web/src/components/sidebar.tsx`

Si el Perfil se implementa primero, estos archivos deben crearse aquí (ver L2-screen-01-dashboard.md §5).

---

## 6. ADRs (Decisiones Arquitectónicas)

### ADR-012: Un solo Client Component para todo el formulario del perfil

- **Contexto**: El perfil tiene 3 tabs con inputs, GoalCards, ZoneTables y toggles. Se podría dividir en múltiples Client Components (uno por tab) o usar un solo componente que gestione todo el estado.
- **Decisión**: Un solo `ProfileContent` Client Component que gestiona todo el estado del formulario.
- **Alternativas descartadas**:
  - Client Component por tab: Complicado compartir estado (ej: FTP cambiado en "Datos" debe reflejarse en "Zonas"). Requiere lifting state o Context.
  - Form library (React Hook Form): Overhead adicional para un formulario simple con pocos campos.
- **Consecuencias**:
  - (+) Estado centralizado, fácil calcular `isDirty`.
  - (+) Cambios en FTP se reflejan inmediatamente en Zonas (sin guardar).
  - (+) Un solo submit para todos los cambios.
  - (-) El componente puede crecer. Mitigar extrayendo secciones como componentes presentacionales sin `'use client'`.

### ADR-013: Reutilizar `onboardingSchema` para validación del perfil

- **Contexto**: El perfil tiene exactamente los mismos campos editables que el onboarding (display_name, age, weight_kg, ftp, max_hr, rest_hr, goal). Se podría crear un schema separado `profileUpdateSchema` o reutilizar `onboardingSchema`.
- **Decisión**: Reutilizar `onboardingSchema` de `packages/shared`.
- **Alternativas descartadas**:
  - Schema separado: Duplicación innecesaria, los constraints son idénticos.
  - Schema parcial (`.partial()`): No aplica porque los campos obligatorios son los mismos.
- **Consecuencias**:
  - (+) DRY: una sola fuente de verdad para validación.
  - (+) Cambios en constraints se aplican automáticamente en onboarding y perfil.
  - (-) Si en el futuro el perfil tiene campos diferentes al onboarding, habrá que separar. Poco probable.

### ADR-014: Zonas calculadas client-side (reactivas)

- **Contexto**: Las zonas de potencia/FC dependen del FTP y FCmax del usuario. Se pueden calcular en el servidor (una vez al cargar) o en el cliente (reactivamente al editar).
- **Decisión**: Cálculo client-side reactivo.
- **Alternativas descartadas**:
  - Server-side: No permite previsualizar zonas con un FTP editado pero no guardado.
  - Almacenar zonas en DB: Redundante — son una función pura de FTP/FCmax.
- **Consecuencias**:
  - (+) El usuario puede cambiar FTP y ver instantáneamente las zonas recalculadas.
  - (+) Sin request adicional al servidor.
  - (+) Función pura testable.
  - (-) El cálculo se duplica si también se necesita server-side (ej: para análisis IA). Se reutiliza la misma función de `packages/shared`.

### ADR-015: Update directo a Supabase (sin API Fastify)

- **Contexto**: Igual que ADR-005 para el onboarding. El PRD define `PUT /api/v1/profile` pero aún no hay backend Fastify.
- **Decisión**: UPDATE directo desde el cliente usando el SDK de Supabase con RLS.
- **Alternativas descartadas**:
  - Server Action de Next.js: Viable pero añade complejidad cuando el SDK de Supabase ya maneja todo.
  - Esperar a Fastify: Bloquearía la implementación del Perfil.
- **Consecuencias**:
  - (+) Menos código, consistente con el patrón del onboarding.
  - (+) RLS garantiza seguridad.
  - (-) Si se necesita lógica de negocio al guardar (ej: invalidar caché de recomendación IA al cambiar goal/FTP), habrá que migrar a API.

---

## 7. Dependencias y Prerequisitos

### Paquetes npm a instalar

| Paquete | Workspace | Justificación |
|---------|-----------|---------------|
| Ninguno nuevo | — | — |

### Componentes shadcn/ui a instalar

| Componente | Uso |
|------------|-----|
| `tabs` | TabsList, TabsTrigger, TabsContent para las 3 secciones del perfil |
| `switch` | Toggles de notificaciones en tab "Ajustes" |

### Paquetes ya instalados

| Paquete | Uso |
|---------|-----|
| `lucide-react` | Iconos: User, BarChart3, Settings, Save, Check |
| `@supabase/ssr` | Query y update del perfil |
| `zod` | Validación con `onboardingSchema` |

### Componentes ya creados (reutilizables)

| Componente | Fuente | Uso en Perfil |
|-----------|--------|---------------|
| `OnboardingField` | `apps/web/src/components/onboarding-field.tsx` | 6 campos de datos (nombre, edad, peso, FTP, FC máx, FC rep) |
| `GoalCard` | `apps/web/src/components/goal-card.tsx` | 4 cards de selección de objetivo |
| `ThemeToggle` | `apps/web/src/components/theme-toggle.tsx` | En Sidebar (si existe) |

---

## 8. Riesgos y Consideraciones

### Riesgo 1: Dirty state falso positivo con tipos numéricos

**Descripción**: El formulario usa strings para los inputs (`"195"` para FTP), pero el perfil del servidor tiene numbers (`195`). La comparación `"195" !== 195` siempre sería `true`, marcando el formulario como dirty sin cambios reales.

**Mitigación**: Convertir los valores originales a strings al inicializar `formData`:
```typescript
const initialFormData = {
  ftp: profile.ftp ? String(profile.ftp) : '',
  // ...
};
```
Y comparar strings con strings para el cálculo de `isDirty`.

### Riesgo 2: Pérdida de cambios al navegar

**Descripción**: Si el usuario edita datos y navega a otra página sin guardar, los cambios se pierden.

**Mitigación**:
- Opción simple (MVP): No interceptar la navegación. El botón "Guardar" visible y habilitado cuando hay cambios es suficiente indicación.
- Opción mejorada (futuro): Usar `beforeunload` event o `useRouter` interceptor para confirmar salida con cambios sin guardar.

### Riesgo 3: Concurrencia en edición

**Descripción**: Si el usuario tiene dos tabs del navegador abiertas en `/profile` y guarda en ambas, la segunda escritura sobrescribe la primera.

**Mitigación**: Para el MVP, esto es aceptable (single user, unlikely scenario). En el futuro, se podría usar `updated_at` como optimistic locking check.

### Riesgo 4: Tab "Ajustes" sin backend

**Descripción**: Los toggles de notificaciones no tienen infraestructura backend. La tabla `users` no tiene campos para preferencias de notificaciones.

**Mitigación**: Dos opciones:
1. **MVP**: Los toggles son puramente visuales (no persisten). Mostrar un sutil "próximamente" junto a la sección.
2. **Con migración**: Añadir campo `preferences JSONB` a la tabla `users` para almacenar preferencias como `{ notifications: { alerts: false, overload: true, weekly: false } }`.

Se recomienda la opción 2 si se incluye en el scope, creando una migration 003.

### Consideraciones de accesibilidad

- Tabs: shadcn/ui Tabs ya incluye `role="tablist"`, `role="tab"`, `role="tabpanel"` y navegación por teclado.
- Toggles: shadcn/ui Switch incluye `role="switch"` y `aria-checked`.
- OnboardingField: ya tiene labels visibles asociados al input.
- GoalCards: usar `role="radiogroup"` y `role="radio"` con `aria-checked` para navegación por teclado.
- ZoneTable: usar `<table>` semántico con `<caption>` y `scope="row"`.
- SaveButton: incluir `aria-label="Guardar cambios"` y feedback de estado (loading/success/error).
