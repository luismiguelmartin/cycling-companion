import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "../plugins/error-handler.js";

// Mock supabase
const mockFrom = vi.fn();
vi.mock("./supabase.js", () => ({
  supabaseAdmin: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

// Mock FitParser
const mockParseAsync = vi.fn();
vi.mock("fit-file-parser", () => {
  class MockFitParser {
    parseAsync = mockParseAsync;
  }
  return { default: MockFitParser };
});

// Mock gpxjs
const mockParseGPXWithCustomParser = vi.fn();
vi.mock("@we-gold/gpxjs", () => ({
  parseGPXWithCustomParser: (...args: unknown[]) => mockParseGPXWithCustomParser(...args),
}));

// Mock xmldom
vi.mock("@xmldom/xmldom", () => ({
  DOMParser: vi.fn().mockImplementation(() => ({
    parseFromString: vi.fn(),
  })),
}));

const { parseFitBuffer, parseGpxString, processUpload } = await import("./import.service.js");

const mockFitData = {
  sessions: [
    {
      start_time: "2026-02-15T08:00:00Z",
      total_timer_time: 3600,
      total_distance: 45.2,
      avg_power: 205,
      avg_heart_rate: 148,
      max_heart_rate: 178,
      avg_cadence: 88,
    },
  ],
  records: [
    {
      timestamp: "2026-02-15T08:00:00Z",
      power: 200,
      heart_rate: 140,
      cadence: 85,
      speed: 30,
    },
    {
      timestamp: "2026-02-15T08:00:01Z",
      power: 210,
      heart_rate: 145,
      cadence: 90,
      speed: 31,
    },
    {
      timestamp: "2026-02-15T08:00:02Z",
      power: 195,
      heart_rate: 150,
      cadence: 87,
      speed: 29,
    },
  ],
};

const mockGpxParsed = {
  tracks: [
    {
      name: "Ruta Sierra Norte",
      points: [
        {
          latitude: 40.4,
          longitude: -3.7,
          elevation: 650,
          time: new Date("2026-02-15T09:00:00Z"),
          extensions: { power: 200, heartRate: 140, cadence: 85, speed: 8.3 },
        },
        {
          latitude: 40.41,
          longitude: -3.71,
          elevation: 660,
          time: new Date("2026-02-15T09:00:01Z"),
          extensions: { power: 210, heartRate: 148, cadence: 90, speed: 8.6 },
        },
      ],
      distance: { total: 45200, cumulative: [0, 45200] },
      duration: {
        totalDuration: 3600,
        movingDuration: 3500,
        startTime: new Date("2026-02-15T09:00:00Z"),
        endTime: new Date("2026-02-15T10:00:00Z"),
        cumulative: [0, 1],
      },
      elevation: { maximum: 700, minimum: 600, positive: 500, negative: 400, average: 650 },
      slopes: [0.5],
    },
  ],
  waypoints: [],
  routes: [],
  metadata: { name: null, description: null, link: null, author: null, time: null },
};

function mockSupabaseChain(result: { data: unknown; error: unknown; count?: number | null }) {
  const chain: Record<string, unknown> = {};
  const methods = ["select", "eq", "insert", "update", "single", "order", "range", "gte", "lte"];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  chain["single"] = vi.fn().mockResolvedValue(result);
  chain["then"] = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject);
  return chain;
}

describe("import.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("parseFitBuffer", () => {
    it("extrae datos de sesión y métricas de un .fit válido", async () => {
      mockParseAsync.mockResolvedValue(mockFitData);

      const result = await parseFitBuffer(Buffer.from("fake-fit-data"));

      expect(result.date).toBe("2026-02-15");
      expect(result.durationSeconds).toBe(3600);
      expect(result.distanceKm).toBe(45.2);
      expect(result.avgPowerWatts).toBe(205);
      expect(result.avgHrBpm).toBe(148);
      expect(result.maxHrBpm).toBe(178);
      expect(result.avgCadenceRpm).toBe(88);
      expect(result.metrics).toHaveLength(3);
      expect(result.metrics[0]).toMatchObject({
        timestampSeconds: 0,
        powerWatts: 200,
        hrBpm: 140,
        cadenceRpm: 85,
      });
      expect(result.metrics[1].timestampSeconds).toBe(1);
      expect(result.metrics[2].timestampSeconds).toBe(2);
    });

    it("lanza error si el parser falla", async () => {
      mockParseAsync.mockRejectedValue(new Error("Invalid FIT"));

      await expect(parseFitBuffer(Buffer.from("bad-data"))).rejects.toThrow(AppError);
      await expect(parseFitBuffer(Buffer.from("bad-data"))).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it("lanza error si no hay sesión", async () => {
      mockParseAsync.mockResolvedValue({ sessions: [], records: [] });

      await expect(parseFitBuffer(Buffer.from("no-session"))).rejects.toThrow(AppError);
    });

    it("maneja campos opcionales ausentes", async () => {
      mockParseAsync.mockResolvedValue({
        sessions: [
          {
            start_time: "2026-02-15T08:00:00Z",
            total_timer_time: 1800,
          },
        ],
        records: [],
      });

      const result = await parseFitBuffer(Buffer.from("minimal-fit"));

      expect(result.durationSeconds).toBe(1800);
      expect(result.distanceKm).toBeNull();
      expect(result.avgPowerWatts).toBeNull();
      expect(result.avgHrBpm).toBeNull();
      expect(result.metrics).toHaveLength(0);
    });
  });

  describe("parseGpxString", () => {
    it("extrae datos de track y métricas de un .gpx válido", () => {
      mockParseGPXWithCustomParser.mockReturnValue([mockGpxParsed, null]);

      const result = parseGpxString("<gpx>fake</gpx>");

      expect(result.name).toBe("Ruta Sierra Norte");
      expect(result.date).toBe("2026-02-15");
      expect(result.durationSeconds).toBe(3600);
      expect(result.distanceKm).toBe(45.2);
      expect(result.avgPowerWatts).toBe(205);
      expect(result.avgHrBpm).toBe(144);
      expect(result.maxHrBpm).toBe(148);
      expect(result.avgCadenceRpm).toBe(88);
      expect(result.metrics).toHaveLength(2);
      expect(result.metrics[0].timestampSeconds).toBe(0);
      expect(result.metrics[1].timestampSeconds).toBe(1);
    });

    it("lanza error si el parser falla", () => {
      mockParseGPXWithCustomParser.mockReturnValue([null, new Error("Invalid GPX")]);

      expect(() => parseGpxString("<bad-gpx>")).toThrow(AppError);
    });

    it("lanza error si no hay tracks", () => {
      mockParseGPXWithCustomParser.mockReturnValue([
        { ...mockGpxParsed, tracks: [] },
        null,
      ]);

      expect(() => parseGpxString("<empty-gpx>")).toThrow(AppError);
    });

    it("maneja puntos sin extensions", () => {
      const noExtParsed = {
        ...mockGpxParsed,
        tracks: [
          {
            ...mockGpxParsed.tracks[0],
            name: null,
            points: [
              {
                latitude: 40.4,
                longitude: -3.7,
                elevation: 650,
                time: new Date("2026-02-15T09:00:00Z"),
                extensions: null,
              },
            ],
          },
        ],
      };
      mockParseGPXWithCustomParser.mockReturnValue([noExtParsed, null]);

      const result = parseGpxString("<gpx>no-ext</gpx>");

      expect(result.avgPowerWatts).toBeNull();
      expect(result.avgHrBpm).toBeNull();
      expect(result.avgCadenceRpm).toBeNull();
      expect(result.metrics[0].powerWatts).toBeNull();
    });
  });

  describe("processUpload", () => {
    const mockActivity = {
      id: "act-new",
      user_id: "user-123",
      name: "Actividad 2026-02-15",
      date: "2026-02-15",
      type: "endurance",
      duration_seconds: 3600,
      distance_km: 45.2,
      avg_power_watts: 205,
      avg_hr_bpm: 148,
      max_hr_bpm: 178,
      avg_cadence_rpm: 88,
      tss: 55,
      rpe: null,
      ai_analysis: null,
      notes: null,
      is_reference: false,
      raw_file_url: null,
      created_at: "2026-02-15T08:00:00Z",
      updated_at: "2026-02-15T08:00:00Z",
    };

    const mockProfile = {
      id: "user-123",
      email: "test@test.com",
      display_name: "Test",
      age: 42,
      weight_kg: 75,
      ftp: 250,
      max_hr: 185,
      rest_hr: 55,
      goal: "performance",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };

    function setupMocks() {
      mockParseAsync.mockResolvedValue(mockFitData);

      mockFrom.mockImplementation((table: string) => {
        const chain = mockSupabaseChain({ data: null, error: null });

        if (table === "users") {
          chain["single"] = vi.fn().mockResolvedValue({ data: mockProfile, error: null });
        }
        if (table === "activities") {
          chain["single"] = vi.fn().mockResolvedValue({ data: mockActivity, error: null });
        }
        return chain;
      });
    }

    it("procesa un .fit: crea actividad e inserta métricas", async () => {
      setupMocks();

      const result = await processUpload("user-123", Buffer.from("fit-data"), "ride.fit");

      expect(result.activityId).toBe("act-new");
      expect(result.metricsCount).toBe(3);
      expect(mockFrom).toHaveBeenCalledWith("activity_metrics");
    });

    it("procesa un .gpx: crea actividad e inserta métricas", async () => {
      mockParseGPXWithCustomParser.mockReturnValue([mockGpxParsed, null]);

      mockFrom.mockImplementation((table: string) => {
        const chain = mockSupabaseChain({ data: null, error: null });
        if (table === "users") {
          chain["single"] = vi.fn().mockResolvedValue({ data: mockProfile, error: null });
        }
        if (table === "activities") {
          chain["single"] = vi.fn().mockResolvedValue({ data: mockActivity, error: null });
        }
        return chain;
      });

      const result = await processUpload(
        "user-123",
        Buffer.from("<gpx>data</gpx>"),
        "ride.gpx",
      );

      expect(result.activityId).toBe("act-new");
      expect(result.metricsCount).toBe(2);
    });

    it("aplica overrides de nombre y tipo", async () => {
      setupMocks();

      const result = await processUpload("user-123", Buffer.from("fit-data"), "ride.fit", {
        name: "Mi ruta custom",
        type: "intervals",
        rpe: 7,
        notes: "Buena sesión",
      });

      expect(result.activityId).toBe("act-new");
    });

    it("lanza error con formato no soportado", async () => {
      await expect(
        processUpload("user-123", Buffer.from("data"), "ride.csv"),
      ).rejects.toThrow(AppError);

      await expect(
        processUpload("user-123", Buffer.from("data"), "ride.csv"),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it("lanza error si la duración es 0", async () => {
      mockParseAsync.mockResolvedValue({
        sessions: [{ start_time: "2026-02-15T08:00:00Z", total_timer_time: 0 }],
        records: [],
      });

      await expect(
        processUpload("user-123", Buffer.from("data"), "empty.fit"),
      ).rejects.toThrow(AppError);
    });
  });
});
