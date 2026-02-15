import { describe, it, expect } from "vitest";
import {
  calculateIF,
  calculateTSS,
  calculateCTL,
  calculateATL,
  calculateTrainingLoad,
  calculateWeeklyTSS,
  calculateNP,
  classifyActivityZone,
} from "./training-calculations";
import type { TrainingActivityInput } from "./training-calculations";

describe("training-calculations", () => {
  describe("calculateIF", () => {
    it("calcula IF correcto para 200W / 250W FTP", () => {
      expect(calculateIF(200, 250)).toBeCloseTo(0.8);
    });

    it("retorna 0 cuando avgPower es null", () => {
      expect(calculateIF(null, 250)).toBe(0);
    });

    it("retorna 0 cuando ftp es 0", () => {
      expect(calculateIF(200, 0)).toBe(0);
    });

    it("retorna 0 cuando ftp es null", () => {
      expect(calculateIF(200, null)).toBe(0);
    });
  });

  describe("calculateTSS", () => {
    it("calcula TSS correcto: 200W, 250W FTP, 1h → 64", () => {
      expect(calculateTSS(200, 250, 3600)).toBe(64);
    });

    it("calcula TSS correcto: 300W, 250W FTP, 1.5h → 216", () => {
      // IF = 300/250 = 1.2, IF² = 1.44, TSS = 1.44 * 1.5 * 100 = 216
      expect(calculateTSS(300, 250, 5400)).toBe(216);
    });

    it("retorna 0 cuando avgPower es null", () => {
      expect(calculateTSS(null, 250, 3600)).toBe(0);
    });

    it("retorna resultado redondeado a entero", () => {
      // IF = 180/250 = 0.72, IF² = 0.5184, TSS = 0.5184 * 1 * 100 = 51.84 → 52
      expect(calculateTSS(180, 250, 3600)).toBe(52);
    });
  });

  describe("calculateCTL", () => {
    it("converge cerca de 100 tras 42+ días de TSS=100 diario", () => {
      const activities: TrainingActivityInput[] = [];
      for (let i = 0; i < 60; i++) {
        const date = new Date("2026-01-01");
        date.setDate(date.getDate() + i);
        activities.push({
          date: date.toISOString().slice(0, 10),
          duration_seconds: 3600,
          avg_power_watts: 200,
          tss: 100,
        });
      }
      const ctl = calculateCTL(activities, "2026-03-01");
      // After 60 days of TSS=100, CTL should be close to 100
      expect(ctl).toBeGreaterThan(70);
      expect(ctl).toBeLessThanOrEqual(100);
    });

    it("retorna 0 sin actividades", () => {
      expect(calculateCTL([], "2026-02-15")).toBe(0);
    });

    it("días sin actividad cuentan como TSS=0", () => {
      const activities: TrainingActivityInput[] = [
        { date: "2026-02-01", duration_seconds: 3600, avg_power_watts: 200, tss: 100 },
        // gap de varios días
        { date: "2026-02-10", duration_seconds: 3600, avg_power_watts: 200, tss: 100 },
      ];
      const ctl = calculateCTL(activities, "2026-02-10");
      // Should be low because of the gap
      expect(ctl).toBeLessThan(20);
    });
  });

  describe("calculateATL", () => {
    it("converge más rápido que CTL (constante 7 vs 42)", () => {
      const activities: TrainingActivityInput[] = [];
      for (let i = 0; i < 14; i++) {
        const date = new Date("2026-02-01");
        date.setDate(date.getDate() + i);
        activities.push({
          date: date.toISOString().slice(0, 10),
          duration_seconds: 3600,
          avg_power_watts: 200,
          tss: 100,
        });
      }
      const targetDate = "2026-02-14";
      const atl = calculateATL(activities, targetDate);
      const ctl = calculateCTL(activities, targetDate);
      // ATL should converge faster
      expect(atl).toBeGreaterThan(ctl);
    });

    it("ATL > CTL con carga reciente alta indica fatiga", () => {
      const activities: TrainingActivityInput[] = [];
      // 7 días de TSS=200 (alto)
      for (let i = 0; i < 7; i++) {
        const date = new Date("2026-02-08");
        date.setDate(date.getDate() + i);
        activities.push({
          date: date.toISOString().slice(0, 10),
          duration_seconds: 3600,
          avg_power_watts: 300,
          tss: 200,
        });
      }
      const load = calculateTrainingLoad(activities, "2026-02-14");
      expect(load.atl).toBeGreaterThan(load.ctl);
      expect(load.tsb).toBeLessThan(0);
    });
  });

  describe("calculateTrainingLoad", () => {
    it("TSB positivo tras semana de descanso después de entrenamiento", () => {
      const activities: TrainingActivityInput[] = [];
      // 3 semanas de entrenamiento
      for (let i = 0; i < 21; i++) {
        const date = new Date("2026-01-10");
        date.setDate(date.getDate() + i);
        activities.push({
          date: date.toISOString().slice(0, 10),
          duration_seconds: 3600,
          avg_power_watts: 200,
          tss: 80,
        });
      }
      // Luego 7 días de descanso (sin actividad)
      const afterRest = "2026-02-07";
      const load = calculateTrainingLoad(activities, afterRest);
      // CTL cae lentamente, ATL cae rápidamente → TSB se vuelve positivo
      expect(load.tsb).toBeGreaterThan(0);
    });

    it("TSB negativo tras semana intensa", () => {
      const activities: TrainingActivityInput[] = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date("2026-02-01");
        date.setDate(date.getDate() + i);
        activities.push({
          date: date.toISOString().slice(0, 10),
          duration_seconds: 3600,
          avg_power_watts: 300,
          tss: 150,
        });
      }
      const load = calculateTrainingLoad(activities, "2026-02-07");
      expect(load.tsb).toBeLessThan(0);
    });

    it("sin actividades → todo en 0", () => {
      const load = calculateTrainingLoad([], "2026-02-15");
      expect(load.ctl).toBe(0);
      expect(load.atl).toBe(0);
      expect(load.tsb).toBe(0);
    });
  });

  describe("calculateWeeklyTSS", () => {
    it("suma correcta de TSS en una semana", () => {
      const activities: TrainingActivityInput[] = [
        { date: "2026-02-09", duration_seconds: 3600, avg_power_watts: 200, tss: 60 },
        { date: "2026-02-10", duration_seconds: 3600, avg_power_watts: 200, tss: 80 },
        { date: "2026-02-12", duration_seconds: 3600, avg_power_watts: 200, tss: 50 },
        // Fuera de la semana
        { date: "2026-02-16", duration_seconds: 3600, avg_power_watts: 200, tss: 100 },
      ];
      // Semana del 9 al 15 de febrero
      expect(calculateWeeklyTSS(activities, "2026-02-09")).toBe(190);
    });

    it("ignora actividades con tss null", () => {
      const activities: TrainingActivityInput[] = [
        { date: "2026-02-09", duration_seconds: 3600, avg_power_watts: null, tss: null },
        { date: "2026-02-10", duration_seconds: 3600, avg_power_watts: 200, tss: 80 },
      ];
      expect(calculateWeeklyTSS(activities, "2026-02-09")).toBe(80);
    });
  });

  describe("calculateNP", () => {
    it("retorna 0 para array vacío", () => {
      expect(calculateNP([])).toBe(0);
    });

    it("potencia constante → NP ≈ avg power", () => {
      // 60 muestras a 1s de 200W constantes
      const samples = Array(60).fill(200);
      expect(calculateNP(samples)).toBe(200);
    });

    it("potencia variable → NP > avg power", () => {
      // Bloques de 30s a 100W y 30s a 300W para que el rolling avg capture variabilidad
      const samples: number[] = [];
      for (let i = 0; i < 120; i++) {
        samples.push(i < 30 || (i >= 60 && i < 90) ? 100 : 300);
      }
      const np = calculateNP(samples);
      const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
      expect(np).toBeGreaterThan(avg);
    });

    it("menos de 30 muestras → devuelve media simple", () => {
      const samples = [100, 200, 300];
      expect(calculateNP(samples)).toBe(200);
    });

    it("respeta sampleIntervalSeconds para ajustar ventana", () => {
      // Con intervalo de 5s, ventana = 30/5 = 6 muestras
      const samples = Array(20).fill(250);
      expect(calculateNP(samples, 5)).toBe(250);
    });
  });

  describe("classifyActivityZone", () => {
    it("clasifica Z1 (recuperación) para potencia baja", () => {
      // 100W con FTP 250 → ratio 0.4 → Z1 (0-0.56)
      expect(classifyActivityZone(100, 250)).toBe("Z1");
    });

    it("clasifica Z2 (resistencia) para ratio ~0.7", () => {
      // 175W con FTP 250 → ratio 0.7 → Z2 (0.56-0.75)
      expect(classifyActivityZone(175, 250)).toBe("Z2");
    });

    it("clasifica Z4 (umbral) para ratio ~1.0", () => {
      // 250W con FTP 250 → ratio 1.0 → Z4 (0.91-1.05)
      expect(classifyActivityZone(250, 250)).toBe("Z4");
    });

    it("clasifica Z6 (anaeróbico) para ratio > 1.2", () => {
      // 350W con FTP 250 → ratio 1.4 → Z6 (>1.2)
      expect(classifyActivityZone(350, 250)).toBe("Z6");
    });

    it("retorna null cuando avgPower es null", () => {
      expect(classifyActivityZone(null, 250)).toBeNull();
    });

    it("retorna null cuando ftp es null", () => {
      expect(classifyActivityZone(200, null)).toBeNull();
    });
  });
});
