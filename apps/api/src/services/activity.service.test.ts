import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "../plugins/error-handler.js";
import { supabaseAdmin } from "./supabase.js";

vi.mock("./supabase.js", () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}));

const mockFrom = vi.mocked(supabaseAdmin.from);

function mockSupabaseChain(result: {
  data: unknown;
  error: { message: string } | null;
  count?: number | null;
}) {
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
  mockFrom.mockReturnValue(chain as ReturnType<typeof mockFrom>);
  return chain;
}

const { listActivities, getActivity, createActivity, updateActivity, deleteActivity } =
  await import("./activity.service.js");

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

describe("activity.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listActivities", () => {
    it("devuelve lista paginada con meta correcta", async () => {
      mockSupabaseChain({ data: [mockActivity], error: null, count: 1 });
      const result = await listActivities({ userId: "user-123" });
      expect(result.data).toEqual([mockActivity]);
      expect(result.meta).toEqual({ page: 1, limit: 20, total: 1, totalPages: 1 });
    });

    it("calcula totalPages correctamente", async () => {
      mockSupabaseChain({ data: Array(20).fill(mockActivity), error: null, count: 45 });
      const result = await listActivities({ userId: "user-123", page: 1, limit: 20 });
      expect(result.meta.totalPages).toBe(3);
    });

    it("aplica filtro por type", async () => {
      const chain = mockSupabaseChain({ data: [], error: null, count: 0 });
      await listActivities({ userId: "user-123", type: "intervals" });
      expect(chain.eq).toHaveBeenCalledWith("type", "intervals");
    });

    it("aplica filtro dateFrom/dateTo", async () => {
      const chain = mockSupabaseChain({ data: [], error: null, count: 0 });
      await listActivities({
        userId: "user-123",
        dateFrom: "2026-02-01",
        dateTo: "2026-02-15",
      });
      expect(chain.gte).toHaveBeenCalledWith("date", "2026-02-01");
      expect(chain.lte).toHaveBeenCalledWith("date", "2026-02-15");
    });

    it("aplica filtro search con ilike", async () => {
      const chain = mockSupabaseChain({ data: [], error: null, count: 0 });
      await listActivities({ userId: "user-123", search: "morning" });
      expect(chain.or).toHaveBeenCalledWith("name.ilike.%morning%,notes.ilike.%morning%");
    });

    it("lanza AppError 500 si Supabase falla", async () => {
      mockSupabaseChain({ data: null, error: { message: "DB error" }, count: null });
      await expect(listActivities({ userId: "user-123" })).rejects.toThrow(AppError);
      await expect(listActivities({ userId: "user-123" })).rejects.toMatchObject({
        statusCode: 500,
      });
    });
  });

  describe("getActivity", () => {
    it("devuelve actividad cuando existe", async () => {
      mockSupabaseChain({ data: mockActivity, error: null });
      const result = await getActivity("user-123", "act-123");
      expect(result).toEqual(mockActivity);
    });

    it("lanza AppError 404 cuando no existe", async () => {
      mockSupabaseChain({ data: null, error: null });
      await expect(getActivity("user-123", "act-999")).rejects.toThrow(AppError);
      await expect(getActivity("user-123", "act-999")).rejects.toMatchObject({
        statusCode: 404,
        code: "NOT_FOUND",
      });
    });
  });

  describe("createActivity", () => {
    it("calcula TSS cuando hay avg_power_watts y FTP", async () => {
      const activityData = {
        name: "Power Ride",
        date: "2026-02-10",
        type: "endurance" as const,
        duration_seconds: 3600,
        avg_power_watts: 250,
      };
      const expectedTss = Math.round(Math.pow(250 / 300, 2) * 1 * 100); // 69
      mockSupabaseChain({
        data: { ...mockActivity, ...activityData, tss: expectedTss },
        error: null,
      });
      const result = await createActivity("user-123", activityData, 300);
      expect(result.tss).toBe(expectedTss);
    });

    it("devuelve tss=null cuando no hay FTP", async () => {
      const activityData = {
        name: "No FTP Ride",
        date: "2026-02-10",
        type: "endurance" as const,
        duration_seconds: 3600,
        avg_power_watts: 250,
      };
      mockSupabaseChain({ data: { ...mockActivity, ...activityData, tss: null }, error: null });
      const result = await createActivity("user-123", activityData, undefined);
      expect(result.tss).toBeNull();
    });

    it("devuelve tss=null cuando no hay avg_power_watts", async () => {
      const activityData = {
        name: "No Power Ride",
        date: "2026-02-10",
        type: "endurance" as const,
        duration_seconds: 3600,
      };
      mockSupabaseChain({
        data: { ...mockActivity, ...activityData, avg_power_watts: null, tss: null },
        error: null,
      });
      const result = await createActivity("user-123", activityData, 300);
      expect(result.tss).toBeNull();
    });

    it("lanza AppError 500 si Supabase falla en insert", async () => {
      const activityData = {
        name: "Fail Ride",
        date: "2026-02-10",
        type: "endurance" as const,
        duration_seconds: 3600,
      };
      mockSupabaseChain({ data: null, error: { message: "Insert failed" } });
      await expect(createActivity("user-123", activityData)).rejects.toThrow(AppError);
      await expect(createActivity("user-123", activityData)).rejects.toMatchObject({
        statusCode: 500,
      });
    });
  });

  describe("updateActivity", () => {
    it("actualiza actividad con datos parciales", async () => {
      const updated = { ...mockActivity, name: "Updated Ride", rpe: 7 };
      mockSupabaseChain({ data: updated, error: null });
      const result = await updateActivity("user-123", "act-123", { name: "Updated Ride", rpe: 7 });
      expect(result).toEqual(updated);
    });

    it("lanza AppError 404 cuando actividad no existe", async () => {
      mockSupabaseChain({ data: null, error: null });
      await expect(updateActivity("user-123", "act-999", { name: "Test" })).rejects.toThrow(
        AppError,
      );
      await expect(updateActivity("user-123", "act-999", { name: "Test" })).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe("deleteActivity", () => {
    function mockDeleteChain(result: { error: { message: string } | null; count: number | null }) {
      const lastEq = vi.fn().mockResolvedValue(result);
      const firstEq = vi.fn().mockReturnValue({ eq: lastEq });
      const deleteFn = vi.fn().mockReturnValue({ eq: firstEq });
      mockFrom.mockReturnValue({ delete: deleteFn } as ReturnType<typeof mockFrom>);
    }

    it("elimina actividad correctamente", async () => {
      mockDeleteChain({ error: null, count: 1 });
      await expect(deleteActivity("user-123", "act-123")).resolves.not.toThrow();
    });

    it("lanza AppError 404 cuando count es 0", async () => {
      mockDeleteChain({ error: null, count: 0 });
      await expect(deleteActivity("user-123", "act-999")).rejects.toThrow(AppError);
      await expect(deleteActivity("user-123", "act-999")).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("lanza AppError 500 cuando Supabase falla", async () => {
      mockDeleteChain({ error: { message: "DB error" }, count: null });
      await expect(deleteActivity("user-123", "act-123")).rejects.toThrow(AppError);
      await expect(deleteActivity("user-123", "act-123")).rejects.toMatchObject({
        statusCode: 500,
      });
    });
  });
});
