import crypto from "node:crypto";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { FastifyInstance } from "fastify";

// Mock env
vi.mock("../config/env.js", () => ({
  env: {
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-key",
    ANTHROPIC_API_KEY: "test-anthropic-key",
    PORT: 3001,
    FRONTEND_URL: "http://localhost:3000",
  },
}));

// Mock supabase
vi.mock("../services/supabase.js", () => ({
  supabaseAdmin: {
    auth: { getUser: vi.fn() },
    from: vi.fn(),
    rpc: vi.fn().mockResolvedValue({ data: 0, error: null }),
  },
}));

// Mock anthropic (needed for app build)
vi.mock("../services/anthropic.js", () => ({
  anthropic: {
    messages: { create: vi.fn() },
  },
}));

// Mock crypto utils (for token encryption in strava connection service)
vi.mock("../utils/crypto.js", () => ({
  encrypt: vi.fn((val: string) => `encrypted_${val}`),
  decrypt: vi.fn((val: string) => val.replace("encrypted_", "")),
}));

// Mock strava services
const mockExchangeAuthCode = vi.fn();
const mockGetStravaConnection = vi.fn();
const mockGetStravaConnectionByAthleteId = vi.fn();
const mockSaveStravaConnection = vi.fn();
const mockDeleteStravaConnection = vi.fn();
const mockDeauthorizeAthlete = vi.fn();

vi.mock("../services/strava/index.js", () => ({
  exchangeAuthCode: (...args: unknown[]) => mockExchangeAuthCode(...args),
  getStravaConnection: (...args: unknown[]) => mockGetStravaConnection(...args),
  getStravaConnectionByAthleteId: (...args: unknown[]) =>
    mockGetStravaConnectionByAthleteId(...args),
  saveStravaConnection: (...args: unknown[]) => mockSaveStravaConnection(...args),
  deleteStravaConnection: (...args: unknown[]) => mockDeleteStravaConnection(...args),
  deauthorizeAthlete: (...args: unknown[]) => mockDeauthorizeAthlete(...args),
  getValidAccessToken: vi.fn(),
  refreshAccessToken: vi.fn(),
  getStravaAthlete: vi.fn(),
  StravaAuthError: class extends Error {},
  StravaRateLimitError: class extends Error {},
  mapStravaToActivity: vi.fn(),
  isStravaCyclingActivity: vi.fn(),
  updateStravaTokens: vi.fn(),
  updateLastSyncAt: vi.fn(),
}));

const { buildApp } = await import("../app.js");
const { supabaseAdmin } = await import("../services/supabase.js");

const USER_ID = "00000000-0000-0000-0000-000000000001";
const STRAVA_SECRET = "test-strava-secret";
const authHeaders = { Authorization: "Bearer test-token" };

function mockAuthSuccess() {
  vi.mocked(supabaseAdmin.auth.getUser).mockResolvedValue({
    data: { user: { id: USER_ID, email: "test@example.com" } },
    error: null,
  } as ReturnType<typeof supabaseAdmin.auth.getUser> extends Promise<infer R> ? R : never);
}

function mockAuthFailure() {
  vi.mocked(supabaseAdmin.auth.getUser).mockResolvedValue({
    data: { user: null },
    error: { message: "Invalid token" },
  } as ReturnType<typeof supabaseAdmin.auth.getUser> extends Promise<infer R> ? R : never);
}

/** Genera un state válido para tests */
function generateValidState(userId: string = USER_ID): string {
  const timestamp = Date.now().toString();
  const nonce = crypto.randomBytes(16).toString("hex");
  const hmac = crypto
    .createHmac("sha256", STRAVA_SECRET)
    .update(`${userId}:${timestamp}:${nonce}`)
    .digest("hex");
  return `${userId}:${timestamp}:${nonce}:${hmac}`;
}

/** Genera un state expirado (>10 min) */
function generateExpiredState(userId: string = USER_ID): string {
  const timestamp = (Date.now() - 11 * 60 * 1000).toString(); // 11 min ago
  const nonce = crypto.randomBytes(16).toString("hex");
  const hmac = crypto
    .createHmac("sha256", STRAVA_SECRET)
    .update(`${userId}:${timestamp}:${nonce}`)
    .digest("hex");
  return `${userId}:${timestamp}:${nonce}:${hmac}`;
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
    maybeSingle: vi.fn().mockResolvedValue(result),
    // Make it thenable for head:true queries that return count
    then: (resolve: (v: unknown) => void) => resolve(result),
  };
  vi.mocked(supabaseAdmin.from).mockReturnValue(chain as ReturnType<typeof supabaseAdmin.from>);
  return chain;
}

describe("Strava Routes", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockAuthSuccess();

    // Set env vars for Strava
    process.env.STRAVA_CLIENT_ID = "test-client-id";
    process.env.STRAVA_CLIENT_SECRET = STRAVA_SECRET;
    process.env.BACKEND_URL = "http://localhost:3001";
    process.env.FRONTEND_URL = "http://localhost:3000";

    app = await buildApp({ logger: false });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
    delete process.env.STRAVA_CLIENT_ID;
    delete process.env.STRAVA_CLIENT_SECRET;
    delete process.env.BACKEND_URL;
  });

  // ─── GET /strava/auth-url ───────────────────────────────────────────

  describe("GET /api/v1/strava/auth-url", () => {
    it("devuelve URL de autorización válida", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/strava/auth-url",
        headers: authHeaders,
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data.url).toContain("https://www.strava.com/oauth/authorize");
      expect(body.data.url).toContain("client_id=test-client-id");
      expect(body.data.url).toContain("scope=activity%3Aread_all");
      expect(body.data.url).toContain("response_type=code");
      expect(body.data.url).toContain("state=");
      expect(body.data.url).toContain(
        "redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fapi%2Fv1%2Fstrava%2Fcallback",
      );
    });

    it("sin auth devuelve 401", async () => {
      mockAuthFailure();
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/strava/auth-url",
        headers: authHeaders,
      });

      expect(res.statusCode).toBe(401);
    });

    it("sin STRAVA_CLIENT_ID devuelve 503", async () => {
      delete process.env.STRAVA_CLIENT_ID;

      const res = await app.inject({
        method: "GET",
        url: "/api/v1/strava/auth-url",
        headers: authHeaders,
      });

      expect(res.statusCode).toBe(503);
      expect(res.json()).toMatchObject({ code: "STRAVA_NOT_CONFIGURED" });
    });
  });

  // ─── GET /strava/callback ──────────────────────────────────────────

  describe("GET /api/v1/strava/callback", () => {
    const mockTokenResponse = {
      access_token: "strava-access-token",
      refresh_token: "strava-refresh-token",
      expires_at: Math.floor(Date.now() / 1000) + 21600,
      expires_in: 21600,
      athlete: { id: 12345, firstname: "Luis", lastname: "Martin" },
    };

    it("éxito completo → redirect a /profile?strava=connected", async () => {
      const state = generateValidState();
      mockExchangeAuthCode.mockResolvedValue(mockTokenResponse);
      mockGetStravaConnectionByAthleteId.mockResolvedValue(null);
      mockSaveStravaConnection.mockResolvedValue(undefined);

      const res = await app.inject({
        method: "GET",
        url: `/api/v1/strava/callback?code=auth-code&scope=activity:read_all&state=${state}`,
      });

      expect(res.statusCode).toBe(302);
      expect(res.headers.location).toBe("http://localhost:3000/profile?strava=connected");
      expect(mockExchangeAuthCode).toHaveBeenCalledWith("auth-code");
      expect(mockSaveStravaConnection).toHaveBeenCalledWith(USER_ID, mockTokenResponse);
    });

    it("callback funciona sin auth (ruta pública)", async () => {
      mockAuthFailure();
      const state = generateValidState();
      mockExchangeAuthCode.mockResolvedValue(mockTokenResponse);
      mockGetStravaConnectionByAthleteId.mockResolvedValue(null);
      mockSaveStravaConnection.mockResolvedValue(undefined);

      const res = await app.inject({
        method: "GET",
        url: `/api/v1/strava/callback?code=auth-code&scope=activity:read_all&state=${state}`,
      });

      expect(res.statusCode).toBe(302);
      expect(res.headers.location).toBe("http://localhost:3000/profile?strava=connected");
    });

    it("state inválido → redirect con error invalid_state", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/strava/callback?code=auth-code&scope=activity:read_all&state=invalid-state",
      });

      expect(res.statusCode).toBe(302);
      expect(res.headers.location).toBe(
        "http://localhost:3000/profile?strava=error&reason=invalid_state",
      );
    });

    it("state expirado → redirect con error invalid_state", async () => {
      const state = generateExpiredState();

      const res = await app.inject({
        method: "GET",
        url: `/api/v1/strava/callback?code=auth-code&scope=activity:read_all&state=${state}`,
      });

      expect(res.statusCode).toBe(302);
      expect(res.headers.location).toBe(
        "http://localhost:3000/profile?strava=error&reason=invalid_state",
      );
    });

    it("scope insuficiente → redirect con error insufficient_scope", async () => {
      const state = generateValidState();

      const res = await app.inject({
        method: "GET",
        url: `/api/v1/strava/callback?code=auth-code&scope=read&state=${state}`,
      });

      expect(res.statusCode).toBe(302);
      expect(res.headers.location).toBe(
        "http://localhost:3000/profile?strava=error&reason=insufficient_scope",
      );
    });

    it("athlete ya vinculado a otro usuario → redirect con error already_connected", async () => {
      const state = generateValidState();
      mockExchangeAuthCode.mockResolvedValue(mockTokenResponse);
      mockGetStravaConnectionByAthleteId.mockResolvedValue({
        user_id: "00000000-0000-0000-0000-000000000099",
        strava_athlete_id: 12345,
      });

      const res = await app.inject({
        method: "GET",
        url: `/api/v1/strava/callback?code=auth-code&scope=activity:read_all&state=${state}`,
      });

      expect(res.statusCode).toBe(302);
      expect(res.headers.location).toBe(
        "http://localhost:3000/profile?strava=error&reason=already_connected",
      );
    });

    it("exchange falla → redirect con error exchange_failed", async () => {
      const state = generateValidState();
      mockExchangeAuthCode.mockRejectedValue(new Error("Network error"));

      const res = await app.inject({
        method: "GET",
        url: `/api/v1/strava/callback?code=auth-code&scope=activity:read_all&state=${state}`,
      });

      expect(res.statusCode).toBe(302);
      expect(res.headers.location).toBe(
        "http://localhost:3000/profile?strava=error&reason=exchange_failed",
      );
    });

    it("sin code → redirect con error invalid_state", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/strava/callback?scope=activity:read_all&state=some-state",
      });

      expect(res.statusCode).toBe(302);
      expect(res.headers.location).toContain("reason=invalid_state");
    });

    it("Strava devuelve error (access_denied) → redirect con error", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/v1/strava/callback?error=access_denied",
      });

      expect(res.statusCode).toBe(302);
      expect(res.headers.location).toBe(
        "http://localhost:3000/profile?strava=error&reason=access_denied",
      );
    });

    it("reconectar mismo usuario al mismo atleta funciona", async () => {
      const state = generateValidState();
      mockExchangeAuthCode.mockResolvedValue(mockTokenResponse);
      // Atleta ya vinculado al MISMO usuario
      mockGetStravaConnectionByAthleteId.mockResolvedValue({
        user_id: USER_ID,
        strava_athlete_id: 12345,
      });
      mockSaveStravaConnection.mockResolvedValue(undefined);

      const res = await app.inject({
        method: "GET",
        url: `/api/v1/strava/callback?code=auth-code&scope=activity:read_all&state=${state}`,
      });

      expect(res.statusCode).toBe(302);
      expect(res.headers.location).toBe("http://localhost:3000/profile?strava=connected");
      expect(mockSaveStravaConnection).toHaveBeenCalled();
    });
  });

  // ─── GET /strava/status ────────────────────────────────────────────

  describe("GET /api/v1/strava/status", () => {
    it("conectado con actividades", async () => {
      mockGetStravaConnection.mockResolvedValue({
        id: "conn-1",
        user_id: USER_ID,
        strava_athlete_id: 12345,
        access_token: "access",
        refresh_token: "refresh",
        token_expires_at: new Date(Date.now() + 3600000),
        scope: "activity:read_all",
        connected_at: new Date("2026-02-25T10:00:00.000Z"),
        last_sync_at: new Date("2026-02-25T14:30:00.000Z"),
      });

      mockFromChain({ data: null, error: null, count: 5 });

      const res = await app.inject({
        method: "GET",
        url: "/api/v1/strava/status",
        headers: authHeaders,
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data.connected).toBe(true);
      expect(body.data.strava_athlete_id).toBe(12345);
      expect(body.data.connected_at).toBe("2026-02-25T10:00:00.000Z");
      expect(body.data.last_sync_at).toBe("2026-02-25T14:30:00.000Z");
      expect(body.data.activities_count).toBe(5);
    });

    it("conectado sin actividades", async () => {
      mockGetStravaConnection.mockResolvedValue({
        id: "conn-1",
        user_id: USER_ID,
        strava_athlete_id: 12345,
        access_token: "access",
        refresh_token: "refresh",
        token_expires_at: new Date(Date.now() + 3600000),
        scope: "activity:read_all",
        connected_at: new Date("2026-02-25T10:00:00.000Z"),
        last_sync_at: null,
      });

      mockFromChain({ data: null, error: null, count: 0 });

      const res = await app.inject({
        method: "GET",
        url: "/api/v1/strava/status",
        headers: authHeaders,
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data.connected).toBe(true);
      expect(body.data.activities_count).toBe(0);
      expect(body.data.last_sync_at).toBeNull();
    });

    it("desconectado", async () => {
      mockGetStravaConnection.mockResolvedValue(null);

      const res = await app.inject({
        method: "GET",
        url: "/api/v1/strava/status",
        headers: authHeaders,
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data.connected).toBe(false);
      expect(body.data.strava_athlete_id).toBeNull();
      expect(body.data.activities_count).toBe(0);
    });

    it("sin auth devuelve 401", async () => {
      mockAuthFailure();

      const res = await app.inject({
        method: "GET",
        url: "/api/v1/strava/status",
        headers: authHeaders,
      });

      expect(res.statusCode).toBe(401);
    });
  });

  // ─── DELETE /strava/disconnect ─────────────────────────────────────

  describe("DELETE /api/v1/strava/disconnect", () => {
    it("éxito — desconecta y revoca", async () => {
      mockGetStravaConnection.mockResolvedValue({
        id: "conn-1",
        user_id: USER_ID,
        strava_athlete_id: 12345,
        access_token: "access-token",
        refresh_token: "refresh",
        token_expires_at: new Date(Date.now() + 3600000),
        scope: "activity:read_all",
        connected_at: new Date(),
        last_sync_at: null,
      });
      mockDeauthorizeAthlete.mockResolvedValue(undefined);
      mockDeleteStravaConnection.mockResolvedValue(undefined);

      const res = await app.inject({
        method: "DELETE",
        url: "/api/v1/strava/disconnect",
        headers: authHeaders,
      });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ data: { disconnected: true } });
      expect(mockDeauthorizeAthlete).toHaveBeenCalledWith("access-token");
      expect(mockDeleteStravaConnection).toHaveBeenCalledWith(USER_ID);
    });

    it("sin conexión → 404", async () => {
      mockGetStravaConnection.mockResolvedValue(null);

      const res = await app.inject({
        method: "DELETE",
        url: "/api/v1/strava/disconnect",
        headers: authHeaders,
      });

      expect(res.statusCode).toBe(404);
      expect(res.json()).toMatchObject({ code: "STRAVA_NOT_CONNECTED" });
    });

    it("deauthorize falla en Strava → igualmente desconecta localmente", async () => {
      mockGetStravaConnection.mockResolvedValue({
        id: "conn-1",
        user_id: USER_ID,
        strava_athlete_id: 12345,
        access_token: "access-token",
        refresh_token: "refresh",
        token_expires_at: new Date(Date.now() + 3600000),
        scope: "activity:read_all",
        connected_at: new Date(),
        last_sync_at: null,
      });
      mockDeauthorizeAthlete.mockRejectedValue(new Error("Network error"));
      mockDeleteStravaConnection.mockResolvedValue(undefined);

      const res = await app.inject({
        method: "DELETE",
        url: "/api/v1/strava/disconnect",
        headers: authHeaders,
      });

      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ data: { disconnected: true } });
      expect(mockDeleteStravaConnection).toHaveBeenCalled();
    });

    it("sin auth devuelve 401", async () => {
      mockAuthFailure();

      const res = await app.inject({
        method: "DELETE",
        url: "/api/v1/strava/disconnect",
        headers: authHeaders,
      });

      expect(res.statusCode).toBe(401);
    });
  });
});
