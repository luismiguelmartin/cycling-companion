import { describe, it, expect } from "vitest";
import { transformTimeSeries } from "./transform-time-series";

describe("transformTimeSeries", () => {
  it("convierte timestamps a minutos correctamente", () => {
    const input = [
      { timestamp_seconds: 0, power_watts: 200, hr_bpm: 140, cadence_rpm: 90 },
      { timestamp_seconds: 60, power_watts: 220, hr_bpm: 150, cadence_rpm: 92 },
      { timestamp_seconds: 120, power_watts: 210, hr_bpm: 148, cadence_rpm: 88 },
    ];

    const result = transformTimeSeries(input);

    expect(result).toEqual([
      { min: 0, power: 200, hr: 140, cadence: 90 },
      { min: 1, power: 220, hr: 150, cadence: 92 },
      { min: 2, power: 210, hr: 148, cadence: 88 },
    ]);
  });

  it("redondea minutos correctamente", () => {
    const input = [{ timestamp_seconds: 90, power_watts: 200, hr_bpm: 140, cadence_rpm: 90 }];

    const result = transformTimeSeries(input);

    expect(result[0].min).toBe(2);
  });

  it("maneja array vacío", () => {
    expect(transformTimeSeries([])).toEqual([]);
  });

  it("reemplaza valores null con 0", () => {
    const input = [{ timestamp_seconds: 60, power_watts: null, hr_bpm: null, cadence_rpm: null }];

    const result = transformTimeSeries(input);

    expect(result[0]).toEqual({ min: 1, power: 0, hr: 0, cadence: 0 });
  });
});
