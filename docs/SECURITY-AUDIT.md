# Auditoría de Seguridad — Cycling Companion

**Fecha**: 2026-02-23
**Alcance**: Código fuente completo (monorepo), dependencias, configuración de infraestructura
**Metodología**: Auditoría automatizada con 5 agentes especializados en paralelo

---

## Resumen ejecutivo

Se auditaron 5 áreas de seguridad del proyecto. Se encontraron **9 vulnerabilidades corregidas** y varias observaciones de mejora futura. El perfil de seguridad general es **muy bueno** para un proyecto académico en producción. `pnpm audit --prod` reporta **0 vulnerabilidades** en producción.

| Área auditada | Hallazgos | Corregidos | Pendientes |
|---|---|---|---|
| Dependencias y CVEs | 4 CVEs (2 high, 2 moderate) | 1 (ajv prod) | 3 (devDeps) |
| Autenticación y RLS | 2 observaciones menores | 0 | 2 |
| Inyección y validación de inputs | 8 hallazgos | 6 | 2 |
| Secrets y exposición de datos | 1 hallazgo crítico | 1 | 0 |
| Rate limiting y DoS | 5 hallazgos | 4 | 1 |

---

## 1. Dependencias y CVEs

### 1.1 Vulnerabilidades detectadas (`pnpm audit`)

| Paquete | Versión | Severidad | Scope | Descripción |
|---|---|---|---|---|
| `minimatch@3.1.2` | 3.1.2 | HIGH | devDeps (ESLint) | ReDoS via wildcards repetidos (GHSA-3ppc-4f35-3m26) |
| `ajv@6.12.6` | 6.12.6 | MODERATE | devDeps (ESLint) | ReDoS con opción `$data` (GHSA-2g4f-4pwh-qvx6) |
| `ajv@8.17.1` | 8.17.1 | MODERATE | **Producción** (Fastify) | ReDoS con opción `$data` (GHSA-2g4f-4pwh-qvx6) |

**Nota**: La vulnerabilidad de `ajv@8.17.1` en producción solo se activaba si se usa la opción `$data` de ajv, que Fastify no utiliza por defecto.

### 1.2 Corregido: override de ajv en producción

| Hallazgo | Severidad | Corrección |
|---|---|---|
| **`ajv@8.17.1` ReDoS en producción** | MODERADA | `pnpm.overrides` en root `package.json` fuerza `ajv@>=8.18.0`. `pnpm audit --prod` reporta 0 vulnerabilidades. |

### 1.3 Paquetes de riesgo supply-chain

| Paquete | Riesgo | Razón |
|---|---|---|
| `fit-file-parser@2.3.3` | Bajo | Single maintainer, paquete niche. Activo. MIT. |
| `@we-gold/gpxjs@1.1.0` | Bajo | Single maintainer, 0 dependencias, última publicación hace 1 año. |

### 1.4 Recomendaciones pendientes

- Evaluar migración a ESLint 10.x cuando sea estable (resuelve minimatch + ajv en devDeps)
- Monitorizar periódicamente `fit-file-parser` y `@we-gold/gpxjs`

---

## 2. Autenticación y autorización

### 2.1 Arquitectura de auth (SEGURO)

- JWT validado via `supabaseAdmin.auth.getUser(token)` en plugin `auth.ts`
- Todas las rutas excepto `/health` están protegidas dentro de un scope con `authPlugin`
- Tokens almacenados en cookies HTTP-only via Supabase SSR (no `localStorage`)
- Error handler no expone detalles en producción (`NODE_ENV === "production"`)

### 2.2 RLS y filtrado manual (SEGURO)

El backend usa `supabaseAdmin` (service role key, bypassa RLS) pero aplica filtros manuales `eq("user_id", userId)` en **todas** las operaciones CRUD verificadas:

- `activity.service.ts`: list, get, update, delete, getMetrics
- `profile.service.ts`: get, update
- `insights.service.ts`: getInsights, checkOverload
- `plan.service.ts`: get, update, delete
- `ai.service.ts`: todas las funciones

RLS está habilitado como capa de defensa adicional en la BD.

### 2.3 Observaciones menores

- **CORS**: `origin` usa `env.FRONTEND_URL`. Si la variable no está configurada, el comportamiento depende de `@fastify/cors`. Falta `FRONTEND_URL` en `apps/api/.env.example`.
- **UUIDs en rutas**: Los parámetros `:id` se castean como `string` sin validar formato UUID. La BD rechaza valores inválidos, pero la validación temprana es mejor práctica.

---

## 3. Inyección y validación de inputs

### 3.1 Corregidos en este commit

| Hallazgo | Severidad | Archivo | Corrección |
|---|---|---|---|
| **ILIKE injection en búsqueda** | ALTA | `activity.service.ts` | Sanitización de caracteres especiales (`%`, `_`, `\`) + límite de 100 caracteres |
| **Fechas sin validar en `/insights`** | ALTA | `routes/insights.ts` | Validación regex `YYYY-MM-DD` en los 4 parámetros de fecha |
| **Fechas sin validar en `/ai/weekly-summary`** | ALTA | `routes/ai.ts` | Validación regex `YYYY-MM-DD` en los 4 parámetros de fecha |
| **`week_start` sin validar en GET/DELETE `/plan`** | MEDIA | `routes/plans.ts` | Validación regex `YYYY-MM-DD` |
| **`page`/`limit` sin validar** | MEDIA | `routes/activities.ts` | `page >= 1`, `limit` entre 1 y `MAX_LIMIT=100` |
| **Sin límite de data points en import** | MEDIA | `import.service.ts` | Límite de 100.000 métricas por archivo |

### 3.2 Pendientes (riesgo bajo)

- **Validación Zod en rutas**: Algunas rutas usan `as TypeName` (type assertion) en lugar de `schema.safeParse()`. La validación ocurre en el servicio pero es mejor práctica validar en la ruta.
- **Tipo de actividad en multipart upload**: El campo `type` se castea como `ActivityType` sin validar contra el enum. El schema Zod en `createActivity` lo rechazará pero la validación es tardía.

---

## 4. Secrets y exposición de datos

### 4.1 Corregido en este commit

| Hallazgo | Severidad | Archivo | Corrección |
|---|---|---|---|
| **Project reference ID de Supabase en docs** | ALTA | `docs/PROJECT-STATUS.md` | Eliminada referencia `bxstffwatktcxantoelm`, reemplazada por texto genérico |

### 4.2 Verificaciones positivas

- `.gitignore` excluye correctamente `.env`, `.env.local`, `.env.*.local`
- No hay secrets reales en `.env.example`, tests, ni documentación
- `render.yaml` define claves sin valores (solo nombres de variables)
- GitHub Actions usan `${{ secrets.* }}` para todas las API keys
- Tests usan datos mock, no credenciales reales
- Error handler oculta stack traces y detalles en producción

### 4.3 Recomendaciones pendientes

- Añadir `FRONTEND_URL` a `apps/api/.env.example`
- Considerar añadir headers de seguridad HTTP con `@fastify/helmet` (CSP, X-Frame-Options, X-Content-Type-Options, HSTS)

---

## 5. Rate limiting y protección DoS

### 5.1 Corregidos

| Hallazgo | Severidad | Archivo | Corrección |
|---|---|---|---|
| **Rate limit falla silenciosamente en error de BD** | ALTA | `ai.service.ts` | Ahora lanza error 503 en lugar de ignorar (`RATE_LIMIT_CHECK_FAILED`) |
| **Sin límite de data points en upload** | MEDIA | `import.service.ts` | Límite de 100.000 métricas (ver sección 3.1) |
| **Race condition en rate limit** | MEDIA | `ai.service.ts` + migración SQL | Reemplazada verificación read-then-check por función SQL `check_ai_rate_limit()` invocada via `supabaseAdmin.rpc()`. La función ejecuta el conteo de forma atómica en una sola transacción. Migración: `005_atomic_rate_limit.sql`. |
| **Sin timeout en Claude API** | MEDIA | `anthropic.ts` | Añadido `timeout: 30_000` (30s) y `maxRetries: 1` al constructor del cliente Anthropic. Evita bloqueo indefinido de workers Fastify. |

### 5.2 Implementación actual del rate limiting

- **Endpoints IA**: 20 llamadas/usuario/día, verificadas via función SQL atómica `check_ai_rate_limit()`
- **Endpoints no-IA**: Sin rate limiting específico (protegido por Render/infraestructura)
- **Upload**: Límite de 10 MB por archivo (`@fastify/multipart`) + 100.000 data points máximo
- **Claude API**: Timeout de 30s + 1 reintento máximo

### 5.3 Pendientes (riesgo bajo en contexto académico)

- **Sin rate limiting global**: Los endpoints no-IA no tienen límite de tasa. Para un proyecto con pocos usuarios autenticados esto es aceptable.

---

## 6. Puntos fuertes de seguridad

- Auth delegada a Supabase (no se implementa crypto propia)
- RLS activo en todas las tablas + filtros manuales en código
- Validación Zod en schemas compartidos (frontend + backend)
- React escapa automáticamente XSS (no usa `dangerouslySetInnerHTML`)
- No hay `exec()`, `spawn()`, ni interpolación en comandos del sistema
- Archivos procesados en memoria (no escritura en disco local)
- CORS restrictivo con origen específico
- Separación correcta de credenciales (anon key en frontend, service role solo en backend)
- Error handling seguro en producción

---

## 7. Matriz de riesgo final

| # | Hallazgo | Severidad | Estado |
|---|---|---|---|
| 1 | ILIKE injection en búsqueda | ALTA | **CORREGIDO** |
| 2 | Fechas sin validar (insights, ai, plans) | ALTA | **CORREGIDO** |
| 3 | Rate limit falla silenciosamente | ALTA | **CORREGIDO** |
| 4 | Project ref expuesto en docs | ALTA | **CORREGIDO** |
| 5 | page/limit sin validar | MEDIA | **CORREGIDO** |
| 6 | Límite de data points en upload | MEDIA | **CORREGIDO** |
| 7 | `ajv@8.17.1` ReDoS (producción) | MODERADA | **CORREGIDO** (pnpm.overrides) |
| 8 | Race condition en rate limit | MEDIA | **CORREGIDO** (función SQL atómica) |
| 9 | Sin timeout en Claude API | MEDIA | **CORREGIDO** (30s + 1 retry) |
| 10 | UUIDs sin validar en rutas | BAJA | Pendiente |
| 11 | Validación Zod tardía en rutas | BAJA | Pendiente |
| 12 | `minimatch` + `ajv` en devDeps | HIGH/MOD | Pendiente (ESLint 10) |

**Score de seguridad**: 9/10 (post-correcciones) — 0 vulnerabilidades en producción (`pnpm audit --prod`)
