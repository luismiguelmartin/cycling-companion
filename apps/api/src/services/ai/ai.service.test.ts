import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  aiActivityAnalysisSchema,
  aiCoachTipSchema,
  aiWeeklySummarySchema,
  aiWeeklyPlanResponseSchema,
} from "shared";
import { AppError } from "../../plugins/error-handler.js";

// Mock Supabase
const mockFrom = vi.fn();

vi.mock("../supabase.js", () => ({
  supabaseAdmin: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

// Mock Anthropic
const mockCreate = vi.fn();
vi.mock("../anthropic.js", () => ({
  anthropic: {
    messages: {
      create: (...args: unknown[]) => mockCreate(...args),
    },
  },
}));

// Mock profile service
vi.mock("../profile.service.js", () => ({
  getProfile: vi.fn().mockResolvedValue({
    id: "user-123",
    email: "test@example.com",
    display_name: "Test User",
    age: 45,
    weight_kg: 75,
    ftp: 250,
    max_hr: 185,
    rest_hr: 55,
    goal: "performance",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  }),
}));

// Mock activity service
vi.mock("../activity.service.js", () => ({
  getActivity: vi.fn().mockResolvedValue({
    id: "act-123",
    user_id: "user-123",
    name: "Morning Ride",
    date: "2026-02-15",
    type: "endurance",
    duration_seconds: 3600,
    distance_km: 30,
    avg_power_watts: 200,
    avg_hr_bpm: 140,
    max_hr_bpm: 165,
    avg_cadence_rpm: 85,
    tss: 64,
    rpe: 6,
    ai_analysis: null,
    notes: null,
    is_reference: false,
    raw_file_url: null,
    created_at: "2026-02-15T10:00:00Z",
    updated_at: "2026-02-15T10:00:00Z",
  }),
  listActivities: vi.fn().mockResolvedValue({
    data: [
      {
        id: "act-123",
        user_id: "user-123",
        name: "Morning Ride",
        date: "2026-02-15",
        type: "endurance",
        duration_seconds: 3600,
        distance_km: 30,
        avg_power_watts: 200,
        avg_hr_bpm: 140,
        max_hr_bpm: 165,
        avg_cadence_rpm: 85,
        tss: 64,
        rpe: 6,
        ai_analysis: null,
        notes: null,
        is_reference: false,
        raw_file_url: null,
        created_at: "2026-02-15T10:00:00Z",
        updated_at: "2026-02-15T10:00:00Z",
      },
    ],
    meta: { page: 1, limit: 14, total: 1, totalPages: 1 },
  }),
}));

const { analyzeActivity, generateWeeklyPlan, generateWeeklySummary, getCoachTip } =
  await import("./ai.service.js");

const validAnalysis = {
  summary: "Buena sesión de resistencia.",
  recommendation: "Mañana sesión de recuperación.",
  tips: { hydration: "Bebe 500ml extra.", nutrition: "Repón carbs." },
};

const validCoachTip = {
  recommendation: "Hoy es buen día para intervalos.",
  tips: { hydration: "2L mínimo.", sleep: "8h sueño." },
};

const validWeeklySummary = {
  summary: "Semana productiva.",
  recommendation: "Mantén el ritmo.",
};

const validWeeklyPlan = {
  days: Array.from({ length: 7 }, (_, i) => ({
    day: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"][i],
    date: `2026-02-${16 + i}`,
    type: i === 3 ? "rest" : "endurance",
    title: i === 3 ? "Descanso" : "Rodaje",
    intensity: i === 3 ? "—" : "media",
    duration: i === 3 ? "—" : "1h",
    description: "Descripción",
    nutrition: "Nutrición",
    rest: "Descanso",
  })),
  rationale: "Plan adaptado.",
};

function mockClaudeResponse(response: unknown) {
  mockCreate.mockResolvedValue({
    content: [{ type: "text", text: JSON.stringify(response) }],
  });
}

/**
 * Sets up supabase mock with self-referencing chains for all operations.
 * Uses mockReturnThis() to avoid infinite recursion.
 * Supports: from().select().eq().gte().gt().single() for cache reads and rate limit checks.
 * Also supports: from().update().eq() and from().upsert() for writes.
 */
function setupSupabaseMock(options: { rateLimitCount?: number; cachedResponse?: unknown }) {
  const { rateLimitCount = 0, cachedResponse = null } = options;

  mockFrom.mockImplementation((table: string) => {
    if (table === "ai_cache") {
      const cacheResult = cachedResponse
        ? { data: { response: cachedResponse }, error: null }
        : { data: null, error: { message: "not found" } };

      // Build a self-referencing chain (no recursion)
      const chain: Record<string, unknown> = {};
      const chainMethods = ["eq", "gte", "gt", "upsert"];
      for (const m of chainMethods) {
        chain[m] = vi.fn().mockReturnValue(chain);
      }
      chain["single"] = vi.fn().mockResolvedValue(cacheResult);
      chain["select"] = vi
        .fn()
        .mockImplementation((_cols?: string, opts?: { count?: string; head?: boolean }) => {
          if (opts?.count === "exact" && opts?.head) {
            // Rate limit query — return a thenable that resolves with count
            const rateLink: Record<string, unknown> = {};
            for (const m of chainMethods) {
              rateLink[m] = vi.fn().mockReturnValue(rateLink);
            }
            rateLink["then"] = (
              resolve: (v: unknown) => unknown,
              reject: (e: unknown) => unknown,
            ) => Promise.resolve({ count: rateLimitCount, error: null }).then(resolve, reject);
            return rateLink;
          }
          return chain;
        });
      chain["then"] = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
        Promise.resolve({ data: null, error: null }).then(resolve, reject);
      return chain as ReturnType<typeof mockFrom>;
    }

    // Activities / weekly_plans / users tables — simple self-referencing chain
    const writeChain: Record<string, unknown> = {};
    const writeMethods = [
      "select",
      "update",
      "upsert",
      "eq",
      "single",
      "order",
      "range",
      "gte",
      "lte",
    ];
    for (const m of writeMethods) {
      writeChain[m] = vi.fn().mockReturnValue(writeChain);
    }
    writeChain["then"] = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
      Promise.resolve({ data: null, error: null }).then(resolve, reject);
    return writeChain as ReturnType<typeof mockFrom>;
  });
}

describe("ai.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("analyzeActivity", () => {
    it("retorna análisis válido de Claude", async () => {
      setupSupabaseMock({});
      mockClaudeResponse(validAnalysis);

      const result = await analyzeActivity("user-123", "act-123");
      expect(() => aiActivityAnalysisSchema.parse(result)).not.toThrow();
      expect(result.summary).toBe(validAnalysis.summary);
    });

    it("retorna fallback cuando Claude falla", async () => {
      setupSupabaseMock({});
      mockCreate.mockRejectedValue(new Error("API down"));

      const result = await analyzeActivity("user-123", "act-123");
      expect(() => aiActivityAnalysisSchema.parse(result)).not.toThrow();
      expect(result.summary).toBeDefined();
    });

    it("retorna fallback cuando Claude devuelve JSON inválido", async () => {
      setupSupabaseMock({});
      mockCreate.mockResolvedValue({
        content: [{ type: "text", text: "esto no es json" }],
      });

      const result = await analyzeActivity("user-123", "act-123");
      expect(() => aiActivityAnalysisSchema.parse(result)).not.toThrow();
    });

    it("retorna caché si existe", async () => {
      setupSupabaseMock({ cachedResponse: validAnalysis });

      const result = await analyzeActivity("user-123", "act-123");
      expect(result).toEqual(validAnalysis);
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  describe("generateWeeklyPlan", () => {
    it("retorna plan de 7 días válido", async () => {
      setupSupabaseMock({});
      mockClaudeResponse(validWeeklyPlan);

      const result = await generateWeeklyPlan("user-123");
      expect(() => aiWeeklyPlanResponseSchema.parse(result)).not.toThrow();
      expect(result.days).toHaveLength(7);
    });

    it("retorna fallback cuando Claude falla", async () => {
      setupSupabaseMock({});
      mockCreate.mockRejectedValue(new Error("API down"));

      const result = await generateWeeklyPlan("user-123");
      expect(() => aiWeeklyPlanResponseSchema.parse(result)).not.toThrow();
      expect(result.days).toHaveLength(7);
    });

    it("bypasses caché con force_regenerate", async () => {
      setupSupabaseMock({ cachedResponse: validWeeklyPlan });
      mockClaudeResponse(validWeeklyPlan);

      await generateWeeklyPlan("user-123", undefined, true);
      expect(mockCreate).toHaveBeenCalled();
    });
  });

  describe("generateWeeklySummary", () => {
    it("retorna resumen válido", async () => {
      setupSupabaseMock({});
      mockClaudeResponse(validWeeklySummary);

      const result = await generateWeeklySummary(
        "user-123",
        "2026-02-01",
        "2026-02-07",
        "2026-02-08",
        "2026-02-15",
      );
      expect(() => aiWeeklySummarySchema.parse(result)).not.toThrow();
    });

    it("retorna fallback cuando Claude falla", async () => {
      setupSupabaseMock({});
      mockCreate.mockRejectedValue(new Error("API down"));

      const result = await generateWeeklySummary(
        "user-123",
        "2026-02-01",
        "2026-02-07",
        "2026-02-08",
        "2026-02-15",
      );
      expect(() => aiWeeklySummarySchema.parse(result)).not.toThrow();
    });
  });

  describe("getCoachTip", () => {
    it("retorna tip válido", async () => {
      setupSupabaseMock({});
      mockClaudeResponse(validCoachTip);

      const result = await getCoachTip("user-123");
      expect(() => aiCoachTipSchema.parse(result)).not.toThrow();
    });

    it("retorna caché si existe (no llama a Claude)", async () => {
      setupSupabaseMock({ cachedResponse: validCoachTip });

      const result = await getCoachTip("user-123");
      expect(result).toEqual(validCoachTip);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it("retorna fallback cuando Claude falla", async () => {
      setupSupabaseMock({});
      mockCreate.mockRejectedValue(new Error("API down"));

      const result = await getCoachTip("user-123");
      expect(() => aiCoachTipSchema.parse(result)).not.toThrow();
    });
  });

  describe("rate limiting", () => {
    it("lanza AppError 429 tras 20 llamadas/día", async () => {
      setupSupabaseMock({ rateLimitCount: 20 });

      await expect(analyzeActivity("user-123", "act-123")).rejects.toThrow(AppError);

      setupSupabaseMock({ rateLimitCount: 20 });
      await expect(analyzeActivity("user-123", "act-123")).rejects.toMatchObject({
        statusCode: 429,
      });
    });
  });
});
