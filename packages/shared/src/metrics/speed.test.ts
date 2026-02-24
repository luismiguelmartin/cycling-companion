import { describe, it, expect } from "vitest";
import { computeSpeed } from "./speed.js";
import type { TrackPoint } from "./types.js";
import { haversineDistance } from "./haversine.js";

function makePoint(overrides: Partial<TrackPoint> & Pick<TrackPoint, "timestamp">): TrackPoint {
  return {
    lat: 0,
    lon: 0,
    elevation: null,
    power: null,
    hr: null,
    cadence: null,
    ...overrides,
  };
}

describe("computeSpeed", () => {
  it("calcula velocidad correcta entre 2 puntos a 1s de distancia", () => {
    // Dos puntos en el ecuador separados ~10m en longitud
    const lon2 = 0.0001; // ~11.13m al ecuador
    const expectedDistanceM = haversineDistance(0, 0, 0, lon2);
    const expectedSpeedKmh = (expectedDistanceM / 1) * 3.6; // 1 segundo

    const points: TrackPoint[] = [
      makePoint({ timestamp: 1000, lat: 0, lon: 0 }),
      makePoint({ timestamp: 2000, lat: 0, lon: lon2 }),
    ];

    const result = computeSpeed(points);

    expect(result[0].speed).toBe(0);
    expect(result[1].speed).toBeCloseTo(expectedSpeedKmh, 1);
    expect(result[1].speed).toBeGreaterThan(0);
  });

  it("filtra aberracion GPS > 100 km/h como speed = 0", () => {
    // Puntos muy lejanos en 1s -> > 100 km/h
    const points: TrackPoint[] = [
      makePoint({ timestamp: 1000, lat: 0, lon: 0 }),
      makePoint({ timestamp: 2000, lat: 1, lon: 0 }), // ~111km en 1s = ~400,000 km/h
    ];

    const result = computeSpeed(points);

    expect(result[1].speed).toBe(0);
  });

  it("punto unico retorna speed = 0", () => {
    const points: TrackPoint[] = [makePoint({ timestamp: 1000 })];

    const result = computeSpeed(points);

    expect(result).toHaveLength(1);
    expect(result[0].speed).toBe(0);
  });

  it("misma coordenada retorna speed = 0", () => {
    const points: TrackPoint[] = [
      makePoint({ timestamp: 1000, lat: 40, lon: -3 }),
      makePoint({ timestamp: 2000, lat: 40, lon: -3 }),
    ];

    const result = computeSpeed(points);

    expect(result[1].speed).toBe(0);
  });

  it("delta_t = 0 retorna speed = 0 (evitar division por cero)", () => {
    const points: TrackPoint[] = [
      makePoint({ timestamp: 1000, lat: 0, lon: 0 }),
      makePoint({ timestamp: 1000, lat: 0, lon: 0.001 }),
    ];

    const result = computeSpeed(points);

    expect(result[1].speed).toBe(0);
  });

  it("serie de 5 puntos con desplazamiento gradual produce velocidades razonables", () => {
    // Simular movimiento gradual hacia el este (~10m/s = ~36 km/h por segundo)
    const baseLon = 0;
    const lonStep = 0.0001; // ~11.13m al ecuador
    const points: TrackPoint[] = [];

    for (let i = 0; i < 5; i++) {
      points.push(
        makePoint({
          timestamp: 1000 + i * 1000,
          lat: 0,
          lon: baseLon + i * lonStep,
        }),
      );
    }

    const result = computeSpeed(points);

    expect(result[0].speed).toBe(0);
    for (let i = 1; i < 5; i++) {
      const speed = result[i].speed!;
      expect(speed).toBeGreaterThan(30); // ~36-40 km/h esperado
      expect(speed).toBeLessThan(50);
    }
  });

  it("no muta el array original", () => {
    const points: TrackPoint[] = [
      makePoint({ timestamp: 1000 }),
      makePoint({ timestamp: 2000, lon: 0.0001 }),
    ];

    const result = computeSpeed(points);

    expect(points[0].speed).toBeUndefined();
    expect(points[1].speed).toBeUndefined();
    expect(result[0].speed).toBe(0);
    expect(result).not.toBe(points);
  });

  it("array vacio retorna array vacio", () => {
    expect(computeSpeed([])).toEqual([]);
  });
});
