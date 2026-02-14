import { describe, it, expect } from "vitest";
import { formatActivityDate } from "./format-date";

describe("formatActivityDate", () => {
  it('formatea "2026-02-14" a "14 feb 2026"', () => {
    expect(formatActivityDate("2026-02-14")).toBe("14 feb 2026");
  });

  it("formatea correctamente diferentes meses", () => {
    expect(formatActivityDate("2026-01-05")).toBe("5 ene 2026");
    expect(formatActivityDate("2026-06-20")).toBe("20 jun 2026");
    expect(formatActivityDate("2026-12-31")).toBe("31 dic 2026");
  });

  it("formatea correctamente el primer día del año", () => {
    expect(formatActivityDate("2026-01-01")).toBe("1 ene 2026");
  });
});
