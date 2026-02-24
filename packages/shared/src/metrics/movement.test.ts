import { describe, it, expect } from "vitest";
import { detectMovement } from "./movement.js";
import type { TrackPoint } from "./types.js";

function makePoint(overrides: Partial<TrackPoint> & Pick<TrackPoint, "timestamp">): TrackPoint {
  return {
    lat: 0,
    lon: 0,
    elevation: null,
    power: null,
    hr: null,
    cadence: null,
    speed: 0,
    ...overrides,
  };
}

/** Crea N puntos consecutivos (1s cada uno) con los overrides dados */
function makePoints(
  count: number,
  overrides: Partial<TrackPoint>,
  startTimestamp = 1000,
): TrackPoint[] {
  return Array.from({ length: count }, (_, i) =>
    makePoint({ timestamp: startTimestamp + i * 1000, ...overrides }),
  );
}

describe("detectMovement", () => {
  it("todo en movimiento (speed > 1 en todos) -> todos true", () => {
    const points = makePoints(10, { speed: 25 });

    const result = detectMovement(points);

    expect(result.every((p) => p.isMoving === true)).toBe(true);
  });

  it("todo parado (speed=0, power=null, cadence=null) -> todos false", () => {
    const points = makePoints(10, { speed: 0, power: null, cadence: null });

    const result = detectMovement(points);

    expect(result.every((p) => p.isMoving === false)).toBe(true);
  });

  it("jitter 2s (2 puntos con speed>1 entre bloques parados >3s) -> esos 2 puntos = false", () => {
    // 5 parado + 2 movimiento (jitter) + 5 parado
    const stopped1 = makePoints(5, { speed: 0, power: null, cadence: null }, 1000);
    const jitter = makePoints(2, { speed: 5 }, 6000);
    const stopped2 = makePoints(5, { speed: 0, power: null, cadence: null }, 8000);
    const points = [...stopped1, ...jitter, ...stopped2];

    const result = detectMovement(points);

    // Los 2 puntos de jitter deben ser filtrados a false
    expect(result[5].isMoving).toBe(false);
    expect(result[6].isMoving).toBe(false);
    // Los bloques parados se mantienen
    expect(result[0].isMoving).toBe(false);
    expect(result[11].isMoving).toBe(false);
  });

  it("parada corta 2s (2 puntos speed=0 entre bloques en movimiento >3s) -> esos 2 puntos = true", () => {
    // 5 movimiento + 2 parada corta + 5 movimiento
    const moving1 = makePoints(5, { speed: 25 }, 1000);
    const shortStop = makePoints(2, { speed: 0, power: null, cadence: null }, 6000);
    const moving2 = makePoints(5, { speed: 25 }, 8000);
    const points = [...moving1, ...shortStop, ...moving2];

    const result = detectMovement(points);

    // Los 2 puntos de parada corta deben ser rellenados a true
    expect(result[5].isMoving).toBe(true);
    expect(result[6].isMoving).toBe(true);
    // Los bloques en movimiento se mantienen
    expect(result[0].isMoving).toBe(true);
    expect(result[11].isMoving).toBe(true);
  });

  it("transicion real >3s -> respetada (3+ puntos parados = false)", () => {
    // 5 movimiento + 4 parado + 5 movimiento
    const moving1 = makePoints(5, { speed: 25 }, 1000);
    const stopped = makePoints(4, { speed: 0, power: null, cadence: null }, 6000);
    const moving2 = makePoints(5, { speed: 25 }, 10000);
    const points = [...moving1, ...stopped, ...moving2];

    const result = detectMovement(points);

    // Bloque de 4 parados >= 3 -> se mantiene como parado
    expect(result[5].isMoving).toBe(false);
    expect(result[6].isMoving).toBe(false);
    expect(result[7].isMoving).toBe(false);
    expect(result[8].isMoving).toBe(false);
    // Movimiento se mantiene
    expect(result[0].isMoving).toBe(true);
    expect(result[13].isMoving).toBe(true);
  });

  it("rodillo (power>0, speed=0 o undefined) -> isMoving = true", () => {
    const points = makePoints(10, { speed: 0, power: 200, cadence: null });

    const result = detectMovement(points);

    expect(result.every((p) => p.isMoving === true)).toBe(true);
  });

  it("solo cadencia (cadence>0, speed=0, power=null) -> isMoving = true", () => {
    const points = makePoints(10, { speed: 0, power: null, cadence: 80 });

    const result = detectMovement(points);

    expect(result.every((p) => p.isMoving === true)).toBe(true);
  });

  it("array vacio -> []", () => {
    expect(detectMovement([])).toEqual([]);
  });

  it("bloque exacto de 3 puntos parados -> se mantiene como parado (= umbral)", () => {
    // 5 movimiento + 3 parado (exacto al umbral) + 5 movimiento
    const moving1 = makePoints(5, { speed: 25 }, 1000);
    const stopped = makePoints(3, { speed: 0, power: null, cadence: null }, 6000);
    const moving2 = makePoints(5, { speed: 25 }, 9000);
    const points = [...moving1, ...stopped, ...moving2];

    const result = detectMovement(points);

    // Bloque de exactamente 3 puntos >= MIN_MOVING_BLOCK_SECONDS -> se mantiene
    expect(result[5].isMoving).toBe(false);
    expect(result[6].isMoving).toBe(false);
    expect(result[7].isMoving).toBe(false);
  });

  it("no muta el array original", () => {
    const points = makePoints(5, { speed: 25 });

    const result = detectMovement(points);

    expect(points[0].isMoving).toBeUndefined();
    expect(result[0].isMoving).toBe(true);
    expect(result).not.toBe(points);
  });
});
