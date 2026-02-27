# CLAUDE.md

Guía para Claude Code. Contexto para agentes remotos en `AGENTS.md`. Estado del proyecto en `docs/PROJECT-STATUS.md`.

---

## Contexto

**Cycling Companion** — Plataforma web de entrenamiento para ciclistas amateur (40+). Entrenador IA personal que traduce datos de ciclismo en recomendaciones accionables. Banco de pruebas para un pipeline AI-first de desarrollo.

---

## Stack

Monorepo Turborepo + pnpm:
- `apps/web/` → Next.js 16 (App Router, React 19, TypeScript, Tailwind CSS, shadcn/ui)
- `apps/api/` → Fastify 5 (TypeScript, Zod)
- `packages/shared/` → Types Zod, constantes, utils compartidos, motor de métricas ciclistas v2
- `supabase/` → Migraciones SQL + seeds
- DB: Supabase (PostgreSQL + Auth + RLS) · IA: Claude API · Deploy: Vercel + Render + Supabase

---

## Comandos

```bash
pnpm install                # Setup
pnpm dev                    # Todo el monorepo
pnpm --filter web dev       # Solo frontend
pnpm --filter api dev       # Solo backend
pnpm build                  # Build completo
pnpm lint                   # ESLint (3 paquetes)
pnpm typecheck              # TypeScript (3 paquetes)
pnpm test                   # Vitest (3 paquetes)
pnpm test --filter=web      # Solo web (131 tests)
pnpm test --filter=api      # Solo API (279 tests)
pnpm test --filter=shared   # Solo shared (205 tests)
pnpm format                 # Prettier --write
pnpm format:check           # Prettier --check
```

Variables de entorno: ver `apps/web/.env.example` y `apps/api/.env.example`.

---

## Convenciones

- **TypeScript estricto**: no `any`, `strict: true`
- **Zod schemas**: definir en shared, reutilizar en API y frontend
- **React**: Server Components por defecto, Client solo con interactividad
- **Archivos**: PascalCase componentes, kebab-case archivos, co-locate tests
- **Estilos**: Tailwind utility classes, shadcn/ui como base, iconos Lucide React (nunca emojis)
- **Git**: commits en español (`feat:` / `fix:` / `refactor:` / `docs:`), PRs con `Closes #N`
- **Prettier**: semi, doble comilla, tabWidth 2, trailingComma all, printWidth 100. Se ejecuta automáticamente en pre-commit vía Husky + lint-staged
- **ESLint 9**: flat config (`eslint.config.mjs` raíz). `@next/eslint-plugin-next` + `react` + `react-hooks` en web, globals node en api, `eslint-config-prettier` al final
- **Seguridad**: RLS activo siempre, nunca commitear API keys, validar inputs con Zod
- **Migraciones**: SQL en `supabase/migrations/NNN_*.sql`, actualizar schemas Zod si cambia DB

### Al trabajar en nuevas features:
1. Revisar `docs/02-PRD.md` para contexto funcional
2. Consultar `docs/DESIGN-SYSTEM.md` para UI (tokens, componentes, conversión JSX→Tailwind)

---

## Gotchas

### Shared Package (Node ESM)
- Imports relativos DEBEN llevar `.js` → `from "./foo.js"`. Sin ella → `ERR_MODULE_NOT_FOUND` en producción
- `shared/package.json`: `"main": "./dist/index.js"` (NO `./src/index.ts`)
- `moduleResolution: "bundler"` NO añade `.js` al compilar — ponerlas en el source `.ts`

### Frontend
- Bash: paths con `(app)` DEBEN ir entre comillas — `git add "apps/web/src/app/(app)/..."` (sin comillas → syntax error)
- `demo-modal.tsx` usa `ProfileContent` directamente — actualizar props si cambia la interfaz
- `activity_type` ENUM: `intervals`, `endurance`, `recovery`, `tempo`, `rest` (no confundir con outdoor/indoor)
- Padding centralizado en `app-shell.tsx` (`p-4 md:p-8`), no en páginas individuales
- Iconos Server→Client: usar `ReactNode` (JSX pre-renderizado), no `LucideIcon` (función)
- API client split: `lib/api/server.ts` (Server Components) y `lib/api/client.ts` (Client Components) — NO mezclar
- Resiliencia SSR: llamadas `apiGet()` en Server Components DEBEN tener try/catch — sin protección, la página crashea si la API no responde
- Timeouts SSR: `apiGet`/`apiPatch` usan `AbortSignal.timeout(9000)` para evitar 504 en Vercel
- Coach tip: se carga client-side (`AICoachCardClient`) para no bloquear SSR con llamada IA lenta
- Error boundary: `app/(app)/error.tsx` captura errores no manejados en rutas protegidas
- Sin `@testing-library/user-event` — usar `fireEvent` de `@testing-library/react`

### Backend
- FitParser mock en tests: clase, no arrow function → `class MockFitParser { parseAsync = mockFn }`
- `@fastify/multipart` retorna 406 (no 400) si Content-Type no es multipart
- Multipart fields: `data.fields.name.value`
- GPX Garmin extensions: `ext["gpxtpx:TrackPointExtension"]["gpxtpx:hr"]`, no `ext.heartRate`
- Auth: JWT via `supabase.auth.getUser(token)` en plugin `auth.ts`
- Análisis IA fire-and-forget tras import: `analyzeActivity(userId, id).catch(() => {})`
- CORS: array de orígenes en `cors.ts` (`FRONTEND_URL` + localhost en dev). Requiere `FRONTEND_URL` en Render
- Rate limit IA: `rpc("check_ai_rate_limit")` con fallback a query directa si la función SQL no existe

### Strava Integration (`services/strava/`)
- Tokens cifrados con AES-256-GCM (`utils/crypto.ts`). Requiere `STRAVA_TOKEN_ENCRYPTION_KEY` (32 bytes base64)
- 4 servicios: api (HTTP client), connection (CRUD BD + auto-refresh), mapper (Strava→schema propio), import (importar, webhook, backfill)
- `StravaAuthError` (401) y `StravaRateLimitError` (429) extienden `AppError`
- Rutas: públicas (callback, webhook) fuera del scope auth, protegidas (auth-url, status, disconnect, sync) dentro
- `createActivity` param `extra?: { strava_id, source }` para campos que `activityCreateSchema` omite
- Webhook POST responde 200 inmediatamente, procesa en background (Strava requiere < 2s)
- Backfill secuencial para respetar rate limits, se detiene en `StravaRateLimitError`

### Metrics v2 (`packages/shared/src/metrics/`)
- Pipeline: sanitize → sort/dedup → resample 1Hz → speed → movement → compute-summary
- Todos los módulos son funciones puras, sin side effects, 100% testeables
- `computeActivitySummary(trackPoints, ftp, maxHr)` es el orquestador principal
- `activityCreateSchema`: `distance_km` es `.positive().nullable()` — NO admite 0, pasar `null` en su lugar
- `processUpload` ignora `summary.distance_km` si es 0 (datos sin GPS → usa distancia del parser)
- Migración `006_enhanced_metrics.sql`: 11 columnas nuevas en `activities`, 3 en `activity_metrics` (lat, lon, elevation)
- Frontend: segunda fila de métricas condicional (`hasAdvancedMetrics` = `duration_moving` o `normalized_power` no null)

### Testing
- Workflow de validación: `pnpm typecheck` → `pnpm lint` → `pnpm test` (ejecutar los 3 antes de commit)
- Mocks de Supabase en API tests: debe incluir `rpc: vi.fn()` además de `from: vi.fn()`
- IDs en tests: usar UUIDs válidos (`00000000-0000-0000-0000-000000000001`), no strings como `"user-123"`
- Frontend tests: `fireEvent` + `waitFor` para async, `vi.mock("next/navigation")` para router/searchParams

### Agentes Remotos
- `--allowedTools` OBLIGATORIO en `claude-code-action@v1`
- Archivos `/tmp/` NO accesibles por la action — inyectar contexto inline
- `allowed_bots: "claude"` necesario en R3 para PRs de R2
- GitHub repo owner: `luismiguelmartin` (no `lm-martin`)
