# Spec Fase 2: Frontend — Métricas Ampliadas

**PRD**: `docs/PRD-ADVANCED-METRICS.md`
**Prioridad**: P1
**Dependencia**: Fase 1 completada
**Impacto**: Bajo (solo modificar 1-2 archivos existentes)

---

## Objetivo

Mostrar las métricas avanzadas (v2) en la vista de detalle de actividad, sin romper la vista actual. Las actividades importadas antes de la Fase 1 seguirán mostrando "—" en los campos nuevos.

---

## 2.1 — Actualizar detalle de actividad

**Archivo**: `apps/web/src/app/(app)/activities/[id]/page.tsx`

### Ampliar `ActivityData`

```typescript
interface ActivityData {
  // ... campos existentes ...
  // Métricas v2 (nullable)
  duration_moving: number | null;
  normalized_power: number | null;
  max_power: number | null;
  max_speed: number | null;
  avg_speed: number | null;
  avg_power_non_zero: number | null;
  variability_index: number | null;
  intensity_factor: number | null;
  elevation_gain: number | null;
  avg_hr_moving: number | null;
  avg_cadence_moving: number | null;
}
```

### Nueva fila de métricas

Se añade una segunda fila de métricas **solo si hay datos v2** (es decir, si `duration_moving` o `normalized_power` no son null):

```typescript
const hasAdvancedMetrics = activity.duration_moving != null || activity.normalized_power != null;

const advancedMetrics: MetricItem[] = hasAdvancedMetrics ? [
  {
    icon: <Gauge className="h-3 w-3" style={{ color: "#3b82f6" }} />,
    label: "Vel. media",
    value: activity.avg_speed != null ? activity.avg_speed.toFixed(1) : "—",
    unit: activity.avg_speed != null ? "km/h" : "",
  },
  {
    icon: <Timer className="h-3 w-3" style={{ color: "#8b5cf6" }} />,
    label: "T. movimiento",
    value: activity.duration_moving != null ? formatDuration(activity.duration_moving) : "—",
    unit: "",
  },
  {
    icon: <Zap className="h-3 w-3" style={{ color: "#f97316" }} />,
    label: "NP",
    value: activity.normalized_power != null ? String(activity.normalized_power) : "—",
    unit: activity.normalized_power != null ? "W" : "",
  },
  {
    icon: <Zap className="h-3 w-3" style={{ color: "#ef4444" }} />,
    label: "Pot. máx.",
    value: activity.max_power != null ? String(activity.max_power) : "—",
    unit: activity.max_power != null ? "W" : "",
  },
  {
    icon: <Mountain className="h-3 w-3" style={{ color: "#22c55e" }} />,
    label: "Desnivel+",
    value: activity.elevation_gain != null ? String(activity.elevation_gain) : "—",
    unit: activity.elevation_gain != null ? "m" : "",
  },
  {
    icon: <TrendingUp className="h-3 w-3" style={{ color: "#eab308" }} />,
    label: "IF",
    value: activity.intensity_factor != null ? activity.intensity_factor.toFixed(2) : "—",
    unit: "",
  },
] : [];
```

### Renderizado

```tsx
<MetricsGrid metrics={metrics} />
{advancedMetrics.length > 0 && (
  <MetricsGrid metrics={advancedMetrics} />
)}
```

### Iconos necesarios

Añadir imports de Lucide React:
```typescript
import { Activity, Clock, Zap, Heart, TrendingUp, Gauge, Timer, Mountain } from "lucide-react";
```

Nota: `Gauge`, `Timer` y `Mountain` son iconos de Lucide React existentes. Verificar que están disponibles en la versión instalada.

---

## 2.2 — Actualizar métricas existentes con datos moving

Opcionalmente, se pueden mejorar las métricas de la primera fila para usar datos "moving" cuando estén disponibles:

| Métrica actual | Mejora |
|----------------|--------|
| "Cadencia" (avg_cadence_rpm) | Usar `avg_cadence_moving` si existe, fallback a `avg_cadence_rpm` |
| "FC" (avg_hr_bpm) | Mantener total (correcto fisiológicamente) |

```typescript
{
  label: "Cadencia",
  value: (activity.avg_cadence_moving ?? activity.avg_cadence_rpm) != null
    ? String(activity.avg_cadence_moving ?? activity.avg_cadence_rpm)
    : "—",
  unit: (activity.avg_cadence_moving ?? activity.avg_cadence_rpm) != null ? "rpm" : "",
},
```

---

## 2.3 — Potencia relativa W/kg (bonus, bajo esfuerzo)

Si el perfil del usuario tiene `weight_kg`, se puede calcular la potencia relativa en el frontend:

```typescript
// En la tarjeta de potencia media
const wPerKg = activity.avg_power_watts != null && userWeight
  ? (activity.avg_power_watts / userWeight).toFixed(1)
  : null;

// Mostrar como subtexto: "200 W (3.2 W/kg)"
```

Esto requiere acceso al peso del usuario. El layout de la app ya tiene acceso al perfil — evaluar si se pasa como prop o se hace un fetch adicional. **Bajo prioridad**: se puede implementar después.

---

## Verificación

```bash
pnpm build --filter=web   # Build limpio
pnpm lint --filter=web     # Sin errores ESLint
```

### Checklist visual
- [ ] Actividad importada con motor v2 → segunda fila de métricas visible
- [ ] Actividad importada antes de v2 → solo primera fila (sin segunda fila)
- [ ] Actividad creada manualmente → solo primera fila
- [ ] Todos los valores "—" donde corresponde (campos null)
- [ ] Responsive: métricas se adaptan en mobile (3 columnas) y desktop (6 columnas)
- [ ] Dark mode: iconos y texto legibles
