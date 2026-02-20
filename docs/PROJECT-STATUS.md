# Estado del Proyecto

## Resumen de Implementación

- **Frontend**: 10 pantallas (login, onboarding, dashboard, activities, activity-detail, import, plan, insights, profile, auth-error) — todas migradas a API backend
- **Backend**: 8 bloques completados (infra, perfil, actividades, insights, training rules, IA, plan, import) — 19 endpoints bajo `/api/v1`
- **Agentes remotos**: 5 agentes (R1 analyzer, R2 PR generator, R3 reviewer, R5 changelog, @claude interactive) + label sync
- **Tests**: ~347 (112 web + 90 shared + 145 API)
- **Modo demo**: Modal interactiva en login con datos mock (6 pantallas sin autenticación)

## Pipeline AI-First

El desarrollo sigue un pipeline multi-agente (local + remoto). Detalle en `docs/03-AGENTS-AND-DEVELOPMENT-PLAN.md`.

**Labels del sistema**: `ai-analyze`, `ai-generate-pr`, `ai-generated`, `ai-reviewed`, `priority:p0/p1/p2`, `type:feature/bug/refactor/docs/test`, `phase:1/2/3/4`

**Metodología híbrida**: pipeline completo (L1→L2→L3→L4) para features complejas, implementación directa para CRUD predecible. 33 specs en `docs/specs/`.

**Caso validado (Issue #31 → PR #32)**: R1 analiza → R2 genera código + tests → R3 revisa → CI valida → merge → R5 actualiza CHANGELOG. Total: 31 turns, ~$1.00.

## Deploy Producción

- **Frontend**: Vercel (`cycling-companion-web.vercel.app`)
- **API**: Render (`cycling-companion.onrender.com`)
- **DB/Auth**: Supabase (project ref: `bxstffwatktcxantoelm`)

## Documentos de Referencia

| Documento | Ruta |
|-----------|------|
| Visión del producto | `docs/01-PRODUCT-VISION.md` |
| PRD completo (modelo de datos, endpoints, flujo IA) | `docs/02-PRD.md` |
| Plan de agentes y desarrollo | `docs/03-AGENTS-AND-DEVELOPMENT-PLAN.md` |
| Design system (pantallas, tokens, componentes) | `docs/DESIGN-SYSTEM.md` |
| Especificaciones L1/L2/L3 (33 archivos) | `docs/specs/` |
| Spec Fase 4: Agentes Remotos | `docs/specs/L2-phase4-remote-agents.md` |
| Prompts de agentes remotos | `prompts/remote/` |
| Configuración Google OAuth | `docs/GOOGLE-OAUTH-SETUP.md` |
| Configuración Supabase | `docs/SUPABASE-SETUP.md` |
| Presentación TFM | `docs/presentation-slides.md` |
