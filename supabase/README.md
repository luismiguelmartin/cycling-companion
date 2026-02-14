# Supabase - Base de Datos y Autenticación

Esta carpeta contiene todo lo relacionado con Supabase para el proyecto Cycling Companion.

## 📁 Estructura

```
supabase/
├── README.md                    → Este archivo
├── migrations/                  → Migraciones de base de datos (versionadas)
│   └── 001_initial_schema.sql   → Schema inicial (tablas, RLS, índices)
└── seed.sql                     → Datos de prueba para desarrollo
```

## 🚀 Setup Rápido

### 1. Crear proyecto en Supabase

Ver la guía completa en [`docs/SUPABASE-SETUP.md`](../docs/SUPABASE-SETUP.md)

### 2. Ejecutar migración inicial

Copia el contenido de `migrations/001_initial_schema.sql` en el SQL Editor de Supabase y ejecútalo.

### 3. Configurar variables de entorno

```bash
# Frontend
cp apps/web/.env.example apps/web/.env.local
# Edita y añade: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY

# Backend
cp apps/api/.env.example apps/api/.env
# Edita y añade: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
```

### 4. (Opcional) Cargar datos de prueba

1. Autentícate en la app
2. Copia tu `user_id` desde Authentication → Users
3. Reemplaza `<USER_ID>` en `seed.sql` con tu ID real
4. Ejecuta el script en el SQL Editor

## 📊 Modelo de Datos

### Tablas principales

| Tabla              | Descripción                                       |
| ------------------ | ------------------------------------------------- |
| `users`            | Perfil del ciclista (FTP, FC, peso, objetivo)     |
| `activities`       | Actividades registradas (salidas, entrenamientos) |
| `weekly_plans`     | Planes semanales generados por la IA              |
| `activity_metrics` | Series temporales de métricas (para .fit/.gpx)    |

### RLS (Row Level Security)

✅ **Todas las tablas tienen RLS activado**

Cada usuario solo puede acceder a sus propios datos. Las políticas están definidas en `001_initial_schema.sql`.

## 🔐 Autenticación

- **Proveedor principal**: Google OAuth
- **Gestión**: Supabase Auth
- **Tokens**: JWT automático, cookies httpOnly

Ver configuración en [`docs/SUPABASE-SETUP.md`](../docs/SUPABASE-SETUP.md) sección 3.

## 📦 Storage (archivos .fit/.gpx)

Bucket configurado: `activity-files`

Estructura de carpetas:

```
activity-files/
└── <user_id>/
    ├── activity-123.fit
    └── activity-456.gpx
```

Políticas RLS activas: solo el propietario puede leer/escribir/eliminar sus archivos.

## 🛠️ Comandos Útiles

### Con Supabase CLI

```bash
# Linkear con el proyecto remoto
supabase link --project-ref <tu-project-ref>

# Ver estado de migraciones
supabase migration list

# Aplicar migraciones pendientes
supabase db push

# Resetear base de datos local (desarrollo)
supabase db reset

# Generar tipos TypeScript desde el schema
supabase gen types typescript --local > packages/shared/src/supabase.types.ts
```

### Desde el SQL Editor de Supabase

```sql
-- Ver todas las tablas
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

-- Ver políticas RLS activas
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Contar actividades por usuario
SELECT user_id, COUNT(*) as total
FROM activities
GROUP BY user_id;

-- Ver actividades recientes
SELECT date, name, type, avg_power_watts, tss
FROM activities
ORDER BY date DESC
LIMIT 10;
```

## 📚 Recursos

- [Guía completa de setup](../docs/SUPABASE-SETUP.md)
- [Documentación oficial de Supabase](https://supabase.com/docs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Auth con Google](https://supabase.com/docs/guides/auth/social-login/auth-google)

## 🔄 Próximas Migraciones

Cuando necesites hacer cambios en el schema:

1. Crea un nuevo archivo en `migrations/` con el siguiente nombre:
   ```
   002_descripcion_del_cambio.sql
   ```
2. Escribe los cambios (ALTER TABLE, CREATE INDEX, etc.)
3. Aplica la migración con `supabase db push` o desde el SQL Editor
4. Documenta el cambio en el commit

**Ejemplo**:

```sql
-- 002_add_activity_weather.sql
ALTER TABLE activities
ADD COLUMN weather TEXT CHECK (weather IN ('sunny', 'cloudy', 'rainy', 'windy'));
```

---

**Última actualización**: Febrero 2026
