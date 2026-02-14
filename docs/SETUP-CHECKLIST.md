# Setup Checklist - Cycling Companion

Usa este checklist para hacer seguimiento del setup inicial del proyecto.

---

## ✅ Fase 1: Supabase

### Base de Datos
- [ ] Proyecto Supabase creado
- [ ] Script `001_initial_schema.sql` ejecutado
- [ ] Tablas creadas verificadas (users, activities, weekly_plans, activity_metrics)
- [ ] RLS activo en todas las tablas

### Credenciales Supabase
- [ ] Project URL copiada
- [ ] Anon Key copiada
- [ ] Service Role Key copiada

---

## 🔐 Fase 2: Google OAuth

### Google Cloud Console
- [ ] Proyecto "Cycling Companion" creado en Google Cloud Console
- [ ] OAuth Consent Screen configurado
  - [ ] App name: "Cycling Companion"
  - [ ] User support email añadido
  - [ ] Developer contact email añadido
- [ ] OAuth Client ID creado (tipo: Web application)
  - [ ] Redirect URI de Supabase añadida
  - [ ] Client ID copiado
  - [ ] Client Secret copiado
- [ ] Test users añadidos (opcional)
- [ ] App publicada (opcional, o dejada en Testing)

### Supabase Auth
- [ ] Provider Google habilitado en Supabase
- [ ] Client ID configurado
- [ ] Client Secret configurado
- [ ] Cambios guardados

---

## 📝 Fase 3: Variables de Entorno

### Frontend (apps/web)
- [ ] Archivo `.env.local` creado (copia de `.env.example`)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` configurada
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configurada
- [ ] `NEXT_PUBLIC_API_URL` configurada (http://localhost:3001)

### Backend (apps/api)
- [ ] Archivo `.env` creado (copia de `.env.example`)
- [ ] `SUPABASE_URL` configurada
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurada
- [ ] `ANTHROPIC_API_KEY` configurada (para más adelante)
- [ ] `PORT` configurada (3001)

### Verificación
- [ ] Archivos `.env` y `.env.local` están en `.gitignore`
- [ ] No se commitearán credenciales

---

## 🧪 Fase 4: Implementación de Auth (Siguiente)

### Frontend
- [ ] Cliente de Supabase configurado (`@supabase/supabase-js`)
- [ ] Botón "Login with Google" implementado
- [ ] Manejo de sesión implementado
- [ ] Protección de rutas implementada
- [ ] Redirect post-login funcionando

### Backend
- [ ] Cliente de Supabase configurado (con Service Role Key)
- [ ] Middleware de autenticación implementado
- [ ] Verificación de JWT implementada

### Testing
- [ ] Login con Google funciona
- [ ] Usuario aparece en Supabase Auth → Users
- [ ] Sesión persiste tras reload
- [ ] Logout funciona

---

## 🎨 Fase 5: Onboarding Flow (Siguiente)

- [ ] Ruta `/onboarding` creada
- [ ] Paso 1: Datos personales (nombre, edad, peso)
- [ ] Paso 2: Métricas (FTP, FC max, FC reposo)
- [ ] Paso 3: Objetivo (performance/health/weight_loss/recovery)
- [ ] Datos guardados en tabla `users`
- [ ] Redirect a dashboard tras completar
- [ ] Verificación: usuarios sin perfil completo van a onboarding

---

## 📊 Fase 6: Datos de Prueba (Opcional)

- [ ] Login realizado (user_id obtenido)
- [ ] `seed.sql` editado con tu user_id
- [ ] `seed.sql` ejecutado en Supabase
- [ ] Actividades de prueba visibles
- [ ] Planes semanales de prueba visibles

---

## 🚀 Fase 7: CI/CD (Siguiente)

### GitHub
- [ ] Repositorio creado
- [ ] Branch protection en `main`
- [ ] PR template configurado

### GitHub Actions
- [ ] Workflow `ci.yml` creado
  - [ ] Lint
  - [ ] Typecheck
  - [ ] Tests
  - [ ] Build

### Despliegue
- [ ] Frontend desplegado en Vercel
  - [ ] Variables de entorno configuradas
  - [ ] Deploy automático en push a `main`
  - [ ] Preview deploys en PRs
- [ ] Backend desplegado en Render
  - [ ] Variables de entorno configuradas
  - [ ] Deploy automático en push a `main`

---

## 📚 Documentación de Referencia

Mientras haces el setup, consulta estos archivos:

| Tema | Archivo |
|------|---------|
| Setup Supabase | `docs/SUPABASE-SETUP.md` |
| Setup Google OAuth | `docs/GOOGLE-OAUTH-SETUP.md` |
| Plan de desarrollo | `docs/03-AGENTS-AND-DEVELOPMENT-PLAN.md` |
| PRD completo | `docs/02-PRD.md` |
| Comandos del proyecto | `CLAUDE.md` o `README.md` |

---

## ✅ Estado Actual

Actualiza esto conforme avances:

**Última actualización**: Febrero 2026

**Fase completada**:
- ✅ Fase 1: Supabase (base de datos)
- 🔄 Fase 2: Google OAuth (en progreso)
- ⏳ Fase 3: Variables de entorno
- ⏳ Fase 4: Implementación de Auth
- ⏳ Fase 5: Onboarding Flow

**Próximo paso**: Configurar Google OAuth siguiendo `docs/GOOGLE-OAUTH-SETUP.md`
