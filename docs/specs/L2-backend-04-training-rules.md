# L2 — Diseño Técnico: Reglas de Entrenamiento (Bloque 4)

> **Tipo**: Especificación técnica (L2)
> **Fase**: 3 — Backend + IA
> **Bloque**: 4 — Reglas de Entrenamiento
> **Estado**: 🔲 Pendiente
> **Fecha**: 2026-02-15

---

## 1. Objetivo

Implementar heurísticas de entrenamiento codificadas en TypeScript dentro de `packages/shared`, reutilizables tanto por el backend (endpoints de IA, insights) como por el frontend. Estas reglas NO dependen de la IA — son cálculos determinísticos.

**Funciones a implementar**:
- Cálculos de entrenamiento: TSS, IF, CTL, ATL, TSB
- Reglas de alerta: sobrecarga, descanso urgente, progresión excesiva
- Extensión de zonas: clasificación de actividad por zona dominante

**Consumidores**:
- `apps/api/src/services/insights.service.ts` — ya calcula TSS/overload inline, se refactorizará
- `apps/api/src/services/activity.service.ts` — ya calcula TSS en create, se refactorizará
- Bloque 5 (IA) — prompts reciben estos cálculos como contexto
- Frontend — puede usar directamente para UI (TSB gauge, alertas)

---

## 2. Archivos a Crear/Modificar

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `packages/shared/src/utils/training-calculations.ts` | **Crear** | Funciones puras: TSS, IF, CTL, ATL, TSB |
| `packages/shared/src/utils/training-calculations.test.ts` | **Crear** | Tests unitarios (~15 tests) |
| `packages/shared/src/utils/training-rules.ts` | **Crear** | Reglas de alerta basadas en los cálculos |
| `packages/shared/src/utils/training-rules.test.ts` | **Crear** | Tests unitarios (~10 tests) |
| `packages/shared/src/index.ts` | **Modificar** | Re-exportar nuevas funciones y tipos |

---

## 3. Cálculos de Entrenamiento (`training-calculations.ts`)

### 3.1 Tipos

```typescript
/** Entrada mínima de actividad para cálculos */
export interface ActivityInput {
  date: string;                    // YYYY-MM-DD
  duration_seconds: number;
  avg_power_watts: number | null;
  tss: number | null;
}

/** Resultado del cálculo de forma/fatiga */
export interface TrainingLoad {
  ctl: number;    // Chronic Training Load (fitness) — media 42 días
  atl: number;    // Acute Training Load (fatigue) — media 7 días
  tsb: number;    // Training Stress Balance (form) — CTL - ATL
}
```

### 3.2 Funciones

#### `calculateIF(avgPower, ftp): number`

**Intensity Factor**: ratio entre potencia media y FTP.

```
IF = avg_power / ftp
```

- Retorna 0 si `avgPower` o `ftp` son null/0
- No tiene unidades, típicamente entre 0.5 y 1.3

#### `calculateTSS(avgPower, ftp, durationSeconds): number`

**Training Stress Score**: medida de carga de una sesión.

```
IF = avg_power / ftp
TSS = IF² × (duration_seconds / 3600) × 100
```

- Retorna 0 si `avgPower` o `ftp` son null/0
- Resultado redondeado a entero (`Math.round`)
- Fórmula idéntica a la ya implementada en `activity.service.ts:101-107`

#### `calculateCTL(activities, targetDate): number`

**Chronic Training Load (Fitness)**: media exponencial ponderada de TSS con constante de 42 días.

```
CTL_hoy = CTL_ayer + (TSS_hoy - CTL_ayer) / 42
```

- `activities`: array ordenado por fecha (más antigua primero)
- `targetDate`: fecha hasta la cual calcular (inclusive)
- Itera día a día desde la primera actividad hasta `targetDate`
- Días sin actividad: TSS = 0
- Resultado redondeado a 1 decimal

#### `calculateATL(activities, targetDate): number`

**Acute Training Load (Fatigue)**: media exponencial ponderada de TSS con constante de 7 días.

```
ATL_hoy = ATL_ayer + (TSS_hoy - ATL_ayer) / 7
```

- Misma mecánica que CTL pero con ventana de 7 días
- Resultado redondeado a 1 decimal

#### `calculateTrainingLoad(activities, targetDate): TrainingLoad`

**Función principal** que devuelve CTL, ATL y TSB en una sola llamada.

```
TSB = CTL - ATL
```

- TSB positivo → buena forma, listo para competir
- TSB negativo → fatiga acumulada, necesita recuperación
- TSB muy negativo (< -30) → riesgo de sobreentrenamiento

#### `calculateWeeklyTSS(activities, weekStartDate): number`

Suma de TSS de actividades en una semana (lunes a domingo).

- Útil para cálculos de overload existentes en `insights.service.ts`

---

## 4. Reglas de Alerta (`training-rules.ts`)

### 4.1 Tipos

```typescript
export type AlertLevel = "none" | "warning" | "critical";

export interface TrainingAlert {
  type: "overload" | "rest_needed" | "detraining" | "ramp_rate";
  level: AlertLevel;
  message: string;
}
```

### 4.2 Reglas

#### `checkOverloadAlert(weeklyTSS, avgWeeklyTSS): TrainingAlert`

Alerta de sobrecarga semanal (ya implementada inline en `insights.service.ts`).

| Condición | Level | Tipo |
|-----------|-------|------|
| `weeklyTSS >= 1.5 × avg` | `critical` | `overload` |
| `weeklyTSS >= 1.2 × avg` | `warning` | `overload` |
| Otherwise | `none` | `overload` |

Si `avgWeeklyTSS === 0`: siempre retorna `"none"`.

#### `checkRestAlert(recentActivities): TrainingAlert`

Alerta de descanso urgente: 3+ días consecutivos de intensidad alta.

**Criterio de "intensidad alta"**:
- `tss >= 80` para una sesión individual, O
- `rpe >= 8` si disponible

| Condición | Level | Tipo |
|-----------|-------|------|
| 4+ días consecutivos intensos | `critical` | `rest_needed` |
| 3 días consecutivos intensos | `warning` | `rest_needed` |
| Otherwise | `none` | `rest_needed` |

#### `checkDetrainingAlert(tsb, lastActivityDate, today): TrainingAlert`

Alerta de pérdida de forma.

| Condición | Level | Tipo |
|-----------|-------|------|
| Sin actividad en 10+ días | `critical` | `detraining` |
| Sin actividad en 7+ días | `warning` | `detraining` |
| TSB > 25 (demasiado descanso) | `warning` | `detraining` |
| Otherwise | `none` | `detraining` |

#### `checkRampRateAlert(ctlCurrent, ctlPrevWeek): TrainingAlert`

Alerta de progresión excesiva: incremento de CTL > 7 puntos/semana.

| Condición | Level | Tipo |
|-----------|-------|------|
| CTL delta > 10/semana | `critical` | `ramp_rate` |
| CTL delta > 7/semana | `warning` | `ramp_rate` |
| Otherwise | `none` | `ramp_rate` |

#### `evaluateTrainingAlerts(params): TrainingAlert[]`

**Función principal** que ejecuta todas las reglas y retorna solo las alertas con `level !== "none"`.

```typescript
interface AlertParams {
  weeklyTSS: number;
  avgWeeklyTSS: number;
  recentActivities: Array<{ date: string; tss: number | null; rpe: number | null }>;
  trainingLoad: TrainingLoad;
  ctlPreviousWeek: number;
  lastActivityDate: string | null;
  today: string;
}
```

---

## 5. Extensión de Zonas

### 5.1 `classifyActivityZone(avgPower, ftp): string`

Determina la zona dominante de una actividad basándose en potencia media vs FTP.

Utiliza `POWER_ZONES` de `constants/zones.ts` existente:

```typescript
function classifyActivityZone(avgPower: number | null, ftp: number | null): string | null {
  if (!avgPower || !ftp) return null;
  const ratio = avgPower / ftp;
  // Buscar en POWER_ZONES la zona donde minPct <= ratio <= maxPct
  const zone = POWER_ZONES.find(z => ratio >= z.minPct && ratio <= z.maxPct);
  return zone?.zone ?? null;
}
```

No se crea archivo nuevo — se añade a `training-calculations.ts` ya que es una función de cálculo.

---

## 6. Exports desde `packages/shared/src/index.ts`

```typescript
// Training calculations
export {
  calculateIF,
  calculateTSS,
  calculateCTL,
  calculateATL,
  calculateTrainingLoad,
  calculateWeeklyTSS,
  classifyActivityZone,
  type ActivityInput as TrainingActivityInput,
  type TrainingLoad,
} from "./utils/training-calculations";

// Training rules
export {
  checkOverloadAlert,
  checkRestAlert,
  checkDetrainingAlert,
  checkRampRateAlert,
  evaluateTrainingAlerts,
  type AlertLevel,
  type TrainingAlert,
} from "./utils/training-rules";
```

---

## 7. Testing

### 7.1 `training-calculations.test.ts` (~15 tests)

**calculateIF**:
1. IF correcto para 200W / 250W FTP → 0.8
2. IF = 0 cuando avgPower es null
3. IF = 0 cuando ftp es 0

**calculateTSS**:
4. TSS correcto: 200W, 250W FTP, 1h → 64
5. TSS correcto: 300W, 250W FTP, 1.5h → 216
6. TSS = 0 cuando avgPower es null
7. TSS redondeado a entero

**calculateCTL/ATL**:
8. CTL con 42 días de TSS=100 → converge cerca de 100
9. ATL con 7 días de TSS=100 → converge más rápido que CTL
10. ATL > CTL cuando hay carga reciente alta (fatiga > fitness)
11. Días sin actividad: TSS cuenta como 0

**calculateTrainingLoad**:
12. TSB positivo tras semana de descanso
13. TSB negativo tras semana intensa
14. Sin actividades → todo en 0

**calculateWeeklyTSS**:
15. Suma correcta de TSS en una semana

### 7.2 `training-rules.test.ts` (~10 tests)

**checkOverloadAlert**:
1. `none` cuando TSS semanal < 120% del promedio
2. `warning` cuando TSS semanal entre 120-149%
3. `critical` cuando TSS semanal ≥ 150%
4. `none` cuando avgWeeklyTSS = 0

**checkRestAlert**:
5. `warning` con 3 días consecutivos de TSS ≥ 80
6. `critical` con 4+ días consecutivos
7. `none` con 2 días consecutivos

**checkDetrainingAlert**:
8. `warning` sin actividad en 7+ días
9. `critical` sin actividad en 10+ días

**checkRampRateAlert**:
10. `warning` cuando CTL sube > 7 puntos/semana

---

## 8. Refactoring Futuro (No incluido en Bloque 4)

Tras implementar estas funciones puras en `shared`, el siguiente paso será:
- Refactorizar `activity.service.ts` para usar `calculateTSS()` de shared
- Refactorizar `insights.service.ts:checkOverload()` para usar `checkOverloadAlert()` de shared
- Ambos refactorings se harán cuando se migre el frontend (Bloque 8), para evitar cambios innecesarios ahora

---

## 9. Decisiones Técnicas (ADRs)

### ADR-010: Funciones puras en `packages/shared`

**Decisión**: Todas las funciones de cálculo son puras (sin side effects, sin I/O).

**Rationale**:
- Testeable sin mocks
- Reutilizable en backend y frontend
- La IA recibe estos cálculos como contexto precalculado, no los recalcula

### ADR-011: Media exponencial para CTL/ATL

**Decisión**: Usar EMA (Exponential Moving Average) estándar de ciclismo.

**Rationale**:
- CTL (42 días) y ATL (7 días) son estándares de la industria (TrainingPeaks, WKO5)
- Fórmula bien documentada y comprensible para ciclistas
- No requiere almacenar histórico completo — se puede calcular incrementalmente

### ADR-012: Alertas como funciones independientes

**Decisión**: Cada tipo de alerta es una función separada + una función agregadora.

**Rationale**:
- Testeable individualmente
- Extensible: añadir nuevas reglas sin modificar las existentes
- La función agregadora filtra y devuelve solo alertas activas

---

## 10. Criterios de Aceptación

- [ ] `calculateIF()` retorna ratio correcto avgPower/FTP
- [ ] `calculateTSS()` coincide con fórmula estándar IF² × hours × 100
- [ ] `calculateCTL()` converge correctamente con constante de 42 días
- [ ] `calculateATL()` converge correctamente con constante de 7 días
- [ ] `calculateTrainingLoad()` retorna CTL, ATL, TSB consistentes
- [ ] `checkOverloadAlert()` detecta sobrecarga en umbrales 120%/150%
- [ ] `checkRestAlert()` detecta 3+ días intensos consecutivos
- [ ] `checkDetrainingAlert()` detecta inactividad prolongada
- [ ] `checkRampRateAlert()` detecta progresión excesiva > 7 CTL/semana
- [ ] `evaluateTrainingAlerts()` agrega todas las alertas activas
- [ ] `classifyActivityZone()` clasifica zona correcta según power/FTP
- [ ] Todos los exports correctos desde `packages/shared/src/index.ts`
- [ ] ~25 tests pasando en `packages/shared`
- [ ] `pnpm typecheck` sin errores
- [ ] `pnpm lint` sin errores
