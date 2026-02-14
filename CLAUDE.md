# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Contexto del Proyecto

**Cycling Companion** es una plataforma web de análisis y planificación de entrenamiento para ciclistas amateur (40+). El producto actúa como banco de pruebas para un TFM sobre integración de IA en el ciclo de vida del desarrollo (pipeline AI-first).

**Propuesta de valor**: Entrenador IA personal que traduce datos de ciclismo en recomendaciones accionables de entrenamiento, nutrición y descanso.

---

## Stack Tecnológico

### Monorepo con Turborepo
```
cycling-companion/
├── apps/
│   ├── web/          → Next.js 14+ (App Router, TypeScript, Tailwind CSS, shadcn/ui)
│   └── api/          → Fastify (TypeScript, Zod validation, Swagger docs)
├── packages/
│   └── shared/       → Types compartidos, validaciones Zod, constantes
├── prompts/          → Prompts versionados para IA (system/, remote/, product/)
├── docs/             → Visión del producto, PRD, plan de agentes
└── data/mock/        → Datos mock para desarrollo inicial
```

### Componentes clave
- **Frontend**: Next.js 14+ con App Router, TypeScript, Tailwind CSS, Recharts, shadcn/ui
- **Backend**: Fastify con TypeScript, validación Zod, documentación Swagger
- **Base de datos**: Supabase (PostgreSQL + Auth + Storage + RLS)
- **Autenticación**: Supabase Auth con Google OAuth
- **IA**: Claude API (Anthropic) para recomendaciones del entrenador virtual
- **Deploy**: Vercel (frontend), Render (API), Supabase (DB)
- **CI/CD**: GitHub Actions

---

## Comandos Esenciales

### Setup inicial
```bash
# Instalar dependencias (desde raíz del monorepo)
npm install

# Configurar variables de entorno
# Copiar .env.example a .env en apps/web y apps/api
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env
```

### Desarrollo
```bash
# Ejecutar todo el monorepo (web + api)
npm run dev

# Ejecutar solo el frontend
npm run dev --filter=web

# Ejecutar solo el backend
npm run dev --filter=api

# Ejecutar con Turborepo en paralelo
npx turbo run dev
```

### Build y validación
```bash
# Build de todo el proyecto
npm run build

# Lint
npm run lint

# Type-check
npm run typecheck

# Tests
npm run test

# Tests con coverage
npm run test:coverage
```

### Base de datos
```bash
# Generar tipos de Supabase
npm run db:types

# Ejecutar migraciones (desde Supabase Dashboard o CLI)
supabase db push

# Seed de datos mock (script custom)
npm run db:seed
```

---

## Arquitectura del Producto

### Modelo de datos principal

**users**
- Datos básicos: edad, peso, FTP, FC máxima/reposo
- Objetivo: performance | health | weight_loss | recovery
- Zonas de potencia y FC calculadas

**activities**
- Métricas: duración, distancia, potencia media, FC media, cadencia, TSS
- RPE (Rating of Perceived Exertion): input subjetivo del usuario (1-10)
- ai_analysis: análisis post-sesión generado por Claude (JSONB)
- raw_file_url: archivo .fit/.gpx original (Supabase Storage)

**weekly_plans**
- plan_data: estructura JSONB con 7 días (tipo, intensidad, duración, tips)
- ai_rationale: explicación de la IA sobre el plan generado

**activity_metrics**
- Series temporales: potencia, FC, cadencia, velocidad por segundo

### API endpoints principales
```
/api/v1/
├── /auth              → Gestionado por Supabase (no custom endpoints)
├── /activities        → CRUD de actividades
├── /activities/:id    → Detalle + métricas + análisis IA
├── /plan              → Plan semanal (GET, POST para regenerar)
├── /insights          → Comparativas y tendencias
├── /profile           → Perfil del usuario
└── /ai                → Recomendaciones IA
    ├── /ai/analyze-activity   → Análisis post-sesión
    ├── /ai/weekly-plan        → Generación de plan semanal
    └── /ai/weekly-summary     → Resumen comparativo
```

### Flujo de recomendaciones IA

1. Recopilar contexto (perfil + últimas N actividades + plan actual)
2. Aplicar reglas/heurísticas (TSS semanal, tendencias, objetivo del usuario)
3. Construir prompt estructurado con contexto
4. Llamar a Claude API
5. Parsear respuesta (JSON estructurado)
6. Presentar al usuario con explicación clara

**Principios del entrenador IA:**
- Cercano pero profesional
- Basado en datos, nunca inventado
- Motivador sin ser condescendiente
- Siempre explica el porqué
- La IA recomienda, nunca decide sola

---

## Pipeline AI-First: Agentes y Flujos

Este proyecto se desarrolla usando un pipeline multi-agente documentado en `docs/03-AGENTS-AND-DEVELOPMENT-PLAN.md`.

### Agentes locales (Claude Code)

| Agente | Rol | Trigger |
|--------|-----|---------|
| **L1: UX Interpreter** | Interpretar capturas de pantalla → especificación funcional | Manual |
| **L2: Architect** | Especificación funcional → diseño técnico (componentes, API, DB) | Manual |
| **L3: Planner** | Diseño técnico → issues incrementales en GitHub | Manual |
| **L4: Implementer** | Implementar código con supervisión humana (plan mode) | Manual |

### Agentes remotos (GitHub Actions)

| Agente | Rol | Trigger |
|--------|-----|---------|
| **R1: Issue Analyzer** | Analizar impact y complejidad de issues | Label `ai-analyze` |
| **R2: PR Generator** | Generar PR completa desde issue | Label `ai-generate-pr` |
| **R3: PR Reviewer** | Code review automático | PR abierta |
| **R4: CI/CD** | Lint, typecheck, test, build | Push/PR |
| **R5: Doc Generator** | Actualizar CHANGELOG, README | PR mergeada a main |

### Labels del sistema
```
ai-analyze, ai-generate-pr, ai-generated, ai-reviewed
priority:p0, priority:p1, priority:p2
type:feature, type:bug, type:refactor, type:docs
phase:1, phase:2, phase:3
```

---

## Convenciones de Desarrollo

### TypeScript
- Usar TypeScript estricto (no `any`, activar `strict: true`)
- Compartir types entre frontend y backend vía `packages/shared`
- Definir validaciones Zod una vez, reutilizar en API y frontend

### Componentes React (Next.js)
- Usar App Router (no Pages Router)
- Server Components por defecto, Client Components solo cuando sea necesario
- Nomenclatura: PascalCase para componentes, kebab-case para archivos
- Co-locate componentes con sus tests: `Button.tsx`, `Button.test.tsx`

### API (Fastify)
- Cada route con schema Zod para validación automática
- Documentación Swagger generada automáticamente
- Manejo de errores consistente con códigos HTTP apropiados
- RLS en Supabase: nunca desactivar, confiar en políticas de base de datos

### Estilos
- Tailwind CSS: usar utility classes, evitar CSS custom
- shadcn/ui: componentes base, personalizar con Tailwind
- Responsive: mobile-first, pero diseñado principalmente para desktop

### Git y PRs
- Commits descriptivos en español (formato: `feat:`, `fix:`, `refactor:`, `docs:`)
- Una PR por issue, enlazar con `Closes #N`
- PRs pequeñas y enfocadas (< 400 líneas si es posible)
- Self-review antes de pedir review

### Tests
- Tests unitarios para lógica compleja (utils, hooks, reglas de entrenamiento)
- Tests de integración para endpoints API críticos
- E2E tests solo para flujos principales (login, importar actividad, ver plan)

---

## Seguridad y Privacidad

- **RLS (Row Level Security) activo**: cada usuario solo ve sus propios datos
- **Autenticación**: JWT gestionado por Supabase, cookies httpOnly
- **Sanitización**: validar y sanitizar todos los inputs (Zod en API)
- **Secrets**: nunca commitear API keys, usar variables de entorno
- **HTTPS**: obligatorio en producción (Vercel y Render lo aplican por defecto)

---

## Desarrollo con Datos Mock

Durante las fases iniciales, usar datos mock en `/data/mock/`:
- `activities.json`: 20-30 actividades de ejemplo con progresión realista
- `user-profile.json`: perfil de usuario ejemplo (45 años, FTP 195W)

**Transición a datos reales:**
1. Implementar upload de archivos .fit/.gpx
2. Parsear con `fit-file-parser` o `gpxparser`
3. Almacenar en Supabase Storage
4. Misma estructura de datos que mock

---

## Limitaciones Conocidas (MVP)

- **Cold starts en Render** (tier gratuito): primera request ~30s después de 15min de inactividad
- **Sin integración directa con Strava/Garmin** en MVP: solo importación manual
- **Sin app móvil nativa**: PWA básica con `next-pwa`
- **Solo español**: multi-idioma fuera de scope del MVP
- **Costes de Claude API**: implementar caché de recomendaciones, limitar llamadas por usuario/día

---

## Fuera del Alcance del MVP

- Integración con APIs de Strava/Garmin Connect
- Rol de entrenador humano con vista multi-atleta
- Mapas y trazado de rutas
- Funcionalidad social (compartir logros, competir)
- Notificaciones push
- Gamificación (rachas, badges)
- Integración con wearables para datos de sueño/recuperación

---

## Documentos de Referencia

- **Visión del producto**: `docs/01-PRODUCT-VISION.md`
- **PRD completo**: `docs/02-PRD.md`
- **Plan de agentes y desarrollo**: `docs/03-AGENTS-AND-DEVELOPMENT-PLAN.md`
- **Prompts de IA**: directorio `/prompts/` (versionados por tipo)

---

## Notas para Claude Code

### Al trabajar en nuevas features:
1. **Leer primero** el diseño técnico asociado en `/docs/architecture/` (si existe)
2. **Revisar** el PRD (`docs/02-PRD.md`) para entender el contexto funcional
3. **Consultar** prompts existentes en `/prompts/` si la feature involucra IA
4. **Mantener consistencia** con el tono y estructura del código existente
5. **No sobre-ingeniería**: implementar solo lo necesario para la issue actual

### Al generar análisis o recomendaciones IA:
- Usar los prompts versionados en `/prompts/product/`
- Construir contexto con datos reales del usuario (no inventar)
- Respuestas en JSON estructurado para fácil parsing
- Tono: cercano, profesional, motivador, basado en datos

### Al crear issues:
- Usar template estructurado: descripción, criterios de aceptación, archivos afectados
- Asignar labels apropiados: `priority:*`, `type:*`, `phase:*`
- Linkear a diseño técnico o PRD si corresponde
- Mantener issues pequeñas y enfocadas (1-3 horas de trabajo)

### Al abrir PRs:
- Seguir el template de PR en `.github/PULL_REQUEST_TEMPLATE.md`
- Incluir screenshots si hay cambios visuales
- Marcar con label `ai-generated` si fue generada por agente remoto
- Self-review: revisar diff completo antes de pedir review

---

## Prioridades del Proyecto

**Fase actual**: Fase 1 — Cimientos (setup inicial)

**Orden de implementación (según plan de 7 semanas):**
1. Setup monorepo + CI + Auth + Deploy
2. Dashboard con datos mock
3. Lista y detalle de actividades
4. Planificación semanal + comparativas
5. Agentes remotos completos (pipeline AI-first)
6. Features secundarias vía PRs automáticas
7. Evaluación y documentación del TFM

**Principio rector del desarrollo:**
> Local = pensar y decidir
> Remoto = ejecutar y verificar
> Humano = supervisar y validar
