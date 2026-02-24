import { type TrackPoint, METRICS_THRESHOLDS } from "./types.js";
import { haversineDistance } from "./haversine.js";

/**
 * Calcula velocidad para cada TrackPoint usando Haversine entre consecutivos.
 * - Primer punto: speed = 0
 * - Velocidades > 100 km/h -> speed = 0 (aberracion GPS)
 * Devuelve copia — no muta el original.
 */
export function computeSpeed(points: TrackPoint[]): TrackPoint[] {
  if (points.length === 0) return [];

  return points.map((point, i) => {
    if (i === 0) {
      return { ...point, speed: 0 };
    }

    const prev = points[i - 1];
    const distanceM = haversineDistance(prev.lat, prev.lon, point.lat, point.lon);
    const deltaTSeconds = (point.timestamp - prev.timestamp) / 1000;
    const speedKmh = deltaTSeconds > 0 ? (distanceM / deltaTSeconds) * 3.6 : 0;

    return {
      ...point,
      speed: speedKmh > METRICS_THRESHOLDS.MAX_SPEED_KMH ? 0 : speedKmh,
    };
  });
}
