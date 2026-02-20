# 🚴 Cycling Companion

[![CI Frontend](https://github.com/luismiguelmartin/cycling-companion/actions/workflows/ci-frontend.yml/badge.svg)](https://github.com/luismiguelmartin/cycling-companion/actions/workflows/ci-frontend.yml)
[![CI Backend](https://github.com/luismiguelmartin/cycling-companion/actions/workflows/ci-backend.yml/badge.svg)](https://github.com/luismiguelmartin/cycling-companion/actions/workflows/ci-backend.yml)

Plataforma web de análisis y planificación de entrenamiento para ciclistas amateur (40+), impulsada por IA.

**Cycling Companion** es un banco de pruebas para un pipeline AI-first de integración de IA en el ciclo de vida del desarrollo. Proporciona un entrenador IA personal que traduce datos de ciclismo en recomendaciones accionables de entrenamiento, nutrición y descanso.

---

## 📋 Índice

- [Descripción General](#descripción-general)
- [Stack Tecnológico](#stack-tecnológico)
- [Instalación y Ejecución](#instalación-y-ejecución)
- [Estructuración](#estructuración)
- [Funcionalidades](#funcionalidades)
- [Documentación](#documentación)

---

## Descripción General

### Propuesta de Valor

**Cycling Companion** transforma datos de entrenamiento en ciclismo en insights accionables:

- 📊 **Análisis Post-Sesión**: La IA analiza cada actividad y proporciona feedback detallado basado en métricas (potencia, FC, RPE)
- 📅 **Planificación Inteligente**: Plan de entrenamiento semanal generado automáticamente según tu perfil, objetivo y carga actual
- 🎯 **Recomendaciones Personalizadas**: Sugerencias de nutrición, descanso y ajustes de intensidad basadas en datos
- 📈 **Seguimiento de Tendencias**: Comparativas semanales y visualización del progreso

### Estado del Proyecto

**Fase actual**: Fase 4 completada ✅ — Pipeline AI-first validado end-to-end

| Fase       | Descripción                                                   | Estado        |
| ---------- | ------------------------------------------------------------- | ------------- |
| **Fase 1** | Cimientos: monorepo, CI, Auth, deploy, schema DB              | ✅ Completada |
| **Fase 2** | MVP funcional: pantallas frontend, datos mock, specs          | ✅ Completada |
| **Fase 3** | Core features: API endpoints, integración Claude, import real | ✅ Completada |
| **Fase 4** | Agentes remotos, pipeline AI-first, evaluación                | ✅ Completada |

### Completado

- ✅ Monorepo configurado (Turborepo + pnpm)
- ✅ Autenticación con Google OAuth (Supabase Auth)
- ✅ Onboarding wizard (4 pasos)
- ✅ **10 pantallas frontend implementadas** (todas las rutas del MVP + modo demo)
- ✅ 32 componentes reutilizables
- ✅ **~347 tests**: 112 web + 90 shared + 145 API
- ✅ 5 schemas Zod compartidos + 7 módulos de constantes + utils de training
- ✅ 4 migraciones SQL (schema, onboarding, activity types, ai_cache)
- ✅ Design system documentado (dark/light theme)
- ✅ 33 especificaciones L1/L2/L3 (frontend + backend + Fase 4)
- ✅ **API Fastify completa**: 15+ endpoints (CRUD + IA + upload)
- ✅ **4 endpoints IA** con Claude API (cache, fallback, rate limit)
- ✅ **Importación real** de archivos .fit/.gpx con Normalized Power, extensiones Garmin
- ✅ **Frontend migrado** de Supabase directo → API backend (Bloque 8)
- ✅ **Análisis IA** auto-trigger tras importar + botón manual en detalle
- ✅ **Deploy producción**: Vercel + Render + Supabase
- ✅ **5 agentes remotos** (GitHub Actions + `claude-code-action@v1`): R1 Analyzer, R2 PR Generator, R3 Reviewer, R5 Doc Generator, @claude Interactive
- ✅ **Pipeline AI-first validado end-to-end**: Issue → R1 análisis → R2 genera PR → R3 review → merge → R5 CHANGELOG (~$1.00/feature)
- ✅ **16 labels** para pipeline AI-first + label sync automático
- ✅ **CHANGELOG automático** en merge de PRs

---

## Stack Tecnológico

| Capa               | Tecnología                                                          |
| ------------------ | ------------------------------------------------------------------- |
| **Frontend**       | Next.js 16 (App Router), React 19, TypeScript 5.7, Tailwind CSS 3.4 |
| **Componentes UI** | shadcn/ui, Radix UI, Lucide React (iconos), Recharts (gráficas)     |
| **Backend**        | Fastify 5, TypeScript, Zod (validación)                             |
| **Base de Datos**  | Supabase (PostgreSQL + Auth + Storage + RLS)                        |
| **Autenticación**  | Supabase Auth con Google OAuth                                      |
| **IA**             | Claude API (Anthropic) para recomendaciones                         |
| **Monorepo**       | Turborepo + pnpm                                                    |
| **Testing**        | Vitest, React Testing Library                                       |
| **Tipografía**     | DM Sans (400/500/600/700)                                           |

### Justificación Tecnológica

- **Next.js 16 LTS**: React 19 con SSR, routing integrado, Turbopack, optimización de rendimiento. PWA-ready.
- **TypeScript**: Seguridad de tipos, mejor DX, coherente en todo el stack.
- **Tailwind CSS**: Desarrollo rápido de UI responsive, utility-first, sin CSS custom.
- **Recharts**: Gráficas de rendimiento (potencia, FC, tendencias) con integración natural en React.
- **shadcn/ui**: Componentes accesibles y personalizables sobre Radix UI + Tailwind.
- **Fastify**: Más rápido que Express, schema-based validation, plugin ecosystem maduro.
- **Supabase**: PostgreSQL gestionado + Auth + Storage + Realtime. Alternativa a Firebase.
- **Turborepo**: Caching, pipelines de build, ligero para monorepos.

---

## Instalación y Ejecución

### Requisitos Previos

- Node.js 18+ (recomendado: 20 LTS)
- pnpm 9+
- Git

### Setup Inicial

```bash
# 1. Clonar el repositorio
git clone https://github.com/luismiguelmartin/cycling-companion.git
cd cycling-companion

# 2. Instalar dependencias
pnpm install

# 3. Configurar variables de entorno
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env

# 4. Editar .env con tus credenciales:
#    - NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY (apps/web)
#    - SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (apps/api)
#    - ANTHROPIC_API_KEY (apps/api, para Claude)
```

### Configurar Base de Datos

```bash
# Ejecutar migraciones (desde Supabase Dashboard o CLI)
supabase db push

# Seed de datos mock (opcional, para desarrollo)
# Ejecutar supabase/seed_personalized.sql desde el Dashboard SQL Editor
```

### Ejecutar en Desarrollo

```bash
# Ejecutar frontend + backend simultáneamente
pnpm dev

# Solo frontend (http://localhost:3000)
pnpm --filter web dev

# Solo backend (http://localhost:3001)
pnpm --filter api dev
```

### Comandos de Validación

```bash
pnpm build           # Build de todo el proyecto
pnpm lint            # ESLint en los 3 paquetes (vía Turborepo)
pnpm typecheck       # Type-check en los 3 paquetes
pnpm test            # Tests en los 3 paquetes (Vitest)
pnpm format          # Prettier: formatear todo
pnpm format:check    # Prettier: verificar formato sin modificar
```

### Variables de Entorno

```bash
# apps/web/.env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
NEXT_PUBLIC_API_URL=http://localhost:3001

# apps/api/.env
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
ANTHROPIC_API_KEY=<claude-api-key>
PORT=3001
```

---

## Estructuración

### Estructura del Proyecto

```
cycling-companion/
├── apps/
│   ├── web/                        # Next.js 16 Frontend
│   │   ├── src/
│   │   │   ├── app/                # App Router (9 rutas)
│   │   │   │   ├── (auth)/         #   Login, Onboarding, OAuth callback
│   │   │   │   └── (app)/          #   Dashboard, Activities, Plan, Insights, Profile
│   │   │   ├── components/         # 32 componentes reutilizables
│   │   │   │   ├── charts/         #   Recharts (power-trend, daily-load, radar, activity)
│   │   │   │   └── ui/             #   shadcn/ui (button, switch, tabs)
│   │   │   └── lib/                # Utilidades (Supabase, cálculos, formateo)
│   │   └── vitest.config.ts
│   │
│   └── api/                        # Fastify 5 Backend
│       └── src/
│           ├── index.ts            # Punto de entrada
│           ├── app.ts              # Setup Fastify (plugins, routes)
│           ├── plugins/            # Auth, CORS, error-handler, env
│           ├── routes/             # profile, activities, insights, ai, plan
│           └── services/           # Lógica de negocio + AI service
│
├── packages/
│   └── shared/                     # Types y validaciones compartidas
│       └── src/
│           ├── schemas/            # 5 schemas Zod (user, activity, plan, insights, ai-response)
│           ├── constants/          # 7 módulos (goals, zones, types, rpe, filters)
│           └── utils/              # Training calculations, training rules
│
├── supabase/
│   ├── migrations/                 # 4 migraciones SQL
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_alter_users_for_onboarding.sql
│   │   ├── 003_align_activity_type_enum.sql
│   │   └── 004_ai_cache.sql
│   ├── seed.sql                    # Seed genérico (placeholder <USER_ID>)
│   └── seed_personalized.sql       # Seed con datos de ejemplo
│
├── docs/
│   ├── 01-PRODUCT-VISION.md        # Visión del producto
│   ├── 02-PRD.md                   # Product Requirements Document
│   ├── 03-AGENTS-AND-DEVELOPMENT-PLAN.md  # Plan de agentes
│   ├── DESIGN-SYSTEM.md            # Design system (tokens, componentes, conversión JSX)
│   ├── GOOGLE-OAUTH-SETUP.md       # Guía configuración OAuth
│   ├── SUPABASE-SETUP.md           # Guía configuración Supabase
│   └── specs/                      # 27 especificaciones L1/L2/L3
│
├── turbo.json                      # Configuración Turborepo
├── pnpm-workspace.yaml             # Workspace pnpm
├── eslint.config.mjs               # ESLint 9 flat config
├── CLAUDE.md                       # Instrucciones para Claude Code
└── README.md
```

### Modelo de Datos (4 migraciones SQL)

**users** — Perfil: edad, peso, FTP, FC máx/reposo, objetivo (performance/health/weight_loss/recovery)

**activities** — Métricas: duración, distancia, potencia, FC, cadencia, TSS, RPE (1-10), análisis IA (JSONB), notas

**weekly_plans** — Plan semanal: 7 días (tipo, intensidad, duración, tips nutrición/descanso), rationale IA

**activity_metrics** — Series temporales: potencia, FC, cadencia, velocidad por segundo

**ai_cache** — Caché y rate limit de IA: cache_key, endpoint, response (JSONB), expires_at

### Endpoints API (Implementados ✅)

```
/health                               Health check
/api/v1/
├── /profile           GET, PATCH     Perfil del usuario
├── /activities         GET, POST      Lista y crear actividades
├── /activities/:id     GET, PATCH, DELETE   Detalle, actualizar, eliminar
├── /activities/:id/metrics  GET       Series temporales
├── /activities/upload  POST           Upload .fit/.gpx (multipart)
├── /insights           GET            Comparativas y tendencias
├── /insights/overload-check  GET      Alerta de sobrecarga
├── /plan               GET, PATCH, DELETE   Plan semanal
└── /ai
    ├── /analyze-activity   POST       Análisis post-sesión (Claude API)
    ├── /weekly-plan        POST       Generación de plan semanal
    ├── /weekly-summary     POST       Resumen comparativo
    └── /coach-tip          GET        Recomendación diaria
```

### Flujo de Recomendaciones IA (Implementado)

```
1. Rate limit check (max 20 llamadas/usuario/día via ai_cache)
   ↓
2. Cache check (buscar respuesta no expirada en ai_cache)
   ↓
3. Recopilar contexto (perfil + últimas N actividades + métricas CTL/ATL/TSB)
   ↓
4. Aplicar reglas/heurísticas (training rules en packages/shared)
   ↓
5. Construir prompt versionado (prompts.ts)
   ↓
6. Llamar a Claude API (claude-sonnet-4-5-20250929)
   ↓
7. Parsear + validar con schema Zod → si falla: fallback heurístico
   ↓
8. Persistir en cache + tabla destino → retornar al usuario
```

### Convenciones de Desarrollo

- **TypeScript**: Modo estricto, no `any`, types compartidos en `packages/shared`
- **React**: App Router, Server Components por defecto, Client Components para interactividad
- **Componentes**: PascalCase para componentes, kebab-case para archivos
- **Git**: Commits en español con formato `feat:`, `fix:`, `refactor:`, `docs:`
- **PRs**: Pequeñas y enfocadas (< 400 líneas), enlazar con issues
- **Tests**: Unitarios para lógica compleja, integración para endpoints críticos
- **Tailwind**: Utility classes, evitar CSS custom
- **RLS**: Row Level Security activo en Supabase, nunca desactivar

---

## Funcionalidades

### Pantallas Implementadas

| Ruta                 | Pantalla      | Descripción                                                       | Fuente de datos |
| -------------------- | ------------- | ----------------------------------------------------------------- | --------------- |
| `/auth/login`        | Login         | Autenticación con Google OAuth                                    | Supabase Auth   |
| `/onboarding`        | Onboarding    | Wizard de 4 pasos: perfil → objetivos → zonas → resumen           | API backend     |
| `/`                  | Dashboard     | KPIs, gráficas de potencia/carga, coach IA, últimas actividades   | API backend     |
| `/activities`        | Lista         | Tabla paginada con filtros por tipo y búsqueda por nombre         | API backend     |
| `/activities/[id]`   | Detalle       | Métricas, gráficas temporales (potencia/FC/cadencia), análisis IA | API backend     |
| `/activities/import` | Importar      | Entrada manual o subida de archivo (.fit/.gpx)                    | API backend     |
| `/plan`              | Planificación | Grid semanal (7 días), tips nutrición/descanso, barra de carga    | API backend     |
| `/insights`          | Insights      | Comparativa entre periodos, radar de rendimiento, análisis IA     | API backend     |
| `/profile`           | Perfil        | Datos personales, zonas potencia/FC, ajustes tema/unidades        | API backend     |

### Características Principales

#### F01 — Autenticación y Onboarding

- Login con Google OAuth (sin contraseña)
- Onboarding de 4 pasos: datos básicos → FTP → FC máx/reposo → objetivo
- Redirect automático al dashboard tras completar

#### F02 — Dashboard Principal

- 4 KPI Cards: distancia semanal, tiempo, potencia media, FC media
- Gráfica de tendencia: últimas 4 semanas (potencia + FC)
- Tarjeta IA: recomendación del día (2-3 frases)
- Alerta de sobrecarga si carga semanal > umbral
- Accesos rápidos: última actividad, plan, comparar

#### F03 — Lista de Actividades

- Tabla con ordenamiento por fecha
- Filtros: rango de fechas, tipo de salida, búsqueda por nombre
- Columnas: fecha, nombre, tipo, distancia, tiempo, potencia, FC, RPE
- Botón importar actividad

#### F04 — Importar Actividad

- Modo manual: formulario con datos (nombre, fecha, tipo, duración, distancia, etc.)
- Modo archivo: upload .fit/.gpx con parseo de extensiones Garmin (FC, cadencia, potencia, velocidad)
- Normalized Power (NP) calculado automáticamente para TSS preciso
- RPE y notas editables en ambos modos
- Análisis IA auto-trigger tras importar

#### F05 — Detalle de Actividad

- KPI Cards: distancia, tiempo, potencia, FC, cadencia, TSS
- Gráficas temporales con eje X en kilómetros (potencia/FC/cadencia vs distancia)
- RPE registrado
- **Análisis IA**: botón "Generar análisis" + auto-trigger tras importar
- Notas personales editables
- Checkbox: marcar como "sesión de referencia"

#### F06 — Planificación Semanal ✅ (Fase 2)

- Calendario horizontal (lunes a domingo)
- 7 días con sugerencias IA: tipo, intensidad, duración
- Recomendaciones por día: nutrición, hidratación, horas de sueño
- Indicadores visuales de carga acumulada
- Botón: recalcular plan

#### F07 — Insights / Comparar ✅ (Fase 2)

- Selección de dos periodos
- Datos comparativos: tiempo, distancia, potencia, FC, carga
- Gráficas comparativas lado a lado
- Radar de rendimiento
- **Resumen IA**: explicación de cambios y por qué importan

#### F08 — Perfil y Ajustes

- Datos personales: nombre, edad, peso, FTP, FC máx/reposo
- Zonas de potencia y FC (calculadas o personalizables)
- Objetivo actual (performance/health/weight_loss/recovery)
- Preferencias: tema (dark/light), unidades (km/mi), notificaciones

### Features Transversales

#### Entrenador IA

No es una pantalla, sino una capa que opera en toda la app:

- **En el dashboard**: resumen diario y recomendación
- **En cada actividad**: análisis post-sesión
- **En la planificación**: generación y ajuste de plan semanal
- **En comparativas**: explicación de tendencias
- **Tono**: cercano, motivador, basado en datos

Internamente implementado con:

- LLM (Claude) como capa explicativa
- Reglas + heurísticas para lógica de entrenamiento
- Datos del usuario como contexto (RAG simplificado)

---

## Documentación

| Documento                                                                   | Descripción                                                           |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| [01-PRODUCT-VISION.md](docs/01-PRODUCT-VISION.md)                           | Visión del producto, propuesta de valor, persona objetivo             |
| [02-PRD.md](docs/02-PRD.md)                                                 | PRD completo: modelo de datos, endpoints, flujo IA, specs             |
| [03-AGENTS-AND-DEVELOPMENT-PLAN.md](docs/03-AGENTS-AND-DEVELOPMENT-PLAN.md) | Plan de agentes locales y remotos, timeline de desarrollo             |
| [DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md)                                   | Design system: pantallas, tokens, componentes, conversión JSX→Next.js |
| [GOOGLE-OAUTH-SETUP.md](docs/GOOGLE-OAUTH-SETUP.md)                         | Guía de configuración de Google OAuth en Supabase                     |
| [SUPABASE-SETUP.md](docs/SUPABASE-SETUP.md)                                 | Guía de configuración de Supabase y base de datos                     |
| [CLAUDE.md](CLAUDE.md)                                                      | Instrucciones para Claude Code (este repositorio)                     |
| `docs/specs/`                                                               | 27 especificaciones L1/L2/L3 (8 pantallas + 9 bloques backend)        |

---

## Pipeline AI-First

Este proyecto implementa un pipeline multi-agente para integrar IA en el ciclo de desarrollo.

### Agentes Locales (Claude Code)

| Agente                 | Rol                                | Trigger |
| ---------------------- | ---------------------------------- | ------- |
| **L1: UX Interpreter** | Mockups → especificación funcional | Manual  |
| **L2: Architect**      | Especificación → diseño técnico    | Manual  |
| **L3: Planner**        | Diseño → issues incrementales      | Manual  |
| **L4: Implementer**    | Implementar código con supervisión | Manual  |

### Agentes Remotos (GitHub Actions + `claude-code-action@v1`) — Activos ✅

| Agente                 | Rol                             | Trigger                 | Modelo     | Costo aprox. |
| ---------------------- | ------------------------------- | ----------------------- | ---------- | ------------ |
| **R1: Issue Analyzer** | Analizar impacto y complejidad  | Label `ai-analyze`      | Haiku 4.5  | ~$0.04       |
| **R2: PR Generator**   | Generar PR completa desde issue | Label `ai-generate-pr`  | Sonnet 4.6 | ~$0.71       |
| **R3: PR Reviewer**    | Code review automático          | PR abierta              | Haiku 4.5  | ~$0.01       |
| **R4: CI/CD**          | Lint, test, build               | Push/PR                 | —          | —            |
| **R5: Doc Generator**  | Actualizar CHANGELOG            | PR mergeada             | Haiku 4.5  | ~$0.03       |
| **@claude**            | Handler interactivo             | `@claude` en issues/PRs | Sonnet 4   | variable     |

**Pipeline completo validado**: Issue #31 → R1 → R2 (PR #32) → R3 → merge → R5. Total: 31 turns, ~$1.00.

---

## 🔒 Seguridad

- **RLS (Row Level Security)**: Cada usuario solo ve sus propios datos
- **Autenticación**: JWT gestionado por Supabase, cookies httpOnly
- **Validación**: Todos los inputs validados con Zod
- **Secrets**: Variables de entorno, nunca commitear API keys

---

## 🎯 Limitaciones MVP

- **Sin integración directa con Strava/Garmin**: Solo importación manual
- **Solo español**: Multi-idioma fuera de scope
- **Cold starts en Render**: Tier gratuito ~30s después de 15min inactividad
- **Costes Claude API**: Caché implementada + rate limit 20/usuario/día

### Fuera del Alcance del MVP

- Integración con APIs de Strava/Garmin Connect
- Rol de entrenador humano multi-atleta
- Mapas y trazado de rutas
- Funcionalidad social (compartir, competir)
- Notificaciones push, gamificación
- App móvil nativa / integración con wearables

---

## 🤝 Contribución

### Convenciones

- **Commits**: Español con formato `feat:`, `fix:`, `refactor:`, `docs:`
- **PRs**: Pequeñas y enfocadas (< 400 líneas), enlazar con issues
- **TypeScript**: Modo estricto, types compartidos en `packages/shared`
- **Tests**: Unitarios para lógica compleja, integración para endpoints críticos

---

## 📄 Licencia

Cycling Companion © 2026. Todos los derechos reservados.

---

**Desarrollado con un pipeline AI-first de integración de IA en el ciclo de vida del desarrollo.**
