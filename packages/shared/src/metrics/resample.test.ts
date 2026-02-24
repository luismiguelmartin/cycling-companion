import { describe, it, expect } from "vitest";
import { sortAndDeduplicate, resampleTo1Hz } from "./resample";
import type { TrackPoint } from "./types";

/** Helper para crear un TrackPoint con defaults */
function makePoint(overrides: Partial<TrackPoint> & { timestamp: number }): TrackPoint {
  return {
    lat: 0,
    lon: 0,
    elevation: 100,
    power: null,
    hr: null,
    cadence: null,
    ...overrides,
  };
}

describe("resample", () => {
  describe("sortAndDeduplicate", () => {
    it("elimina timestamps duplicados manteniendo el primero", () => {
      const points: TrackPoint[] = [
        makePoint({ timestamp: 0, power: 100 }),
        makePoint({ timestamp: 0, power: 999 }),
        makePoint({ timestamp: 1000, power: 200 }),
      ];

      const result = sortAndDeduplicate(points);

      expect(result).toHaveLength(2);
      expect(result[0].timestamp).toBe(0);
      expect(result[0].power).toBe(100); // primero mantenido, no 999
      expect(result[1].timestamp).toBe(1000);
    });

    it("ordena puntos desordenados por timestamp ascendente", () => {
      const points: TrackPoint[] = [
        makePoint({ timestamp: 3000, lat: 3 }),
        makePoint({ timestamp: 1000, lat: 1 }),
        makePoint({ timestamp: 2000, lat: 2 }),
      ];

      const result = sortAndDeduplicate(points);

      expect(result).toHaveLength(3);
      expect(result[0].timestamp).toBe(1000);
      expect(result[0].lat).toBe(1);
      expect(result[1].timestamp).toBe(2000);
      expect(result[1].lat).toBe(2);
      expect(result[2].timestamp).toBe(3000);
      expect(result[2].lat).toBe(3);
    });

    it("no muta el array original", () => {
      const points: TrackPoint[] = [makePoint({ timestamp: 2000 }), makePoint({ timestamp: 1000 })];

      const original = [...points];
      sortAndDeduplicate(points);

      expect(points[0].timestamp).toBe(original[0].timestamp);
      expect(points[1].timestamp).toBe(original[1].timestamp);
    });

    it("devuelve array vacio para input vacio", () => {
      expect(sortAndDeduplicate([])).toEqual([]);
    });
  });

  describe("resampleTo1Hz", () => {
    it("devuelve array vacio para input vacio", () => {
      expect(resampleTo1Hz([])).toEqual([]);
    });

    it("devuelve copia de un solo punto", () => {
      const point = makePoint({ timestamp: 5000, lat: 40, lon: -3, power: 200 });
      const result = resampleTo1Hz([point]);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(point);
      expect(result[0]).not.toBe(point); // copia, no referencia
    });

    it("serie ya a 1Hz devuelve output con mismos valores", () => {
      const points: TrackPoint[] = [
        makePoint({ timestamp: 0, lat: 40.0, lon: -3.0, power: 100, hr: 120, cadence: 80 }),
        makePoint({ timestamp: 1000, lat: 40.1, lon: -3.1, power: 150, hr: 130, cadence: 85 }),
        makePoint({ timestamp: 2000, lat: 40.2, lon: -3.2, power: 200, hr: 140, cadence: 90 }),
      ];

      const result = resampleTo1Hz(points);

      expect(result).toHaveLength(3);
      expect(result[0].timestamp).toBe(0);
      expect(result[0].lat).toBe(40.0);
      expect(result[0].power).toBe(100);
      expect(result[1].timestamp).toBe(1000);
      expect(result[1].lat).toBe(40.1);
      expect(result[1].power).toBe(150);
      expect(result[2].timestamp).toBe(2000);
      expect(result[2].lat).toBe(40.2);
      expect(result[2].power).toBe(200);
    });

    it("interpola lat/lon linealmente entre 2 puntos separados 2s", () => {
      const points: TrackPoint[] = [
        makePoint({ timestamp: 0, lat: 40.0, lon: -3.0, elevation: 100 }),
        makePoint({ timestamp: 2000, lat: 40.2, lon: -3.2, elevation: 200 }),
      ];

      const result = resampleTo1Hz(points);

      expect(result).toHaveLength(3); // t=0, t=1000, t=2000
      expect(result[0].timestamp).toBe(0);
      expect(result[0].lat).toBe(40.0);
      expect(result[0].lon).toBe(-3.0);

      // Punto medio interpolado
      expect(result[1].timestamp).toBe(1000);
      expect(result[1].lat).toBeCloseTo(40.1, 5);
      expect(result[1].lon).toBeCloseTo(-3.1, 5);
      expect(result[1].elevation).toBeCloseTo(150, 5);

      expect(result[2].timestamp).toBe(2000);
      expect(result[2].lat).toBe(40.2);
      expect(result[2].lon).toBe(-3.2);
    });

    it("forward-fill de sensores (power, hr, cadence) usa valor del punto anterior", () => {
      const points: TrackPoint[] = [
        makePoint({ timestamp: 0, power: 200, hr: 120, cadence: 80 }),
        makePoint({ timestamp: 3000, power: 300, hr: 150, cadence: 95 }),
      ];

      const result = resampleTo1Hz(points);

      expect(result).toHaveLength(4); // t=0, 1000, 2000, 3000

      // t=1000 y t=2000 deben tener forward-fill del punto anterior (t=0)
      expect(result[1].power).toBe(200);
      expect(result[1].hr).toBe(120);
      expect(result[1].cadence).toBe(80);

      expect(result[2].power).toBe(200);
      expect(result[2].hr).toBe(120);
      expect(result[2].cadence).toBe(80);

      // t=3000 es el punto exacto
      expect(result[3].power).toBe(300);
      expect(result[3].hr).toBe(150);
      expect(result[3].cadence).toBe(95);
    });

    it("gap corto (5s) genera 6 puntos interpolados", () => {
      const points: TrackPoint[] = [
        makePoint({ timestamp: 0, lat: 40.0, lon: -3.0, power: 200, hr: 120 }),
        makePoint({ timestamp: 5000, lat: 40.5, lon: -3.5, power: 250, hr: 140 }),
      ];

      const result = resampleTo1Hz(points);

      expect(result).toHaveLength(6); // t=0, 1000, 2000, 3000, 4000, 5000

      // Verificar interpolacion lineal en punto intermedio (t=2500 no, pero t=2000)
      // ratio = 2000/5000 = 0.4
      expect(result[2].lat).toBeCloseTo(40.0 + 0.5 * 0.4, 5);
      expect(result[2].lon).toBeCloseTo(-3.0 + -0.5 * 0.4, 5);

      // Forward-fill sensores
      expect(result[2].power).toBe(200);
      expect(result[2].hr).toBe(120);

      // Extremos
      expect(result[0].timestamp).toBe(0);
      expect(result[5].timestamp).toBe(5000);
      expect(result[5].power).toBe(250);
    });

    it("gap largo (35s) inserta puntos con power=0, hr=null, cadence=0", () => {
      const points: TrackPoint[] = [
        makePoint({
          timestamp: 0,
          lat: 40.0,
          lon: -3.0,
          elevation: 100,
          power: 200,
          hr: 120,
          cadence: 80,
        }),
        makePoint({
          timestamp: 35000,
          lat: 40.35,
          lon: -3.35,
          elevation: 200,
          power: 300,
          hr: 150,
          cadence: 95,
        }),
      ];

      const result = resampleTo1Hz(points);

      expect(result).toHaveLength(36); // t=0 a t=35000 en pasos de 1000

      // Primer punto: exacto
      expect(result[0].power).toBe(200);
      expect(result[0].hr).toBe(120);
      expect(result[0].cadence).toBe(80);

      // Puntos intermedios: gap largo
      for (let i = 1; i < 35; i++) {
        expect(result[i].power).toBe(0);
        expect(result[i].hr).toBeNull();
        expect(result[i].cadence).toBe(0);
        expect(result[i].elevation).toBeNull();
      }

      // Lat/lon siguen interpolados incluso en gap largo
      // ratio = 1000/35000 ≈ 0.02857
      expect(result[1].lat).toBeCloseTo(40.0 + 0.35 * (1 / 35), 5);

      // Ultimo punto: exacto
      expect(result[35].power).toBe(300);
      expect(result[35].hr).toBe(150);
      expect(result[35].cadence).toBe(95);
    });

    it("elevation null en un punto usa el valor del otro para interpolacion", () => {
      const points: TrackPoint[] = [
        makePoint({ timestamp: 0, elevation: 100 }),
        makePoint({ timestamp: 2000, elevation: null }),
      ];

      const result = resampleTo1Hz(points);

      expect(result).toHaveLength(3);
      // t=0: punto exacto, elevation=100
      expect(result[0].elevation).toBe(100);
      // t=1000: interpolacion con null → usa el disponible (100)
      expect(result[1].elevation).toBe(100);
      // t=2000: punto exacto, elevation=null
      expect(result[2].elevation).toBeNull();
    });

    it("elevation null en ambos puntos devuelve null", () => {
      const points: TrackPoint[] = [
        makePoint({ timestamp: 0, elevation: null }),
        makePoint({ timestamp: 2000, elevation: null }),
      ];

      const result = resampleTo1Hz(points);

      expect(result[1].elevation).toBeNull();
    });

    it("elevation con valor solo en el segundo punto usa ese valor", () => {
      const points: TrackPoint[] = [
        makePoint({ timestamp: 0, elevation: null }),
        makePoint({ timestamp: 2000, elevation: 200 }),
      ];

      const result = resampleTo1Hz(points);

      // t=1000: prev.elevation=null, next.elevation=200 → usa 200
      expect(result[1].elevation).toBe(200);
    });

    it("timestamps del resultado estan siempre en pasos de 1000ms", () => {
      const points: TrackPoint[] = [
        makePoint({ timestamp: 0 }),
        makePoint({ timestamp: 4500 }), // no alineado a 1s
      ];

      const result = resampleTo1Hz(points);

      // t=0, 1000, 2000, 3000, 4000 (4500 no es multiplo de 1000 desde start)
      // Pero startTs=0, endTs=4500, loop: 0, 1000, 2000, 3000, 4000
      // 5000 > 4500, asi que no se incluye
      expect(result).toHaveLength(5);
      expect(result.map((p) => p.timestamp)).toEqual([0, 1000, 2000, 3000, 4000]);
    });
  });
});
