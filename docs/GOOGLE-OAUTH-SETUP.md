# Google OAuth Setup - Guía Paso a Paso

Esta guía te ayudará a configurar Google OAuth para Cycling Companion.

---

## Prerequisitos

- ✅ Proyecto Supabase creado
- ✅ Callback URL de Supabase a mano (Authentication → Providers → Google)
  - Formato: `https://<tu-project-ref>.supabase.co/auth/v1/callback`

---

## Paso 1: Crear Proyecto en Google Cloud Console

### 1.1 Acceder a Google Cloud Console

1. Ve a: https://console.cloud.google.com/
2. Inicia sesión con tu cuenta de Google
3. Si es tu primera vez, acepta los términos de servicio

### 1.2 Crear un nuevo proyecto

1. En la parte superior, haz click en el selector de proyectos (dice "Select a project")
2. Click en **"NEW PROJECT"** (esquina superior derecha del modal)
3. Completa los datos:
   - **Project name**: `Cycling Companion`
   - **Organization**: Déjalo como está (No organization)
   - **Location**: Déjalo como está
4. Click en **"CREATE"**
5. Espera 10-20 segundos mientras se crea el proyecto
6. Verás una notificación cuando esté listo

### 1.3 Seleccionar el proyecto

- Asegúrate de que el proyecto `Cycling Companion` esté seleccionado en el selector de proyectos (parte superior)

---

## Paso 2: Configurar OAuth Consent Screen

Antes de crear las credenciales, Google requiere que configures la pantalla de consentimiento.

### 2.1 Acceder a OAuth Consent Screen

1. En el menú lateral izquierdo, ve a: **APIs & Services** → **OAuth consent screen**
   - Si no ves el menú, haz click en el icono ☰ (hamburguesa) arriba a la izquierda
2. Selecciona **User Type**:
   - ✅ **External** (permite cualquier usuario con cuenta de Google)
3. Click en **"CREATE"**

### 2.2 Completar "OAuth consent screen" (Paso 1/4)

**App information**:
- **App name**: `Cycling Companion`
- **User support email**: Tu email personal (selecciónalo del dropdown)
- **App logo**: Déjalo vacío por ahora (opcional)

**App domain** (opcional, déjalo vacío por ahora):
- Application home page: (vacío)
- Application privacy policy link: (vacío)
- Application terms of service link: (vacío)

**Authorized domains**: Déjalo vacío

**Developer contact information**:
- **Email addresses**: Tu email personal

Click en **"SAVE AND CONTINUE"**

### 2.3 Scopes (Paso 2/4)

No necesitas añadir scopes adicionales. Los scopes por defecto son suficientes:
- `.../auth/userinfo.email`
- `.../auth/userinfo.profile`
- `openid`

Click en **"SAVE AND CONTINUE"**

### 2.4 Test users (Paso 3/4)

Si quieres probar antes de publicar la app:

1. Click en **"ADD USERS"**
2. Añade tu email (el que usarás para hacer login)
3. Click en **"ADD"**

**Nota**: Si no añades test users, puedes publicar la app directamente.

Click en **"SAVE AND CONTINUE"**

### 2.5 Summary (Paso 4/4)

Revisa que todo esté correcto y click en **"BACK TO DASHBOARD"**

---

## Paso 3: Crear Credenciales OAuth

Ahora sí, vamos a crear las credenciales.

### 3.1 Acceder a Credentials

1. En el menú lateral, ve a: **APIs & Services** → **Credentials**
2. Click en **"+ CREATE CREDENTIALS"** (parte superior)
3. Selecciona **"OAuth client ID"**

### 3.2 Configurar OAuth client ID

**Application type**:
- Selecciona **"Web application"**

**Name**:
- `Cycling Companion Web Client`

**Authorized JavaScript origins**:
- Déjalo vacío por ahora (no es necesario para el flujo de Supabase)

**Authorized redirect URIs**:
1. Click en **"+ ADD URI"**
2. Pega la **Callback URL de Supabase** que copiaste antes
   - Ejemplo: `https://abcdefghijklmnop.supabase.co/auth/v1/callback`
3. **IMPORTANTE**: Verifica que la URL sea exacta (sin espacios ni caracteres extra)

Click en **"CREATE"**

### 3.3 Guardar las credenciales

Aparecerá un modal con tus credenciales:

- **Client ID**: Algo como `123456789-abc123def456.apps.googleusercontent.com`
- **Client Secret**: Algo como `GOCSPX-abcdef123456`

**⚠️ IMPORTANTE**:
1. **Copia ambos** (Client ID y Client Secret)
2. Guárdalos en un lugar seguro (notepad, password manager)
3. Las necesitarás en el siguiente paso

Click en **"OK"** para cerrar el modal

---

## Paso 4: Configurar Google Provider en Supabase

Ahora vamos a conectar Google con Supabase.

### 4.1 Acceder a Authentication Providers

1. Ve al dashboard de Supabase: https://app.supabase.com
2. Selecciona tu proyecto `cycling-companion`
3. En el menú lateral, ve a **Authentication** → **Providers**

### 4.2 Habilitar Google Provider

1. Busca **Google** en la lista de providers
2. Activa el toggle **"Enable Sign in with Google"**

### 4.3 Completar las credenciales

**Client ID (for OAuth)**:
- Pega el **Client ID** que copiaste de Google Cloud Console

**Client Secret (for OAuth)**:
- Pega el **Client Secret** que copiaste de Google Cloud Console

**Authorized Client IDs** (opcional):
- Déjalo vacío por ahora

### 4.4 Guardar

1. Click en **"Save"** (abajo a la derecha)
2. Verás un mensaje de confirmación

---

## Paso 5: (Opcional) Publicar la App

Si no quieres limitarte solo a test users:

### 5.1 Volver a Google Cloud Console

1. Ve a: **APIs & Services** → **OAuth consent screen**
2. Verás el estado: **Testing**
3. Click en **"PUBLISH APP"**
4. Lee el aviso y click en **"CONFIRM"**

**Nota**: Para una app personal/demo, no es necesario pasar por el proceso de verificación de Google (que requiere review). Puedes dejarla en modo "Testing" y simplemente añadir test users.

---

## Paso 6: Verificar la Configuración

### 6.1 Verificar en Google Cloud Console

1. Ve a **APIs & Services** → **Credentials**
2. Deberías ver tu **OAuth 2.0 Client ID** creado
3. Haz click en el nombre para editarlo
4. Verifica que la **Authorized redirect URI** coincida exactamente con la de Supabase

### 6.2 Verificar en Supabase

1. Ve a **Authentication** → **Providers** en Supabase
2. Google debería estar **habilitado** (toggle verde)
3. Las credenciales deberían estar guardadas

---

## Paso 7: Probar el Login (después de implementar frontend)

Una vez implementes el botón de login en el frontend:

1. Click en "Login with Google"
2. Deberías ver la pantalla de consentimiento de Google:
   - Logo de Google
   - "Cycling Companion wants to access your Google Account"
   - Email y perfil
3. Selecciona tu cuenta de Google
4. Autoriza el acceso
5. Serás redirigido de vuelta a tu app, autenticado

---

## Troubleshooting

### Error: "redirect_uri_mismatch"

**Causa**: La URL de redirección no coincide entre Google y Supabase

**Solución**:
1. Ve a Google Cloud Console → Credentials
2. Edita tu OAuth Client ID
3. Verifica que la **Authorized redirect URI** sea EXACTAMENTE:
   ```
   https://<tu-project-ref>.supabase.co/auth/v1/callback
   ```
4. Sin espacios, sin barras adicionales, con `https://`

### Error: "Access blocked: This app's request is invalid"

**Causa**: El OAuth Consent Screen no está configurado correctamente

**Solución**:
1. Ve a **OAuth consent screen**
2. Completa todos los campos obligatorios (App name, User support email, Developer contact)
3. Guarda los cambios

### Error: "This app isn't verified"

**Normal**: Si tu app está en modo "Testing", verás este aviso

**Solución**:
1. Añade tu email como test user (OAuth consent screen → Test users)
2. O publica la app (PUBLISH APP) si quieres que cualquiera pueda usarla
3. Para desarrollo personal, simplemente click en "Advanced" → "Go to Cycling Companion (unsafe)"

### No aparece la pantalla de Google

**Causa**: Configuración incorrecta del Client ID/Secret en Supabase

**Solución**:
1. Verifica que copiaste correctamente el Client ID y Secret
2. No debe haber espacios extra al principio o final
3. Vuelve a pegar las credenciales en Supabase

---

## Resumen de URLs y Credenciales

Guarda esto para referencia:

```
Google Cloud Console:
- Proyecto: Cycling Companion
- OAuth Client ID: [Tu Client ID]
- OAuth Client Secret: [Tu Client Secret]
- Redirect URI: https://<tu-project-ref>.supabase.co/auth/v1/callback

Supabase:
- Project URL: https://<tu-project-ref>.supabase.co
- Anon Key: [Tu Anon Key]
- Service Role Key: [Tu Service Role Key]
```

---

## Próximos Pasos

1. ✅ Configurar variables de entorno en el proyecto
2. ✅ Implementar el botón de login en el frontend
3. ✅ Implementar la protección de rutas
4. ✅ Crear el onboarding flow

---

**Última actualización**: Febrero 2026
