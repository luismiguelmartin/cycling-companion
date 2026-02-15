# L2 — Diseño Técnico: Endpoints IA / Claude API (Bloque 5)

> **Tipo**: Especificación técnica (L2)
> **Fase**: 3 — Backend + IA
> **Bloque**: 5 — IA (Claude API Endpoints)
> **Estado**: 🔲 Pendiente
> **Fecha**: 2026-02-15

---

## 1. Objetivo

Crear 4 endpoints de IA que conectan con Claude API para generar contenido personalizado de entrenamiento. Los endpoints producen JSON tipado que coincide exactamente con los componentes frontend existentes (`AIAnalysisCard`, `AICoachCard`, `AIInsightsCard`, `PlanContent`).

**Endpoints**:
- `POST /api/v1/ai/analyze-activity` — Análisis post-sesión
- `POST /api/v1/ai/weekly-plan` — Generación de plan semanal
- `POST /api/v1/ai/weekly-summary` — Resumen comparativo de periodos
- `GET /api/v1/ai/coach-tip` — Recomendación diaria del coach

**Infraestructura transversal**: Rate limiting (20/día), caché (coach-tip diaria), fallback heurístico, schemas Zod de respuesta.

---

## 2. Decisiones Arquitectónicas

| Decisión | Elección | Rationale |
|----------|----------|-----------|
| Estructura servicio | `ai.service.ts` + `prompts.ts` + `fallback.ts` | Orquestador único con módulos especializados |
| Rutas | `routes/ai.ts` flat | Consistente con `profile.ts`, `insights.ts` |
| Modelo | `claude-sonnet-4-5-20250929` | Balance coste/velocidad para free tier |
| Rate limiting | DB-based (tabla `ai_cache`) | Sobrevive restarts de Render |
| Fallback | Training-rules de shared (Bloque 4) | Degradación elegante, nunca falla |

---

## 3. Archivos a Crear/Modificar

| # | Archivo | Acción |
|---|---------|--------|
| 1 | `packages/shared/src/schemas/ai-response.ts` | **Crear** — Schemas Zod |
| 2 | `packages/shared/src/index.ts` | **Modificar** — Re-exports |
| 3 | `supabase/migrations/004_ai_cache.sql` | **Crear** — Tabla caché |
| 4 | `apps/api/src/services/ai/prompts.ts` | **Crear** — Prompt builders |
| 5 | `apps/api/src/services/ai/fallback.ts` | **Crear** — Fallback heurístico |
| 6 | `apps/api/src/services/ai/ai.service.ts` | **Crear** — Orquestador |
| 7 | `apps/api/src/routes/ai.ts` | **Crear** — 4 endpoints |
| 8 | `apps/api/src/app.ts` | **Modificar** — Registrar aiRoutes |
| 9 | `apps/api/src/services/ai/ai.service.test.ts` | **Crear** — ~15 tests |
| 10 | `apps/api/src/services/ai/fallback.test.ts` | **Crear** — ~8 tests |
| 11 | `apps/api/src/routes/routes.integration.test.ts` | **Modificar** — ~6 tests IA |

---

## 4. Schemas Zod (`ai-response.ts`)

### 4.1 AIActivityAnalysis

Usado por `AIAnalysisCard` en `/activities/[id]`:

```typescript
export const aiActivityAnalysisSchema = z.object({
  summary: z.string(),
  recommendation: z.string(),
  tips: z.object({
    hydration: z.string().optional(),
    nutrition: z.string().optional(),
    sleep: z.string().optional(),
  }),
});
```

### 4.2 AICoachTip

Usado por `AICoachCard` en dashboard:

```typescript
export const aiCoachTipSchema = z.object({
  recommendation: z.string(),
  tips: z.object({
    hydration: z.string().optional(),
    sleep: z.string().optional(),
    nutrition: z.string().optional(),
  }).optional(),
});
```

### 4.3 AIWeeklySummary

Usado por `AIInsightsCard` en `/insights`:

```typescript
export const aiWeeklySummarySchema = z.object({
  summary: z.string(),
  alert: z.string().optional(),
  recommendation: z.string(),
});
```

### 4.4 AIWeeklyPlanResponse

Genera `PlanDay[]` para `weekly_plans`:

```typescript
export const aiPlanDaySchema = z.object({
  day: z.string(),
  date: z.string(),
  type: activityTypeEnum,
  title: z.string(),
  intensity: z.enum(["alta", "media-alta", "media", "baja", "—"]),
  duration: z.string(),
  description: z.string(),
  nutrition: z.string(),
  rest: z.string(),
});

export const aiWeeklyPlanResponseSchema = z.object({
  days: z.array(aiPlanDaySchema).length(7),
  rationale: z.string(),
});
```

---

## 5. Migración 004 (`ai_cache`)

```sql
CREATE TABLE public.ai_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  cache_key TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  response JSONB NOT NULL,
  model TEXT,
  prompt_version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  UNIQUE(user_id, cache_key)
);

ALTER TABLE public.ai_cache ENABLE ROW LEVEL SECURITY;
-- RLS policies + índices para rate limit y lookups
```

**Cache keys**:
- `coach_tip_YYYY-MM-DD` — expira fin del día
- `analyze_activity_{activityId}` — expira 30 días
- `weekly_plan_{weekStart}` — expira 7 días
- `weekly_summary_{hash}` — expira 1 día

---

## 6. Prompts (`prompts.ts`)

### 6.1 Estructura

Cada función retorna `{ system: string; user: string }`.

**System prompt base** (compartido por los 4 endpoints):
```
Eres Coach IA, entrenador de ciclismo experto para ciclistas amateur de 40+ años.
Tono: cercano, motivador, basado en datos. Usa "Considera...", "Te sugiero...".
Responde SOLO en JSON válido, sin markdown. Textos en español. Máx 2-3 frases por campo.
```

**PROMPT_VERSION**: `"v1.0"` — persiste en `ai_cache` para tracking.

### 6.2 Contexto enviado a Claude

Cada prompt incluye en el user prompt:
- Perfil: edad, peso, FTP, FC máx, objetivo
- Métricas: CTL, ATL, TSB (de `calculateTrainingLoad`)
- Alertas activas (de `evaluateTrainingAlerts`)
- Datos específicos del endpoint (actividad, periodos, plan actual)

---

## 7. Fallback (`fallback.ts`)

4 funciones puras que usan training-rules de shared:

| Función | Lógica |
|---------|--------|
| `fallbackAnalyzeActivity` | Zona de actividad + alertas → summary/recommendation genéricos |
| `fallbackWeeklyPlan` | Template estándar 7 días según objetivo del usuario |
| `fallbackWeeklySummary` | Deltas de métricas + alertas → summary |
| `fallbackCoachTip` | TSB-based: fatigado→recovery, fresco→intensidad, normal→mantenimiento |

Output validado contra los mismos schemas Zod. Nunca lanzan excepciones.

---

## 8. AI Service (`ai.service.ts`)

### 8.1 Helpers internos

```typescript
callClaude(system, user) → string          // anthropic.messages.create
checkRateLimit(userId) → void              // COUNT ai_cache today, throw 429 si ≥20
getCachedResponse(userId, key, schema) → T | null
cacheResponse(userId, key, endpoint, response, expiresAt) → void
```

### 8.2 Funciones exportadas

```typescript
analyzeActivity(userId, activityId) → AIActivityAnalysis
  // Persiste en activities.ai_analysis + ai_cache (30 días)

generateWeeklyPlan(userId, weekStart?, forceRegenerate?) → { days: PlanDay[], rationale: string }
  // Upsert en weekly_plans + ai_cache (7 días)

generateWeeklySummary(userId, periodA*, periodB*) → AIWeeklySummary
  // Solo ai_cache (1 día)

getCoachTip(userId) → AICoachTip
  // ai_cache con clave diaria
```

### 8.3 Flujo de cada función

1. Rate limit check → 429 si excede
2. Cache check → return si existe y no expirado
3. Gather context (servicios existentes: getProfile, listActivities, etc.)
4. Compute metrics (calculateTrainingLoad, evaluateTrainingAlerts)
5. Build prompt (prompts.ts)
6. Call Claude (temperature: 0.3, max_tokens: 2048)
7. Parse JSON + validate Zod → si falla → **fallback** (no throw)
8. Persist (ai_cache + tabla destino)
9. Return respuesta tipada

---

## 9. Routes (`ai.ts`)

```
POST /api/v1/ai/analyze-activity    body: { activity_id: string }
POST /api/v1/ai/weekly-plan         body: { week_start?: string, force_regenerate?: boolean }
POST /api/v1/ai/weekly-summary      body: { period_a_start, period_a_end, period_b_start, period_b_end }
GET  /api/v1/ai/coach-tip           (sin body)
```

Patrón idéntico a `insights.ts`: validar params → llamar service → `{ data: result }`.

---

## 10. Testing

### 10.1 `ai.service.test.ts` (~15 tests)

Mock de `anthropic.messages.create` y `supabaseAdmin.from`:
- Happy path 4 endpoints
- Fallback cuando Claude falla (API error)
- Fallback cuando Claude devuelve JSON inválido
- Cache hit para coach-tip
- Cache bypass con force_regenerate
- Rate limit → 429 tras 20 llamadas
- Respuesta valida contra schema Zod

### 10.2 `fallback.test.ts` (~8 tests)

Funciones puras sin mocks:
- Cada fallback produce output válido contra schema
- Escenarios: fatigado (TSB negativo), fresco (TSB positivo), sin datos

### 10.3 `routes.integration.test.ts` (~6 tests)

- POST analyze-activity → 200
- POST analyze-activity sin body → 400
- POST weekly-plan → 200 con 7 días
- POST weekly-summary → 200
- GET coach-tip → 200
- Sin auth → 401

---

## 11. Criterios de Aceptación

- [ ] 4 endpoints responden 200 con estructura correcta
- [ ] Respuestas validan contra schemas Zod
- [ ] Rate limit: 429 tras 20 llamadas/día
- [ ] Coach-tip cacheado por día (no repite llamada Claude)
- [ ] Fallback funciona cuando Claude falla
- [ ] Activity analysis persiste en `activities.ai_analysis`
- [ ] Weekly plan persiste en `weekly_plans`
- [ ] ~29 tests nuevos pasando
- [ ] `pnpm typecheck`, `pnpm build`, `pnpm lint` sin errores
