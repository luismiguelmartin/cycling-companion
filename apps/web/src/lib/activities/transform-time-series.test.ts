import { describe, it, expect } from "vitest";
import { transformTimeSeries } from "./transform-time-series";

describe("transformTimeSeries", () => {
  it("calcula distancia acumulada en km a partir de speed_kmh", () => {
    const input = [
      { timestamp_seconds: 0, power_watts: 200, hr_bpm: 140, cadence_rpm: 90, speed_kmh: 30 },
      { timestamp_seconds: 60, power_watts: 220, hr_bpm: 150, cadence_rpm: 92, speed_kmh: 30 },
      { timestamp_seconds: 120, power_watts: 210, hr_bpm: 148, cadence_rpm: 88, speed_kmh: 30 },
    ];

    const result = transformTimeSeries(input);

    // 30 km/h * (60/3600) h = 0.5 km por segmento
    expect(result[0].km).toBe(0);
    expect(result[1].km).toBe(0.5);
    expect(result[2].km).toBe(1);
  });

  it("maneja array vacío", () => {
    expect(transformTimeSeries([])).toEqual([]);
  });

  it("reemplaza valores null con 0", () => {
    const input = [
      {
        timestamp_seconds: 60,
        power_watts: null,
        hr_bpm: null,
        cadence_rpm: null,
        speed_kmh: null,
      },
    ];

    const result = transformTimeSeries(input);

    expect(result[0]).toEqual({ km: 0, power: 0, hr: 0, cadence: 0 });
  });

  it("no acumula distancia si speed_kmh es null", () => {
    const input = [
      { timestamp_seconds: 0, power_watts: 200, hr_bpm: 140, cadence_rpm: 90, speed_kmh: null },
      { timestamp_seconds: 60, power_watts: 220, hr_bpm: 150, cadence_rpm: 92, speed_kmh: null },
    ];

    const result = transformTimeSeries(input);

    expect(result[0].km).toBe(0);
    expect(result[1].km).toBe(0);
  });

  it("acumula distancia correctamente con velocidades variables", () => {
    const input = [
      { timestamp_seconds: 0, power_watts: 200, hr_bpm: 140, cadence_rpm: 90, speed_kmh: 36 },
      { timestamp_seconds: 10, power_watts: 220, hr_bpm: 150, cadence_rpm: 92, speed_kmh: 36 },
      { timestamp_seconds: 20, power_watts: 180, hr_bpm: 145, cadence_rpm: 88, speed_kmh: 18 },
    ];

    const result = transformTimeSeries(input);

    // Primer punto: km=0
    expect(result[0].km).toBe(0);
    // Segundo: 36 km/h * (10/3600) h = 0.1 km
    expect(result[1].km).toBe(0.1);
    // Tercero: 0.1 + 18 * (10/3600) = 0.1 + 0.05 = 0.15 → redondea a 0.2
    expect(result[2].km).toBe(0.2);
  });
});
