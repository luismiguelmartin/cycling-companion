import { describe, it, expect } from "vitest";
import {
  aiActivityAnalysisSchema,
  aiCoachTipSchema,
  aiWeeklySummarySchema,
  aiWeeklyPlanResponseSchema,
} from "shared";
import type { Activity, UserProfile, TrainingLoad, TrainingAlert } from "shared";
import {
  fallbackAnalyzeActivity,
  fallbackWeeklyPlan,
  fallbackWeeklySummary,
  fallbackCoachTip,
} from "./fallback.js";

const mockProfile: UserProfile = {
  id: "user-123",
  email: "test@example.com",
  display_name: "Test User",
  age: 45,
  weight_kg: 75,
  ftp: 250,
  max_hr: 185,
  rest_hr: 55,
  goal: "performance",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const mockActivity: Activity = {
  id: "act-123",
  user_id: "user-123",
  name: "Morning Ride",
  date: "2026-02-15",
  type: "endurance",
  duration_seconds: 3600,
  distance_km: 30,
  avg_power_watts: 200,
  avg_hr_bpm: 140,
  max_hr_bpm: 165,
  avg_cadence_rpm: 85,
  tss: 64,
  rpe: 6,
  ai_analysis: null,
  notes: null,
  is_reference: false,
  raw_file_url: null,
  created_at: "2026-02-15T10:00:00Z",
  updated_at: "2026-02-15T10:00:00Z",
};

const weekDates = [
  { day: "Lun", date: "2026-02-16" },
  { day: "Mar", date: "2026-02-17" },
  { day: "Mié", date: "2026-02-18" },
  { day: "Jue", date: "2026-02-19" },
  { day: "Vie", date: "2026-02-20" },
  { day: "Sáb", date: "2026-02-21" },
  { day: "Dom", date: "2026-02-22" },
];

describe("fallback", () => {
  describe("fallbackAnalyzeActivity", () => {
    it("produce output válido contra schema Zod", () => {
      const load: TrainingLoad = { ctl: 40, atl: 60, tsb: -20 };
      const result = fallbackAnalyzeActivity(mockActivity, mockProfile, load, []);
      expect(() => aiActivityAnalysisSchema.parse(result)).not.toThrow();
    });

    it("menciona recuperación cuando fatigado (TSB < -15)", () => {
      const load: TrainingLoad = { ctl: 40, atl: 60, tsb: -20 };
      const result = fallbackAnalyzeActivity(mockActivity, mockProfile, load, []);
      expect(result.recommendation.toLowerCase()).toContain("recuperación");
    });

    it("sugiere intensidad cuando fresco (TSB > 15)", () => {
      const load: TrainingLoad = { ctl: 50, atl: 30, tsb: 20 };
      const result = fallbackAnalyzeActivity(mockActivity, mockProfile, load, []);
      expect(result.recommendation.toLowerCase()).toContain("intervalos");
    });
  });

  describe("fallbackWeeklyPlan", () => {
    it("produce output válido contra schema Zod (7 días)", () => {
      const load: TrainingLoad = { ctl: 40, atl: 40, tsb: 0 };
      const result = fallbackWeeklyPlan(weekDates, mockProfile, load, []);
      expect(() => aiWeeklyPlanResponseSchema.parse(result)).not.toThrow();
      expect(result.days).toHaveLength(7);
    });

    it("genera plan para objetivo performance", () => {
      const load: TrainingLoad = { ctl: 40, atl: 40, tsb: 0 };
      const result = fallbackWeeklyPlan(weekDates, mockProfile, load, []);
      const types = result.days.map((d) => d.type);
      expect(types).toContain("intervals");
      expect(types).toContain("rest");
    });

    it("genera plan para objetivo health", () => {
      const healthProfile = { ...mockProfile, goal: "health" as const };
      const load: TrainingLoad = { ctl: 30, atl: 30, tsb: 0 };
      const result = fallbackWeeklyPlan(weekDates, healthProfile, load, []);
      expect(() => aiWeeklyPlanResponseSchema.parse(result)).not.toThrow();
    });
  });

  describe("fallbackWeeklySummary", () => {
    it("produce output válido contra schema Zod", () => {
      const periodA = { sessionCount: 3, totalTSS: 200, avgPower: 210 };
      const periodB = { sessionCount: 4, totalTSS: 250, avgPower: 220 };
      const result = fallbackWeeklySummary(periodA, periodB, []);
      expect(() => aiWeeklySummarySchema.parse(result)).not.toThrow();
    });

    it("incluye alert cuando hay overload", () => {
      const periodA = { sessionCount: 3, totalTSS: 200, avgPower: 210 };
      const periodB = { sessionCount: 4, totalTSS: 250, avgPower: 220 };
      const alerts: TrainingAlert[] = [
        { type: "overload", level: "warning", message: "Carga alta" },
      ];
      const result = fallbackWeeklySummary(periodA, periodB, alerts);
      expect(result.alert).toBeDefined();
    });
  });

  describe("fallbackCoachTip", () => {
    it("produce output válido contra schema Zod", () => {
      const load: TrainingLoad = { ctl: 40, atl: 40, tsb: 0 };
      const result = fallbackCoachTip(mockProfile, mockActivity, load, []);
      expect(() => aiCoachTipSchema.parse(result)).not.toThrow();
    });

    it("recomienda descanso con rest_needed alert", () => {
      const load: TrainingLoad = { ctl: 40, atl: 60, tsb: -20 };
      const alerts: TrainingAlert[] = [
        { type: "rest_needed", level: "warning", message: "3 días intensos" },
      ];
      const result = fallbackCoachTip(mockProfile, mockActivity, load, alerts);
      expect(result.recommendation.toLowerCase()).toContain("recuperación");
    });

    it("sugiere retomar con detraining alert", () => {
      const load: TrainingLoad = { ctl: 20, atl: 5, tsb: 15 };
      const alerts: TrainingAlert[] = [
        { type: "detraining", level: "warning", message: "7 días sin entrenar" },
      ];
      const result = fallbackCoachTip(mockProfile, null, load, alerts);
      expect(result.recommendation.toLowerCase()).toContain("sin entrenar");
    });
  });
});
