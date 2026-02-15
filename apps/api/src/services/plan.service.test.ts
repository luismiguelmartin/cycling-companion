import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PlanDay } from "shared";
import { AppError } from "../plugins/error-handler.js";

const mockFrom = vi.fn();

vi.mock("./supabase.js", () => ({
  supabaseAdmin: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

const { getPlan, updatePlan, deletePlan, getWeekStart } = await import("./plan.service.js");

const mockPlanRow = {
  id: "plan-123",
  user_id: "user-123",
  week_start: "2026-02-10",
  plan_data: {
    days: Array.from({ length: 7 }, (_, i) => ({
      day: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"][i],
      date: `2026-02-${10 + i}`,
      type: i === 3 ? "rest" : "endurance",
      title: i === 3 ? "Descanso" : "Rodaje",
      intensity: i === 3 ? "—" : "media",
      duration: i === 3 ? "—" : "1h",
      description: "Descripción",
      nutrition: "Nutrición",
      rest: "Descanso",
      done: false,
      actual_power: null,
    })),
  },
  ai_rationale: "Plan adaptado a tu objetivo.",
  created_at: "2026-02-10T08:00:00Z",
  updated_at: "2026-02-10T08:00:00Z",
};

function mockChain(result: { data: unknown; error: unknown; count?: number | null }) {
  const chain: Record<string, unknown> = {};
  const methods = ["select", "eq", "update", "delete", "single"];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  chain["single"] = vi.fn().mockResolvedValue(result);
  chain["then"] = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject);
  mockFrom.mockReturnValue(chain);
  return chain;
}

describe("plan.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getWeekStart", () => {
    it("retorna lunes para una fecha entre semana", () => {
      // 2026-02-11 es miércoles
      const result = getWeekStart(new Date("2026-02-11"));
      expect(result).toBe("2026-02-09");
    });

    it("retorna lunes para un domingo", () => {
      // 2026-02-15 es domingo
      const result = getWeekStart(new Date("2026-02-15"));
      expect(result).toBe("2026-02-09");
    });
  });

  describe("getPlan", () => {
    it("retorna plan existente con días mapeados", async () => {
      mockChain({ data: mockPlanRow, error: null });

      const result = await getPlan("user-123", "2026-02-10");

      expect(result).not.toBeNull();
      expect(result!.id).toBe("plan-123");
      expect(result!.days).toHaveLength(7);
      expect(result!.week_start).toBe("2026-02-10");
      expect(result!.ai_rationale).toBe("Plan adaptado a tu objetivo.");
    });

    it("retorna null si no existe plan", async () => {
      mockChain({ data: null, error: { message: "not found" } });

      const result = await getPlan("user-123", "2026-02-10");
      expect(result).toBeNull();
    });

    it("retorna null ante error de Supabase", async () => {
      mockChain({ data: null, error: { message: "connection error" } });

      const result = await getPlan("user-123", "2026-02-10");
      expect(result).toBeNull();
    });

    it("usa lunes actual si no se pasa week_start", async () => {
      mockChain({ data: mockPlanRow, error: null });

      const result = await getPlan("user-123");
      expect(result).not.toBeNull();
      expect(mockFrom).toHaveBeenCalledWith("weekly_plans");
    });
  });

  describe("updatePlan", () => {
    it("actualiza plan existente", async () => {
      const updatedRow = {
        ...mockPlanRow,
        plan_data: {
          days: mockPlanRow.plan_data.days.map((d, i) =>
            i === 0 ? { ...d, done: true, actual_power: 200 } : d,
          ),
        },
        updated_at: "2026-02-12T10:00:00Z",
      };
      mockChain({ data: updatedRow, error: null });

      const days = updatedRow.plan_data.days as PlanDay[];
      const result = await updatePlan("user-123", "2026-02-10", days);

      expect(result.days[0].done).toBe(true);
      expect(result.days[0].actual_power).toBe(200);
    });

    it("lanza 404 si plan no existe", async () => {
      mockChain({ data: null, error: { message: "not found" } });

      const days = mockPlanRow.plan_data.days as PlanDay[];
      await expect(updatePlan("user-123", "2026-02-10", days)).rejects.toThrow(AppError);
      await expect(updatePlan("user-123", "2026-02-10", days)).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("lanza 404 ante error de Supabase", async () => {
      mockChain({ data: null, error: { message: "connection error" } });

      const days = mockPlanRow.plan_data.days as PlanDay[];
      await expect(updatePlan("user-123", "2026-02-10", days)).rejects.toThrow(AppError);
    });
  });

  describe("deletePlan", () => {
    it("elimina plan existente sin error", async () => {
      const chain: Record<string, unknown> = {};
      const methods = ["delete", "eq"];
      for (const m of methods) {
        chain[m] = vi.fn().mockReturnValue(chain);
      }
      chain["then"] = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
        Promise.resolve({ error: null, count: 1 }).then(resolve, reject);
      mockFrom.mockReturnValue(chain);

      await expect(deletePlan("user-123", "2026-02-10")).resolves.toBeUndefined();
    });

    it("lanza 404 si plan no existe (count=0)", async () => {
      const chain: Record<string, unknown> = {};
      const methods = ["delete", "eq"];
      for (const m of methods) {
        chain[m] = vi.fn().mockReturnValue(chain);
      }
      chain["then"] = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
        Promise.resolve({ error: null, count: 0 }).then(resolve, reject);
      mockFrom.mockReturnValue(chain);

      await expect(deletePlan("user-123", "2026-02-10")).rejects.toThrow(AppError);
      await expect(deletePlan("user-123", "2026-02-10")).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });
});
