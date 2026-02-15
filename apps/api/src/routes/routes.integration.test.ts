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
});
