import { describe, it, expect } from "vitest";
import { RPE_COLORS, getRPEColor } from "./rpe";

describe("RPE_COLORS", () => {
  it("tiene 4 rangos definidos", () => {
    expect(Object.keys(RPE_COLORS)).toHaveLength(4);
  });

  it("tiene los rangos low, moderate, high, max", () => {
    expect(RPE_COLORS).toHaveProperty("low");
    expect(RPE_COLORS).toHaveProperty("moderate");
    expect(RPE_COLORS).toHaveProperty("high");
    expect(RPE_COLORS).toHaveProperty("max");
  });
});

describe("getRPEColor", () => {
  it("devuelve verde (#22c55e) para RPE 1-3", () => {
    expect(getRPEColor(1)).toBe("#22c55e");
    expect(getRPEColor(2)).toBe("#22c55e");
    expect(getRPEColor(3)).toBe("#22c55e");
  });

  it("devuelve amarillo (#eab308) para RPE 4-6", () => {
    expect(getRPEColor(4)).toBe("#eab308");
    expect(getRPEColor(5)).toBe("#eab308");
    expect(getRPEColor(6)).toBe("#eab308");
  });

  it("devuelve naranja (#f97316) para RPE 7-8", () => {
    expect(getRPEColor(7)).toBe("#f97316");
    expect(getRPEColor(8)).toBe("#f97316");
  });

  it("devuelve rojo (#ef4444) para RPE 9-10", () => {
    expect(getRPEColor(9)).toBe("#ef4444");
    expect(getRPEColor(10)).toBe("#ef4444");
  });
});
