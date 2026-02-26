import { describe, it, expect } from "vitest";
import { powerZoneDistribution, hrZoneDistribution } from "./zone-distribution.js";
import { POWER_ZONES, HR_ZONES } from "../constants/zones.js";
import type { TrackPoint } from "./types.js";

function makePoint(overrides: Partial<TrackPoint> = {}): TrackPoint {
  return {
    timestamp: Date.now(),
    lat: 40.0,
    lon: -3.0,
    elevation: null,
    power: null,
    hr: null,
    cadence: null,
    ...overrides,
  };
}

describe("powerZoneDistribution", () => {
  it("100% en Z2 cuando toda la potencia está en rango Z2", () => {
    const ftp = 200;
    // Z2: 0.56-0.75 FTP → 112-150W
    const points = Array.from({ length: 100 }, () => makePoint({ power: 130 }));

    const result = powerZoneDistribution(points, ftp, POWER_ZONES);

    expect(result).toHaveLength(POWER_ZONES.length);

    const z2 = result.find((z) => z.zone === "Z2");
    expect(z2?.percentage).toBe(100);
    expect(z2?.seconds).toBe(100);

    const otherZones = result.filter((z) => z.zone !== "Z2");
    for (const z of otherZones) {
      expect(z.seconds).toBe(0);
      expect(z.percentage).toBe(0);
    }
  });

  it("distribución mixta calcula múltiples zonas correctamente", () => {
    const ftp = 200;
    const points = [
      // 50 puntos en Z1 (< 0.56 FTP = < 112W)
      ...Array.from({ length: 50 }, () => makePoint({ power: 80 })),
      // 30 puntos en Z4 (0.91-1.05 FTP = 182-210W)
      ...Array.from({ length: 30 }, () => makePoint({ power: 195 })),
      // 20 puntos en Z5 (1.06-1.2 FTP = 212-240W)
      ...Array.from({ length: 20 }, () => makePoint({ power: 230 })),
    ];

    const result = powerZoneDistribution(points, ftp, POWER_ZONES);

    expect(result.find((z) => z.zone === "Z1")?.seconds).toBe(50);
    expect(result.find((z) => z.zone === "Z4")?.seconds).toBe(30);
    expect(result.find((z) => z.zone === "Z5")?.seconds).toBe(20);

    const totalPct = result.reduce((sum, z) => sum + z.percentage, 0);
    expect(totalPct).toBe(100);
  });

  it("retorna array vacío sin datos de potencia", () => {
    const points = Array.from({ length: 50 }, () => makePoint({ power: null }));
    const result = powerZoneDistribution(points, 200, POWER_ZONES);
    expect(result).toEqual([]);
  });

  it("retorna array vacío sin FTP", () => {
    const points = Array.from({ length: 50 }, () => makePoint({ power: 150 }));
    const result = powerZoneDistribution(points, null, POWER_ZONES);
    expect(result).toEqual([]);
  });

  it("retorna array vacío con FTP = 0", () => {
    const points = Array.from({ length: 50 }, () => makePoint({ power: 150 }));
    const result = powerZoneDistribution(points, 0, POWER_ZONES);
    expect(result).toEqual([]);
  });

  it("potencia muy alta cae en Z6", () => {
    const ftp = 200;
    // Z6: > 1.2 FTP = > 240W
    const points = Array.from({ length: 10 }, () => makePoint({ power: 400 }));

    const result = powerZoneDistribution(points, ftp, POWER_ZONES);
    const z6 = result.find((z) => z.zone === "Z6");
    expect(z6?.percentage).toBe(100);
  });
});

describe("hrZoneDistribution", () => {
  it("calcula zonas de FC correctamente", () => {
    const maxHr = 185;
    // Z3: 0.7-0.8 maxHr = 129.5-148 bpm
    const points = Array.from({ length: 60 }, () => makePoint({ hr: 140 }));

    const result = hrZoneDistribution(points, maxHr, HR_ZONES);

    expect(result).toHaveLength(HR_ZONES.length);
    const z3 = result.find((z) => z.zone === "Z3");
    expect(z3?.percentage).toBe(100);
    expect(z3?.seconds).toBe(60);
  });

  it("retorna array vacío sin datos de FC", () => {
    const points = Array.from({ length: 50 }, () => makePoint({ hr: null }));
    const result = hrZoneDistribution(points, 185, HR_ZONES);
    expect(result).toEqual([]);
  });

  it("retorna array vacío sin maxHr", () => {
    const points = Array.from({ length: 50 }, () => makePoint({ hr: 140 }));
    const result = hrZoneDistribution(points, null, HR_ZONES);
    expect(result).toEqual([]);
  });
});
