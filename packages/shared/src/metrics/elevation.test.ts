import { describe, it, expect } from "vitest";
import { elevationGain } from "./elevation";
import type { TrackPoint } from "./types";

/** Helper para crear un TrackPoint con valores por defecto */
function makePoint(overrides: Partial<TrackPoint> = {}): TrackPoint {
  return {
    timestamp: 1000,
    lat: 40.4168,
    lon: -3.7038,
    elevation: 500,
    power: 200,
    hr: 150,
    cadence: 90,
    ...overrides,
  };
}

/** Crea una serie de puntos con las elevaciones dadas */
function makeElevationSeries(elevations: (number | null)[]): TrackPoint[] {
  return elevations.map((elev, i) => makePoint({ timestamp: i * 1000, elevation: elev }));
}

/**
 * Calcula el gain esperado aplicando el algoritmo de suavizado manualmente.
 * Util para verificar contra la implementacion.
 */
function expectedSmoothedGain(elevations: number[]): number {
  const n = elevations.length;
  if (n < 2) return 0;
  const halfWindow = 2; // Math.floor(5 / 2)
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
  let gain = 0;
  for (let i = 1; i < n; i++) {
    const delta = smoothed[i] - smoothed[i - 1];
    if (delta > 0) gain += delta;
  }
  return Math.round(gain);
}

describe("elevationGain", () => {
  it("serie ascendente lineal: gain refleja la subida total suavizada", () => {
    const elevations = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
    const points = makeElevationSeries(elevations);
    const result = elevationGain(points);

    // Suavizado de serie lineal: bordes reducen ligeramente el gain
    // smoothed: [200, 250, 300, 400, 500, 600, 700, 800, 850, 900]
    // gain = 50+50+100+100+100+100+100+100+50+50 = 700 (no 900)
    const expected = expectedSmoothedGain(elevations);
    expect(result).toBe(expected);
    expect(result).toBe(700);
  });

  it("serie descendente: gain = 0", () => {
    const elevations = [500, 400, 300, 200, 100];
    const points = makeElevationSeries(elevations);
    const result = elevationGain(points);
    expect(result).toBe(0);
  });

  it("ruido pequeno: suavizado absorbe variaciones de +-1m", () => {
    const elevations = [500, 501, 499, 500, 501, 499, 500, 501, 499, 500];
    const points = makeElevationSeries(elevations);
    const result = elevationGain(points);

    // Suavizado aplana la serie; deltas positivos son minimos
    expect(result).not.toBeNull();
    expect(result!).toBeLessThanOrEqual(2);
  });

  it("subida + bajada: solo acumula la parte ascendente", () => {
    // Serie con 50 puntos subiendo 500m y 50 bajando 500m
    const up = Array.from({ length: 51 }, (_, i) => 100 + i * 10); // 100 -> 600
    const down = Array.from({ length: 50 }, (_, i) => 590 - i * 10); // 590 -> 100
    const elevations = [...up, ...down];
    const points = makeElevationSeries(elevations);
    const result = elevationGain(points);

    // El gain debe reflejar la subida (~500m) con ligera reduccion por suavizado de bordes
    const expected = expectedSmoothedGain(elevations);
    expect(result).toBe(expected);
    // La subida real es 500m; con suavizado se pierde un poco en pico y bordes
    expect(result!).toBeGreaterThan(450);
    expect(result!).toBeLessThanOrEqual(500);
  });

  it("subida + bajada + subida: acumula ambas subidas", () => {
    // 30 puntos subiendo, 20 bajando, 30 subiendo
    const up1 = Array.from({ length: 31 }, (_, i) => 100 + i * 10); // 100 -> 400
    const down = Array.from({ length: 20 }, (_, i) => 390 - i * 10); // 390 -> 200
    const up2 = Array.from({ length: 31 }, (_, i) => 210 + i * 10); // 210 -> 510
    const elevations = [...up1, ...down, ...up2];
    const points = makeElevationSeries(elevations);
    const result = elevationGain(points);

    // Gain debe acumular ambas subidas (~300 + ~300 = ~600)
    const expected = expectedSmoothedGain(elevations);
    expect(result).toBe(expected);
    expect(result!).toBeGreaterThan(500);
  });

  it("sin datos de elevacion: retorna null", () => {
    const points = [
      makePoint({ elevation: null }),
      makePoint({ elevation: null }),
      makePoint({ elevation: null }),
    ];
    const result = elevationGain(points);
    expect(result).toBeNull();
  });

  it("un solo punto con elevacion: retorna null", () => {
    const points = [makePoint({ elevation: 500 })];
    const result = elevationGain(points);
    expect(result).toBeNull();
  });

  it("2 puntos: calcula gain directo sin suavizado completo", () => {
    // Con 2 puntos y halfWindow=2:
    // smoothed[0] = mean(100, 300) = 200
    // smoothed[1] = mean(100, 300) = 200
    // gain = 0 (ambos smoothed son iguales)
    // Con solo 2 puntos la ventana colapsa a los mismos elementos
    const points = makeElevationSeries([100, 300]);
    const result = elevationGain(points);
    const expected = expectedSmoothedGain([100, 300]);
    expect(result).toBe(expected);
    expect(result).toBe(0);
  });

  it("datos mixtos: calcula solo con puntos que tienen elevacion", () => {
    // null intercalados se eliminan; solo se usan los que tienen valor
    const points = [
      makePoint({ timestamp: 0, elevation: 100 }),
      makePoint({ timestamp: 1000, elevation: null }),
      makePoint({ timestamp: 2000, elevation: 200 }),
      makePoint({ timestamp: 3000, elevation: null }),
      makePoint({ timestamp: 4000, elevation: null }),
      makePoint({ timestamp: 5000, elevation: 300 }),
      makePoint({ timestamp: 6000, elevation: 400 }),
      makePoint({ timestamp: 7000, elevation: null }),
      makePoint({ timestamp: 8000, elevation: 500 }),
    ];
    const result = elevationGain(points);
    // Serie efectiva: [100, 200, 300, 400, 500] (5 puntos)
    const expected = expectedSmoothedGain([100, 200, 300, 400, 500]);
    expect(result).toBe(expected);
    // Serie lineal de 5 puntos -> gain = smoothed ascendente
    expect(result!).toBeGreaterThan(0);
  });

  it("valores negativos de elevacion: calcula correctamente", () => {
    // Elevaciones bajo el nivel del mar subiendo
    const elevations = [-50, 0, 50, 100];
    const points = makeElevationSeries(elevations);
    const result = elevationGain(points);

    // Con 4 puntos y halfWindow=2:
    // smoothed[0] = mean(-50, 0, 50) = 0
    // smoothed[1] = mean(-50, 0, 50, 100) = 25
    // smoothed[2] = mean(-50, 0, 50, 100) = 25
    // smoothed[3] = mean(0, 50, 100) = 50
    // Positive deltas: 25 + 0 + 25 = 50 -> round(50) = 50
    const expected = expectedSmoothedGain(elevations);
    expect(result).toBe(expected);
    expect(result).toBe(50);
  });
});
