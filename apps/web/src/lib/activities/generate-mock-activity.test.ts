import { describe, it, expect } from "vitest";
import { generateMockActivity } from "./generate-mock-activity";

describe("generateMockActivity", () => {
  it("retorna un objeto con todos los campos requeridos", () => {
    const mock = generateMockActivity();
    expect(mock).toHaveProperty("name");
    expect(mock).toHaveProperty("date");
    expect(mock).toHaveProperty("type");
    expect(mock).toHaveProperty("duration_h");
    expect(mock).toHaveProperty("duration_m");
    expect(mock).toHaveProperty("duration_s");
    expect(mock).toHaveProperty("distance");
    expect(mock).toHaveProperty("avgPower");
    expect(mock).toHaveProperty("avgHR");
    expect(mock).toHaveProperty("maxHR");
    expect(mock).toHaveProperty("avgCadence");
    expect(mock).toHaveProperty("rpe");
    expect(mock).toHaveProperty("notes");
  });

  it("genera un nombre no vacío", () => {
    const mock = generateMockActivity();
    expect(mock.name.length).toBeGreaterThan(0);
  });

  it("genera una fecha en formato YYYY-MM-DD", () => {
    const mock = generateMockActivity();
    expect(mock.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("genera un tipo válido (intervals, endurance, recovery o tempo)", () => {
    const mock = generateMockActivity();
    expect(["intervals", "endurance", "recovery", "tempo"]).toContain(mock.type);
  });

  it("genera duración con horas entre 1 y 3", () => {
    const mock = generateMockActivity();
    const h = parseInt(mock.duration_h);
    expect(h).toBeGreaterThanOrEqual(1);
    expect(h).toBeLessThanOrEqual(3);
  });

  it("genera RPE entre 5 y 8", () => {
    const mock = generateMockActivity();
    expect(mock.rpe).toBeGreaterThanOrEqual(5);
    expect(mock.rpe).toBeLessThanOrEqual(8);
  });

  it("genera potencia media entre 150 y 219", () => {
    const mock = generateMockActivity();
    const power = parseInt(mock.avgPower);
    expect(power).toBeGreaterThanOrEqual(150);
    expect(power).toBeLessThanOrEqual(219);
  });

  it("genera FC media entre 135 y 164", () => {
    const mock = generateMockActivity();
    const hr = parseInt(mock.avgHR);
    expect(hr).toBeGreaterThanOrEqual(135);
    expect(hr).toBeLessThanOrEqual(164);
  });
});
