# Cycling Companion — Guion de Diapositivas

Presentación del proyecto **Cycling Companion**: MVP de una plataforma de entrenamiento para ciclistas construida con un **pipeline AI-first**.

---

## Diapositiva 1 — Portada

**Cycling Companion**
*MVP de entrenamiento ciclista impulsado por IA*

- Plataforma web de análisis y planificación para ciclistas amateur (40+)
- Banco de pruebas de un **pipeline AI-first** de desarrollo de software
- Autor: Luis Miguel Martín — 2026

---

## Diapositiva 2 — El Problema

**Los ciclistas tienen datos, pero no respuestas**

- Strava y Garmin Connect generan métricas en exceso sin interpretación
- No existe planificación semanal inteligente adaptada al estado de forma actual
- Comparar periodos de entrenamiento requiere análisis manual complejo
- Las plataformas avanzadas (TrainingPeaks) están diseñadas para profesionales, no para amateurs

---

## Diapositiva 3 — La Propuesta de Valor

> *"Tu entrenador IA personal que entiende tus datos, respeta tu cuerpo y te dice exactamente qué hacer esta semana."*

- Análisis post-sesión automático con IA
- Plan semanal generado y ajustado según perfil, objetivo y carga
- Recomendaciones accionables: entrenamiento + nutrición + descanso
- Diseñado para ciclistas amateur 40-55 años

---

## Diapositiva 4 — Doble Objetivo del Proyecto

| El producto visible | El objetivo real |
|---------------------|------------------|
| Plataforma de entrenamiento ciclista con IA | Validar un **pipeline AI-first** de desarrollo |

- La app de ciclismo es el **MVP funcional** que demuestra el valor
- El pipeline de desarrollo con agentes IA es la **innovación metodológica**
- Ambos objetivos se retroalimentan: la app real valida que el pipeline funciona

---

## Diapositiva 5 — Qué es un MVP y por qué este enfoque

**MVP = Producto Mínimo Viable**

- Solo las funcionalidades esenciales para validar la propuesta de valor
- Sin integración directa con Strava/Garmin (solo importación manual .fit/.gpx)
- Solo en español (multi-idioma fuera de scope)
- Sin mapas, sin funcionalidad social, sin app nativa
- Deploy en tier gratuito (Vercel + Render + Supabase)

**Resultado**: una app completa y funcional con el mínimo esfuerzo necesario para demostrar que el concepto funciona

---

## Diapositiva 6 — Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui, Recharts |
| **Backend** | Fastify 5, TypeScript, Zod (validación) |
| **Base de datos** | Supabase (PostgreSQL + Auth + RLS) |
| **IA del producto** | Claude API (Anthropic) — análisis, planes, recomendaciones |
| **Monorepo** | Turborepo + pnpm |
| **Testing** | Vitest + React Testing Library |
| **Deploy** | Vercel (frontend) + Render (API) + Supabase (DB) |

---

## Diapositiva 7 — Arquitectura del Monorepo

```
cycling-companion/
├── apps/
│   ├── web/          → Next.js 16 (9 pantallas, 32 componentes)
│   └── api/          → Fastify 5 (15+ endpoints, 4 endpoints IA)
├── packages/
│   └── shared/       → Types Zod compartidos frontend ↔ backend
├── supabase/
│   └── migrations/   → 4 migraciones SQL incrementales
└── docs/
    └── specs/        → 27+ especificaciones L1/L2/L3
```

- TypeScript estricto end-to-end (no `any`)
- Schemas Zod definidos una vez, reutilizados en API y frontend
- RLS (Row Level Security) activo: cada usuario solo ve sus datos

---

## Diapositiva 8 — Funcionalidades del MVP

**9 pantallas implementadas:**

1. **Login** — Google OAuth (sin contraseña)
2. **Onboarding** — Wizard 4 pasos: perfil → FTP → FC → objetivo
3. **Dashboard** — KPIs, gráficas de tendencia, consejo IA del día, alerta sobrecarga
4. **Lista de actividades** — Tabla paginada con filtros y búsqueda
5. **Detalle de actividad** — Métricas, gráficas temporales, análisis IA
6. **Importar actividad** — Manual o .fit/.gpx con parseo Garmin
7. **Plan semanal** — Grid 7 días con sugerencias IA + tips nutrición/descanso
8. **Insights** — Comparativa entre periodos + radar rendimiento + resumen IA
9. **Perfil** — Datos, zonas potencia/FC, ajustes tema/unidades

---

## Diapositiva 9 — El Entrenador IA (capa transversal)

**No es una pantalla, es una capa inteligente que opera en toda la app:**

| Dónde | Qué hace |
|-------|----------|
| Dashboard | Recomendación del día (2-3 frases) |
| Detalle actividad | Análisis post-sesión automático |
| Plan semanal | Generación y ajuste del plan de 7 días |
| Insights | Explicación de tendencias y cambios |

**Implementación técnica:**
```
Rate limit → Cache check → Contexto (perfil + actividades + CTL/ATL/TSB)
    → Reglas heurísticas → Prompt versionado → Claude API
    → Validación Zod → Fallback heurístico si falla → Persistir en cache
```

- Caché en DB para reducir costes
- Rate limit: 20 llamadas/usuario/día
- Fallback heurístico si la IA no responde

---

## Diapositiva 10 — El Pipeline AI-First (Concepto)

**La verdadera innovación: cómo se construyó la app**

> El desarrollo sigue un pipeline multi-agente donde la IA participa en cada fase del ciclo de vida del software.

```
Diseño → Especificación → Planificación → Implementación → Review → Documentación
  IA         IA               IA              IA             IA         IA
```

**Dos niveles de agentes:**
- **Agentes locales** (Claude Code): pensamiento, diseño, implementación supervisada
- **Agentes remotos** (GitHub Actions): ejecución autónoma en el repositorio

---

## Diapositiva 11 — Agentes Locales (Claude Code)

**4 agentes de desarrollo supervisado (ejecución manual):**

| Agente | Rol | Input → Output |
|--------|-----|-----------------|
| **L1: UX Interpreter** | Interpretar mockups | Mockup JSX → Spec funcional (L1) |
| **L2: Architect** | Diseñar solución técnica | Spec L1 → Diseño técnico (L2) |
| **L3: Planner** | Planificar implementación | Spec L2 → Issues incrementales (L3) |
| **L4: Implementer** | Escribir código y tests | Issue → Código + tests + PR |

**Metodología híbrida:**
- Pipeline completo (L1→L2→L3→L4) para features complejas
- Implementación directa (L4) para CRUD predecible
- 27+ especificaciones generadas (L1/L2/L3)

---

## Diapositiva 12 — Agentes Remotos (GitHub Actions)

**6 agentes autónomos activados por eventos en GitHub:**

| Agente | Trigger | Modelo | Coste |
|--------|---------|--------|-------|
| **R1: Issue Analyzer** | Label `ai-analyze` | Haiku 4.5 | ~$0.04 |
| **R2: PR Generator** | Label `ai-generate-pr` | Sonnet 4.5 | ~$0.30 |
| **R3: PR Reviewer** | PR abierta | Haiku 4.5 | ~$0.01 |
| **R4: CI/CD** | Push/PR | — | — |
| **R5: Doc Generator** | PR mergeada | Haiku 4.5 | ~$0.03 |
| **@claude** | Mención en issues/PRs | Sonnet 4 | variable |

- 16 labels para orquestar el pipeline
- `claude-code-action@v1` como runtime
- Modelos ajustados por tarea: Haiku (barato) para análisis, Sonnet (potente) para generación

---

## Diapositiva 13 — Pipeline End-to-End en Acción

**Caso real validado: Issue #17 → PR #18**

```
1. Se crea un Issue con descripción del cambio
       ↓
2. R1 (Issue Analyzer) analiza impacto, complejidad, riesgos    [$0.04]
       ↓
3. Se añade label `ai-generate-pr`
       ↓
4. R2 (PR Generator) genera código, tests, documentación        [$0.30]
       ↓
5. R3 (PR Reviewer) revisa calidad, seguridad, tests            [$0.01]
       ↓
6. R4 (CI/CD) ejecuta lint + typecheck + tests + build
       ↓
7. Humano revisa y mergea
       ↓
8. R5 (Doc Generator) actualiza CHANGELOG automáticamente       [$0.03]
```

**Total: 28 turns de IA, ~$0.38 por feature completa**

---

## Diapositiva 14 — Coste del Pipeline

**Coste por feature con el pipeline AI-first:**

| Etapa | Agente | Coste |
|-------|--------|-------|
| Análisis del issue | R1 (Haiku 4.5) | $0.04 |
| Generación de PR | R2 (Sonnet 4.5) | $0.30 |
| Code review automático | R3 (Haiku 4.5) | $0.01 |
| Documentación (CHANGELOG) | R5 (Haiku 4.5) | $0.03 |
| **Total por feature** | | **~$0.38** |

**Coste de infraestructura del MVP:**
- Vercel (frontend): $0 (tier gratuito)
- Render (API): $0 (tier gratuito, cold starts ~30s)
- Supabase (DB): $0 (tier gratuito: 500MB DB, 1GB storage)
- GitHub Actions: 2000 min/mes gratis

---

## Diapositiva 15 — Métricas del MVP

**Lo que se ha construido:**

| Métrica | Valor |
|---------|-------|
| Pantallas frontend | 9 |
| Componentes reutilizables | 32 |
| Endpoints API | 15+ |
| Endpoints IA | 4 (análisis, plan, resumen, coach tip) |
| Tests totales | ~290 (72 web + 82 shared + 136 API) |
| Migraciones SQL | 4 |
| Schemas Zod compartidos | 5 |
| Especificaciones (L1/L2/L3) | 27+ |
| Agentes remotos activos | 5 |
| Labels del pipeline | 16 |
| Fases completadas | 4 de 4 |

---

## Diapositiva 16 — Fases de Desarrollo

| Fase | Foco | Entregables clave |
|------|------|-------------------|
| **Fase 1** | Cimientos | Monorepo, CI/CD, Auth (Google OAuth), deploy, schema DB, onboarding |
| **Fase 2** | MVP Frontend | 9 pantallas, 32 componentes, design system, specs L1/L2/L3 |
| **Fase 3** | Core Backend | 15+ endpoints API, 4 endpoints IA (Claude), import .fit/.gpx, migración frontend→API |
| **Fase 4** | Pipeline AI | 5 agentes remotos, 16 labels, CHANGELOG auto, validación end-to-end |

**Cada fase construye sobre la anterior** — enfoque incremental propio de un MVP

---

## Diapositiva 17 — IA que revisa IA

**Un aspecto destacable del pipeline: la IA se auto-supervisa**

- R2 (Sonnet 4.5) **genera** el código de la PR
- R3 (Haiku 4.5) **revisa** la PR generada por R2
- R4 (CI/CD) **valida** que el código pasa lint, types y tests
- El humano tiene la **última palabra** antes del merge

```
IA genera → IA revisa → CI valida → Humano decide
```

Esto crea un sistema de checks & balances donde:
- La IA no opera sin supervisión
- Los errores se detectan en múltiples capas
- El coste se mantiene bajo (~$0.38/feature)

---

## Diapositiva 18 — Decisiones Técnicas Clave del MVP

1. **Monorepo (Turborepo + pnpm)** — Un repositorio, types compartidos, builds paralelos
2. **TypeScript estricto** — Sin `any`, mejor DX para agentes IA y humanos
3. **Zod schemas compartidos** — Definir una vez, validar en API y frontend
4. **RLS en Supabase** — Seguridad a nivel de base de datos, nunca desactivado
5. **Mezcla de modelos Claude** — Haiku (barato) para análisis, Sonnet (potente) para generación
6. **Tier gratuito para todo** — MVP sin coste de infraestructura
7. **Caché + rate limit de IA** — Control de costes de Claude API en producción
8. **Server Components por defecto** — Client Components solo donde hay interactividad

---

## Diapositiva 19 — Limitaciones Aceptadas (Scope del MVP)

**Incluido en el MVP:**
- Importación manual de .fit/.gpx
- 4 funciones IA (análisis, plan, resumen, coach)
- Solo español
- Deploy en tiers gratuitos

**Fuera del MVP (decisiones conscientes):**
- Integración directa con Strava/Garmin Connect API
- Mapas y trazado de rutas
- Funcionalidad social (compartir, competir)
- App móvil nativa / wearables
- Multi-idioma
- Notificaciones push, gamificación
- Rol entrenador humano multi-atleta

---

## Diapositiva 20 — Aprendizajes del Pipeline AI-First

**Lo que funciona bien:**
- IA excelente para generar código a partir de specs bien definidas
- Code review automático detecta problemas reales
- Documentación automática (CHANGELOG) ahorra tiempo
- El coste es despreciable (~$0.38/feature)
- La metodología L1→L2→L3→L4 produce specs de alta calidad

**Lo que requiere atención:**
- La supervisión humana sigue siendo indispensable
- La calidad del output depende de la calidad del prompt/spec
- Gotchas técnicos (ESM, Fastify multipart, GPX extensions) requieren conocimiento humano
- El pipeline completo (L1→L4) es para features complejas; para CRUD simple, implementación directa

---

## Diapositiva 21 — Conclusiones

1. **El MVP demuestra que el concepto funciona**: un entrenador IA personal para ciclistas es viable con las herramientas actuales

2. **El pipeline AI-first es operativo**: desde la creación de un issue hasta el CHANGELOG automático, la IA participa en cada fase

3. **El coste es marginal**: ~$0.38 por feature completa, infraestructura en tier gratuito

4. **La calidad se mantiene**: 290 tests, TypeScript estricto, RLS, code review automático + humano

5. **Es escalable**: el patrón multi-agente probado a pequeña escala es adaptable a equipos y proyectos mayores

---

## Diapositiva 22 — Cierre

**Cycling Companion**

- El producto: una plataforma funcional de entrenamiento ciclista con IA
- La innovación: un pipeline AI-first validado end-to-end
- El resultado: MVP completo en 4 fases, ~$0.38/feature, 290 tests, 0 coste de infraestructura

> *"Desarrollado con un pipeline AI-first de integración de IA en el ciclo de vida del desarrollo."*

**Contacto:** Luis Miguel Martín
**Repositorio:** github.com/luismiguelmartin/cycling-companion

---

## Notas para el Presentador

### Estructura sugerida de la presentación:
- **Bloque 1** (Diap. 1-5): Contexto y problema — 5 min
- **Bloque 2** (Diap. 6-9): El producto MVP — 7 min
- **Bloque 3** (Diap. 10-14): El pipeline AI-first — 10 min
- **Bloque 4** (Diap. 15-19): Métricas y decisiones — 5 min
- **Bloque 5** (Diap. 20-22): Aprendizajes y cierre — 3 min

### Puntos clave a enfatizar:
- La app de ciclismo es real y funcional, no un demo
- El pipeline AI-first es el diferenciador: la IA no solo está en el producto, sino en cómo se construyó
- El coste de $0.38/feature es un dato impactante para la audiencia
- La IA revisa a la IA (R2 genera, R3 revisa) — checks & balances
- MVP = decisiones conscientes de qué NO incluir, tan importantes como las de qué incluir
