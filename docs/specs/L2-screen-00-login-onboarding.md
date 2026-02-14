# L2 — Diseño Técnico: Login y Onboarding

> **Input**: `docs/specs/L1-screen-00-login-onboarding.md`
> **Requisito PRD**: F01 — Autenticación y onboarding (P0)
> **Fecha**: 2026-02-14

---

## 1. Resumen del Alcance

### Qué se construye

Se rediseñan las pantallas de Login y Onboarding para que sigan fielmente el mockup JSX (`docs/design/screen-00-login-onboarding.jsx`). Esto implica:

1. **Login** (`/login`): Pantalla con branding hero a la izquierda, card de login a la derecha (Google OAuth exclusivamente), glows decorativos, toggle de tema.
2. **Onboarding** (`/onboarding`): Wizard de 4 pasos (datos básicos → rendimiento → objetivo → resumen), guarda datos en tabla `users` y redirige al dashboard.
3. **Infraestructura de tema**: Sistema dark/light con `next-themes` + CSS custom properties.
4. **Tabla `users`**: Creación en Supabase con RLS, schema Zod compartido.
5. **Middleware actualizado**: Redirección a `/onboarding` si el usuario autenticado no tiene perfil completo.

### Fuera de alcance

- Dashboard y pantallas posteriores (se crearán en issues separadas).
- Auth con email/password: **no se implementa** (ni UI ni lógica). El login es exclusivamente con Google OAuth. El formulario email/password del mockup se descarta. Se podrá añadir como feature futura en fases posteriores si se considera necesario (ref: PRD §3.5 "Método secundario: Email + password como fallback").
- Olvidé mi contraseña.
- i18n, accesibilidad avanzada (ARIA roles se añaden en pulido).

### Prerequisitos técnicos

- Auth con Google OAuth: **ya implementado** (`apps/web/src/app/login/login-button.tsx`, callback en `/auth/callback`).
- Supabase configurado con variables de entorno funcionales.

---

## 2. Arquitectura de Componentes

### 2.1 Login — Árbol de componentes

```
app/(auth)/login/page.tsx (Server Component)
│   → Verifica auth, si autenticado redirect a /
│
├── GlowEffects (CSS puro, inline en page)
│
└── LoginContent (Client Component — contiene ThemeToggle + LoginCard)
    ├── ThemeToggle (Client) ♻️
    ├── HeroBranding (Server-like, sin estado)
    │   ├── Logo
    │   ├── Headline
    │   ├── Subtitle
    │   └── FeatureList (hidden en mobile)
    └── LoginCard (Client)
        ├── GoogleLoginButton (Client) ♻️ — ya existe, se rediseña
        └── TextoLegal (inline)
```

### 2.2 Onboarding — Árbol de componentes

```
app/(auth)/onboarding/page.tsx (Server Component)
│   → Verifica auth + existencia en tabla users
│   → Si no auth → /login. Si ya tiene perfil → /
│
└── OnboardingWizard (Client Component — gestiona wizard state)
    ├── ThemeToggle (Client) ♻️
    ├── Logo mini (inline)
    ├── StepIndicator (Client) ♻️
    ├── StepHeader (presentacional, hijo de Client)
    │
    ├── [Step 0] — inline
    │   └── OnboardingField ×3 ♻️
    │
    ├── [Step 1] — inline
    │   ├── OnboardingField ×3 ♻️
    │   └── InfoBox ♻️
    │
    ├── [Step 2] — inline
    │   └── GoalCard ×4 ♻️
    │
    ├── [Step 3] — inline
    │   ├── ProfileSummary
    │   └── AICoachWelcome
    │
    └── WizardNavigation (inline en OnboardingWizard)
```

### 2.3 Detalle por componente

#### ThemeToggle

```typescript
// Ruta: apps/web/src/components/theme-toggle.tsx
// Tipo: Client Component

interface ThemeToggleProps {
  showLabel?: boolean; // true en Login, false en Onboarding
}
```

- **Responsabilidad**: Alterna entre dark/light mode usando `next-themes`.
- **Fuente de datos**: `useTheme()` de `next-themes`.
- **Dependencias**: `next-themes`, `lucide-react` (Sun, Moon).
- **Decisiones**: Client Component porque usa `useTheme()`. Reutilizable en toda la app (ref: L1 §8).

#### ThemeProvider

```typescript
// Ruta: apps/web/src/components/theme-provider.tsx
// Tipo: Client Component (wrapper de next-themes)

interface ThemeProviderProps {
  children: React.ReactNode;
}
```

- **Responsabilidad**: Envuelve la app con `next-themes` ThemeProvider, configura `attribute="class"`, `defaultTheme="dark"`.
- **Fuente de datos**: N/A (proveedor de contexto).
- **Dependencias**: `next-themes`.
- **Decisiones**: Componente separado para encapsular la directiva `'use client'` sin contaminar el layout Server Component (ref: ADR-001).

#### LoginContent

```typescript
// Ruta: apps/web/src/app/(auth)/login/login-content.tsx
// Tipo: Client Component

// Sin props — componente de composición
```

- **Responsabilidad**: Compone la UI del login (branding + card). Es Client Component porque necesita leer el tema para los glow effects y contiene GoogleLoginButton que ya es Client.
- **Fuente de datos**: N/A.
- **Dependencias**: ThemeToggle, GoogleLoginButton, lucide-react.
- **Decisiones**: Separado de `page.tsx` para mantener la page como Server Component (verifica auth).

#### GoogleLoginButton

```typescript
// Ruta: apps/web/src/app/(auth)/login/login-button.tsx (ya existe, se rediseña)
// Tipo: Client Component

// Sin cambio de interface — ya existe con onClick para OAuth
```

- **Responsabilidad**: Botón de login con Google (rediseño visual al estilo del mockup).
- **Fuente de datos**: `createClient()` de `@/lib/supabase/client`.
- **Dependencias**: `@supabase/ssr`.
- **Decisiones**: Mantener la lógica existente, solo rediseñar visualmente. Mover desde `login/login-button.tsx` sin cambiar el nombre de archivo.

#### StepIndicator

```typescript
// Ruta: apps/web/src/components/step-indicator.tsx
// Tipo: Client Component

interface StepIndicatorProps {
  current: number;
  total: number;
}
```

- **Responsabilidad**: Muestra dots de progreso del wizard (ref: L1 §3.2 StepIndicator).
- **Fuente de datos**: Props del wizard padre.
- **Dependencias**: Ninguna.
- **Decisiones**: Client Component porque los dots se animan al cambiar `current`.

#### OnboardingField

```typescript
// Ruta: apps/web/src/components/onboarding-field.tsx
// Tipo: Client Component

interface OnboardingFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  unit?: string;
  hint?: string;
  type?: string; // 'text' | 'number' — default 'text'
}
```

- **Responsabilidad**: Input con label, unidad y hint (ref: L1 §3.2 OnboardingField).
- **Fuente de datos**: Props controladas.
- **Dependencias**: Ninguna (custom, no usa shadcn Input).
- **Decisiones**: Client Component por `value`/`onChange`. Componente custom porque shadcn `Input` no incluye label+unit+hint integrados; crear wrapper custom es más limpio (ref: ADR-003).

#### GoalCard

```typescript
// Ruta: apps/web/src/components/goal-card.tsx
// Tipo: Client Component

interface GoalCardProps {
  icon: string;
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
}
```

- **Responsabilidad**: Card seleccionable para elegir objetivo de entrenamiento (ref: L1 §3.2 GoalCard).
- **Fuente de datos**: Props del wizard padre.
- **Dependencias**: `lucide-react` (Check).
- **Decisiones**: Client Component por `onClick` y hover interactivo.

#### InfoBox

```typescript
// Ruta: apps/web/src/components/info-box.tsx
// Tipo: Server Component (acepta children)

interface InfoBoxProps {
  children: React.ReactNode;
}
```

- **Responsabilidad**: Caja informativa con estilo azul sutil (ref: L1 §3.2 InfoBox).
- **Fuente de datos**: Props (children).
- **Dependencias**: Ninguna.
- **Decisiones**: Server Component — solo renderiza contenido estático con estilos. Funcionará como hijo de Client Component sin problema.

#### OnboardingWizard

```typescript
// Ruta: apps/web/src/app/(auth)/onboarding/onboarding-wizard.tsx
// Tipo: Client Component

interface OnboardingWizardProps {
  userId: string;
  userEmail: string;
}
```

- **Responsabilidad**: Gestiona el wizard de 4 pasos, mantiene estado del form, envía datos a Supabase al completar.
- **Fuente de datos**: Estado local (`useState`). Props recibidas del Server Component page.
- **Dependencias**: StepIndicator, OnboardingField, GoalCard, InfoBox, ProfileSummary, AICoachWelcome, `@/lib/supabase/client`, `lucide-react`.
- **Decisiones**: Client Component porque gestiona todo el estado del wizard. Recibe `userId` y `userEmail` del Server Component padre para evitar llamar `getUser()` desde el cliente (ref: ADR-002).

#### ProfileSummary

```typescript
// Ruta: apps/web/src/app/(auth)/onboarding/profile-summary.tsx
// Tipo: Presentacional (hijo de Client, sin 'use client' propio)

interface ProfileSummaryProps {
  data: {
    name: string;
    age: string;
    weight: string;
    ftp: string;
    maxHR: string;
    restHR: string;
    goal: string;
  };
}
```

- **Responsabilidad**: Muestra resumen del perfil en el paso 3 del onboarding (ref: L1 §3.2 ProfileSummary).
- **Fuente de datos**: Props del wizard.
- **Dependencias**: Constantes de goals.

#### AICoachWelcome

```typescript
// Ruta: apps/web/src/app/(auth)/onboarding/ai-coach-welcome.tsx
// Tipo: Presentacional (hijo de Client, sin 'use client' propio)

interface AICoachWelcomeProps {
  userName?: string;
}
```

- **Responsabilidad**: Mensaje de bienvenida del coach IA en paso 3 (ref: L1 §3.2 AICoachWelcome).
- **Fuente de datos**: Props.
- **Dependencias**: `lucide-react` (Zap).

---

## 3. Modelo de Datos

### Tabla `users`

```sql
-- Tabla: users (esquema public)
-- Descripción: Perfil del ciclista. Se crea al completar el onboarding.
-- Referencia: PRD §3.3 (tabla users), L1 §5 (contrato de datos)

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age > 0 AND age < 120),
  weight_kg NUMERIC(5,1) NOT NULL CHECK (weight_kg > 0 AND weight_kg < 300),
  ftp INTEGER CHECK (ftp > 0 AND ftp < 1000),
  max_hr INTEGER CHECK (max_hr > 0 AND max_hr < 250),
  rest_hr INTEGER CHECK (rest_hr > 0 AND rest_hr < 200),
  goal TEXT NOT NULL DEFAULT 'performance'
    CHECK (goal IN ('performance', 'health', 'weight_loss', 'recovery')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Comentario
COMMENT ON TABLE public.users IS 'Perfil del ciclista, creado en el onboarding';

-- RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

**Notas de diseño**:
- `id` usa el UUID de `auth.users` directamente (no auto-generado) para mantener la relación 1:1.
- `ftp`, `max_hr`, `rest_hr` son nullable — el onboarding los marca como opcionales ("Se estimará").
- `goal` es TEXT con CHECK en lugar de un tipo ENUM de PostgreSQL para simplificar migraciones (ref: ADR-004).
- Constraints de rango en `age`, `weight_kg`, `ftp`, `max_hr`, `rest_hr` para validación a nivel de DB.

### Schema Zod (en `packages/shared`)

```typescript
// packages/shared/src/schemas/user-profile.ts
import { z } from "zod";

export const goalEnum = z.enum([
  "performance",
  "health",
  "weight_loss",
  "recovery",
]);
export type GoalType = z.infer<typeof goalEnum>;

export const onboardingSchema = z.object({
  display_name: z.string().min(1, "El nombre es obligatorio").max(100),
  age: z.number().int().positive().max(119),
  weight_kg: z.number().positive().max(299.9),
  ftp: z.number().int().positive().max(999).nullable().optional(),
  max_hr: z.number().int().positive().max(249).nullable().optional(),
  rest_hr: z.number().int().positive().max(199).nullable().optional(),
  goal: goalEnum,
});
export type OnboardingData = z.infer<typeof onboardingSchema>;

export const userProfileSchema = onboardingSchema.extend({
  id: z.string().uuid(),
  email: z.string().email(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type UserProfile = z.infer<typeof userProfileSchema>;
```

### Constantes compartidas

```typescript
// packages/shared/src/constants/goals.ts

export const GOALS = [
  {
    key: "performance" as const,
    icon: "🎯",
    label: "Mejorar rendimiento",
    description: "Subir FTP, más potencia en competición o marchas",
  },
  {
    key: "health" as const,
    icon: "💚",
    label: "Mantener salud",
    description: "Entrenar de forma sostenible y equilibrada",
  },
  {
    key: "weight_loss" as const,
    icon: "⚖️",
    label: "Perder peso",
    description: "Quemar grasa manteniendo masa muscular",
  },
  {
    key: "recovery" as const,
    icon: "🩹",
    label: "Recuperación",
    description: "Volver de una lesión o pausa prolongada",
  },
] as const;

export const ONBOARDING_STEPS = [
  {
    title: "¿Quién eres?",
    subtitle: "Datos básicos para personalizar tu experiencia",
    iconName: "User" as const,
  },
  {
    title: "Tu rendimiento",
    subtitle: "Nos ayuda a calcular tus zonas de entrenamiento",
    iconName: "Heart" as const,
  },
  {
    title: "Tu objetivo",
    subtitle: "¿Qué quieres conseguir con Cycling Companion?",
    iconName: "Target" as const,
  },
  {
    title: "¡Listo!",
    subtitle: "Tu entrenador IA está preparado",
    iconName: "Check" as const,
  },
] as const;
```

---

## 4. Endpoints API

**No se requieren endpoints API nuevos** para esta pantalla.

**Justificación**: El onboarding escribe directamente a la tabla `users` de Supabase desde el cliente usando el SDK de Supabase (INSERT con RLS). No necesita pasar por Fastify. El PRD define endpoints de profile (`GET/PUT /api/v1/profile`) para F08, pero no son necesarios para el onboarding.

**Flujo de datos**:
1. El Server Component `page.tsx` obtiene el usuario con `supabase.auth.getUser()`.
2. Pasa `userId` y `userEmail` al Client Component `OnboardingWizard`.
3. Al completar, el wizard usa `createClient()` (browser) para hacer `INSERT INTO users`.
4. RLS garantiza que solo puede insertar su propio perfil (`auth.uid() = id`).

```typescript
// Pseudocódigo del submit en OnboardingWizard
const supabase = createClient();
const { error } = await supabase.from("users").insert({
  id: userId,
  email: userEmail,
  display_name: parsed.display_name,
  age: parsed.age,
  weight_kg: parsed.weight_kg,
  ftp: parsed.ftp || null,
  max_hr: parsed.max_hr || null,
  rest_hr: parsed.rest_hr || null,
  goal: parsed.goal,
});
```

---

## 5. Estructura de Archivos

### Archivos nuevos

```
packages/shared/src/schemas/user-profile.ts       ← Schema Zod para onboarding + user profile
packages/shared/src/constants/goals.ts             ← Constantes de goals y pasos del onboarding
packages/shared/src/index.ts                       ← Actualizar: re-exportar schemas y constantes

apps/web/src/components/theme-provider.tsx          ← Wrapper de next-themes para el layout
apps/web/src/components/theme-toggle.tsx            ← Botón dark/light reutilizable
apps/web/src/components/step-indicator.tsx           ← Dots de progreso del wizard
apps/web/src/components/onboarding-field.tsx         ← Input con label, unit, hint
apps/web/src/components/goal-card.tsx                ← Card seleccionable de objetivo
apps/web/src/components/info-box.tsx                 ← Caja informativa azul sutil

apps/web/src/app/(auth)/layout.tsx                  ← Layout del route group auth (mínimo, sin sidebar)
apps/web/src/app/(auth)/login/page.tsx               ← Rediseño de la page existente
apps/web/src/app/(auth)/login/login-content.tsx      ← Client Component con la UI del login
apps/web/src/app/(auth)/login/login-button.tsx       ← Mover y rediseñar GoogleLoginButton
apps/web/src/app/(auth)/onboarding/page.tsx          ← Server Component: auth check + render wizard
apps/web/src/app/(auth)/onboarding/onboarding-wizard.tsx ← Client Component: wizard de 4 pasos
apps/web/src/app/(auth)/onboarding/profile-summary.tsx   ← Resumen del perfil (paso 3)
apps/web/src/app/(auth)/onboarding/ai-coach-welcome.tsx  ← Mensaje de bienvenida IA (paso 3)
```

### Archivos a modificar

```
apps/web/src/app/layout.tsx                         ← Añadir DM Sans font + ThemeProvider + dark class
apps/web/src/app/globals.css                        ← Añadir CSS custom properties para tokens complejos
apps/web/src/lib/supabase/middleware.ts              ← Añadir lógica de redirect a /onboarding
apps/web/tailwind.config.ts                         ← Activar darkMode: 'class'
packages/shared/package.json                        ← Añadir dependencia de zod
```

### Archivos a eliminar/mover

```
apps/web/src/app/login/page.tsx            → Mover a apps/web/src/app/(auth)/login/page.tsx
apps/web/src/app/login/login-button.tsx    → Mover a apps/web/src/app/(auth)/login/login-button.tsx
apps/web/src/app/page.tsx                  ← Simplificar (ya no muestra info debug, solo redirect)
apps/web/src/app/logout-button.tsx         ← Mantener (se usará en dashboard futuro)
```

---

## 6. ADRs (Decisiones Arquitectónicas)

### ADR-001: next-themes para gestión de tema dark/light

- **Contexto**: El mockup usa un React Context manual (`Ctx`/`useT()`) para el tema. En Next.js con App Router necesitamos una solución que funcione con Server Components y evite flash de tema incorrecto (FOUC).
- **Decisión**: Usar `next-themes` con `attribute="class"` y `defaultTheme="dark"`.
- **Alternativas descartadas**:
  - Context manual: No funciona bien con Server Components, causa FOUC.
  - CSS `prefers-color-scheme` solo: No permite toggle manual, que el mockup incluye explícitamente.
- **Consecuencias**:
  - (+) Integración nativa con Next.js App Router, sin FOUC.
  - (+) Funciona con clases `dark:` de Tailwind.
  - (+) Persistencia automática en localStorage.
  - (-) Añade una dependencia (~2KB).

### ADR-002: Pasar userId/email desde Server Component al wizard

- **Contexto**: El wizard necesita `userId` y `email` para el INSERT en Supabase. Podría obtenerlos llamando `supabase.auth.getUser()` desde el cliente, o recibirlos como props del Server Component.
- **Decisión**: El Server Component `page.tsx` obtiene el usuario y pasa `userId` + `userEmail` como props al Client Component `OnboardingWizard`.
- **Alternativas descartadas**:
  - Llamar `getUser()` en el cliente: Requiere request extra, potencial race condition con middleware.
- **Consecuencias**:
  - (+) Un solo request de auth (en el server), más eficiente.
  - (+) El Server Component ya necesita verificar auth para el redirect, así que no es un request extra.
  - (-) Los props deben pasarse explícitamente.

### ADR-003: Componentes custom vs shadcn/ui para formularios

- **Contexto**: shadcn/ui tiene `Input`, `Button`, `Card`. El mockup requiere inputs con label, unit y hint integrados, y cards seleccionables con estados custom.
- **Decisión**: Crear `OnboardingField` y `GoalCard` como componentes custom. Instalar shadcn/ui pero usarlo solo para `Button` (base de variantes) y como referencia de patrones.
- **Alternativas descartadas**:
  - Componer shadcn `Input` + `Label` + custom layout: Más boilerplate, menos cohesivo.
  - Todo shadcn: Los componentes no encajan bien con los tokens del design system sin mucha personalización.
- **Consecuencias**:
  - (+) Componentes cohesivos que encajan exactamente con el design system.
  - (+) Menos capas de abstracción.
  - (-) No se aprovecha la base de shadcn para estos componentes específicos.

### ADR-004: TEXT con CHECK vs ENUM de PostgreSQL para goal

- **Contexto**: El campo `goal` tiene 4 valores posibles. PostgreSQL ofrece tipos ENUM nativos, pero también se puede usar TEXT con CHECK constraint.
- **Decisión**: TEXT con CHECK constraint.
- **Alternativas descartadas**:
  - ENUM de PostgreSQL: Difícil de alterar (ADD/REMOVE values requieren migración compleja), y Supabase no facilita su gestión.
- **Consecuencias**:
  - (+) Fácil de modificar (ALTER TABLE, cambiar CHECK).
  - (+) Compatible con Zod enum sin casting.
  - (-) Menos "type-safe" a nivel de DB, pero el CHECK compensa.

### ADR-005: Escribir directamente a Supabase desde el cliente (sin API Fastify)

- **Contexto**: El onboarding necesita insertar un registro en la tabla `users`. Podría hacerse vía el SDK de Supabase directamente o a través de un endpoint en la API Fastify.
- **Decisión**: INSERT directo desde el cliente usando el SDK de Supabase con RLS.
- **Alternativas descartadas**:
  - Endpoint Fastify `POST /api/v1/profile`: Añade complejidad innecesaria. El PRD define este endpoint para F08 (edición posterior), no para el onboarding inicial.
  - Server Action de Next.js: Viable, pero el SDK de Supabase en el cliente ya maneja auth y RLS correctamente.
- **Consecuencias**:
  - (+) Menos código, menos latencia, sin duplicación de validación.
  - (+) RLS garantiza seguridad sin lógica custom en API.
  - (-) La validación Zod debe ejecutarse en el cliente (pero igualmente es necesaria para UX).

### ADR-006: Route groups (auth) para Login y Onboarding

- **Contexto**: Login y Onboarding comparten el hecho de ser pantallas sin sidebar ni navigation, a diferencia del dashboard. Next.js App Router soporta route groups para layouts diferenciados.
- **Decisión**: Mover login a `app/(auth)/login/` y crear onboarding en `app/(auth)/onboarding/`. El route group `(auth)` tiene un layout mínimo (sin sidebar). El dashboard futuro irá en `app/(app)/`.
- **Alternativas descartadas**:
  - Mantener login en la raíz (`app/login/`): Funciona pero no escala cuando se añada el layout con sidebar del dashboard.
- **Consecuencias**:
  - (+) Separación clara entre pantallas auth (sin chrome) y app (con sidebar).
  - (+) Prepara la estructura para el dashboard futuro (ref: DESIGN-SYSTEM.md §6.3).
  - (-) Requiere mover los archivos existentes de login.

---

## 7. Dependencias y Prerequisitos

### Paquetes npm a instalar

| Paquete | Workspace | Justificación |
|---------|-----------|---------------|
| `next-themes` | `apps/web` | Gestión dark/light con Next.js App Router (ADR-001) |
| `lucide-react` | `apps/web` | Iconos: Zap, Sun, Moon, ChevronRight, ChevronLeft, User, Heart, Target, Check, Activity |
| `zod` | `packages/shared` | Schemas de validación compartidos |

### shadcn/ui

Inicializar shadcn/ui en `apps/web`:
```bash
npx shadcn@latest init
```

Componentes a instalar:
```bash
npx shadcn@latest add button
```

**Nota**: `input` y `card` de shadcn no se instalan en esta fase — los componentes custom (`OnboardingField`, `GoalCard`) son más apropiados para el design system (ref: ADR-003). Se instalarán cuando se necesiten para otras pantallas.

### Tablas Supabase

- Crear tabla `public.users` con RLS (ver §3).
- Crear función trigger `handle_updated_at` (si no existe).

### Features previas completadas

- ✅ Auth con Google OAuth (funciona en `apps/web/src/app/login/`).
- ✅ Middleware de sesión (`apps/web/src/lib/supabase/middleware.ts`).
- ✅ Callback OAuth (`apps/web/src/app/auth/callback/route.ts`).

---

## 8. Riesgos y Consideraciones

### Riesgo 1: Middleware — consulta a DB en cada request

**Descripción**: Para redirigir a `/onboarding` necesitamos verificar si el usuario tiene perfil en la tabla `users`. Hacer un SELECT en cada request del middleware añade latencia.

**Mitigación**: Hacer la verificación solo en el Server Component de `/` y `/onboarding`, no en el middleware. El middleware solo verifica autenticación (como ahora). La redirección se hace en las pages individuales:
- `page.tsx` (home): Si auth OK pero no tiene perfil → redirect a `/onboarding`.
- `onboarding/page.tsx`: Si auth OK y ya tiene perfil → redirect a `/`.

Esto evita el overhead en el middleware manteniendo la protección correcta.

### Riesgo 2: Race condition en onboarding

**Descripción**: Si el usuario abre dos tabs, podría intentar insertar dos veces en `users`.

**Mitigación**: El `id` es PK referenciando `auth.users(id)`, así que un segundo INSERT dará error de unicidad. El wizard debe manejar este error mostrando un mensaje y redirigiendo al dashboard.

### Riesgo 3: Migración de estructura de archivos

**Descripción**: Mover `/login` a `/(auth)/login` puede romper rutas o imports.

**Mitigación**: Verificar que las rutas de redirect en middleware, callback, y links internos se actualizan. El path URL no cambia (route groups no afectan la URL), pero los imports internos sí.

### Riesgo 4: FOUC de tema

**Descripción**: Al cargar la página, podría flashear el tema incorrecto antes de que `next-themes` aplique la clase.

**Mitigación**: `next-themes` con `attribute="class"` inyecta un script inline en `<head>` que aplica la clase antes del primer render. Configurar `suppressHydrationWarning` en `<html>`.

### Consideraciones de accesibilidad

- Los inputs del onboarding deben tener `aria-label` o labels visibles asociados (ya incluidos en el diseño).
- Los GoalCards deben tener `role="radio"` y `aria-checked` para navegación por teclado.
- StepIndicator debe tener `aria-label="Paso X de Y"`.
- Estas mejoras se implementarán pero no son bloqueantes para la primera iteración.
