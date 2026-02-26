import { describe, it, expect } from "vitest";
import { computeBestEfforts } from "./best-efforts.js";
import type { TrackPoint } from "./types.js";

function makePoint(overrides: Partial<TrackPoint> = {}): TrackPoint {
  return {
    timestamp: Date.now(),
    lat: 40.0,
    lon: -3.0,
    elevation: null,
    power: null,
    hr: null,
    cadence: null,
    ...overrides,
  };
}

describe("computeBestEfforts", () => {
  it("potencia constante retorna todos los valores iguales", () => {
    // 1200+ puntos para cubrir todas las ventanas (5s, 20s, 60s, 300s, 1200s)
    const points = Array.from({ length: 1500 }, () => makePoint({ power: 250 }));

    const result = computeBestEfforts(points);

    expect(result).toHaveLength(5);
    for (const effort of result) {
      expect(effort.power).toBe(250);
    }
  });

  it("pico de 5s detectado correctamente en ventana corta", () => {
    const points = [
      // 100 puntos a 150W
      ...Array.from({ length: 100 }, () => makePoint({ power: 150 })),
      // 5 puntos pico a 500W
      ...Array.from({ length: 5 }, () => makePoint({ power: 500 })),
      // 100 puntos a 150W
      ...Array.from({ length: 100 }, () => makePoint({ power: 150 })),
    ];

    const result = computeBestEfforts(points);

    const effort5s = result.find((e) => e.windowSeconds === 5);
    const effort20s = result.find((e) => e.windowSeconds === 20);

    expect(effort5s?.power).toBe(500);
    // 20s: 5 puntos a 500W + 15 puntos a 150W = (2500 + 2250) / 20 = 237.5
    expect(effort20s?.power).toBeLessThan(500);
    expect(effort20s!.power).toBeGreaterThan(150);
  });

  it("serie corta solo calcula ventanas que caben", () => {
    // 30 puntos → solo caben 5s y 20s
    const points = Array.from({ length: 30 }, () => makePoint({ power: 200 }));

    const result = computeBestEfforts(points);

    expect(result).toHaveLength(2);
    expect(result[0].windowSeconds).toBe(5);
    expect(result[1].windowSeconds).toBe(20);
  });

  it("retorna array vacío sin datos de potencia", () => {
    const points = Array.from({ length: 100 }, () => makePoint({ power: null }));
    const result = computeBestEfforts(points);
    expect(result).toEqual([]);
  });

  it("retorna array vacío con array vacío", () => {
    const result = computeBestEfforts([]);
    expect(result).toEqual([]);
  });

  it("pico largo detectado en ventana de 20min", () => {
    const points = [
      // 600 puntos a 100W
      ...Array.from({ length: 600 }, () => makePoint({ power: 100 })),
      // 1200 puntos a 300W (20 minutos de pico)
      ...Array.from({ length: 1200 }, () => makePoint({ power: 300 })),
    ];

    const result = computeBestEfforts(points);

    const effort20min = result.find((e) => e.windowSeconds === 1200);
    expect(effort20min?.power).toBe(300);
  });

  it("ignora potencia 0 correctamente al buscar picos", () => {
    const points = [
      ...Array.from({ length: 10 }, () => makePoint({ power: 0 })),
      ...Array.from({ length: 10 }, () => makePoint({ power: 200 })),
      ...Array.from({ length: 10 }, () => makePoint({ power: 0 })),
    ];

    const result = computeBestEfforts(points);
    const effort5s = result.find((e) => e.windowSeconds === 5);
    expect(effort5s?.power).toBe(200);
  });
});
