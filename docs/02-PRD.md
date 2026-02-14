# Cycling Companion — Product Requirements Document (PRD)

## 1. Información general

| Campo | Valor |
|---|---|
| **Producto** | Cycling Companion |
| **Versión** | MVP v1.0 |
| **Autor** | Luis Miguel Martín |
| **Fecha** | Febrero 2026 |
| **Contexto** | TFM — Pipeline AI-first aplicado al desarrollo de software |
| **Plazo de desarrollo** | 6-8 semanas |

---

## 2. Objetivo del producto

Desarrollar una plataforma web que permita a ciclistas amateur (40+) visualizar sus datos de entrenamiento, recibir recomendaciones personalizadas de un entrenador IA, y planificar su semana de forma inteligente.

El producto se desarrolla como caso de uso real dentro de un TFM sobre integración de IA en el SDLC.

---

## 3. Stack tecnológico

### 3.1 Frontend

| Tecnología | Justificación |
|---|---|
| **Next.js 14+** (App Router) | React con SSR, routing integrado, optimización de rendimiento. PWA-ready con `next-pwa`. |
| **TypeScript** | Seguridad de tipos, mejor DX, coherente con el backend. |
| **Tailwind CSS** | Desarrollo rápido de UI responsive, utility-first, sin CSS custom. |
| **Recharts o Chart.js** | Gráficas de rendimiento (potencia, FC, tendencias). Recharts por integración natural con React. |
| **shadcn/ui** | Componentes accesibles y personalizables sobre Radix UI + Tailwind. |

#### PWA

- Service worker con `next-pwa`
- Manifest configurado para instalación en móvil
- Offline básico: caché de última sesión y plan semanal
- No es prioridad máxima en el MVP, pero la arquitectura lo soporta desde el inicio

### 3.2 Backend / API

| Tecnología | Justificación |
|---|---|
| **Fastify** | Más rápido que Express, schema-based validation, plugin ecosystem maduro. |
| **TypeScript** | Mismo lenguaje en todo el stack. |
| **Fastify Swagger** | Documentación automática de API (OpenAPI). |
| **Zod** | Validación de schemas compartida con frontend. |

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

| Tecnología | Uso |
|---|---|
| **Supabase** | PostgreSQL gestionado + Auth + Storage + Realtime |
| **Supabase Auth** | Autenticación con Google (zero config), gestión de sesiones |
| **Supabase Storage** | Almacenamiento de archivos .fit/.gpx subidos |
| **Supabase DB (PostgreSQL)** | Datos de usuario, actividades, planes, métricas |

#### Modelo de datos (simplificado)

```
users
├── id (UUID, from Supabase Auth)
├── email
├── display_name
├── age
├── weight_kg
├── ftp (Functional Threshold Power)
├── max_hr
├── rest_hr
├── goal (enum: performance | health | weight_loss | recovery)
├── created_at
└── updated_at

activities
├── id (UUID)
├── user_id (FK → users)
├── name
├── date
├── type (enum: outdoor | indoor | recovery)
├── duration_seconds
├── distance_km
├── avg_power_watts
├── avg_hr_bpm
├── max_hr_bpm
├── avg_cadence_rpm
├── tss (Training Stress Score, calculado)
├── rpe (Rating of Perceived Exertion, 1-10, input usuario)
├── ai_analysis (JSONB, análisis generado por IA)
├── notes
├── is_reference (boolean)
├── raw_file_url (Storage URL, nullable)
├── created_at
└── updated_at

weekly_plans
├── id (UUID)
├── user_id (FK → users)
├── week_start (date)
├── plan_data (JSONB)
│   └── { days: [{ day, type, intensity, duration, nutrition_tip, rest_tip }] }
├── ai_rationale (text, explicación de la IA)
├── created_at
└── updated_at

activity_metrics (series temporales simplificadas)
├── id (UUID)
├── activity_id (FK → activities)
├── timestamp_seconds (offset desde inicio)
├── power_watts
├── hr_bpm
├── cadence_rpm
└── speed_kmh
```

### 3.4 IA / LLM

| Componente | Tecnología |
|---|---|
| **LLM principal** | Claude (vía API de Anthropic) |
| **Capa de prompts** | Prompts versionados en el repo (`/prompts/*.md`) |
| **Contexto** | Datos del usuario + actividades recientes + plan actual (RAG simplificado) |
| **Reglas de entrenamiento** | Heurísticas en código (umbrales de TSS, zonas, progresión) |
| **Guardrails** | La IA recomienda, nunca decide. Siempre muestra razonamiento. |

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

| Aspecto | Decisión |
|---|---|
| **Proveedor** | Supabase Auth |
| **Método principal** | Google OAuth |
| **Método secundario** | Email + password (como fallback) |
| **Sesiones** | JWT gestionado por Supabase, cookies httpOnly |
| **RLS (Row Level Security)** | Activado. Cada usuario solo ve sus datos. |

### 3.6 Despliegue

| Componente | Plataforma | Plan | Justificación |
|---|---|---|---|
| **Frontend (Next.js)** | **Vercel** | Free (Hobby) | Despliegue nativo de Next.js, CDN global, preview deploys por PR |
| **Backend (Fastify)** | **Render** | Free | Web service con auto-deploy desde GitHub, sleep tras 15min de inactividad (aceptable para MVP) |
| **Base de datos** | **Supabase** | Free | 500MB DB, 1GB Storage, 50K auth users, suficiente para MVP |
| **Dominio** | Subdominios gratuitos | — | `cycling-companion.vercel.app` + `api-cycling.onrender.com` |

#### CI/CD

- **Vercel**: deploy automático en push a `main` y preview en cada PR
- **Render**: deploy automático en push a `main`
- **GitHub Actions**: lint, tests, type-check en cada PR + flujos AI-first

### 3.7 Monorepo vs repos separados

**Decisión: Monorepo** con estructura de carpetas.

```
cycling-companion/
├── apps/
│   ├── web/          → Next.js frontend
│   └── api/          → Fastify backend
├── packages/
│   └── shared/       → Types, validaciones Zod, constantes
├── prompts/          → Prompts versionados para IA
├── docs/             → ADRs, diseño, decisiones
├── .github/
│   ├── workflows/    → GitHub Actions (CI + AI-first pipeline)
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
├── scripts/          → Scripts de orquestación
├── data/
│   └── mock/         → Datos mock de actividades
├── turbo.json        → Turborepo config
└── package.json      → Workspace root
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
| Tipo | badge (outdoor/indoor/recovery) |
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
- Colores: verde (recuperación), amarillo (resistencia), naranja (tempo), rojo (intervalos), gris (descanso)
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

| Ubicación | Tipo de recomendación | Trigger |
|---|---|---|
| Dashboard | Recomendación del día | Carga automática |
| Detalle actividad | Análisis post-sesión | Al abrir actividad sin análisis |
| Planificación | Plan semanal completo | Al generar/recalcular plan |
| Comparativas | Resumen de tendencias | Al comparar periodos |

**Tono del entrenador**:
- Cercano pero profesional
- Basado en datos, nunca inventado
- Motivador sin ser condescendiente
- Siempre explica el porqué

**Implementación**:
- Prompts versionados en `/prompts/`
- Contexto construido programáticamente (no RAG complejo, sino template filling)
- Reglas de entrenamiento en código como primer filtro (la IA complementa, no sustituye)
- Respuestas en JSON estructurado, parseadas en frontend para presentación

---

## 5. Datos mock

Para la fase inicial de desarrollo, se proporcionan datos mock que simulan actividades reales.

### Estructura de datos mock

Archivo `/data/mock/activities.json`:
- 20-30 actividades distribuidas en 6 semanas
- Variedad de tipos (outdoor, indoor, recovery)
- Métricas realistas para un ciclista amateur (FTP ~200W, FC max ~175)
- Algunos con series temporales simplificadas
- Progresión lógica (mejora gradual con algún bajón)

Archivo `/data/mock/user-profile.json`:
- Usuario ejemplo: 45 años, 78kg, FTP 195W, FC max 172, objetivo: performance

### Transición a datos reales

La arquitectura permite sustituir datos mock por datos reales:
1. Upload de archivos .fit/.gpx
2. Parseo automático
3. Misma estructura en BD

---

## 6. Requisitos no funcionales

| Requisito | Especificación |
|---|---|
| **Rendimiento** | Dashboard carga en < 2s, gráficas en < 1s |
| **Responsive** | Desktop-first, usable en tablet y móvil |
| **Accesibilidad** | Contrastes AA, navegación por teclado en flows principales |
| **Seguridad** | RLS en Supabase, HTTPS, sanitización de inputs |
| **Privacidad** | Datos del usuario aislados por RLS, no se comparten entre usuarios |
| **Disponibilidad** | Aceptable tier gratuito (cold starts en Render: ~30s primera request) |
| **Mantenibilidad** | TypeScript end-to-end, linting, tests automatizados |

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

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Recomendaciones IA poco útiles | Alto | Reglas/heurísticas como base + IA como capa explicativa |
| Tiempo insuficiente para todo el MVP | Alto | Priorización estricta P0/P1, recortar F06-F09 si necesario |
| Cold starts en Render (free tier) | Bajo | Aceptable para MVP, documentar como limitación |
| Costes de API de Claude | Medio | Caché de recomendaciones, limitar llamadas por usuario/día |
| Complejidad del parseo .fit/.gpx | Medio | Empezar con mock, parseo como feature separada |
