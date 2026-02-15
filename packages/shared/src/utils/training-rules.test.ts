import { describe, it, expect } from "vitest";
import {
  checkOverloadAlert,
  checkRestAlert,
  checkDetrainingAlert,
  checkRampRateAlert,
  evaluateTrainingAlerts,
} from "./training-rules";

describe("training-rules", () => {
  describe("checkOverloadAlert", () => {
    it("none cuando TSS semanal < 120% del promedio", () => {
      const result = checkOverloadAlert(100, 100);
      expect(result.level).toBe("none");
    });

    it("warning cuando TSS semanal entre 120-149%", () => {
      const result = checkOverloadAlert(130, 100);
      expect(result.level).toBe("warning");
      expect(result.type).toBe("overload");
      expect(result.message).toContain("130%");
    });

    it("critical cuando TSS semanal ≥ 150%", () => {
      const result = checkOverloadAlert(160, 100);
      expect(result.level).toBe("critical");
      expect(result.type).toBe("overload");
    });

    it("none cuando avgWeeklyTSS = 0", () => {
      const result = checkOverloadAlert(200, 0);
      expect(result.level).toBe("none");
    });
  });

  describe("checkRestAlert", () => {
    it("warning con 3 días consecutivos de TSS ≥ 80", () => {
      const activities = [
        { date: "2026-02-10", tss: 90, rpe: null },
        { date: "2026-02-11", tss: 85, rpe: null },
        { date: "2026-02-12", tss: 100, rpe: null },
      ];
      const result = checkRestAlert(activities);
      expect(result.level).toBe("warning");
      expect(result.type).toBe("rest_needed");
    });

    it("critical con 4+ días consecutivos de alta intensidad", () => {
      const activities = [
        { date: "2026-02-10", tss: 90, rpe: null },
        { date: "2026-02-11", tss: 85, rpe: null },
        { date: "2026-02-12", tss: 100, rpe: null },
        { date: "2026-02-13", tss: 80, rpe: null },
      ];
      const result = checkRestAlert(activities);
      expect(result.level).toBe("critical");
    });

    it("none con 2 días consecutivos (no alcanza umbral)", () => {
      const activities = [
        { date: "2026-02-10", tss: 90, rpe: null },
        { date: "2026-02-11", tss: 85, rpe: null },
      ];
      const result = checkRestAlert(activities);
      expect(result.level).toBe("none");
    });

    it("detecta intensidad alta por RPE ≥ 8", () => {
      const activities = [
        { date: "2026-02-10", tss: 50, rpe: 9 },
        { date: "2026-02-11", tss: 40, rpe: 8 },
        { date: "2026-02-12", tss: 30, rpe: 10 },
      ];
      const result = checkRestAlert(activities);
      expect(result.level).toBe("warning");
    });

    it("none con lista vacía", () => {
      const result = checkRestAlert([]);
      expect(result.level).toBe("none");
    });

    it("no cuenta días no consecutivos", () => {
      const activities = [
        { date: "2026-02-10", tss: 90, rpe: null },
        { date: "2026-02-11", tss: 85, rpe: null },
        // gap de un día
        { date: "2026-02-13", tss: 100, rpe: null },
      ];
      const result = checkRestAlert(activities);
      expect(result.level).toBe("none");
    });
  });

  describe("checkDetrainingAlert", () => {
    it("warning sin actividad en 7+ días", () => {
      const result = checkDetrainingAlert(0, "2026-02-01", "2026-02-08");
      expect(result.level).toBe("warning");
      expect(result.type).toBe("detraining");
    });

    it("critical sin actividad en 10+ días", () => {
      const result = checkDetrainingAlert(0, "2026-02-01", "2026-02-11");
      expect(result.level).toBe("critical");
    });

    it("none con actividad reciente", () => {
      const result = checkDetrainingAlert(0, "2026-02-13", "2026-02-15");
      expect(result.level).toBe("none");
    });

    it("warning cuando TSB > 25 (demasiado descanso)", () => {
      const result = checkDetrainingAlert(30, "2026-02-14", "2026-02-15");
      expect(result.level).toBe("warning");
      expect(result.message).toContain("TSB");
    });

    it("none sin lastActivityDate y TSB normal", () => {
      const result = checkDetrainingAlert(10, null, "2026-02-15");
      expect(result.level).toBe("none");
    });
  });

  describe("checkRampRateAlert", () => {
    it("warning cuando CTL sube > 7 puntos/semana", () => {
      const result = checkRampRateAlert(50, 42);
      expect(result.level).toBe("warning");
      expect(result.type).toBe("ramp_rate");
    });

    it("critical cuando CTL sube > 10 puntos/semana", () => {
      const result = checkRampRateAlert(55, 42);
      expect(result.level).toBe("critical");
    });

    it("none cuando CTL sube ≤ 7 puntos/semana", () => {
      const result = checkRampRateAlert(47, 42);
      expect(result.level).toBe("none");
    });

    it("none cuando CTL baja", () => {
      const result = checkRampRateAlert(40, 50);
      expect(result.level).toBe("none");
    });
  });

  describe("evaluateTrainingAlerts", () => {
    it("retorna solo alertas activas (level !== none)", () => {
      const alerts = evaluateTrainingAlerts({
        weeklyTSS: 150,
        avgWeeklyTSS: 100,
        recentActivities: [
          { date: "2026-02-10", tss: 90, rpe: null },
          { date: "2026-02-11", tss: 85, rpe: null },
          { date: "2026-02-12", tss: 100, rpe: null },
        ],
        trainingLoad: { ctl: 50, atl: 80, tsb: -30 },
        ctlPreviousWeek: 42,
        lastActivityDate: "2026-02-12",
        today: "2026-02-15",
      });

      // Overload: 150% → critical ✓
      // Rest: 3 días → warning ✓
      // Detraining: recent activity + TSB=-30 → none ✓
      // Ramp rate: 50-42=8 > 7 → warning ✓
      expect(alerts).toHaveLength(3);
      expect(alerts.map((a) => a.type)).toContain("overload");
      expect(alerts.map((a) => a.type)).toContain("rest_needed");
      expect(alerts.map((a) => a.type)).toContain("ramp_rate");
    });

    it("retorna array vacío cuando todo está normal", () => {
      const alerts = evaluateTrainingAlerts({
        weeklyTSS: 100,
        avgWeeklyTSS: 100,
        recentActivities: [{ date: "2026-02-14", tss: 60, rpe: 6 }],
        trainingLoad: { ctl: 45, atl: 50, tsb: -5 },
        ctlPreviousWeek: 43,
        lastActivityDate: "2026-02-14",
        today: "2026-02-15",
      });

      expect(alerts).toHaveLength(0);
    });
  });
});
