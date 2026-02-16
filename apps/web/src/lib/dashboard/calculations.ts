interface ActivityData {
  date: string;
  duration_seconds: number;
  distance_km: number | null;
  avg_power_watts: number | null;
  avg_hr_bpm: number | null;
  tss: number | null;
}

export interface WeeklyKPIs {
  distanceKm: number;
  durationSeconds: number;
  avgPower: number | null;
  avgHR: number | null;
  activityCount: number;
}

export interface Trend {
  direction: "up" | "down";
  percentage: number;
}

/**
 * Calcula KPIs para actividades dentro de un rango de fechas
 */
export function calculateWeeklyKPIs(
  activities: ActivityData[],
  startDate: Date,
  endDate: Date,
): WeeklyKPIs {
  const filtered = activities.filter((a) => {
    const d = new Date(a.date);
    return d >= startDate && d <= endDate;
  });

  const distanceKm = filtered.reduce((sum, a) => sum + (a.distance_km ?? 0), 0);
  const durationSeconds = filtered.reduce((sum, a) => sum + a.duration_seconds, 0);

  const powerValues = filtered.map((a) => a.avg_power_watts).filter((v): v is number => v != null);
  const hrValues = filtered.map((a) => a.avg_hr_bpm).filter((v): v is number => v != null);

  const avgPower =
    powerValues.length > 0
      ? Math.round(powerValues.reduce((sum, v) => sum + v, 0) / powerValues.length)
      : null;

  const avgHR =
    hrValues.length > 0
      ? Math.round(hrValues.reduce((sum, v) => sum + v, 0) / hrValues.length)
      : null;

  return {
    distanceKm: Math.round(distanceKm * 10) / 10,
    durationSeconds,
    avgPower,
    avgHR,
    activityCount: filtered.length,
  };
}

/**
 * Calcula tendencias comparando semana actual vs anterior.
 * Para FC, la lógica se invierte: bajar FC es positivo.
 */
export function calculateTrends(
  current: WeeklyKPIs,
  previous: WeeklyKPIs,
): Record<string, Trend | null> {
  function trend(curr: number | null, prev: number | null, invertPositive = false): Trend | null {
    if (curr == null || prev == null || curr === 0 || prev === 0) return null;
    const change = ((curr - prev) / prev) * 100;
    const percentage = Math.abs(Math.round(change));
    if (percentage === 0) return null;

    const rawDirection = change > 0 ? "up" : "down";
    const direction = invertPositive ? (rawDirection === "up" ? "down" : "up") : rawDirection;

    return { direction, percentage };
  }

  return {
    distance: trend(current.distanceKm, previous.distanceKm),
    duration: trend(current.durationSeconds, previous.durationSeconds),
    power: trend(current.avgPower, previous.avgPower),
    hr: trend(current.avgHR, previous.avgHR, true),
  };
}

/**
 * Agrupa actividades por semana y calcula promedios de potencia y FC.
 * Usa year*100+weekNum como clave para ordenar correctamente entre años
 * (ej: semana 52 de 2025 antes de semana 1 de 2026).
 */
export function calculateWeeklyTrend(
  activities: ActivityData[],
): Array<{ week: string; power: number; hr: number }> {
  const weekMap = new Map<number, { powers: number[]; hrs: number[] }>();

  for (const activity of activities) {
    const actDate = new Date(activity.date);
    const weekNum = getWeekNumber(actDate);
    // Usar año ISO (del jueves de esa semana) para manejar año-frontera
    const d = new Date(
      Date.UTC(actDate.getUTCFullYear(), actDate.getUTCMonth(), actDate.getUTCDate()),
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const isoYear = d.getUTCFullYear();
    const yearWeekKey = isoYear * 100 + weekNum;

    if (!weekMap.has(yearWeekKey)) {
      weekMap.set(yearWeekKey, { powers: [], hrs: [] });
    }
    const entry = weekMap.get(yearWeekKey)!;
    if (activity.avg_power_watts != null) entry.powers.push(activity.avg_power_watts);
    if (activity.avg_hr_bpm != null) entry.hrs.push(activity.avg_hr_bpm);
  }

  const sortedWeeks = [...weekMap.entries()].sort((a, b) => a[0] - b[0]);

  return sortedWeeks.map((entry, idx) => {
    const data = entry[1];
    return {
      week: `Sem ${idx + 1}`,
      power:
        data.powers.length > 0
          ? Math.round(data.powers.reduce((s, v) => s + v, 0) / data.powers.length)
          : 0,
      hr:
        data.hrs.length > 0 ? Math.round(data.hrs.reduce((s, v) => s + v, 0) / data.hrs.length) : 0,
    };
  });
}

/**
 * Calcula carga diaria (TSS) para una semana (L-D)
 */
export function calculateDailyLoad(
  activities: ActivityData[],
  weekStartDate: Date,
): Array<{ day: string; load: number }> {
  const days = ["L", "M", "X", "J", "V", "S", "D"];
  const result = days.map((day) => ({ day, load: 0 }));

  for (const activity of activities) {
    const actDate = new Date(activity.date);
    const diff = Math.floor((actDate.getTime() - weekStartDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diff >= 0 && diff < 7) {
      result[diff].load += activity.tss ?? 0;
    }
  }

  return result;
}

/**
 * Detecta sobrecarga comparando TSS semanal vs media de 4 semanas.
 * Retorna null si no hay sobrecarga (< 1.2x).
 * Usa UTC para consistencia con fechas de actividad ("YYYY-MM-DD" → UTC midnight).
 */
export function detectOverload(
  activities: ActivityData[],
): { currentLoad: number; avgLoad: number; percentage: number } | null {
  const now = new Date();
  const currentWeekStart = getWeekStart(now);

  // TSS de la semana actual
  const currentLoad = activities
    .filter((a) => new Date(a.date) >= currentWeekStart)
    .reduce((sum, a) => sum + (a.tss ?? 0), 0);

  // TSS por semana de las últimas 4 semanas (excluyendo la actual)
  const weekLoads: number[] = [];
  for (let i = 1; i <= 4; i++) {
    const weekStart = new Date(currentWeekStart.getTime());
    weekStart.setUTCDate(weekStart.getUTCDate() - 7 * i);
    const weekEnd = new Date(weekStart.getTime());
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);

    const load = activities
      .filter((a) => {
        const d = new Date(a.date);
        return d >= weekStart && d < weekEnd;
      })
      .reduce((sum, a) => sum + (a.tss ?? 0), 0);

    weekLoads.push(load);
  }

  const avgLoad =
    weekLoads.length > 0 ? Math.round(weekLoads.reduce((s, v) => s + v, 0) / weekLoads.length) : 0;

  if (avgLoad === 0 || currentLoad === 0) return null;

  const percentage = Math.round((currentLoad / avgLoad) * 100);
  if (percentage < 120) return null;

  return { currentLoad, avgLoad, percentage };
}

/**
 * Formatea duración en segundos a "Xh YYm"
 */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

/**
 * Obtiene el número de semana ISO del año.
 * Usa getUTC* para extraer componentes de fecha en UTC,
 * evitando desfases cuando la fecha proviene de new Date("YYYY-MM-DD").
 */
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Obtiene el lunes de la semana actual (UTC).
 * Usa métodos UTC para evitar discrepancias con new Date("YYYY-MM-DD")
 * que siempre devuelve medianoche UTC.
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  d.setUTCDate(diff);
  return d;
}

/**
 * Obtiene saludo según hora del día
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return "Buenos días";
  if (hour >= 12 && hour < 18) return "Buenas tardes";
  return "Buenas noches";
}
