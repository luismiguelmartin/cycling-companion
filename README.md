# 🚴 Cycling Companion

Plataforma web de análisis y planificación de entrenamiento para ciclistas amateur (40+), impulsada por IA.

**Cycling Companion** es un banco de pruebas para un pipeline AI-first de integración de IA en el ciclo de vida del desarrollo. Proporciona un entrenador IA personal que traduce datos de ciclismo en recomendaciones accionables de entrenamiento, nutrición y descanso.

---

## 📋 Índice

- [Estado del Proyecto](#estado-del-proyecto)
- [Propuesta de Valor](#propuesta-de-valor)
- [Stack Tecnológico](#stack-tecnológico)
- [Pantallas](#pantallas)
- [Arquitectura](#arquitectura)
- [Instalación](#instalación)
- [Desarrollo](#desarrollo)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Documentación](#documentación)
- [Limitaciones MVP](#limitaciones-mvp)
- [Licencia](#licencia)

---

## 📊 Estado del Proyecto

**Fase actual**: Fase 2 — MVP funcional (frontend completo, backend/IA pendientes)

### Completado
- ✅ Monorepo configurado (Turborepo + pnpm)
- ✅ Autenticación con Google OAuth (Supabase Auth)
- ✅ Onboarding wizard (4 pasos)
- ✅ 9 pantallas frontend implementadas (ver [Pantallas](#pantallas))
- ✅ 32 componentes reutilizables
- ✅ 16 archivos de test (103 tests)
- ✅ 4 schemas Zod compartidos + 7 módulos de constantes
- ✅ 3 migraciones SQL (schema, onboarding, activity types)
- ✅ Design system documentado (dark/light theme)
- ✅ 22 especificaciones L1/L2/L3 para 8 pantallas

### Pendiente
- ⬜ API Fastify: solo tiene `/health`, faltan endpoints CRUD y de IA
- ⬜ Integración Claude API: entrenador virtual (análisis actividades, generación planes)
- ⬜ Importación real de actividades (pantalla UI lista, sin conexión a backend)
- ⬜ Plan semanal real (usa datos mock; falta consultar tabla `weekly_plans`)
- ⬜ Deploy a producción (Vercel + Render + Supabase)

---

## 💡 Propuesta de Valor

**Cycling Companion** transforma datos de entrenamiento en ciclismo en insights accionables:

- 📊 **Análisis Post-Sesión**: La IA analiza cada actividad y proporciona feedback detallado basado en métricas (potencia, FC, RPE)
- 📅 **Planificación Inteligente**: Plan de entrenamiento semanal generado automáticamente según tu perfil, objetivo y carga actual
- 🎯 **Recomendaciones Personalizadas**: Sugerencias de nutrición, descanso y ajustes de intensidad basadas en datos
- 📈 **Seguimiento de Tendencias**: Comparativas semanales y visualización del progreso

---

## 🛠 Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript 5.7, Tailwind CSS 3.4 |
| **Componentes UI** | shadcn/ui, Radix UI, Lucide React (iconos), Recharts (gráficas) |
| **Backend** | Fastify 5, TypeScript, Zod (validación) |
| **Base de Datos** | Supabase (PostgreSQL + Auth + Storage + RLS) |
| **Autenticación** | Supabase Auth con Google OAuth |
| **IA** | Claude API (Anthropic) para recomendaciones |
| **Monorepo** | Turborepo + pnpm |
| **Testing** | Vitest, React Testing Library |
| **Tipografía** | DM Sans (400/500/600/700) |

---

## 🖥 Pantallas

| Ruta | Pantalla | Fuente de datos |
|------|----------|-----------------|
| `/auth/login` | Login con Google OAuth | Supabase Auth |
| `/onboarding` | Onboarding wizard (4 pasos: perfil → objetivos → zonas → resumen) | Supabase |
| `/` | Dashboard: KPIs, gráficas de potencia/carga, coach IA, actividades recientes | Supabase + mock |
| `/activities` | Lista de actividades con filtros por tipo y búsqueda | Supabase |
| `/activities/[id]` | Detalle: métricas, gráfica temporal (potencia/FC/cadencia), análisis IA | Supabase |
| `/activities/import` | Importar actividad: entrada manual o subida de archivo | Solo UI |
| `/plan` | Planificación semanal: grid 7 días, tips nutrición/descanso, barra de carga | Mock data |
| `/insights` | Insights: comparativa entre periodos, radar de rendimiento, análisis IA | Supabase (cálculos client) |
| `/profile` | Perfil: datos personales, zonas potencia/FC, ajustes (tema, unidades) | Supabase |

---

## 🏗 Arquitectura

### Modelo de Datos (3 migraciones SQL)

**users** — Perfil: edad, peso, FTP, FC máx/reposo, objetivo (performance/health/weight_loss/recovery)

**activities** — Métricas: duración, distancia, potencia, FC, cadencia, TSS, RPE (1-10), análisis IA (JSONB), notas

**weekly_plans** — Plan semanal: 7 días (tipo, intensidad, duración, tips nutrición/descanso), rationale IA

**activity_metrics** — Series temporales: potencia, FC, cadencia, velocidad por segundo

### Endpoints API (planificados)

```
/api/v1/
├── /auth              Gestionado por Supabase
├── /activities        CRUD de actividades
├── /activities/:id    Detalle + métricas + análisis IA
├── /plan              Plan semanal (GET, POST para regenerar)
├── /insights          Comparativas y tendencias
├── /profile           Perfil del usuario
└── /ai
    ├── /analyze-activity   Análisis post-sesión
    ├── /weekly-plan        Generación de plan semanal
    └── /weekly-summary     Resumen comparativo
```

> **Nota**: Actualmente solo `/health` está implementado. Los endpoints listados son el diseño objetivo.

### Flujo de Recomendaciones IA (diseño)

```
1. Recopilar contexto (perfil + últimas N actividades + plan actual)
   ↓
2. Aplicar reglas/heurísticas (TSS semanal, tendencias, objetivo)
   ↓
3. Construir prompt estructurado con contexto
   ↓
4. Llamar a Claude API
   ↓
5. Parsear respuesta (JSON estructurado)
   ↓
6. Presentar al usuario con explicación clara
```

---

## 🚀 Instalación

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
#    - SUPABASE_URL y SUPABASE_ANON_KEY (apps/web y apps/api)
#    - ANTHROPIC_API_KEY (apps/api, para Claude)
```

### Configurar Base de Datos

```bash
# Ejecutar migraciones (desde Supabase Dashboard o CLI)
supabase db push

# Seed de datos mock (opcional, para desarrollo)
# Ejecutar supabase/seed_personalized.sql desde el Dashboard SQL Editor
```

---

## 💻 Desarrollo

```bash
# Ejecutar frontend + backend
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

---

## 📁 Estructura del Proyecto

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
│   └── api/                        # Fastify 5 Backend (minimal)
│       └── src/
│           └── index.ts            # Solo /health por ahora
│
├── packages/
│   └── shared/                     # Types y validaciones compartidas
│       └── src/
│           ├── schemas/            # 4 schemas Zod (user, activity, plan, insights)
│           └── constants/          # 7 módulos (goals, zones, types, rpe, filters, etc.)
│
├── supabase/
│   ├── migrations/                 # 3 migraciones SQL
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_alter_users_for_onboarding.sql
│   │   └── 003_align_activity_type_enum.sql
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
│   └── specs/                      # 22 especificaciones L1/L2/L3
│
├── turbo.json                      # Configuración Turborepo
├── pnpm-workspace.yaml             # Workspace pnpm
├── eslint.config.mjs               # ESLint 9 flat config
├── CLAUDE.md                       # Instrucciones para Claude Code
└── README.md
```

---

## 📚 Documentación

| Documento | Descripción |
|-----------|-------------|
| [01-PRODUCT-VISION.md](docs/01-PRODUCT-VISION.md) | Visión del producto y propuesta de valor |
| [02-PRD.md](docs/02-PRD.md) | PRD completo: modelo de datos, endpoints, flujo IA |
| [03-AGENTS-AND-DEVELOPMENT-PLAN.md](docs/03-AGENTS-AND-DEVELOPMENT-PLAN.md) | Plan de agentes y desarrollo con timeline |
| [DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md) | Design system: pantallas, tokens, componentes, conversión JSX→Next.js |
| [GOOGLE-OAUTH-SETUP.md](docs/GOOGLE-OAUTH-SETUP.md) | Guía de configuración de Google OAuth |
| [SUPABASE-SETUP.md](docs/SUPABASE-SETUP.md) | Guía de configuración de Supabase |
| `docs/specs/` | 22 especificaciones L1 (UX), L2 (técnico), L3 (issues) para 8 pantallas |

---

## ⚙️ Pipeline AI-First

Este proyecto implementa un pipeline multi-agente para integrar IA en el ciclo de desarrollo.

### Agentes Locales (Claude Code)

| Agente | Rol | Trigger |
|--------|-----|---------|
| **L1: UX Interpreter** | Mockups → especificación funcional | Manual |
| **L2: Architect** | Especificación → diseño técnico | Manual |
| **L3: Planner** | Diseño → issues incrementales | Manual |
| **L4: Implementer** | Implementar código con supervisión | Manual |

### Agentes Remotos (GitHub Actions) — planificados

| Agente | Rol | Trigger |
|--------|-----|---------|
| **R1: Issue Analyzer** | Analizar impacto y complejidad | Label `ai-analyze` |
| **R2: PR Generator** | Generar PR completa desde issue | Label `ai-generate-pr` |
| **R3: PR Reviewer** | Code review automático | PR abierta |
| **R4: CI/CD** | Lint, test, build | Push/PR |
| **R5: Doc Generator** | Actualizar CHANGELOG, README | PR mergeada |

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
- **Costes Claude API**: Implementar caché, limitar llamadas/usuario/día

### Fuera del Alcance del MVP

- Integración con APIs de Strava/Garmin Connect
- Rol de entrenador humano multi-atleta
- Mapas y trazado de rutas
- Funcionalidad social (compartir, competir)
- Notificaciones push, gamificación
- App móvil nativa / integración con wearables

---

## 📅 Fases de Desarrollo

| Fase | Descripción | Estado |
|------|-------------|--------|
| **Fase 1** | Cimientos: monorepo, CI, Auth, deploy, schema DB | ✅ Completada |
| **Fase 2** | MVP funcional: pantallas frontend, datos mock, specs | 🔄 En curso |
| **Fase 3** | Core features: API endpoints, integración Claude, import real | ⬜ Pendiente |
| **Fase 4** | Refinamiento: agentes remotos, evaluación, documentación | ⬜ Pendiente |

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
