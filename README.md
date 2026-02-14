# 🚴 Cycling Companion

Plataforma web de análisis y planificación de entrenamiento para ciclistas amateur (40+), impulsada por IA.

**Cycling Companion** es un banco de pruebas para un pipeline AI-first de integración de IA en el ciclo de vida del desarrollo. Proporciona un entrenador IA personal que traduce datos de ciclismo en recomendaciones accionables de entrenamiento, nutrición y descanso.

---

## 📋 Índice

- [Propuesta de Valor](#propuesta-de-valor)
- [Stack Tecnológico](#stack-tecnológico)
- [Arquitectura](#arquitectura)
- [Instalación](#instalación)
- [Desarrollo](#desarrollo)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Documentación](#documentación)
- [Limitaciones MVP](#limitaciones-mvp)
- [Licencia](#licencia)

---

## 💡 Propuesta de Valor

**Cycling Companion** transforma datos de entrenamiento en ciclismo en insights accionables:

- 📊 **Análisis Post-Sesión**: La IA analiza cada actividad y proporciona feedback detallado basado en métricas (potencia, FC, RPE)
- 📅 **Planificación Inteligente**: Plan de entrenamiento semanal generado automáticamente según tu perfil, objetivo y carga actual
- 🎯 **Recomendaciones Personalizadas**: Sugerencias de nutrición, descanso y ajustes de intensidad basadas en datos
- 📈 **Seguimiento de Tendencias**: Comparativas semanales y visualización del progreso

---

## 🛠 Stack Tecnológico

### Monorepo con Turborepo + pnpm

```
cycling-companion/
├── apps/
│   ├── web/          Next.js 16 (App Router, TypeScript, Tailwind CSS)
│   └── api/          Fastify (TypeScript, Zod validation, Swagger)
├── packages/
│   └── shared/       Types compartidos, validaciones Zod
├── prompts/          Prompts versionados para IA
├── docs/             Documentación del producto y desarrollo
└── data/mock/        Datos mock para desarrollo
```

### Stack Principal

| Capa              | Tecnología                                                                |
| ----------------- | ------------------------------------------------------------------------- |
| **Frontend**      | Next.js 16 (LTS), React 19, TypeScript, Tailwind CSS, Recharts, shadcn/ui |
| **Backend**       | Fastify, TypeScript, Zod (validación), Swagger (documentación)            |
| **Base de Datos** | Supabase (PostgreSQL + Auth + Storage + RLS)                              |
| **Autenticación** | Supabase Auth con Google OAuth                                            |
| **IA**            | Claude API (Anthropic) para recomendaciones                               |
| **Deploy**        | Vercel (frontend), Render (API), Supabase (DB)                            |
| **CI/CD**         | GitHub Actions                                                            |

---

## 🏗 Arquitectura

### Modelo de Datos

**users**

- Perfil: edad, peso, FTP (Functional Threshold Power), FC máxima/reposo
- Objetivo: performance | health | weight_loss | recovery
- Zonas de potencia y FC calculadas automáticamente

**activities**

- Métricas: duración, distancia, potencia media, FC media, cadencia, TSS
- RPE: Rating of Perceived Exertion (input subjetivo 1-10)
- ai_analysis: análisis generado por Claude (JSONB)
- raw_file_url: archivo .fit/.gpx original (Supabase Storage)

**weekly_plans**

- plan_data: estructura JSONB con 7 días (tipo, intensidad, duración, tips)
- ai_rationale: explicación del plan generado

**activity_metrics**

- Series temporales: potencia, FC, cadencia, velocidad por segundo

### Endpoints API Principales

```
/api/v1/
├── /auth              Gestionado por Supabase
├── /activities        CRUD de actividades
├── /activities/:id    Detalle + métricas + análisis IA
├── /plan              Plan semanal (GET, POST para regenerar)
├── /insights          Comparativas y tendencias
├── /profile           Perfil del usuario
└── /ai
    ├── /ai/analyze-activity   Análisis post-sesión
    ├── /ai/weekly-plan        Generación de plan semanal
    └── /ai/weekly-summary     Resumen comparativo
```

### Flujo de Recomendaciones IA

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

**Principios del entrenador IA:**

- Cercano pero profesional
- Basado en datos, nunca inventado
- Motivador sin ser condescendiente
- Siempre explica el porqué
- La IA recomienda, nunca decide sola

---

## 🚀 Instalación

### Requisitos Previos

- Node.js 18+ (recomendado: 20 LTS)
- pnpm 9+
- Git

### Setup Inicial

```bash
# 1. Clonar el repositorio
git clone https://github.com/username/cycling-companion.git
cd cycling-companion

# 2. Instalar dependencias
pnpm install

# 3. Configurar variables de entorno
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env

# 4. Editar .env con tus credenciales:
#    - SUPABASE_URL y SUPABASE_ANON_KEY
#    - ANTHROPIC_API_KEY (para Claude)
#    - Otras credenciales según sea necesario
```

### Configurar Base de Datos

```bash
# Generar tipos de Supabase
pnpm db:types

# Ejecutar migraciones (desde Supabase Dashboard o CLI)
supabase db push

# Seed de datos mock (opcional, para desarrollo)
pnpm db:seed
```

---

## 💻 Desarrollo

### Ejecutar el Proyecto Completo

```bash
# Ejecutar frontend + backend + monitoreo
pnpm dev
```

El proyecto estará disponible en:

- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001
- **Swagger API Docs**: http://localhost:3001/api/v1/docs

### Comandos Útiles

```bash
# Ejecutar solo frontend
pnpm --filter web dev

# Ejecutar solo backend
pnpm --filter api dev

# Build completo
pnpm build

# Lint (ESLint + Prettier)
pnpm lint

# Type-checking
pnpm typecheck

# Tests
pnpm test

# Tests con coverage
pnpm test:coverage
```

### Desarrollo con Datos Mock

Durante las fases iniciales, usa datos mock en `/data/mock/`:

- `activities.json`: 20-30 actividades de ejemplo
- `user-profile.json`: perfil de usuario ejemplo

Carga estos datos con:

```bash
pnpm db:seed
```

---

## 📁 Estructura del Proyecto

```
cycling-companion/
├── apps/
│   ├── web/                          # Next.js Frontend
│   │   ├── src/
│   │   │   ├── app/                  # App Router
│   │   │   ├── components/           # Componentes React
│   │   │   ├── lib/                  # Utilidades
│   │   │   └── styles/               # Tailwind config
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── api/                          # Fastify Backend
│       ├── src/
│       │   ├── routes/               # Rutas API
│       │   ├── services/             # Lógica de negocio
│       │   ├── middleware/           # Middleware Fastify
│       │   └── utils/                # Utilidades
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   └── shared/                       # Tipos y validaciones compartidas
│       ├── src/
│       │   ├── types/                # Tipos TypeScript
│       │   ├── validation/           # Esquemas Zod
│       │   └── constants/            # Constantes
│       └── package.json
│
├── prompts/                          # Prompts versionados para IA
│   ├── system/                       # Prompts del sistema
│   ├── remote/                       # Prompts para agentes remotos
│   └── product/                      # Prompts de producto
│
├── docs/                             # Documentación
│   ├── 01-PRODUCT-VISION.md
│   ├── 02-PRD.md
│   ├── 03-AGENTS-AND-DEVELOPMENT-PLAN.md
│   └── architecture/
│
├── data/
│   └── mock/                         # Datos mock para desarrollo
│       ├── activities.json
│       └── user-profile.json
│
├── pnpm-workspace.yaml               # Configuración del workspace
├── turbo.json                        # Configuración de Turborepo
├── tsconfig.json                     # TypeScript base
├── CLAUDE.md                         # Instrucciones para Claude Code
└── README.md                         # Este archivo
```

---

## 📚 Documentación

Documentación completa disponible en `/docs/`:

- **[01-PRODUCT-VISION.md](docs/01-PRODUCT-VISION.md)** - Visión del producto y propuesta de valor
- **[02-PRD.md](docs/02-PRD.md)** - Product Requirements Document completo
- **[03-AGENTS-AND-DEVELOPMENT-PLAN.md](docs/03-AGENTS-AND-DEVELOPMENT-PLAN.md)** - Plan de agentes y desarrollo con timeline

### Prompts IA

Los prompts para Claude API están versionados en `/prompts/`:

```
prompts/
├── system/          Prompts del sistema (contexto base)
├── remote/          Prompts para agentes remotos (GitHub Actions)
└── product/         Prompts de producto (análisis, planes, insights)
```

---

## ⚙️ Pipeline AI-First

Este proyecto implementa un pipeline multi-agente documentado en `docs/03-AGENTS-AND-DEVELOPMENT-PLAN.md`.

### Agentes Locales (Claude Code)

| Agente                 | Rol                                 | Trigger |
| ---------------------- | ----------------------------------- | ------- |
| **L1: UX Interpreter** | Capturas → especificación funcional | Manual  |
| **L2: Architect**      | Especificación → diseño técnico     | Manual  |
| **L3: Planner**        | Diseño → issues incrementales       | Manual  |
| **L4: Implementer**    | Implementar código con supervisión  | Manual  |

### Agentes Remotos (GitHub Actions)

| Agente                 | Rol                             | Trigger                |
| ---------------------- | ------------------------------- | ---------------------- |
| **R1: Issue Analyzer** | Analizar impact y complejidad   | Label `ai-analyze`     |
| **R2: PR Generator**   | Generar PR completa desde issue | Label `ai-generate-pr` |
| **R3: PR Reviewer**    | Code review automático          | PR abierta             |
| **R4: CI/CD**          | Lint, test, build               | Push/PR                |
| **R5: Doc Generator**  | Actualizar CHANGELOG, README    | PR mergeada            |

---

## 🔒 Seguridad y Privacidad

- **RLS (Row Level Security)**: Cada usuario solo ve sus propios datos
- **Autenticación**: JWT gestionado por Supabase, cookies httpOnly
- **Validación**: Todos los inputs validados con Zod
- **Secrets**: Variables de entorno, nunca commitear API keys
- **HTTPS**: Obligatorio en producción

---

## 🎯 Limitaciones MVP

- **Cold starts en Render**: Tier gratuito ~30s después de 15min inactividad
- **Sin integración directa con Strava/Garmin**: Solo importación manual
- **Sin app móvil nativa**: PWA básica con `next-pwa`
- **Solo español**: Multi-idioma fuera de scope
- **Costes Claude API**: Implementar caché, limitar llamadas/usuario/día

### Fuera del Alcance del MVP

- Integración con APIs de Strava/Garmin Connect
- Rol de entrenador humano multi-atleta
- Mapas y trazado de rutas
- Funcionalidad social (compartir, competir)
- Notificaciones push
- Gamificación
- Integración con wearables (sueño, recuperación)

---

## 📅 Fases de Desarrollo

**Fase 1 (Actual)**: Cimientos

1. Setup monorepo + CI + Auth + Deploy
2. Dashboard con datos mock
3. Lista y detalle de actividades

**Fase 2**: Core Features 4. Planificación semanal + comparativas 5. Agentes remotos completos

**Fase 3**: Refinamiento 6. Features secundarias 7. Evaluación y documentación

---

## 🤝 Contribución

Las contribuciones siguen el pipeline AI-first documentado en `docs/03-AGENTS-AND-DEVELOPMENT-PLAN.md`.

### Convenciones

- **Commits**: Español con formato `feat:`, `fix:`, `refactor:`, `docs:`
- **PRs**: Pequeñas y enfocadas, enlazar con issues
- **TypeScript**: Modo estricto, types en `packages/shared`
- **Tests**: Unitarios para lógica compleja, integración para endpoints críticos

---

## 📞 Soporte

Para reportar bugs o sugerencias, abre un issue en GitHub con el template correspondiente.

---

## 📄 Licencia

Cycling Companion © 2025. Todos los derechos reservados.

---

## 🔗 Enlaces Útiles

- [Supabase](https://supabase.com)
- [Next.js 16](https://nextjs.org)
- [Fastify](https://fastify.dev)
- [Turborepo](https://turbo.build)
- [Claude API](https://claude.ai/api)
- [Tailwind CSS](https://tailwindcss.com)

---

**Desarrollado con un pipeline AI-first de integración de IA en el ciclo de vida del desarrollo.**
