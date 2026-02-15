# L2 — Bloque 8: Frontend Migration (Supabase directo → API Backend)

## Contexto

El frontend (Next.js) accede actualmente a Supabase de forma directa desde Server Components y Client Components.
El backend Fastify ya tiene todos los endpoints implementados (Bloques 0-7). Este bloque migra el frontend
para consumir datos vía la API, manteniendo la autenticación vía Supabase Auth (JWT) y el patrón SSR de Next.js.

## Estado Actual

| Página | Lectura | Escritura | Fuente actual |
|--------|---------|-----------|---------------|
| Dashboard `/` | users, activities (4 semanas) | — | Supabase directo (Server) |
| Activities `/activities` | activities (lista) | — | Supabase directo (Server) |
| Activity Detail `/activities/[id]` | activities, activity_metrics | — | Supabase directo (Server) |
| Import `/activities/import` | — | activities (INSERT) | Supabase directo (Client) |
| Plan `/plan` | weekly_plans | — | Supabase directo (Server) + mock fallback |
| Insights `/insights` | activities (2 periodos) | — | Supabase directo (Server) |
| Profile `/profile` | users | users (UPDATE) | Supabase directo (Server + Client) |
| Onboarding `/onboarding` | users (check) | users (INSERT) | Supabase directo (Server + Client) |
| Login `/auth/login` | auth.getUser() | — | Supabase Auth (mantener) |

## Decisiones Arquitectónicas

| Decisión | Elección | Rationale |
|----------|----------|-----------|
| Auth | Mantener Supabase Auth SSR en frontend | El JWT de Supabase se reutiliza como Bearer token al API |
| Server fetch | `fetch()` en Server Components con `Authorization: Bearer {token}` | Misma seguridad, datos vienen del API |
| Client fetch | `fetch()` en Client Components con token de sesión | Reemplaza `createBrowserClient` para escrituras |
| API URL | `NEXT_PUBLIC_API_URL` (ya configurado, sin usar) | Ya existe en `.env.example` |
| Cálculos locales | Mantener en frontend donde el API no provee equivalente | Dashboard KPIs, trends — calcular sobre datos de API |
| Plan mock fallback | Eliminar — usar API endpoint `/api/v1/plan` | La API ya genera plan con IA |
| IA coach tip | Nuevo — consumir `GET /api/v1/ai/coach-tip` | Reemplaza recomendación hardcoded en Dashboard |
| Onboarding | Mantener Supabase directo | No hay endpoint de creación de usuario en API (se crea vía Supabase Auth + trigger) |

## Helper: API Client

Crear `apps/web/src/lib/api/client.ts` — utilidad para llamadas al API backend.

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Para Server Components (recibe token explícitamente)
export async function apiGet<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}

// Para Client Components (obtiene token de sesión)
export async function apiClientFetch<T>(
  path: string, method: string, body?: unknown
): Promise<T> { ... }
```

## Migración por Página

### 1. Dashboard (`/`)
**Antes**: `supabase.from("users")` + `supabase.from("activities")`
**Después**: `apiGet("/profile", token)` + `apiGet("/activities?date_from=...&limit=100", token)` + `apiGet("/ai/coach-tip", token)` (nuevo: coach IA real)
**Archivos**: `apps/web/src/app/(app)/page.tsx`
**Nota**: Los cálculos de KPIs/trends se mantienen en `lib/dashboard/calculations.ts` operando sobre datos del API

### 2. Lista de Actividades (`/activities`)
**Antes**: `supabase.from("activities").select(...).order("date")`
**Después**: `apiGet("/activities?page=1&limit=50", token)`
**Archivos**: `apps/web/src/app/(app)/activities/page.tsx`
**Nota**: El API ya soporta paginación, filtros (type, date_from, date_to, search)

### 3. Detalle de Actividad (`/activities/[id]`)
**Antes**: `supabase.from("activities")` + `supabase.from("activity_metrics")`
**Después**: `apiGet("/activities/{id}", token)` + `apiGet("/activities/{id}/metrics", token)`
**Archivos**: `apps/web/src/app/(app)/activities/[id]/page.tsx`

### 4. Importar Actividad (`/activities/import`)
**Antes**: Client Component → `supabase.from("activities").insert(payload)` (solo modo manual)
**Después (manual)**: `apiClientPost("/activities", payload)`
**Después (archivo)**: `apiClientUpload("/activities/upload", formData)` — multipart
**Archivos**: `apps/web/src/app/(app)/activities/import/import-activity-content.tsx`
**Nota**: Habilitar modo archivo real (actualmente placeholder)

### 5. Plan Semanal (`/plan`)
**Antes**: `supabase.from("weekly_plans")` + MOCK_PLAN fallback
**Después**: `apiGet("/plan?week_start=...", token)` — si 404, mostrar botón "Generar plan"
**Generar**: `apiClientPost("/ai/weekly-plan", { week_start })` — crea plan con IA
**Archivos**: `apps/web/src/app/(app)/plan/page.tsx`, `plan-content.tsx`
**Nota**: Eliminar MOCK_PLAN. El API `/ai/weekly-plan` genera y persiste.

### 6. Insights (`/insights`)
**Antes**: `supabase.from("activities")` con 2 queries por periodo
**Después**: `apiGet("/insights?period_a_start=...&period_a_end=...&period_b_start=...&period_b_end=...", token)`
**Archivos**: `apps/web/src/app/(app)/insights/page.tsx`
**Nota**: El API ya calcula comparativas, CTL/ATL/TSB, alertas

### 7. Perfil (`/profile`)
**Lectura**: `apiGet("/profile", token)` (Server Component)
**Escritura**: `apiClientPatch("/profile", data)` (Client Component)
**Archivos**: `apps/web/src/app/(app)/profile/page.tsx`, `profile-content.tsx`

### 8. Onboarding (`/onboarding`)
**Mantener** Supabase directo para INSERT de usuario — coherente con Supabase Auth flow.
No hay endpoint API para crear usuario (se crea automáticamente vía Auth trigger + onboarding form).

### 9. Login (`/auth/login`)
**Mantener** Supabase Auth directo — no cambia.

## Archivos

| # | Archivo | Acción |
|---|---------|--------|
| 1 | `apps/web/src/lib/api/client.ts` | **Crear** — API client helper (server + client) |
| 2 | `apps/web/src/app/(app)/page.tsx` | **Modificar** — Dashboard: API fetch + coach tip real |
| 3 | `apps/web/src/app/(app)/activities/page.tsx` | **Modificar** — Lista: API fetch |
| 4 | `apps/web/src/app/(app)/activities/[id]/page.tsx` | **Modificar** — Detalle: API fetch |
| 5 | `apps/web/src/app/(app)/activities/import/import-activity-content.tsx` | **Modificar** — Import: API POST + upload |
| 6 | `apps/web/src/app/(app)/plan/page.tsx` | **Modificar** — Plan: API fetch |
| 7 | `apps/web/src/app/(app)/plan/plan-content.tsx` | **Modificar** — Eliminar MOCK_PLAN, generar via API |
| 8 | `apps/web/src/app/(app)/insights/page.tsx` | **Modificar** — Insights: API fetch |
| 9 | `apps/web/src/app/(app)/profile/page.tsx` | **Modificar** — Profile read: API fetch |
| 10 | `apps/web/src/app/(app)/profile/profile-content.tsx` | **Modificar** — Profile write: API PATCH |

## Tests

- API client: fetch mock → respuesta correcta, error handling
- Integración: verificar que las páginas renderizan con datos de API (E2E futuro)

## Notas

- La autenticación Supabase SSR se mantiene intacta para `auth.getUser()` y protección de rutas en `layout.tsx`
- El token JWT de Supabase se pasa como `Authorization: Bearer` header al API backend
- `NEXT_PUBLIC_API_URL` ya está configurado en `.env.example` pero no se usa — este bloque lo activa
- Los cálculos locales del dashboard (`lib/dashboard/calculations.ts`) se mantienen — no hay endpoint equivalente en API
