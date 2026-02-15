import { describe, it, expect } from "vitest";
import { WEATHER_TYPES } from "./weather";

describe("WEATHER_TYPES", () => {
  it("tiene 5 tipos de clima", () => {
    expect(Object.keys(WEATHER_TYPES)).toHaveLength(5);
  });

  it("cada tipo tiene value, label e icon", () => {
    for (const weather of Object.values(WEATHER_TYPES)) {
      expect(weather).toHaveProperty("value");
      expect(weather).toHaveProperty("label");
      expect(weather).toHaveProperty("icon");
    }
  });

  it("las keys son las esperadas", () => {
    const keys = Object.keys(WEATHER_TYPES);
    expect(keys).toEqual(["sunny", "cloudy", "rainy", "windy", "cold"]);
  });

  it("los labels están en español", () => {
    expect(WEATHER_TYPES.sunny.label).toBe("Soleado");
    expect(WEATHER_TYPES.cloudy.label).toBe("Nublado");
    expect(WEATHER_TYPES.rainy.label).toBe("Lluvioso");
    expect(WEATHER_TYPES.windy.label).toBe("Ventoso");
    expect(WEATHER_TYPES.cold.label).toBe("Frío");
  });

  it("los iconos son válidos nombres de Lucide", () => {
    const validIcons = ["Sun", "Cloud", "CloudRain", "Wind", "Snowflake"];
    for (const weather of Object.values(WEATHER_TYPES)) {
      expect(validIcons).toContain(weather.icon);
    }
  });
});
