import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import type { StravaTokenResponse, StravaDetailedActivity, StravaStreams } from "./types.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Configurar env antes de importar
beforeAll(() => {
  process.env.STRAVA_CLIENT_ID = "test-client-id";
  process.env.STRAVA_CLIENT_SECRET = "test-client-secret";
});

afterAll(() => {
  delete process.env.STRAVA_CLIENT_ID;
  delete process.env.STRAVA_CLIENT_SECRET;
});

afterEach(() => {
  mockFetch.mockReset();
});

// Importar después de configurar env y mocks
const {
  exchangeAuthCode,
  refreshAccessToken,
  deauthorizeAthlete,
  getStravaActivity,
  getStravaActivityStreams,
  listStravaActivities,
  getStravaAthlete,
  StravaAuthError,
  StravaRateLimitError,
} = await import("./strava-api.service.js");

function mockResponse(status: number, body: unknown, headers?: Record<string, string>) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    headers: new Headers(headers ?? {}),
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  };
}

const MOCK_TOKEN_RESPONSE: StravaTokenResponse = {
  access_token: "access-123",
  refresh_token: "refresh-456",
  expires_at: Math.floor(Date.now() / 1000) + 21600,
  expires_in: 21600,
  athlete: { id: 99999, firstname: "Luis", lastname: "Martin" },
};

const MOCK_ACTIVITY: StravaDetailedActivity = {
  id: 1234567890,
  name: "Ruta por la sierra",
  sport_type: "Ride",
  type: "Ride",
  distance: 45230.5,
  moving_time: 5400,
  elapsed_time: 6000,
  total_elevation_gain: 850,
  start_date: "2026-02-25T08:00:00Z",
  start_date_local: "2026-02-25T09:00:00+01:00",
  average_speed: 8.38,
  max_speed: 15.2,
  average_heartrate: 142,
  max_heartrate: 178,
  average_watts: 185,
  weighted_average_watts: 195,
  max_watts: 450,
  average_cadence: 82,
  kilojoules: 999,
  has_heartrate: true,
  device_watts: true,
  trainer: false,
  device_name: "Garmin Edge 540",
};

describe("strava-api.service", () => {
  describe("exchangeAuthCode", () => {
    it("intercambia auth code por tokens", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(200, MOCK_TOKEN_RESPONSE));

      const result = await exchangeAuthCode("auth-code-123");

      expect(result).toEqual(MOCK_TOKEN_RESPONSE);
      expect(mockFetch).toHaveBeenCalledOnce();
      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain("/oauth/token");
      const body = JSON.parse(opts.body as string);
      expect(body.code).toBe("auth-code-123");
      expect(body.grant_type).toBe("authorization_code");
      expect(body.client_id).toBe("test-client-id");
    });

    it("lanza error si Strava devuelve 400", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(400, { message: "Bad Request" }));

      await expect(exchangeAuthCode("bad-code")).rejects.toThrow("Strava API error");
    });
  });

  describe("refreshAccessToken", () => {
    it("refresca token correctamente", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(200, MOCK_TOKEN_RESPONSE));

      const result = await refreshAccessToken("old-refresh-token");

      expect(result).toEqual(MOCK_TOKEN_RESPONSE);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
      expect(body.grant_type).toBe("refresh_token");
      expect(body.refresh_token).toBe("old-refresh-token");
    });
  });

  describe("deauthorizeAthlete", () => {
    it("revoca acceso correctamente", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(200, {}));

      await deauthorizeAthlete("access-token-123");

      expect(mockFetch).toHaveBeenCalledOnce();
      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain("/oauth/deauthorize");
      expect(opts.headers.Authorization).toBe("Bearer access-token-123");
    });
  });

  describe("getStravaActivity", () => {
    it("obtiene detalle de actividad", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(200, MOCK_ACTIVITY));

      const result = await getStravaActivity("token", 1234567890);

      expect(result).toEqual(MOCK_ACTIVITY);
      expect(mockFetch.mock.calls[0][0]).toContain("/activities/1234567890");
    });

    it("lanza StravaAuthError si 401", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(401, { message: "Unauthorized" }));

      await expect(getStravaActivity("expired-token", 123)).rejects.toBeInstanceOf(StravaAuthError);
    });

    it("lanza StravaRateLimitError si 429", async () => {
      mockFetch.mockResolvedValueOnce(
        mockResponse(
          429,
          { message: "Rate Limit Exceeded" },
          {
            "X-RateLimit-Usage": "200,1500",
            "X-ReadRateLimit-Usage": "100,800",
          },
        ),
      );

      await expect(getStravaActivity("token", 123)).rejects.toBeInstanceOf(StravaRateLimitError);
    });

    it("lanza error genérico si 500", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(500, { message: "Internal Server Error" }));

      await expect(getStravaActivity("token", 123)).rejects.toThrow("Strava API error");
    });
  });

  describe("getStravaActivityStreams", () => {
    it("obtiene streams de datos", async () => {
      const mockStreams: StravaStreams = {
        time: { data: [0, 1, 2] },
        heartrate: { data: [120, 125, 130] },
        watts: { data: [150, 180, 200] },
      };
      mockFetch.mockResolvedValueOnce(mockResponse(200, mockStreams));

      const result = await getStravaActivityStreams("token", 123);

      expect(result.time?.data).toEqual([0, 1, 2]);
      expect(result.heartrate?.data).toEqual([120, 125, 130]);
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain("key_by_type=true");
      expect(url).toContain(
        "keys=time,latlng,distance,altitude,heartrate,cadence,watts,velocity_smooth",
      );
    });
  });

  describe("listStravaActivities", () => {
    it("lista actividades con opciones", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(200, [MOCK_ACTIVITY]));

      const result = await listStravaActivities("token", { page: 2, perPage: 10 });

      expect(result).toHaveLength(1);
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain("page=2");
      expect(url).toContain("per_page=10");
    });

    it("retorna array vacío si no hay actividades", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(200, []));

      const result = await listStravaActivities("token");

      expect(result).toEqual([]);
    });

    it("usa valores por defecto", async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(200, []));

      await listStravaActivities("token");

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain("page=1");
      expect(url).toContain("per_page=30");
    });
  });

  describe("getStravaAthlete", () => {
    it("obtiene perfil del atleta", async () => {
      const athlete = { id: 99999, firstname: "Luis", lastname: "Martin" };
      mockFetch.mockResolvedValueOnce(mockResponse(200, athlete));

      const result = await getStravaAthlete("token");

      expect(result).toEqual(athlete);
      expect(mockFetch.mock.calls[0][0]).toContain("/athlete");
    });
  });

  describe("error handling", () => {
    it("lanza error si STRAVA_CLIENT_ID no está configurado", async () => {
      const original = process.env.STRAVA_CLIENT_ID;
      delete process.env.STRAVA_CLIENT_ID;

      await expect(exchangeAuthCode("code")).rejects.toThrow("Strava integration not configured");

      process.env.STRAVA_CLIENT_ID = original;
    });
  });
});
