# L1 — Spec Funcional: Login y Onboarding

> **Fuente**: `docs/design/screen-00-login-onboarding.jsx`
> **Requisito PRD**: F01 — Autenticación y onboarding (P0)
> **Fecha**: 2026-02-14

---

## 1. Resumen de la Pantalla

El archivo mockup contiene **tres pantallas** que componen el flujo de autenticación y configuración inicial:

| Pantalla | Componente JSX | Propósito |
|----------|---------------|-----------|
| **Login** | `LoginScreen` | Punto de entrada. El usuario se autentica con Google OAuth. |
| **Onboarding** | `OnboardingScreen` | Wizard de 4 pasos donde el usuario nuevo configura su perfil (datos básicos, rendimiento, objetivo). |
| **Completado** | Inline en `AuthFlow` | Pantalla de confirmación transitoria antes de redirigir al dashboard. |

**Requisito PRD asociado**: F01 — El usuario se registra/logea con Google y completa un onboarding de 3-4 pasos. Los datos se guardan en la tabla `users`. Si ya existe, va directo al dashboard.

---

## 2. Ruta y Navegación

### Rutas propuestas

| Pantalla | Ruta | Route Group |
|----------|------|-------------|
| Login | `/login` | `(auth)` |
| Onboarding | `/onboarding` | `(auth)` |
| Completado | No tiene ruta propia — es estado transitorio en `/onboarding` | — |

### Flujo de navegación

```
Usuario no autenticado → /login
                            │
                    [Clic "Continuar con Google"]
                            │
                    Supabase OAuth → /auth/callback
                            │
                ┌───────────┴───────────┐
                │                       │
        Usuario nuevo           Usuario existente
                │                       │
          /onboarding                   /
        (wizard 4 pasos)          (dashboard)
                │
        [Completa wizard]
                │
        Pantalla "¡Listo!"
                │
          / (dashboard)
```

### Condiciones de acceso

| Ruta | Auth requerida | Condición adicional |
|------|---------------|---------------------|
| `/login` | No | Si ya autenticado → redirect a `/` |
| `/onboarding` | Sí | Si ya completó onboarding → redirect a `/` |
| `/` (dashboard) | Sí | Si no completó onboarding → redirect a `/onboarding` |

**Nota**: La lógica de redirección a `/onboarding` requiere un campo en la tabla `users` (o su ausencia) para saber si el usuario ya completó el onboarding. Actualmente el middleware (`apps/web/src/lib/supabase/middleware.ts`) solo verifica autenticación, no estado de onboarding.

---

## 3. Componentes Identificados

### 3.1 LoginScreen

#### ThemeToggle

| Campo | Valor |
|-------|-------|
| **Nombre** | `ThemeToggle` |
| **Tipo** | Client Component — necesita evento `onClick` y acceso al estado del tema |
| **Props** | `theme: 'dark' \| 'light'` (obligatoria), `onToggle: () => void` (obligatoria) |
| **Estados** | Default: muestra icono `Sun` + texto "Claro" (en dark) o icono `Moon` + texto "Oscuro" (en light) |
| **Tokens** | Fondo: `inBg`, Borde: `inB`, Texto: `t2` |
| **Responsive** | Sin diferencias mobile/desktop |
| **Contenido** | Icono Sun/Moon (14px) + texto "Claro"/"Oscuro" |
| **Reutilizable** | Sí — aparece también en OnboardingScreen (sin texto) |

#### HeroBranding

| Campo | Valor |
|-------|-------|
| **Nombre** | `HeroBranding` |
| **Tipo** | Server Component — solo renderiza contenido estático |
| **Props** | Ninguna |
| **Estados** | Default único |
| **Tokens** | Logo: gradient `#f97316 → #ea580c`, shadow `rgba(249,115,22,0.3)`. Título: `t1`. Subtítulo: `t2`. |
| **Responsive** | Desktop: `text-align: left`. Mobile: `text-align: center`. Feature list solo visible en desktop. |
| **Contenido** | Logo (Zap icon 26px, contenedor 48x48, borderRadius 14), nombre "Cycling Companion" (24px, weight 700), headline "Tu entrenador IA / que entiende tus datos" (desktop 40px, mobile 28px), subtítulo (desktop 16px, mobile 14px), 3 features con emoji |

**Detalle de features (solo desktop)**:
| Emoji | Texto |
|-------|-------|
| 📊 | Análisis inteligente de tus sesiones |
| 🗓️ | Planificación semanal adaptada a ti |
| 🧠 | IA que te explica qué hacer y por qué |

#### LoginCard

| Campo | Valor |
|-------|-------|
| **Nombre** | `LoginCard` |
| **Tipo** | Client Component — contiene botones con `onClick`, inputs con estado |
| **Props** | `onLogin: () => void` (obligatoria) |
| **Estados** | Default único (no hay validación visual de formulario en el mockup) |
| **Tokens** | Fondo: `card`. Borde: `cardB`. Shadow: dark `rgba(0,0,0,0.4)` / light `rgba(0,0,0,0.08)`. Título: `t1`. Subtítulo: `t3`. |
| **Responsive** | Desktop: `width: 380px`. Mobile: `width: 100%`. |
| **Contenido** | Título "Comienza ahora", subtítulo, botón Google, texto legal. |

**Sub-elementos de LoginCard**:

##### GoogleLoginButton

| Campo | Valor |
|-------|-------|
| **Nombre** | `GoogleLoginButton` |
| **Tipo** | Client Component — `onClick` para OAuth |
| **Props** | `onClick: () => void` (obligatoria) |
| **Estados** | Default: fondo blanco, shadow sutil. Hover: `translateY(-1px)`, shadow aumentada. |
| **Tokens** | Fondo: `#ffffff` (siempre). Borde: `#e2e8f0`. Texto: `#1f2937`. |
| **Responsive** | `width: 100%` en ambos |
| **Contenido** | SVG Google (20x20) + "Continuar con Google" (15px, weight 600) |

> **Nota — Feature futura**: El mockup original incluye un separador "o", formulario email/password y botón "Entrar con email". Se descarta para la implementación actual: el login será exclusivamente con Google OAuth. El login con email se podrá añadir en una fase futura si se considera necesario.

##### TextoLegal

| Campo | Valor |
|-------|-------|
| **Tipo** | Server Component |
| **Tokens** | `t4`, 11px, line-height 1.5, text-align center |
| **Contenido** | "Al continuar, aceptas nuestros términos de servicio y política de privacidad." |

#### GlowEffects

| Campo | Valor |
|-------|-------|
| **Nombre** | `GlowEffects` (decorativo, inline) |
| **Tipo** | Server Component — puramente visual |
| **Props** | Ninguna |
| **Estados** | Default único |
| **Tokens** | Naranja (top-right): `glowA` con `filter: blur(120px)`, 600x600. Azul (bottom-left): `glowB` con `filter: blur(100px)`, 500x500. |
| **Responsive** | Sin diferencias (position absolute, overflow hidden) |
| **Contenido** | 2 divs circulares con blur, posicionados absolute fuera del viewport parcialmente |

---

### 3.2 OnboardingScreen

#### StepIndicator

| Campo | Valor |
|-------|-------|
| **Nombre** | `StepIndicator` |
| **Tipo** | Client Component — recibe `current` que cambia con la navegación del wizard |
| **Props** | `current: number` (obligatoria, 0-3), `total: number` (obligatoria, 4) |
| **Estados** | Cada dot tiene 3 estados: **Activo** (32x8, `#f97316`), **Completado** (8x8, `#f97316` al 50% opacidad), **Pendiente** (8x8, `t4` al 30% opacidad) |
| **Tokens** | Activo: `#f97316`. Completado: `#f9731680`. Pendiente: `t4` al 30%. |
| **Responsive** | Sin diferencias mobile/desktop |
| **Contenido** | 4 dots horizontales centrados, gap 6px, borderRadius 4px, transición `all 0.3s ease` |
| **Reutilizable** | Sí — patrón genérico de wizard steps, podría usarse en otros flujos |

#### OnboardingField

| Campo | Valor |
|-------|-------|
| **Nombre** | `OnboardingField` |
| **Tipo** | Client Component — `value` + `onChange` controlado |
| **Props** | `label: string` (obligatoria), `placeholder: string` (obligatoria), `value: string` (obligatoria), `onChange: (value: string) => void` (obligatoria), `unit?: string` (opcional), `hint?: string` (opcional) |
| **Estados** | Default. Focus: implícito (solo `outline: none` en mockup). **[VERIFICAR]**: No se muestran estados de error/validación en el mockup. |
| **Tokens** | Label: `t1` (13px, weight 500). Input fondo: `inBg`. Input borde: `inB`. Input texto: `t1` (15px). Unit: `t3` (13px). Hint: `t4` (11px). |
| **Responsive** | Sin diferencias específicas (el layout grid se maneja en el padre) |
| **Contenido** | Label arriba, input con placeholder, unit a la derecha del input (opcional), hint debajo del input (opcional) |
| **Reutilizable** | Sí — patrón de input con label, unit y hint. Útil en Profile/Settings (F08). |

#### GoalCard

| Campo | Valor |
|-------|-------|
| **Nombre** | `GoalCard` |
| **Tipo** | Client Component — `onClick`, estado `active`, hover |
| **Props** | `icon: string` (emoji, obligatoria), `label: string` (obligatoria), `desc: string` (obligatoria), `active: boolean` (obligatoria), `onClick: () => void` (obligatoria) |
| **Estados** | **Default**: fondo `inBg`, borde `1px solid inB`. **Active**: fondo `actBg`, borde `2px solid acc`, icono Check visible. **Hover (inactivo)**: borde se cambia a `acc` al 40% opacidad. |
| **Tokens** | Fondo inactivo: `inBg`. Fondo activo: `actBg`. Borde inactivo: `inB`. Borde activo: `acc`. Texto label: `t1` (inactivo) / `acc` (activo). Texto desc: `t3`. |
| **Responsive** | Sin diferencias específicas (el layout column se maneja en el padre) |
| **Contenido** | Emoji (22px), label (15px, weight 600), Check icon (16px, solo cuando active), descripción (12px, paddingLeft 32px) |
| **Reutilizable** | Parcialmente — patrón de selección con card. Podría reutilizarse en Profile/Settings para cambiar objetivo. |

#### OnboardingCard (Contenedor principal)

| Campo | Valor |
|-------|-------|
| **Nombre** | `OnboardingCard` (contenedor del wizard) |
| **Tipo** | Client Component — gestiona estado del wizard (`step`, `data`) |
| **Props** | `onComplete: () => void` (obligatoria) |
| **Estados** | 4 pasos internos (step 0-3), cada uno muestra contenido diferente |
| **Tokens** | Fondo: `card`. Borde: `cardB`. Shadow: dark `rgba(0,0,0,0.3)` / light `rgba(0,0,0,0.06)`. Fondo página: `bg`. |
| **Responsive** | Desktop: `width: 520px`. Mobile: `width: 100%`, padding reducido (24 vs 40). |

#### StepHeader

| Campo | Valor |
|-------|-------|
| **Nombre** | `StepHeader` (inline en el mockup) |
| **Tipo** | Server Component (el icono cambia vía props, no estado interno) |
| **Props** | `icon: LucideIcon` (obligatoria), `title: string` (obligatoria), `subtitle: string` (obligatoria), `isComplete?: boolean` (para paso 3, fondo verde) |
| **Estados** | Normal: fondo icono `acc` al 15%. Completado (paso 3): fondo icono `linear-gradient(135deg, #22c55e, #16a34a)`, icono blanco. |
| **Tokens** | Fondo icono normal: `acc` al 15%. Icono normal: `acc`. Título: `t1` (22px, weight 700). Subtítulo: `t3` (13px). |
| **Responsive** | Sin diferencias |
| **Contenido** | Icono en contenedor 56x56 (borderRadius 16), título, subtítulo. Centrado. |

**Pasos y sus headers**:
| Paso | Icono | Título | Subtítulo |
|------|-------|--------|-----------|
| 0 | `User` | ¿Quién eres? | Datos básicos para personalizar tu experiencia |
| 1 | `Heart` | Tu rendimiento | Nos ayuda a calcular tus zonas de entrenamiento |
| 2 | `Target` | Tu objetivo | ¿Qué quieres conseguir con Cycling Companion? |
| 3 | `Check` | ¡Listo! | Tu entrenador IA está preparado |

#### InfoBox (Paso 1)

| Campo | Valor |
|-------|-------|
| **Nombre** | `InfoBox` (inline en el mockup) |
| **Tipo** | Server Component |
| **Props** | `children: ReactNode` (obligatoria) |
| **Estados** | Default único |
| **Tokens** | Fondo: `rgba(59,130,246,0.06)`. Borde: `1px solid rgba(59,130,246,0.15)`. Texto: `t2` (12px, line-height 1.6). Bold: `t1`. |
| **Responsive** | Sin diferencias |
| **Contenido** | "💡 No te preocupes si no tienes estos datos. La IA calculará estimaciones a partir de tus actividades y las irá ajustando automáticamente." |
| **Reutilizable** | Sí — patrón de caja informativa con tono azul sutil. |

#### ProfileSummary (Paso 3)

| Campo | Valor |
|-------|-------|
| **Nombre** | `ProfileSummary` |
| **Tipo** | Server Component (recibe datos vía props, no estado propio) |
| **Props** | `data: OnboardingData` (obligatoria) |
| **Estados** | Default único |
| **Tokens** | Contenedor: fondo `inBg`, borde `inB`, borderRadius 16. Cada celda: fondo `t4` al 8%, borderRadius 8. Label: `t3` (10px). Valor: `t1` (14px, weight 600). |
| **Responsive** | Grid 2 columnas (sin cambio mobile/desktop en el mockup) |

**Campos mostrados**:
| Label | Valor (fuente) | Valor fallback |
|-------|----------------|----------------|
| Nombre | `data.name` | "—" |
| Edad | `${data.age} años` | "—" |
| Peso | `${data.weight} kg` | "—" |
| FTP | `${data.ftp} W` | "Se estimará" |
| FC máx | `${data.maxHR} bpm` | "Se estimará" |
| Objetivo | Mapeo: performance→"Rendimiento", health→"Salud", weight_loss→"Peso", recovery→"Recuperación" | — |

#### AICoachWelcome (Paso 3)

| Campo | Valor |
|-------|-------|
| **Nombre** | `AICoachWelcome` |
| **Tipo** | Server Component (recibe nombre vía props) |
| **Props** | `userName?: string` (opcional) |
| **Estados** | Default único |
| **Tokens** | Fondo: `var(--ai-bg)` (gradient naranja sutil). Borde: `var(--ai-border)`. Badge: gradient naranja, texto `#f97316` uppercase (12px, weight 700). Texto: `t2` (13px, line-height 1.6). Bold: `t1`. |
| **Responsive** | Sin diferencias |
| **Contenido** | Badge "Tu entrenador IA" con logo mini (24x24, Zap), mensaje personalizado: "¡Hola, {nombre}! Estoy listo para ayudarte. Sube tu primera actividad o déjame generarte un plan semanal basado en tu perfil. Cuantos más datos tenga, mejores serán mis recomendaciones. 🚴‍♂️" |
| **Reutilizable** | Parcialmente — el patrón de tarjeta IA (con gradient naranja + badge) aparece en el Dashboard como `AICoachCard`. |

#### WizardNavigation

| Campo | Valor |
|-------|-------|
| **Nombre** | `WizardNavigation` (inline en el mockup) |
| **Tipo** | Client Component — botones con `onClick`, lógica `canNext()` |
| **Props** | `step: number`, `canNext: boolean`, `onBack: () => void`, `onNext: () => void`, `onComplete: () => void` |
| **Estados** | Ver tabla abajo |

**Estados de navegación por paso**:

| Paso | Botón Atrás | Botón Siguiente/Final |
|------|------------|----------------------|
| 0 | No visible | "Siguiente" — habilitado si `name && age && weight` |
| 1 | Visible | "Siguiente" — siempre habilitado (campos opcionales) |
| 2 | Visible | "Siguiente" — habilitado si `goal` seleccionado (preseleccionado por defecto) |
| 3 | Visible | "Empezar a entrenar" — siempre habilitado |

**Estilos de botones**:

| Botón | Habilitado | Deshabilitado |
|-------|-----------|---------------|
| **Atrás** | Fondo transparente, borde `inB`, texto `t2` (14px, weight 500), icono `ChevronLeft` | No aplica (siempre habilitado cuando visible) |
| **Siguiente** | Gradient naranja `#f97316 → #ea580c`, texto white (14px, weight 600), icono `ChevronRight` | Fondo `t4` al 30%, texto `t4`, `cursor: not-allowed` |
| **Empezar** | Gradient naranja, texto white (15px, weight 700), icono `Activity`, shadow `rgba(249,115,22,0.3)`, borderRadius 12 | No aplica |

---

### 3.3 CompletionScreen

| Campo | Valor |
|-------|-------|
| **Nombre** | `CompletionScreen` (inline en `AuthFlow`) |
| **Tipo** | Server Component (o transitorio sin interacción) |
| **Props** | Ninguna (estado transitorio) |
| **Estados** | Default único |
| **Tokens** | Fondo: `bg`. Icono: gradient verde `#22c55e → #16a34a`, shadow `rgba(34,197,94,0.3)`. Título: `t1` (24px, weight 700). Subtítulo: `t3` (14px). |
| **Responsive** | Sin diferencias (centrado flex) |
| **Contenido** | Icono Check grande (72x72, borderRadius 20), "¡Onboarding completado!", "Redirigiendo al dashboard..." |

---

## 4. Jerarquía de Componentes

### LoginScreen

```
LoginScreen (page.tsx — Server Component)
├── GlowEffects (decorativo, CSS)
├── ThemeToggle (Client) ♻️
├── HeroBranding (Server)
│   ├── Logo (Zap icon + "Cycling Companion")
│   ├── Headline
│   ├── Subtitle
│   └── FeatureList (solo desktop)
└── LoginCard (Client)
    ├── GoogleLoginButton (Client) ♻️
    └── TextoLegal (inline)
```

### OnboardingScreen

```
OnboardingScreen (page.tsx — Client Component, gestiona wizard state)
├── ThemeToggle (Client) ♻️
└── OnboardingCard (Client — wizard container)
    ├── Logo mini (Zap + "Cycling Companion")
    ├── StepIndicator (Client) ♻️
    ├── StepHeader (Server-like, pero hijo de Client)
    │
    ├── [Step 0] BasicDataForm
    │   ├── OnboardingField "Nombre" ♻️
    │   ├── OnboardingField "Edad" ♻️ (grid 2-col)
    │   └── OnboardingField "Peso" ♻️ (grid 2-col)
    │
    ├── [Step 1] PerformanceForm
    │   ├── OnboardingField "FTP" ♻️
    │   ├── OnboardingField "FC máxima" ♻️ (grid 2-col)
    │   ├── OnboardingField "FC reposo" ♻️ (grid 2-col)
    │   └── InfoBox ♻️
    │
    ├── [Step 2] GoalSelection
    │   ├── GoalCard "Rendimiento" ♻️
    │   ├── GoalCard "Salud" ♻️
    │   ├── GoalCard "Peso" ♻️
    │   └── GoalCard "Recuperación" ♻️
    │
    ├── [Step 3] CompletionStep
    │   ├── ProfileSummary
    │   └── AICoachWelcome ♻️
    │
    └── WizardNavigation (Client)
        ├── Button "Atrás" (condicional)
        └── Button "Siguiente" / "Empezar a entrenar"
```

**Leyenda**: ♻️ = Componente reutilizable (usado en más de un sitio o con potencial de reutilización)

---

## 5. Datos Necesarios

### Datos del Servidor

| Dato | Fuente | Cuándo |
|------|--------|--------|
| Estado de autenticación | `supabase.auth.getUser()` | Al cargar `/login` y `/onboarding` |
| Existencia de perfil de usuario | Tabla `users` (SELECT por user_id) | Al cargar `/onboarding` — si ya existe, redirect a `/` |

### Datos del Cliente (Estado Local)

| Dato | Tipo | Componente | Valor inicial |
|------|------|-----------|---------------|
| `step` | `number` | OnboardingScreen | `0` |
| `data.name` | `string` | OnboardingScreen | `""` |
| `data.age` | `string` | OnboardingScreen | `""` |
| `data.weight` | `string` | OnboardingScreen | `""` |
| `data.ftp` | `string` | OnboardingScreen | `""` |
| `data.maxHR` | `string` | OnboardingScreen | `""` |
| `data.restHR` | `string` | OnboardingScreen | `""` |
| `data.goal` | `string` | OnboardingScreen | `"performance"` |
| `theme` | `'dark' \| 'light'` | Contexto global | `"dark"` |

### Datos de Formulario → Contrato de API

Los datos que el usuario introduce en el onboarding se guardarán en la tabla `users`. Este es el contrato implícito:

```typescript
interface OnboardingFormData {
  name: string;       // Obligatorio (paso 0)
  age: string;        // Obligatorio (paso 0) — se parseará a number
  weight: string;     // Obligatorio (paso 0) — se parseará a number
  ftp: string;        // Opcional (paso 1) — se parseará a number | null
  maxHR: string;      // Opcional (paso 1) — se parseará a number | null
  restHR: string;     // Opcional (paso 1) — se parseará a number | null
  goal: GoalType;     // Obligatorio (paso 2) — preseleccionado "performance"
}

type GoalType = 'performance' | 'health' | 'weight_loss' | 'recovery';
```

**Mapeo a tabla `users` del PRD**:

| Campo del form | Campo en `users` | Tipo DB | Notas |
|---------------|-----------------|---------|-------|
| `name` | `display_name` | `text` | Obligatorio |
| `age` | `age` | `integer` | Obligatorio |
| `weight` | `weight_kg` | `numeric` | Obligatorio |
| `ftp` | `ftp` | `integer` | Nullable — "Se estimará" |
| `maxHR` | `max_hr` | `integer` | Nullable — estimación `220 - age` |
| `restHR` | `rest_hr` | `integer` | Nullable |
| `goal` | `goal` | `enum` | Default: `performance` |

**Nota**: `email` e `id` se obtienen de Supabase Auth, no del formulario.

---

## 6. Flujos de Interacción

### Flujo 1: Login con Google (flujo feliz)

1. Usuario llega a `/login`.
2. Ve pantalla LoginScreen con branding a la izquierda y card a la derecha.
3. Hace clic en "Continuar con Google".
4. → Redirect a Supabase OAuth (Google consent screen).
5. → Google redirige a `/auth/callback` con código.
6. → Supabase intercambia código por sesión.
7. → Si usuario nuevo (no tiene registro en `users`) → redirect a `/onboarding`.
8. → Si usuario existente → redirect a `/` (dashboard).

### Flujo 2: Onboarding completo (flujo feliz)

1. Usuario nuevo llega a `/onboarding` (post-login).
2. Ve paso 0: "¿Quién eres?" con 3 campos.
3. Rellena nombre, edad, peso.
4. Botón "Siguiente" se habilita → clic.
5. Ve paso 1: "Tu rendimiento" con 3 campos opcionales.
6. Rellena FTP, FC máxima, FC reposo (o los deja vacíos).
7. Clic "Siguiente" (siempre habilitado).
8. Ve paso 2: "Tu objetivo" con 4 GoalCards.
9. "Rendimiento" está preseleccionado. Puede cambiar haciendo clic en otra card.
10. Clic "Siguiente".
11. Ve paso 3: "¡Listo!" con resumen de perfil + mensaje del coach IA.
12. Revisa datos. Puede volver atrás con "Atrás" para corregir.
13. Clic "Empezar a entrenar".
14. → Se guardan datos en tabla `users` (INSERT/UPSERT).
15. → Pantalla de confirmación transitoria ("¡Onboarding completado!").
16. → Redirect automático a `/` (dashboard).

### Flujo 3: Navegación atrás en onboarding

1. En cualquier paso > 0, el botón "Atrás" es visible.
2. Clic → `step` decrementa en 1.
3. Los datos del formulario se mantienen (no se pierden al navegar).
4. Puede avanzar de nuevo con "Siguiente".

### Flujo 4: Estimación automática de FC máxima (paso 1)

1. Usuario rellena edad en paso 0 (e.g. "45").
2. Avanza a paso 1.
3. Si `maxHR` está vacío, el hint muestra: "Estimación: 175 bpm" (220 - 45).
4. Si el usuario escribe un valor, el hint desaparece.

### Flujo de error: Campos obligatorios vacíos (paso 0)

1. Usuario está en paso 0 pero no ha rellenado todos los campos.
2. Botón "Siguiente" aparece deshabilitado: fondo gris, `cursor: not-allowed`.
3. No hay mensajes de error inline — solo el botón deshabilitado.

---

## 7. Tokens de Tema Aplicables

### LoginScreen

| Elemento | Token | Dark | Light |
|----------|-------|------|-------|
| Fondo página | `heroBg` | `linear-gradient(135deg, #0f1923, #162032, #1a1a2e)` | `linear-gradient(135deg, #fff, #f1f5f9, #e8edf5)` |
| Glow naranja | `glowA` | `rgba(249,115,22,0.15)` | `rgba(249,115,22,0.08)` |
| Glow azul | `glowB` | `rgba(59,130,246,0.1)` | `rgba(59,130,246,0.05)` |
| Card fondo | `card` | `rgba(255,255,255,0.03)` | `#ffffff` |
| Card borde | `cardB` | `rgba(255,255,255,0.06)` | `#e2e8f0` |
| Título/headline | `t1` | `#f1f5f9` | `#0f172a` |
| Subtítulo | `t2` | `#94a3b8` | `#475569` |
| Labels form | `t3` | `#64748b` | `#64748b` |
| Texto legal | `t4` | `#475569` | `#94a3b8` |
| Input fondo | `inBg` | `rgba(255,255,255,0.04)` | `#f8fafc` |
| Input borde | `inB` | `rgba(255,255,255,0.08)` | `#e2e8f0` |
| Acento | `acc` | `#f97316` | `#ea580c` |

**Tokens complejos (requieren CSS custom properties)**:
- `heroBg` → `--hero-bg`
- `glowA` → `--glow-orange` (o inline con Tailwind arbitrary)
- `glowB` → `--glow-blue` (o inline con Tailwind arbitrary)
- Card shadow varía por tema → puede resolverse con `dark:shadow-*`

### OnboardingScreen

| Elemento | Token | Dark | Light |
|----------|-------|------|-------|
| Fondo página | `bg` | `#0c1320` | `#f8f9fb` |
| Card fondo | `card` | `rgba(255,255,255,0.03)` | `#ffffff` |
| Card borde | `cardB` | `rgba(255,255,255,0.06)` | `#e2e8f0` |
| GoalCard activo fondo | `actBg` | `rgba(249,115,22,0.12)` | `rgba(249,115,22,0.08)` |
| GoalCard activo borde | `acc` | `#f97316` | `#ea580c` |
| Input fondo | `inBg` | `rgba(255,255,255,0.04)` | `#f8fafc` |
| Input borde | `inB` | `rgba(255,255,255,0.08)` | `#e2e8f0` |
| AI Coach fondo | `aiBg` / `--ai-bg` | gradient naranja sutil | gradient naranja sutil |
| AI Coach borde | `aiB` / `--ai-border` | `rgba(249,115,22,0.18)` | `rgba(249,115,22,0.2)` |

---

## 8. Componentes Reutilizables

| Componente | Usado en esta pantalla | Reutilizable en | shadcn/ui base | Crear custom |
|------------|----------------------|-----------------|----------------|--------------|
| **ThemeToggle** | Login, Onboarding | Toda la app (header/sidebar) | No — custom | Sí |
| **StepIndicator** | Onboarding | Cualquier wizard futuro | No — custom | Sí |
| **OnboardingField** | Onboarding (6 campos) | Profile/Settings (F08) | `Input` de shadcn como base | Wrapper custom |
| **GoalCard** | Onboarding paso 2 | Profile/Settings (cambio objetivo) | `Card` de shadcn como posible base | Sí — con interacción |
| **InfoBox** | Onboarding paso 1 | Tooltips informativos en toda la app | `Alert` de shadcn como posible base | Evaluar |
| **AICoachWelcome** | Onboarding paso 3 | Dashboard (`AICoachCard`), Detail | No — custom, pero patrón similar | Patrón `AICoachCard` |
| **GoogleLoginButton** | Login | Solo en Login | `Button` de shadcn como base | Wrapper custom |
| **ProfileSummary** | Onboarding paso 3 | Profile page (visualización) | No — custom | Sí |

---

## 9. Transformaciones JSX Necesarias

### Inline Styles → Tailwind

| Patrón mockup | Transformación Tailwind |
|---------------|------------------------|
| `style={{ minHeight:"100vh", width:"100vw" }}` | `className="min-h-screen w-screen"` |
| `style={{ padding: mob ? 20 : 40 }}` | `className="p-5 md:p-10"` |
| `style={{ padding: mob ? 16 : 40 }}` | `className="p-4 md:p-10"` |
| `style={{ padding: mob ? 24 : 36 }}` | `className="p-6 md:p-9"` |
| `style={{ fontSize: mob ? 28 : 40 }}` | `className="text-[28px] md:text-[40px]"` |
| `style={{ fontSize: mob ? 14 : 16 }}` | `className="text-sm md:text-base"` |
| `style={{ maxWidth: 960 }}` | `className="max-w-[960px]"` |
| `style={{ width: mob ? "100%" : 380 }}` | `className="w-full md:w-[380px]"` |
| `style={{ width: mob ? "100%" : 520 }}` | `className="w-full md:w-[520px]"` |
| `style={{ flexDirection: mob ? "column" : "row" }}` | `className="flex flex-col md:flex-row"` |
| `style={{ gap: mob ? 32 : 60 }}` | `className="gap-8 md:gap-[60px]"` |
| `style={{ textAlign: mob ? "center" : "left" }}` | `className="text-center md:text-left"` |
| `borderRadius: 20` | `className="rounded-[20px]"` |
| `borderRadius: 24` | `className="rounded-3xl"` (24px) |
| `borderRadius: 14` | `className="rounded-[14px]"` |
| `borderRadius: 10` | `className="rounded-[10px]"` |
| `letterSpacing: "-0.03em"` | `className="tracking-tight"` (-0.025em, close enough) o `tracking-[-0.03em]` |
| `lineHeight: 1.2` | `className="leading-tight"` (1.25) o `leading-[1.2]` |
| `lineHeight: 1.7` | `className="leading-relaxed"` (1.625) o `leading-[1.7]` |
| `opacity: 0.85` | `className="opacity-85"` |
| `transition: "all 0.3s ease"` | `className="transition-all duration-300 ease-in-out"` |
| `transition: "all 0.2s"` | `className="transition-all duration-200"` |
| `transition: "transform 0.15s, box-shadow 0.15s"` | `className="transition-[transform,box-shadow] duration-150"` |
| `cursor: "not-allowed"` | `className="cursor-not-allowed"` |
| `pointerEvents: "none"` | `className="pointer-events-none"` |
| `zIndex: 10` | `className="z-10"` |
| `zIndex: 1` | `className="z-[1]"` |

### Hook `useMob()` → Tailwind Breakpoints

El mockup usa `useMob()` (un hook que detecta `window.innerWidth < 768`) para renderizado condicional. En Next.js + Tailwind:

- **Diferencias de layout**: Resolver con `flex-col md:flex-row`, `grid-cols-1 md:grid-cols-2`, etc.
- **Diferencias de padding/fontSize**: Resolver con `p-4 md:p-10`, `text-sm md:text-base`, etc.
- **Contenido condicional** (Feature list solo desktop): Usar `className="hidden md:flex"`.
- **No usar hook `useMediaQuery`** — todo con Tailwind responsive.

### Theme Context → Tailwind `dark:` + CSS Variables

El mockup usa `useT()` (React Context) para acceder a tokens de tema. En Next.js:

- Tokens simples → `dark:text-slate-100 text-slate-900`
- Tokens complejos (gradients, rgba) → CSS custom properties en `globals.css`
- Toggle de tema → `className` en `<html>` (`dark` class) vía un provider

### `useState` → Evaluación Server/Client

| Estado en mockup | Necesita Client Component | Solución Next.js |
|-----------------|--------------------------|-----------------|
| `step` | Sí | `'use client'` en el componente wizard |
| `data` (form) | Sí | `'use client'` en el componente wizard |
| `theme` | Sí | Contexto global con `'use client'` provider |
| `screen` (login/onboarding/done) | No | Rutas separadas `/login`, `/onboarding` |

### Event Handlers (`onMouseEnter`/`onMouseLeave`) → Tailwind

| Mockup | Tailwind |
|--------|----------|
| `onMouseEnter: translateY(-1px), shadow increase` | `hover:-translate-y-px hover:shadow-lg` |
| `onMouseEnter: borderColor change` (GoalCard) | `hover:border-orange-500/40` |

---

## 10. Dependencias Externas

### Paquetes npm

| Paquete | Uso | Ya instalado |
|---------|-----|-------------|
| `lucide-react` | Iconos: Zap, Sun, Moon, ChevronRight, ChevronLeft, User, Heart, Target, Check, Activity | Verificar |
| `@supabase/ssr` | Auth (OAuth, session) | Sí |
| `next/font` | DM Sans font loading | Sí (built-in Next.js) |

### Componentes shadcn/ui a instalar

| Componente | Uso |
|------------|-----|
| `button` | Base para GoogleLoginButton, botones de navegación |
| `input` | Base para OnboardingField |
| `card` | Posible base para LoginCard, OnboardingCard |

### Integraciones

| Servicio | Uso | Estado |
|----------|-----|--------|
| Supabase Auth (Google OAuth) | Login con Google | ✅ Implementado |
| Supabase Auth (Email) | Login con email | **DESCARTADO** — feature futura, solo Google OAuth en esta fase |
| Supabase DB (tabla `users`) | Guardar datos onboarding | ❌ Tabla no creada aún |
| Middleware redirect | Redirigir a `/onboarding` si perfil incompleto | ❌ Lógica no implementada |

---

## Apéndice: Datos de Objetivos (Constante Reutilizable)

```typescript
const GOALS = [
  { key: 'performance', icon: '🎯', label: 'Mejorar rendimiento', desc: 'Subir FTP, más potencia en competición o marchas' },
  { key: 'health',      icon: '💚', label: 'Mantener salud',      desc: 'Entrenar de forma sostenible y equilibrada' },
  { key: 'weight_loss', icon: '⚖️', label: 'Perder peso',         desc: 'Quemar grasa manteniendo masa muscular' },
  { key: 'recovery',    icon: '🩹', label: 'Recuperación',         desc: 'Volver de una lesión o pausa prolongada' },
] as const;
```

---

## Apéndice: Datos de Pasos del Onboarding (Constante Reutilizable)

```typescript
import { User, Heart, Target, Check } from 'lucide-react';

const ONBOARDING_STEPS = [
  { title: '¿Quién eres?',    subtitle: 'Datos básicos para personalizar tu experiencia',     icon: User },
  { title: 'Tu rendimiento',  subtitle: 'Nos ayuda a calcular tus zonas de entrenamiento',    icon: Heart },
  { title: 'Tu objetivo',     subtitle: '¿Qué quieres conseguir con Cycling Companion?',      icon: Target },
  { title: '¡Listo!',         subtitle: 'Tu entrenador IA está preparado',                     icon: Check },
] as const;
```
