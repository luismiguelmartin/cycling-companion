# Plan de Desarrollo — Fase 3: Backend + IA

> Generado: 2026-02-15 | Metodología: Pipeline AI-first con agentes locales
> **Actualizado**: 2026-02-15 — Documentación de metodología híbrida (Bloques 0-2 vs Bloque 3+)

---

## ⚠️ Nota Metodológica

**Bloques 0-2 (Infraestructura, Perfil, Actividades):**
- **Proceso seguido**: Implementación directa desde este plan general → commit
- **Documentación**: Specs L2 (diseño técnico) generadas **retroactivamente** tras implementación
- **Rationale**: Contratos de API bien definidos en PRD, schemas Zod compartidos ya existentes, iteración rápida

**Bloque 3+ (Importación + IA):**
- **Proceso a seguir**: Pipeline completo L1 → L2 → L3 → L4 → L5
- **Documentación**: Specs L1/L2/L3 generadas **antes** de implementar
- **Rationale**: Lógica IA más compleja, prompts a diseñar, mayor beneficio de diseño previo

**Justificación del cambio**:
- Bloques 0-2 eran más predecibles (CRUD estándar)
- Bloque 3 (IA) requiere más diseño upfront (prompts, parseo archivos, integración Claude API)
- Aprendizaje del proceso: aplicar pipeline completo donde aporta más valor

**Archivos de specs retroactivas**:
- `docs/specs/L2-backend-00-infrastructure.md` (Bloque 0)
- `docs/specs/L2-backend-01-profile.md` (Bloque 1)
- `docs/specs/L2-backend-02-activities.md` (Bloque 2)

---

## 1. Decisiones Arquitectónicas

| Decisión | Elección | Rationale |
|----------|----------|-----------|
| Patrón de comunicación | **Backend como proxy completo** | Todo pasa por Fastify. Frontend solo habla con API (`/api/v1/*`). Mayor control, seguridad centralizada, un solo punto de entrada. |
| Alcance IA | **Completo (4 endpoints)** | Análisis post-sesión + plan semanal + resumen comparativo + tip del coach (dashboard). Máxima cobertura del PRD. |
| Importación archivos | **Incluida (.fit/.gpx)** | Parseo server-side, almacenamiento en Supabase Storage. Completa la pantalla Import. |
| Agentes remotos | **Diferidos** | R1-R3, R5 se planifican en una fase posterior. Foco en backend funcional. |
| Auth en API | **JWT Supabase** | Verificar token del frontend en cada request. Service role key para operaciones server-side. |

---

## 2. Agentes Locales — Roles para Fase 3

Se reutilizan los 4 agentes locales de Fases 1-2, adaptados al contexto backend, y se añade un agente especializado nuevo:

### Agentes existentes (adaptados)

| Agente | Rol Fase 3 | Entrada | Salida |
|--------|-----------|---------|--------|
| **L1 — UX Interpreter** | Analizar qué datos necesita cada pantalla del frontend y traducir a requisitos de API | Pantallas existentes + PRD | Especificación funcional de endpoints (qué devuelve cada uno, qué parámetros acepta) |
| **L2 — Architect** | Diseñar la arquitectura backend: estructura de carpetas, middleware, servicios, integración IA | Output L1 + PRD + stack actual | Diseño técnico (ADRs, diagramas, contratos de API) |
| **L3 — Planner** | Dividir en issues incrementales, testeables, con dependencias claras | Output L2 | Issues GitHub con labels, criterios de aceptación, orden de implementación |
| **L4 — Implementer** | Escribir código del backend bajo supervisión humana | Issues + diseño técnico | Código + tests + commits |

### Agente nuevo

| Agente | Rol | Entrada | Salida |
|--------|-----|---------|--------|
| **L5 — QA/Tester** | Validar endpoints implementados: tests de integración, verificar RLS, probar edge cases, validar respuestas contra schemas Zod | Endpoints implementados + schemas | Tests de integración, reporte de bugs, validación E2E de flujos críticos |

**Flujo de trabajo por bloque**:
```
L1 (Especificación funcional)
  → L2 (Diseño técnico + ADRs)
    → L3 (Issues incrementales)
      → L4 (Implementación)
        → L5 (Testing + Validación)
```

---

## 3. Arquitectura Backend

### 3.1 Estructura de carpetas objetivo

```
apps/api/src/
├── index.ts                    # Servidor Fastify (entry point)
├── app.ts                      # Factory de la app (para testing)
├── config/
│   └── env.ts                  # Validación de env vars con Zod
├── plugins/
│   ├── cors.ts                 # CORS para frontend
│   ├── auth.ts                 # Verificación JWT Supabase (decorador)
│   └── error-handler.ts        # Manejo centralizado de errores
├── routes/
│   ├── health.ts               # GET /health (ya existe, mover aquí)
│   ├── profile.ts              # GET/PATCH /api/v1/profile
│   ├── activities.ts           # CRUD /api/v1/activities
│   ├── activity-metrics.ts     # GET /api/v1/activities/:id/metrics
│   ├── plans.ts                # GET/POST /api/v1/plan
│   ├── insights.ts             # GET /api/v1/insights
│   ├── import.ts               # POST /api/v1/activities/upload
│   └── ai/
│       ├── analyze-activity.ts # POST /api/v1/ai/analyze-activity
│       ├── weekly-plan.ts      # POST /api/v1/ai/weekly-plan
│       ├── weekly-summary.ts   # POST /api/v1/ai/weekly-summary
│       └── coach-tip.ts        # GET /api/v1/ai/coach-tip
├── services/
│   ├── supabase.ts             # Cliente Supabase (service role)
│   ├── anthropic.ts            # Cliente Claude API
│   ├── activity.service.ts     # Lógica de negocio actividades
│   ├── plan.service.ts         # Lógica de negocio planes
│   ├── profile.service.ts      # Lógica de negocio perfil
│   ├── insights.service.ts     # Lógica de negocio insights
│   ├── import.service.ts       # Parseo .fit/.gpx
│   └── ai/
│       ├── ai.service.ts       # Orquestador de llamadas IA
│       ├── prompts.ts          # Prompts versionados
│       └── training-rules.ts   # Heurísticas de entrenamiento (TSS, zonas, alertas)
└── types/
    └── fastify.d.ts            # Extensiones de tipos Fastify (decoradores)
```

### 3.2 Flujo de request

```
Request (Frontend)
  ↓ Authorization: Bearer <supabase_access_token>
Fastify → CORS plugin → Auth plugin (verificar JWT) → Route handler
  ↓
Service layer (lógica de negocio)
  ↓
Supabase client (service_role_key) → PostgreSQL
  ↓ (si aplica)
Anthropic client → Claude API
  ↓
Response (JSON validado con Zod)
```

### 3.3 Autenticación

```typescript
// plugins/auth.ts
// 1. Extraer Bearer token del header Authorization
// 2. Llamar supabase.auth.getUser(token) para verificar
// 3. Decorar request con { userId, email }
// 4. Si falla → 401 Unauthorized
```

**Rutas públicas** (sin auth): `/health`
**Rutas protegidas** (con auth): todas las demás (`/api/v1/*`)

### 3.4 Manejo de errores

```typescript
// plugins/error-handler.ts
// Errores tipados:
// - 400 Bad Request → validación Zod fallida
// - 401 Unauthorized → token inválido/ausente
// - 403 Forbidden → RLS violation
// - 404 Not Found → recurso no existe
// - 429 Too Many Requests → rate limit IA
// - 500 Internal Server Error → error inesperado
//
// Formato consistente:
// { error: string, code: string, details?: unknown }
```

---

## 4. Endpoints API — Especificación Completa

### 4.1 Perfil

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/v1/profile` | Obtener perfil del usuario autenticado |
| `PATCH` | `/api/v1/profile` | Actualizar campos del perfil |

**GET /api/v1/profile** → `UserProfile` (schema existente en shared)

**PATCH /api/v1/profile** → Body parcial de `userProfileSchema`. Devuelve perfil actualizado.

### 4.2 Actividades

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/v1/activities` | Listar actividades (paginación, filtros) |
| `GET` | `/api/v1/activities/:id` | Detalle de una actividad |
| `POST` | `/api/v1/activities` | Crear actividad manual |
| `PATCH` | `/api/v1/activities/:id` | Actualizar actividad |
| `DELETE` | `/api/v1/activities/:id` | Eliminar actividad |
| `GET` | `/api/v1/activities/:id/metrics` | Series temporales |

**GET /api/v1/activities** — Query params:
- `page` (default 1), `limit` (default 20)
- `type` (filter por activity_type)
- `date_from`, `date_to` (rango de fechas)
- `search` (buscar en nombre/notas)
- `sort` (date_desc por defecto)

**POST /api/v1/activities** — Body: `activityCreateSchema` (ya existe en shared). Calcula TSS automáticamente si hay potencia y FTP del usuario.

### 4.3 Importación

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/v1/activities/upload` | Subir archivo .fit o .gpx |

**POST /api/v1/activities/upload** — Multipart form:
- `file`: archivo .fit o .gpx
- Parseo server-side → extrae métricas + series temporales
- Almacena archivo original en Supabase Storage
- Crea actividad + activity_metrics
- Devuelve actividad creada

### 4.4 Plan Semanal

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/v1/plan` | Obtener plan de una semana |
| `POST` | `/api/v1/plan/generate` | Generar plan con IA |
| `PATCH` | `/api/v1/plan/:id` | Actualizar plan (marcar done, etc.) |

**GET /api/v1/plan** — Query: `week_start=YYYY-MM-DD`
- Si existe plan → devuelve
- Si no → devuelve null (frontend ofrece generar)

**POST /api/v1/plan/generate** — Body: `{ week_start?, force_regenerate?: boolean }`
- Recopila contexto (perfil + últimas 2 semanas actividades)
- Llama Claude API con prompt de generación
- Guarda en `weekly_plans` (upsert por user_id + week_start)
- Devuelve plan generado

### 4.5 Insights

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/v1/insights` | Datos comparativos entre dos periodos |
| `GET` | `/api/v1/insights/overload-check` | Verificar sobrecarga de entrenamiento |

**GET /api/v1/insights** — Query params:
- `period_a_start`, `period_a_end` (periodo A)
- `period_b_start`, `period_b_end` (periodo B)
- Devuelve: métricas agregadas por periodo, diferencias, tendencias

**GET /api/v1/insights/overload-check**
- Calcula TSS semanal actual vs promedio 4 semanas
- Devuelve: `{ is_overloaded, alert_level, reason, suggestion }`

### 4.6 IA — Entrenador Virtual

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/v1/ai/analyze-activity` | Análisis post-sesión |
| `POST` | `/api/v1/ai/weekly-plan` | Generar plan semanal con IA |
| `POST` | `/api/v1/ai/weekly-summary` | Resumen comparativo |
| `GET` | `/api/v1/ai/coach-tip` | Recomendación del día (dashboard) |

**POST /ai/analyze-activity** — Body: `{ activity_id }`
- Contexto: perfil + actividad + últimas 2 semanas + plan actual
- Respuesta: `{ analysis, confidence, reasoning }`
- Persiste en `activities.ai_analysis` (JSONB)

**POST /ai/weekly-plan** — Body: `{ week_start, force_regenerate? }`
- Contexto: perfil + actividades recientes + objetivo
- Respuesta: `{ plan: PlanDay[], rationale }`
- Persiste en `weekly_plans`

**POST /ai/weekly-summary** — Body: `{ period_a_start, period_a_end, period_b_start, period_b_end }`
- Contexto: datos agregados de ambos periodos
- Respuesta: `{ summary, key_differences[], recommendation }`

**GET /ai/coach-tip** — Sin body
- Contexto: perfil + última actividad + plan de hoy + carga reciente
- Respuesta: `{ tip, reasoning, activity_suggestion? }`
- Cache: 1 tip por usuario por día (evitar llamadas repetidas)

---

## 5. Integración IA — Diseño de Prompts

### 5.1 Estructura de prompts

Cada prompt tendrá:
1. **System prompt**: Rol del entrenador, reglas, formato de respuesta
2. **User prompt**: Datos del usuario + contexto dinámico
3. **Output schema**: JSON esperado (validado con Zod al recibir)

### 5.2 Reglas de entrenamiento codificadas (training-rules.ts)

Estas reglas se calculan en TypeScript, NO dependen de la IA:

```typescript
// TSS = (IF)² × duración_horas × 100
// IF (Intensity Factor) = avg_power / FTP
// CTL (Fitness) = media ponderada TSS últimos 42 días
// ATL (Fatigue) = media ponderada TSS últimos 7 días
// TSB (Form) = CTL - ATL

// Alertas de sobrecarga:
// Yellow: TSS semanal > 1.2 × promedio 4 semanas
// Red: TSS semanal > 1.5 × promedio 4 semanas
// Descanso urgente: 3+ días intensidad alta consecutivos
```

La IA recibe estos cálculos como contexto, no los recalcula.

### 5.3 Guardrails

- **Tono**: "Considera...", "Te sugiero...", nunca "Debes..."
- **Transparencia**: Siempre incluir razonamiento
- **Límite de contexto**: Últimas 2 semanas de actividades (no histórico completo)
- **Rate limit**: Máx 20 llamadas IA/usuario/día
- **Timeout**: 30 segundos máx por llamada
- **Fallback**: Si Claude falla → respuesta genérica basada en reglas
- **Caché**: Tips del coach → 1 por día por usuario

---

## 6. Migración de Frontend

### 6.1 Cambio en el flujo de datos

**Antes (Fase 2)**:
```
Frontend → Supabase directamente (con anon key + RLS)
```

**Después (Fase 3)**:
```
Frontend → API Fastify (con Bearer token) → Supabase (con service_role_key)
```

### 6.2 Pantallas afectadas y cambios necesarios

| Pantalla | Cambio | Prioridad |
|----------|--------|-----------|
| Dashboard | Reemplazar queries Supabase por fetch a API. Conectar coach tip real. | P0 |
| Activities (lista) | Reemplazar query Supabase por `GET /api/v1/activities`. | P0 |
| Activity Detail | Reemplazar query por `GET /api/v1/activities/:id`. Conectar análisis IA. | P0 |
| Activity Import | Conectar formulario manual a `POST /api/v1/activities`. Conectar upload a `POST /api/v1/activities/upload`. | P1 |
| Plan | Reemplazar mock data por `GET /api/v1/plan`. Conectar generación IA. | P0 |
| Insights | Reemplazar cálculos client-side por `GET /api/v1/insights`. Conectar resumen IA. | P1 |
| Profile | Reemplazar queries por `GET/PATCH /api/v1/profile`. | P0 |
| Onboarding | Reemplazar insert Supabase por `PATCH /api/v1/profile`. | P1 |

### 6.3 Cliente API en frontend

Crear un módulo `apps/web/src/lib/api-client.ts`:
- Wrapper sobre fetch con base URL configurable
- Inyecta automáticamente el Bearer token de la sesión Supabase
- Manejo de errores consistente
- Types de respuesta compartidos via `packages/shared`

---

## 7. Nuevas dependencias

### Backend (apps/api)

| Paquete | Versión | Uso |
|---------|---------|-----|
| `@anthropic-ai/sdk` | ^0.39 | Cliente Claude API |
| `@fastify/cors` | ^11 | CORS para frontend |
| `@fastify/multipart` | ^9 | Upload de archivos |
| `@fastify/swagger` | ^9 | Documentación API (opcional) |
| `@fastify/swagger-ui` | ^5 | UI para Swagger (opcional) |
| `fit-file-parser` | ^2 | Parseo de archivos .FIT |
| `gpxparser` | ^3 | Parseo de archivos .GPX |

### Shared (packages/shared) — nuevos schemas

| Schema | Uso |
|--------|-----|
| `api-response.ts` | Wrapper de respuesta estándar `{ data, error, meta }` |
| `ai-analysis.ts` | Schema para respuestas IA (análisis, plan, tip) |
| `pagination.ts` | Schema de paginación `{ page, limit, total, hasMore }` |
| `import.ts` | Schema para datos de importación |

---

## 8. Migraciones SQL pendientes

### Migración 004: Tabla `weekly_plans` — ajustes

La tabla ya existe (migración 001), pero puede necesitar ajustes:
- Verificar que `plan_data` JSONB tiene la estructura correcta
- Añadir campo `ai_model` (TEXT) para tracking del modelo usado
- Añadir campo `context_snapshot` (JSONB) para reproducibilidad

### Migración 005: Índices de rendimiento

```sql
-- Índices adicionales para queries del backend
CREATE INDEX IF NOT EXISTS idx_activities_user_date
  ON activities(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_activities_user_type
  ON activities(user_id, type);
CREATE INDEX IF NOT EXISTS idx_weekly_plans_user_week
  ON weekly_plans(user_id, week_start DESC);
```

### Migración 006: Caché de tips IA

```sql
CREATE TABLE IF NOT EXISTS ai_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  cache_key TEXT NOT NULL,         -- ej: 'coach_tip_2026-02-15'
  response JSONB NOT NULL,
  model TEXT,                      -- 'claude-sonnet-4-5-20250929'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  UNIQUE(user_id, cache_key)
);

ALTER TABLE ai_cache ENABLE ROW LEVEL SECURITY;
-- RLS policies...
```

---

## 9. Bloques de Trabajo — Orden de Implementación

El desarrollo se organiza en **8 bloques** ordenados por dependencias. Cada bloque sigue el flujo L1→L2→L3→L4→L5.

```
Bloque 0: Infraestructura base (auth, CORS, errors, config)
    ↓
Bloque 1: Perfil (GET/PATCH) — el más simple, valida el patrón
    ↓
Bloque 2: Actividades CRUD — base de datos principal
    ↓
Bloque 3: Insights (cálculos + agregados)
    ↓
Bloque 4: Reglas de entrenamiento + heurísticas
    ↓
Bloque 5: IA — Endpoints de Claude API
    ↓
Bloque 6: Plan semanal (CRUD + generación IA)
    ↓
Bloque 7: Importación .fit/.gpx
    ↓
Bloque 8: Migración frontend (reconectar pantallas a API)
```

---

### Bloque 0: Infraestructura Base
**Objetivo**: Configurar la base sobre la que se construyen todos los endpoints.

| # | Issue | Agente | Archivos | Prioridad |
|---|-------|--------|----------|-----------|
| 0.1 | Crear `app.ts` factory para Fastify (separar de `index.ts` para testing) | L4 | `src/app.ts`, `src/index.ts` | P0 |
| 0.2 | Configurar validación de env vars con Zod | L4 | `src/config/env.ts` | P0 |
| 0.3 | Implementar plugin de CORS (`@fastify/cors`) | L4 | `src/plugins/cors.ts` | P0 |
| 0.4 | Implementar plugin de auth JWT Supabase | L4 | `src/plugins/auth.ts`, `src/types/fastify.d.ts` | P0 |
| 0.5 | Implementar error handler centralizado | L4 | `src/plugins/error-handler.ts` | P0 |
| 0.6 | Crear cliente Supabase reutilizable | L4 | `src/services/supabase.ts` | P0 |
| 0.7 | Crear cliente Anthropic reutilizable | L4 | `src/services/anthropic.ts` | P1 |
| 0.8 | Mover health route a módulo separado | L4 | `src/routes/health.ts` | P2 |
| 0.9 | Instalar dependencias nuevas (`@fastify/cors`, `@anthropic-ai/sdk`, `@fastify/multipart`) | L4 | `package.json` | P0 |

**Tests Bloque 0** (L5):
- Test de auth: token válido → 200, token inválido → 401, sin token → 401
- Test de CORS: headers correctos para frontend
- Test de error handler: errores Zod → 400, genéricos → 500

---

### Bloque 1: Perfil
**Objetivo**: Endpoint más simple, valida todo el patrón (auth → service → Supabase → response).

| # | Issue | Agente | Archivos |
|---|-------|--------|----------|
| 1.1 | Crear `profile.service.ts` (getProfile, updateProfile) | L4 | `src/services/profile.service.ts` |
| 1.2 | Crear route `GET /api/v1/profile` | L4 | `src/routes/profile.ts` |
| 1.3 | Crear route `PATCH /api/v1/profile` con validación Zod | L4 | `src/routes/profile.ts` |
| 1.4 | Crear schema de request/response en shared | L2+L4 | `packages/shared/src/schemas/api/` |

**Tests Bloque 1** (L5):
- GET profile → devuelve datos del usuario autenticado
- PATCH profile → actualiza solo campos enviados
- PATCH profile con datos inválidos → 400
- Sin auth → 401

---

### Bloque 2: Actividades CRUD
**Objetivo**: CRUD completo de actividades con filtros, paginación y cálculo automático de TSS.

| # | Issue | Agente | Archivos |
|---|-------|--------|----------|
| 2.1 | Crear `activity.service.ts` (list, getById, create, update, delete) | L4 | `src/services/activity.service.ts` |
| 2.2 | Crear route `GET /api/v1/activities` con paginación y filtros | L4 | `src/routes/activities.ts` |
| 2.3 | Crear route `GET /api/v1/activities/:id` | L4 | `src/routes/activities.ts` |
| 2.4 | Crear route `POST /api/v1/activities` con cálculo automático de TSS | L4 | `src/routes/activities.ts` |
| 2.5 | Crear route `PATCH /api/v1/activities/:id` | L4 | `src/routes/activities.ts` |
| 2.6 | Crear route `DELETE /api/v1/activities/:id` | L4 | `src/routes/activities.ts` |
| 2.7 | Crear route `GET /api/v1/activities/:id/metrics` | L4 | `src/routes/activity-metrics.ts` |
| 2.8 | Crear schemas de paginación y filtros en shared | L4 | `packages/shared/src/schemas/` |

**Tests Bloque 2** (L5):
- CRUD completo: crear → listar → obtener → actualizar → eliminar
- Paginación: page, limit, total correcto
- Filtros: por tipo, fecha, búsqueda
- TSS calculado automáticamente si hay potencia + FTP del usuario
- Actividad de otro usuario → 404 (RLS)

---

### Bloque 3: Insights
**Objetivo**: Cálculos comparativos entre dos periodos + check de sobrecarga.

| # | Issue | Agente | Archivos |
|---|-------|--------|----------|
| 3.1 | Crear `insights.service.ts` (comparePeriods, overloadCheck) | L4 | `src/services/insights.service.ts` |
| 3.2 | Crear route `GET /api/v1/insights` con datos comparativos | L4 | `src/routes/insights.ts` |
| 3.3 | Crear route `GET /api/v1/insights/overload-check` | L4 | `src/routes/insights.ts` |

**Tests Bloque 3** (L5):
- Comparación con datos de dos periodos → métricas correctas
- Overload check con TSS alto → alerta correcta
- Periodos sin datos → respuesta vacía válida

---

### Bloque 4: Reglas de Entrenamiento
**Objetivo**: Heurísticas codificadas en TypeScript, reutilizables por IA y endpoints.

| # | Issue | Agente | Archivos |
|---|-------|--------|----------|
| 4.1 | Implementar cálculos de entrenamiento (TSS, IF, CTL, ATL, TSB) en shared | L4 | `packages/shared/src/utils/training-calculations.ts` |
| 4.2 | Implementar reglas de alerta (sobrecarga, descanso) en shared | L4 | `packages/shared/src/utils/training-rules.ts` |
| 4.3 | Implementar cálculo de zonas de potencia y FC | L4 | (ya existe en `constants/zones.ts`, ampliar si necesario) |

**Tests Bloque 4** (L5):
- TSS calculado correctamente para diferentes escenarios
- IF correcto para potencia/FTP dados
- Alertas de sobrecarga: yellow, red, none
- Descanso urgente: 3+ días consecutivos intensos

---

### Bloque 5: IA — Endpoints Claude API
**Objetivo**: 4 endpoints de IA con prompts versionados, validación de respuesta y caché.

| # | Issue | Agente | Archivos |
|---|-------|--------|----------|
| 5.1 | Crear `ai.service.ts` (orquestador: recopilar contexto → prompt → llamada → parseo) | L4 | `src/services/ai/ai.service.ts` |
| 5.2 | Diseñar y escribir prompts versionados (4 prompts) | L2+L4 | `src/services/ai/prompts.ts` |
| 5.3 | Crear migración 006: tabla `ai_cache` | L4 | `supabase/migrations/006_ai_cache.sql` |
| 5.4 | Crear route `POST /api/v1/ai/analyze-activity` | L4 | `src/routes/ai/analyze-activity.ts` |
| 5.5 | Crear route `POST /api/v1/ai/weekly-plan` | L4 | `src/routes/ai/weekly-plan.ts` |
| 5.6 | Crear route `POST /api/v1/ai/weekly-summary` | L4 | `src/routes/ai/weekly-summary.ts` |
| 5.7 | Crear route `GET /api/v1/ai/coach-tip` (con caché diaria) | L4 | `src/routes/ai/coach-tip.ts` |
| 5.8 | Crear schemas Zod para respuestas IA en shared | L4 | `packages/shared/src/schemas/ai-response.ts` |
| 5.9 | Implementar rate limiting (20 llamadas/usuario/día) | L4 | `src/services/ai/rate-limiter.ts` |
| 5.10 | Implementar fallback cuando Claude API falla | L4 | `src/services/ai/fallback.ts` |

**Tests Bloque 5** (L5):
- Análisis de actividad → respuesta válida contra schema
- Generación de plan → 7 días correctos
- Coach tip → cacheado por día (no repite llamada)
- Rate limit → 429 después de X llamadas
- Claude API offline → fallback responde correctamente
- Prompt contiene contexto esperado (perfil, actividades, reglas)

---

### Bloque 6: Plan Semanal
**Objetivo**: CRUD de planes semanales integrado con generación IA.

| # | Issue | Agente | Archivos |
|---|-------|--------|----------|
| 6.1 | Crear `plan.service.ts` (getPlan, generatePlan, updatePlan) | L4 | `src/services/plan.service.ts` |
| 6.2 | Crear route `GET /api/v1/plan?week_start=` | L4 | `src/routes/plans.ts` |
| 6.3 | Crear route `POST /api/v1/plan/generate` (integra IA del Bloque 5) | L4 | `src/routes/plans.ts` |
| 6.4 | Crear route `PATCH /api/v1/plan/:id` (marcar done, actualizar) | L4 | `src/routes/plans.ts` |
| 6.5 | Migración 004: ajustes a `weekly_plans` si necesario | L4 | `supabase/migrations/` |

**Tests Bloque 6** (L5):
- GET plan existente → devuelve plan correcto
- GET plan inexistente → null
- POST generate → crea plan vía IA y persiste
- PATCH → actualiza campos (ej: marcar día como completado)

---

### Bloque 7: Importación .fit/.gpx
**Objetivo**: Upload de archivos, parseo server-side, creación automática de actividad + métricas.

| # | Issue | Agente | Archivos |
|---|-------|--------|----------|
| 7.1 | Configurar `@fastify/multipart` para upload | L4 | `src/plugins/`, configuración |
| 7.2 | Crear `import.service.ts` (parseo .fit, parseo .gpx, extracción de métricas) | L4 | `src/services/import.service.ts` |
| 7.3 | Crear route `POST /api/v1/activities/upload` | L4 | `src/routes/import.ts` |
| 7.4 | Integrar Supabase Storage para almacenar archivo original | L4 | `src/services/import.service.ts` |
| 7.5 | Insertar activity_metrics (series temporales) tras parseo | L4 | `src/services/import.service.ts` |

**Tests Bloque 7** (L5):
- Upload .fit → actividad creada con métricas extraídas
- Upload .gpx → actividad creada con métricas extraídas
- Archivo inválido → 400 con mensaje claro
- Archivo demasiado grande → 413
- Series temporales insertadas correctamente

---

### Bloque 8: Migración Frontend
**Objetivo**: Reconectar todas las pantallas del frontend para usar la API en vez de Supabase directo.

| # | Issue | Agente | Archivos |
|---|-------|--------|----------|
| 8.1 | Crear `api-client.ts` (wrapper fetch con auth automática) | L4 | `apps/web/src/lib/api-client.ts` |
| 8.2 | Migrar Dashboard a usar API (KPIs + coach tip IA) | L4 | `apps/web/src/app/(app)/page.tsx` + componentes |
| 8.3 | Migrar lista de Actividades a usar API | L4 | `apps/web/src/app/(app)/activities/page.tsx` |
| 8.4 | Migrar detalle de Actividad a usar API + análisis IA | L4 | `apps/web/src/app/(app)/activities/[id]/page.tsx` |
| 8.5 | Migrar Import a usar API (formulario + upload) | L4 | `apps/web/src/app/(app)/activities/import/page.tsx` |
| 8.6 | Migrar Plan a usar API + generación IA | L4 | `apps/web/src/app/(app)/plan/page.tsx` |
| 8.7 | Migrar Insights a usar API + resumen IA | L4 | `apps/web/src/app/(app)/insights/page.tsx` |
| 8.8 | Migrar Profile a usar API | L4 | `apps/web/src/app/(app)/profile/page.tsx` |
| 8.9 | Migrar Onboarding a usar API | L4 | `apps/web/src/app/(app)/onboarding/page.tsx` |

**Tests Bloque 8** (L5):
- Cada pantalla carga datos desde la API correctamente
- Errores de API se muestran en UI (loading, error states)
- Auth token se envía automáticamente
- Funcionalidad existente no se rompe

---

## 10. Estimación de Issues

| Bloque | Issues | Descripción |
|--------|--------|-------------|
| 0 | 9 | Infraestructura base |
| 1 | 4 | Perfil |
| 2 | 8 | Actividades CRUD |
| 3 | 3 | Insights |
| 4 | 3 | Reglas entrenamiento |
| 5 | 10 | IA (Claude API) |
| 6 | 5 | Plan semanal |
| 7 | 5 | Importación .fit/.gpx |
| 8 | 9 | Migración frontend |
| **Total** | **~56** | **issues incrementales** |

---

## 11. Flujo de Trabajo por Bloque

Para cada bloque, se sigue este proceso:

```
1. L1 (UX Interpreter) — 15-30 min
   → Analizar qué datos necesita cada pantalla afectada
   → Documentar requisitos funcionales del endpoint
   → Output: Spec funcional del bloque

2. L2 (Architect) — 30-60 min
   → Diseñar contratos de API (request/response)
   → Definir estructura de servicios
   → Decidir schemas Zod necesarios
   → Output: Diseño técnico del bloque

3. L3 (Planner) — 15-30 min
   → Dividir en issues incrementales
   → Asignar prioridades y dependencias
   → Crear issues en GitHub
   → Output: Issues listas para implementar

4. L4 (Implementer) — variable
   → Implementar cada issue secuencialmente
   → Commit por issue
   → Output: Código + tests unitarios

5. L5 (QA/Tester) — 30-60 min por bloque
   → Ejecutar tests de integración
   → Verificar contra schemas
   → Probar edge cases
   → Validar que RLS funciona
   → Output: Reporte de bugs / OK
```

---

## 12. Criterios de Éxito — Fase 3

### Backend funcional
- [ ] Todos los endpoints responden correctamente (15+ routes)
- [ ] Auth JWT verificado en todas las rutas protegidas
- [ ] Validación Zod en todos los inputs
- [ ] Error handling consistente en todos los endpoints
- [ ] RLS validado (un usuario no puede ver datos de otro)

### IA integrada
- [ ] 4 endpoints IA operativos (analyze, plan, summary, coach tip)
- [ ] Prompts versionados y documentados
- [ ] Rate limiting implementado
- [ ] Fallback funcional cuando Claude API falla
- [ ] Caché de tips diarios

### Importación
- [ ] Upload .fit funcional
- [ ] Upload .gpx funcional
- [ ] Series temporales extraídas y persistidas
- [ ] Archivo original guardado en Supabase Storage

### Frontend migrado
- [ ] Todas las pantallas usan la API (no Supabase directo)
- [ ] Estados de loading/error en todas las pantallas
- [ ] Coach tip real en Dashboard

### Calidad
- [ ] Tests unitarios para reglas de entrenamiento
- [ ] Tests de integración para endpoints críticos
- [ ] Build pasa sin errores (`pnpm build`)
- [ ] Lint pasa sin errores (`pnpm lint`)
- [ ] Typecheck pasa sin errores (`pnpm typecheck`)
- [ ] Deploy exitoso en Render (API) y Vercel (frontend)

---

## 13. Riesgos y Mitigaciones

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Claude API costosa o lenta | Alto | Rate limiting + caché + fallback a reglas |
| Parseo .fit/.gpx complejo | Medio | Usar librerías probadas, limitar formatos soportados |
| Migración frontend rompe funcionalidad | Alto | Migrar pantalla por pantalla, tests E2E |
| RLS bypass en backend con service_role_key | Alto | Siempre filtrar por `user_id` del token JWT en el service layer |
| Cold start en Render (free tier) | Bajo | Aceptable para MVP, documentar |

---

## 14. Orden Recomendado de Ejecución

```
Semana 1: Bloques 0 + 1 + 2
  → Infraestructura + Perfil + Actividades CRUD
  → Al final: backend funcional para datos principales

Semana 2: Bloques 3 + 4 + 5
  → Insights + Reglas + IA
  → Al final: inteligencia artificial operativa

Semana 3: Bloques 6 + 7 + 8
  → Plan semanal + Importación + Migración frontend
  → Al final: producto completo end-to-end
```

---

*Este plan será ejecutado siguiendo el pipeline L1→L2→L3→L4→L5 por cada bloque, con commits descriptivos en español y PRs enfocadas (<400 líneas cuando sea posible).*
