# L2 — Diseño Técnico: Infraestructura Base del Backend (Bloque 0)

> **Tipo**: Especificación técnica (L2)
> **Fase**: 3 — Backend + IA
> **Bloque**: 0 — Infraestructura
> **Estado**: ✅ Implementado (retroactivo)
> **Fecha**: 2026-02-15
> **Commit**: `a721d43`

---

## 1. Objetivo

Establecer la infraestructura base del backend Fastify para soportar:
- Configuración y validación de variables de entorno
- Autenticación JWT con Supabase
- Manejo centralizado de errores
- CORS para el frontend Next.js
- Clientes de Supabase (service role) y Anthropic (Claude API)
- Estructura testeable (factory pattern)

---

## 2. Arquitectura

### 2.1 Separación Entry Point vs Factory

**Problema**: `index.ts` monolítico dificulta testing y reutilización.

**Solución**: Factory pattern
```
apps/api/src/
├── index.ts           # Entry point (start server, puerto 3001)
└── app.ts             # Factory (build app, export para tests)
```

**app.ts** exporta función `buildApp()`:
```typescript
export async function buildApp(opts?: FastifyServerOptions) {
  const fastify = Fastify(opts);

  // Registrar plugins globales
  await fastify.register(cors);
  await fastify.register(errorHandler);

  // Health check público
  await fastify.register(healthRoutes);

  // Rutas protegidas bajo /api/v1
  await fastify.register(async (app) => {
    app.addHook('onRequest', app.authenticate);
    // Aquí van profileRoutes, activityRoutes, etc.
  }, { prefix: '/api/v1' });

  return fastify;
}
```

**index.ts** consume `buildApp()`:
```typescript
const app = await buildApp({ logger: true });
await app.listen({ port: config.port, host: '0.0.0.0' });
```

**Ventaja**: Tests pueden importar `buildApp()` sin levantar servidor.

---

### 2.2 Validación de Variables de Entorno

**Archivo**: `apps/api/src/config/env.ts`

**Schema Zod**:
```typescript
const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1),
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export const config = envSchema.parse(process.env);
```

**Comportamiento**:
- ❌ Falla en startup si falta variable requerida
- ✅ Type-safe: `config.SUPABASE_URL` es `string`, `config.PORT` es `number`
- ✅ Defaults: `PORT=3001`, `NODE_ENV=development`

---

### 2.3 Plugin: CORS

**Archivo**: `apps/api/src/plugins/cors.ts`

**Propósito**: Permitir requests desde frontend Next.js (puerto 3000).

**Configuración**:
```typescript
export default fp(async (fastify) => {
  await fastify.register(fastifyCors, {
    origin: process.env.NODE_ENV === 'production'
      ? ['https://cycling-companion-web.vercel.app']
      : ['http://localhost:3000'],
    credentials: true,
  });
});
```

**Wrapped con `fastify-plugin`** para aplicar a nivel global (parent scope).

---

### 2.4 Plugin: Autenticación JWT Supabase

**Archivo**: `apps/api/src/plugins/auth.ts`

**Flujo**:
1. Frontend envía `Authorization: Bearer <jwt_token>`
2. Plugin extrae token del header
3. Verifica token con Supabase (cliente con service_role_key)
4. Decora `request.user` con datos del usuario autenticado

**Implementación**:
```typescript
fastify.decorate('authenticate', async (request, reply) => {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError('Missing or invalid authorization header', 401, 'UNAUTHORIZED');
  }

  const token = authHeader.substring(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new AppError('Invalid or expired token', 401, 'UNAUTHORIZED');
  }

  request.user = user; // Decora request
});
```

**Decorador de tipos** (`types/fastify.d.ts`):
```typescript
declare module 'fastify' {
  interface FastifyRequest {
    user?: User;
  }
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
```

**Uso en rutas**:
```typescript
fastify.register(async (app) => {
  app.addHook('onRequest', app.authenticate); // Protege todas las rutas del scope
  // ... rutas protegidas
}, { prefix: '/api/v1' });
```

---

### 2.5 Plugin: Error Handler Centralizado

**Archivo**: `apps/api/src/plugins/error-handler.ts`

**Propósito**: Unificar respuestas de error en formato JSON estructurado.

**Tipos de error manejados**:
1. **ZodError** → 400 Bad Request
2. **AppError** (custom) → Status code configurado
3. **FastifyError** con `statusCode` → Status code del error
4. **Error genérico** → 500 Internal Server Error

**Clase `AppError`**:
```typescript
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
  ) {
    super(message);
    this.name = 'AppError';
  }
}
```

**Handler**:
```typescript
fastify.setErrorHandler((error, request, reply) => {
  // 1. Zod validation
  if (error instanceof ZodError) {
    return reply.status(400).send({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: error.issues, // Solo en dev
    });
  }

  // 2. AppError
  if (error instanceof AppError) {
    if (error.statusCode >= 500) request.log.error(error);
    return reply.status(error.statusCode).send({
      error: error.message,
      code: error.code,
    });
  }

  // 3. Fastify errors
  if ('statusCode' in error) {
    return reply.status(error.statusCode).send({
      error: error.message,
      code: getErrorCode(error.statusCode),
    });
  }

  // 4. Generic 500
  request.log.error(error);
  return reply.status(500).send({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : error.message,
    code: 'INTERNAL_ERROR',
  });
});
```

**Formato de respuesta de error**:
```json
{
  "error": "User not found",
  "code": "NOT_FOUND",
  "details": { ... }  // Opcional, solo en dev
}
```

---

### 2.6 Servicios: Clientes de Terceros

#### Supabase Client

**Archivo**: `apps/api/src/services/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env';

export const supabase = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_SERVICE_ROLE_KEY, // Bypass RLS
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
```

**Uso**: Operaciones server-side que necesitan bypassear RLS (con service_role_key).

#### Anthropic Client

**Archivo**: `apps/api/src/services/anthropic.ts`

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/env';

export const anthropic = new Anthropic({
  apiKey: config.ANTHROPIC_API_KEY,
});
```

**Uso**: Llamadas a Claude API para análisis IA y generación de planes.

---

### 2.7 Route: Health Check

**Archivo**: `apps/api/src/routes/health.ts`

**Endpoint**: `GET /health`

**Propósito**: Verificar que el servidor está vivo (para Render health checks).

```typescript
export default async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });
}
```

**Respuesta**:
```json
{
  "status": "ok",
  "timestamp": "2026-02-15T10:25:00.000Z"
}
```

**No requiere autenticación** (registrada fuera del scope protegido).

---

## 3. Dependencias Añadidas

```json
{
  "dependencies": {
    "@fastify/cors": "^10.0.1",
    "@anthropic-ai/sdk": "^0.35.0",
    "@fastify/multipart": "^9.1.0",
    "fastify-plugin": "^5.0.1"
  }
}
```

- **@fastify/cors**: CORS middleware oficial de Fastify
- **@anthropic-ai/sdk**: Cliente oficial de Anthropic para Claude API
- **@fastify/multipart**: Para upload de archivos .fit/.gpx (preparación para Bloque 3)
- **fastify-plugin**: Wrapper para plugins que deben aplicar a parent scope

---

## 4. Estructura de Archivos Resultante

```
apps/api/src/
├── index.ts                      # ✨ Entry point (start server)
├── app.ts                        # ✨ Factory (buildApp para tests)
├── config/
│   └── env.ts                    # ✨ Validación env vars con Zod
├── plugins/
│   ├── cors.ts                   # ✨ CORS para frontend
│   ├── auth.ts                   # ✨ JWT Supabase (decorator authenticate)
│   └── error-handler.ts          # ✨ Error handler centralizado
├── routes/
│   └── health.ts                 # ✨ GET /health (movida de index.ts)
├── services/
│   ├── supabase.ts               # ✨ Cliente Supabase (service_role)
│   └── anthropic.ts              # ✨ Cliente Anthropic (Claude API)
└── types/
    └── fastify.d.ts              # ✨ Decoradores TypeScript
```

✨ = Nuevo en Bloque 0

---

## 5. Testing

**Estrategia**:
- Tests unitarios para `config/env.ts` (validación)
- Tests de integración para plugins (auth, error-handler)
- Tests E2E para rutas protegidas vs públicas

**Ejemplo de test con factory**:
```typescript
import { buildApp } from '../src/app';

describe('Auth Plugin', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should reject requests without token', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/profile',
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      error: 'Missing or invalid authorization header',
      code: 'UNAUTHORIZED',
    });
  });
});
```

---

## 6. Decisiones Técnicas (ADRs)

### ADR-001: Factory Pattern para testabilidad

**Contexto**: `index.ts` monolítico dificulta tests unitarios.

**Decisión**: Separar `app.ts` (factory) de `index.ts` (entry point).

**Consecuencias**:
- ✅ Tests pueden importar `buildApp()` sin levantar servidor
- ✅ Reutilizable para diferentes entornos (test, dev, prod)
- ⚠️ Requiere disciplina: lógica en `app.ts`, no en `index.ts`

### ADR-002: Service Role Key para operaciones backend

**Contexto**: Backend necesita leer/escribir datos de cualquier usuario.

**Decisión**: Usar `SUPABASE_SERVICE_ROLE_KEY` que bypasea RLS.

**Consecuencias**:
- ✅ Flexibilidad total en queries server-side
- ⚠️ Seguridad: verificar auth en API layer (no confiar en RLS)
- ⚠️ Nunca exponer service_role_key al frontend

### ADR-003: Fastify-plugin para CORS y Error Handler

**Contexto**: Plugins deben aplicar globalmente, no solo al scope que los registra.

**Decisión**: Wrappear con `fastify-plugin`.

**Consecuencias**:
- ✅ CORS aplica a todas las rutas
- ✅ Error handler maneja errores de cualquier ruta
- ⚠️ No usar para plugins que deben ser scoped (como auth en /api/v1)

---

## 7. Criterios de Aceptación

- [x] `app.ts` exporta `buildApp()` que retorna `FastifyInstance`
- [x] `index.ts` levanta servidor en puerto 3001 usando `buildApp()`
- [x] Variables de entorno validadas con Zod en startup
- [x] CORS configurado para `http://localhost:3000` (dev) y Vercel (prod)
- [x] Plugin `authenticate` decora `request.user` con datos del usuario
- [x] Error handler retorna JSON estructurado para todos los tipos de error
- [x] Cliente Supabase con `service_role_key` disponible en `services/supabase.ts`
- [x] Cliente Anthropic disponible en `services/anthropic.ts`
- [x] `GET /health` retorna `{ status: 'ok' }` sin autenticación
- [x] Rutas bajo `/api/v1` protegidas con `authenticate` hook

---

## 8. Archivos Modificados/Creados

**Nuevos**:
- `apps/api/src/app.ts`
- `apps/api/src/config/env.ts`
- `apps/api/src/plugins/auth.ts`
- `apps/api/src/plugins/cors.ts`
- `apps/api/src/plugins/error-handler.ts`
- `apps/api/src/routes/health.ts`
- `apps/api/src/services/supabase.ts`
- `apps/api/src/services/anthropic.ts`
- `apps/api/src/types/fastify.d.ts`

**Modificados**:
- `apps/api/src/index.ts` (simplificado, ahora solo llama a `buildApp()`)
- `apps/api/package.json` (dependencias añadidas)
- `pnpm-lock.yaml`

---

## 9. Próximos Pasos (Bloque 1)

Con la infraestructura lista, Bloque 1 puede implementar:
- Endpoint `GET /api/v1/profile` (usar `supabase` client)
- Endpoint `PATCH /api/v1/profile` (validar con schemas de `shared`)
- Service `profile.service.ts` con lógica de negocio
- Tests de integración para endpoints de perfil
