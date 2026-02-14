import { describe, it, expect } from "vitest";
import { ACTIVITY_FILTERS } from "./activity-filters";

describe("ACTIVITY_FILTERS", () => {
  it("tiene 5 filtros definidos", () => {
    expect(Object.keys(ACTIVITY_FILTERS)).toHaveLength(5);
  });

  it("incluye all, intervals, endurance, recovery, tempo", () => {
    expect(ACTIVITY_FILTERS).toHaveProperty("all");
    expect(ACTIVITY_FILTERS).toHaveProperty("intervals");
    expect(ACTIVITY_FILTERS).toHaveProperty("endurance");
    expect(ACTIVITY_FILTERS).toHaveProperty("recovery");
    expect(ACTIVITY_FILTERS).toHaveProperty("tempo");
  });

  it("no incluye rest", () => {
    expect(ACTIVITY_FILTERS).not.toHaveProperty("rest");
  });

  it("el filtro all tiene type null", () => {
    expect(ACTIVITY_FILTERS.all.type).toBeNull();
  });

  it("cada filtro tiene label y type", () => {
    for (const filter of Object.values(ACTIVITY_FILTERS)) {
      expect(filter).toHaveProperty("label");
      expect(filter).toHaveProperty("type");
    }
  });
});
