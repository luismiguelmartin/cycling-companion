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
- `packages/shared/` → Types Zod, constantes, utils compartidos
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
pnpm test --filter=web      # Solo web (112 tests)
pnpm test --filter=api      # Solo API (145 tests)
pnpm test --filter=shared   # Solo shared (90 tests)
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
- **Prettier**: semi, doble comilla, tabWidth 2, trailingComma all, printWidth 100
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
- `activity_type` ENUM: `intervals`, `endurance`, `recovery`, `tempo`, `rest` (no confundir con outdoor/indoor)
- Padding centralizado en `app-shell.tsx` (`p-4 md:p-8`), no en páginas individuales
- Iconos Server→Client: usar `ReactNode` (JSX pre-renderizado), no `LucideIcon` (función)
- API client split: `lib/api/server.ts` (Server Components) y `lib/api/client.ts` (Client Components) — NO mezclar

### Backend
- FitParser mock en tests: clase, no arrow function → `class MockFitParser { parseAsync = mockFn }`
- `@fastify/multipart` retorna 406 (no 400) si Content-Type no es multipart
- Multipart fields: `data.fields.name.value`
- GPX Garmin extensions: `ext["gpxtpx:TrackPointExtension"]["gpxtpx:hr"]`, no `ext.heartRate`
- Auth: JWT via `supabase.auth.getUser(token)` en plugin `auth.ts`
- Análisis IA fire-and-forget tras import: `analyzeActivity(userId, id).catch(() => {})`

### Agentes Remotos
- `--allowedTools` OBLIGATORIO en `claude-code-action@v1`
- Archivos `/tmp/` NO accesibles por la action — inyectar contexto inline
- `allowed_bots: "claude"` necesario en R3 para PRs de R2
- GitHub repo owner: `luismiguelmartin` (no `lm-martin`)
