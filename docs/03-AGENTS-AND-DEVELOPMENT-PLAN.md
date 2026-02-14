# Cycling Companion — Agentes, Pipeline AI-First y Plan de Desarrollo

## 1. Visión general de la arquitectura

### 1.1 Principio rector

```
Local  = pensar y decidir
Remoto = ejecutar y verificar
Humano = supervisar y validar
```

Los agentes locales (Cursor + Claude Code) se encargan de razonamiento, diseño y decisiones arquitectónicas. Los agentes remotos (GitHub Actions + Claude) ejecutan tareas repetitivas, generan PRs y hacen code review. El desarrollador siempre tiene la última palabra.

### 1.2 Diagrama de arquitectura

```
┌──────────────────────────────────────────────────┐
│                 DESARROLLADOR                     │
│              (Cursor + Claude Code)               │
└──────────────┬───────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────┐
│              AGENTES LOCALES                      │
│                                                   │
│  ┌─────────┐  ┌──────────┐  ┌──────────────┐    │
│  │  UX     │  │  Arqui-  │  │ Planificador │    │
│  │  Agent  │→ │  tecto   │→ │    Agent     │    │
│  └─────────┘  └──────────┘  └──────────────┘    │
│       ▲                                           │
│       │ Capturas de pantalla                      │
│       │ (Google Stitch / Claude)                  │
└──────────────┬───────────────────────────────────┘
               │ Push código / Issues
               ▼
┌──────────────────────────────────────────────────┐
│                 GITHUB                            │
│                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │  Issues  │  │   PRs    │  │    Docs      │   │
│  └──────────┘  └──────────┘  └──────────────┘   │
│                                                   │
└──────────────┬───────────────────────────────────┘
               │ Labels / Triggers
               ▼
┌──────────────────────────────────────────────────┐
│              AGENTES REMOTOS                      │
│           (GitHub Actions + Claude)               │
│                                                   │
│  ┌──────────────┐  ┌────────────────────────┐    │
│  │  PR Generator │  │  PR Reviewer (Claude)  │   │
│  └──────────────┘  └────────────────────────┘    │
│                                                   │
│  ┌──────────────┐  ┌────────────────────────┐    │
│  │  CI/CD       │  │  Doc Generator         │   │
│  │  (test+lint) │  │  (changelog, README)   │   │
│  └──────────────┘  └────────────────────────┘    │
│                                                   │
└──────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────┐
│              DESPLIEGUE                           │
│  Vercel (front) + Render (API) + Supabase (DB)   │
└──────────────────────────────────────────────────┘
```

### 1.3 Entrada de diseño

En lugar de Figma con MCP, el flujo de diseño utiliza **capturas de pantalla** generadas con Google Stitch o Claude como input visual. Los agentes locales interpretan estas capturas para extraer componentes, flujos y estructura.

```
Google Stitch / Claude → Capturas PNG/JPG
                            │
                            ▼
                   Agente UX Local (Claude Code)
                   → Interpreta las pantallas
                   → Extrae componentes y flujos
                   → Genera especificación funcional
```

---

## 2. Definición de agentes

### 2.1 Agentes locales (Cursor + Claude Code)

Estos agentes se invocan manualmente o mediante el modo plan de Claude Code. No son servicios autónomos, sino **patrones de uso** de Claude Code con prompts y contexto específicos.

---

#### Agent L1 — UX Interpreter

| Campo           | Valor                                                                                                                                           |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Nombre**      | `ux-interpreter`                                                                                                                                |
| **Rol**         | Interpretar capturas de pantalla de diseño y extraer especificación funcional                                                                   |
| **Entorno**     | Claude Code (local)                                                                                                                             |
| **Input**       | Capturas de pantalla (PNG/JPG) del diseño                                                                                                       |
| **Output**      | Documento de especificación funcional por pantalla (`/docs/screens/*.md`)                                                                       |
| **Prompt base** | "Analiza esta captura de pantalla de UI. Extrae: componentes visibles, jerarquía, estados posibles, flujos de interacción, datos que necesita." |

**Qué hace**:

- Identifica componentes UI en cada captura (cards, tablas, gráficos, formularios)
- Describe el flujo de interacción (qué pasa al hacer clic en cada elemento)
- Lista los datos necesarios para cada componente
- Detecta estados (vacío, cargando, error, con datos)
- Genera un markdown estructurado por pantalla

**Qué NO hace**:

- No genera código
- No toma decisiones de arquitectura
- No modifica el repositorio

---

#### Agent L2 — Architect

| Campo           | Valor                                                                                                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Nombre**      | `architect`                                                                                                                                                                                 |
| **Rol**         | Traducir especificación funcional en diseño técnico                                                                                                                                         |
| **Entorno**     | Claude Code (local)                                                                                                                                                                         |
| **Input**       | Especificaciones funcionales de L1 + PRD                                                                                                                                                    |
| **Output**      | Diseño técnico (`/docs/architecture/*.md`), ADRs, estructura de archivos                                                                                                                    |
| **Prompt base** | "Dado este requisito funcional y el stack del proyecto (Next.js + Fastify + Supabase), propone: componentes React necesarios, endpoints API, esquema de datos, archivos a crear/modificar." |

**Qué hace**:

- Define componentes React y su jerarquía
- Propone endpoints API necesarios
- Ajusta el modelo de datos si es necesario
- Genera ADRs (Architecture Decision Records) para decisiones relevantes
- Propone estructura de archivos

**Qué NO hace**:

- No escribe código de implementación
- No abre PRs

---

#### Agent L3 — Planner

| Campo           | Valor                                                                                                                                                                                     |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Nombre**      | `planner`                                                                                                                                                                                 |
| **Rol**         | Dividir el trabajo en issues incrementales y priorizadas                                                                                                                                  |
| **Entorno**     | Claude Code (local)                                                                                                                                                                       |
| **Input**       | Diseño técnico de L2                                                                                                                                                                      |
| **Output**      | Issues en GitHub con labels, descripción, criterios de aceptación                                                                                                                         |
| **Prompt base** | "Dado este diseño técnico, divide la implementación en issues incrementales. Cada issue debe ser: independiente, testeable, completable en 1-3 horas. Prioriza por dependencias y valor." |

**Qué hace**:

- Crea issues en GitHub con formato estructurado
- Asigna labels: `priority:p0`, `priority:p1`, `type:feature`, `type:bug`, etc.
- Define criterios de aceptación claros
- Establece dependencias entre issues
- Sugiere orden de implementación

**Qué NO hace**:

- No implementa las issues
- No asigna a personas (solo hay un desarrollador)

---

#### Agent L4 — Implementer (asistido)

| Campo       | Valor                                                         |
| ----------- | ------------------------------------------------------------- |
| **Nombre**  | `implementer`                                                 |
| **Rol**     | Asistir en la implementación de código con supervisión humana |
| **Entorno** | Cursor + Claude Code (local)                                  |
| **Input**   | Issue con diseño técnico                                      |
| **Output**  | Código, tests, commits                                        |
| **Modo**    | Claude Code Plan mode → Human review → Execute                |

**Qué hace**:

- Lee la issue y el diseño técnico asociado
- Propone plan de implementación (modo plan de Claude Code)
- Genera código con tests
- El desarrollador revisa, ajusta y aprueba antes de commit

**Qué NO hace**:

- No hace commit sin aprobación humana
- No modifica archivos fuera del scope de la issue

---

### 2.2 Agentes remotos (GitHub Actions + Claude)

Estos son GitHub Actions que se disparan automáticamente por eventos en el repositorio.

---

#### Agent R1 — Issue Analyzer

| Campo       | Valor                                       |
| ----------- | ------------------------------------------- |
| **Nombre**  | `issue-analyzer`                            |
| **Trigger** | Issue creada con label `ai-analyze`         |
| **Entorno** | GitHub Actions + Claude API                 |
| **Input**   | Contenido de la issue + contexto del repo   |
| **Output**  | Comentario en la issue con análisis técnico |

**Workflow** (`.github/workflows/ai-analyze-issue.yml`):

```yaml
name: AI Issue Analysis
on:
  issues:
    types: [labeled]

jobs:
  analyze:
    if: contains(github.event.label.name, 'ai-analyze')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Analyze with Claude
        # Lee la issue, contexto del repo, genera análisis
        # Publica comentario estructurado en la issue
```

**Qué analiza**:

- Impacto en el codebase (archivos afectados)
- Riesgos potenciales
- Tests necesarios
- Estimación de complejidad
- Dependencias con otras issues

---

#### Agent R2 — PR Generator

| Campo       | Valor                                 |
| ----------- | ------------------------------------- |
| **Nombre**  | `pr-generator`                        |
| **Trigger** | Issue con label `ai-generate-pr`      |
| **Entorno** | GitHub Actions + Claude Code (remoto) |
| **Input**   | Issue + análisis previo + codebase    |
| **Output**  | PR con código, tests y documentación  |

**Workflow** (`.github/workflows/ai-generate-pr.yml`):

```yaml
name: AI PR Generation
on:
  issues:
    types: [labeled]

jobs:
  generate:
    if: contains(github.event.label.name, 'ai-generate-pr')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Generate PR with Claude Code
        # Crea branch temporal
        # Genera código basado en la issue
        # Abre PR con descripción detallada
```

**Regla de oro**: La IA nunca mergea. Solo propone.

---

#### Agent R3 — PR Reviewer

| Campo       | Valor                             |
| ----------- | --------------------------------- |
| **Nombre**  | `pr-reviewer`                     |
| **Trigger** | PR abierta (automática o manual)  |
| **Entorno** | GitHub Actions + Claude API       |
| **Input**   | Diff de la PR + contexto del repo |
| **Output**  | Comentarios de review en la PR    |

**Workflow** (`.github/workflows/ai-review-pr.yml`):

```yaml
name: AI PR Review
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Review with Claude
        # Lee el diff
        # Analiza: estilo, complejidad, seguridad, tests, deuda
        # Publica comentarios como reviewer
```

**Qué revisa**:

- Calidad y legibilidad del código
- Complejidad ciclomática
- Tests faltantes o insuficientes
- Posibles problemas de seguridad
- Deuda técnica introducida
- Coherencia con el PRD y diseño técnico

---

#### Agent R4 — CI/CD Pipeline

| Campo       | Valor                                       |
| ----------- | ------------------------------------------- |
| **Nombre**  | `ci-cd`                                     |
| **Trigger** | Push a cualquier branch / PR                |
| **Entorno** | GitHub Actions                              |
| **Input**   | Código del repo                             |
| **Output**  | Resultado de lint, tests, type-check, build |

**Workflow** (`.github/workflows/ci.yml`):

```yaml
name: CI
on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run lint

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run typecheck

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test

  build:
    runs-on: ubuntu-latest
    needs: [lint, typecheck, test]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build
```

---

#### Agent R5 — Doc Generator

| Campo       | Valor                                           |
| ----------- | ----------------------------------------------- |
| **Nombre**  | `doc-generator`                                 |
| **Trigger** | PR mergeada a `main`                            |
| **Entorno** | GitHub Actions + Claude API                     |
| **Input**   | Cambios mergeados                               |
| **Output**  | Actualización de CHANGELOG.md, README si aplica |

---

## 3. Resumen de agentes

| ID  | Nombre         | Tipo   | Trigger                | Fase     |
| --- | -------------- | ------ | ---------------------- | -------- |
| L1  | UX Interpreter | Local  | Manual                 | Fase 1   |
| L2  | Architect      | Local  | Manual                 | Fase 1   |
| L3  | Planner        | Local  | Manual                 | Fase 1-2 |
| L4  | Implementer    | Local  | Manual                 | Fase 1   |
| R1  | Issue Analyzer | Remoto | Label `ai-analyze`     | Fase 2   |
| R2  | PR Generator   | Remoto | Label `ai-generate-pr` | Fase 3   |
| R3  | PR Reviewer    | Remoto | PR abierta             | Fase 2   |
| R4  | CI/CD          | Remoto | Push/PR                | Fase 1   |
| R5  | Doc Generator  | Remoto | PR mergeada            | Fase 3   |

---

## 4. Plan de desarrollo incremental

El desarrollo se organiza en **4 fases** distribuidas en **7 semanas**, diseñado para ganar confianza y experiencia de forma progresiva.

### Filosofía incremental

```
Fase 1: Cimientos (humano + agentes locales básicos)
Fase 2: MVP funcional (agentes locales maduros + CI remoto)
Fase 3: Pipeline AI-first (agentes remotos completos)
Fase 4: Pulido y evaluación (métricas + documentación TFM)
```

---

### FASE 1 — Cimientos (Semanas 1-2)

**Objetivo**: Tener el proyecto funcionando con las bases sólidas. Aquí el desarrollador lleva el control casi total, con asistencia local básica.

#### Semana 1: Setup y estructura

| Día | Tarea                                                     | Agente      |
| --- | --------------------------------------------------------- | ----------- |
| 1   | Crear monorepo con Turborepo (Next.js + Fastify + shared) | Manual + L4 |
| 1   | Configurar TypeScript, ESLint, Prettier                   | Manual      |
| 2   | Setup Supabase: proyecto, tablas base, RLS                | Manual      |
| 2   | Configurar Supabase Auth con Google                       | Manual      |
| 3   | Implementar login/logout + protección de rutas            | L4          |
| 3   | Setup GitHub repo + branch protection + PR template       | Manual      |
| 4   | Configurar CI básico (R4): lint + typecheck + test        | Manual      |
| 4   | Primer deploy: Vercel (front) + Render (API)              | Manual      |
| 5   | Onboarding flow (3-4 pasos)                               | L4          |

**Entregables semana 1**:

- Monorepo funcional con CI
- Auth con Google funcionando
- Deploy automático en cada push a main
- Onboarding básico

#### Semana 2: Datos y primeras pantallas

| Día | Tarea                                                     | Agente          |
| --- | --------------------------------------------------------- | --------------- |
| 1   | Interpretar capturas de diseño del dashboard              | L1 (primer uso) |
| 1   | Generar especificación funcional del dashboard            | L1              |
| 2   | Diseño técnico: componentes + API del dashboard           | L2 (primer uso) |
| 2   | Crear issues para el dashboard                            | L3 (primer uso) |
| 3   | Implementar endpoint API: GET /activities (con mock data) | L4              |
| 3   | Implementar endpoint API: GET /profile                    | L4              |
| 4   | Implementar dashboard: KPI cards + gráfica de tendencia   | L4              |
| 5   | Cargar datos mock en Supabase (seed script)               | L4              |
| 5   | Dashboard funcional con datos mock                        | L4              |

**Entregables semana 2**:

- Dashboard con datos mock visibles
- Agentes L1, L2, L3 usados por primera vez
- Primeras issues creadas por L3

**Retrospectiva**: Documentar qué funcionó de los agentes locales, qué ajustar.

---

### FASE 2 — MVP Funcional (Semanas 3-4)

**Objetivo**: Completar las pantallas principales del MVP. Incorporar agente de review remoto.

#### Semana 3: Actividades y detalle

| Día | Tarea                                                  | Agente          |
| --- | ------------------------------------------------------ | --------------- |
| 1   | Interpretar capturas: lista de actividades + detalle   | L1              |
| 1   | Diseño técnico                                         | L2              |
| 2   | Crear issues incrementales                             | L3              |
| 2   | Implementar lista de actividades (tabla + filtros)     | L4              |
| 3   | Implementar detalle de actividad (métricas + gráficas) | L4              |
| 3   | Activar agente R3 (PR Reviewer) — primera review IA    | R3 (primer uso) |
| 4   | Importación manual de actividad (formulario mock)      | L4              |
| 5   | Implementar RPE input post-actividad                   | L4              |
| 5   | Activar agente R1 (Issue Analyzer) en issues nuevas    | R1 (primer uso) |

**Entregables semana 3**:

- Lista de actividades funcional
- Detalle de actividad con gráficas
- Importación manual
- PR Review automático funcionando
- Issue Analysis automático funcionando

#### Semana 4: Planificación y comparativas

| Día | Tarea                                                      | Agente |
| --- | ---------------------------------------------------------- | ------ |
| 1   | Interpretar capturas: planificación semanal + comparativas | L1     |
| 1   | Diseño técnico                                             | L2     |
| 2   | Implementar endpoint IA: /ai/weekly-plan                   | L4     |
| 2   | Integrar Claude API para generación de plan                | L4     |
| 3   | Implementar vista de planificación semanal                 | L4     |
| 3   | Implementar recomendaciones de nutrición/descanso por día  | L4     |
| 4   | Implementar comparativa de semanas (selección + gráficas)  | L4     |
| 4   | Implementar endpoint /ai/weekly-summary                    | L4     |
| 5   | Implementar perfil y ajustes                               | L4     |
| 5   | Alertas de sobrecarga (reglas + banner)                    | L4     |

**Entregables semana 4**:

- Planificación semanal con IA
- Comparativa de semanas
- Perfil editable
- Alertas de sobrecarga
- **MVP completo** (todas las pantallas funcionales)

**Retrospectiva**: Evaluar calidad de reviews IA vs reviews propias.

---

### FASE 3 — Pipeline AI-First Completo (Semanas 5-6)

**Objetivo**: Activar todos los agentes remotos. Generar features nuevas vía PRs automáticas. Esta es la fase central del TFM.

#### Semana 5: Agentes remotos completos

| Día | Tarea                                                           | Agente       |
| --- | --------------------------------------------------------------- | ------------ |
| 1   | Configurar agente R2 (PR Generator)                             | Manual       |
| 1   | Probar flujo completo: issue → ai-analyze → ai-generate-pr → PR | R1 + R2      |
| 2   | Configurar agente R5 (Doc Generator)                            | Manual       |
| 2   | Probar: merge → changelog automático                            | R5           |
| 3   | Crear 3-5 issues de features secundarias para probar pipeline   | L3           |
| 3   | Ejecutar pipeline completo en 1-2 features                      | R1 + R2 + R3 |
| 4   | Comparar: PR generada por IA vs PR manual (misma feature)       | Evaluación   |
| 5   | Documentar flujos, ajustar prompts, versionar prompts           | Manual       |

**Features secundarias sugeridas para probar el pipeline**:

1. Añadir campo "clima" a la actividad (soleado, nublado, lluvioso)
2. Exportar plan semanal como imagen/texto
3. Añadir "nota del entrenador IA" editable en cada actividad
4. Dark mode toggle
5. Estadísticas de "mejor semana" en el dashboard

#### Semana 6: Iteración y refinamiento

| Día | Tarea                                                 | Agente            |
| --- | ----------------------------------------------------- | ----------------- |
| 1-2 | Ejecutar 2-3 features más vía pipeline completo       | Pipeline completo |
| 3   | Refinar prompts basándose en calidad de PRs generadas | Manual            |
| 4   | Implementar modo "IA desactivada" para comparativa    | Manual            |
| 5   | Recopilar métricas de todo el proceso                 | Manual            |

**Entregables fase 3**:

- Pipeline AI-first funcionando end-to-end
- 5-8 features añadidas vía PRs automáticas
- Comparativa pipeline tradicional vs AI-first
- Prompts versionados y documentados

---

### FASE 4 — Evaluación y Documentación TFM (Semana 7)

**Objetivo**: Cerrar el ciclo, medir resultados, documentar para la memoria del TFM.

| Día | Tarea                                                             |
| --- | ----------------------------------------------------------------- |
| 1   | Recopilar todas las métricas: tiempo, cobertura, bugs, revisiones |
| 2   | Elaborar tablas comparativas (pipeline tradicional vs AI-first)   |
| 3   | Documentar limitaciones y riesgos encontrados                     |
| 4   | Escribir conclusiones y trabajo futuro                            |
| 5   | Revisión final del repo, README, limpieza                         |

**Métricas a recopilar**:

| Métrica                                 | Cómo se mide                      |
| --------------------------------------- | --------------------------------- |
| Tiempo issue → PR                       | Timestamps de GitHub              |
| Nº de revisiones por PR                 | Conteo en GitHub                  |
| Cobertura de tests                      | Report de test runner             |
| Bugs detectados por IA vs humano        | Clasificación manual              |
| Calidad de PRs generadas (1-5)          | Auto-evaluación del desarrollador |
| Esfuerzo cognitivo percibido            | Auto-evaluación por sesión        |
| Coincidencia review IA vs review humana | Análisis cualitativo              |

---

## 5. GitHub Actions — Configuración detallada

### 5.1 Labels del sistema

```
ai-analyze          → Trigger para R1 (Issue Analyzer)
ai-generate-pr      → Trigger para R2 (PR Generator)
priority:p0         → Bloqueante
priority:p1         → Importante
priority:p2         → Nice to have
type:feature        → Nueva funcionalidad
type:bug            → Corrección
type:refactor       → Mejora técnica
type:docs           → Documentación
phase:1             → Fase del desarrollo
phase:2
phase:3
ai-generated        → PR generada por IA (para tracking)
ai-reviewed         → PR revisada por IA (para tracking)
```

### 5.2 PR Template

```markdown
## Descripción

<!-- Qué cambia esta PR y por qué -->

## Issue relacionada

Closes #

## Tipo de cambio

- [ ] Nueva feature
- [ ] Bug fix
- [ ] Refactor
- [ ] Documentación

## Checklist

- [ ] Tests añadidos/actualizados
- [ ] Types correctos (sin any)
- [ ] Documentación actualizada si aplica
- [ ] Self-review realizado

## Generado por IA

- [ ] Sí → label: `ai-generated`
- [ ] No

## Screenshots (si aplica)
```

### 5.3 Secrets necesarios

```
ANTHROPIC_API_KEY     → Para agentes remotos que usan Claude
SUPABASE_URL          → Para tests de integración
SUPABASE_ANON_KEY     → Para tests de integración
```

---

## 6. Flujo de trabajo diario recomendado

```
Mañana:
1. Revisar issues pendientes en GitHub
2. Elegir siguiente issue (por prioridad)
3. Si es nueva pantalla → L1 (interpretar diseño) → L2 (diseño técnico)
4. Si ya tiene diseño → L4 (implementar con Claude Code plan mode)
5. Crear PR → CI automático (R4) + Review IA (R3)
6. Revisar comentarios de R3, ajustar si necesario
7. Mergear

Tarde (fase 3):
1. Crear issues de features secundarias (L3)
2. Añadir label `ai-analyze` → R1 analiza
3. Añadir label `ai-generate-pr` → R2 genera PR
4. Revisar PR generada → R3 también revisa
5. Comparar con lo que habrías hecho tú
6. Mergear o rechazar con notas
```

---

## 7. Prompts versionados — Estructura

```
/prompts/
├── system/
│   ├── ux-interpreter.md      → Prompt para L1
│   ├── architect.md           → Prompt para L2
│   ├── planner.md             → Prompt para L3
│   └── implementer.md         → Prompt para L4
├── remote/
│   ├── issue-analyzer.md      → Prompt para R1
│   ├── pr-generator.md        → Prompt para R2
│   ├── pr-reviewer.md         → Prompt para R3
│   └── doc-generator.md       → Prompt para R5
├── product/
│   ├── training-coach.md      → Prompt del entrenador IA
│   ├── activity-analyzer.md   → Prompt para análisis de sesión
│   └── plan-generator.md      → Prompt para plan semanal
└── CONVENTIONS.md             → Reglas comunes a todos los prompts
```

Cada prompt incluye:

- Rol claro
- Contexto esperado (qué datos recibe)
- Output esperado (formato JSON/Markdown)
- Reglas explícitas (qué puede y no puede hacer)
- Ejemplos (few-shot cuando aplique)

---

## 8. Despliegue — Detalle

### 8.1 Entorno gratuito recomendado

| Servicio           | Uso                 | Plan               | Límites relevantes                                                  |
| ------------------ | ------------------- | ------------------ | ------------------------------------------------------------------- |
| **Vercel**         | Frontend Next.js    | Hobby (gratis)     | 100GB bandwidth, serverless functions, preview deploys              |
| **Render**         | Backend Fastify     | Free               | 750h/mes, sleep tras 15min inactividad, auto-deploy desde GitHub    |
| **Supabase**       | DB + Auth + Storage | Free               | 500MB DB, 1GB storage, 50K MAU auth, 500K edge function invocations |
| **GitHub Actions** | CI/CD + Agentes     | Free (public repo) | 2000 min/mes en repos públicos, 500 min en privados                 |

### 8.2 Configuración de despliegue

**Vercel**:

- Conectar repo de GitHub
- Root directory: `apps/web`
- Build command: `cd ../.. && npx turbo run build --filter=web`
- Output: `.next`
- Variables de entorno: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL`

**Render**:

- Conectar repo de GitHub
- Root directory: `apps/api`
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Variables de entorno: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`

### 8.3 Nota sobre GitHub Actions y Claude Code remoto

Para los agentes R1 y R2 que usan Claude, hay dos opciones:

**Opción A — Claude API directa**: Los workflows llaman a la API de Claude con los prompts definidos. Más simple, más control.

**Opción B — Claude Code en GitHub Actions**: Usar `anthropics/claude-code-action` como action. Más potente (puede leer el repo, generar código, abrir PRs), pero requiere configuración adicional.

**Recomendación**: Empezar con Opción A (más simple) y migrar a Opción B en fase 3 cuando se necesite generación de PRs.

---

## 9. Valoración del stack y decisiones

### 9.1 Next.js + Fastify + Supabase

**Fortalezas**:

- TypeScript end-to-end: menos errores, mejor DX con agentes IA
- Supabase unifica DB + Auth + Storage: menos servicios que configurar
- Next.js en Vercel: deploy zero-config, preview por PR (perfecto para evaluar PRs de IA)
- Fastify: rendimiento superior a Express, validation integrada con schemas

**Riesgos**:

- Monorepo con Turborepo puede añadir complejidad inicial
- Render free tier tiene cold starts (~30s): documentar como limitación
- Supabase free tier es generoso pero tiene límites en edge functions

### 9.2 Supabase Auth con Google

**Fortalezas**:

- Configuración en minutos (dashboard de Supabase + Google Cloud Console)
- RLS integrado: seguridad a nivel de base de datos sin middleware custom
- JWT automático: sin gestión manual de tokens
- Funciona igual en local y en producción

**Consideraciones**:

- Necesitas crear un proyecto en Google Cloud Console y configurar OAuth consent screen
- Para el MVP, solo Google como provider es suficiente
- RLS policies hay que escribirlas para cada tabla (pero son simples para un solo rol)

### 9.3 Claude Code como motor vs OpenSpec

**Análisis**:

- OpenSpec y herramientas similares añaden una capa de abstracción que puede ser útil en equipos, pero para un desarrollador individual con Claude Code, el **modo plan** de Claude Code es suficiente y más flexible.
- Ventaja de Claude Code plan: trabaja directamente sobre tu código, entiende el contexto del repo, no necesita configuración extra.
- El valor del TFM está en documentar cómo usas los prompts y el modo plan, no en qué herramienta de orquestación usas.
- Si en algún momento necesitas más estructura, puedes crear un `CLAUDE.md` en la raíz del repo con convenciones y reglas que Claude Code respetará automáticamente.

**Recomendación**: Usar Claude Code plan mode + archivo `CLAUDE.md` como "sistema nervioso local". No añadir OpenSpec al stack.

---

## 10. Checklist de arranque

Antes de empezar la semana 1:

- [ ] Crear proyecto en Supabase
- [ ] Configurar Google OAuth en Google Cloud Console + Supabase
- [ ] Crear repo en GitHub (público si quieres Actions gratis ilimitado)
- [ ] Cuenta en Vercel conectada al repo
- [ ] Cuenta en Render conectada al repo
- [ ] API key de Anthropic (para agentes remotos y entrenador IA)
- [ ] Generar capturas de diseño en Google Stitch o Claude
- [ ] Crear archivo `CLAUDE.md` con convenciones del proyecto
- [ ] Tener este documento y el PRD accesibles en `/docs/`
