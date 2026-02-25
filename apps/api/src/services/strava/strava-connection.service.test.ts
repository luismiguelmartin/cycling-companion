import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { randomBytes } from "node:crypto";
import type { StravaTokenResponse } from "./types.js";

// Configurar env y mocks antes de importar
const TEST_KEY = randomBytes(32).toString("base64");

beforeAll(() => {
  process.env.STRAVA_TOKEN_ENCRYPTION_KEY = TEST_KEY;
  process.env.STRAVA_CLIENT_ID = "test-id";
  process.env.STRAVA_CLIENT_SECRET = "test-secret";
});

afterAll(() => {
  delete process.env.STRAVA_TOKEN_ENCRYPTION_KEY;
  delete process.env.STRAVA_CLIENT_ID;
  delete process.env.STRAVA_CLIENT_SECRET;
});

// Mock supabase
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockMaybeSingle = vi.fn();
const mockUpsert = vi.fn();
const mockDelete = vi.fn();
const mockUpdate = vi.fn();

function resetChain() {
  mockSelect.mockReturnValue({ eq: mockEq });
  mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle });
  mockUpsert.mockReturnValue({ error: null });
  mockDelete.mockReturnValue({ eq: vi.fn().mockReturnValue({ error: null }) });
  mockUpdate.mockReturnValue({
    eq: vi.fn().mockReturnValue({ error: null }),
  });
}

vi.mock("../supabase.js", () => ({
  supabaseAdmin: {
    from: vi.fn((table: string) => {
      void table;
      return {
        select: mockSelect,
        upsert: mockUpsert,
        delete: mockDelete,
        update: mockUpdate,
      };
    }),
  },
}));

// Mock strava-api.service para refreshAccessToken
vi.mock("./strava-api.service.js", () => ({
  refreshAccessToken: vi.fn(),
}));

const { refreshAccessToken: mockRefresh } = await import("./strava-api.service.js");

const {
  saveStravaConnection,
  getStravaConnection,
  getStravaConnectionByAthleteId,
  deleteStravaConnection,
  updateStravaTokens,
  updateLastSyncAt,
  getValidAccessToken,
} = await import("./strava-connection.service.js");

const { encrypt } = await import("../../utils/crypto.js");

const MOCK_TOKENS: StravaTokenResponse = {
  access_token: "access-abc",
  refresh_token: "refresh-xyz",
  expires_at: Math.floor(Date.now() / 1000) + 21600,
  expires_in: 21600,
  athlete: { id: 99999, firstname: "Luis", lastname: "Martin" },
};

describe("strava-connection.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChain();
  });

  describe("saveStravaConnection", () => {
    it("guarda conexión con tokens cifrados", async () => {
      await saveStravaConnection("00000000-0000-0000-0000-000000000001", MOCK_TOKENS);

      expect(mockUpsert).toHaveBeenCalledOnce();
      const [data, opts] = mockUpsert.mock.calls[0];
      expect(data.user_id).toBe("00000000-0000-0000-0000-000000000001");
      expect(data.strava_athlete_id).toBe(99999);
      // Tokens deben estar cifrados (formato iv:authTag:ciphertext)
      expect(data.access_token.split(":")).toHaveLength(3);
      expect(data.refresh_token.split(":")).toHaveLength(3);
      expect(data.access_token).not.toBe("access-abc");
      expect(opts.onConflict).toBe("user_id");
    });

    it("lanza error si BD falla", async () => {
      mockUpsert.mockReturnValue({ error: { message: "DB error" } });

      await expect(
        saveStravaConnection("00000000-0000-0000-0000-000000000001", MOCK_TOKENS),
      ).rejects.toThrow("Error al guardar conexión Strava");
    });
  });

  describe("getStravaConnection", () => {
    it("retorna conexión con tokens descifrados", async () => {
      const encrypted = {
        id: "00000000-0000-0000-0000-000000000099",
        user_id: "00000000-0000-0000-0000-000000000001",
        strava_athlete_id: 99999,
        access_token: encrypt("access-abc"),
        refresh_token: encrypt("refresh-xyz"),
        token_expires_at: "2026-02-25T20:00:00.000Z",
        scope: "activity:read_all",
        connected_at: "2026-02-25T10:00:00.000Z",
        last_sync_at: "2026-02-25T14:00:00.000Z",
      };
      mockMaybeSingle.mockResolvedValue({ data: encrypted, error: null });

      const result = await getStravaConnection("00000000-0000-0000-0000-000000000001");

      expect(result).not.toBeNull();
      expect(result!.access_token).toBe("access-abc");
      expect(result!.refresh_token).toBe("refresh-xyz");
      expect(result!.strava_athlete_id).toBe(99999);
      expect(result!.last_sync_at).toBeInstanceOf(Date);
    });

    it("retorna null si no existe", async () => {
      mockMaybeSingle.mockResolvedValue({ data: null, error: null });

      const result = await getStravaConnection("00000000-0000-0000-0000-000000000001");

      expect(result).toBeNull();
    });

    it("lanza error si BD falla", async () => {
      mockMaybeSingle.mockResolvedValue({ data: null, error: { message: "DB error" } });

      await expect(getStravaConnection("00000000-0000-0000-0000-000000000001")).rejects.toThrow(
        "Error al obtener conexión Strava",
      );
    });
  });

  describe("getStravaConnectionByAthleteId", () => {
    it("retorna conexión por athlete ID", async () => {
      const encrypted = {
        id: "00000000-0000-0000-0000-000000000099",
        user_id: "00000000-0000-0000-0000-000000000001",
        strava_athlete_id: 99999,
        access_token: encrypt("access-abc"),
        refresh_token: encrypt("refresh-xyz"),
        token_expires_at: "2026-02-25T20:00:00.000Z",
        scope: "activity:read_all",
        connected_at: "2026-02-25T10:00:00.000Z",
        last_sync_at: null,
      };
      mockMaybeSingle.mockResolvedValue({ data: encrypted, error: null });

      const result = await getStravaConnectionByAthleteId(99999);

      expect(result).not.toBeNull();
      expect(result!.user_id).toBe("00000000-0000-0000-0000-000000000001");
      expect(result!.last_sync_at).toBeNull();
    });
  });

  describe("deleteStravaConnection", () => {
    it("elimina conexión exitosamente", async () => {
      const mockEqDelete = vi.fn().mockReturnValue({ error: null });
      mockDelete.mockReturnValue({ eq: mockEqDelete });

      await deleteStravaConnection("00000000-0000-0000-0000-000000000001");

      expect(mockDelete).toHaveBeenCalledOnce();
      expect(mockEqDelete).toHaveBeenCalledWith("user_id", "00000000-0000-0000-0000-000000000001");
    });
  });

  describe("updateStravaTokens", () => {
    it("actualiza tokens cifrados", async () => {
      const mockEqUpdate = vi.fn().mockReturnValue({ error: null });
      mockUpdate.mockReturnValue({ eq: mockEqUpdate });

      await updateStravaTokens(
        "00000000-0000-0000-0000-000000000001",
        "new-access",
        "new-refresh",
        new Date("2026-02-25T20:00:00Z"),
      );

      expect(mockUpdate).toHaveBeenCalledOnce();
      const data = mockUpdate.mock.calls[0][0];
      expect(data.access_token.split(":")).toHaveLength(3);
      expect(data.access_token).not.toBe("new-access");
    });
  });

  describe("updateLastSyncAt", () => {
    it("actualiza last_sync_at", async () => {
      const mockEqUpdate = vi.fn().mockReturnValue({ error: null });
      mockUpdate.mockReturnValue({ eq: mockEqUpdate });

      await updateLastSyncAt("00000000-0000-0000-0000-000000000001");

      expect(mockUpdate).toHaveBeenCalledOnce();
      const data = mockUpdate.mock.calls[0][0];
      expect(data.last_sync_at).toBeDefined();
    });
  });

  describe("getValidAccessToken", () => {
    it("retorna token si no está expirado", async () => {
      const futureExpiry = new Date(Date.now() + 3_600_000); // +1h
      const encrypted = {
        id: "00000000-0000-0000-0000-000000000099",
        user_id: "00000000-0000-0000-0000-000000000001",
        strava_athlete_id: 99999,
        access_token: encrypt("valid-token"),
        refresh_token: encrypt("refresh-xyz"),
        token_expires_at: futureExpiry.toISOString(),
        scope: "activity:read_all",
        connected_at: "2026-02-25T10:00:00.000Z",
        last_sync_at: null,
      };
      mockMaybeSingle.mockResolvedValue({ data: encrypted, error: null });

      const token = await getValidAccessToken("00000000-0000-0000-0000-000000000001");

      expect(token).toBe("valid-token");
      expect(mockRefresh).not.toHaveBeenCalled();
    });

    it("refresca token si está a punto de expirar", async () => {
      const almostExpired = new Date(Date.now() + 60_000); // expira en 1 min (< 5 min buffer)
      const encrypted = {
        id: "00000000-0000-0000-0000-000000000099",
        user_id: "00000000-0000-0000-0000-000000000001",
        strava_athlete_id: 99999,
        access_token: encrypt("old-token"),
        refresh_token: encrypt("refresh-xyz"),
        token_expires_at: almostExpired.toISOString(),
        scope: "activity:read_all",
        connected_at: "2026-02-25T10:00:00.000Z",
        last_sync_at: null,
      };
      mockMaybeSingle.mockResolvedValue({ data: encrypted, error: null });

      const mockEqUpdate = vi.fn().mockReturnValue({ error: null });
      mockUpdate.mockReturnValue({ eq: mockEqUpdate });

      (mockRefresh as ReturnType<typeof vi.fn>).mockResolvedValue({
        access_token: "new-token",
        refresh_token: "new-refresh",
        expires_at: Math.floor(Date.now() / 1000) + 21600,
        expires_in: 21600,
        athlete: { id: 99999, firstname: "Luis", lastname: "Martin" },
      });

      const token = await getValidAccessToken("00000000-0000-0000-0000-000000000001");

      expect(token).toBe("new-token");
      expect(mockRefresh).toHaveBeenCalledWith("refresh-xyz");
      expect(mockUpdate).toHaveBeenCalledOnce();
    });

    it("lanza error si no hay conexión", async () => {
      mockMaybeSingle.mockResolvedValue({ data: null, error: null });

      await expect(getValidAccessToken("00000000-0000-0000-0000-000000000001")).rejects.toThrow(
        "No hay conexión con Strava",
      );
    });
  });
});
