# Strava API — Setup Guide

Guia para configurar la integracion con Strava en Cycling Companion.

---

## 1. Crear app en Strava

1. Ir a [Strava API Settings](https://www.strava.com/settings/api)
2. Crear una nueva aplicacion:
   - **Application Name**: Cycling Companion
   - **Category**: Training
   - **Website**: URL de tu frontend (e.g. `https://cycling-companion-web.vercel.app`)
   - **Authorization Callback Domain**: dominio de tu backend (e.g. `cycling-companion.onrender.com`)
3. Anotar `Client ID` y `Client Secret`

---

## 2. Variables de entorno

### Backend (Render)

```env
STRAVA_CLIENT_ID=12345
STRAVA_CLIENT_SECRET=abc123...
STRAVA_WEBHOOK_VERIFY_TOKEN=un-token-secreto-cualquiera
STRAVA_TOKEN_ENCRYPTION_KEY=<base64 de 32 bytes>
```

### Generar clave de cifrado

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 3. Registrar webhook

Una vez desplegado el backend, registrar el webhook con Strava:

```bash
curl -X POST https://www.strava.com/api/v3/push_subscriptions \
  -F client_id=TU_CLIENT_ID \
  -F client_secret=TU_CLIENT_SECRET \
  -F callback_url=https://tu-backend.onrender.com/api/v1/strava/webhook \
  -F verify_token=TU_STRAVA_WEBHOOK_VERIFY_TOKEN
```

Strava enviara un GET al callback para validar el `verify_token`. Si el backend responde correctamente, la suscripcion queda activa.

---

## 4. Verificar webhook

Listar suscripciones activas:

```bash
curl -G https://www.strava.com/api/v3/push_subscriptions \
  -d client_id=TU_CLIENT_ID \
  -d client_secret=TU_CLIENT_SECRET
```

---

## 5. Flujo OAuth

1. El usuario hace clic en "Conectar con Strava" en su perfil
2. Se redirige a Strava OAuth con scope `activity:read_all`
3. El usuario autoriza la app
4. Strava redirige al callback del backend con un code
5. El backend intercambia el code por access/refresh tokens
6. Los tokens se cifran con AES-256-GCM y se guardan en `strava_connections`

---

## 6. Proceso de aprobacion multi-user

Por defecto, las apps de Strava solo permiten hasta 100 atletas. Para mas usuarios:

1. Ir a [Strava API Agreement](https://www.strava.com/settings/api)
2. Solicitar aprobacion proporcionando:
   - Descripcion de la app
   - URL de la politica de privacidad
   - Captura de pantalla de la integracion
3. El proceso tarda ~1 semana

---

## 7. Troubleshooting

| Problema | Solucion |
|----------|----------|
| `STRAVA_NOT_CONFIGURED` (503) | Verificar que `STRAVA_CLIENT_ID` y `STRAVA_CLIENT_SECRET` estan configuradas |
| `invalid_state` en callback | El state CSRF expiro (10 min) o fue manipulado. Reintentar el flujo |
| `insufficient_scope` | El usuario no acepto `activity:read_all`. Reintentar |
| `already_connected` | La cuenta de Strava ya esta vinculada a otro usuario de la app |
| 429 Rate Limit | Strava limita a 100 req/15min y 1000 req/dia. El backfill se detiene automaticamente |
| Tokens expirados | Se refrescan automaticamente si faltan < 5 min para expirar |
