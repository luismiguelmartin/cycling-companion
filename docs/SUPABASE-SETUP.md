# Guía de Setup de Supabase

Esta guía te ayudará a configurar Supabase desde cero para el proyecto Cycling Companion.

---

## 1. Crear el Proyecto en Supabase

### Paso 1.1: Crear cuenta y proyecto
1. Ve a [supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Click en "New Project"
4. Completa los datos:
   - **Name**: `cycling-companion`
   - **Database Password**: Genera una contraseña segura y guárdala (la necesitarás después)
   - **Region**: Elige la más cercana a tu ubicación (ej: `eu-central-1` para Europa)
   - **Pricing Plan**: Free
5. Click en "Create new project"
6. Espera 1-2 minutos mientras se aprovisiona el proyecto

### Paso 1.2: Obtener las credenciales
Una vez creado el proyecto:

1. En el dashboard de Supabase, ve a **Settings** (icono de engranaje) → **API**
2. Copia las siguientes credenciales:
   - **Project URL** (ejemplo: `https://abcdefghijklmnop.supabase.co`)
   - **Project API keys**:
     - `anon` `public` key (para el frontend)
     - `service_role` `secret` key (para el backend) ⚠️ **NUNCA expongas esta clave en el frontend**

---

## 2. Ejecutar las Migraciones de Base de Datos

### Opción A: Desde el SQL Editor de Supabase (Recomendado para setup inicial)

1. En el dashboard de Supabase, ve a **SQL Editor** (icono de base de datos)
2. Click en "New query"
3. Copia **todo el contenido** del archivo `supabase/migrations/001_initial_schema.sql`
4. Pégalo en el editor
5. Click en "Run" (o presiona Ctrl/Cmd + Enter)
6. Verifica que no haya errores en la consola de salida
7. Ve a **Database** → **Tables** y confirma que se crearon las tablas:
   - `users`
   - `activities`
   - `weekly_plans`
   - `activity_metrics`

### Opción B: Usando Supabase CLI (Recomendado para desarrollo continuo)

```bash
# Instalar Supabase CLI
npm install -g supabase

# Inicializar Supabase en el proyecto (ya está configurado)
# supabase init

# Linkear con el proyecto remoto
supabase link --project-ref <tu-project-ref>

# Aplicar las migraciones
supabase db push

# Ver el estado de las migraciones
supabase migration list
```

**Nota**: El `<tu-project-ref>` lo encuentras en Settings → General → Reference ID

---

## 3. Configurar Google OAuth para Autenticación

### Paso 3.1: Crear proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. En el menú lateral, ve a **APIs & Services** → **Credentials**
4. Click en **Configure Consent Screen**:
   - **User Type**: External
   - **App name**: `Cycling Companion`
   - **User support email**: tu email
   - **Developer contact**: tu email
   - **Scopes**: No añadas ninguno (solo necesitamos email y perfil, que son por defecto)
   - **Test users**: Añade tu email si quieres probar antes de publicar
5. Click en "Save and Continue"

### Paso 3.2: Crear credenciales OAuth

1. Ve a **Credentials** → **Create Credentials** → **OAuth client ID**
2. **Application type**: Web application
3. **Name**: `Cycling Companion Web`
4. **Authorized JavaScript origins**: Deja vacío por ahora
5. **Authorized redirect URIs**: Añade esta URL (reemplaza con tu proyecto):
   ```
   https://<tu-project-ref>.supabase.co/auth/v1/callback
   ```
   Ejemplo: `https://abcdefghijklmnop.supabase.co/auth/v1/callback`
6. Click en "Create"
7. **Guarda** el `Client ID` y `Client Secret`

### Paso 3.3: Configurar Google OAuth en Supabase

1. En el dashboard de Supabase, ve a **Authentication** → **Providers**
2. Busca **Google** en la lista
3. Activa el toggle "Enable Sign in with Google"
4. Completa los campos:
   - **Client ID**: El que obtuviste de Google Cloud
   - **Client Secret**: El que obtuviste de Google Cloud
5. Click en "Save"

### Paso 3.4: Verificar la configuración

En la misma pantalla de Supabase, copia la **Callback URL** que aparece:
```
https://<tu-project-ref>.supabase.co/auth/v1/callback
```

Vuelve a Google Cloud Console y verifica que esta URL esté en **Authorized redirect URIs**.

---

## 4. Configurar Variables de Entorno

### Paso 4.1: Frontend (apps/web)

1. Crea el archivo `.env.local` (copia desde `.env.example`):
   ```bash
   cd apps/web
   cp .env.example .env.local
   ```

2. Edita `apps/web/.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<tu-project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu-anon-key>
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

### Paso 4.2: Backend (apps/api)

1. Crea el archivo `.env` (copia desde `.env.example`):
   ```bash
   cd apps/api
   cp .env.example .env
   ```

2. Edita `apps/api/.env`:
   ```env
   SUPABASE_URL=https://<tu-project-ref>.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<tu-service-role-key>
   ANTHROPIC_API_KEY=<tu-anthropic-api-key>
   PORT=3001
   ```

**⚠️ IMPORTANTE**: Asegúrate de que `.env` y `.env.local` estén en `.gitignore` (ya deberían estarlo).

---

## 5. Configurar Supabase Storage (para archivos .fit/.gpx)

Esto lo necesitarás en fases posteriores, pero puedes configurarlo ahora:

1. En el dashboard de Supabase, ve a **Storage**
2. Click en "Create a new bucket"
3. **Name**: `activity-files`
4. **Public bucket**: No (desmarcado)
5. **Allowed MIME types**: `.fit, .gpx, application/octet-stream`
6. Click en "Create bucket"

### Configurar políticas de Storage

1. Click en el bucket `activity-files`
2. Ve a **Policies**
3. Click en "New Policy" → "For full customization"
4. Crea las siguientes políticas:

**Política de lectura**:
```sql
CREATE POLICY "Los usuarios pueden leer sus propios archivos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'activity-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

**Política de inserción**:
```sql
CREATE POLICY "Los usuarios pueden subir sus propios archivos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'activity-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

**Política de eliminación**:
```sql
CREATE POLICY "Los usuarios pueden eliminar sus propios archivos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'activity-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

**Nota**: Esto asume que los archivos se guardarán con la estructura: `<user_id>/<filename>`

---

## 6. Verificar que Todo Funciona

### Paso 6.1: Verificar RLS

1. Ve a **Authentication** → **Policies**
2. Deberías ver políticas activas para las tablas:
   - `users`
   - `activities`
   - `weekly_plans`
   - `activity_metrics`

### Paso 6.2: Probar autenticación (después de implementar el frontend)

Una vez implementado el login en el frontend:

1. Inicia sesión con Google
2. Ve a **Authentication** → **Users** en Supabase
3. Deberías ver tu usuario creado

### Paso 6.3: Verificar que las tablas funcionan

Puedes crear un usuario de prueba manualmente:

1. Ve a **SQL Editor**
2. Ejecuta:
   ```sql
   -- Ver usuarios (solo verás los que has creado tú mismo si estás autenticado)
   SELECT * FROM users;

   -- Ver estructura de las tablas
   \d users
   \d activities
   \d weekly_plans
   \d activity_metrics
   ```

---

## 7. Datos de Prueba (Mock Data)

Cuando tengas un usuario autenticado, puedes insertar datos de prueba:

```sql
-- Primero, obtén tu user_id (reemplaza con el UUID real de tu usuario)
-- Lo puedes ver en Authentication → Users

-- Insertar actividad de prueba
INSERT INTO activities (
  user_id,
  name,
  date,
  type,
  duration_seconds,
  distance_km,
  avg_power_watts,
  avg_hr_bpm,
  max_hr_bpm,
  avg_cadence_rpm,
  tss,
  rpe,
  notes
) VALUES (
  '<tu-user-id>',
  'Salida matinal - Puerto de montaña',
  '2026-02-10',
  'outdoor',
  7200,  -- 2 horas
  65.5,
  180,
  145,
  165,
  85,
  120,
  7,
  'Buena subida, me sentí fuerte en la segunda mitad'
);
```

Más adelante crearemos un script de seed automatizado.

---

## 8. Recursos Útiles

- **Dashboard de Supabase**: https://app.supabase.com
- **Documentación de Supabase**: https://supabase.com/docs
- **Supabase Auth (Google)**: https://supabase.com/docs/guides/auth/social-login/auth-google
- **Row Level Security**: https://supabase.com/docs/guides/auth/row-level-security
- **Supabase CLI**: https://supabase.com/docs/guides/cli

---

## 9. Troubleshooting

### Error: "relation public.users does not exist"
- Verifica que ejecutaste el script `001_initial_schema.sql` completo
- Ve a **Database** → **Tables** y confirma que las tablas existen

### Error: "new row violates row-level security policy"
- Asegúrate de estar autenticado (con `auth.uid()` válido)
- Verifica que las políticas RLS estén activas en la tabla

### Error al autenticar con Google
- Verifica que la Redirect URI en Google Cloud Console coincida exactamente con la de Supabase
- Asegúrate de que el Client ID y Client Secret sean correctos
- Comprueba que el Consent Screen esté configurado y publicado

### No puedo ver los datos insertados
- Recuerda que RLS está activo: solo puedes ver tus propios datos
- Usa el SQL Editor con el botón "RLS disabled" para ver todos los datos (solo en desarrollo)

---

## 10. Siguientes Pasos

Una vez completado este setup:

1. ✅ Implementar autenticación en el frontend (`apps/web`)
2. ✅ Crear endpoints API en el backend (`apps/api`)
3. ✅ Implementar el onboarding flow
4. ✅ Crear script de seed para datos de prueba

---

**Última actualización**: Febrero 2026
