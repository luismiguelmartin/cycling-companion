# L2 — Bloque 6: Weekly Plan CRUD

## Contexto

La tabla `weekly_plans` y la generación IA (`POST /api/v1/ai/weekly-plan`) ya existen (Bloques 0 y 5).
Este bloque añade endpoints CRUD para leer, actualizar y eliminar planes, permitiendo al frontend:
- Mostrar el plan de la semana actual o de cualquier semana pasada.
- Marcar días como completados (`done: true`, `actual_power`).
- Navegar entre semanas.

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/plan?week_start=YYYY-MM-DD` | Obtener plan de una semana. Si no hay `week_start`, usa lunes actual. |
| PATCH | `/api/v1/plan` | Actualizar plan (body: `{ week_start, days }`) |
| DELETE | `/api/v1/plan?week_start=YYYY-MM-DD` | Eliminar plan de una semana |

## Archivos

| # | Archivo | Acción |
|---|---------|--------|
| 1 | `apps/api/src/services/plan.service.ts` | **Crear** — getPlan, updatePlan, deletePlan |
| 2 | `apps/api/src/services/plan.service.test.ts` | **Crear** — ~10 tests |
| 3 | `apps/api/src/routes/plans.ts` | **Crear** — 3 endpoints |
| 4 | `apps/api/src/app.ts` | **Modificar** — registrar planRoutes |
| 5 | `apps/api/src/routes/routes.integration.test.ts` | **Modificar** — ~6 tests integración |

## Servicio (`plan.service.ts`)

### `getPlan(userId, weekStart)`
- Query: `SELECT * FROM weekly_plans WHERE user_id = ? AND week_start = ?`
- La columna `plan_data` es JSONB con `{ days: PlanDay[] }`
- Retorna `WeeklyPlan | null` (mapeando `plan_data.days` + metadatos)

### `updatePlan(userId, weekStart, days)`
- Update: `UPDATE weekly_plans SET plan_data = { days }, updated_at = NOW() WHERE user_id = ? AND week_start = ?`
- Valida input con Zod
- Retorna plan actualizado
- Si no existe → AppError 404

### `deletePlan(userId, weekStart)`
- Delete: `DELETE FROM weekly_plans WHERE user_id = ? AND week_start = ?`
- Retorna void (204)

## Respuestas

### GET /api/v1/plan
```json
// 200 — plan encontrado
{
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "week_start": "2026-02-10",
    "days": [ /* 7 PlanDay */ ],
    "ai_rationale": "Plan adaptado...",
    "created_at": "2026-02-10T08:00:00Z",
    "updated_at": "2026-02-10T08:00:00Z"
  }
}

// 200 — sin plan
{ "data": null }
```

### PATCH /api/v1/plan
```json
// Body
{
  "week_start": "2026-02-10",
  "days": [ /* 7 PlanDay actualizados */ ]
}

// 200 — actualizado
{ "data": { /* plan completo */ } }
```

### DELETE /api/v1/plan
```
204 No Content
```

## Tests esperados

### Unit tests (`plan.service.test.ts`)
1. getPlan retorna plan existente con días mapeados
2. getPlan retorna null si no existe
3. getPlan maneja error de Supabase
4. updatePlan actualiza plan existente
5. updatePlan lanza 404 si no existe
6. updatePlan maneja error de Supabase
7. deletePlan elimina plan existente
8. deletePlan lanza 404 si no existe

### Integration tests (`routes.integration.test.ts`)
1. GET /api/v1/plan con week_start devuelve 200 con plan
2. GET /api/v1/plan sin week_start usa lunes actual
3. GET /api/v1/plan sin plan devuelve 200 con null
4. PATCH /api/v1/plan devuelve 200 con plan actualizado
5. DELETE /api/v1/plan devuelve 204
6. Rutas plan sin auth devuelven 401
