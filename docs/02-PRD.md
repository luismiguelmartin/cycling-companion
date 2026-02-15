# Cycling Companion — Product Requirements Document (PRD)

## 1. Información general

| Campo                   | Valor                                                      |
| ----------------------- | ---------------------------------------------------------- |
| **Producto**            | Cycling Companion                                          |
| **Versión**             | MVP v1.0                                                   |
| **Autor**               | Luis Miguel Martín                                         |
| **Fecha**               | Febrero 2026                                               |
| **Contexto**            | Pipeline AI-first aplicado al desarrollo de software |
| **Plazo de desarrollo** | 6-8 semanas                                                |

---

## 2. Objetivo del producto

Desarrollar una plataforma web que permita a ciclistas amateur (40+) visualizar sus datos de entrenamiento, recibir recomendaciones personalizadas de un entrenador IA, y planificar su semana de forma inteligente.

El producto se desarrolla como caso de uso real de un pipeline AI-first integrado en el SDLC.

---

## 3. Stack tecnológico

### 3.1 Frontend

| Tecnología                      | Justificación                                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Next.js 16 LTS** (App Router) | React 19 con SSR, routing integrado, Turbopack, optimización de rendimiento. PWA-ready con `next-pwa`. |
| **TypeScript**                  | Seguridad de tipos, mejor DX, coherente con el backend.                                                |
| **Tailwind CSS**                | Desarrollo rápido de UI responsive, utility-first, sin CSS custom.                                     |
| **Recharts o Chart.js**         | Gráficas de rendimiento (potencia, FC, tendencias). Recharts por integración natural con React.        |
| **shadcn/ui**                   | Componentes accesibles y personalizables sobre Radix UI + Tailwind.                                    |

**Diseño visual**: Basado en mockups JSX de referencia (`docs/design/`, excluidos de git) y documentado en `docs/DESIGN-SYSTEM.md` (pantallas, tokens, componentes, guía de conversión JSX→Next.js+Tailwind).

#### PWA

- Service worker con `next-pwa`
- Manifest configurado para instalación en móvil
- Offline básico: caché de última sesión y plan semanal
- No es prioridad máxima en el MVP, pero la arquitectura lo soporta desde el inicio

### 3.2 Backend / API

| Tecnología          | Justificación                                                             |
| ------------------- | ------------------------------------------------------------------------- |
| **Fastify**         | Más rápido que Express, schema-based validation, plugin ecosystem maduro. |
| **TypeScript**      | Mismo lenguaje en todo el stack.                                          |
| **Fastify Swagger** | Documentación automática de API (OpenAPI).                                |
| **Zod**             | Validación de schemas compartida con frontend.                            |

#### Estructura de la API

```
/api/v1/
├── /auth          → Gestionado por Supabase (no custom)
├── /activities     → CRUD de actividades
├── /activities/:id → Detalle + métricas
├── /plan           → Plan semanal (GET, POST regenerar)
├── /insights       → Comparativas y tendencias
├── /profile        → Perfil del usuario
└── /ai             → Endpoint de recomendaciones IA
    ├── /ai/analyze-activity   → Análisis post-sesión
    ├── /ai/weekly-plan        → Generación de plan
    └── /ai/weekly-summary     → Resumen comparativo
```

### 3.3 Base de datos y servicios

| Tecnología                   | Uso                                                         |
| ---------------------------- | ----------------------------------------------------------- |
| **Supabase**                 | PostgreSQL gestionado + Auth + Storage + Realtime           |
| **Supabase Auth**            | Autenticación con Google (zero config), gestión de sesiones |
| **Supabase Storage**         | Almacenamiento de archivos .fit/.gpx subidos                |
| **Supabase DB (PostgreSQL)** | Datos de usuario, actividades, planes, métricas             |

#### Modelo de datos (según migraciones aplicadas)

> Ref: `supabase/migrations/001_initial_schema.sql` + `002_alter_users_for_onboarding.sql` + `003_align_activity_type_enum.sql` + `004_ai_cache.sql`

```
users
├── id (UUID, PK, FK → auth.users, ON DELETE CASCADE)
├── email (TEXT, NOT NULL)
├── display_name (TEXT, NOT NULL)               ← obligatorio desde migration 002
├── age (INTEGER, NOT NULL, CHECK 0-120)        ← obligatorio desde migration 002
├── weight_kg (DECIMAL(5,2), NOT NULL, CHECK 0-300) ← obligatorio, CHECK ampliado
├── ftp (INTEGER, nullable, CHECK 0-1000)       ← CHECK ampliado en migration 002
├── max_hr (INTEGER, nullable, CHECK 0-250)     ← CHECK ampliado en migration 002
├── rest_hr (INTEGER, nullable, CHECK 0-200)    ← CHECK ampliado en migration 002
├── goal (TEXT, NOT NULL, DEFAULT 'performance') ← TEXT con CHECK, no ENUM (ref: ADR-004)
│   └── CHECK: 'performance' | 'health' | 'weight_loss' | 'recovery'
├── created_at (TIMESTAMPTZ, NOT NULL)
└── updated_at (TIMESTAMPTZ, NOT NULL, auto-trigger)

activities
├── id (UUID, PK, auto-generated)
├── user_id (UUID, NOT NULL, FK → users, ON DELETE CASCADE)
├── name (TEXT, NOT NULL)
├── date (DATE, NOT NULL)
├── type (activity_type ENUM: 'intervals' | 'endurance' | 'recovery' | 'tempo' | 'rest')
├── duration_seconds (INTEGER, NOT NULL, CHECK > 0)
├── distance_km (DECIMAL(8,2), CHECK ≥ 0)
├── avg_power_watts (INTEGER, CHECK ≥ 0)
├── avg_hr_bpm (INTEGER, CHECK 0-220)
├── max_hr_bpm (INTEGER, CHECK 0-220)
├── avg_cadence_rpm (INTEGER, CHECK ≥ 0)
├── tss (INTEGER, CHECK ≥ 0)
├── rpe (INTEGER, CHECK 1-10)
├── ai_analysis (JSONB, nullable)
├── notes (TEXT, nullable)
├── is_reference (BOOLEAN, DEFAULT FALSE)
├── raw_file_url (TEXT, nullable)
├── created_at (TIMESTAMPTZ, NOT NULL)
└── updated_at (TIMESTAMPTZ, NOT NULL, auto-trigger)

weekly_plans
├── id (UUID, PK, auto-generated)
├── user_id (UUID, NOT NULL, FK → users, ON DELETE CASCADE)
├── week_start (DATE, NOT NULL)
├── plan_data (JSONB, NOT NULL)
│   └── Estructura planificada: array de 7 PlanDay objects
├── ai_rationale (TEXT, nullable)
├── created_at (TIMESTAMPTZ, NOT NULL)
├── updated_at (TIMESTAMPTZ, NOT NULL, auto-trigger)
└── UNIQUE(user_id, week_start)

activity_metrics (series temporales)
├── id (UUID, PK, auto-generated)
├── activity_id (UUID, NOT NULL, FK → activities, ON DELETE CASCADE)
├── timestamp_seconds (INTEGER, NOT NULL)
├── power_watts (INTEGER, nullable)
├── hr_bpm (INTEGER, nullable, CHECK 0-220)
├── cadence_rpm (INTEGER, nullable, CHECK ≥ 0)
└── speed_kmh (DECIMAL(5,2), nullable, CHECK ≥ 0)

ai_cache (caché y rate limit de IA)
├── id (UUID, PK, auto-generated)
├── user_id (UUID, NOT NULL, FK → users, ON DELETE CASCADE)
├── cache_key (TEXT, NOT NULL)          ← 'coach_tip_2026-02-15', 'analyze_activity_{id}'
├── endpoint (TEXT, NOT NULL)           ← 'analyze-activity' | 'weekly-plan' | 'weekly-summary' | 'coach-tip'
├── response (JSONB, NOT NULL)
├── model (TEXT, nullable)
├── prompt_version (TEXT, nullable)
├── created_at (TIMESTAMPTZ, NOT NULL)
├── expires_at (TIMESTAMPTZ, NOT NULL)
└── UNIQUE(user_id, cache_key)
```

**Decisiones de diseño aplicadas (migrations 002 + 003)**:
- `goal` cambió de `goal_type` ENUM a TEXT con CHECK constraint (ADR-004: más flexible para migraciones futuras)
- `display_name`, `age`, `weight_kg` son NOT NULL (obligatorios en el onboarding)
- CHECKs más estrictos en `ftp` (< 1000), `max_hr` (< 250), `rest_hr` (< 200), `weight_kg` (< 300)
- `activity_type` ENUM actualizado de `('outdoor', 'indoor', 'recovery')` a `('intervals', 'endurance', 'recovery', 'tempo', 'rest')` (migration 003) — alineado con el diseño del producto

### 3.4 IA / LLM

| Componente                  | Tecnología                                                                 |
| --------------------------- | -------------------------------------------------------------------------- |
| **LLM principal**           | Claude (vía API de Anthropic)                                              |
| **Capa de prompts**         | Prompts versionados en código (`apps/api/src/services/ai/prompts.ts`) |
| **Contexto**                | Datos del usuario + actividades recientes + plan actual (RAG simplificado) |
| **Reglas de entrenamiento** | Heurísticas en código (umbrales de TSS, zonas, progresión)                 |
| **Guardrails**              | La IA recomienda, nunca decide. Siempre muestra razonamiento.              |

#### Flujo de una recomendación IA

```
1. Recopilar contexto del usuario (perfil + últimas N actividades + plan actual)
2. Aplicar reglas/heurísticas (carga semanal, tendencia, objetivo)
3. Construir prompt con contexto estructurado
4. Llamar a Claude API
5. Parsear respuesta (JSON estructurado)
6. Presentar al usuario con explicación comprensible
```

### 3.5 Autenticación

| Aspecto                      | Decisión                                      |
| ---------------------------- | --------------------------------------------- |
| **Proveedor**                | Supabase Auth                                 |
| **Método principal**         | Google OAuth                                  |
| **Método secundario**        | Email + password (como fallback)              |
| **Sesiones**                 | JWT gestionado por Supabase, cookies httpOnly |
| **RLS (Row Level Security)** | Activado. Cada usuario solo ve sus datos.     |

### 3.6 Despliegue

| Componente             | Plataforma            | Plan         | Justificación                                                                                  |
| ---------------------- | --------------------- | ------------ | ---------------------------------------------------------------------------------------------- |
| **Frontend (Next.js)** | **Vercel**            | Free (Hobby) | Despliegue nativo de Next.js, CDN global, preview deploys por PR                               |
| **Backend (Fastify)**  | **Render**            | Free         | Web service con auto-deploy desde GitHub, sleep tras 15min de inactividad (aceptable para MVP) |
| **Base de datos**      | **Supabase**          | Free         | 500MB DB, 1GB Storage, 50K auth users, suficiente para MVP                                     |
| **Dominio**            | Subdominios gratuitos | —            | `cycling-companion.vercel.app` + `api-cycling.onrender.com`                                    |

#### CI/CD

- **Vercel**: deploy automático en push a `main` y preview en cada PR
- **Render**: deploy automático en push a `main`
- **GitHub Actions**: lint, tests, type-check en cada PR + flujos AI-first

### 3.7 Monorepo vs repos separados

**Decisión: Monorepo** con estructura de carpetas.

```
cycling-companion/
├── apps/
│   ├── web/          → Next.js 16 frontend (App Router, React 19, Tailwind CSS)
│   └── api/          → Fastify 5 backend (TypeScript, Zod)
├── packages/
│   └── shared/       → Types compartidos, validaciones Zod, constantes
│       └── src/
│           ├── schemas/     → Zod schemas (activity, user-profile, ...)
│           ├── constants/   → Constantes de negocio (activity-types, goals, rpe, zones, ...)
│           └── index.ts     → Re-exports centralizados
├── supabase/
│   └── migrations/   → Scripts SQL incrementales (001_initial_schema, 002_alter_users, ...)
├── docs/
│   ├── design/       → Mockups JSX de referencia (excluidos de git)
│   ├── specs/        → Especificaciones L1 (UX), L2 (técnico), L3 (issues) por pantalla
│   ├── DESIGN-SYSTEM.md → Guía visual: pantallas, tokens, componentes, conversión JSX→Next.js
│   ├── GOOGLE-OAUTH-SETUP.md → Guía de configuración OAuth
│   ├── SETUP-CHECKLIST.md → Checklist de setup del proyecto
│   ├── SUPABASE-SETUP.md → Guía de configuración de Supabase
│   ├── 01-PRODUCT-VISION.md
│   ├── 02-PRD.md
│   └── 03-AGENTS-AND-DEVELOPMENT-PLAN.md
├── .github/
│   └── workflows/    → GitHub Actions (CI + agentes remotos AI-first)
├── turbo.json        → Turborepo config
├── eslint.config.mjs → ESLint 9 flat config (raíz)
├── .prettierrc.json  → Prettier config
└── package.json      → Workspace root (pnpm)
```

**Justificación**: Un monorepo simplifica compartir tipos, facilita PRs que tocan front+back, y es más fácil de gestionar con agentes IA que necesitan contexto completo.

**Herramienta**: Turborepo (caching, pipelines de build, ligero).

---

## 4. Funcionalidades detalladas

### F01 — Autenticación y onboarding

**Prioridad**: P0 (bloqueante)

**Descripción**: El usuario se registra/logea con Google y completa un onboarding de 3-4 pasos.

**Flujo**:

1. Landing → "Entrar con Google"
2. Redirect OAuth → Supabase Auth
3. Si es nuevo usuario → Onboarding:
   - Paso 1: Nombre, edad, peso
   - Paso 2: FTP (con explicación + opción "no lo sé")
   - Paso 3: FC máxima y reposo (con estimaciones automáticas si no lo sabe)
   - Paso 4: Objetivo (performance / health / weight_loss / recovery)
4. Redirect al dashboard

**Criterios de aceptación**:

- Login con Google funciona en menos de 3 clics
- Los datos del onboarding se guardan en la tabla `users`
- Si el usuario ya existe, va directo al dashboard
- RLS activo: solo accede a sus datos

---

### F02 — Dashboard principal

**Prioridad**: P0

**Descripción**: Vista rápida del estado de entrenamiento.

**Componentes**:

- **KPI Cards** (4): distancia semanal, tiempo semanal, potencia media semanal, FC media semanal
- **Gráfica de tendencia**: últimas 4 semanas, potencia media por semana (barras) con línea de FC
- **Tarjeta IA**: recomendación del día (texto generado, máx 2-3 frases)
- **Alerta de sobrecarga**: banner visible si carga semanal > umbral
- **Accesos rápidos**: última actividad, plan semanal, comparar

**Datos**: Agregados desde `activities` del usuario para la semana/mes actual.

---

### F03 — Lista de actividades

**Prioridad**: P0

**Descripción**: Listado paginado de actividades con filtros.

**Tabla**:
| Columna | Tipo |
|---|---|
| Fecha | date, ordenable |
| Nombre | text |
| Tipo | badge (intervals/endurance/tempo/recovery/rest) |
| Distancia | km, 1 decimal |
| Tiempo | HH:MM |
| Potencia media | watts |
| FC media | bpm |
| RPE | escala visual 1-10 |
| Acciones | ver detalle |

**Filtros**: rango de fechas, tipo de salida, búsqueda por nombre.

**Acciones**: importar actividad (upload .fit/.gpx o form manual para mock).

---

### F04 — Importar actividad

**Prioridad**: P0

**Descripción**: Dos modos de importación.

**Modo mock (fase inicial)**:

- Formulario manual: nombre, fecha, tipo, duración, distancia, potencia media, FC media, cadencia, RPE
- Opción de generar datos mock automáticos (botón "generar actividad de ejemplo")

**Modo archivo (fase posterior)**:

- Upload de .fit o .gpx
- Parseo server-side (librería `fit-file-parser` para .fit, `gpxparser` para .gpx)
- Extracción de métricas y series temporales
- Almacenamiento del archivo original en Supabase Storage

---

### F05 — Detalle de actividad

**Prioridad**: P0

**Descripción**: Vista completa de una sesión.

**Secciones**:

- KPI Cards: distancia, tiempo, potencia media, FC media, cadencia media, TSS estimado
- Gráficas temporales (si hay datos de series): potencia/tiempo, FC/tiempo, cadencia/tiempo
- RPE registrado por el usuario
- **Análisis IA**: texto generado explicando qué indica la sesión y qué priorizar
- Notas personales (editable)
- Checkbox "sesión de referencia"

---

### F06 — Planificación semanal

**Prioridad**: P1

**Descripción**: Plan semanal generado por IA.

**Vista**:

- Calendario horizontal (lunes a domingo)
- Cada día: card con tipo de entreno, intensidad (baja/media/alta), duración estimada
- Colores por tipo de entreno (ver `docs/DESIGN-SYSTEM.md` sección 2.2 para paleta exacta)
- Indicador de carga semanal acumulada (barra de progreso)

**Generación IA**:

- Input: perfil del usuario + últimas 2 semanas de actividades + objetivo
- Output: JSON con 7 días, cada uno con: tipo, intensidad, duración, tip de nutrición, tip de descanso
- Botón "Recalcular": regenera el plan

**Recomendaciones complementarias por día**:

- Nutrición: hidratación, carbohidratos pre/post (texto corto)
- Descanso: horas de sueño sugeridas, recuperación activa

---

### F07 — Comparar semanas / tendencias

**Prioridad**: P1

**Descripción**: Comparativa entre dos periodos.

**Flujo**:

1. Seleccionar periodo A (semana o mes)
2. Seleccionar periodo B
3. Ver datos lado a lado

**Datos comparados**: distancia total, tiempo total, potencia media, FC media, carga total (TSS), número de sesiones.

**Gráficas**: barras agrupadas por métrica.

**Resumen IA**: texto explicativo de las diferencias y su significado.

---

### F08 — Perfil y ajustes

**Prioridad**: P1

**Descripción**: Gestión de datos personales y configuración.

**Secciones**:

- Datos personales: nombre, edad, peso, avatar (de Google)
- Datos de entrenamiento: FTP, FC max, FC reposo (editables)
- Zonas automáticas: calculadas al modificar FTP o FC, mostrando tabla de zonas
- Objetivo actual: selector (performance / health / weight_loss / recovery)
- Preferencias: tema claro/oscuro (si da tiempo), unidades (km/mi)

---

### F09 — Alertas de sobrecarga

**Prioridad**: P1

**Descripción**: Sistema de alertas basado en reglas.

**Reglas**:

- Si TSS semanal > 1.2x media de las últimas 4 semanas → alerta amarilla
- Si TSS semanal > 1.5x media → alerta roja
- Si más de 3 días consecutivos de alta intensidad → alerta de descanso

**Visualización**:

- Banner en dashboard
- Icono en planificación semanal
- Mención en recomendación IA

---

### F10 — Entrenador IA (capa transversal)

**Prioridad**: P1

**Descripción**: No es una pantalla sino una capacidad que opera en toda la app.

**Puntos de contacto**:

| Ubicación         | Tipo de recomendación | Trigger                         |
| ----------------- | --------------------- | ------------------------------- |
| Dashboard         | Recomendación del día | Carga automática                |
| Detalle actividad | Análisis post-sesión  | Al abrir actividad sin análisis |
| Planificación     | Plan semanal completo | Al generar/recalcular plan      |
| Comparativas      | Resumen de tendencias | Al comparar periodos            |

**Tono del entrenador**:

- Cercano pero profesional
- Basado en datos, nunca inventado
- Motivador sin ser condescendiente
- Siempre explica el porqué

**Implementación**:

- Prompts versionados en `/prompts/` (se crearán progresivamente en fases 2-3)
- Contexto construido programáticamente (no RAG complejo, sino template filling)
- Reglas de entrenamiento en código como primer filtro (la IA complementa, no sustituye)
- Respuestas en JSON estructurado, parseadas en frontend para presentación

---

## 5. Datos mock

Para la fase inicial de desarrollo, los datos de ejemplo se documentan en las especificaciones y el design system como referencia.

### Fuentes de datos de ejemplo

- **DESIGN-SYSTEM.md §5**: datos mock de referencia para todas las pantallas
- **Especificaciones L1**: cada spec incluye apéndice con datos mock de la pantalla
- **Supabase**: las actividades y perfil se crean directamente vía la app (onboarding + formulario de importación manual)

### Perfil de usuario ejemplo

- 45 años, 78 kg, FTP 195 W, FC max 172, objetivo: performance

### Transición a datos reales

La arquitectura ya soporta datos reales:

1. Upload de archivos .fit/.gpx (implementado en pantalla de importación)
2. Formulario manual para crear actividades
3. Misma estructura en BD

---

## 6. Requisitos no funcionales

| Requisito          | Especificación                                                        |
| ------------------ | --------------------------------------------------------------------- |
| **Rendimiento**    | Dashboard carga en < 2s, gráficas en < 1s                             |
| **Responsive**     | Desktop-first, usable en tablet y móvil                               |
| **Accesibilidad**  | Contrastes AA, navegación por teclado en flows principales            |
| **Seguridad**      | RLS en Supabase, HTTPS, sanitización de inputs                        |
| **Privacidad**     | Datos del usuario aislados por RLS, no se comparten entre usuarios    |
| **Disponibilidad** | Aceptable tier gratuito (cold starts en Render: ~30s primera request) |
| **Mantenibilidad** | TypeScript end-to-end, linting, tests automatizados                   |

---

## 7. Fuera de alcance del MVP

- Integración directa con APIs de Strava/Garmin
- Notificaciones push
- App móvil nativa
- Rol de entrenador humano
- Gamificación
- Mapas y rutas
- Funcionalidad social
- Multi-idioma (solo español en MVP)

---

## 8. Riesgos y mitigaciones

| Riesgo                               | Impacto | Mitigación                                                 |
| ------------------------------------ | ------- | ---------------------------------------------------------- |
| Recomendaciones IA poco útiles       | Alto    | Reglas/heurísticas como base + IA como capa explicativa    |
| Tiempo insuficiente para todo el MVP | Alto    | Priorización estricta P0/P1, recortar F06-F09 si necesario |
| Cold starts en Render (free tier)    | Bajo    | Aceptable para MVP, documentar como limitación             |
| Costes de API de Claude              | Medio   | Caché de recomendaciones, limitar llamadas por usuario/día |
| Complejidad del parseo .fit/.gpx     | Medio   | Empezar con mock, parseo como feature separada             |

---

## 9. Estado de especificaciones

> Última actualización: 2026-02-15

### Especificaciones frontend (L1/L2/L3 por pantalla)

| Screen | Pantalla | L1 (UX) | L2 (Técnico) | L3 (Issues) | Implementada |
|--------|----------|:-------:|:------------:|:-----------:|:------------:|
| 00 | Login + Onboarding | ✅ | ✅ | ✅ | ✅ |
| 01 | Dashboard | ✅ | ✅ | — | ✅ |
| 02 | Importar Actividad | ✅ | ✅ | ✅ | ✅ |
| 03 | Lista Actividades | ✅ | ✅ | ✅ | ✅ |
| 04 | Detalle Actividad | ✅ | ✅ | ✅ | ✅ |
| 05 | Planificación Semanal | ✅ | ✅ | ✅ | ✅ (Fase 2) |
| 06 | Perfil | ✅ | ✅ | — | ✅ |
| 07 | Insights / Comparar | ✅ | ✅ | ✅ | ✅ (Fase 2) |

### Especificaciones backend (L2 por bloque)

| Bloque | Spec | Implementado |
|--------|------|:------------:|
| 0 — Infraestructura | `L2-backend-00-infrastructure.md` | ✅ |
| 1 — Perfil | `L2-backend-01-profile.md` | ✅ |
| 2 — Actividades | `L2-backend-02-activities.md` | ✅ |
| 3 — Insights | `L2-backend-03-insights.md` | ✅ |
| 4 — Training Rules | `L2-backend-04-training-rules.md` | ✅ |
| 5 — IA (Claude API) | `L2-backend-05-ai-endpoints.md` | ✅ |
| 6 — Weekly Plan | `L2-backend-06-weekly-plan.md` | ✅ |
| 7 — Import | `L2-backend-07-import.md` | ✅ |

**Convención de nombres**: `L{nivel}-screen-{número_PRD}-{nombre}.md` (frontend), `L2-backend-{bloque}-{nombre}.md` (backend)
