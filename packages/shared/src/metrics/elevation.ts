import type { TrackPoint } from "./types.js";
import { METRICS_THRESHOLDS } from "./types.js";

/**
 * Calcula el desnivel positivo acumulado con suavizado de media movil.
 *
 * Algoritmo:
 * 1. Extraer serie de elevacion (filtrar puntos con elevation != null)
 * 2. Si < 2 puntos con elevacion -> return null
 * 3. Aplicar media movil de ELEVATION_SMOOTHING_WINDOW (5) puntos:
 *    smoothed[i] = mean(elevation[max(0, i-halfWindow) : min(n-1, i+halfWindow)])
 *    (ventana centrada, se reduce en los bordes)
 * 4. Sumar deltas positivos: gain += max(0, smoothed[i] - smoothed[i-1])
 * 5. Retornar Math.round(gain)
 *
 * @returns Desnivel positivo en metros, o null si no hay datos de elevacion
 */
export function elevationGain(points: TrackPoint[]): number | null {
  // 1. Extraer serie de elevacion (solo puntos con elevation != null)
  const elevations: number[] = [];
  for (const p of points) {
    if (p.elevation !== null && p.elevation !== undefined) {
      elevations.push(p.elevation);
    }
  }

  // 2. Si < 2 puntos con elevacion, no hay desnivel calculable
  if (elevations.length < 2) {
    return null;
  }

  // 3. Aplicar media movil centrada de ELEVATION_SMOOTHING_WINDOW puntos
  const window = METRICS_THRESHOLDS.ELEVATION_SMOOTHING_WINDOW;
  const halfWindow = Math.floor(window / 2);
  const n = elevations.length;

  const smoothed: number[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const start = Math.max(0, i - halfWindow);
    const end = Math.min(n - 1, i + halfWindow);
    let sum = 0;
    let count = 0;
    for (let j = start; j <= end; j++) {
      sum += elevations[j];
      count++;
    }
    smoothed[i] = sum / count;
  }

  // 4. Sumar deltas positivos
  let gain = 0;
  for (let i = 1; i < n; i++) {
    const delta = smoothed[i] - smoothed[i - 1];
    if (delta > 0) {
      gain += delta;
    }
  }

  // 5. Retornar redondeado
  return Math.round(gain);
}
