import type { TrackPoint } from "./types.js";

/** Mejor esfuerzo sostenido en una ventana de tiempo */
export interface BestEffort {
  windowSeconds: number;
  label: string;
  power: number;
}

/** Ventanas estándar de best efforts (TrainingPeaks/Intervals.icu) */
const EFFORT_WINDOWS = [
  { seconds: 5, label: "5s" },
  { seconds: 20, label: "20s" },
  { seconds: 60, label: "1 min" },
  { seconds: 300, label: "5 min" },
  { seconds: 1200, label: "20 min" },
] as const;

/**
 * Calcula la potencia máxima sostenida para cada ventana estándar.
 * Algoritmo: sliding window con suma acumulada — O(n) por ventana.
 * Solo calcula ventanas cuya duración <= longitud de la serie.
 * Retorna array vacío si no hay datos de potencia.
 */
export function computeBestEfforts(points: TrackPoint[]): BestEffort[] {
  const powerSeries = points.map((p) => p.power ?? 0);
  const hasPowerData = points.some((p) => p.power !== null);

  if (!hasPowerData || powerSeries.length === 0) return [];

  const results: BestEffort[] = [];

  for (const window of EFFORT_WINDOWS) {
    if (powerSeries.length < window.seconds) continue;

    const maxAvg = slidingWindowMax(powerSeries, window.seconds);
    if (maxAvg > 0) {
      results.push({
        windowSeconds: window.seconds,
        label: window.label,
        power: Math.round(maxAvg),
      });
    }
  }

  return results;
}

/**
 * Máxima media en una ventana deslizante de tamaño windowSize.
 * O(n) con suma acumulada.
 */
function slidingWindowMax(series: number[], windowSize: number): number {
  let windowSum = 0;
  let maxAvg = 0;

  for (let i = 0; i < series.length; i++) {
    windowSum += series[i];

    if (i >= windowSize) {
      windowSum -= series[i - windowSize];
    }

    if (i >= windowSize - 1) {
      const avg = windowSum / windowSize;
      if (avg > maxAvg) {
        maxAvg = avg;
      }
    }
  }

  return maxAvg;
}
