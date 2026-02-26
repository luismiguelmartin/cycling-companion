import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSelect = vi.fn();
const mockUpdate = vi.fn();

vi.mock("./supabase.js", () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: mockSelect,
      update: mockUpdate,
    })),
  },
}));

const { recalculateMetricsForUser } = await import("./recalculate.service.js");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("recalculateMetricsForUser", () => {
  it("recalcula TSS, IF y VI para actividades con NP", async () => {
    const activities = [
      {
        id: "00000000-0000-0000-0000-000000000001",
        normalized_power: 200,
        duration_seconds: 3600,
        avg_power_watts: 180,
      },
      {
        id: "00000000-0000-0000-0000-000000000002",
        normalized_power: 250,
        duration_seconds: 7200,
        avg_power_watts: 220,
      },
    ];

    // Mock select chain: from().select().eq().not()
    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        not: vi.fn().mockResolvedValue({ data: activities, error: null }),
      }),
    });

    // Mock update chain: from().update().eq()
    mockUpdate.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    const result = await recalculateMetricsForUser("user-1", 250);

    expect(result).toBe(2);
    expect(mockUpdate).toHaveBeenCalledTimes(2);

    // Primera actividad: NP=200, FTP=250 → IF=0.8, TSS=0.8²×1h×100=64
    const firstCall = mockUpdate.mock.calls[0][0];
    expect(firstCall.intensity_factor).toBe(0.8);
    expect(firstCall.tss).toBe(64);
    expect(firstCall.variability_index).toBe(1.11); // 200/180

    // Segunda actividad: NP=250, FTP=250 → IF=1.0, TSS=1.0²×2h×100=200
    const secondCall = mockUpdate.mock.calls[1][0];
    expect(secondCall.intensity_factor).toBe(1);
    expect(secondCall.tss).toBe(200);
    expect(secondCall.variability_index).toBe(1.14); // 250/220
  });

  it("retorna 0 si no hay actividades con NP", async () => {
    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        not: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    });

    const result = await recalculateMetricsForUser("user-1", 250);
    expect(result).toBe(0);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("retorna 0 si FTP es 0 o negativo", async () => {
    const result = await recalculateMetricsForUser("user-1", 0);
    expect(result).toBe(0);
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it("maneja avg_power_watts null para VI", async () => {
    const activities = [
      {
        id: "00000000-0000-0000-0000-000000000001",
        normalized_power: 200,
        duration_seconds: 3600,
        avg_power_watts: null,
      },
    ];

    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        not: vi.fn().mockResolvedValue({ data: activities, error: null }),
      }),
    });

    mockUpdate.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    const result = await recalculateMetricsForUser("user-1", 250);

    expect(result).toBe(1);
    const call = mockUpdate.mock.calls[0][0];
    expect(call.variability_index).toBeNull();
    expect(call.intensity_factor).toBe(0.8);
  });
});
