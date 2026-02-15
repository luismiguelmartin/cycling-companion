# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Contexto del Proyecto

**Cycling Companion** es una plataforma web de análisis y planificación de entrenamiento para ciclistas amateur (40+). Banco de pruebas para un pipeline AI-first de integración de IA en el ciclo de vida del desarrollo.

**Propuesta de valor**: Entrenador IA personal que traduce datos de ciclismo en recomendaciones accionables.

**Fase actual**: Fase 2 — MVP funcional (frontend completo, backend/IA pendientes)

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
│   ├── migrations/   → Scripts SQL incrementales (001, 002, 003)
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

## Pipeline AI-First

El desarrollo sigue un pipeline multi-agente (local + remoto). Detalle completo en `docs/03-AGENTS-AND-DEVELOPMENT-PLAN.md`.

**Labels del sistema**: `ai-analyze`, `ai-generate-pr`, `ai-generated`, `ai-reviewed`, `priority:p0/p1/p2`, `type:feature/bug/refactor/docs`, `phase:1/2/3`

### Metodología por Fase

**Fase 2 (Frontend):**
- Pipeline completo: L1 (UX) → L2 (Técnico) → L3 (Issues) → L4 (Implementación)
- Specs L1/L2/L3 generadas **antes** de implementar
- 22 archivos de specs en `docs/specs/`

**Fase 3 (Backend) — Bloques 0-2:**
- Implementación directa desde plan general (`phase3-backend-plan.md`)
- Specs L2 (diseño técnico) generadas **retroactivamente** tras commits:
  - `L2-backend-00-infrastructure.md` (Bloque 0: infraestructura base)
  - `L2-backend-01-profile.md` (Bloque 1: endpoints GET/PATCH perfil)
  - `L2-backend-02-activities.md` (Bloque 2: CRUD actividades)
- **Rationale**: Contratos API claros en PRD, schemas Zod compartidos, iteración rápida

**Fase 3 (Backend) — Bloque 3+:**
- Pipeline completo: L1 → L2 → L3 → L4 → L5 (QA/Tester)
- Specs generadas **antes** de implementar
- **Rationale**: Lógica IA compleja, prompts a diseñar, parseo archivos, mayor beneficio de diseño previo

**Conclusión**: Metodología híbrida — aplicar pipeline completo donde aporta más valor (features complejas), permitir implementación directa para CRUD predecible.

---

## Notas para Claude Code

### Al trabajar en nuevas features:
1. Revisar el PRD (`docs/02-PRD.md`) para entender el contexto funcional
2. Consultar `docs/DESIGN-SYSTEM.md` para implementar UI (pantallas, tokens, componentes, guía de conversión JSX→Tailwind)
3. Los mockups JSX originales están en `docs/design/` (excluidos de git) — usar `docs/DESIGN-SYSTEM.md` como referencia documentada
4. Mantener consistencia con el tono y estructura del código existente
5. No sobre-ingeniería: implementar solo lo necesario para la issue actual

### Al crear issues:
- Usar template estructurado: descripción, criterios de aceptación, archivos afectados
- Asignar labels apropiados: `priority:*`, `type:*`, `phase:*`
- Mantener issues pequeñas y enfocadas (1-3 horas de trabajo)

### Al abrir PRs:
- Incluir screenshots si hay cambios visuales
- Marcar con label `ai-generated` si fue generada por agente remoto
- Self-review: revisar diff completo antes de pedir review

---

## Estado de Implementación

### Pantallas implementadas (frontend) — Fase 2 Completada ✅
| Ruta | Pantalla | Datos |
|------|----------|-------|
| `/auth/login` | Login (Google OAuth) | Supabase Auth |
| `/onboarding` | Onboarding wizard (4 pasos) | Supabase |
| `/` | Dashboard (KPIs, gráficas, coach IA) | Supabase + mock |
| `/activities` | Lista de actividades (filtros, búsqueda) | Supabase |
| `/activities/[id]` | Detalle de actividad (métricas, chart) | Supabase |
| `/activities/import` | Importar actividad (manual/archivo) | Solo UI |
| `/plan` | Planificación semanal (7 días, tips) | Implementada (Fase 2) |
| `/insights` | Insights (comparativas, radar, análisis) | Implementada (Fase 2) |
| `/profile` | Perfil (datos, zonas, ajustes) | Supabase |

### Próximos Pasos — Fase 3: Backend + IA
- **API Fastify**: Solo tiene `/health`. Implementar endpoints CRUD y de IA.
- **Integración Claude API**: Entrenador virtual (análisis actividades, generación planes).
- **Importación real**: Conectar pantalla Import con API backend.
- **weekly_plans real**: Migración SQL; Plan consume datos reales de Supabase.

### Métricas
- **Componentes**: 32 en `apps/web/src/components/`
- **Tests**: 16 archivos (103 tests) — componentes, utils, schemas
- **Migraciones SQL**: 3 (001 schema inicial, 002 onboarding, 003 activity_type enum)
- **Schemas Zod compartidos**: 4 (user-profile, activity, weekly-plan, insights)
- **Constantes compartidas**: 7 módulos

---

## Gotchas conocidos

- `activity_type` ENUM en DB usa 5 tipos de entrenamiento: `intervals`, `endurance`, `recovery`, `tempo`, `rest` (migración 003). No confundir con modalidad (outdoor/indoor).
- Los mockups JSX en `docs/design/` están excluidos de git. Usar `docs/DESIGN-SYSTEM.md` como fuente de verdad documentada.
- Padding de páginas está centralizado en `app-shell.tsx` (`p-4 md:p-8`), no ponerlo en páginas individuales.
- Para pasar iconos de Server→Client Components, usar `ReactNode` (JSX pre-renderizado), no `LucideIcon` (función).

---

## Documentos de Referencia

| Documento | Ruta |
|-----------|------|
| Visión del producto | `docs/01-PRODUCT-VISION.md` |
| PRD completo (modelo de datos, endpoints, flujo IA) | `docs/02-PRD.md` |
| Plan de agentes y desarrollo | `docs/03-AGENTS-AND-DEVELOPMENT-PLAN.md` |
| Design system (pantallas, tokens, componentes, conversión JSX→Next.js) | `docs/DESIGN-SYSTEM.md` |
| Especificaciones por pantalla (22 archivos L1/L2/L3 para 8 pantallas) | `docs/specs/` |
| Configuración Google OAuth | `docs/GOOGLE-OAUTH-SETUP.md` |
| Configuración Supabase | `docs/SUPABASE-SETUP.md` |
