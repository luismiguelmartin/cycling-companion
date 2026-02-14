import { describe, it, expect } from "vitest";
import { goalEnum, onboardingSchema, userProfileSchema } from "./user-profile";

describe("goalEnum", () => {
  it("acepta los 4 valores válidos", () => {
    expect(goalEnum.parse("performance")).toBe("performance");
    expect(goalEnum.parse("health")).toBe("health");
    expect(goalEnum.parse("weight_loss")).toBe("weight_loss");
    expect(goalEnum.parse("recovery")).toBe("recovery");
  });

  it("rechaza valores inválidos", () => {
    expect(() => goalEnum.parse("invalid")).toThrow();
    expect(() => goalEnum.parse("")).toThrow();
    expect(() => goalEnum.parse(123)).toThrow();
  });
});

describe("onboardingSchema", () => {
  const validData = {
    display_name: "Carlos",
    age: 45,
    weight_kg: 75.5,
    goal: "performance" as const,
  };

  it("valida datos correctos con campos obligatorios", () => {
    const result = onboardingSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("valida datos completos con campos opcionales", () => {
    const result = onboardingSchema.safeParse({
      ...validData,
      ftp: 250,
      max_hr: 175,
      rest_hr: 55,
    });
    expect(result.success).toBe(true);
  });

  it("acepta campos opcionales como null", () => {
    const result = onboardingSchema.safeParse({
      ...validData,
      ftp: null,
      max_hr: null,
      rest_hr: null,
    });
    expect(result.success).toBe(true);
  });

  it("rechaza nombre vacío", () => {
    const result = onboardingSchema.safeParse({
      ...validData,
      display_name: "",
    });
    expect(result.success).toBe(false);
  });

  it("rechaza edad fuera de rango", () => {
    expect(onboardingSchema.safeParse({ ...validData, age: 0 }).success).toBe(false);
    expect(onboardingSchema.safeParse({ ...validData, age: -1 }).success).toBe(false);
    expect(onboardingSchema.safeParse({ ...validData, age: 120 }).success).toBe(false);
  });

  it("rechaza peso fuera de rango", () => {
    expect(onboardingSchema.safeParse({ ...validData, weight_kg: 0 }).success).toBe(false);
    expect(onboardingSchema.safeParse({ ...validData, weight_kg: 300 }).success).toBe(false);
  });

  it("rechaza ftp fuera de rango", () => {
    expect(onboardingSchema.safeParse({ ...validData, ftp: 0 }).success).toBe(false);
    expect(onboardingSchema.safeParse({ ...validData, ftp: 1000 }).success).toBe(false);
  });

  it("rechaza max_hr fuera de rango", () => {
    expect(onboardingSchema.safeParse({ ...validData, max_hr: 0 }).success).toBe(false);
    expect(onboardingSchema.safeParse({ ...validData, max_hr: 250 }).success).toBe(false);
  });

  it("rechaza rest_hr fuera de rango", () => {
    expect(onboardingSchema.safeParse({ ...validData, rest_hr: 0 }).success).toBe(false);
    expect(onboardingSchema.safeParse({ ...validData, rest_hr: 200 }).success).toBe(false);
  });

  it("rechaza goal inválido", () => {
    expect(onboardingSchema.safeParse({ ...validData, goal: "invalid" }).success).toBe(false);
  });
});

describe("userProfileSchema", () => {
  it("valida un perfil completo", () => {
    const result = userProfileSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "carlos@example.com",
      display_name: "Carlos",
      age: 45,
      weight_kg: 75.5,
      ftp: 250,
      max_hr: 175,
      rest_hr: 55,
      goal: "performance",
      created_at: "2026-02-14T10:00:00.000Z",
      updated_at: "2026-02-14T10:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("rechaza email inválido", () => {
    const result = userProfileSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "not-an-email",
      display_name: "Carlos",
      age: 45,
      weight_kg: 75.5,
      goal: "performance",
      created_at: "2026-02-14T10:00:00.000Z",
      updated_at: "2026-02-14T10:00:00.000Z",
    });
    expect(result.success).toBe(false);
  });

  it("rechaza UUID inválido", () => {
    const result = userProfileSchema.safeParse({
      id: "not-a-uuid",
      email: "carlos@example.com",
      display_name: "Carlos",
      age: 45,
      weight_kg: 75.5,
      goal: "performance",
      created_at: "2026-02-14T10:00:00.000Z",
      updated_at: "2026-02-14T10:00:00.000Z",
    });
    expect(result.success).toBe(false);
  });
});
