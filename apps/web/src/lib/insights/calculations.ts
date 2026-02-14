export interface ActivityRow {
  date: string;
  duration_seconds: number;
  distance_km: number | null;
  avg_power_watts: number | null;
  avg_hr_bpm: number | null;
  tss: number | null;
}

export interface PeriodMetrics {
  distanceKm: number;
  durationHours: number;
  avgPower: number | null;
  avgHR: number | null;
  totalTSS: number;
  sessionCount: number;
}

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

/**
 * Calcula métricas agregadas para un periodo de actividades
 */
export function calculatePeriodMetrics(activities: ActivityRow[]): PeriodMetrics {
  const distanceKm =
    Math.round(activities.reduce((sum, a) => sum + (a.distance_km ?? 0), 0) * 10) / 10;

  const durationHours =
    Math.round((activities.reduce((sum, a) => sum + a.duration_seconds, 0) / 3600) * 10) / 10;

  const powerValues = activities
    .map((a) => a.avg_power_watts)
    .filter((v): v is number => v != null);
  const avgPower =
    powerValues.length > 0
      ? Math.round(powerValues.reduce((sum, v) => sum + v, 0) / powerValues.length)
      : null;

  const hrValues = activities.map((a) => a.avg_hr_bpm).filter((v): v is number => v != null);
  const avgHR =
    hrValues.length > 0
      ? Math.round(hrValues.reduce((sum, v) => sum + v, 0) / hrValues.length)
      : null;

  const totalTSS = activities.reduce((sum, a) => sum + (a.tss ?? 0), 0);

  return {
    distanceKm,
    durationHours,
    avgPower,
    avgHR,
    totalTSS,
    sessionCount: activities.length,
  };
}

/**
 * Construye las 6 métricas de comparación entre dos periodos
 */
export function buildComparisonMetrics(a: PeriodMetrics, b: PeriodMetrics): ComparisonMetric[] {
  return [
    {
      metric: "Distancia",
      valueA: a.distanceKm,
      valueB: b.distanceKm,
      unit: "km",
      color: "#3b82f6",
    },
    {
      metric: "Tiempo",
      valueA: a.durationHours,
      valueB: b.durationHours,
      unit: "h",
      color: "#8b5cf6",
    },
    {
      metric: "Potencia",
      valueA: a.avgPower ?? 0,
      valueB: b.avgPower ?? 0,
      unit: "W",
      color: "#f97316",
    },
    {
      metric: "FC media",
      valueA: a.avgHR ?? 0,
      valueB: b.avgHR ?? 0,
      unit: "bpm",
      color: "#ef4444",
      inverse: true,
    },
    {
      metric: "TSS",
      valueA: a.totalTSS,
      valueB: b.totalTSS,
      unit: "",
      color: "#eab308",
    },
    {
      metric: "Sesiones",
      valueA: a.sessionCount,
      valueB: b.sessionCount,
      unit: "",
      color: "#22c55e",
    },
  ];
}

/**
 * Calcula 5 dimensiones de rendimiento normalizadas 0-100 para radar chart
 */
export function calculateRadarDimensions(a: PeriodMetrics, b: PeriodMetrics): RadarDimension[] {
  const normalize = (value: number, cap: number) => Math.min(Math.round((value / cap) * 100), 100);

  // Volumen: basado en distancia (cap 200km = 100)
  const volumenA = normalize(a.distanceKm, 200);
  const volumenB = normalize(b.distanceKm, 200);

  // Intensidad: basado en potencia media (cap 300W = 100)
  const intensidadA = normalize(a.avgPower ?? 0, 300);
  const intensidadB = normalize(b.avgPower ?? 0, 300);

  // Consistencia: basado en número de sesiones (cap 7 = 100)
  const consistenciaA = normalize(a.sessionCount, 7);
  const consistenciaB = normalize(b.sessionCount, 7);

  // Recuperación: inverso de densidad TSS (menor TSS por sesión = mejor recuperación)
  // TSS/sesión cap 150 = 0 recuperación, 0 = 100 recuperación
  const tssPerSessionA = a.sessionCount > 0 ? a.totalTSS / a.sessionCount : 0;
  const tssPerSessionB = b.sessionCount > 0 ? b.totalTSS / b.sessionCount : 0;
  const recuperacionA = Math.max(0, Math.round(100 - (tssPerSessionA / 150) * 100));
  const recuperacionB = Math.max(0, Math.round(100 - (tssPerSessionB / 150) * 100));

  // Progresión: basado en delta de potencia (positivo = bueno)
  // Normalize: 50 baseline, +50W delta = 100, -50W delta = 0
  const powerDelta = (b.avgPower ?? 0) - (a.avgPower ?? 0);
  const progresionA = 50; // baseline
  const progresionB = Math.min(100, Math.max(0, Math.round(50 + powerDelta)));

  return [
    { metric: "Volumen", A: volumenA, B: volumenB },
    { metric: "Intensidad", A: intensidadA, B: intensidadB },
    { metric: "Consistencia", A: consistenciaA, B: consistenciaB },
    { metric: "Recuperación", A: recuperacionA, B: recuperacionB },
    { metric: "Progresión", A: progresionA, B: progresionB },
  ];
}

/**
 * Genera un análisis simple comparativo entre dos periodos
 */
export function generateSimpleAnalysis(
  a: PeriodMetrics,
  b: PeriodMetrics,
): InsightsAnalysis | null {
  if (a.sessionCount === 0 && b.sessionCount === 0) {
    return null;
  }

  // Summary basado en cambio de potencia y distancia
  const parts: string[] = [];

  if (a.avgPower != null && b.avgPower != null && a.avgPower > 0) {
    const powerChange = ((b.avgPower - a.avgPower) / a.avgPower) * 100;
    if (Math.abs(powerChange) >= 1) {
      parts.push(
        powerChange > 0
          ? `Tu potencia media ha subido un ${Math.abs(Math.round(powerChange))}%, lo que indica buena adaptación al entrenamiento.`
          : `Tu potencia media ha bajado un ${Math.abs(Math.round(powerChange))}%. Puede ser fatiga acumulada o falta de intensidad.`,
      );
    }
  }

  if (a.distanceKm > 0) {
    const distChange = ((b.distanceKm - a.distanceKm) / a.distanceKm) * 100;
    if (Math.abs(distChange) >= 5) {
      parts.push(
        distChange > 0
          ? `Has aumentado el volumen un ${Math.abs(Math.round(distChange))}% respecto a la semana anterior.`
          : `El volumen ha disminuido un ${Math.abs(Math.round(distChange))}% esta semana.`,
      );
    }
  }

  const summary =
    parts.length > 0
      ? parts.join(" ")
      : `Has completado ${b.sessionCount} sesión${b.sessionCount !== 1 ? "es" : ""} esta semana.`;

  // Alert si TSS sube más del 15%
  let alert: string | undefined;
  if (a.totalTSS > 0) {
    const tssChange = ((b.totalTSS - a.totalTSS) / a.totalTSS) * 100;
    if (tssChange > 15) {
      alert = `Tu carga de entrenamiento (TSS) ha aumentado un ${Math.round(tssChange)}%. Vigila la recuperación para evitar sobreentrenamiento.`;
    }
  }

  // Recommendation
  let recommendation: string;
  if (b.sessionCount === 0) {
    recommendation =
      "No tienes sesiones registradas esta semana. Intenta mantener al menos 3 entrenamientos semanales para sostener tu forma.";
  } else if (b.sessionCount < 3) {
    recommendation =
      "Intenta añadir una sesión más esta semana para mejorar la consistencia. La regularidad es clave para el progreso.";
  } else {
    recommendation =
      "Buen ritmo de entrenamiento. Mantén la alternancia entre sesiones intensas y de recuperación para optimizar las adaptaciones.";
  }

  return { summary, alert, recommendation };
}
