import { type TrackPoint, METRICS_THRESHOLDS } from "./types.js";

/**
 * Marca cada TrackPoint con isMoving.
 * Criterio: speed > 1 km/h OR power > 0 OR cadence > 0
 * Filtro de bloques minimos de 3 segundos para anti-jitter.
 *
 * Prerequisito: speed ya calculado.
 * Devuelve copia — no muta el original.
 */
export function detectMovement(points: TrackPoint[]): TrackPoint[] {
  if (points.length === 0) return [];

  // Paso 1 — Raw: marcar isMoving segun criterio
  const result = points.map((point) => {
    const speedMoving =
      point.speed !== undefined && point.speed !== null
        ? point.speed > METRICS_THRESHOLDS.MIN_MOVING_SPEED_KMH
        : false;
    const powerMoving = point.power !== null ? point.power > 0 : false;
    const cadenceMoving = point.cadence !== null ? point.cadence > 0 : false;

    return {
      ...point,
      isMoving: speedMoving || powerMoving || cadenceMoving,
    };
  });

  // Paso 2 — Filtrar bloques cortos de movimiento (jitter GPS)
  filterShortBlocks(result, true, METRICS_THRESHOLDS.MIN_MOVING_BLOCK_SECONDS);

  // Paso 3 — Filtrar bloques cortos de parada (micro-parada)
  filterShortBlocks(result, false, METRICS_THRESHOLDS.MIN_MOVING_BLOCK_SECONDS);

  return result;
}

/**
 * Recorre la serie y filtra bloques cortos de un valor dado.
 * Si un bloque de isMoving===targetValue dura < minBlockSize puntos consecutivos,
 * se invierte su valor.
 */
function filterShortBlocks(
  points: { isMoving?: boolean }[],
  targetValue: boolean,
  minBlockSize: number,
): void {
  let blockStart = -1;

  for (let i = 0; i <= points.length; i++) {
    const current = i < points.length ? points[i].isMoving === targetValue : false;

    if (current && blockStart === -1) {
      blockStart = i;
    } else if (!current && blockStart !== -1) {
      const blockLength = i - blockStart;
      if (blockLength < minBlockSize) {
        for (let j = blockStart; j < i; j++) {
          points[j].isMoving = !targetValue;
        }
      }
      blockStart = -1;
    }
  }
}
