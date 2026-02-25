# Estado del Proyecto

## Resumen de Implementación

- **Frontend**: 10 pantallas (login, onboarding, dashboard, activities, activity-detail, import, plan, insights, profile, auth-error) — todas migradas a API backend
- **Backend**: 8 bloques completados (infra, perfil, actividades, insights, training rules, IA, plan, import) — 19 endpoints bajo `/api/v1`
- **Agentes remotos**: 5 agentes (R1 analyzer, R2 PR generator, R3 reviewer, R5 changelog, @claude interactive) + label sync
- **Tests**: ~531 (114 web + 189 shared + 228 API)
- **Modo demo**: Modal interactiva en login con datos mock (6 pantallas sin autenticación)
- **Métricas avanzadas**: En desarrollo (rama `feat/advanced-cycling-metrics`) — ver sección dedicada abajo

## Pipeline AI-First

El desarrollo sigue un pipeline multi-agente (local + remoto). Detalle en `docs/03-AGENTS-AND-DEVELOPMENT-PLAN.md`.

**Labels del sistema**: `ai-analyze`, `ai-generate-pr`, `ai-generated`, `ai-reviewed`, `priority:p0/p1/p2`, `type:feature/bug/refactor/docs/test`, `phase:1/2/3/4`

**Metodología híbrida**: pipeline completo (L1→L2→L3→L4) para features complejas, implementación directa para CRUD predecible. 33 specs en `docs/specs/`.

**Casos validados**: Issue #17 → PR #18 (Sonnet 4.5, 28 turns, ~$0.38) · Issue #31 → PR #32 (Sonnet 4.6, 31 turns, ~$1.00) · Issues #33, #35 (optimizadas con diffs en issue). Pipeline: R1 analiza → R2 genera código + tests → R3 revisa → CI valida → merge → R5 CHANGELOG.

## Deploy Producción

- **Frontend**: Vercel (`cycling-companion-web.vercel.app`)
- **API**: Render (`cycling-companion.onrender.com`)
- **DB/Auth**: Supabase (PostgreSQL + Auth + RLS)

## Métricas Avanzadas de Ciclismo (En Desarrollo)

**Rama**: `feat/advanced-cycling-metrics`
**PRD**: `docs/PRD-ADVANCED-METRICS.md`
**Specs**: `docs/specs-advanced-metrics/`
**Referencia técnica**: `docs/CYCLING-METRICS.md`

Motor de cálculo de métricas ciclistas v2: resampleo a 1Hz, detección de movimiento, Haversine, NP corregido, TSS preciso, 11 campos nuevos en BD.

| Fase | Descripción | Estado | Tests nuevos |
|------|-------------|--------|--------------|
| **0** | Núcleo computacional (`shared/metrics/`) | **Completada** | 99 |
| **1** | Migración BD + integración API | **Completada** | 5 |
| **2** | Frontend métricas ampliadas | **Completada** | — |
| **3** | Extras (zonas, best efforts, recálculo FTP) | Pendiente | ~25 |

### Gaps que corrige
- Sin resampleo → NP ±5-15% incorrecto
- Sin detección de movimiento → velocidad/cadencia media incorrectas
- Sin Haversine → usuarios sin sensor sin datos de velocidad
- Faltan 11 campos en BD (duration_moving, NP, elevation_gain, etc.)

## Integración Strava API (Planificada)

**Rama**: `feat/advanced-cycling-metrics` (compartida con métricas v2)
**PRD**: `docs/PRD-STRAVA-API.md`
**Specs**: `docs/specs-strava-api/`

Sincronización automática de actividades desde Strava: OAuth 2.0, webhooks, backfill histórico, UI en perfil.

| Fase | Descripción | Estado | Tests estimados |
|------|-------------|--------|-----------------|
| **0** | Infraestructura (BD, schemas, servicios base) | **Completada** | 72 |
| **1** | OAuth flow (conectar/desconectar) | Pendiente | ~20 |
| **2** | Webhook + sincronización automática | Pendiente | ~25 |
| **3** | Backfill + UI perfil | Pendiente | ~15 |

---

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
| PRD Métricas Avanzadas v2 | `docs/PRD-ADVANCED-METRICS.md` |
| Spec métricas de ciclismo (referencia) | `docs/CYCLING-METRICS.md` |
| Specs por fase (métricas avanzadas) | `docs/specs-advanced-metrics/` |
| PRD Integración Strava API | `docs/PRD-STRAVA-API.md` |
| Specs por fase (Strava API) | `docs/specs-strava-api/` |
