import { type TrackPoint, METRICS_THRESHOLDS } from "./types.js";

/**
 * Limpia valores aberrantes de sensores, reemplazando con null.
 * Devuelve copia — no muta el original.
 */
export function sanitizeTrackPoints(points: TrackPoint[]): TrackPoint[] {
  return points.map((point) => {
    const sanitized = { ...point };

    if (sanitized.power !== null) {
      if (sanitized.power > METRICS_THRESHOLDS.MAX_POWER_WATTS || sanitized.power < 0) {
        sanitized.power = null;
      }
    }

    if (sanitized.hr !== null) {
      if (sanitized.hr > METRICS_THRESHOLDS.MAX_HR_BPM || sanitized.hr <= 0) {
        sanitized.hr = null;
      }
    }

    if (sanitized.cadence !== null) {
      if (sanitized.cadence < 0) {
        sanitized.cadence = null;
      }
    }

    return sanitized;
  });
}
