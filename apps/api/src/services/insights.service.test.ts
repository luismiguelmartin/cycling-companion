import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "../plugins/error-handler.js";
import { supabaseAdmin } from "./supabase.js";

vi.mock("./supabase.js", () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}));

const mockFrom = vi.mocked(supabaseAdmin.from);

/**
 * Mock helper that supports sequential calls to supabaseAdmin.from().
 * Each call to from() returns a fluent chain where every method is both
 * a passthrough (.mockReturnThis) AND a thenable (resolves to the result).
 * This way, no matter which method is last in the chain, the promise resolves.
 */
function mockFromSequence(results: Array<{ data: unknown; error: unknown }>) {
  let callIndex = 0;
  mockFrom.mockImplementation(() => {
    const result = results[callIndex] ?? results[results.length - 1];
    callIndex++;

    // Create a thenable chain: each method returns an object that is both
    // chainable and thenable (has .then)
    function createChainLink(): Record<string, unknown> {
      const link: Record<string, unknown> = {};
      const methods = ["select", "eq", "gte", "lte", "order", "range"];
      for (const method of methods) {
        link[method] = vi.fn().mockImplementation(() => createChainLink());
      }
      // Make this link thenable so it resolves as a promise
      link["then"] = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) => {
        return Promise.resolve(result).then(resolve, reject);
      };
      return link;
    }

    return createChainLink() as ReturnType<typeof mockFrom>;
  });
}

const { getInsights, checkOverload } = await import("./insights.service.js");

const makeActivity = (overrides: Record<string, unknown> = {}) => ({
  date: "2026-02-10",
  duration_seconds: 3600,
  distance_km: 30.5,
  avg_power_watts: 200,
  avg_hr_bpm: 140,
  tss: 55,
  ...overrides,
});

/**
 * Helper to generate dates relative to the current Monday (week start).
 * weekOffset: 0 = current week, -1 = last week, -2 = two weeks ago, etc.
 * dayOffset: 0 = Monday, 1 = Tuesday, etc.
 */
function dateInWeek(weekOffset: number, dayOffset = 0): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);

  const target = new Date(monday);
  target.setDate(target.getDate() + weekOffset * 7 + dayOffset);
  return target.toISOString().split("T")[0];
}

describe("insights.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getInsights", () => {
    it("retorna estructura correcta con datos en ambos periodos", async () => {
      const activitiesA = [makeActivity()];
      const activitiesB = [makeActivity({ avg_power_watts: 210, distance_km: 35 })];
      mockFromSequence([
        { data: activitiesA, error: null },
        { data: activitiesB, error: null },
      ]);

      const result = await getInsights(
        "user-123",
        "2026-02-01",
        "2026-02-07",
        "2026-02-08",
        "2026-02-15",
      );

      expect(result.comparison).toHaveLength(6);
      expect(result.radar).toHaveLength(5);
      expect(result.analysis).not.toBeNull();
    });

    it("retorna analysis null cuando ambos periodos están vacíos", async () => {
      mockFromSequence([
        { data: [], error: null },
        { data: [], error: null },
      ]);

      const result = await getInsights(
        "user-123",
        "2026-02-01",
        "2026-02-07",
        "2026-02-08",
        "2026-02-15",
      );

      expect(result.analysis).toBeNull();
    });

    it("calcula distancia agregada correctamente (sum + round 1 decimal)", async () => {
      const activitiesB = [
        makeActivity({ distance_km: 15.3 }),
        makeActivity({ distance_km: 20.4 }),
      ];
      mockFromSequence([
        { data: [], error: null },
        { data: activitiesB, error: null },
      ]);

      const result = await getInsights(
        "user-123",
        "2026-02-01",
        "2026-02-07",
        "2026-02-08",
        "2026-02-15",
      );

      const distMetric = result.comparison.find((m) => m.metric === "Distancia");
      expect(distMetric?.valueB).toBe(35.7);
    });

    it("calcula potencia media ignorando nulls", async () => {
      const activitiesB = [
        makeActivity({ avg_power_watts: 200 }),
        makeActivity({ avg_power_watts: null }),
        makeActivity({ avg_power_watts: 300 }),
      ];
      mockFromSequence([
        { data: [], error: null },
        { data: activitiesB, error: null },
      ]);

      const result = await getInsights(
        "user-123",
        "2026-02-01",
        "2026-02-07",
        "2026-02-08",
        "2026-02-15",
      );

      const powerMetric = result.comparison.find((m) => m.metric === "Potencia");
      expect(powerMetric?.valueB).toBe(250);
    });

    it("calcula FC media ignorando nulls", async () => {
      const activitiesB = [
        makeActivity({ avg_hr_bpm: 140 }),
        makeActivity({ avg_hr_bpm: null }),
        makeActivity({ avg_hr_bpm: 160 }),
      ];
      mockFromSequence([
        { data: [], error: null },
        { data: activitiesB, error: null },
      ]);

      const result = await getInsights(
        "user-123",
        "2026-02-01",
        "2026-02-07",
        "2026-02-08",
        "2026-02-15",
      );

      const hrMetric = result.comparison.find((m) => m.metric === "FC media");
      expect(hrMetric?.valueB).toBe(150);
    });

    it("genera TSS alert cuando sube >15%", async () => {
      const activitiesA = [makeActivity({ tss: 100 })];
      const activitiesB = [makeActivity({ tss: 120 })]; // +20%
      mockFromSequence([
        { data: activitiesA, error: null },
        { data: activitiesB, error: null },
      ]);

      const result = await getInsights(
        "user-123",
        "2026-02-01",
        "2026-02-07",
        "2026-02-08",
        "2026-02-15",
      );

      expect(result.analysis?.alert).toBeDefined();
      expect(result.analysis?.alert).toContain("20%");
    });

    it("no genera TSS alert cuando sube ≤15%", async () => {
      const activitiesA = [makeActivity({ tss: 100 })];
      const activitiesB = [makeActivity({ tss: 110 })]; // +10%
      mockFromSequence([
        { data: activitiesA, error: null },
        { data: activitiesB, error: null },
      ]);

      const result = await getInsights(
        "user-123",
        "2026-02-01",
        "2026-02-07",
        "2026-02-08",
        "2026-02-15",
      );

      expect(result.analysis?.alert).toBeUndefined();
    });

    it("capea valores de radar a 100", async () => {
      const activitiesB = [makeActivity({ distance_km: 500 })];
      mockFromSequence([
        { data: [], error: null },
        { data: activitiesB, error: null },
      ]);

      const result = await getInsights(
        "user-123",
        "2026-02-01",
        "2026-02-07",
        "2026-02-08",
        "2026-02-15",
      );

      const volumen = result.radar.find((r) => r.metric === "Volumen");
      expect(volumen?.B).toBe(100);
    });

    it("lanza AppError 500 cuando falla query periodo A", async () => {
      mockFromSequence([
        { data: null, error: { message: "DB error" } },
        { data: [], error: null },
      ]);

      await expect(
        getInsights("user-123", "2026-02-01", "2026-02-07", "2026-02-08", "2026-02-15"),
      ).rejects.toThrow(AppError);

      mockFromSequence([
        { data: null, error: { message: "DB error" } },
        { data: [], error: null },
      ]);

      await expect(
        getInsights("user-123", "2026-02-01", "2026-02-07", "2026-02-08", "2026-02-15"),
      ).rejects.toMatchObject({ statusCode: 500 });
    });

    it("lanza AppError 500 cuando falla query periodo B", async () => {
      mockFromSequence([
        { data: [], error: null },
        { data: null, error: { message: "DB error" } },
      ]);

      await expect(
        getInsights("user-123", "2026-02-01", "2026-02-07", "2026-02-08", "2026-02-15"),
      ).rejects.toThrow(AppError);

      mockFromSequence([
        { data: [], error: null },
        { data: null, error: { message: "DB error" } },
      ]);

      await expect(
        getInsights("user-123", "2026-02-01", "2026-02-07", "2026-02-08", "2026-02-15"),
      ).rejects.toMatchObject({ statusCode: 500 });
    });
  });

  describe("checkOverload", () => {
    it("carga normal (<120%) retorna is_overloaded false, alert_level none", async () => {
      const currentActivities = [makeActivity({ tss: 100 })];
      // One activity per previous week, each with TSS 100 → avg = 100, percentage = 100%
      const prevActivities = [
        makeActivity({ tss: 100, date: dateInWeek(-1, 1) }),
        makeActivity({ tss: 100, date: dateInWeek(-2, 1) }),
        makeActivity({ tss: 100, date: dateInWeek(-3, 1) }),
        makeActivity({ tss: 100, date: dateInWeek(-4, 1) }),
      ];
      mockFromSequence([
        { data: currentActivities, error: null },
        { data: prevActivities, error: null },
      ]);

      const result = await checkOverload("user-123");

      expect(result.is_overloaded).toBe(false);
      expect(result.alert_level).toBe("none");
    });

    it("warning (120-149%) retorna is_overloaded true, alert_level warning", async () => {
      const currentActivities = [makeActivity({ tss: 260 })];
      const prevActivities = [
        makeActivity({ tss: 200, date: dateInWeek(-1, 1) }),
        makeActivity({ tss: 200, date: dateInWeek(-2, 1) }),
        makeActivity({ tss: 200, date: dateInWeek(-3, 1) }),
        makeActivity({ tss: 200, date: dateInWeek(-4, 1) }),
      ];
      mockFromSequence([
        { data: currentActivities, error: null },
        { data: prevActivities, error: null },
      ]);

      const result = await checkOverload("user-123");

      expect(result.is_overloaded).toBe(true);
      expect(result.alert_level).toBe("warning");
    });

    it("critical (≥150%) retorna is_overloaded true, alert_level critical", async () => {
      const currentActivities = [makeActivity({ tss: 300 })];
      const prevActivities = [
        makeActivity({ tss: 200, date: dateInWeek(-1, 1) }),
        makeActivity({ tss: 200, date: dateInWeek(-2, 1) }),
        makeActivity({ tss: 200, date: dateInWeek(-3, 1) }),
        makeActivity({ tss: 200, date: dateInWeek(-4, 1) }),
      ];
      mockFromSequence([
        { data: currentActivities, error: null },
        { data: prevActivities, error: null },
      ]);

      const result = await checkOverload("user-123");

      expect(result.is_overloaded).toBe(true);
      expect(result.alert_level).toBe("critical");
    });

    it("sin actividades previas retorna percentage 0, is_overloaded false", async () => {
      mockFromSequence([
        { data: [makeActivity({ tss: 50 })], error: null },
        { data: [], error: null },
      ]);

      const result = await checkOverload("user-123");

      expect(result.percentage).toBe(0);
      expect(result.is_overloaded).toBe(false);
      expect(result.alert_level).toBe("none");
    });

    it("lanza AppError 500 cuando falla query", async () => {
      mockFromSequence([
        { data: null, error: { message: "DB error" } },
        { data: [], error: null },
      ]);

      await expect(checkOverload("user-123")).rejects.toThrow(AppError);

      mockFromSequence([
        { data: null, error: { message: "DB error" } },
        { data: [], error: null },
      ]);

      await expect(checkOverload("user-123")).rejects.toMatchObject({ statusCode: 500 });
    });
  });
});
