import { type TrackPoint, METRICS_THRESHOLDS } from "./types.js";

/**
 * Ordena por timestamp ascendente y elimina duplicados (mantiene el primero).
 * Devuelve copia — no muta el original.
 */
export function sortAndDeduplicate(points: TrackPoint[]): TrackPoint[] {
  const sorted = [...points].sort((a, b) => a.timestamp - b.timestamp);

  const seen = new Set<number>();
  const result: TrackPoint[] = [];

  for (const point of sorted) {
    if (!seen.has(point.timestamp)) {
      seen.add(point.timestamp);
      result.push({ ...point });
    }
  }

  return result;
}

/**
 * Interpola linealmente un valor numérico entre dos puntos.
 */
function lerp(a: number, b: number, ratio: number): number {
  return a + (b - a) * ratio;
}

/**
 * Interpola elevation teniendo en cuenta nulls.
 * Si uno de los dos es null, usa el valor del otro.
 * Si ambos son null, devuelve null.
 */
function interpolateElevation(
  elevA: number | null,
  elevB: number | null,
  ratio: number,
): number | null {
  if (elevA === null && elevB === null) return null;
  if (elevA === null) return elevB;
  if (elevB === null) return elevA;
  return lerp(elevA, elevB, ratio);
}

/**
 * Resamplea una serie de TrackPoints a intervalos de 1 segundo (1Hz).
 *
 * - Interpolacion lineal: lat, lon, elevation
 * - Forward-fill: power, hr, cadence (mantener valor del punto anterior/izquierdo)
 * - Gaps >= 30s: insertar puntos con power=0, hr=null, cadence=0, elevation=null
 *
 * Prerequisito: points DEBEN estar ordenados por timestamp.
 */
export function resampleTo1Hz(points: TrackPoint[]): TrackPoint[] {
  if (points.length === 0) return [];
  if (points.length === 1) return [{ ...points[0] }];

  const startTs = points[0].timestamp;
  const endTs = points[points.length - 1].timestamp;
  const result: TrackPoint[] = [];

  // Pointer into the original points array: tracks the "left" bracket point
  let leftIdx = 0;

  for (let targetTs = startTs; targetTs <= endTs; targetTs += 1000) {
    // Advance leftIdx so that points[leftIdx] is the last point with timestamp <= targetTs
    while (leftIdx < points.length - 1 && points[leftIdx + 1].timestamp <= targetTs) {
      leftIdx++;
    }

    const prev = points[leftIdx];

    // Exact match — use point directly
    if (prev.timestamp === targetTs) {
      result.push({ ...prev });
      continue;
    }

    // Find right bracket: next point after prev
    const rightIdx = leftIdx + 1;

    // Safety: if no right point exists (shouldn't happen with targetTs <= endTs, but be safe)
    if (rightIdx >= points.length) {
      result.push({ ...prev, timestamp: targetTs });
      continue;
    }

    const next = points[rightIdx];
    const gapSeconds = (next.timestamp - prev.timestamp) / 1000;

    if (gapSeconds >= METRICS_THRESHOLDS.MAX_GAP_INTERPOLATION_SECONDS) {
      // Large gap: insert degraded point
      const ratio = (targetTs - prev.timestamp) / (next.timestamp - prev.timestamp);
      result.push({
        timestamp: targetTs,
        lat: lerp(prev.lat, next.lat, ratio),
        lon: lerp(prev.lon, next.lon, ratio),
        elevation: null,
        power: 0,
        hr: null,
        cadence: 0,
      });
    } else {
      // Small gap: interpolate position, forward-fill sensors
      const ratio = (targetTs - prev.timestamp) / (next.timestamp - prev.timestamp);
      result.push({
        timestamp: targetTs,
        lat: lerp(prev.lat, next.lat, ratio),
        lon: lerp(prev.lon, next.lon, ratio),
        elevation: interpolateElevation(prev.elevation, next.elevation, ratio),
        power: prev.power,
        hr: prev.hr,
        cadence: prev.cadence,
      });
    }
  }

  return result;
}
