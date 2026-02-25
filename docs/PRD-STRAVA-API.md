# PRD: Integración Strava API — Sincronización Automática de Actividades

## 1. Información General

| Campo | Valor |
|-------|-------|
| **Producto** | Cycling Companion |
| **Feature** | Integración Strava API |
| **Versión** | 1.0 |
| **Autor** | Claude Code |
| **Fecha** | 2026-02-25 |
| **PRD Base** | `docs/02-PRD.md` |
| **Branch** | `feat/strava-api` (derivada de `main`) |

---

## 2. Contexto y Motivación

Cycling Companion permite importar actividades manualmente via archivos .fit/.gpx. Esto funciona, pero introduce fricción:

- El usuario debe exportar el archivo desde Garmin Connect / Strava / Wahoo
- Navegar a la app, subir el archivo, esperar parseo
- Repetir para cada actividad

La mayoría de ciclistas amateur (target 40+) usan Strava como hub central — incluso si tienen un Garmin, sincronizan automáticamente a Strava. Conectar con la API de Strava permite:

1. **Sincronización automática**: actividad nueva en Strava → aparece en Cycling Companion
2. **Importación histórica**: traer actividades existentes con un click
3. **Reducción de fricción**: el usuario no necesita exportar/importar archivos manualmente

### Por qué Strava y no Garmin

| Criterio | Strava | Garmin |
|----------|--------|--------|
| Acceso para desarrolladores | Abierto (cualquiera) | Solo empresas |
| Proceso de alta | Instantáneo (single-player) | Formulario + revisión |
| Cobertura de dispositivos | Garmin, Wahoo, Hammerhead, Zwift... | Solo Garmin |
| Comunidad ciclista | Estándar de facto | Fragmentada |
| API documentation | Excelente + Swagger | Limitada |
| Webhooks | Sí | Sí (pero requiere aprobación) |

---

## 3. Objetivos

1. **Conectar cuenta Strava** desde la pestaña "Ajustes" del perfil (OAuth 2.0)
2. **Sincronización automática** via webhook: nueva actividad en Strava → import en Cycling Companion
3. **Importación bajo demanda (backfill)**: traer las últimas N actividades históricas
4. **Desconectar cuenta** en cualquier momento (revocar tokens, limpiar datos de conexión)
5. **Mantener import manual** (.fit/.gpx) como alternativa universal

### No-goals

- No se implementa integración directa con Garmin Connect API
- No se implementa integración con Wahoo (se elimina placeholder)
- No se sincronizan datos de vuelta (Cycling Companion → Strava)
- No se muestran segmentos de Strava, kudos ni features sociales
- No se almacenan datos más allá de lo necesario para la funcionalidad de la app
- No se usan datos de Strava para entrenar modelos de IA (prohibido por ToS)

---

## 4. Arquitectura de la Integración

### 4.1 Flujo OAuth 2.0

```
┌──────────────┐      1. Click "Conectar Strava"     ┌──────────────┐
│   Frontend    │ ─────────────────────────────────── → │   Backend    │
│   (Next.js)   │                                       │  (Fastify)   │
└──────────────┘                                       └──────┬───────┘
                                                              │
                    2. Redirect a Strava OAuth                │
                    (scope: activity:read_all)                 │
                                                              ▼
                                                     ┌──────────────┐
                                                     │    Strava     │
                                                     │  OAuth Server │
                                                     └──────┬───────┘
                                                              │
                    3. Usuario autoriza                        │
                                                              │
                    4. Callback con auth code                  │
                    ┌──────────────────────────────────────────┘
                    ▼
             ┌──────────────┐
             │   Backend    │  5. Intercambia code → tokens
             │  (Fastify)   │  6. Guarda tokens en BD (strava_connections)
             │              │  7. Redirect a /profile con éxito
             └──────────────┘
```

### 4.2 Flujo Webhook (Sincronización Automática)

```
┌─────────────┐   1. Actividad nueva    ┌──────────────┐
│   Strava     │ ──────────────────── → │   Backend    │
│   Webhook    │   POST /strava/webhook │  (Fastify)   │
└─────────────┘                         └──────┬───────┘
                                               │
                  2. Responder 200 OK          │
                  inmediatamente               │
                                               │
                  3. Background job:           ▼
                  ┌────────────────────────────────────────────┐
                  │ a) Buscar tokens del owner_id               │
                  │ b) Refrescar access_token si expirado       │
                  │ c) GET /activities/{id} → detalle           │
                  │ d) GET /activities/{id}/streams → series    │
                  │ e) Mapear a schema propio (ParsedActivity)  │
                  │ f) computeActivitySummary() → métricas v2   │
                  │ g) INSERT en activities + activity_metrics   │
                  │ h) analyzeActivity() → análisis IA (async)  │
                  └────────────────────────────────────────────┘
```

### 4.3 Flujo Backfill (Importación Histórica)

```
┌──────────────┐  1. Click "Importar historial"   ┌──────────────┐
│   Frontend    │ ──────────────────────────────── → │   Backend    │
│              │                                    │  (Fastify)   │
└──────────────┘                                    └──────┬───────┘
                                                           │
                  2. GET /athlete/activities?after=...      │
                  (paginado, últimas 30 por defecto)       │
                                                           │
                  3. Para cada actividad:                   │
                  ┌────────────────────────────────────────┘
                  │ a) Verificar si ya existe (strava_id)
                  │ b) Si no existe: GET detalle + streams
                  │ c) Mapear + computar métricas + INSERT
                  │ d) Sin análisis IA (backfill masivo)
                  └────────────────────────────────────────┘
                                                           │
                  4. Responder con { imported: N, skipped: M }
```

---

## 5. Modelo de Datos

### 5.1 Nueva tabla: `strava_connections`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID PK | ID interno |
| `user_id` | UUID FK → users | Referencia al usuario |
| `strava_athlete_id` | BIGINT UNIQUE | ID del atleta en Strava |
| `access_token` | TEXT | Token de acceso (cifrado) |
| `refresh_token` | TEXT | Token de refresco (cifrado) |
| `token_expires_at` | TIMESTAMPTZ | Expiración del access token |
| `scope` | TEXT | Scopes concedidos |
| `connected_at` | TIMESTAMPTZ | Fecha de conexión |
| `last_sync_at` | TIMESTAMPTZ NULL | Última sincronización exitosa |
| `created_at` | TIMESTAMPTZ | Timestamp creación |
| `updated_at` | TIMESTAMPTZ | Timestamp actualización |

**Constraints**: UNIQUE(user_id), UNIQUE(strava_athlete_id), RLS para user_id

### 5.2 Modificación tabla: `activities`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `strava_id` | BIGINT NULL UNIQUE | ID de la actividad en Strava (evita duplicados) |
| `source` | TEXT DEFAULT 'manual' | Origen: `'manual'`, `'upload'`, `'strava'` |

### 5.3 Datos de Strava mapeados a nuestro schema

| Campo Strava | Campo Propio | Transformación |
|---|---|---|
| `id` | `strava_id` | Directo |
| `name` | `name` | Directo |
| `start_date_local` | `date` | Extraer YYYY-MM-DD |
| `sport_type` | `type` | Mapeo: Ride→endurance, VirtualRide→endurance, etc. |
| `moving_time` | `duration_seconds` | Directo (segundos) |
| `distance` | `distance_km` | Convertir metros → km |
| `average_watts` | `avg_power_watts` | Redondear |
| `average_heartrate` | `avg_hr_bpm` | Redondear |
| `max_heartrate` | `max_hr_bpm` | Redondear |
| `average_cadence` | `avg_cadence_rpm` | Redondear |
| `weighted_average_watts` | `normalized_power` | Directo (Strava ya calcula NP) |
| `kilojoules` | — | No se usa (calculamos TSS propio) |
| `suffer_score` | — | No se usa |
| Streams `heartrate` | `activity_metrics.hr_bpm` | Serie temporal |
| Streams `watts` | `activity_metrics.power_watts` | Serie temporal |
| Streams `cadence` | `activity_metrics.cadence_rpm` | Serie temporal |
| Streams `velocity_smooth` | `activity_metrics.speed_kmh` | m/s → km/h |
| Streams `latlng` | `activity_metrics.lat/lon` | Array [lat, lng] |
| Streams `altitude` | `activity_metrics.elevation` | Directo |

---

## 6. Endpoints API

### 6.1 Nuevos endpoints (bajo `/api/v1/strava/`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/strava/auth-url` | Sí | Genera URL de autorización OAuth |
| GET | `/strava/callback` | No* | Callback OAuth (intercambia code → tokens) |
| GET | `/strava/status` | Sí | Estado de conexión del usuario |
| DELETE | `/strava/disconnect` | Sí | Desconectar cuenta Strava |
| POST | `/strava/sync` | Sí | Trigger manual de importación histórica |
| GET | `/strava/webhook` | No | Validación de suscripción webhook |
| POST | `/strava/webhook` | No | Recepción de eventos webhook |

*El callback no usa auth JWT — recibe un `state` parameter con token CSRF verificable.

### 6.2 Rate limits Strava

| Límite | Valor | Estrategia |
|--------|-------|------------|
| 15 minutos | 200 requests | Leer headers `X-RateLimit-Usage`, backoff exponencial |
| Diario | 2,000 requests | Cola de procesamiento, priorizar webhooks sobre backfill |

---

## 7. Interfaz de Usuario

### 7.1 Pestaña "Ajustes" del Perfil (modificada)

La sección "Dispositivos" se reemplaza por una sección dedicada a Strava:

**Estado: Desconectado**
```
┌──────────────────────────────────────────────┐
│ 🔗 Sincronización                             │
│ Conecta tu cuenta de Strava para sincronizar  │
│ actividades automáticamente                   │
│                                               │
│ ┌────────────────────────────────────────┐    │
│ │  [Logo Strava]  Conectar con Strava    │    │
│ │           [Botón naranja oficial]      │    │
│ └────────────────────────────────────────┘    │
│                                               │
│ ℹ️ También puedes importar archivos .fit/.gpx │
│    desde Actividades → Importar               │
└──────────────────────────────────────────────┘
```

**Estado: Conectado**
```
┌──────────────────────────────────────────────┐
│ 🔗 Sincronización                             │
│ Tu cuenta de Strava está conectada            │
│                                               │
│ ┌────────────────────────────────────────┐    │
│ │  ✓ Conectado como "Luis Martin"        │    │
│ │  Última sync: hace 2 horas             │    │
│ │  Actividades importadas: 24            │    │
│ │                                        │    │
│ │  [Importar historial]  [Desconectar]   │    │
│ └────────────────────────────────────────┘    │
│                                               │
│ Las nuevas actividades se importan            │
│ automáticamente cuando las subas a Strava     │
└──────────────────────────────────────────────┘
```

### 7.2 Indicador de origen en actividades

En la lista de actividades y en el detalle, mostrar un badge discreto con el origen:
- Sin badge → creada manualmente o importada via .fit/.gpx
- Badge "Strava" → importada desde Strava (con icono Strava)

---

## 8. Seguridad

### 8.1 Almacenamiento de tokens

- Los tokens OAuth (`access_token`, `refresh_token`) se almacenan cifrados en la BD
- Cifrado AES-256-GCM con clave en variable de entorno (`STRAVA_TOKEN_ENCRYPTION_KEY`)
- La clave NUNCA se commitea — solo en env vars de Render/Vercel

### 8.2 CSRF en OAuth flow

- El parámetro `state` del OAuth flow contiene un token CSRF firmado (HMAC-SHA256)
- Incluye `user_id` + timestamp + nonce
- Se verifica en el callback antes de procesar el auth code

### 8.3 Webhook verification

- El endpoint de webhook verifica el `verify_token` de Strava
- Solo procesa eventos de `strava_athlete_id` registrados en nuestra BD

### 8.4 RLS (Row Level Security)

- `strava_connections`: usuario solo puede ver/modificar su propia conexión
- Las actividades importadas heredan el RLS existente de `activities`

---

## 9. Variables de Entorno Nuevas

### Backend (Render)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `STRAVA_CLIENT_ID` | Client ID de la app Strava | `12345` |
| `STRAVA_CLIENT_SECRET` | Client Secret de la app Strava | `abc...xyz` |
| `STRAVA_WEBHOOK_VERIFY_TOKEN` | Token para verificar webhooks | `my-secret-verify-token` |
| `STRAVA_TOKEN_ENCRYPTION_KEY` | Clave AES-256 para cifrar tokens | `base64-encoded-32-bytes` |

### Frontend (Vercel)

No requiere variables adicionales — todo el flujo OAuth pasa por el backend.

---

## 10. Fases de Implementación

| Fase | Descripción | Dependencias | Estimación |
|------|-------------|--------------|------------|
| **Fase 0** | Migración BD + Schema Zod + Servicio Strava base | Ninguna | Spec: `fase-0-infraestructura.md` |
| **Fase 1** | OAuth flow completo (connect/disconnect) | Fase 0 | Spec: `fase-1-oauth.md` |
| **Fase 2** | Webhook + Sincronización automática | Fase 1 | Spec: `fase-2-webhook-sync.md` |
| **Fase 3** | Backfill + UI perfil | Fases 1-2 | Spec: `fase-3-backfill-ui.md` |

---

## 11. Riesgos y Mitigaciones

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| Strava prohíbe usar datos con IA/ML | Alta | Nuestro uso es coaching individual (permitido). Confirmar con `developers@strava.com` |
| Cache de 7 días en ToS | Media | Los datos se almacenan como funcionalidad del usuario, no como cache. Incluir nota en ToS propios |
| Aprobación multi-user incierta | Media | Desarrollar todo en single-player mode. Solicitar revisión cuando esté listo |
| Rate limit de 2,000 req/día | Baja | Cola de procesamiento, priorizar webhooks, backfill throttled |
| Strava cambia API/ToS | Baja | Mantener import manual como fallback. Arquitectura desacoplada |
| Token expirado durante sync | Baja | Auto-refresh antes de cada llamada. Retry con refresh si 401 |
| Free tier de Render (cold start) | Media | Webhook puede fallar si server dormido. Strava reintenta 3 veces. Evaluar upgrade |

---

## 12. Brand Guidelines (Obligatorio)

Strava requiere cumplir sus [Brand Guidelines](https://developers.strava.com/guidelines/):

- Usar el botón oficial "Connect with Strava" (naranja/blanco)
- Mostrar "Powered by Strava" donde se muestren datos de Strava
- No modificar el logo de Strava
- No usar "Strava" en el nombre de la app
- Incluir link a la actividad original en Strava donde sea posible

---

## 13. Criterios de Aceptación Globales

- [ ] Usuario puede conectar su cuenta de Strava desde el perfil
- [ ] Las nuevas actividades en Strava se importan automáticamente via webhook
- [ ] El usuario puede importar su historial reciente (últimas 30 actividades)
- [ ] El usuario puede desconectar Strava en cualquier momento
- [ ] Los tokens se almacenan cifrados en la BD
- [ ] Las actividades importadas incluyen métricas avanzadas v2
- [ ] Las actividades duplicadas se detectan y no se reimportan
- [ ] El import manual (.fit/.gpx) sigue funcionando como fallback
- [ ] Solo se sincronizan actividades de ciclismo (Ride, VirtualRide, GravelRide, MountainBikeRide)
- [ ] Brand Guidelines de Strava respetadas en toda la UI
- [ ] Rate limits manejados con backoff exponencial
- [ ] Tests unitarios para todos los servicios nuevos
- [ ] RLS activo en tabla `strava_connections`
