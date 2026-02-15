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

## Cambios de Schema en Supabase — Workflow de Migraciones

Cuando una feature requiere **modificar la estructura de la BD** (nuevo campo, tabla, índice, etc.):

### Paso a paso

1. **Crear la migración SQL**
   ```bash
   # Nombre: NNN_feature-description.sql (ej: 005_add_weather_to_activities.sql)
   # Ubicación: supabase/migrations/
   # Contenido: SQL puro, comentado, reversible si es posible
   ```

2. **Probar localmente**
   ```bash
   supabase link --project-ref <PROJECT_REF>
   supabase migration up
   # Verificar cambios en la BD local
   ```

3. **Documentar cambios en el código**
   - Si se añade campo: actualizar schema Zod en `packages/shared`
   - Si se modifica tabla: revisar RLS policies en la migración
   - Si afecta API: documentar endpoint o agregar novo si aplica

4. **Incluir en la PR**
   - Migración SQL en `supabase/migrations/`
   - Código backend/frontend que consume el cambio
   - Tests que validen el nuevo schema
   - En la descripción de PR: mención clara "Migración DB: NNN"

5. **Checklist de PR**
   ```markdown
   - [ ] Migración SQL testeada localmente
   - [ ] Schema Zod actualizado en `packages/shared` si aplica
   - [ ] RLS policies revisadas en la migración
   - [ ] Tests de integración incluidos
   - [ ] Documentación de cambios en endpoint si aplica
   ```

### Nota: Automatización futura (Fase 4)

En fases posteriores, se planea automatizar migraciones via GitHub Actions:
- Agente **R6 — Migration Manager**: detectar `.sql` nuevos, aplicar en CI, validar cambios
- Requerirá: `SUPABASE_ACCESS_TOKEN` en GitHub Secrets
- Beneficio: migraciones applicadas automáticamente antes de PR merge

Por ahora, el proceso manual + documentado es suficiente para mantener integridad.

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

### Pantallas (frontend) — Todas migradas a API backend ✅
| Ruta | Pantalla | Datos |
|------|----------|-------|
| `/auth/login` | Login (Google OAuth) | Supabase Auth |
| `/onboarding` | Onboarding wizard (4 pasos) | API backend |
| `/` | Dashboard (KPIs, gráficas, coach IA) | API backend |
| `/activities` | Lista de actividades (filtros, búsqueda) | API backend |
| `/activities/[id]` | Detalle de actividad (métricas, chart km, análisis IA) | API backend |
| `/activities/import` | Importar actividad (manual + .fit/.gpx) | API backend |
| `/plan` | Planificación semanal (7 días, tips) | API backend |
| `/insights` | Insights (comparativas, radar, análisis) | API backend |
| `/profile` | Perfil (datos, zonas, ajustes) | API backend |

### Backend API — Fase 3 Bloques 0-8 Completados ✅

| Bloque | Endpoints |
|--------|-----------|
| 0 — Infra | `/health`, plugins (auth, cors, errors, env, supabase, anthropic) |
| 1 — Perfil | `GET/PATCH /api/v1/profile` |
| 2 — Actividades | `GET/POST/PATCH/DELETE /api/v1/activities`, `GET /activities/:id/metrics` |
| 3 — Insights | `GET /api/v1/insights`, `GET /insights/overload-check` |
| 4 — Training Rules | `calculateTrainingLoad`, `evaluateTrainingAlerts`, `calculateNP` en shared |
| 5 — IA | `POST /ai/analyze-activity`, `POST /ai/weekly-plan`, `POST /ai/weekly-summary`, `GET /ai/coach-tip` |
| 6 — Plan | `GET/PATCH/DELETE /api/v1/plan` |
| 7 — Import | `POST /api/v1/activities/upload` (.fit/.gpx, NP, Garmin extensions) |
| 8 — Frontend Migration | Todas las pantallas migradas de Supabase directo → API backend |

### Agentes Remotos — Fase 4 ✅

| Agente | Workflow | Trigger |
|--------|----------|---------|
| R1 — Issue Analyzer | `ai-analyze-issue.yml` | Label `ai-analyze` |
| R2 — PR Generator | `ai-generate-pr.yml` | Label `ai-generate-pr` |
| R3 — PR Reviewer | `ai-review-pr.yml` | PR opened/synchronize |
| R5 — Doc Generator | `ai-update-changelog.yml` | PR merged |
| @claude Interactive | `ai-claude-interactive.yml` | `@claude` en comentarios |
| Label Sync | `ai-label-sync.yml` | Push `.github/labels.yml` |

- **Modelos**: Haiku 4.5 (R1, R3, R5 — read-only/ligeros), Sonnet 4.5 (R2 — genera código), Sonnet 4 (@claude — interactivo)
- **Action**: `anthropics/claude-code-action@v1`
- **Labels**: 16 en `.github/labels.yml` (AI pipeline + tipo + prioridad + fase)
- **CHANGELOG**: Auto-actualizado por R5 en cada merge

### Métricas
- **Componentes**: 32 en `apps/web/src/components/`
- **Tests**: 29 archivos (290 tests) — 72 web + 82 shared + 136 API
- **Migraciones SQL**: 4 (001 schema, 002 onboarding, 003 activity_type, 004 ai_cache)
- **Schemas Zod compartidos**: 5 (user-profile, activity, weekly-plan, insights, ai-response)
- **Constantes compartidas**: 7 módulos + 2 utils (training-calculations, training-rules)
- **Workflows CI/CD**: 8 (2 CI + 5 AI agents + 1 label sync)

---

## Gotchas conocidos

### General
- GitHub repo owner es `luismiguelmartin` (no `lm-martin`). Verificar en URLs de badges y links.

### Frontend
- `activity_type` ENUM en DB usa 5 tipos de entrenamiento: `intervals`, `endurance`, `recovery`, `tempo`, `rest` (migración 003). No confundir con modalidad (outdoor/indoor).
- Los mockups JSX en `docs/design/` están excluidos de git. Usar `docs/DESIGN-SYSTEM.md` como fuente de verdad documentada.
- Padding de páginas está centralizado en `app-shell.tsx` (`p-4 md:p-8`), no ponerlo en páginas individuales.
- Para pasar iconos de Server→Client Components, usar `ReactNode` (JSX pre-renderizado), no `LucideIcon` (función).

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
