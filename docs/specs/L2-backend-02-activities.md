# L2 — Diseño Técnico: CRUD de Actividades (Bloque 2)

> **Tipo**: Especificación técnica (L2)
> **Fase**: 3 — Backend + IA
> **Bloque**: 2 — Actividades (CRUD completo)
> **Estado**: ✅ Implementado (retroactivo)
> **Fecha**: 2026-02-15
> **Commit**: `ba20cb4`

---

## 1. Objetivo

Implementar CRUD completo de actividades para:
- Listar actividades con paginación, filtros y búsqueda
- Obtener detalle de una actividad
- Crear nueva actividad (con cálculo automático de TSS)
- Actualizar actividad existente
- Eliminar actividad
- Obtener métricas temporales de una actividad (series de potencia/FC/cadencia)

Estos endpoints son consumidos por las pantallas:
- `/activities` (lista)
- `/activities/[id]` (detalle)
- `/activities/import` (crear)

---

## 2. Contratos de API

### 2.1 GET /api/v1/activities

**Propósito**: Listar actividades del usuario con paginación, filtros y búsqueda.

**Autenticación**: ✅ Requerida

**Query Parameters**:
```typescript
{
  page?: number;        // Default: 1
  limit?: number;       // Default: 10, Max: 100
  type?: ActivityType;  // intervals | endurance | recovery | tempo | rest
  search?: string;      // Búsqueda en nombre de actividad
  sortBy?: string;      // Default: 'date'
  order?: 'asc' | 'desc'; // Default: 'desc'
}
```

**Request**:
```http
GET /api/v1/activities?page=1&limit=10&type=endurance&search=sunday HTTP/1.1
Host: localhost:3001
Authorization: Bearer <jwt_token>
```

**Response 200 OK**:
```json
{
  "data": [
    {
      "id": "uuid-activity-123",
      "user_id": "uuid-user-123",
      "name": "Sunday Long Ride",
      "activity_type": "endurance",
      "date": "2026-02-14T08:00:00.000Z",
      "duration": 7200,
      "distance": 80000,
      "avg_power": 210,
      "normalized_power": 220,
      "avg_hr": 145,
      "avg_cadence": 85,
      "elevation_gain": 1200,
      "tss": 180,
      "rpe": 7,
      "notes": "Great ride, felt strong",
      "ai_analysis": { "summary": "Well-paced endurance ride..." },
      "created_at": "2026-02-14T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

**Paginación**:
- `page`: Página actual (base 1)
- `limit`: Actividades por página
- `total`: Total de actividades (después de filtros)
- `totalPages`: Ceil(total / limit)

**Filtros**:
- `type`: Solo actividades del tipo especificado
- `search`: Búsqueda insensible a mayúsculas en campo `name` (ILIKE)

**Ordenamiento**:
- Default: `date DESC` (más recientes primero)
- Soporta `asc`/`desc` en cualquier campo

---

### 2.2 GET /api/v1/activities/:id

**Propósito**: Obtener detalle completo de una actividad.

**Autenticación**: ✅ Requerida

**Request**:
```http
GET /api/v1/activities/uuid-activity-123 HTTP/1.1
Authorization: Bearer <jwt_token>
```

**Response 200 OK**:
```json
{
  "id": "uuid-activity-123",
  "user_id": "uuid-user-123",
  "name": "Sunday Long Ride",
  "activity_type": "endurance",
  "date": "2026-02-14T08:00:00.000Z",
  "duration": 7200,
  "distance": 80000,
  "avg_power": 210,
  "normalized_power": 220,
  "avg_hr": 145,
  "avg_cadence": 85,
  "elevation_gain": 1200,
  "tss": 180,
  "rpe": 7,
  "notes": "Great ride, felt strong",
  "is_reference": false,
  "ai_analysis": {
    "summary": "Well-paced endurance ride...",
    "strengths": ["Consistent power", "Good pacing"],
    "areas_to_improve": ["Cadence could be higher"],
    "next_steps": ["Focus on Z2 work"]
  },
  "created_at": "2026-02-14T10:00:00.000Z",
  "updated_at": "2026-02-14T10:00:00.000Z"
}
```

**Response 404 Not Found**:
```json
{
  "error": "Activity not found",
  "code": "NOT_FOUND"
}
```

**Validación de ownership**: Query filtra por `user_id = request.user.id` → usuario solo ve sus actividades.

---

### 2.3 POST /api/v1/activities

**Propósito**: Crear nueva actividad (importación manual o desde archivo).

**Autenticación**: ✅ Requerida

**Request**:
```http
POST /api/v1/activities HTTP/1.1
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Morning Ride",
  "activity_type": "endurance",
  "date": "2026-02-15T07:00:00.000Z",
  "duration": 3600,
  "distance": 40000,
  "avg_power": 200,
  "normalized_power": 210,
  "avg_hr": 140,
  "avg_cadence": 90,
  "elevation_gain": 500,
  "rpe": 6,
  "notes": "Easy spin"
}
```

**Validación**: Body validado con `activitySchema` de `@cycling-companion/shared`.

**Campos requeridos**:
- `name` (string, min 1 char)
- `activity_type` (enum)
- `date` (datetime)
- `duration` (number, > 0, en segundos)

**Campos opcionales**:
- `distance` (metros)
- `avg_power`, `normalized_power` (watts)
- `avg_hr` (bpm)
- `avg_cadence` (rpm)
- `elevation_gain` (metros)
- `rpe` (1-10)
- `notes` (string)

**Cálculo automático de TSS**:
Si actividad incluye `avg_power` y usuario tiene `ftp` definido:
```typescript
const intensityFactor = avg_power / ftp;
const tss = Math.round(
  Math.pow(intensityFactor, 2) * (duration / 3600) * 100
);
```

**Response 201 Created**:
```json
{
  "id": "uuid-new-activity",
  "user_id": "uuid-user-123",
  "name": "Morning Ride",
  "activity_type": "endurance",
  "date": "2026-02-15T07:00:00.000Z",
  "duration": 3600,
  "distance": 40000,
  "avg_power": 200,
  "normalized_power": 210,
  "avg_hr": 140,
  "avg_cadence": 90,
  "elevation_gain": 500,
  "tss": 120,  // ← Calculado automáticamente
  "rpe": 6,
  "notes": "Easy spin",
  "ai_analysis": null,
  "is_reference": false,
  "created_at": "2026-02-15T08:00:00.000Z",
  "updated_at": "2026-02-15T08:00:00.000Z"
}
```

**Response 400 Bad Request** (validación):
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "path": ["duration"],
      "message": "Number must be greater than 0"
    }
  ]
}
```

---

### 2.4 PATCH /api/v1/activities/:id

**Propósito**: Actualizar actividad existente (parcial).

**Autenticación**: ✅ Requerida

**Request**:
```http
PATCH /api/v1/activities/uuid-activity-123 HTTP/1.1
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Sunday Long Ride (Updated)",
  "rpe": 8,
  "notes": "Harder than expected"
}
```

**Validación**: `activitySchema.partial()` (permite campos opcionales).

**Recalculo de TSS**: Si se actualiza `avg_power` o `normalized_power`, TSS se recalcula automáticamente.

**Response 200 OK**: Actividad completa actualizada (igual formato que GET).

**Response 404 Not Found**: Actividad no existe o no pertenece al usuario.

---

### 2.5 DELETE /api/v1/activities/:id

**Propósito**: Eliminar actividad.

**Autenticación**: ✅ Requerida

**Request**:
```http
DELETE /api/v1/activities/uuid-activity-123 HTTP/1.1
Authorization: Bearer <jwt_token>
```

**Response 204 No Content**: Actividad eliminada exitosamente.

**Response 404 Not Found**: Actividad no existe o no pertenece al usuario.

**Cascade**: Si existen `activity_metrics` asociadas, se eliminan también (FK con ON DELETE CASCADE).

---

### 2.6 GET /api/v1/activities/:id/metrics

**Propósito**: Obtener series temporales de métricas (potencia/FC/cadencia por segundo).

**Autenticación**: ✅ Requerida

**Request**:
```http
GET /api/v1/activities/uuid-activity-123/metrics HTTP/1.1
Authorization: Bearer <jwt_token>
```

**Response 200 OK**:
```json
{
  "activity_id": "uuid-activity-123",
  "metrics": [
    {
      "timestamp": 0,
      "power": 200,
      "heart_rate": 140,
      "cadence": 90,
      "speed": 8.5
    },
    {
      "timestamp": 1,
      "power": 205,
      "heart_rate": 142,
      "cadence": 91,
      "speed": 8.6
    }
    // ... hasta duration segundos
  ]
}
```

**Response 200 OK (sin métricas)**:
```json
{
  "activity_id": "uuid-activity-123",
  "metrics": []
}
```

**Response 404 Not Found**: Actividad no existe o no pertenece al usuario.

**Performance**: Si hay miles de puntos, considerar paginación o sampling (futuro).

---

## 3. Arquitectura

### 3.1 Capa de Servicio

**Archivo**: `apps/api/src/services/activity.service.ts`

**Métodos**:

#### `listActivities(userId, filters)`

```typescript
export async function listActivities(
  userId: string,
  filters: ActivityFilters = {}
) {
  const {
    page = 1,
    limit = 10,
    type,
    search,
    sortBy = 'date',
    order = 'desc',
  } = filters;

  let query = supabase
    .from('activities')
    .select('*', { count: 'exact' })
    .eq('user_id', userId);

  // Filtro por tipo
  if (type) {
    query = query.eq('activity_type', type);
  }

  // Búsqueda en nombre
  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  // Ordenamiento
  query = query.order(sortBy, { ascending: order === 'asc' });

  // Paginación
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new AppError('Failed to fetch activities', 500, 'FETCH_FAILED');
  }

  return {
    data: data || [],
    meta: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  };
}
```

#### `getActivity(userId, activityId)`

```typescript
export async function getActivity(userId: string, activityId: string) {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('id', activityId)
    .eq('user_id', userId) // Validación de ownership
    .single();

  if (error || !data) {
    throw new AppError('Activity not found', 404, 'NOT_FOUND');
  }

  return data;
}
```

#### `createActivity(userId, activityData)`

```typescript
export async function createActivity(
  userId: string,
  activityData: ActivityInput
) {
  const validated = activitySchema.parse(activityData);

  // Obtener FTP del usuario para cálculo de TSS
  const profile = await getProfile(userId);

  // Calcular TSS si hay potencia y FTP
  let tss: number | null = null;
  if (validated.avg_power && profile.ftp) {
    const intensityFactor = validated.avg_power / profile.ftp;
    tss = Math.round(
      Math.pow(intensityFactor, 2) * (validated.duration / 3600) * 100
    );
  }

  const { data, error } = await supabase
    .from('activities')
    .insert({
      ...validated,
      user_id: userId,
      tss,
    })
    .select()
    .single();

  if (error || !data) {
    throw new AppError('Failed to create activity', 500, 'CREATE_FAILED');
  }

  return data;
}
```

**Lógica TSS**:
```
IF² = (avg_power / ftp)²
TSS = IF² × duration_hours × 100

Ejemplo:
  avg_power = 200W
  ftp = 250W
  duration = 3600s = 1h

  IF = 200/250 = 0.8
  IF² = 0.64
  TSS = 0.64 × 1 × 100 = 64
```

#### `updateActivity(userId, activityId, updates)`

```typescript
export async function updateActivity(
  userId: string,
  activityId: string,
  updates: Partial<ActivityInput>
) {
  const validated = activitySchema.partial().parse(updates);

  // Recalcular TSS si se actualizó potencia
  let tss: number | null | undefined = validated.tss;
  if (validated.avg_power !== undefined) {
    const profile = await getProfile(userId);
    if (profile.ftp) {
      const activity = await getActivity(userId, activityId);
      const power = validated.avg_power ?? activity.avg_power;
      const duration = validated.duration ?? activity.duration;

      const intensityFactor = power / profile.ftp;
      tss = Math.round(
        Math.pow(intensityFactor, 2) * (duration / 3600) * 100
      );
    }
  }

  const { data, error } = await supabase
    .from('activities')
    .update({ ...validated, tss })
    .eq('id', activityId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error || !data) {
    throw new AppError('Failed to update activity', 500, 'UPDATE_FAILED');
  }

  return data;
}
```

#### `deleteActivity(userId, activityId)`

```typescript
export async function deleteActivity(userId: string, activityId: string) {
  const { error } = await supabase
    .from('activities')
    .delete()
    .eq('id', activityId)
    .eq('user_id', userId);

  if (error) {
    throw new AppError('Failed to delete activity', 500, 'DELETE_FAILED');
  }

  return { success: true };
}
```

#### `getActivityMetrics(userId, activityId)`

```typescript
export async function getActivityMetrics(userId: string, activityId: string) {
  // Verificar ownership
  await getActivity(userId, activityId);

  const { data, error } = await supabase
    .from('activity_metrics')
    .select('*')
    .eq('activity_id', activityId)
    .order('timestamp', { ascending: true });

  if (error) {
    throw new AppError('Failed to fetch metrics', 500, 'FETCH_FAILED');
  }

  return {
    activity_id: activityId,
    metrics: data || [],
  };
}
```

---

### 3.2 Capa de Rutas

**Archivo**: `apps/api/src/routes/activities.ts`

```typescript
import type { FastifyInstance } from 'fastify';
import {
  listActivities,
  getActivity,
  createActivity,
  updateActivity,
  deleteActivity,
  getActivityMetrics,
} from '../services/activity.service';

export default async function activityRoutes(fastify: FastifyInstance) {
  // GET /api/v1/activities
  fastify.get('/activities', async (request) => {
    const userId = request.user!.id;
    const filters = request.query as ActivityFilters;
    return await listActivities(userId, filters);
  });

  // GET /api/v1/activities/:id
  fastify.get<{ Params: { id: string } }>(
    '/activities/:id',
    async (request) => {
      const userId = request.user!.id;
      const { id } = request.params;
      return await getActivity(userId, id);
    }
  );

  // POST /api/v1/activities
  fastify.post('/activities', async (request) => {
    const userId = request.user!.id;
    const activityData = request.body as ActivityInput;
    const created = await createActivity(userId, activityData);
    return created;
  });

  // PATCH /api/v1/activities/:id
  fastify.patch<{ Params: { id: string } }>(
    '/activities/:id',
    async (request) => {
      const userId = request.user!.id;
      const { id } = request.params;
      const updates = request.body as Partial<ActivityInput>;
      return await updateActivity(userId, id, updates);
    }
  );

  // DELETE /api/v1/activities/:id
  fastify.delete<{ Params: { id: string } }>(
    '/activities/:id',
    async (request, reply) => {
      const userId = request.user!.id;
      const { id } = request.params;
      await deleteActivity(userId, id);
      reply.status(204).send();
    }
  );

  // GET /api/v1/activities/:id/metrics
  fastify.get<{ Params: { id: string } }>(
    '/activities/:id/metrics',
    async (request) => {
      const userId = request.user!.id;
      const { id } = request.params;
      return await getActivityMetrics(userId, id);
    }
  );
}
```

**Registro en app.ts**:
```typescript
await app.register(activityRoutes); // Dentro del scope protegido
```

---

## 4. Validación de Datos

**Schema Zod**: `packages/shared/src/schemas/activity.ts`

```typescript
export const activitySchema = z.object({
  name: z.string().min(1),
  activity_type: z.enum(['intervals', 'endurance', 'recovery', 'tempo', 'rest']),
  date: z.string().datetime(),
  duration: z.number().positive(),
  distance: z.number().nonnegative().optional(),
  avg_power: z.number().nonnegative().optional(),
  normalized_power: z.number().nonnegative().optional(),
  avg_hr: z.number().positive().optional(),
  avg_cadence: z.number().nonnegative().optional(),
  elevation_gain: z.number().nonnegative().optional(),
  rpe: z.number().int().min(1).max(10).optional(),
  notes: z.string().optional(),
});
```

**Uso**:
- POST: `activitySchema.parse(body)`
- PATCH: `activitySchema.partial().parse(body)`

---

## 5. Testing

**Casos clave**:

```typescript
describe('GET /api/v1/activities', () => {
  it('should paginate correctly', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/activities?page=2&limit=5',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.json().meta).toEqual({
      page: 2,
      limit: 5,
      total: expect.any(Number),
      totalPages: expect.any(Number),
    });
  });

  it('should filter by type', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/activities?type=endurance',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.json().data.every(a => a.activity_type === 'endurance')).toBe(true);
  });
});

describe('POST /api/v1/activities', () => {
  it('should calculate TSS automatically', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/activities',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        name: 'Test Ride',
        activity_type: 'endurance',
        date: new Date().toISOString(),
        duration: 3600,
        avg_power: 200, // Asume FTP=250 → TSS=64
      },
    });

    expect(response.json().tss).toBe(64);
  });
});
```

---

## 6. Decisiones Técnicas (ADRs)

### ADR-007: Cálculo automático de TSS

**Decisión**: Calcular TSS en backend al crear/actualizar actividad.

**Rationale**:
- ✅ Consistencia: mismo algoritmo para todos los clientes
- ✅ No exponer lógica de cálculo al frontend
- ✅ Requiere FTP del usuario (disponible en backend)

**Fórmula**: `TSS = IF² × duration_hours × 100` donde `IF = avg_power / ftp`

### ADR-008: Paginación con meta

**Decisión**: Retornar `{ data, meta }` en listados.

**Rationale**:
- ✅ Frontend puede construir UI de paginación
- ✅ Estándar en APIs REST
- ✅ Incluye `totalPages` para simplificar lógica de UI

### ADR-009: Filtro de ownership implícito

**Decisión**: Queries filtran siempre por `user_id` del token.

**Rationale**:
- ✅ Seguridad: usuario solo ve sus actividades
- ✅ No requiere RLS activo (aunque backend usa service_role)
- ✅ Consistente con principio de autorización en API layer

---

## 7. Criterios de Aceptación

- [x] `GET /api/v1/activities` retorna lista paginada
- [x] Paginación con `page`, `limit`, `total`, `totalPages`
- [x] Filtro por `type` funcional
- [x] Búsqueda por `search` en nombre (case-insensitive)
- [x] `GET /api/v1/activities/:id` retorna actividad completa
- [x] `POST /api/v1/activities` crea actividad con TSS calculado
- [x] `PATCH /api/v1/activities/:id` actualiza parcialmente
- [x] TSS se recalcula si se actualiza `avg_power`
- [x] `DELETE /api/v1/activities/:id` elimina actividad
- [x] `GET /api/v1/activities/:id/metrics` retorna series temporales
- [x] Todos los endpoints validan ownership (user_id)
- [x] Errores formateados por error handler

---

## 8. Archivos Modificados/Creados

**Nuevos**:
- `apps/api/src/services/activity.service.ts`
- `apps/api/src/routes/activities.ts`

**Modificados**:
- `apps/api/src/app.ts` (registro de `activityRoutes`)

---

## 9. Próximos Pasos (Bloque 3)

Con CRUD de actividades completo, Bloque 3 puede implementar:
- `POST /api/v1/activities/upload` (parseo .fit/.gpx)
- `POST /api/v1/ai/analyze-activity` (análisis IA post-sesión)
- `POST /api/v1/ai/weekly-plan` (generación plan semanal)
- `GET /api/v1/ai/coach-tip` (recomendación del día para dashboard)
- `POST /api/v1/ai/weekly-summary` (resumen comparativo para insights)
