# L3 — Plan de Issues: Login y Onboarding

> **Input**: `docs/specs/L2-screen-00-login-onboarding.md`
> **Fase**: Fase 1
> **Fecha**: 2026-02-14

---

## Issue 1: Configurar infraestructura de tema dark/light

**Labels**: `type:feature`, `priority:p0`, `phase:1`
**Depende de**: —
**Estimación**: ~2h

### Descripción

Configurar el sistema de tema dark/light usando `next-themes`. Esto incluye instalar dependencias, crear el ThemeProvider, configurar Tailwind para `darkMode: 'class'`, añadir la fuente DM Sans con `next/font`, y definir las CSS custom properties del design system en `globals.css`.

Esta issue establece la infraestructura base sobre la que se construyen todas las pantallas.

### Criterios de Aceptación

- [ ] `next-themes` instalado en `apps/web`
- [ ] `lucide-react` instalado en `apps/web`
- [ ] `ThemeProvider` creado en `apps/web/src/components/theme-provider.tsx`
- [ ] `ThemeToggle` creado en `apps/web/src/components/theme-toggle.tsx`
- [ ] `tailwind.config.ts` actualizado con `darkMode: 'class'`
- [ ] `layout.tsx` actualizado: DM Sans vía `next/font`, `ThemeProvider` envolviendo `{children}`, `suppressHydrationWarning` en `<html>`
- [ ] `globals.css` actualizado con CSS custom properties: `--hero-bg`, `--glow-orange`, `--glow-blue`, `--ai-bg`, `--ai-border`, tokens de card/input para dark/light
- [ ] El toggle cambia entre dark y light sin FOUC
- [ ] `pnpm build` pasa sin errores
- [ ] `pnpm lint` pasa sin errores
- [ ] `pnpm typecheck` pasa sin errores

### Archivos Afectados

**Crear**:
- `apps/web/src/components/theme-provider.tsx` — Wrapper `'use client'` de next-themes
- `apps/web/src/components/theme-toggle.tsx` — Botón reutilizable con Sun/Moon icon

**Modificar**:
- `apps/web/src/app/layout.tsx` — Añadir DM Sans + ThemeProvider + html attrs
- `apps/web/src/app/globals.css` — Añadir CSS custom properties del design system
- `apps/web/tailwind.config.ts` — Añadir `darkMode: 'class'`

### Notas Técnicas

- Usar `attribute="class"` y `defaultTheme="dark"` en ThemeProvider (ref: ADR-001 en L2)
- `suppressHydrationWarning` solo en `<html>`, no en otros elementos
- Las CSS custom properties deben cubrir: `:root` (light) y `.dark` (dark). Ver L2 §7 tokens complejos y CONVENTIONS.md §7
- ThemeToggle acepta `showLabel?: boolean` (true muestra texto "Claro"/"Oscuro")

### Referencia de Diseño

- Spec funcional L1: §7 (Tokens de Tema), §3.1 ThemeToggle
- Diseño técnico L2: ADR-001, §2.3 ThemeProvider y ThemeToggle
- DESIGN-SYSTEM.md: §2 (tokens), §6.2 (conversión temas)

---

## Issue 2: Crear schema Zod y constantes compartidas en packages/shared

**Labels**: `type:feature`, `priority:p0`, `phase:1`
**Depende de**: —
**Estimación**: ~1h

### Descripción

Crear los schemas Zod de validación y las constantes compartidas para el onboarding y el perfil de usuario. Estos se usarán tanto en el frontend (validación del wizard) como en el backend futuro.

### Criterios de Aceptación

- [ ] `zod` instalado como dependencia en `packages/shared`
- [ ] Schema `onboardingSchema` creado con validaciones correctas (name requerido, age/weight requeridos, ftp/maxHR/restHR opcionales, goal enum)
- [ ] Schema `userProfileSchema` creado (extiende onboarding + id, email, timestamps)
- [ ] Tipos `GoalType`, `OnboardingData`, `UserProfile` exportados
- [ ] Constantes `GOALS` y `ONBOARDING_STEPS` exportadas
- [ ] `index.ts` actualizado re-exportando todo
- [ ] `pnpm build` pasa sin errores
- [ ] `pnpm lint` pasa sin errores
- [ ] `pnpm typecheck` pasa sin errores

### Archivos Afectados

**Crear**:
- `packages/shared/src/schemas/user-profile.ts` — Schemas Zod
- `packages/shared/src/constants/goals.ts` — Constantes de goals y pasos

**Modificar**:
- `packages/shared/src/index.ts` — Re-exportar schemas y constantes
- `packages/shared/package.json` — Añadir `zod` como dependencia

### Notas Técnicas

- Los rangos de validación deben coincidir con los CHECK constraints de la tabla SQL (L2 §3): age 1-119, weight 0.1-299.9, ftp 1-999, max_hr 1-249, rest_hr 1-199
- `goalEnum` usa `z.enum()` con los 4 valores: performance, health, weight_loss, recovery
- Las constantes usan `as const` para type-safety

### Referencia de Diseño

- Spec funcional L1: §5 (Datos de Formulario → Contrato de API), Apéndices
- Diseño técnico L2: §3 (Modelo de Datos — Schemas Zod y Constantes)
- PRD: §3.3 (tabla users)

---

## Issue 3: Crear tabla users en Supabase con RLS

**Labels**: `type:feature`, `priority:p0`, `phase:1`
**Depende de**: —
**Estimación**: ~1h

### Descripción

Crear la tabla `public.users` en Supabase con todos los campos del perfil del ciclista, constraints de validación, políticas RLS y trigger de `updated_at`. Guardar el SQL como migración documentada.

### Criterios de Aceptación

- [ ] Tabla `public.users` creada con todos los campos: id, email, display_name, age, weight_kg, ftp, max_hr, rest_hr, goal, created_at, updated_at
- [ ] `id` referencia `auth.users(id)` con ON DELETE CASCADE
- [ ] CHECK constraints en age (1-119), weight_kg (0.1-299.9), ftp (1-999), max_hr (1-249), rest_hr (1-199)
- [ ] `goal` es TEXT con CHECK IN ('performance', 'health', 'weight_loss', 'recovery')
- [ ] RLS habilitado con 3 políticas: SELECT, INSERT, UPDATE (usando `auth.uid() = id`)
- [ ] Trigger `set_updated_at` creado y funcional
- [ ] Script SQL guardado en `supabase/migrations/` (o documentado en la issue)
- [ ] `pnpm build` pasa sin errores (no afecta al build, pero confirmar)

### Archivos Afectados

**Crear**:
- `supabase/migrations/001_create_users_table.sql` — Script SQL completo

### Notas Técnicas

- El SQL debe ser idempotente (`CREATE TABLE IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`)
- Ejecutar en Supabase Dashboard > SQL Editor o vía CLI
- El campo `ftp`, `max_hr`, `rest_hr` son nullable (el onboarding los marca como opcionales)
- Ref: L2 §3 para el SQL completo y ADR-004 para la decisión TEXT vs ENUM

### Referencia de Diseño

- Diseño técnico L2: §3 (Modelo de Datos — Tabla users)
- PRD: §3.3 (tabla users), §3.5 (RLS)

---

## Issue 4: Migrar login a route group (auth) y reestructurar archivos

**Labels**: `type:refactor`, `priority:p0`, `phase:1`
**Depende de**: Issue 1
**Estimación**: ~1.5h

### Descripción

Reorganizar la estructura de archivos para usar route groups de Next.js App Router. Mover la página de login de `app/login/` a `app/(auth)/login/`, crear el layout mínimo del route group `(auth)`, y limpiar la página raíz.

Esto prepara la estructura para separar pantallas de auth (sin sidebar) de pantallas de la app (con sidebar) en el futuro.

### Criterios de Aceptación

- [ ] Route group `(auth)` creado con layout mínimo
- [ ] Login movido a `app/(auth)/login/page.tsx`
- [ ] `login-button.tsx` movido a `app/(auth)/login/login-button.tsx`
- [ ] URL `/login` sigue funcionando (route groups no afectan URLs)
- [ ] Middleware actualizado: las rutas `/login` y `/auth` siguen excluidas de protección
- [ ] `page.tsx` raíz simplificada (placeholder para futuro dashboard)
- [ ] Todos los imports internos actualizados
- [ ] `pnpm build` pasa sin errores
- [ ] `pnpm lint` pasa sin errores
- [ ] `pnpm typecheck` pasa sin errores

### Archivos Afectados

**Crear**:
- `apps/web/src/app/(auth)/layout.tsx` — Layout mínimo del route group auth

**Mover**:
- `apps/web/src/app/login/page.tsx` → `apps/web/src/app/(auth)/login/page.tsx`
- `apps/web/src/app/login/login-button.tsx` → `apps/web/src/app/(auth)/login/login-button.tsx`

**Modificar**:
- `apps/web/src/app/page.tsx` — Simplificar a redirect temporal
- `apps/web/src/lib/supabase/middleware.ts` — Verificar que las rutas siguen protegidas correctamente

### Notas Técnicas

- El layout `(auth)` no necesita sidebar ni navigation — solo `{children}` con fondo mínimo
- La URL no cambia: `(auth)` es invisible en la URL
- Ref: ADR-006 en L2 para la justificación

### Referencia de Diseño

- Diseño técnico L2: ADR-006, §5 (Estructura de Archivos)
- DESIGN-SYSTEM.md: §6.3 (estructura App Router)

---

## Issue 5: Rediseñar pantalla de Login según mockup

**Labels**: `type:feature`, `priority:p0`, `phase:1`
**Depende de**: Issue 1, Issue 4
**Estimación**: ~3h

### Descripción

Implementar la pantalla de Login siguiendo fielmente el mockup JSX. Layout split (branding izquierda + card derecha), glow effects decorativos, GoogleLoginButton rediseñado, responsive mobile-first, tema dark/light.

El login es exclusivamente con Google OAuth. No se incluye formulario email/password.

### Criterios de Aceptación

- [ ] Layout split: branding a la izquierda, card a la derecha en desktop
- [ ] Mobile: apilado vertical, feature list oculta
- [ ] Glow effects (naranja top-right, azul bottom-left) con blur
- [ ] Logo con gradient naranja + icono Zap
- [ ] Headline "Tu entrenador IA / que entiende tus datos" (segunda línea en naranja)
- [ ] 3 features con emoji (solo desktop)
- [ ] Card de login con GoogleLoginButton rediseñado (fondo blanco, SVG Google, hover con elevación)
- [ ] Texto legal al pie de la card
- [ ] ThemeToggle posicionado top-right
- [ ] Fondo usa `--hero-bg` (gradient del design system)
- [ ] Dark/light mode funciona correctamente
- [ ] Auth con Google sigue funcionando (no romper la lógica OAuth existente)
- [ ] `pnpm build` pasa sin errores
- [ ] `pnpm lint` pasa sin errores
- [ ] `pnpm typecheck` pasa sin errores

### Archivos Afectados

**Crear**:
- `apps/web/src/app/(auth)/login/login-content.tsx` — Client Component con toda la UI

**Modificar**:
- `apps/web/src/app/(auth)/login/page.tsx` — Server Component que verifica auth y renderiza LoginContent
- `apps/web/src/app/(auth)/login/login-button.tsx` — Rediseñar visualmente al estilo mockup

### Notas Técnicas

- `page.tsx` es Server Component: verifica auth, si autenticado redirect a `/`. Renderiza `<LoginContent />`
- `login-content.tsx` es Client Component: necesita `useTheme()` para glow effects, contiene GoogleLoginButton
- GoogleLoginButton mantiene la lógica OAuth existente (`signInWithOAuth`), solo se rediseña visualmente
- Glow effects: divs absolute con border-radius 50%, filter blur, pointer-events none
- Ver L1 §3.1 para detalles exactos de cada componente y L1 §9 para transformaciones Tailwind

### Referencia de Diseño

- Spec funcional L1: §3.1 (LoginScreen completo), §7 (tokens), §9 (transformaciones)
- Diseño técnico L2: §2.1 (árbol Login), §2.3 (LoginContent, GoogleLoginButton)
- DESIGN-SYSTEM.md: §1.0a (Login), §6.2 (conversiones)

---

## Issue 6: Crear componentes base del onboarding

**Labels**: `type:feature`, `priority:p0`, `phase:1`
**Depende de**: Issue 1
**Estimación**: ~2.5h

### Descripción

Crear los componentes reutilizables que usa el wizard de onboarding: StepIndicator, OnboardingField, GoalCard e InfoBox. Cada uno implementado con Tailwind CSS, tema dark/light, y las interfaces TypeScript definidas en L2.

### Criterios de Aceptación

- [ ] `StepIndicator` renderiza dots correctamente (activo expandido + naranja, completado naranja 50%, pendiente gris 30%)
- [ ] `StepIndicator` anima la transición entre estados con `transition-all duration-300`
- [ ] `OnboardingField` renderiza label, input, unit (opcional) y hint (opcional)
- [ ] `OnboardingField` aplica tokens del design system (inBg, inB, t1, t3, t4)
- [ ] `GoalCard` muestra 3 estados: default, active (borde naranja + check), hover (borde sutil)
- [ ] `GoalCard` aplica tokens correctos (actBg, acc, inBg, inB)
- [ ] `InfoBox` renderiza caja azul sutil con children
- [ ] Todos los componentes funcionan en dark/light mode
- [ ] `pnpm build` pasa sin errores
- [ ] `pnpm lint` pasa sin errores
- [ ] `pnpm typecheck` pasa sin errores

### Archivos Afectados

**Crear**:
- `apps/web/src/components/step-indicator.tsx` — Dots de progreso
- `apps/web/src/components/onboarding-field.tsx` — Input con label, unit, hint
- `apps/web/src/components/goal-card.tsx` — Card seleccionable
- `apps/web/src/components/info-box.tsx` — Caja informativa azul

### Notas Técnicas

- StepIndicator: Client Component (props reactivas). Dot activo: `w-8 h-2 bg-orange-500`. Dot completado: `w-2 h-2 bg-orange-500/50`. Dot pendiente: `w-2 h-2 bg-slate-600/30`
- OnboardingField: Client Component (value/onChange). Input padding `12px 14px`, borderRadius 10px, fontSize 15px
- GoalCard: Client Component (onClick, hover). Activo: `border-2 border-orange-500`. Inactivo: `border border-white/[0.08]`
- InfoBox: puede ser Server Component (solo children)
- Ref: L2 §2.3 para interfaces TypeScript exactas

### Referencia de Diseño

- Spec funcional L1: §3.2 (StepIndicator, OnboardingField, GoalCard, InfoBox)
- Diseño técnico L2: §2.3 (detalle por componente)
- DESIGN-SYSTEM.md: §2.5-2.7 (componentes), §6.2 (conversiones)

---

## Issue 7: Implementar wizard de onboarding (4 pasos)

**Labels**: `type:feature`, `priority:p0`, `phase:1`
**Depende de**: Issue 2, Issue 3, Issue 6
**Estimación**: ~3h

### Descripción

Implementar la pantalla de onboarding completa: Server Component page con verificación de auth, Client Component wizard con 4 pasos (datos básicos, rendimiento, objetivo, resumen), navegación adelante/atrás, validación de campos, y guardado en Supabase al completar.

### Criterios de Aceptación

- [ ] `page.tsx` verifica auth (si no auth → `/login`) y perfil existente (si tiene perfil → `/`)
- [ ] Wizard muestra paso 0: nombre, edad, peso (obligatorios). Botón "Siguiente" deshabilitado hasta rellenar los 3
- [ ] Wizard muestra paso 1: FTP, FC máxima, FC reposo (opcionales). Info box azul. Hint de estimación FC máxima (`220 - edad`)
- [ ] Wizard muestra paso 2: 4 GoalCards seleccionables. "Rendimiento" preseleccionado
- [ ] Wizard muestra paso 3: ProfileSummary con datos, AICoachWelcome con saludo personalizado
- [ ] Navegación: "Atrás" visible desde paso 1. "Siguiente" / "Empezar a entrenar" según paso
- [ ] StepIndicator refleja el paso actual
- [ ] StepHeader muestra icono, título y subtítulo del paso actual
- [ ] Al completar: valida con Zod, inserta en tabla `users`, redirect a `/`
- [ ] Manejo de error: si INSERT falla (e.g. perfil ya existe), muestra error y redirige
- [ ] Card centrada: desktop 520px, mobile 100%
- [ ] Logo mini (Zap + "Cycling Companion") arriba de la card
- [ ] ThemeToggle posicionado top-right
- [ ] Dark/light mode funciona
- [ ] `pnpm build` pasa sin errores
- [ ] `pnpm lint` pasa sin errores
- [ ] `pnpm typecheck` pasa sin errores

### Archivos Afectados

**Crear**:
- `apps/web/src/app/(auth)/onboarding/page.tsx` — Server Component: auth + profile check + render
- `apps/web/src/app/(auth)/onboarding/onboarding-wizard.tsx` — Client Component: wizard completo
- `apps/web/src/app/(auth)/onboarding/profile-summary.tsx` — Resumen del perfil (paso 3)
- `apps/web/src/app/(auth)/onboarding/ai-coach-welcome.tsx` — Mensaje IA (paso 3)

### Notas Técnicas

- `page.tsx` pasa `userId` y `userEmail` como props al wizard (ref: ADR-002 en L2)
- El wizard usa `createClient()` (browser) para el INSERT en `users` con RLS
- Validación Zod con `onboardingSchema` de `shared` antes del INSERT
- Parseo de strings a numbers: age→int, weight→float, ftp/maxHR/restHR→int|null
- Paso 3 StepHeader: fondo verde en vez de naranja (ref: L1 §3.2 StepHeader)
- ProfileSummary: grid 2 cols con fallbacks ("—" para vacíos, "Se estimará" para ftp/max_hr)
- AICoachWelcome: usa CSS var `--ai-bg` y `--ai-border`
- Usar constantes de `shared` (GOALS, ONBOARDING_STEPS)

### Referencia de Diseño

- Spec funcional L1: §3.2 (OnboardingScreen completo), §5 (datos), §6 (flujos)
- Diseño técnico L2: §2.2 (árbol Onboarding), §2.3 (OnboardingWizard, ProfileSummary, AICoachWelcome), §4 (flujo INSERT)
- PRD: F01 (criterios de aceptación)

---

## Issue 8: Actualizar middleware para redirección a onboarding

**Labels**: `type:feature`, `priority:p1`, `phase:1`
**Depende de**: Issue 3, Issue 7
**Estimación**: ~1.5h

### Descripción

Actualizar la lógica de protección de rutas para que los usuarios autenticados sin perfil completo sean redirigidos a `/onboarding`. La verificación se hace en las pages (no en el middleware) para evitar consultas a DB en cada request.

### Criterios de Aceptación

- [ ] Usuario autenticado sin registro en `users` → redirigido a `/onboarding` al acceder a `/`
- [ ] Usuario autenticado con registro en `users` → accede a `/` normalmente
- [ ] Usuario autenticado con registro en `users` que va a `/onboarding` → redirigido a `/`
- [ ] Usuario no autenticado → redirigido a `/login` (comportamiento existente)
- [ ] No se añade consulta a DB en el middleware (verificación en pages, ref: L2 §8 Riesgo 1)
- [ ] `pnpm build` pasa sin errores
- [ ] `pnpm lint` pasa sin errores
- [ ] `pnpm typecheck` pasa sin errores

### Archivos Afectados

**Modificar**:
- `apps/web/src/app/page.tsx` — Añadir consulta a `users` + redirect condicional a `/onboarding`
- `apps/web/src/app/(auth)/onboarding/page.tsx` — Añadir check: si ya tiene perfil → redirect a `/`
- `apps/web/src/lib/supabase/middleware.ts` — Añadir `/onboarding` a rutas que requieren auth (no excluir)

### Notas Técnicas

- En `page.tsx` (home): `const { data: profile } = await supabase.from('users').select('id').eq('id', user.id).single()`. Si no existe → redirect `/onboarding`
- En `onboarding/page.tsx`: misma consulta pero redirect inverso — si existe → redirect `/`
- El middleware NO hace consulta a DB — solo valida auth token (como ahora)
- `/onboarding` debe requerir auth en el middleware (no excluirla como `/login`)

### Referencia de Diseño

- Spec funcional L1: §2 (Condiciones de acceso)
- Diseño técnico L2: §8 (Riesgo 1 — Middleware)
- PRD: F01 ("Si el usuario ya existe, va directo al dashboard")

---

## Issue 9: Inicializar shadcn/ui

**Labels**: `type:feature`, `priority:p1`, `phase:1`
**Depende de**: Issue 1
**Estimación**: ~0.5h

### Descripción

Inicializar shadcn/ui en `apps/web` e instalar el componente `Button`. Esto prepara la base para uso de componentes shadcn en pantallas futuras.

### Criterios de Aceptación

- [ ] `components.json` creado en `apps/web` con configuración correcta
- [ ] `shadcn/ui` configurado para usar Tailwind CSS y la estructura de `src/components/ui/`
- [ ] Componente `Button` instalado y disponible en `apps/web/src/components/ui/button.tsx`
- [ ] `pnpm build` pasa sin errores
- [ ] `pnpm lint` pasa sin errores
- [ ] `pnpm typecheck` pasa sin errores

### Archivos Afectados

**Crear**:
- `apps/web/components.json` — Configuración de shadcn/ui
- `apps/web/src/components/ui/button.tsx` — Componente Button base
- `apps/web/src/lib/utils.ts` — Función `cn()` para merge de clases (creada por shadcn init)

**Modificar**:
- `apps/web/package.json` — Nuevas dependencias de shadcn (class-variance-authority, clsx, tailwind-merge)
- `apps/web/src/app/globals.css` — Variables CSS base de shadcn (si las añade el init)

### Notas Técnicas

- Ejecutar `npx shadcn@latest init` dentro de `apps/web/`
- Seleccionar estilo default, color neutral, CSS variables NO (usamos nuestro propio design system)
- Después: `npx shadcn@latest add button`
- Ref: ADR-003 en L2 para justificación de uso limitado de shadcn

### Referencia de Diseño

- Diseño técnico L2: ADR-003, §7 (Dependencias)

---

## Issue 10: Tests unitarios de componentes y validación

**Labels**: `type:test`, `priority:p1`, `phase:1`
**Depende de**: Issue 2, Issue 6, Issue 7
**Estimación**: ~2h

### Descripción

Crear tests unitarios para los schemas Zod, constantes compartidas, y los componentes base del onboarding.

### Criterios de Aceptación

- [ ] Tests de `onboardingSchema`: valida datos correctos, rechaza nombre vacío, rechaza edad fuera de rango, acepta campos opcionales vacíos
- [ ] Tests de `goalEnum`: acepta los 4 valores válidos, rechaza valores inválidos
- [ ] Tests de constantes: GOALS tiene 4 entries, ONBOARDING_STEPS tiene 4 entries
- [ ] Tests de StepIndicator: renderiza el número correcto de dots, marca el activo
- [ ] Tests de GoalCard: renderiza label y description, muestra check cuando active
- [ ] `pnpm test` pasa sin errores
- [ ] `pnpm build` pasa sin errores

### Archivos Afectados

**Crear**:
- `packages/shared/src/schemas/user-profile.test.ts` — Tests de schemas Zod
- `apps/web/src/components/step-indicator.test.tsx` — Tests de StepIndicator
- `apps/web/src/components/goal-card.test.tsx` — Tests de GoalCard

### Notas Técnicas

- Para tests en `packages/shared`: usar vitest (si no está configurado, añadir configuración mínima)
- Para tests en `apps/web`: usar vitest + @testing-library/react
- Priorizar tests de validación Zod (alta cobertura, bajo coste) sobre tests de rendering
- No se crean tests E2E en esta issue

### Referencia de Diseño

- Diseño técnico L2: §3 (schemas con reglas de validación)
- CLAUDE.md: "Unitarios para lógica compleja (utils, hooks, reglas de entrenamiento)"

---

## Resumen de Dependencias

```
Issue 1: Infraestructura de tema                  ← base (sin dependencias)
Issue 2: Schema Zod + constantes                  ← base (sin dependencias)
Issue 3: Tabla users en Supabase                  ← base (sin dependencias)
Issue 9: Inicializar shadcn/ui                    ← depende de 1
Issue 4: Migrar login a route group (auth)        ← depende de 1
Issue 5: Rediseñar pantalla Login                 ← depende de 1, 4
Issue 6: Componentes base onboarding              ← depende de 1
Issue 7: Wizard de onboarding                     ← depende de 2, 3, 6
Issue 8: Redirección a onboarding                 ← depende de 3, 7
Issue 10: Tests unitarios                         ← depende de 2, 6, 7
```

---

## Orden de Implementación Recomendado

### Capa 1 — Infraestructura (parallelizable)
1. **Issue 1**: Tema dark/light + fuente + CSS variables
2. **Issue 2**: Schema Zod + constantes en shared
3. **Issue 3**: Tabla users en Supabase

### Capa 2 — Estructura y componentes
4. **Issue 4**: Migrar a route group (auth)
5. **Issue 9**: Inicializar shadcn/ui
6. **Issue 6**: Componentes base del onboarding

### Capa 3 — Pantallas
7. **Issue 5**: Rediseñar pantalla Login
8. **Issue 7**: Wizard de onboarding

### Capa 4 — Integración y calidad
9. **Issue 8**: Redirección a onboarding
10. **Issue 10**: Tests unitarios
