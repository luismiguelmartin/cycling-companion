# L2 — Diseño Técnico: Endpoints de Insights (Bloque 3)

> **Tipo**: Especificación técnica (L2)
> **Fase**: 3 — Backend + IA
> **Bloque**: 3 — Insights (comparativas y sobrecarga)
> **Estado**: ✅ Implementado (retroactivo)
> **Fecha**: 2026-02-15
> **Commit**: `4cfe722`

---

## 1. Objetivo

Implementar endpoints de análisis comparativo para:
- Comparar métricas entre dos periodos temporales (semanas, meses)
- Detectar sobrecarga de entrenamiento (carga actual vs promedio histórico)
- Generar análisis automático basado en reglas heurísticas

Estos endpoints son consumidos por la pantalla `/insights` del frontend.

---

## 2. Contratos de API

### 2.1 GET /api/v1/insights

**Propósito**: Comparar métricas agregadas entre dos periodos (Periodo A vs Periodo B).

**Autenticación**: ✅ Requerida

**Query Parameters**:
```typescript
{
  period_a_start: string;  // YYYY-MM-DD (requerido)
  period_a_end: string;    // YYYY-MM-DD (requerido)
  period_b_start: string;  // YYYY-MM-DD (requerido)
  period_b_end: string;    // YYYY-MM-DD (requerido)
}
```

**Request**:
```http
GET /api/v1/insights?period_a_start=2026-01-06&period_a_end=2026-01-12&period_b_start=2026-02-03&period_b_end=2026-02-09 HTTP/1.1
Authorization: Bearer <jwt_token>
```

**Response 200 OK**:
```json
{
  "data": {
    "comparison": [
      {
        "metric": "Distancia",
        "valueA": 120.5,
        "valueB": 145.2,
        "unit": "km",
        "color": "#3b82f6"
      },
      {
        "metric": "Tiempo",
        "valueA": 8.5,
        "valueB": 10.2,
        "unit": "h",
        "color": "#8b5cf6"
      },
      {
        "metric": "Potencia",
        "valueA": 210,
        "valueB": 220,
        "unit": "W",
        "color": "#f97316"
      },
      {
        "metric": "FC media",
        "valueA": 145,
        "valueB": 142,
        "unit": "bpm",
        "color": "#ef4444",
        "inverse": true
      },
      {
        "metric": "TSS",
        "valueA": 450,
        "valueB": 520,
        "unit": "",
        "color": "#eab308"
      },
      {
        "metric": "Sesiones",
        "valueA": 5,
        "valueB": 6,
        "unit": "",
        "color": "#22c55e"
      }
    ],
    "radar": [
      { "metric": "Volumen", "A": 60, "B": 73 },
      { "metric": "Intensidad", "A": 70, "B": 73 },
      { "metric": "Consistencia", "A": 71, "B": 86 },
      { "metric": "Recuperación", "A": 78, "B": 65 },
      { "metric": "Progresión", "A": 50, "B": 60 }
    ],
    "analysis": {
      "summary": "Tu potencia media ha subido un 5%, lo que indica buena adaptación al entrenamiento. Has aumentado el volumen un 20% respecto a la semana anterior.",
      "alert": "Tu carga de entrenamiento (TSS) ha aumentado un 16%. Vigila la recuperación para evitar sobreentrenamiento.",
      "recommendation": "Buen ritmo de entrenamiento. Mantén la alternancia entre sesiones intensas y de recuperación para optimizar las adaptaciones."
    }
  }
}
```

**Métricas de Comparación** (`comparison`):
- **Distancia**: Total de km en cada periodo
- **Tiempo**: Total de horas de entrenamiento
- **Potencia**: Promedio de potencia media de todas las actividades
- **FC media**: Promedio de FC de todas las actividades (inverse: true → menor es mejor)
- **TSS**: Suma de TSS del periodo
- **Sesiones**: Número de actividades en el periodo

**Dimensiones Radar** (`radar`):
- **Volumen**: Normalizado 0-100 basado en distancia (cap: 200km)
- **Intensidad**: Normalizado 0-100 basado en potencia (cap: 300W)
- **Consistencia**: Normalizado 0-100 basado en número de sesiones (cap: 7)
- **Recuperación**: Inverso de TSS/sesión (100 - (TSS_avg/150)*100)
- **Progresión**: Cambio relativo de potencia entre periodos (50 base + delta)

**Análisis Automático** (`analysis`):
- **summary**: Descripción de cambios clave (potencia, volumen)
- **alert**: Advertencia si TSS aumentó >15% (riesgo sobrecarga)
- **recommendation**: Sugerencia basada en número de sesiones

**Response 400 Bad Request** (parámetros faltantes):
```json
{
  "error": "Missing required query params: period_a_start, period_a_end, period_b_start, period_b_end",
  "code": "BAD_REQUEST"
}
```

**Response 401 Unauthorized**:
```json
{
  "error": "Missing or invalid authorization header",
  "code": "UNAUTHORIZED"
}
```

---

### 2.2 GET /api/v1/insights/overload-check

**Propósito**: Detectar sobrecarga de entrenamiento comparando carga semanal actual vs promedio de 4 semanas previas.

**Autenticación**: ✅ Requerida

**Request**:
```http
GET /api/v1/insights/overload-check HTTP/1.1
Authorization: Bearer <jwt_token>
```

**Lógica**:
1. Calcula TSS de la semana actual (lunes-hoy)
2. Calcula TSS promedio de las 4 semanas previas
3. Compara: `percentage = (currentLoad / avgLoad) * 100`
4. Alertas:
   - `percentage >= 150` → `critical` (sobrecarga severa)
   - `percentage >= 120` → `warning` (sobrecarga moderada)
   - `percentage < 120` → `none` (carga normal)

**Response 200 OK** (carga normal):
```json
{
  "data": {
    "currentLoad": 280,
    "avgLoad": 320,
    "percentage": 88,
    "is_overloaded": false,
    "alert_level": "none"
  }
}
```

**Response 200 OK** (sobrecarga moderada):
```json
{
  "data": {
    "currentLoad": 450,
    "avgLoad": 320,
    "percentage": 141,
    "is_overloaded": true,
    "alert_level": "warning"
  }
}
```

**Response 200 OK** (sobrecarga crítica):
```json
{
  "data": {
    "currentLoad": 520,
    "avgLoad": 320,
    "percentage": 163,
    "is_overloaded": true,
    "alert_level": "critical"
  }
}
```

**Response 200 OK** (sin datos históricos):
```json
{
  "data": {
    "currentLoad": 150,
    "avgLoad": 0,
    "percentage": 0,
    "is_overloaded": false,
    "alert_level": "none"
  }
}
```

**Campos de respuesta**:
- `currentLoad`: TSS acumulado esta semana
- `avgLoad`: TSS promedio de las 4 semanas previas
- `percentage`: Porcentaje de carga actual respecto a promedio
- `is_overloaded`: `true` si `percentage >= 120`
- `alert_level`: `"none"` | `"warning"` | `"critical"`

---

## 3. Arquitectura

### 3.1 Capa de Servicio

**Archivo**: `apps/api/src/services/insights.service.ts`

**Métodos principales**:

#### `getInsights(userId, periodAStart, periodAEnd, periodBStart, periodBEnd)`

**Flujo**:
```typescript
1. Fetch actividades de ambos periodos en paralelo (Supabase)
   ↓
2. Calcular métricas agregadas por periodo:
   - calculatePeriodMetrics(activities) → PeriodMetrics
   ↓
3. Construir datos de comparación:
   - buildComparisonMetrics(metricsA, metricsB) → ComparisonMetric[]
   ↓
4. Calcular dimensiones del radar:
   - calculateRadarDimensions(metricsA, metricsB) → RadarDimension[]
   ↓
5. Generar análisis automático:
   - generateSimpleAnalysis(metricsA, metricsB) → InsightsAnalysis | null
   ↓
6. Retornar: { comparison, radar, analysis }
```

**Tipos internos**:
```typescript
interface PeriodMetrics {
  distanceKm: number;
  durationHours: number;
  avgPower: number | null;
  avgHR: number | null;
  totalTSS: number;
  sessionCount: number;
}
```

**Queries a Supabase**:
```typescript
const ACTIVITY_SELECT = "date, duration_seconds, distance_km, avg_power_watts, avg_hr_bpm, tss";

// Periodo A
supabaseAdmin
  .from("activities")
  .select(ACTIVITY_SELECT)
  .eq("user_id", userId)
  .gte("date", periodAStart)
  .lte("date", periodAEnd)

// Periodo B
supabaseAdmin
  .from("activities")
  .select(ACTIVITY_SELECT)
  .eq("user_id", userId)
  .gte("date", periodBStart)
  .lte("date", periodBEnd)
```

**Funciones auxiliares**:

##### `calculatePeriodMetrics(activities: ActivityRow[]): PeriodMetrics`
```typescript
// Agrega métricas de todas las actividades del periodo
- distanceKm: suma de distancias, redondeado a 1 decimal
- durationHours: suma de duraciones en horas, redondeado a 1 decimal
- avgPower: promedio de avg_power_watts (solo actividades con potencia)
- avgHR: promedio de avg_hr_bpm (solo actividades con FC)
- totalTSS: suma de TSS
- sessionCount: número de actividades
```

##### `buildComparisonMetrics(a, b): ComparisonMetric[]`
```typescript
// Construye array de 6 métricas comparativas
// Cada métrica tiene: metric, valueA, valueB, unit, color, inverse?
```

##### `calculateRadarDimensions(a, b): RadarDimension[]`
```typescript
// Normaliza métricas a escala 0-100 para gráfico radar
// 5 dimensiones:
// - Volumen: basado en distanceKm (cap 200km)
// - Intensidad: basado en avgPower (cap 300W)
// - Consistencia: basado en sessionCount (cap 7 sesiones)
// - Recuperación: inverso de TSS/sesión (100 - (TSS_avg/150)*100)
// - Progresión: cambio de potencia (50 base + delta normalizado)
```

##### `generateSimpleAnalysis(a, b): InsightsAnalysis | null`
```typescript
// Genera texto de análisis basado en reglas heurísticas
// Compara: potencia (+/- %), distancia (+/- %), TSS
// Retorna: { summary, alert?, recommendation }

// Reglas:
// - Cambio potencia >= 1% → mencionar en summary
// - Cambio distancia >= 5% → mencionar en summary
// - Cambio TSS > 15% → añadir alerta de sobrecarga
// - Sesiones < 3 → recomendar más consistencia
// - Sesiones >= 3 → recomendar alternar intensidad/recuperación
```

---

#### `checkOverload(userId)`

**Flujo**:
```typescript
1. Calcular inicio de semana actual (lunes 00:00)
   ↓
2. Calcular rango de 4 semanas previas (28 días antes hasta ayer)
   ↓
3. Fetch actividades en paralelo:
   - Semana actual (lunes-hoy)
   - 4 semanas previas (28 días)
   ↓
4. Calcular currentLoad (suma TSS semana actual)
   ↓
5. Dividir 4 semanas previas en buckets semanales
   ↓
6. Calcular avgLoad (promedio TSS de las 4 semanas)
   ↓
7. Calcular percentage = (currentLoad / avgLoad) * 100
   ↓
8. Determinar alert_level:
   - >= 150% → "critical"
   - >= 120% → "warning"
   - < 120% → "none"
   ↓
9. Retornar: { currentLoad, avgLoad, percentage, is_overloaded, alert_level }
```

**Función auxiliar**:
```typescript
function getWeekStart(date: Date): Date {
  // Retorna lunes 00:00 de la semana de `date`
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  // Si domingo → -6 días, sino → lunes más cercano
}
```

**Lógica de buckets semanales**:
```typescript
for (let i = 1; i <= 4; i++) {
  const wStart = new Date(weekStart);
  wStart.setDate(wStart.getDate() - 7 * i); // Semana i-ésima atrás
  const wEnd = new Date(wStart);
  wEnd.setDate(wEnd.getDate() + 7);

  const load = prevActivities
    .filter(a => { /* fecha entre wStart y wEnd */ })
    .reduce((sum, a) => sum + (a.tss ?? 0), 0);

  weekLoads.push(load);
}

avgLoad = weekLoads.reduce((s, v) => s + v, 0) / weekLoads.length;
```

**Edge cases**:
- Si `avgLoad === 0` (sin datos históricos) → `percentage: 0`, `is_overloaded: false`, `alert_level: "none"`
- Si `currentLoad === 0` (sin entrenamientos esta semana) → porcentaje puede ser 0 o bajo

---

### 3.2 Capa de Rutas

**Archivo**: `apps/api/src/routes/insights.ts`

```typescript
import type { FastifyInstance } from "fastify";
import { AppError } from "../plugins/error-handler.js";
import { getInsights, checkOverload } from "../services/insights.service.js";

export default async function insightsRoutes(fastify: FastifyInstance) {
  // GET /api/v1/insights
  fastify.get("/insights", async (request) => {
    const query = request.query as {
      period_a_start?: string;
      period_a_end?: string;
      period_b_start?: string;
      period_b_end?: string;
    };

    // Validación manual de parámetros requeridos
    if (
      !query.period_a_start ||
      !query.period_a_end ||
      !query.period_b_start ||
      !query.period_b_end
    ) {
      throw new AppError(
        "Missing required query params: period_a_start, period_a_end, period_b_start, period_b_end",
        400,
        "BAD_REQUEST"
      );
    }

    const result = await getInsights(
      request.userId, // Decorado por auth plugin
      query.period_a_start,
      query.period_a_end,
      query.period_b_start,
      query.period_b_end
    );

    return { data: result };
  });

  // GET /api/v1/insights/overload-check
  fastify.get("/insights/overload-check", async (request) => {
    const result = await checkOverload(request.userId);
    return { data: result };
  });
}
```

**Notas**:
- `request.userId`: Decorado por plugin `authenticate` (Bloque 0)
- Validación de query params manual (no usa Zod, parámetros simples)
- Respuestas envueltas en `{ data: ... }` (formato estándar de API)
- Errores capturados por error handler centralizado

---

### 3.3 Integración en app.ts

**Archivo**: `apps/api/src/app.ts`

```typescript
import insightsRoutes from './routes/insights.js';

export async function buildApp(opts?: FastifyServerOptions) {
  const fastify = Fastify(opts);

  // ... plugins globales

  // Rutas protegidas
  await fastify.register(async (app) => {
    app.addHook('onRequest', app.authenticate);

    await app.register(profileRoutes);
    await app.register(activityRoutes);
    await app.register(insightsRoutes); // ← Registro de insights

  }, { prefix: '/api/v1' });

  return fastify;
}
```

**Efecto**: Todas las rutas de `insightsRoutes` quedan bajo `/api/v1/insights*` y protegidas por auth.

---

## 4. Validación de Datos

### Query Parameters (Insights)

**No usa Zod**, validación manual:
```typescript
if (!query.period_a_start || !query.period_a_end ||
    !query.period_b_start || !query.period_b_end) {
  throw new AppError("Missing required query params...", 400, "BAD_REQUEST");
}
```

**Formato esperado**: `YYYY-MM-DD` (ISO 8601 date string)

**Validación en Supabase**:
- `.gte("date", periodAStart)` acepta formato ISO
- `.lte("date", periodAEnd)` acepta formato ISO
- Si formato inválido → Supabase retorna error → AppError 500

### Schemas de Respuesta

**Tipos compartidos** (en `packages/shared/src/types/insights.ts`):

```typescript
export interface ComparisonMetric {
  metric: string;
  valueA: number;
  valueB: number;
  unit: string;
  color: string;
  inverse?: boolean;
}

export interface RadarDimension {
  metric: string;
  A: number;
  B: number;
}

export interface InsightsAnalysis {
  summary: string;
  alert?: string;
  recommendation: string;
}
```

**No hay validación Zod en respuestas** (confianza en lógica del servicio).

---

## 5. Manejo de Errores

**Errores manejados**:

1. **400 Bad Request** (validación)
   - Parámetros `period_*` faltantes

2. **401 Unauthorized** (auth plugin)
   - Token faltante o inválido

3. **500 Internal Server Error** (servicio)
   - Error de Supabase al fetch actividades
   - Mensaje: `"Failed to fetch period A/B activities: <supabase_error>"`
   - Code: `"DATABASE_ERROR"`

4. **500 Internal Server Error** (overload-check)
   - Error de Supabase al fetch current week / previous weeks
   - Mensaje: `"Failed to fetch current/previous activities: <supabase_error>"`
   - Code: `"DATABASE_ERROR"`

**Todos capturados por error handler de Bloque 0** → respuesta JSON estructurada.

---

## 6. Testing

### Tests de Integración

**Archivo**: `apps/api/src/services/insights.service.test.ts`

**Casos implementados** (15 tests):

```typescript
describe('getInsights', () => {
  it('should return comparison metrics for two periods', async () => {
    // Mock actividades con diferentes métricas
    // Verificar que comparison tiene 6 métricas
    // Verificar cálculos correctos (distancia, tiempo, potencia, FC, TSS, sesiones)
  });

  it('should handle periods with no activities', async () => {
    // Mock sin actividades
    // Verificar métricas en 0
    // Verificar analysis es null
  });

  it('should calculate radar dimensions correctly', async () => {
    // Mock actividades
    // Verificar 5 dimensiones (Volumen, Intensidad, Consistencia, Recuperación, Progresión)
    // Verificar normalización 0-100
  });

  it('should generate analysis when power changes', async () => {
    // Mock con cambio de potencia >1%
    // Verificar que summary menciona cambio
  });

  it('should generate alert when TSS increases >15%', async () => {
    // Mock con TSS aumentado 20%
    // Verificar que analysis.alert existe
  });

  it('should recommend consistency when sessions < 3', async () => {
    // Mock con 2 sesiones
    // Verificar que recommendation sugiere más sesiones
  });
});

describe('checkOverload', () => {
  it('should return "none" when load is normal', async () => {
    // Mock con carga actual < 120% del promedio
    // Verificar is_overloaded: false
    // Verificar alert_level: "none"
  });

  it('should return "warning" when load is 120-149%', async () => {
    // Mock con carga actual 130% del promedio
    // Verificar is_overloaded: true
    // Verificar alert_level: "warning"
  });

  it('should return "critical" when load is >=150%', async () => {
    // Mock con carga actual 160% del promedio
    // Verificar alert_level: "critical"
  });

  it('should handle no historical data', async () => {
    // Mock sin actividades previas (avgLoad = 0)
    // Verificar percentage: 0, is_overloaded: false
  });

  it('should calculate weekly buckets correctly', async () => {
    // Mock con actividades en semanas específicas
    // Verificar que avgLoad es promedio correcto
  });
});
```

**Cobertura**:
- ✅ Cálculos de métricas agregadas
- ✅ Normalización para radar
- ✅ Generación de análisis automático
- ✅ Lógica de sobrecarga (umbrales 120%, 150%)
- ✅ Edge cases (sin datos, sin historial)

---

## 7. Decisiones Técnicas (ADRs)

### ADR-010: Análisis heurístico en backend (no IA)

**Contexto**: Análisis comparativo puede hacerse con reglas simples o IA.

**Decisión**: Implementar `generateSimpleAnalysis()` con reglas heurísticas en TypeScript.

**Rationale**:
- ✅ Determinista: mismo input → mismo output
- ✅ Rápido: sin latencia de API externa
- ✅ Cero coste: no consume Claude API
- ✅ Suficiente para MVP: cambios de potencia/distancia/TSS

**Trade-off**:
- ⚠️ Menos sofisticado que IA
- ⚠️ Requiere actualizar código para nuevas reglas

**Futuro**: Bloque 5 (IA) añadirá endpoint `/api/v1/ai/weekly-summary` con análisis IA más profundo (opcional para el usuario).

### ADR-011: Normalización de radar con caps fijos

**Contexto**: Dimensiones radar necesitan normalizarse a 0-100 para gráfico.

**Decisión**: Usar caps fijos por dimensión:
- Volumen: 200km
- Intensidad: 300W
- Consistencia: 7 sesiones
- Recuperación: TSS/sesión de 150
- Progresión: delta de potencia

**Rationale**:
- ✅ Consistente entre usuarios
- ✅ Facilita comparaciones entre periodos
- ✅ Valores razonables para ciclista amateur 40+

**Trade-off**:
- ⚠️ Valores muy altos (>200km, >300W) se aplastan en 100
- ⚠️ No adaptado a nivel individual (FTP, edad, experiencia)

**Alternativa rechazada**: Normalizar basado en histórico del usuario → complejidad innecesaria para MVP.

### ADR-012: Sobrecarga basada en 4 semanas previas

**Contexto**: Detectar sobrecarga requiere comparar carga actual con referencia histórica.

**Decisión**: Usar promedio de 4 semanas previas como baseline.

**Rationale**:
- ✅ Ventana suficientemente larga (28 días) para absorber variabilidad
- ✅ No demasiado larga (evita incluir periodos muy diferentes)
- ✅ Estándar en metodologías de entrenamiento (CTL/ATL usan 42/7 días)

**Umbrales**:
- 120-149% → `warning` (sobrecarga moderada)
- >= 150% → `critical` (sobrecarga severa)

**Trade-off**:
- ⚠️ Usuario nuevo (<4 semanas de datos) → avgLoad bajo o 0
- ⚠️ Cambio de objetivo (ej: base→build) puede disparar falsa alerta

**Mitigación**: Si `avgLoad === 0` → retornar `alert_level: "none"` (sin suficientes datos).

### ADR-013: Fetch paralelo de periodos

**Contexto**: Necesita datos de dos periodos para comparar.

**Decisión**: Usar `Promise.all` para fetch paralelo.

```typescript
const [resultA, resultB] = await Promise.all([
  supabaseAdmin.from("activities").select(...).eq("user_id", userId).gte(...),
  supabaseAdmin.from("activities").select(...).eq("user_id", userId).gte(...)
]);
```

**Rationale**:
- ✅ Reduce latencia total (queries independientes)
- ✅ No hay dependencia entre queries (periodo A no afecta B)

**Trade-off**:
- ⚠️ Si un query falla, ambos fallan (no hay fallback)

**Aceptable**: Comportamiento esperado para API (fallo total si datos incompletos).

---

## 8. Criterios de Aceptación

- [x] `GET /api/v1/insights` retorna datos comparativos con 6 métricas
- [x] `comparison` incluye: Distancia, Tiempo, Potencia, FC, TSS, Sesiones
- [x] `radar` incluye 5 dimensiones normalizadas 0-100
- [x] `analysis` genera texto automático basado en cambios
- [x] `analysis.alert` aparece si TSS aumenta >15%
- [x] `analysis.recommendation` basada en número de sesiones
- [x] Parámetros faltantes → 400 Bad Request
- [x] `GET /api/v1/insights/overload-check` retorna estado de sobrecarga
- [x] `alert_level: "warning"` si carga >= 120%
- [x] `alert_level: "critical"` si carga >= 150%
- [x] Sin datos históricos → `avgLoad: 0`, `percentage: 0`, `alert_level: "none"`
- [x] Cálculo de weekStart correcto (lunes 00:00)
- [x] Buckets semanales calculados correctamente (4 semanas previas)
- [x] Queries filtran por `user_id` (ownership)
- [x] Errores de Supabase → 500 con código `DATABASE_ERROR`

---

## 9. Archivos Modificados/Creados

**Nuevos**:
- `apps/api/src/services/insights.service.ts` (340 líneas)
- `apps/api/src/routes/insights.ts` (42 líneas)
- `apps/api/src/services/insights.service.test.ts` (373 líneas — tests)

**Modificados**:
- `apps/api/src/app.ts` (registro de `insightsRoutes`)
- `apps/api/vitest.config.ts` (configuración de Vitest para tests)
- `apps/api/tsconfig.json` (excluir `*.test.ts` del build)
- `apps/api/src/plugins/error-handler.ts` (wrappear con `fastify-plugin`)

**Tests añadidos**:
- 15 tests unitarios de `insights.service.ts`
- 4 tests de integración en `routes.integration.test.ts`

---

## 10. Integración con Frontend

**Pantalla**: `/insights` (`apps/web/src/app/(app)/insights/page.tsx`)

**Consumo actual**: Frontend calcula insights en cliente usando datos de Supabase.

**Migración futura** (Bloque 8):
```typescript
// GET insights
const params = new URLSearchParams({
  period_a_start: '2026-01-06',
  period_a_end: '2026-01-12',
  period_b_start: '2026-02-03',
  period_b_end: '2026-02-09',
});

const response = await fetch(`${API_URL}/api/v1/insights?${params}`, {
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
  },
});

const { data } = await response.json();
// data: { comparison, radar, analysis }

// GET overload check
const overloadResponse = await fetch(`${API_URL}/api/v1/insights/overload-check`, {
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
  },
});

const { data: overload } = await overloadResponse.json();
// overload: { currentLoad, avgLoad, percentage, is_overloaded, alert_level }
```

---

## 11. Performance

### Optimizaciones implementadas

1. **Fetch paralelo**: Periodos A y B en `Promise.all` (reduce latencia ~50%)
2. **Select mínimo**: Solo campos necesarios (`ACTIVITY_SELECT`)
3. **Filtro user_id**: Limita resultados (index en `user_id, date`)
4. **Cálculos en memoria**: Agregaciones en TypeScript (rápido, sin queries adicionales)

### Consideraciones

**Periodos largos** (>1 mes):
- Fetch de muchas actividades puede ser lento
- Mitigación actual: Frontend limita a periodos semanales/mensuales
- Futuro: Limitar en API (`max_range: 90 días`)

**Sin índices específicos** en columnas de agregación:
- `distance_km`, `avg_power_watts`, `tss` no tienen índices
- Aceptable: queries filtran primero por `user_id + date` (indexed)

---

## 12. Próximos Pasos (Bloque 4)

Con endpoints de insights listos, Bloque 4 implementa:
- Reglas de entrenamiento codificadas (TSS, IF, CTL, ATL, TSB)
- Cálculos de zonas de potencia y FC
- Alertas de sobrecarga basadas en CTL/ATL (más sofisticado que TSS simple)
- Utilidades compartidas en `packages/shared/src/utils/training-calculations.ts`

**Insights puede consumir reglas de Bloque 4** para análisis más avanzado en futuras iteraciones.
