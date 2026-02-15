import type { ComparisonMetric, RadarDimension, InsightsAnalysis } from "shared";
import { supabaseAdmin } from "./supabase.js";
import { AppError } from "../plugins/error-handler.js";

interface ActivityRow {
  date: string;
  duration_seconds: number;
  distance_km: number | null;
  avg_power_watts: number | null;
  avg_hr_bpm: number | null;
  tss: number | null;
}

interface PeriodMetrics {
  distanceKm: number;
  durationHours: number;
  avgPower: number | null;
  avgHR: number | null;
  totalTSS: number;
  sessionCount: number;
}

export interface InsightsResult {
  comparison: ComparisonMetric[];
  radar: RadarDimension[];
  analysis: InsightsAnalysis | null;
}

export interface OverloadResult {
  currentLoad: number;
  avgLoad: number;
  percentage: number;
  is_overloaded: boolean;
  alert_level: "none" | "warning" | "critical";
}

const ACTIVITY_SELECT = "date, duration_seconds, distance_km, avg_power_watts, avg_hr_bpm, tss";

function calculatePeriodMetrics(activities: ActivityRow[]): PeriodMetrics {
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

function buildComparisonMetrics(a: PeriodMetrics, b: PeriodMetrics): ComparisonMetric[] {
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
    { metric: "TSS", valueA: a.totalTSS, valueB: b.totalTSS, unit: "", color: "#eab308" },
    {
      metric: "Sesiones",
      valueA: a.sessionCount,
      valueB: b.sessionCount,
      unit: "",
      color: "#22c55e",
    },
  ];
}

function calculateRadarDimensions(a: PeriodMetrics, b: PeriodMetrics): RadarDimension[] {
  const normalize = (value: number, cap: number) => Math.min(Math.round((value / cap) * 100), 100);

  const volumenA = normalize(a.distanceKm, 200);
  const volumenB = normalize(b.distanceKm, 200);

  const intensidadA = normalize(a.avgPower ?? 0, 300);
  const intensidadB = normalize(b.avgPower ?? 0, 300);

  const consistenciaA = normalize(a.sessionCount, 7);
  const consistenciaB = normalize(b.sessionCount, 7);

  const tssPerSessionA = a.sessionCount > 0 ? a.totalTSS / a.sessionCount : 0;
  const tssPerSessionB = b.sessionCount > 0 ? b.totalTSS / b.sessionCount : 0;
  const recuperacionA = Math.max(0, Math.round(100 - (tssPerSessionA / 150) * 100));
  const recuperacionB = Math.max(0, Math.round(100 - (tssPerSessionB / 150) * 100));

  const powerDelta = (b.avgPower ?? 0) - (a.avgPower ?? 0);
  const progresionA = 50;
  const progresionB = Math.min(100, Math.max(0, Math.round(50 + powerDelta)));

  return [
    { metric: "Volumen", A: volumenA, B: volumenB },
    { metric: "Intensidad", A: intensidadA, B: intensidadB },
    { metric: "Consistencia", A: consistenciaA, B: consistenciaB },
    { metric: "Recuperación", A: recuperacionA, B: recuperacionB },
    { metric: "Progresión", A: progresionA, B: progresionB },
  ];
}

function generateSimpleAnalysis(a: PeriodMetrics, b: PeriodMetrics): InsightsAnalysis | null {
  if (a.sessionCount === 0 && b.sessionCount === 0) {
    return null;
  }

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

  let alert: string | undefined;
  if (a.totalTSS > 0) {
    const tssChange = ((b.totalTSS - a.totalTSS) / a.totalTSS) * 100;
    if (tssChange > 15) {
      alert = `Tu carga de entrenamiento (TSS) ha aumentado un ${Math.round(tssChange)}%. Vigila la recuperación para evitar sobreentrenamiento.`;
    }
  }

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

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getInsights(
  userId: string,
  periodAStart: string,
  periodAEnd: string,
  periodBStart: string,
  periodBEnd: string,
): Promise<InsightsResult> {
  const [resultA, resultB] = await Promise.all([
    supabaseAdmin
      .from("activities")
      .select(ACTIVITY_SELECT)
      .eq("user_id", userId)
      .gte("date", periodAStart)
      .lte("date", periodAEnd),
    supabaseAdmin
      .from("activities")
      .select(ACTIVITY_SELECT)
      .eq("user_id", userId)
      .gte("date", periodBStart)
      .lte("date", periodBEnd),
  ]);

  if (resultA.error) {
    throw new AppError(
      `Failed to fetch period A activities: ${resultA.error.message}`,
      500,
      "DATABASE_ERROR",
    );
  }

  if (resultB.error) {
    throw new AppError(
      `Failed to fetch period B activities: ${resultB.error.message}`,
      500,
      "DATABASE_ERROR",
    );
  }

  const activitiesA = (resultA.data ?? []) as ActivityRow[];
  const activitiesB = (resultB.data ?? []) as ActivityRow[];

  const metricsA = calculatePeriodMetrics(activitiesA);
  const metricsB = calculatePeriodMetrics(activitiesB);

  const comparison = buildComparisonMetrics(metricsA, metricsB);
  const radar = calculateRadarDimensions(metricsA, metricsB);
  const analysis = generateSimpleAnalysis(metricsA, metricsB);

  return { comparison, radar, analysis };
}

export async function checkOverload(userId: string): Promise<OverloadResult> {
  const now = new Date();
  const weekStart = getWeekStart(now);
  const weekStartStr = weekStart.toISOString().split("T")[0];

  const fourWeeksAgo = new Date(weekStart);
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const fourWeeksAgoStr = fourWeeksAgo.toISOString().split("T")[0];

  const yesterdayOfWeekStart = new Date(weekStart);
  yesterdayOfWeekStart.setDate(yesterdayOfWeekStart.getDate() - 1);
  const yesterdayStr = yesterdayOfWeekStart.toISOString().split("T")[0];

  const [currentResult, prevResult] = await Promise.all([
    supabaseAdmin
      .from("activities")
      .select(ACTIVITY_SELECT)
      .eq("user_id", userId)
      .gte("date", weekStartStr),
    supabaseAdmin
      .from("activities")
      .select(ACTIVITY_SELECT)
      .eq("user_id", userId)
      .gte("date", fourWeeksAgoStr)
      .lte("date", yesterdayStr),
  ]);

  if (currentResult.error) {
    throw new AppError(
      `Failed to fetch current week activities: ${currentResult.error.message}`,
      500,
      "DATABASE_ERROR",
    );
  }

  if (prevResult.error) {
    throw new AppError(
      `Failed to fetch previous activities: ${prevResult.error.message}`,
      500,
      "DATABASE_ERROR",
    );
  }

  const currentActivities = (currentResult.data ?? []) as ActivityRow[];
  const prevActivities = (prevResult.data ?? []) as ActivityRow[];

  const currentLoad = currentActivities.reduce((sum, a) => sum + (a.tss ?? 0), 0);

  // Calculate TSS per week for the 4 previous weeks
  const weekLoads: number[] = [];
  for (let i = 1; i <= 4; i++) {
    const wStart = new Date(weekStart);
    wStart.setDate(wStart.getDate() - 7 * i);
    const wEnd = new Date(wStart);
    wEnd.setDate(wEnd.getDate() + 7);

    const load = prevActivities
      .filter((a) => {
        const d = new Date(a.date);
        return d >= wStart && d < wEnd;
      })
      .reduce((sum, a) => sum + (a.tss ?? 0), 0);

    weekLoads.push(load);
  }

  const avgLoad =
    weekLoads.length > 0 ? Math.round(weekLoads.reduce((s, v) => s + v, 0) / weekLoads.length) : 0;

  if (avgLoad === 0) {
    return { currentLoad, avgLoad: 0, percentage: 0, is_overloaded: false, alert_level: "none" };
  }

  const percentage = Math.round((currentLoad / avgLoad) * 100);
  const is_overloaded = percentage >= 120;
  const alert_level: OverloadResult["alert_level"] =
    percentage >= 150 ? "critical" : percentage >= 120 ? "warning" : "none";

  return { currentLoad, avgLoad, percentage, is_overloaded, alert_level };
}
