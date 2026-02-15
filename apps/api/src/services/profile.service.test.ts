import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppError } from "../plugins/error-handler.js";

const mockSingle = vi.fn();

vi.mock("./supabase.js", () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: mockSingle,
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: mockSingle,
          })),
        })),
      })),
    })),
  },
}));

// Import after mock
const { getProfile, updateProfile } = await import("./profile.service.js");

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

describe("ProfileService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getProfile", () => {
    it("devuelve perfil cuando existe", async () => {
      mockSingle.mockResolvedValue({ data: mockProfile, error: null });
      const result = await getProfile("user-123");
      expect(result).toEqual(mockProfile);
    });

    it("lanza AppError 404 cuando hay error de Supabase", async () => {
      mockSingle.mockResolvedValue({ data: null, error: { message: "Not found" } });
      await expect(getProfile("user-123")).rejects.toThrow(AppError);
      await expect(getProfile("user-123")).rejects.toMatchObject({
        statusCode: 404,
        code: "NOT_FOUND",
      });
    });

    it("lanza AppError 404 cuando data es null", async () => {
      mockSingle.mockResolvedValue({ data: null, error: null });
      await expect(getProfile("user-123")).rejects.toThrow(AppError);
      await expect(getProfile("user-123")).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe("updateProfile", () => {
    it("actualiza perfil con datos válidos", async () => {
      const updated = { ...mockProfile, display_name: "Updated Name" };
      mockSingle.mockResolvedValue({ data: updated, error: null });
      const result = await updateProfile("user-123", { display_name: "Updated Name" });
      expect(result).toEqual(updated);
    });

    it("lanza AppError 404 cuando el usuario no existe", async () => {
      mockSingle.mockResolvedValue({ data: null, error: { message: "Not found" } });
      await expect(updateProfile("user-123", { display_name: "Test" })).rejects.toThrow(AppError);
      await expect(updateProfile("user-123", { display_name: "Test" })).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("lanza error cuando age es negativa", async () => {
      await expect(updateProfile("user-123", { age: -5 })).rejects.toThrow();
    });

    it("lanza error cuando goal es inválido", async () => {
      await expect(
        updateProfile("user-123", { goal: "invalid" as "performance" }),
      ).rejects.toThrow();
    });
  });
});
