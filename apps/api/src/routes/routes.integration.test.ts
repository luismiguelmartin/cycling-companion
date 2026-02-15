import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { FastifyInstance } from "fastify";

vi.mock("../config/env.js", () => ({
  env: {
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-key",
    ANTHROPIC_API_KEY: "test-anthropic-key",
    PORT: 3001,
    FRONTEND_URL: "http://localhost:3000",
  },
}));

vi.mock("../services/supabase.js", () => ({
  supabaseAdmin: {
    auth: { getUser: vi.fn() },
    from: vi.fn(),
  },
}));

const mockClaudeCreate = vi.fn();
vi.mock("../services/anthropic.js", () => ({
  anthropic: {
    messages: {
      create: (...args: unknown[]) => mockClaudeCreate(...args),
    },
  },
}));

const { buildApp } = await import("../app.js");
const { supabaseAdmin } = await import("../services/supabase.js");

const mockProfile = {
  id: "user-123",
  email: "test@example.com",
  display_name: "Test User",
  age: 42,
  weight_kg: 75.5,
  ftp: 250,
  max_hr: 185,
  rest_hr: 55,
  goal: "performance",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const mockActivity = {
  id: "act-123",
  user_id: "user-123",
  name: "Morning Ride",
  date: "2026-02-10",
  type: "endurance",
  duration_seconds: 3600,
  distance_km: 30.5,
  avg_power_watts: 200,
  avg_hr_bpm: 145,
  max_hr_bpm: 175,
  avg_cadence_rpm: 85,
  tss: 55,
  rpe: 6,
  ai_analysis: null,
  notes: null,
  is_reference: false,
  raw_file_url: null,
  created_at: "2026-02-10T08:00:00Z",
  updated_at: "2026-02-10T08:00:00Z",
};

const authHeaders = { Authorization: "Bearer test-token" };

function mockAuthSuccess() {
  vi.mocked(supabaseAdmin.auth.getUser).mockResolvedValue({
    data: { user: { id: "user-123", email: "test@example.com" } },
    error: null,
  } as ReturnType<typeof supabaseAdmin.auth.getUser> extends Promise<infer R> ? R : never);
}

function mockAuthFailure() {
  vi.mocked(supabaseAdmin.auth.getUser).mockResolvedValue({
    data: { user: null },
    error: { message: "Invalid token" },
  } as ReturnType<typeof supabaseAdmin.auth.getUser> extends Promise<infer R> ? R : never);
}

function mockFromChain(result: { data: unknown; error: unknown; count?: number | null }) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockResolvedValue(result),
    single: vi.fn().mockResolvedValue(result),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  };
  vi.mocked(supabaseAdmin.from).mockReturnValue(chain as ReturnType<typeof supabaseAdmin.from>);
  return chain;
}

describe("API Integration", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockAuthSuccess();
    app = await buildApp({ logger: false });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe("Health (público)", () => {
    it("GET /health devuelve 200 con status ok", async () => {
      const res = await app.inject({ method: "GET", url: "/health" });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ status: "ok" });
    });

    it("GET /health funciona sin token", async () => {
      mockAuthFailure();
      const res = await app.inject({ method: "GET", url: "/health" });
      expect(res.statusCode).toBe(200);
    });
  });

  describe("Auth", () => {
    it("sin Authorization header devuelve 401", async () => {
      const res = await app.inject({ method: "GET", url: "/api/v1/profile" });
      expect(res.statusCode).toBe(401);
      expect(res.json()).toMatchObject({ error: "Unauthorized" });
    });

    it("con token inválido devuelve 401", async () => {
      mockAuthFailure();
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/profile",
        headers: authHeaders,
      });
      expect(res.statusCode).toBe(401);
    });

    it("con Bearer token válido pasa auth", async () => {
      mockFromChain({ data: mockProfile, error: null });
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/profile",
        headers: authHeaders,
      });
      expect(res.statusCode).toBe(200);
    });
  });

  describe("Profile", () => {
    it("GET /api/v1/profile devuelve 200 con perfil", async () => {
      mockFromChain({ data: mockProfile, error: null });
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/profile",
        headers: authHeaders,
      });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ data: mockProfile });
    });

    it("PATCH /api/v1/profile devuelve 200 con perfil actualizado", async () => {
      const updated = { ...mockProfile, ftp: 260 };
      mockFromChain({ data: updated, error: null });
      const res = await app.inject({
        method: "PATCH",
        url: "/api/v1/profile",
        headers: authHeaders,
        payload: { ftp: 260 },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ data: updated });
    });
  });

  describe("Activities", () => {
    it("GET /api/v1/activities devuelve 200 con lista paginada", async () => {
      mockFromChain({ data: [mockActivity], error: null, count: 1 });
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/activities",
        headers: authHeaders,
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data).toEqual([mockActivity]);
      expect(body.meta).toMatchObject({ page: 1, limit: 20, total: 1 });
    });

    it("GET /api/v1/activities/:id devuelve 200 con detalle", async () => {
      mockFromChain({ data: mockActivity, error: null });
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/activities/act-123",
        headers: authHeaders,
      });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ data: mockActivity });
    });

    it("POST /api/v1/activities devuelve 201 con actividad creada", async () => {
      const chain = mockFromChain({ data: mockActivity, error: null });
      chain.single
        .mockResolvedValueOnce({ data: mockProfile, error: null })
        .mockResolvedValueOnce({ data: mockActivity, error: null });
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/activities",
        headers: authHeaders,
        payload: {
          name: "Morning Ride",
          date: "2026-02-10",
          type: "endurance",
          duration_seconds: 3600,
        },
      });
      expect(res.statusCode).toBe(201);
      expect(res.json()).toEqual({ data: mockActivity });
    });

    it("DELETE /api/v1/activities/:id devuelve 204", async () => {
      const lastEq = vi.fn().mockResolvedValue({ error: null, count: 1 });
      const firstEq = vi.fn().mockReturnValue({ eq: lastEq });
      const deleteFn = vi.fn().mockReturnValue({ eq: firstEq });
      vi.mocked(supabaseAdmin.from).mockReturnValue({
        delete: deleteFn,
      } as ReturnType<typeof supabaseAdmin.from>);
      const res = await app.inject({
        method: "DELETE",
        url: "/api/v1/activities/act-123",
        headers: authHeaders,
      });
      expect(res.statusCode).toBe(204);
      expect(res.body).toBe("");
    });
  });

  describe("Insights", () => {
    it("GET /api/v1/insights sin query params devuelve 400", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/insights",
        headers: authHeaders,
      });
      expect(res.statusCode).toBe(400);
      expect(res.json()).toMatchObject({ code: "BAD_REQUEST" });
    });

    it("GET /api/v1/insights con periodos devuelve 200 con estructura correcta", async () => {
      const mockInsightActivities = [
        {
          date: "2026-02-10",
          duration_seconds: 3600,
          distance_km: 30,
          avg_power_watts: 200,
          avg_hr_bpm: 140,
          tss: 55,
        },
      ];
      const chain = mockFromChain({ data: mockInsightActivities, error: null });
      // getInsights calls supabase.from("activities") twice via Promise.all
      // Both calls go through the same mock chain, both resolve with the same data
      chain.lte.mockResolvedValue({ data: mockInsightActivities, error: null });

      const res = await app.inject({
        method: "GET",
        url: "/api/v1/insights?period_a_start=2026-02-01&period_a_end=2026-02-07&period_b_start=2026-02-08&period_b_end=2026-02-15",
        headers: authHeaders,
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data).toHaveProperty("comparison");
      expect(body.data).toHaveProperty("radar");
      expect(body.data).toHaveProperty("analysis");
      expect(body.data.comparison).toHaveLength(6);
      expect(body.data.radar).toHaveLength(5);
    });

    it("GET /api/v1/insights/overload-check devuelve 200 con estructura correcta", async () => {
      // checkOverload calls from() twice via Promise.all.
      // First chain ends with .gte() (no .lte()), second ends with .lte().
      // Use thenable chains so any method can be the terminal.
      function createThenableChain(result: { data: unknown; error: unknown }) {
        function chainLink(): Record<string, unknown> {
          const link: Record<string, unknown> = {};
          for (const m of ["select", "eq", "gte", "lte"]) {
            link[m] = vi.fn().mockImplementation(() => chainLink());
          }
          link["then"] = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
            Promise.resolve(result).then(resolve, reject);
          return link;
        }
        return chainLink();
      }

      vi.mocked(supabaseAdmin.from).mockImplementation(() => {
        const result = { data: [], error: null };
        return createThenableChain(result) as ReturnType<typeof supabaseAdmin.from>;
      });

      const res = await app.inject({
        method: "GET",
        url: "/api/v1/insights/overload-check",
        headers: authHeaders,
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data).toHaveProperty("currentLoad");
      expect(body.data).toHaveProperty("avgLoad");
      expect(body.data).toHaveProperty("percentage");
      expect(body.data).toHaveProperty("is_overloaded");
      expect(body.data).toHaveProperty("alert_level");
    });

    it("GET /api/v1/insights sin auth devuelve 401", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/insights?period_a_start=2026-02-01&period_a_end=2026-02-07&period_b_start=2026-02-08&period_b_end=2026-02-15",
      });
      expect(res.statusCode).toBe(401);
    });
  });

  describe("AI", () => {
    const validAnalysis = {
      summary: "Buena sesión.",
      recommendation: "Recuperación mañana.",
      tips: { hydration: "Bebe agua." },
    };

    const validCoachTip = {
      recommendation: "Hoy intervalos.",
      tips: { hydration: "2L mínimo." },
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

    /**
     * Creates self-referencing mock chains for supabase.from() that handle all
     * AI service internal calls without infinite recursion.
     */
    function setupAIMocks(claudeResponse: unknown) {
      mockClaudeCreate.mockResolvedValue({
        content: [{ type: "text", text: JSON.stringify(claudeResponse) }],
      });

      function buildChain(defaultResult: {
        data: unknown;
        error: unknown;
        count?: number | null;
      }): ReturnType<typeof supabaseAdmin.from> {
        const chain: Record<string, unknown> = {};
        const selfMethods = [
          "eq",
          "gte",
          "gt",
          "lte",
          "or",
          "order",
          "insert",
          "update",
          "upsert",
          "delete",
        ];
        for (const m of selfMethods) {
          chain[m] = vi.fn().mockReturnValue(chain);
        }
        chain["single"] = vi.fn().mockResolvedValue(defaultResult);
        chain["range"] = vi.fn().mockResolvedValue(defaultResult);
        chain["select"] = vi
          .fn()
          .mockImplementation((_cols?: string, opts?: { count?: string; head?: boolean }) => {
            if (opts?.count === "exact" && opts?.head) {
              // Rate limit check — self-ref chain that resolves with count: 0
              const rateChain: Record<string, unknown> = {};
              for (const m of selfMethods) {
                rateChain[m] = vi.fn().mockReturnValue(rateChain);
              }
              rateChain["then"] = (
                resolve: (v: unknown) => unknown,
                reject: (e: unknown) => unknown,
              ) => Promise.resolve({ count: 0, error: null }).then(resolve, reject);
              return rateChain;
            }
            return chain;
          });
        chain["then"] = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
          Promise.resolve(defaultResult).then(resolve, reject);
        return chain as ReturnType<typeof supabaseAdmin.from>;
      }

      vi.mocked(supabaseAdmin.from).mockImplementation((table: string) => {
        if (table === "users") {
          return buildChain({ data: mockProfile, error: null });
        }
        if (table === "activities") {
          return buildChain({ data: [mockActivity], error: null, count: 1 });
        }
        if (table === "ai_cache") {
          return buildChain({ data: null, error: { message: "not found" } });
        }
        return buildChain({ data: null, error: null });
      });
    }

    it("POST /api/v1/ai/analyze-activity devuelve 200 con análisis", async () => {
      setupAIMocks(validAnalysis);
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/ai/analyze-activity",
        headers: authHeaders,
        payload: { activity_id: "act-123" },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data).toHaveProperty("summary");
      expect(body.data).toHaveProperty("recommendation");
      expect(body.data).toHaveProperty("tips");
    });

    it("POST /api/v1/ai/analyze-activity sin activity_id devuelve 400", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/ai/analyze-activity",
        headers: authHeaders,
        payload: {},
      });
      expect(res.statusCode).toBe(400);
      expect(res.json()).toMatchObject({ code: "BAD_REQUEST" });
    });

    it("POST /api/v1/ai/weekly-plan devuelve 200 con 7 días", async () => {
      setupAIMocks(validWeeklyPlan);
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/ai/weekly-plan",
        headers: authHeaders,
        payload: {},
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data).toHaveProperty("days");
      expect(body.data.days).toHaveLength(7);
      expect(body.data).toHaveProperty("rationale");
    });

    it("POST /api/v1/ai/weekly-summary devuelve 200 con resumen", async () => {
      setupAIMocks(validWeeklySummary);
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/ai/weekly-summary",
        headers: authHeaders,
        payload: {
          period_a_start: "2026-02-01",
          period_a_end: "2026-02-07",
          period_b_start: "2026-02-08",
          period_b_end: "2026-02-15",
        },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data).toHaveProperty("summary");
      expect(body.data).toHaveProperty("recommendation");
    });

    it("POST /api/v1/ai/weekly-summary sin periodos devuelve 400", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/api/v1/ai/weekly-summary",
        headers: authHeaders,
        payload: {},
      });
      expect(res.statusCode).toBe(400);
      expect(res.json()).toMatchObject({ code: "BAD_REQUEST" });
    });

    it("GET /api/v1/ai/coach-tip devuelve 200 con tip", async () => {
      setupAIMocks(validCoachTip);
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/ai/coach-tip",
        headers: authHeaders,
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data).toHaveProperty("recommendation");
    });

    it("rutas IA sin auth devuelven 401", async () => {
      const routes = [
        { method: "POST" as const, url: "/api/v1/ai/analyze-activity" },
        { method: "POST" as const, url: "/api/v1/ai/weekly-plan" },
        { method: "GET" as const, url: "/api/v1/ai/coach-tip" },
      ];
      for (const route of routes) {
        const res = await app.inject({ method: route.method, url: route.url });
        expect(res.statusCode).toBe(401);
      }
    });
  });

  describe("Plan", () => {
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
      ai_rationale: "Plan adaptado.",
      created_at: "2026-02-10T08:00:00Z",
      updated_at: "2026-02-10T08:00:00Z",
    };

    it("GET /api/v1/plan con week_start devuelve 200 con plan", async () => {
      mockFromChain({ data: mockPlanRow, error: null });
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/plan?week_start=2026-02-10",
        headers: authHeaders,
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data).toHaveProperty("days");
      expect(body.data.days).toHaveLength(7);
      expect(body.data).toHaveProperty("week_start", "2026-02-10");
    });

    it("GET /api/v1/plan sin plan devuelve 200 con null", async () => {
      mockFromChain({ data: null, error: { message: "not found" } });
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/plan?week_start=2026-01-01",
        headers: authHeaders,
      });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ data: null });
    });

    it("PATCH /api/v1/plan devuelve 200 con plan actualizado", async () => {
      const updatedRow = {
        ...mockPlanRow,
        plan_data: {
          days: mockPlanRow.plan_data.days.map((d, i) =>
            i === 0 ? { ...d, done: true, actual_power: 200 } : d,
          ),
        },
      };
      mockFromChain({ data: updatedRow, error: null });
      const res = await app.inject({
        method: "PATCH",
        url: "/api/v1/plan",
        headers: authHeaders,
        payload: {
          week_start: "2026-02-10",
          days: updatedRow.plan_data.days,
        },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data.days[0].done).toBe(true);
      expect(body.data.days[0].actual_power).toBe(200);
    });

    it("PATCH /api/v1/plan con body inválido devuelve 400", async () => {
      const res = await app.inject({
        method: "PATCH",
        url: "/api/v1/plan",
        headers: authHeaders,
        payload: { week_start: "not-a-date" },
      });
      expect(res.statusCode).toBe(400);
    });

    it("DELETE /api/v1/plan devuelve 204", async () => {
      const lastEq = vi.fn().mockResolvedValue({ error: null, count: 1 });
      const firstEq = vi.fn().mockReturnValue({ eq: lastEq });
      const deleteFn = vi.fn().mockReturnValue({ eq: firstEq });
      vi.mocked(supabaseAdmin.from).mockReturnValue({
        delete: deleteFn,
      } as ReturnType<typeof supabaseAdmin.from>);
      const res = await app.inject({
        method: "DELETE",
        url: "/api/v1/plan?week_start=2026-02-10",
        headers: authHeaders,
      });
      expect(res.statusCode).toBe(204);
      expect(res.body).toBe("");
    });

    it("DELETE /api/v1/plan sin week_start devuelve 400", async () => {
      const res = await app.inject({
        method: "DELETE",
        url: "/api/v1/plan",
        headers: authHeaders,
      });
      expect(res.statusCode).toBe(400);
    });

    it("rutas plan sin auth devuelven 401", async () => {
      const routes = [
        { method: "GET" as const, url: "/api/v1/plan?week_start=2026-02-10" },
        { method: "PATCH" as const, url: "/api/v1/plan" },
        { method: "DELETE" as const, url: "/api/v1/plan?week_start=2026-02-10" },
      ];
      for (const route of routes) {
        const res = await app.inject({ method: route.method, url: route.url });
        expect(res.statusCode).toBe(401);
      }
    });
  });
});
