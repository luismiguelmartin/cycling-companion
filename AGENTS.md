# AGENTS.md

Contexto mínimo para agentes remotos (R1/R2/R3/R5) en GitHub Actions.

## Estructura

```
apps/web/          → Next.js 16 (App Router, React 19, TypeScript, Tailwind CSS)
apps/api/          → Fastify 5 (TypeScript, Zod validation)
packages/shared/   → Types Zod compartidos, constantes, utils
```

## Comandos

```bash
pnpm lint                   # ESLint (3 paquetes vía Turborepo)
pnpm typecheck              # TypeScript --noEmit (3 paquetes)
pnpm test                   # Vitest (3 paquetes)
pnpm test --filter=web      # Solo tests frontend
pnpm test --filter=api      # Solo tests API
pnpm test --filter=shared   # Solo tests shared
pnpm format                 # Prettier --write
pnpm format:check           # Prettier --check
```

## Convenciones

- **TypeScript estricto**: no `any`, `strict: true`
- **Zod schemas**: definir en `packages/shared`, reutilizar en API y frontend
- **Componentes**: PascalCase, archivos kebab-case, co-locate tests (`Foo.tsx` + `Foo.test.tsx`)
- **Server Components** por defecto, Client Components solo con interactividad
- **Commits**: español, prefijo `feat:` / `fix:` / `refactor:` / `docs:`
- **PRs**: una por issue, body con `Closes #N`, label `ai-generated`
- **Prettier**: semi, doble comilla, tabWidth 2, trailingComma all, printWidth 100
- **Tailwind CSS**: utility classes, no CSS custom. shadcn/ui como base

## Gotchas críticos

- **Shared ESM**: imports relativos DEBEN llevar `.js` → `from "./foo.js"`. Sin ella → `ERR_MODULE_NOT_FOUND`
- **shared/package.json**: `"main": "./dist/index.js"` (NO `./src/index.ts`)
- **API client split**: `lib/api/server.ts` (Server Components) y `lib/api/client.ts` (Client Components) — NO mezclar
- **Padding páginas**: centralizado en `app-shell.tsx` (`p-4 md:p-8`), no en páginas individuales
- **Iconos**: usar Lucide React, nunca emojis. Para Server→Client usar `ReactNode`, no `LucideIcon`
- **activity_type ENUM**: `intervals`, `endurance`, `recovery`, `tempo`, `rest` (no confundir con outdoor/indoor)

## Seguridad

- RLS activo en Supabase: cada usuario solo ve sus datos
- Nunca commitear API keys
- Validar inputs con Zod en API
