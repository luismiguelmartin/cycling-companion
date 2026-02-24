import { type TrackPoint, METRICS_THRESHOLDS } from "./types.js";

/**
 * Potencia media total (incluyendo ceros).
 * power null se trata como 0.
 * Retorna null si NO hay ningún punto con power != null.
 */
export function avgPower(points: TrackPoint[]): number | null {
  if (points.length === 0) return null;

  const hasPowerData = points.some((p) => p.power !== null);
  if (!hasPowerData) return null;

  const sum = points.reduce((acc, p) => acc + (p.power ?? 0), 0);
  return sum / points.length;
}

/**
 * Potencia media excluyendo ceros y nulls.
 * Retorna null si no hay datos > 0.
 */
export function avgPowerNonZero(points: TrackPoint[]): number | null {
  const validPowers = points.map((p) => p.power).filter((p): p is number => p !== null && p > 0);

  if (validPowers.length === 0) return null;

  const sum = validPowers.reduce((acc, p) => acc + p, 0);
  return sum / validPowers.length;
}

/**
 * Potencia máxima.
 * Retorna null si no hay datos de potencia (todos null).
 */
export function maxPower(points: TrackPoint[]): number | null {
  const validPowers = points.map((p) => p.power).filter((p): p is number => p !== null);

  if (validPowers.length === 0) return null;

  return Math.max(...validPowers);
}

/**
 * Normalized Power (NP) - Algoritmo de Coggan sobre serie resampleada a 1Hz.
 *
 * 1. Extraer serie de potencia (null -> 0)
 * 2. Rolling average 30 segundos (ventana de 30 muestras a 1Hz)
 * 3. Elevar cada valor a 4a potencia
 * 4. Media de todos los valores
 * 5. Raiz 4a
 *
 * Retorna null si:
 * - No hay datos de potencia (todos null)
 * - Duracion < MIN_DURATION_FOR_NP_SECONDS (600s = 10min)
 * - Menos de 30 muestras
 */
export function normalizedPower(points: TrackPoint[]): number | null {
  const hasPowerData = points.some((p) => p.power !== null);
  if (!hasPowerData) return null;

  const powerSeries = points.map((p) => p.power ?? 0);

  if (powerSeries.length < METRICS_THRESHOLDS.MIN_DURATION_FOR_NP_SECONDS) return null;
  if (powerSeries.length < 30) return null;

  // Rolling average 30s
  const windowSize = 30;
  const rollingAvg: number[] = [];
  let windowSum = 0;

  for (let i = 0; i < powerSeries.length; i++) {
    windowSum += powerSeries[i];
    if (i >= windowSize) {
      windowSum -= powerSeries[i - windowSize];
    }
    if (i >= windowSize - 1) {
      rollingAvg.push(windowSum / windowSize);
    }
  }

  // 4th power average
  let fourthPowerSum = 0;
  for (const v of rollingAvg) {
    fourthPowerSum += v ** 4;
  }
  const fourthPowerAvg = fourthPowerSum / rollingAvg.length;

  // Root
  return Math.round(fourthPowerAvg ** 0.25);
}

/**
 * Variability Index = NP / avg_power.
 * Retorna NaN si avgPow = 0 (division por cero).
 */
export function variabilityIndex(np: number, avgPow: number): number {
  return np / avgPow;
}
