import { POWER_ZONES } from "../constants/zones";

/** Entrada mínima de actividad para cálculos de carga */
export interface TrainingActivityInput {
  date: string;
  duration_seconds: number;
  avg_power_watts: number | null;
  tss: number | null;
}

/** Resultado del cálculo de forma/fatiga */
export interface TrainingLoad {
  ctl: number;
  atl: number;
  tsb: number;
}

/**
 * Intensity Factor: ratio entre potencia media y FTP.
 * Típicamente entre 0.5 (recuperación) y 1.3 (sprint).
 */
export function calculateIF(avgPower: number | null, ftp: number | null): number {
  if (!avgPower || !ftp) return 0;
  return avgPower / ftp;
}

/**
 * Training Stress Score: medida de carga de una sesión.
 * TSS = IF² × duration_hours × 100
 */
export function calculateTSS(
  avgPower: number | null,
  ftp: number | null,
  durationSeconds: number,
): number {
  const intensityFactor = calculateIF(avgPower, ftp);
  if (intensityFactor === 0) return 0;
  const durationHours = durationSeconds / 3600;
  return Math.round(intensityFactor * intensityFactor * durationHours * 100);
}

/**
 * Agrupa TSS por día (YYYY-MM-DD) para cálculos de EMA.
 * Si hay múltiples actividades en un día, suma el TSS.
 */
function buildDailyTSSMap(activities: TrainingActivityInput[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const a of activities) {
    const day = a.date.slice(0, 10);
    map.set(day, (map.get(day) ?? 0) + (a.tss ?? 0));
  }
  return map;
}

/**
 * Genera array de días entre start y end (inclusive), formato YYYY-MM-DD.
 */
function dayRange(start: Date, end: Date): string[] {
  const days: string[] = [];
  const current = new Date(start);
  while (current <= end) {
    days.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }
  return days;
}

/**
 * Calcula EMA (Exponential Moving Average) de TSS con una constante de tiempo dada.
 * Itera día a día desde la primera actividad hasta targetDate.
 */
function calculateEMA(
  activities: TrainingActivityInput[],
  targetDate: string,
  timeConstant: number,
): number {
  if (activities.length === 0) return 0;

  const dailyTSS = buildDailyTSSMap(activities);

  const sortedDates = [...dailyTSS.keys()].sort();
  const firstDate = new Date(sortedDates[0]);
  const endDate = new Date(targetDate);

  if (endDate < firstDate) return 0;

  const days = dayRange(firstDate, endDate);
  let ema = 0;

  for (const day of days) {
    const tss = dailyTSS.get(day) ?? 0;
    ema = ema + (tss - ema) / timeConstant;
  }

  return Math.round(ema * 10) / 10;
}

/**
 * Chronic Training Load (Fitness): EMA de TSS con constante de 42 días.
 * Representa la aptitud física acumulada.
 */
export function calculateCTL(activities: TrainingActivityInput[], targetDate: string): number {
  return calculateEMA(activities, targetDate, 42);
}

/**
 * Acute Training Load (Fatigue): EMA de TSS con constante de 7 días.
 * Representa la fatiga reciente.
 */
export function calculateATL(activities: TrainingActivityInput[], targetDate: string): number {
  return calculateEMA(activities, targetDate, 7);
}

/**
 * Training Load completo: CTL, ATL y TSB en una sola llamada.
 * TSB = CTL - ATL (positivo → buena forma, negativo → fatiga).
 */
export function calculateTrainingLoad(
  activities: TrainingActivityInput[],
  targetDate: string,
): TrainingLoad {
  const ctl = calculateCTL(activities, targetDate);
  const atl = calculateATL(activities, targetDate);
  const tsb = Math.round((ctl - atl) * 10) / 10;
  return { ctl, atl, tsb };
}

/**
 * Suma de TSS en una semana (lunes a domingo).
 * @param weekStartDate - Fecha del lunes en formato YYYY-MM-DD
 */
export function calculateWeeklyTSS(
  activities: TrainingActivityInput[],
  weekStartDate: string,
): number {
  const start = new Date(weekStartDate);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  const startStr = start.toISOString().slice(0, 10);
  const endStr = end.toISOString().slice(0, 10);

  return activities
    .filter((a) => {
      const day = a.date.slice(0, 10);
      return day >= startStr && day <= endStr;
    })
    .reduce((sum, a) => sum + (a.tss ?? 0), 0);
}

/**
 * Clasifica la zona dominante de una actividad según potencia media vs FTP.
 * Usa POWER_ZONES de constants/zones.ts.
 */
export function classifyActivityZone(
  avgPower: number | null,
  ftp: number | null,
): string | null {
  if (!avgPower || !ftp) return null;
  const ratio = avgPower / ftp;
  const zone = POWER_ZONES.find((z) => ratio >= z.minPct && ratio <= z.maxPct);
  return zone?.zone ?? null;
}
