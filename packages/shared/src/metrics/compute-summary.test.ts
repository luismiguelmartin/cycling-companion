import { describe, it, expect } from "vitest";
import { computeActivitySummary } from "./compute-summary.js";
import type { TrackPoint } from "./types.js";

/** Helper: genera puntos de TrackPoint a 1Hz con movimiento constante */
function generateMovingPoints(
  count: number,
  options?: {
    power?: number | null;
    hr?: number | null;
    cadence?: number | null;
    startLat?: number;
    startLon?: number;
    latDelta?: number;
    elevation?: number | null;
    elevGainPerPoint?: number;
  },
): TrackPoint[] {
  const {
    power = 200,
    hr = 150,
    cadence = 90,
    startLat = 38.8794,
    startLon = -6.9707,
    latDelta = 0.0001,
    elevation = 200,
    elevGainPerPoint = 0,
  } = options ?? {};

  const baseTime = Date.now();
  return Array.from({ length: count }, (_, i) => ({
    timestamp: baseTime + i * 1000,
    lat: startLat + i * latDelta,
    lon: startLon,
    elevation: elevation !== null ? elevation + i * elevGainPerPoint : null,
    power,
    hr,
    cadence,
  }));
}

/** Helper: genera puntos parados (sin movimiento) */
function generateStoppedPoints(
  count: number,
  baseTimestamp: number,
  lat: number,
  lon: number,
): TrackPoint[] {
  return Array.from({ length: count }, (_, i) => ({
    timestamp: baseTimestamp + i * 1000,
    lat,
    lon,
    elevation: 200,
    power: 0,
    hr: 120,
    cadence: 0,
  }));
}

describe("computeActivitySummary", () => {
  it("retorna summary vacio para array vacio", () => {
    const result = computeActivitySummary([], null);

    expect(result.duration_total).toBe(0);
    expect(result.duration_moving).toBe(0);
    expect(result.distance_km).toBe(0);
    expect(result.avg_power).toBeNull();
    expect(result.normalized_power).toBeNull();
    expect(result.tss).toBeNull();
    expect(result.elevation_gain).toBeNull();
  });

  it("calcula pipeline completo con 30 min de movimiento continuo", () => {
    const points = generateMovingPoints(1800, { power: 200, hr: 150, cadence: 90 });
    const result = computeActivitySummary(points, 250);

    // Duracion (1800 puntos = 1799 segundos de intervalo, pero 1800 puntos con isMoving)
    expect(result.duration_total).toBe(1799);
    expect(result.duration_moving).toBeGreaterThan(0);
    // duration_moving cuenta puntos con isMoving=true, puede ser >= duration_total
    expect(result.duration_moving).toBeLessThanOrEqual(1800);

    // Distancia
    expect(result.distance_km).toBeGreaterThan(0);

    // Velocidad
    expect(result.avg_speed).toBeGreaterThan(0);
    expect(result.max_speed).toBeGreaterThan(0);

    // Potencia
    expect(result.avg_power).toBe(200);
    expect(result.avg_power_non_zero).toBe(200);
    expect(result.max_power).toBe(200);
    expect(result.normalized_power).toBeGreaterThanOrEqual(195);
    expect(result.normalized_power).toBeLessThanOrEqual(205);

    // VI e IF
    expect(result.variability_index).toBeCloseTo(1.0, 1);
    expect(result.intensity_factor).toBeCloseTo(0.8, 1);

    // TSS (30 min a 200W con FTP 250)
    expect(result.tss).toBeGreaterThan(0);
    expect(result.tss).toBeLessThan(100);

    // FC
    expect(result.avg_hr).toBe(150);
    expect(result.avg_hr_moving).toBe(150);
    expect(result.max_hr).toBe(150);

    // Cadencia
    expect(result.avg_cadence_moving).toBe(90);
  });

  it("diferencia duration_total y duration_moving con paradas", () => {
    // 20 min movimiento + 10 min parada + 10 min movimiento
    const moving1 = generateMovingPoints(1200, { power: 200, hr: 150, cadence: 90 });
    // Ajustar timestamps para que no se solapen
    const stopStart = moving1[moving1.length - 1].timestamp + 1000;
    const lastMovingLat = moving1[moving1.length - 1].lat;
    const lastMovingLon = moving1[moving1.length - 1].lon;
    const stopped = generateStoppedPoints(600, stopStart, lastMovingLat, lastMovingLon);

    const moving2Start = stopped[stopped.length - 1].timestamp + 1000;
    const moving2 = generateMovingPoints(600, {
      power: 250,
      hr: 160,
      cadence: 95,
      startLat: lastMovingLat,
      startLon: lastMovingLon,
    });
    // Ajustar timestamps de moving2
    for (let i = 0; i < moving2.length; i++) {
      moving2[i].timestamp = moving2Start + i * 1000;
    }

    const allPoints = [...moving1, ...stopped, ...moving2];
    const result = computeActivitySummary(allPoints, 250);

    // duration_moving debe ser significativamente menor que duration_total
    expect(result.duration_total).toBeGreaterThan(2300);
    expect(result.duration_moving).toBeGreaterThan(0);
    expect(result.duration_moving).toBeLessThan(result.duration_total);

    // FC media total incluye paradas (FC baja en parada)
    // FC media moving solo durante movimiento (FC mas alta)
    if (result.avg_hr !== null && result.avg_hr_moving !== null) {
      expect(result.avg_hr_moving).toBeGreaterThanOrEqual(result.avg_hr);
    }
  });

  it("maneja actividad sin datos de potencia (solo HR)", () => {
    const points = generateMovingPoints(1200, {
      power: null,
      hr: 155,
      cadence: 85,
    });
    const result = computeActivitySummary(points, 250, 190);

    // Sin potencia
    expect(result.avg_power).toBeNull();
    expect(result.avg_power_non_zero).toBeNull();
    expect(result.normalized_power).toBeNull();
    expect(result.max_power).toBeNull();
    expect(result.variability_index).toBeNull();
    expect(result.intensity_factor).toBeNull();

    // hrTSS fallback
    expect(result.tss).toBeGreaterThan(0);

    // FC funciona
    expect(result.avg_hr).toBe(155);
    expect(result.max_hr).toBe(155);

    // Cadencia funciona
    expect(result.avg_cadence_moving).toBe(85);
  });

  it("retorna NP null y TSS null para actividad < 10 min", () => {
    const points = generateMovingPoints(300, { power: 200, hr: 150 });
    const result = computeActivitySummary(points, 250);

    // NP requiere >= 600 muestras
    expect(result.normalized_power).toBeNull();

    // TSS deberia usar avg_power como fallback
    expect(result.tss).toBeGreaterThan(0);
    expect(result.avg_power).toBe(200);
  });

  it("calcula elevation_gain con datos de elevacion", () => {
    // Simulacion de subida: 0.5m por segundo durante 30 min = 900m
    const points = generateMovingPoints(1800, {
      power: 250,
      hr: 165,
      cadence: 80,
      elevation: 200,
      elevGainPerPoint: 0.5,
    });
    const result = computeActivitySummary(points, 250);

    expect(result.elevation_gain).toBeGreaterThan(0);
    // Con suavizado, deberia ser cercano a 899m (1799 puntos * 0.5)
    expect(result.elevation_gain).toBeGreaterThan(700);
    expect(result.elevation_gain).toBeLessThan(1000);
  });

  it("calcula TSS sin FTP = null", () => {
    const points = generateMovingPoints(1800, { power: 200, hr: 150 });
    const result = computeActivitySummary(points, null);

    // Sin FTP no se puede calcular TSS basado en potencia
    // Sin maxHr tampoco hrTSS
    expect(result.tss).toBeNull();
    expect(result.intensity_factor).toBeNull();

    // El resto de metricas funciona
    expect(result.avg_power).toBe(200);
    expect(result.normalized_power).toBeGreaterThan(0);
  });

  it("calcula hrTSS cuando no hay potencia pero si HR y maxHr", () => {
    const points = generateMovingPoints(1800, {
      power: null,
      hr: 160,
      cadence: 90,
    });
    const result = computeActivitySummary(points, null, 190);

    // Sin potencia → sin TSS por potencia
    expect(result.avg_power).toBeNull();
    expect(result.normalized_power).toBeNull();

    // hrTSS fallback: LTHR = 190 * 0.85 = 161.5, IF_hr = 160/161.5 ≈ 0.99
    // hrTSS = (0.99^2 * 0.5h * 100) ≈ 49
    expect(result.tss).toBeGreaterThan(0);
    expect(result.tss).toBeLessThan(100);
  });

  it("maneja datos indoor (lat/lon = 0) con potencia", () => {
    const baseTime = Date.now();
    const points: TrackPoint[] = Array.from({ length: 1800 }, (_, i) => ({
      timestamp: baseTime + i * 1000,
      lat: 0,
      lon: 0,
      elevation: null,
      power: 200,
      hr: 145,
      cadence: 90,
    }));

    const result = computeActivitySummary(points, 250);

    // Distancia y velocidad deben ser 0 (indoor)
    expect(result.distance_km).toBe(0);
    expect(result.avg_speed).toBe(0);

    // Pero potencia y HR funcionan
    expect(result.avg_power).toBe(200);
    expect(result.avg_hr).toBe(145);
    expect(result.avg_cadence_moving).toBe(90);

    // NP funciona (30 min de datos)
    expect(result.normalized_power).toBeGreaterThan(0);

    // TSS funciona
    expect(result.tss).toBeGreaterThan(0);

    // Movimiento detectado via potencia > 0
    expect(result.duration_moving).toBeGreaterThan(0);
  });

  it("filtra aberraciones de sensores", () => {
    const points = generateMovingPoints(1800, { power: 200, hr: 150 });
    // Insertar aberraciones
    points[100].power = 3000; // > 2000W
    points[200].hr = 240; // > 230 bpm

    const result = computeActivitySummary(points, 250);

    // Las aberraciones no deben afectar las medias significativamente
    expect(result.avg_power).toBeGreaterThan(195);
    expect(result.avg_power).toBeLessThan(205);
    expect(result.max_power).toBeLessThanOrEqual(200);
    expect(result.max_hr).toBeLessThanOrEqual(150);
  });

  it("maneja un solo punto sin crashear", () => {
    const result = computeActivitySummary(
      [
        {
          timestamp: Date.now(),
          lat: 38.8794,
          lon: -6.9707,
          elevation: 200,
          power: 200,
          hr: 150,
          cadence: 90,
        },
      ],
      250,
    );

    expect(result.duration_total).toBe(0);
    expect(result.distance_km).toBe(0);
  });
});
