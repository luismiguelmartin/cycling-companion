import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../config/env.js", () => ({
  env: {
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "test-key",
    ANTHROPIC_API_KEY: "test-key",
    PORT: 3001,
    FRONTEND_URL: "http://localhost:3000",
  },
}));

const mockFrom = vi.fn();
vi.mock("../supabase.js", () => ({
  supabaseAdmin: { from: (...args: unknown[]) => mockFrom(...args) },
}));

vi.mock("../../utils/crypto.js", () => ({
  encrypt: vi.fn((v: string) => `enc_${v}`),
  decrypt: vi.fn((v: string) => v.replace("enc_", "")),
}));

const mockGetValidAccessToken = vi.fn();
const mockGetStravaActivity = vi.fn();
const mockGetStravaActivityStreams = vi.fn();
const mockListStravaActivities = vi.fn();
const mockGetStravaConnectionByAthleteId = vi.fn();
const mockDeleteStravaConnection = vi.fn();
const mockUpdateLastSyncAt = vi.fn();

vi.mock("./index.js", () => ({
  getValidAccessToken: (...args: unknown[]) => mockGetValidAccessToken(...args),
  getStravaActivity: (...args: unknown[]) => mockGetStravaActivity(...args),
  getStravaActivityStreams: (...args: unknown[]) => mockGetStravaActivityStreams(...args),
  listStravaActivities: (...args: unknown[]) => mockListStravaActivities(...args),
  getStravaConnectionByAthleteId: (...args: unknown[]) =>
    mockGetStravaConnectionByAthleteId(...args),
  deleteStravaConnection: (...args: unknown[]) => mockDeleteStravaConnection(...args),
  updateLastSyncAt: (...args: unknown[]) => mockUpdateLastSyncAt(...args),
  StravaRateLimitError: class extends Error {
    constructor() {
      super("Rate limit");
    }
  },
}));

const mockIsStravaCyclingActivity = vi.fn();
const mockMapStravaToActivity = vi.fn();

vi.mock("./strava-mapper.service.js", () => ({
  isStravaCyclingActivity: (...args: unknown[]) => mockIsStravaCyclingActivity(...args),
  mapStravaToActivity: (...args: unknown[]) => mockMapStravaToActivity(...args),
}));

const mockCreateActivity = vi.fn();
vi.mock("../activity.service.js", () => ({
  createActivity: (...args: unknown[]) => mockCreateActivity(...args),
}));

const mockGetProfile = vi.fn();
vi.mock("../profile.service.js", () => ({
  getProfile: (...args: unknown[]) => mockGetProfile(...args),
}));

const mockAnalyzeActivity = vi.fn();
vi.mock("../ai/ai.service.js", () => ({
  analyzeActivity: (...args: unknown[]) => mockAnalyzeActivity(...args),
}));

vi.mock("shared", async () => {
  const actual = await vi.importActual<typeof import("shared")>("shared");
  return {
    ...actual,
    computeActivitySummary: vi.fn(() => ({
      duration_total: 3600,
      duration_moving: 3500,
      distance_km: 30,
      avg_speed: 30,
      max_speed: 45,
      avg_power: 200,
      avg_power_non_zero: 210,
      normalized_power: 220,
      max_power: 400,
      variability_index: 1.1,
      intensity_factor: 0.88,
      tss: 55,
      avg_hr: 145,
      avg_hr_moving: 148,
      max_hr: 175,
      avg_cadence: 85,
      avg_cadence_moving: 87,
      elevation_gain: 500,
      power_zone_distribution: null,
      hr_zone_distribution: null,
      best_efforts: null,
    })),
  };
});

const { importStravaActivity, processWebhookEvent, backfillStravaActivities } =
  await import("./strava-import.service.js");

const USER_ID = "00000000-0000-0000-0000-000000000001";

function mockActivitiesQuery(existing: boolean) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: existing ? { id: "existing-id" } : null,
      error: null,
    }),
    insert: vi.fn().mockReturnThis(),
  };
  mockFrom.mockReturnValue(chain);
  return chain;
}

const stravaActivity = {
  id: 12345,
  name: "Morning Ride",
  sport_type: "Ride",
  type: "Ride",
  distance: 30000,
  moving_time: 3600,
  elapsed_time: 3700,
  total_elevation_gain: 500,
  start_date: "2026-02-25T08:00:00Z",
  start_date_local: "2026-02-25T09:00:00Z",
  average_speed: 8.33,
  max_speed: 12.5,
  average_heartrate: 145,
  max_heartrate: 175,
  average_watts: 200,
  weighted_average_watts: 220,
  max_watts: 400,
  average_cadence: 85,
  has_heartrate: true,
  device_watts: true,
  trainer: false,
};

const mappedResult = {
  activityData: {
    name: "Morning Ride",
    date: "2026-02-25",
    type: "endurance" as const,
    duration_seconds: 3600,
    distance_km: 30,
    avg_power_watts: 200,
    avg_hr_bpm: 145,
    max_hr_bpm: 175,
    avg_cadence_rpm: 85,
    strava_id: 12345,
    source: "strava" as const,
  },
  trackPoints: [
    {
      timestamp: 1740470400000,
      lat: 40.4,
      lon: -3.7,
      elevation: 600,
      power: 200,
      hr: 145,
      cadence: 85,
    },
  ],
  metrics: [{ timestampSeconds: 0, powerWatts: 200, hrBpm: 145, cadenceRpm: 85, speedKmh: 30 }],
};

describe("importStravaActivity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetValidAccessToken.mockResolvedValue("valid-token");
    mockGetStravaActivity.mockResolvedValue(stravaActivity);
    mockIsStravaCyclingActivity.mockReturnValue(true);
    mockGetStravaActivityStreams.mockResolvedValue({ time: { data: [0] } });
    mockMapStravaToActivity.mockReturnValue(mappedResult);
    mockGetProfile.mockResolvedValue({ ftp: 250, max_hr: 185 });
    mockCreateActivity.mockResolvedValue({ id: "new-activity-id" });
    mockUpdateLastSyncAt.mockResolvedValue(undefined);
    mockAnalyzeActivity.mockResolvedValue({});
  });

  it("importa actividad de ciclismo con streams", async () => {
    mockActivitiesQuery(false);
    // Mock insert de metrics
    const metricsChain = {
      insert: vi.fn().mockResolvedValue({ error: null }),
    };
    mockFrom.mockImplementation((table: string) => {
      if (table === "activity_metrics") return metricsChain;
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    const result = await importStravaActivity(USER_ID, 12345);

    expect(result).toBe("new-activity-id");
    expect(mockGetStravaActivity).toHaveBeenCalledWith("valid-token", 12345);
    expect(mockCreateActivity).toHaveBeenCalled();
    expect(mockUpdateLastSyncAt).toHaveBeenCalledWith(USER_ID);
  });

  it("retorna null si actividad ya existe", async () => {
    mockActivitiesQuery(true);

    const result = await importStravaActivity(USER_ID, 12345);

    expect(result).toBeNull();
    expect(mockGetStravaActivity).not.toHaveBeenCalled();
  });

  it("retorna null si no es ciclismo", async () => {
    mockActivitiesQuery(false);
    mockIsStravaCyclingActivity.mockReturnValue(false);

    const result = await importStravaActivity(USER_ID, 12345);

    expect(result).toBeNull();
    expect(mockMapStravaToActivity).not.toHaveBeenCalled();
  });

  it("importa sin streams si fallan", async () => {
    mockActivitiesQuery(false);
    mockGetStravaActivityStreams.mockRejectedValue(new Error("No streams"));
    mockMapStravaToActivity.mockReturnValue({
      ...mappedResult,
      trackPoints: [],
      metrics: [],
    });
    mockFrom.mockImplementation((table: string) => {
      if (table === "activity_metrics")
        return { insert: vi.fn().mockResolvedValue({ error: null }) };
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    const result = await importStravaActivity(USER_ID, 12345);

    expect(result).toBe("new-activity-id");
    expect(mockMapStravaToActivity).toHaveBeenCalledWith(stravaActivity, null);
  });

  it("no llama a analyzeActivity con skipAiAnalysis", async () => {
    mockActivitiesQuery(false);
    mockFrom.mockImplementation((table: string) => {
      if (table === "activity_metrics")
        return { insert: vi.fn().mockResolvedValue({ error: null }) };
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    await importStravaActivity(USER_ID, 12345, { skipAiAnalysis: true });

    expect(mockAnalyzeActivity).not.toHaveBeenCalled();
  });

  it("llama a analyzeActivity por defecto", async () => {
    mockActivitiesQuery(false);
    mockFrom.mockImplementation((table: string) => {
      if (table === "activity_metrics")
        return { insert: vi.fn().mockResolvedValue({ error: null }) };
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    await importStravaActivity(USER_ID, 12345);

    expect(mockAnalyzeActivity).toHaveBeenCalledWith(USER_ID, "new-activity-id");
  });
});

describe("processWebhookEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ignora eventos que no son create de activity", async () => {
    await processWebhookEvent({
      object_type: "activity",
      object_id: 123,
      aspect_type: "update",
      updates: {},
      owner_id: 999,
      subscription_id: 1,
      event_time: Date.now(),
    });

    expect(mockGetStravaConnectionByAthleteId).not.toHaveBeenCalled();
  });

  it("ignora delete de activity", async () => {
    await processWebhookEvent({
      object_type: "activity",
      object_id: 123,
      aspect_type: "delete",
      updates: {},
      owner_id: 999,
      subscription_id: 1,
      event_time: Date.now(),
    });

    expect(mockGetStravaConnectionByAthleteId).not.toHaveBeenCalled();
  });

  it("elimina conexión en deauthorize de atleta", async () => {
    mockGetStravaConnectionByAthleteId.mockResolvedValue({
      user_id: USER_ID,
      strava_athlete_id: 999,
    });
    mockDeleteStravaConnection.mockResolvedValue(undefined);

    await processWebhookEvent({
      object_type: "athlete",
      object_id: 999,
      aspect_type: "update",
      updates: { authorized: "false" },
      owner_id: 999,
      subscription_id: 1,
      event_time: Date.now(),
    });

    expect(mockDeleteStravaConnection).toHaveBeenCalledWith(USER_ID);
  });

  it("ignora deauthorize de atleta no registrado", async () => {
    mockGetStravaConnectionByAthleteId.mockResolvedValue(null);

    await processWebhookEvent({
      object_type: "athlete",
      object_id: 999,
      aspect_type: "update",
      updates: { authorized: "false" },
      owner_id: 999,
      subscription_id: 1,
      event_time: Date.now(),
    });

    expect(mockDeleteStravaConnection).not.toHaveBeenCalled();
  });

  it("ignora si no hay conexión para el owner_id", async () => {
    mockGetStravaConnectionByAthleteId.mockResolvedValue(null);

    await processWebhookEvent({
      object_type: "activity",
      object_id: 123,
      aspect_type: "create",
      updates: {},
      owner_id: 999,
      subscription_id: 1,
      event_time: Date.now(),
    });

    // No debería lanzar error
    expect(mockGetStravaConnectionByAthleteId).toHaveBeenCalledWith(999);
  });
});

describe("backfillStravaActivities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetValidAccessToken.mockResolvedValue("valid-token");
    mockUpdateLastSyncAt.mockResolvedValue(undefined);
  });

  it("importa actividades de ciclismo y salta las existentes", async () => {
    mockListStravaActivities.mockResolvedValue([
      { id: 1, sport_type: "Ride" },
      { id: 2, sport_type: "Ride" },
      { id: 3, sport_type: "Ride" },
    ]);
    mockIsStravaCyclingActivity.mockReturnValue(true);

    // Simular: primera ya existe, segunda y tercera se importan
    let callCount = 0;

    // Mock the from chain for activity existence check
    mockFrom.mockImplementation((table: string) => {
      if (table === "activities") {
        callCount++;
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: callCount === 1 ? { id: "existing" } : null,
            error: null,
          }),
        };
      }
      if (table === "activity_metrics") {
        return { insert: vi.fn().mockResolvedValue({ error: null }) };
      }
      return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
    });

    mockGetStravaActivity.mockResolvedValue(stravaActivity);
    mockGetStravaActivityStreams.mockResolvedValue({ time: { data: [0] } });
    mockMapStravaToActivity.mockReturnValue(mappedResult);
    mockGetProfile.mockResolvedValue({ ftp: 250, max_hr: 185 });
    mockCreateActivity.mockResolvedValue({ id: "new-id" });

    const result = await backfillStravaActivities(USER_ID, { count: 10 });

    expect(result.imported).toBe(2);
    expect(result.skipped).toBe(1);
    expect(result.errors).toBe(0);
    expect(mockAnalyzeActivity).not.toHaveBeenCalled(); // skipAiAnalysis en backfill
  });

  it("filtra actividades no-ciclismo", async () => {
    mockListStravaActivities.mockResolvedValue([
      { id: 1, sport_type: "Ride" },
      { id: 2, sport_type: "Run" },
      { id: 3, sport_type: "Swim" },
    ]);
    mockIsStravaCyclingActivity.mockImplementation((type: string) => type === "Ride");

    mockFrom.mockImplementation((table: string) => {
      if (table === "activity_metrics")
        return { insert: vi.fn().mockResolvedValue({ error: null }) };
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    mockGetStravaActivity.mockResolvedValue(stravaActivity);
    mockGetStravaActivityStreams.mockResolvedValue({ time: { data: [0] } });
    mockMapStravaToActivity.mockReturnValue(mappedResult);
    mockGetProfile.mockResolvedValue({ ftp: 250, max_hr: 185 });
    mockCreateActivity.mockResolvedValue({ id: "new-id" });

    const result = await backfillStravaActivities(USER_ID);

    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(2); // 2 non-cycling
  });

  it("retorna vacío si Strava no tiene actividades", async () => {
    mockListStravaActivities.mockResolvedValue([]);

    const result = await backfillStravaActivities(USER_ID);

    expect(result).toEqual({ imported: 0, skipped: 0, errors: 0 });
  });

  it("para en rate limit y retorna resultado parcial", async () => {
    mockListStravaActivities.mockResolvedValue([
      { id: 1, sport_type: "Ride" },
      { id: 2, sport_type: "Ride" },
    ]);
    mockIsStravaCyclingActivity.mockReturnValue(true);

    let callCount = 0;
    mockFrom.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }));

    // Primera actividad OK, segunda da rate limit
    mockGetStravaActivity.mockImplementation(() => {
      callCount++;
      if (callCount > 1) {
        const { StravaRateLimitError } = vi.mocked(
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          require("./index.js") as typeof import("./index.js"),
        );
        throw new StravaRateLimitError();
      }
      return stravaActivity;
    });
    mockGetStravaActivityStreams.mockResolvedValue({ time: { data: [0] } });
    mockMapStravaToActivity.mockReturnValue({ ...mappedResult, trackPoints: [], metrics: [] });
    mockGetProfile.mockResolvedValue({ ftp: 250, max_hr: 185 });
    mockCreateActivity.mockResolvedValue({ id: "new-id" });

    const result = await backfillStravaActivities(USER_ID);

    expect(result.imported).toBe(1);
    expect(result.errors).toBe(1);
  });
});
