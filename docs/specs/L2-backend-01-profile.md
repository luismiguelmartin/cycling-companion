# L2 — Diseño Técnico: Endpoints de Perfil (Bloque 1)

> **Tipo**: Especificación técnica (L2)
> **Fase**: 3 — Backend + IA
> **Bloque**: 1 — Perfil (GET/PATCH)
> **Estado**: ✅ Implementado (retroactivo)
> **Fecha**: 2026-02-15
> **Commit**: `b9da9a8`

---

## 1. Objetivo

Implementar endpoints de perfil de usuario para:
- Obtener datos del perfil actual (`GET /api/v1/profile`)
- Actualizar datos del perfil (`PATCH /api/v1/profile`)

Estos endpoints son consumidos por la pantalla `/profile` del frontend.

---

## 2. Contratos de API

### 2.1 GET /api/v1/profile

**Propósito**: Obtener el perfil del usuario autenticado.

**Autenticación**: ✅ Requerida (JWT en header `Authorization`)

**Request**:
```http
GET /api/v1/profile HTTP/1.1
Host: localhost:3001
Authorization: Bearer <jwt_token>
```

**Response 200 OK**:
```json
{
  "id": "uuid-user-123",
  "email": "usuario@example.com",
  "name": "Juan Pérez",
  "age": 45,
  "weight": 75,
  "ftp": 250,
  "max_hr": 180,
  "resting_hr": 55,
  "goal": "performance",
  "created_at": "2026-02-10T10:00:00.000Z",
  "updated_at": "2026-02-15T12:30:00.000Z"
}
```

**Response 401 Unauthorized**:
```json
{
  "error": "Missing or invalid authorization header",
  "code": "UNAUTHORIZED"
}
```

**Response 404 Not Found**:
```json
{
  "error": "User profile not found",
  "code": "NOT_FOUND"
}
```

---

### 2.2 PATCH /api/v1/profile

**Propósito**: Actualizar datos del perfil del usuario autenticado.

**Autenticación**: ✅ Requerida

**Request**:
```http
PATCH /api/v1/profile HTTP/1.1
Host: localhost:3001
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Juan Pérez Actualizado",
  "weight": 74,
  "ftp": 255,
  "goal": "health"
}
```

**Validación**: Body validado con `onboardingSchema.partial()` de `@cycling-companion/shared`.

**Campos actualizables**:
- `name` (string, min 1 char)
- `age` (number, >= 18)
- `weight` (number, > 0)
- `ftp` (number, > 0)
- `max_hr` (number, > 0)
- `resting_hr` (number, > 0)
- `goal` (enum: `performance`, `health`, `weight_loss`, `recovery`)

**Response 200 OK**:
```json
{
  "id": "uuid-user-123",
  "email": "usuario@example.com",
  "name": "Juan Pérez Actualizado",
  "age": 45,
  "weight": 74,
  "ftp": 255,
  "max_hr": 180,
  "resting_hr": 55,
  "goal": "health",
  "created_at": "2026-02-10T10:00:00.000Z",
  "updated_at": "2026-02-15T14:00:00.000Z"
}
```

**Response 400 Bad Request** (validación Zod):
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "code": "too_small",
      "minimum": 0,
      "path": ["ftp"],
      "message": "Number must be greater than 0"
    }
  ]
}
```

**Response 401 Unauthorized**:
```json
{
  "error": "Missing or invalid authorization header",
  "code": "UNAUTHORIZED"
}
```

**Response 404 Not Found**:
```json
{
  "error": "User profile not found",
  "code": "NOT_FOUND"
}
```

---

## 3. Arquitectura

### 3.1 Capa de Servicio

**Archivo**: `apps/api/src/services/profile.service.ts`

**Responsabilidad**: Lógica de negocio para operaciones de perfil.

**Métodos**:

#### `getProfile(userId: string)`

```typescript
export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) {
    throw new AppError('User profile not found', 404, 'NOT_FOUND');
  }

  return data;
}
```

**Comportamiento**:
- Query a tabla `users` filtrando por `id`
- `.single()` garantiza un único resultado
- Si no existe, lanza `AppError` con 404

#### `updateProfile(userId: string, updates: Partial<OnboardingData>)`

```typescript
export async function updateProfile(
  userId: string,
  updates: Partial<OnboardingData>
) {
  // Validar con schema parcial
  const validatedUpdates = onboardingSchema.partial().parse(updates);

  const { data, error } = await supabase
    .from('users')
    .update(validatedUpdates)
    .eq('id', userId)
    .select()
    .single();

  if (error || !data) {
    throw new AppError('Failed to update profile', 500, 'UPDATE_FAILED');
  }

  return data;
}
```

**Comportamiento**:
- Valida `updates` con `onboardingSchema.partial()` (permite campos opcionales)
- Update solo de los campos enviados (PATCH semántico)
- Retorna perfil actualizado con `.select().single()`

---

### 3.2 Capa de Rutas

**Archivo**: `apps/api/src/routes/profile.ts`

**Responsabilidad**: Definir endpoints HTTP y delegar a servicio.

```typescript
import type { FastifyInstance } from 'fastify';
import { getProfile, updateProfile } from '../services/profile.service';

export default async function profileRoutes(fastify: FastifyInstance) {
  // GET /api/v1/profile
  fastify.get('/profile', async (request) => {
    const userId = request.user!.id;
    return await getProfile(userId);
  });

  // PATCH /api/v1/profile
  fastify.patch('/profile', async (request) => {
    const userId = request.user!.id;
    const updates = request.body as Partial<OnboardingData>;
    return await updateProfile(userId, updates);
  });
}
```

**Notas**:
- `request.user!.id`: Decorado por plugin `authenticate` (Bloque 0)
- No requiere validación explícita de body (Zod en servicio lanza ZodError, capturado por error handler)
- Rutas registradas en scope protegido (`/api/v1` con auth hook)

---

### 3.3 Integración en app.ts

**Archivo**: `apps/api/src/app.ts`

**Registro de rutas**:
```typescript
import profileRoutes from './routes/profile';

export async function buildApp(opts?: FastifyServerOptions) {
  const fastify = Fastify(opts);

  // ... plugins globales

  // Rutas protegidas
  await fastify.register(async (app) => {
    app.addHook('onRequest', app.authenticate);

    // Registrar rutas de perfil
    await app.register(profileRoutes);

  }, { prefix: '/api/v1' });

  return fastify;
}
```

**Efecto**: Todas las rutas de `profileRoutes` quedan bajo `/api/v1/` y protegidas por auth.

---

## 4. Validación de Datos

### Schema Zod Reutilizado

**Origen**: `packages/shared/src/schemas/user-profile.ts`

```typescript
export const onboardingSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.number().int().min(18, 'Must be at least 18 years old'),
  weight: z.number().positive('Weight must be positive'),
  ftp: z.number().positive('FTP must be positive'),
  max_hr: z.number().positive('Max HR must be positive'),
  resting_hr: z.number().positive('Resting HR must be positive'),
  goal: z.enum(['performance', 'health', 'weight_loss', 'recovery']),
});

export type OnboardingData = z.infer<typeof onboardingSchema>;
```

**Uso en PATCH**:
```typescript
const validatedUpdates = onboardingSchema.partial().parse(updates);
```

**Comportamiento de `.partial()`**:
- Todos los campos se vuelven opcionales
- Permite PATCH de cualquier combinación de campos
- Validación sigue activa: si envías `ftp: -10`, falla con ZodError

**Ejemplo**:
```typescript
// ✅ Válido: solo actualizar weight
{ weight: 74 }

// ✅ Válido: actualizar múltiples campos
{ weight: 74, ftp: 255, goal: "health" }

// ❌ Inválido: ftp negativo
{ ftp: -10 }
// → ZodError → 400 Bad Request
```

---

## 5. Manejo de Errores

**Errores manejados**:

1. **401 Unauthorized** (auth plugin)
   - Token faltante o inválido
   - Antes de llegar a la ruta

2. **400 Bad Request** (error handler + ZodError)
   - Body no cumple schema
   - Ejemplo: `ftp: "abc"`, `goal: "invalid"`

3. **404 Not Found** (servicio)
   - Usuario no existe en tabla `users`
   - Caso raro: token válido pero perfil eliminado

4. **500 Internal Server Error** (error handler)
   - Error de Supabase
   - Error inesperado

**Todos capturados por error handler de Bloque 0** → respuesta JSON estructurada.

---

## 6. Testing

### Tests de Integración

**Archivo**: `apps/api/src/routes/profile.test.ts` (futuro)

**Casos**:

```typescript
describe('GET /api/v1/profile', () => {
  it('should return user profile with valid token', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/profile',
      headers: { authorization: `Bearer ${validToken}` },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      id: expect.any(String),
      email: expect.any(String),
      name: expect.any(String),
    });
  });

  it('should return 401 without token', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/profile',
    });

    expect(response.statusCode).toBe(401);
  });
});

describe('PATCH /api/v1/profile', () => {
  it('should update profile with valid data', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/profile',
      headers: { authorization: `Bearer ${validToken}` },
      payload: { weight: 74, ftp: 255 },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().weight).toBe(74);
    expect(response.json().ftp).toBe(255);
  });

  it('should return 400 with invalid data', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/api/v1/profile',
      headers: { authorization: `Bearer ${validToken}` },
      payload: { ftp: -10 },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().code).toBe('VALIDATION_ERROR');
  });
});
```

---

## 7. Decisiones Técnicas (ADRs)

### ADR-004: PATCH semántico con .partial()

**Contexto**: Frontend puede actualizar solo algunos campos del perfil.

**Decisión**: Usar `onboardingSchema.partial()` para permitir actualizaciones parciales.

**Consecuencias**:
- ✅ RESTful correcto (PATCH permite actualizaciones parciales)
- ✅ Reutiliza schema existente sin duplicación
- ✅ Validación consistente con onboarding
- ⚠️ Si se añade campo nuevo a schema, automáticamente se vuelve actualizable

### ADR-005: userId desde request.user

**Contexto**: Usuario autenticado debe poder solo ver/actualizar su propio perfil.

**Decisión**: Extraer `userId` de `request.user` (decorado por auth plugin).

**Consecuencias**:
- ✅ Seguridad: usuario no puede editar perfiles de otros
- ✅ No requiere parámetro `:userId` en URL
- ✅ Consistente con RLS de Supabase (aunque bypaseado con service_role)

### ADR-006: Service layer para lógica de negocio

**Contexto**: Separar lógica de negocio de routing.

**Decisión**: Crear `profile.service.ts` con `getProfile` y `updateProfile`.

**Consecuencias**:
- ✅ Testeable independientemente de Fastify
- ✅ Reutilizable (ej: desde endpoint de IA que necesite leer perfil)
- ✅ Single Responsibility: routes maneja HTTP, service maneja datos
- ⚠️ Capa extra (pero justificada para proyectos con múltiples endpoints)

---

## 8. Criterios de Aceptación

- [x] `GET /api/v1/profile` retorna perfil del usuario autenticado
- [x] `GET /api/v1/profile` retorna 401 sin token válido
- [x] `GET /api/v1/profile` retorna 404 si usuario no existe
- [x] `PATCH /api/v1/profile` actualiza solo los campos enviados
- [x] `PATCH /api/v1/profile` valida con `onboardingSchema.partial()`
- [x] `PATCH /api/v1/profile` retorna 400 si datos inválidos
- [x] `PATCH /api/v1/profile` retorna perfil actualizado con `updated_at` nuevo
- [x] Ambos endpoints protegidos con auth hook
- [x] Errores formateados por error handler centralizado

---

## 9. Archivos Modificados/Creados

**Nuevos**:
- `apps/api/src/services/profile.service.ts`
- `apps/api/src/routes/profile.ts`

**Modificados**:
- `apps/api/src/app.ts` (registro de `profileRoutes`)

---

## 10. Integración con Frontend

**Pantalla**: `/profile` (`apps/web/src/app/(app)/profile/page.tsx`)

**Consumo**:
```typescript
// GET profile
const response = await fetch(`${API_URL}/api/v1/profile`, {
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
  },
});
const profile = await response.json();

// PATCH profile
await fetch(`${API_URL}/api/v1/profile`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ weight: 74, ftp: 255 }),
});
```

**Estado actual**: Frontend consume Supabase directamente. Migración a API en fase futura.

---

## 11. Próximos Pasos (Bloque 2)

Con endpoints de perfil listos, Bloque 2 puede implementar:
- CRUD completo de actividades (`GET`, `POST`, `PATCH`, `DELETE`)
- Paginación y filtros en `GET /api/v1/activities`
- Endpoint `GET /api/v1/activities/:id/metrics` para series temporales
- Service `activity.service.ts` con cálculo automático de TSS
