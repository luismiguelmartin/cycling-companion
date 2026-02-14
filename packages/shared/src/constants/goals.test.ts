import { describe, it, expect } from "vitest";
import { GOALS, ONBOARDING_STEPS } from "./goals";

describe("GOALS", () => {
  it("tiene 4 objetivos", () => {
    expect(GOALS).toHaveLength(4);
  });

  it("cada objetivo tiene key, icon, label y description", () => {
    for (const goal of GOALS) {
      expect(goal).toHaveProperty("key");
      expect(goal).toHaveProperty("icon");
      expect(goal).toHaveProperty("label");
      expect(goal).toHaveProperty("description");
    }
  });

  it("las keys son las esperadas", () => {
    const keys = GOALS.map((g) => g.key);
    expect(keys).toEqual(["performance", "health", "weight_loss", "recovery"]);
  });
});

describe("ONBOARDING_STEPS", () => {
  it("tiene 4 pasos", () => {
    expect(ONBOARDING_STEPS).toHaveLength(4);
  });

  it("cada paso tiene title, subtitle e iconName", () => {
    for (const step of ONBOARDING_STEPS) {
      expect(step).toHaveProperty("title");
      expect(step).toHaveProperty("subtitle");
      expect(step).toHaveProperty("iconName");
    }
  });

  it("los iconNames son válidos nombres de Lucide", () => {
    const validIcons = ["User", "Heart", "Target", "Check"];
    for (const step of ONBOARDING_STEPS) {
      expect(validIcons).toContain(step.iconName);
    }
  });
});
