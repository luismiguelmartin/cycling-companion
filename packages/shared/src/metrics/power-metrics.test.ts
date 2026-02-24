import { describe, it, expect } from "vitest";
import {
  avgPower,
  avgPowerNonZero,
  maxPower,
  normalizedPower,
  variabilityIndex,
} from "./power-metrics";
import type { TrackPoint } from "./types";

/** Helper para crear un TrackPoint con valores por defecto */
function makePoint(overrides: Partial<TrackPoint> = {}): TrackPoint {
  return {
    timestamp: 1000,
    lat: 40.4168,
    lon: -3.7038,
    elevation: 650,
    power: 200,
    hr: 150,
    cadence: 90,
    ...overrides,
  };
}

/**
 * Genera una serie de N puntos a 1Hz con la potencia indicada.
 * timestamp empieza en 0 e incrementa 1000ms por punto.
 */
function makePowerSeries(count: number, powerFn: (i: number) => number | null): TrackPoint[] {
  return Array.from({ length: count }, (_, i) =>
    makePoint({ timestamp: i * 1000, power: powerFn(i) }),
  );
}

describe("avgPower", () => {
  it("calcula media con potencia constante [200, 200, 200]", () => {
    const points = [
      makePoint({ power: 200 }),
      makePoint({ power: 200 }),
      makePoint({ power: 200 }),
    ];
    expect(avgPower(points)).toBe(200);
  });

  it("trata null como 0 → [200, null, 200] = ~133.3", () => {
    const points = [
      makePoint({ power: 200 }),
      makePoint({ power: null }),
      makePoint({ power: 200 }),
    ];
    const result = avgPower(points);
    expect(result).not.toBeNull();
    expect(result).toBeCloseTo(133.33, 1);
  });

  it("incluye ceros en la media → [200, 0, 300] = ~166.7", () => {
    const points = [makePoint({ power: 200 }), makePoint({ power: 0 }), makePoint({ power: 300 })];
    const result = avgPower(points);
    expect(result).not.toBeNull();
    expect(result).toBeCloseTo(166.67, 1);
  });

  it("retorna null si todos los valores son null", () => {
    const points = [
      makePoint({ power: null }),
      makePoint({ power: null }),
      makePoint({ power: null }),
    ];
    expect(avgPower(points)).toBeNull();
  });

  it("retorna null para array vacío", () => {
    expect(avgPower([])).toBeNull();
  });
});

describe("avgPowerNonZero", () => {
  it("excluye ceros y nulls → [200, 0, 300, null] = 250", () => {
    const points = [
      makePoint({ power: 200 }),
      makePoint({ power: 0 }),
      makePoint({ power: 300 }),
      makePoint({ power: null }),
    ];
    expect(avgPowerNonZero(points)).toBe(250);
  });

  it("retorna null si todos son 0", () => {
    const points = [makePoint({ power: 0 }), makePoint({ power: 0 }), makePoint({ power: 0 })];
    expect(avgPowerNonZero(points)).toBeNull();
  });

  it("retorna null si todos son null", () => {
    const points = [
      makePoint({ power: null }),
      makePoint({ power: null }),
      makePoint({ power: null }),
    ];
    expect(avgPowerNonZero(points)).toBeNull();
  });

  it("calcula media correcta [100, 200, 300] = 200", () => {
    const points = [
      makePoint({ power: 100 }),
      makePoint({ power: 200 }),
      makePoint({ power: 300 }),
    ];
    expect(avgPowerNonZero(points)).toBe(200);
  });
});

describe("maxPower", () => {
  it("encuentra el máximo [100, 300, 200] = 300", () => {
    const points = [
      makePoint({ power: 100 }),
      makePoint({ power: 300 }),
      makePoint({ power: 200 }),
    ];
    expect(maxPower(points)).toBe(300);
  });

  it("retorna null si todos son null", () => {
    const points = [
      makePoint({ power: null }),
      makePoint({ power: null }),
      makePoint({ power: null }),
    ];
    expect(maxPower(points)).toBeNull();
  });

  it("retorna 0 si el único valor es 0", () => {
    const points = [makePoint({ power: 0 })];
    expect(maxPower(points)).toBe(0);
  });
});

describe("normalizedPower", () => {
  it("potencia constante 200W x 1200 puntos → NP ≈ 200 (±1)", () => {
    const points = makePowerSeries(1200, () => 200);
    const np = normalizedPower(points);
    expect(np).not.toBeNull();
    expect(np!).toBeGreaterThanOrEqual(199);
    expect(np!).toBeLessThanOrEqual(201);
  });

  it("potencia variable (bloques 60s de 100W/300W) x 1200 puntos → NP > 200", () => {
    // Bloques de 60s para que la variabilidad sobreviva al rolling average de 30s
    const points = makePowerSeries(1200, (i) => (Math.floor(i / 60) % 2 === 0 ? 100 : 300));
    const np = normalizedPower(points);
    expect(np).not.toBeNull();
    expect(np!).toBeGreaterThan(200);
  });

  it("retorna null con menos de 10 min (500 puntos = 8.3 min)", () => {
    const points = makePowerSeries(500, () => 200);
    expect(normalizedPower(points)).toBeNull();
  });

  it("retorna null con menos de 30 muestras", () => {
    const points = makePowerSeries(20, () => 200);
    expect(normalizedPower(points)).toBeNull();
  });

  it("retorna null sin datos de potencia (todos null)", () => {
    const points = makePowerSeries(1200, () => null);
    expect(normalizedPower(points)).toBeNull();
  });

  it("calcula NP con ceros intercalados [200, 0, 200, 0, ...] x 600", () => {
    const points = makePowerSeries(1200, (i) => (i % 2 === 0 ? 200 : 0));
    const np = normalizedPower(points);
    expect(np).not.toBeNull();
    // Con ceros intercalados, el rolling average suaviza pero NP sigue siendo calculable
    expect(np!).toBeGreaterThan(0);
  });
});

describe("variabilityIndex", () => {
  it("NP=220, avg=200 → 1.10", () => {
    expect(variabilityIndex(220, 200)).toBeCloseTo(1.1, 2);
  });

  it("NP=200, avg=200 → 1.00", () => {
    expect(variabilityIndex(200, 200)).toBeCloseTo(1.0, 2);
  });

  it("NP=250, avg=0 → Infinity (división por cero)", () => {
    const result = variabilityIndex(250, 0);
    expect(result).toBe(Infinity);
  });
});
