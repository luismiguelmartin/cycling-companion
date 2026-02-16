# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Contexto del Proyecto

**Cycling Companion** es una plataforma web de análisis y planificación de entrenamiento para ciclistas amateur (40+). Banco de pruebas para un pipeline AI-first de integración de IA en el ciclo de vida del desarrollo.

**Propuesta de valor**: Entrenador IA personal que traduce datos de ciclismo en recomendaciones accionables.

**Fase actual**: Fase 4 completada ✅ — Pipeline AI-first validado end-to-end (Issue #17 → PR #18, ~$0.38)

---

## Stack Tecnológico

### Monorepo con Turborepo + pnpm
```
cycling-companion/
├── apps/
│   ├── web/          → Next.js 16 (App Router, React 19, TypeScript, Tailwind CSS)
│   └── api/          → Fastify 5 (TypeScript, Zod validation)
├── packages/
│   └── shared/       → Types compartidos, validaciones Zod, constantes
├── supabase/
│   ├── migrations/   → Scripts SQL incrementales (001, 002, 003, 004)
│   └── seed*.sql     → Datos de prueba
└── docs/
    ├── specs/        → Especificaciones L1 (UX), L2 (técnico), L3 (issues)
    ├── design/       → Mockups JSX de referencia (excluidos de git)
    └── *.md          → Visión, PRD, agentes, design system, setup guides
```

- **Base de datos**: Supabase (PostgreSQL + Auth + Storage + RLS)
- **IA**: Claude API (Anthropic) para recomendaciones del entrenador virtual
- **Deploy**: Vercel (frontend), Render (API), Supabase (DB)

---

## Comandos

### Setup inicial
```bash
pnpm install
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env
```

### Desarrollo
```bash
pnpm dev                    # Todo el monorepo (web + api)
pnpm --filter web dev       # Solo frontend
pnpm --filter api dev       # Solo backend
```

### Build y validación
```bash
pnpm build                  # Build de todo el proyecto
pnpm lint                   # ESLint en los 3 paquetes (vía Turborepo)
pnpm typecheck              # Type-check en los 3 paquetes
pnpm test                   # Tests en los 3 paquetes
pnpm test --filter=api      # Solo tests API
pnpm test --filter=web      # Solo tests frontend
pnpm test --filter=shared   # Solo tests shared
pnpm format                 # Prettier: formatear todo
pnpm format:check           # Prettier: verificar formato sin modificar
```

### Variables de entorno
```bash
# apps/web/.env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=http://localhost:3001

# apps/api/.env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
PORT=3001
FRONTEND_URL=http://localhost:3000  # URL del frontend para CORS
```

---

## Linting y Formatting

- **ESLint 9** con flat config (`eslint.config.mjs` en la raíz)
  - Base: `@eslint/js` recommended + `typescript-eslint` recommended
  - `apps/web`: `@next/eslint-plugin-next` + `react` + `react-hooks` + globals browser
  - `apps/api`: globals node
  - `packages/shared`: solo TypeScript base + globals node
  - `eslint-config-prettier` al final para desactivar conflictos
- **Prettier** (`.prettierrc.json`): semi, doble comilla, tabWidth 2, trailingComma all, printWidth 100
- Los archivos de `docs/` y `CLAUDE.md` están excluidos de Prettier (ver `.prettierignore`)

---

## Convenciones de Desarrollo

### TypeScript
- TypeScript estricto (no `any`, `strict: true`)
- Compartir types entre frontend y backend vía `packages/shared`
- Definir validaciones Zod una vez, reutilizar en API y frontend

### Componentes React (Next.js)
- App Router (no Pages Router), Server Components por defecto
- Nomenclatura: PascalCase para componentes, kebab-case para archivos
- Co-locate componentes con sus tests: `Button.tsx`, `Button.test.tsx`

### API (Fastify)
- Cada route con schema Zod para validación automática
- Manejo de errores consistente con códigos HTTP apropiados
- RLS en Supabase: nunca desactivar, confiar en políticas de base de datos

### Estilos
- Tailwind CSS: utility classes, evitar CSS custom
- shadcn/ui: componentes base, personalizar con Tailwind

### Git y PRs
- Commits descriptivos en español (formato: `feat:`, `fix:`, `refactor:`, `docs:`)
- Una PR por issue, enlazar con `Closes #N`
- PRs pequeñas y enfocadas (< 400 líneas si es posible)

### Tests
- Unitarios para lógica compleja (utils, hooks, reglas de entrenamiento)
- Integración para endpoints API críticos
- E2E solo para flujos principales (login, importar actividad, ver plan)

---

## Seguridad

- **RLS activo**: cada usuario solo ve sus propios datos
- **Secrets**: nunca commitear API keys, usar variables de entorno
- Validar todos los inputs con Zod en API

---

## Migraciones Supabase

- Archivo SQL en `supabase/migrations/NNN_description.sql`
- Probar: `supabase link --project-ref <REF> && supabase migration up`
- Actualizar schema Zod en `packages/shared` si se añaden/modifican campos
- Revisar RLS policies en cada migración
- Se aplican manualmente (no hay agente automatizado)

---

## Pipeline AI-First

El desarrollo sigue un pipeline multi-agente (local + remoto). Detalle completo en `docs/03-AGENTS-AND-DEVELOPMENT-PLAN.md`.

**Labels del sistema**: `ai-analyze`, `ai-generate-pr`, `ai-generated`, `ai-reviewed`, `priority:p0/p1/p2`, `type:feature/bug/refactor/docs/test`, `phase:1/2/3/4`

### Metodología

Metodología híbrida: pipeline completo (L1→L2→L3→L4) para features complejas, implementación directa para CRUD predecible. Specs en `docs/specs/` (28 archivos).

---

## Notas para Claude Code

### Al trabajar en nuevas features:
1. Revisar el PRD (`docs/02-PRD.md`) para entender el contexto funcional
2. Consultar `docs/DESIGN-SYSTEM.md` para implementar UI (pantallas, tokens, componentes, guía de conversión JSX→Tailwind)

---

## Estado de Implementación

### Resumen
- **Frontend**: 9 pantallas (login, onboarding, dashboard, activities, import, plan, insights, profile) — todas migradas a API backend ✅
- **Backend**: 8 bloques completados (infra, perfil, actividades, insights, training rules, IA, plan, import) — 15+ endpoints bajo `/api/v1`
- **Agentes remotos**: 5 agentes (R1 analyzer, R2 PR generator, R3 reviewer, R5 changelog, @claude interactive) + label sync
- **Tests**: ~300 (72 web + 90 shared + 136 API)

---

## Gotchas conocidos

### General
- GitHub repo owner es `luismiguelmartin` (no `lm-martin`). Verificar en URLs de badges y links.

### Agentes Remotos (GitHub Actions)
- `--allowedTools` es OBLIGATORIO en `claude-code-action@v1`. Sin él, todas las tools son denegadas por defecto.
- Archivos `/tmp/` NO son accesibles por la action. Inyectar contexto inline en el prompt.
- `allowed_bots: "claude"` necesario en R3 para aceptar PRs creadas por R2.

### Frontend
- `activity_type` ENUM en DB usa 5 tipos de entrenamiento: `intervals`, `endurance`, `recovery`, `tempo`, `rest` (migración 003). No confundir con modalidad (outdoor/indoor).
- Los mockups JSX en `docs/design/` están excluidos de git. Usar `docs/DESIGN-SYSTEM.md` como fuente de verdad documentada.
- Padding de páginas está centralizado en `app-shell.tsx` (`p-4 md:p-8`), no ponerlo en páginas individuales.
- Para pasar iconos de Server→Client Components, usar `ReactNode` (JSX pre-renderizado), no `LucideIcon` (función).

### Shared Package (Node ESM)
- `packages/shared` usa `"type": "module"` → **TODOS los imports relativos deben llevar extensión `.js`** (ej: `from "./activity.js"`). Sin ella → `ERR_MODULE_NOT_FOUND` en producción (Node ESM puro).
- `shared/package.json` apunta a `"main": "./dist/index.js"`. Nunca apuntar a `./src/index.ts` — funciona en dev con tsx pero falla en producción con Node puro.
- `tsconfig.base.json` usa `moduleResolution: "bundler"` que NO añade `.js` automáticamente al compilar — hay que ponerlas en el source `.ts`.

### Backend
- FitParser mock en tests debe ser una clase, no arrow function: `class MockFitParser { parseAsync = mockFn }`
- `@fastify/multipart` retorna 406 (no 400) cuando Content-Type no es multipart.
- Multipart fields en Fastify se acceden via `data.fields.name.value`.
- Batch insert de métricas en chunks de 1000 para evitar límites de DB.
- Auth en API: JWT via `supabase.auth.getUser(token)` en plugin `auth.ts` con `fastify-plugin`.
- `ActivityCreateInput` (z.input) para parámetros que aceptan defaults de Zod (ej: `type` con default "endurance").
- GPX Garmin extensions: gpxjs genera `ext["gpxtpx:TrackPointExtension"]["gpxtpx:hr"]`, no `ext.heartRate`. Usar `extractFromExtensions()`.
- `createActivity` acepta `normalizedPowerWatts` como 4to parámetro para TSS más preciso.
- Análisis IA se dispara fire-and-forget tras import: `analyzeActivity(userId, id).catch(() => {})`.
- API client split: `lib/api/server.ts` (Server Components) y `lib/api/client.ts` (Client Components) — NO mezclar.

---

## Documentos de Referencia

| Documento | Ruta |
|-----------|------|
| Visión del producto | `docs/01-PRODUCT-VISION.md` |
| PRD completo (modelo de datos, endpoints, flujo IA) | `docs/02-PRD.md` |
| Plan de agentes y desarrollo | `docs/03-AGENTS-AND-DEVELOPMENT-PLAN.md` |
| Design system (pantallas, tokens, componentes, conversión JSX→Next.js) | `docs/DESIGN-SYSTEM.md` |
| Especificaciones (28 archivos L1/L2/L3: 8 pantallas + 9 bloques backend + Fase 4) | `docs/specs/` |
| Spec L2 Fase 4: Agentes Remotos | `docs/specs/L2-phase4-remote-agents.md` |
| Prompts de agentes remotos (R1, R2, R3, R5) | `prompts/remote/` |
| Configuración Google OAuth | `docs/GOOGLE-OAUTH-SETUP.md` |
| Configuración Supabase | `docs/SUPABASE-SETUP.md` |
