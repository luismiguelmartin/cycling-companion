# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Contexto del Proyecto

**Cycling Companion** es una plataforma web de análisis y planificación de entrenamiento para ciclistas amateur (40+). Banco de pruebas para un TFM sobre integración de IA en el ciclo de vida del desarrollo (pipeline AI-first).

**Propuesta de valor**: Entrenador IA personal que traduce datos de ciclismo en recomendaciones accionables.

**Fase actual**: Fase 1 — Cimientos (setup inicial)

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
└── docs/             → Visión del producto, PRD, plan de agentes
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
pnpm format                 # Prettier: formatear todo
pnpm format:check           # Prettier: verificar formato sin modificar
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

---

## Notas para Claude Code

### Al trabajar en nuevas features:
1. Revisar el PRD (`docs/02-PRD.md`) para entender el contexto funcional
2. Mantener consistencia con el tono y estructura del código existente
3. No sobre-ingeniería: implementar solo lo necesario para la issue actual

### Al crear issues:
- Usar template estructurado: descripción, criterios de aceptación, archivos afectados
- Asignar labels apropiados: `priority:*`, `type:*`, `phase:*`
- Mantener issues pequeñas y enfocadas (1-3 horas de trabajo)

### Al abrir PRs:
- Incluir screenshots si hay cambios visuales
- Marcar con label `ai-generated` si fue generada por agente remoto
- Self-review: revisar diff completo antes de pedir review

---

## Documentos de Referencia

| Documento | Ruta |
|-----------|------|
| Visión del producto | `docs/01-PRODUCT-VISION.md` |
| PRD completo (modelo de datos, endpoints, flujo IA) | `docs/02-PRD.md` |
| Plan de agentes y desarrollo | `docs/03-AGENTS-AND-DEVELOPMENT-PLAN.md` |
