import { describe, it, expect } from "vitest";
import {
  calculateWeeklyKPIs,
  calculateTrends,
  calculateWeeklyTrend,
  calculateDailyLoad,
  detectOverload,
  formatDuration,
  getWeekNumber,
  getWeekStart,
} from "./calculations";

// Helper: crea una fecha UTC a medianoche
function utc(dateStr: string): Date {
  return new Date(dateStr);
}

describe("getWeekStart", () => {
  it("devuelve el lunes para un lunes", () => {
    const result = getWeekStart(utc("2026-02-16"));
    expect(result.toISOString().slice(0, 10)).toBe("2026-02-16");
  });

  it("devuelve el lunes para un miércoles", () => {
    const result = getWeekStart(utc("2026-02-18"));
    expect(result.toISOString().slice(0, 10)).toBe("2026-02-16");
  });

  it("devuelve el lunes para un domingo", () => {
    const result = getWeekStart(utc("2026-02-22"));
    expect(result.toISOString().slice(0, 10)).toBe("2026-02-16");
  });

  it("devuelve el lunes anterior para un sábado", () => {
    const result = getWeekStart(utc("2026-02-21"));
    expect(result.toISOString().slice(0, 10)).toBe("2026-02-16");
  });

  it("devuelve medianoche UTC", () => {
    const result = getWeekStart(utc("2026-02-18"));
    expect(result.getUTCHours()).toBe(0);
    expect(result.getUTCMinutes()).toBe(0);
    expect(result.getUTCSeconds()).toBe(0);
    expect(result.getUTCMilliseconds()).toBe(0);
  });

  it("maneja cruce de mes", () => {
    // 2026-03-01 es domingo → lunes anterior = 23 feb
    const result = getWeekStart(utc("2026-03-01"));
    expect(result.toISOString().slice(0, 10)).toBe("2026-02-23");
  });

  it("maneja cruce de año", () => {
    // 2026-01-01 es jueves → lunes = 29 dic 2025
    const result = getWeekStart(utc("2026-01-01"));
    expect(result.toISOString().slice(0, 10)).toBe("2025-12-29");
  });
});

describe("getWeekNumber", () => {
  it("devuelve semana 8 para 16 feb 2026", () => {
    expect(getWeekNumber(utc("2026-02-16"))).toBe(8);
  });

  it("devuelve semana 1 para inicio de 2026", () => {
    // 2025-12-29 (lunes) es semana 1 de 2026 en ISO
    expect(getWeekNumber(utc("2025-12-29"))).toBe(1);
  });

  it("devuelve semana 52 o 53 para fin de año", () => {
    const weekNum = getWeekNumber(utc("2025-12-28"));
    expect(weekNum).toBeGreaterThanOrEqual(52);
  });
});

describe("calculateWeeklyKPIs", () => {
  const weekStart = utc("2026-02-16");
  const weekEnd = new Date(weekStart.getTime());
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
  weekEnd.setUTCHours(23, 59, 59, 999);

  const activities = [
    {
      date: "2026-02-16",
      duration_seconds: 3600,
      distance_km: 30,
      avg_power_watts: 200,
      avg_hr_bpm: 150,
      tss: 80,
    },
    {
      date: "2026-02-18",
      duration_seconds: 5400,
      distance_km: 50,
      avg_power_watts: 180,
      avg_hr_bpm: 140,
      tss: 90,
    },
    // Fuera de rango (semana anterior)
    {
      date: "2026-02-15",
      duration_seconds: 7200,
      distance_km: 80,
      avg_power_watts: 190,
      avg_hr_bpm: 145,
      tss: 110,
    },
  ];

  it("filtra actividades dentro del rango de la semana", () => {
    const kpis = calculateWeeklyKPIs(activities, weekStart, weekEnd);
    expect(kpis.activityCount).toBe(2);
  });

  it("suma distancia correctamente", () => {
    const kpis = calculateWeeklyKPIs(activities, weekStart, weekEnd);
    expect(kpis.distanceKm).toBe(80);
  });

  it("suma duración correctamente", () => {
    const kpis = calculateWeeklyKPIs(activities, weekStart, weekEnd);
    expect(kpis.durationSeconds).toBe(9000);
  });

  it("calcula promedio de potencia", () => {
    const kpis = calculateWeeklyKPIs(activities, weekStart, weekEnd);
    expect(kpis.avgPower).toBe(190); // (200+180)/2
  });

  it("calcula promedio de FC", () => {
    const kpis = calculateWeeklyKPIs(activities, weekStart, weekEnd);
    expect(kpis.avgHR).toBe(145); // (150+140)/2
  });

  it("devuelve null para potencia si ninguna actividad tiene datos", () => {
    const nopower = [
      {
        date: "2026-02-16",
        duration_seconds: 3600,
        distance_km: 30,
        avg_power_watts: null,
        avg_hr_bpm: 150,
        tss: null,
      },
    ];
    const kpis = calculateWeeklyKPIs(nopower, weekStart, weekEnd);
    expect(kpis.avgPower).toBeNull();
  });

  it("maneja actividades con distance_km null", () => {
    const nullDist = [
      {
        date: "2026-02-16",
        duration_seconds: 3600,
        distance_km: null,
        avg_power_watts: 200,
        avg_hr_bpm: 150,
        tss: 80,
      },
    ];
    const kpis = calculateWeeklyKPIs(nullDist, weekStart, weekEnd);
    expect(kpis.distanceKm).toBe(0);
  });

  it("incluye actividades del domingo de la semana", () => {
    const sundayAct = [
      {
        date: "2026-02-22",
        duration_seconds: 3600,
        distance_km: 30,
        avg_power_watts: 200,
        avg_hr_bpm: 150,
        tss: 80,
      },
    ];
    const kpis = calculateWeeklyKPIs(sundayAct, weekStart, weekEnd);
    expect(kpis.activityCount).toBe(1);
  });
});

describe("calculateTrends", () => {
  it("calcula tendencia alcista de distancia", () => {
    const current = { distanceKm: 100, durationSeconds: 3600, avgPower: 200, avgHR: 150, activityCount: 3 };
    const previous = { distanceKm: 80, durationSeconds: 3000, avgPower: 180, avgHR: 160, activityCount: 2 };
    const trends = calculateTrends(current, previous);
    expect(trends.distance?.direction).toBe("up");
    expect(trends.distance?.percentage).toBe(25);
  });

  it("invierte dirección para FC (bajar es positivo)", () => {
    const current = { distanceKm: 100, durationSeconds: 3600, avgPower: 200, avgHR: 140, activityCount: 3 };
    const previous = { distanceKm: 100, durationSeconds: 3600, avgPower: 200, avgHR: 160, activityCount: 3 };
    const trends = calculateTrends(current, previous);
    // FC bajó de 160 a 140, eso es positivo → direction = "up"
    expect(trends.hr?.direction).toBe("up");
  });

  it("devuelve null si semana anterior es 0", () => {
    const current = { distanceKm: 100, durationSeconds: 3600, avgPower: 200, avgHR: 150, activityCount: 3 };
    const previous = { distanceKm: 0, durationSeconds: 0, avgPower: null, avgHR: null, activityCount: 0 };
    const trends = calculateTrends(current, previous);
    expect(trends.distance).toBeNull();
    expect(trends.power).toBeNull();
  });
});

describe("calculateWeeklyTrend", () => {
  it("agrupa actividades por semana y calcula promedios", () => {
    const activities = [
      { date: "2026-02-16", duration_seconds: 3600, distance_km: 30, avg_power_watts: 200, avg_hr_bpm: 150, tss: 80 },
      { date: "2026-02-17", duration_seconds: 3600, distance_km: 30, avg_power_watts: 180, avg_hr_bpm: 140, tss: 70 },
      { date: "2026-02-09", duration_seconds: 3600, distance_km: 30, avg_power_watts: 190, avg_hr_bpm: 145, tss: 75 },
    ];
    const result = calculateWeeklyTrend(activities);
    expect(result).toHaveLength(2);
    expect(result[0].week).toBe("Sem 1"); // semana anterior
    expect(result[1].week).toBe("Sem 2"); // semana actual
  });

  it("maneja actividades sin potencia", () => {
    const activities = [
      { date: "2026-02-16", duration_seconds: 3600, distance_km: 30, avg_power_watts: null, avg_hr_bpm: 150, tss: null },
    ];
    const result = calculateWeeklyTrend(activities);
    expect(result[0].power).toBe(0);
    expect(result[0].hr).toBe(150);
  });

  it("ordena correctamente entre años (semana 52 antes de semana 1)", () => {
    const activities = [
      { date: "2025-12-28", duration_seconds: 3600, distance_km: 30, avg_power_watts: 200, avg_hr_bpm: 150, tss: 80 },
      { date: "2026-01-05", duration_seconds: 3600, distance_km: 30, avg_power_watts: 190, avg_hr_bpm: 145, tss: 75 },
    ];
    const result = calculateWeeklyTrend(activities);
    expect(result).toHaveLength(2);
    // Semana 52 de 2025 debe ir antes de semana 2 de 2026
    expect(result[0].power).toBe(200); // dic 28
    expect(result[1].power).toBe(190); // ene 5
  });
});

describe("calculateDailyLoad", () => {
  const weekStart = utc("2026-02-16");

  it("distribuye TSS por día de la semana", () => {
    const activities = [
      { date: "2026-02-16", duration_seconds: 3600, distance_km: 30, avg_power_watts: 200, avg_hr_bpm: 150, tss: 80 },
      { date: "2026-02-18", duration_seconds: 5400, distance_km: 50, avg_power_watts: 180, avg_hr_bpm: 140, tss: 90 },
    ];
    const result = calculateDailyLoad(activities, weekStart);
    expect(result[0]).toEqual({ day: "L", load: 80 }); // Lunes
    expect(result[2]).toEqual({ day: "X", load: 90 }); // Miércoles
    expect(result[1]).toEqual({ day: "M", load: 0 }); // Martes sin actividad
  });

  it("ignora actividades fuera de la semana", () => {
    const activities = [
      { date: "2026-02-15", duration_seconds: 7200, distance_km: 80, avg_power_watts: 190, avg_hr_bpm: 145, tss: 110 },
    ];
    const result = calculateDailyLoad(activities, weekStart);
    expect(result.every((d) => d.load === 0)).toBe(true);
  });

  it("trata tss null como 0", () => {
    const activities = [
      { date: "2026-02-16", duration_seconds: 3600, distance_km: 30, avg_power_watts: null, avg_hr_bpm: 150, tss: null },
    ];
    const result = calculateDailyLoad(activities, weekStart);
    expect(result[0].load).toBe(0);
  });

  it("suma TSS de múltiples actividades en el mismo día", () => {
    const activities = [
      { date: "2026-02-16", duration_seconds: 3600, distance_km: 30, avg_power_watts: 200, avg_hr_bpm: 150, tss: 80 },
      { date: "2026-02-16", duration_seconds: 1800, distance_km: 15, avg_power_watts: 210, avg_hr_bpm: 155, tss: 40 },
    ];
    const result = calculateDailyLoad(activities, weekStart);
    expect(result[0].load).toBe(120);
  });

  it("asigna domingo correctamente (índice 6)", () => {
    const activities = [
      { date: "2026-02-22", duration_seconds: 3600, distance_km: 30, avg_power_watts: 200, avg_hr_bpm: 150, tss: 100 },
    ];
    const result = calculateDailyLoad(activities, weekStart);
    expect(result[6]).toEqual({ day: "D", load: 100 });
  });
});

describe("formatDuration", () => {
  it("formatea minutos sin horas", () => {
    expect(formatDuration(2700)).toBe("45m");
  });

  it("formatea horas y minutos", () => {
    expect(formatDuration(5400)).toBe("1h 30m");
  });

  it("formatea horas con minutos con pad", () => {
    expect(formatDuration(3660)).toBe("1h 01m");
  });

  it("formatea 0 segundos", () => {
    expect(formatDuration(0)).toBe("0m");
  });

  it("formatea horas exactas", () => {
    expect(formatDuration(7200)).toBe("2h 00m");
  });
});

describe("detectOverload", () => {
  it("devuelve null sin actividades", () => {
    expect(detectOverload([])).toBeNull();
  });

  it("devuelve null si carga actual es 0", () => {
    // Solo actividades antiguas, nada esta semana
    const activities = [
      { date: "2025-01-01", duration_seconds: 3600, distance_km: 30, avg_power_watts: 200, avg_hr_bpm: 150, tss: 80 },
    ];
    expect(detectOverload(activities)).toBeNull();
  });
});
