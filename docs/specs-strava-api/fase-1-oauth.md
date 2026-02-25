# Spec Fase 1: OAuth Flow — Conectar y Desconectar Strava

**PRD**: `docs/PRD-STRAVA-API.md`
**Prioridad**: P0 (Crítico)
**Estimación**: ~20 tests nuevos
**Dependencias**: Fase 0 (infraestructura)

---

## Objetivo

Implementar el flujo completo de OAuth 2.0 con Strava: generar URL de autorización, manejar el callback, almacenar tokens, consultar estado de conexión, y desconectar.

---

## Orden de Implementación

```
1. Rutas Strava en backend (auth-url, callback, status, disconnect)
2. Registro de rutas en app.ts
3. Tests de rutas
```

---

## 1.1 — Rutas Strava: `apps/api/src/routes/strava.ts`

### Endpoint: GET `/api/v1/strava/auth-url`

**Auth**: Requiere JWT (usuario debe estar logueado)

**Flujo**:
1. Generar token CSRF: `HMAC-SHA256(userId + timestamp + nonce, STRAVA_CLIENT_SECRET)`
2. Codificar `state` como: `${userId}:${timestamp}:${nonce}:${hmac}`
3. Construir URL:
   ```
   https://www.strava.com/oauth/authorize
     ?client_id=${STRAVA_CLIENT_ID}
     &redirect_uri=${BACKEND_URL}/api/v1/strava/callback
     &response_type=code
     &scope=activity:read_all
     &approval_prompt=auto
     &state=${encodedState}
   ```
4. Retornar `{ data: { url: string } }`

**Response**:
```json
{
  "data": {
    "url": "https://www.strava.com/oauth/authorize?client_id=..."
  }
}
```

**Errores**:
- 500 si `STRAVA_CLIENT_ID` no está configurado

---

### Endpoint: GET `/api/v1/strava/callback`

**Auth**: NO requiere JWT — recibe tráfico redirigido desde Strava

**Query params**:
- `code` — authorization code de Strava
- `scope` — scopes concedidos
- `state` — token CSRF que generamos en auth-url

**Flujo**:
1. Verificar `state`:
   a. Decodificar `state` → extraer `userId`, `timestamp`, `nonce`, `hmac`
   b. Verificar que `timestamp` no tenga más de 10 minutos de antigüedad
   c. Recalcular HMAC y comparar con el recibido
   d. Si falla → redirect a frontend con `?error=invalid_state`
2. Verificar `scope` incluya `activity:read_all`
   - Si no → redirect a frontend con `?error=insufficient_scope`
3. Intercambiar `code` por tokens: `exchangeAuthCode(code)`
4. Verificar que `strava_athlete_id` no esté ya vinculado a otro usuario
   - Si lo está → redirect con `?error=already_connected`
5. Guardar conexión: `saveStravaConnection(userId, tokenResponse)`
6. Redirect a frontend: `${FRONTEND_URL}/profile?strava=connected`

**Redirect URLs de error**:
- `${FRONTEND_URL}/profile?strava=error&reason=invalid_state`
- `${FRONTEND_URL}/profile?strava=error&reason=insufficient_scope`
- `${FRONTEND_URL}/profile?strava=error&reason=already_connected`
- `${FRONTEND_URL}/profile?strava=error&reason=exchange_failed`

**Notas**:
- Este endpoint hace redirect (302), no retorna JSON
- El frontend lee los query params y muestra el toast correspondiente
- No necesita `@fastify/multipart` ni body parsing

---

### Endpoint: GET `/api/v1/strava/status`

**Auth**: Requiere JWT

**Flujo**:
1. Buscar conexión: `getStravaConnection(userId)`
2. Si no existe → `{ connected: false, athlete_name: null, ... }`
3. Si existe → contar actividades con `source = 'strava'` del usuario
4. Retornar `StravaConnectionStatus`

**Response (conectado)**:
```json
{
  "data": {
    "connected": true,
    "athlete_name": "Luis Martin",
    "strava_athlete_id": 12345,
    "connected_at": "2026-02-25T10:00:00.000Z",
    "last_sync_at": "2026-02-25T14:30:00.000Z",
    "activities_count": 24
  }
}
```

**Response (desconectado)**:
```json
{
  "data": {
    "connected": false,
    "athlete_name": null,
    "strava_athlete_id": null,
    "connected_at": null,
    "last_sync_at": null,
    "activities_count": 0
  }
}
```

---

### Endpoint: DELETE `/api/v1/strava/disconnect`

**Auth**: Requiere JWT

**Flujo**:
1. Buscar conexión: `getStravaConnection(userId)`
2. Si no existe → 404 `"No hay conexión con Strava"`
3. Revocar acceso en Strava: `deauthorizeAthlete(accessToken)` (try/catch — no bloquear si falla)
4. Eliminar conexión en BD: `deleteStravaConnection(userId)`
5. Retornar `{ data: { disconnected: true } }`

**Nota**: NO eliminamos las actividades importadas — permanecen en la BD con `source: 'strava'`.

---

## 1.2 — Registro de Rutas: `apps/api/src/app.ts`

Añadir el import y registro de las rutas de Strava:

```typescript
import stravaRoutes from "./routes/strava.js";
// ...
fastify.register(stravaRoutes, { prefix: "/api/v1" });
```

**Nota**: Las rutas de callback y webhook NO deben pasar por el plugin de auth. Usar `{ preHandler: [] }` o similar para excluirlas.

---

## 1.3 — Variable de entorno adicional: `BACKEND_URL`

Se necesita una nueva variable de entorno para construir el `redirect_uri` del callback OAuth:

| Variable | Valor en dev | Valor en producción |
|----------|-------------|---------------------|
| `BACKEND_URL` | `http://localhost:3001` | `https://cycling-companion.onrender.com` |

Alternativa: derivar de `FRONTEND_URL` si el patrón es predecible. Pero es más limpio tener una variable explícita.

---

## 1.4 — Validación de configuración Strava

En el arranque del servidor (o al registrar las rutas), verificar que las variables de entorno necesarias estén configuradas:

```typescript
const REQUIRED_STRAVA_ENV = [
  "STRAVA_CLIENT_ID",
  "STRAVA_CLIENT_SECRET",
  "STRAVA_WEBHOOK_VERIFY_TOKEN",
  "STRAVA_TOKEN_ENCRYPTION_KEY",
];
```

Si alguna falta, log warning pero NO crashear — las rutas de Strava retornarán 503 "Strava integration not configured".

---

## Tests

### Ruta: GET /strava/auth-url

| Test | Escenario | Expected |
|------|-----------|----------|
| Éxito | Usuario autenticado | 200 + URL válida con client_id, scope, state |
| Sin auth | No hay JWT | 401 |
| Sin STRAVA_CLIENT_ID | Env var faltante | 503 "Strava integration not configured" |

### Ruta: GET /strava/callback

| Test | Escenario | Expected |
|------|-----------|----------|
| Éxito completo | Code + state válidos | 302 redirect a /profile?strava=connected |
| State inválido | HMAC no coincide | 302 redirect a /profile?strava=error&reason=invalid_state |
| State expirado | Timestamp > 10 min | 302 redirect a /profile?strava=error&reason=invalid_state |
| Scope insuficiente | scope sin activity:read_all | 302 redirect a /profile?strava=error&reason=insufficient_scope |
| Athlete ya vinculado a otro user | strava_athlete_id duplicado | 302 redirect a /profile?strava=error&reason=already_connected |
| Exchange falla | Strava devuelve error | 302 redirect a /profile?strava=error&reason=exchange_failed |
| Sin code | Query param faltante | 302 redirect a /profile?strava=error&reason=invalid_state |

### Ruta: GET /strava/status

| Test | Escenario | Expected |
|------|-----------|----------|
| Conectado con actividades | Conexión + 5 actividades strava | 200 + connected: true, activities_count: 5 |
| Conectado sin actividades | Conexión, 0 actividades strava | 200 + connected: true, activities_count: 0 |
| Desconectado | Sin conexión | 200 + connected: false |
| Sin auth | No hay JWT | 401 |

### Ruta: DELETE /strava/disconnect

| Test | Escenario | Expected |
|------|-----------|----------|
| Éxito | Conexión existe | 200 + disconnected: true |
| Sin conexión | No hay conexión | 404 |
| Deauthorize falla en Strava | Network error | 200 (igualmente desconecta localmente) |
| Sin auth | No hay JWT | 401 |

---

## Archivos a Crear/Modificar

| # | Archivo | Acción |
|---|---------|--------|
| 1 | `apps/api/src/routes/strava.ts` | Crear |
| 2 | `apps/api/src/app.ts` | Modificar (registrar rutas strava) |
| 3 | `apps/api/src/routes/strava.test.ts` | Crear |
