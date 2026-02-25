import { describe, it, expect } from "vitest";
import { mapStravaToActivity, isStravaCyclingActivity } from "./strava-mapper.service.js";
import type { StravaDetailedActivity, StravaStreams } from "./types.js";

const BASE_ACTIVITY: StravaDetailedActivity = {
  id: 1234567890,
  name: "Ruta por la sierra",
  sport_type: "Ride",
  type: "Ride",
  distance: 45230.5,
  moving_time: 5400,
  elapsed_time: 6000,
  total_elevation_gain: 850,
  start_date: "2026-02-25T08:00:00Z",
  start_date_local: "2026-02-25T09:00:00+01:00",
  average_speed: 8.38,
  max_speed: 15.2,
  average_heartrate: 142.3,
  max_heartrate: 178,
  average_watts: 185.7,
  weighted_average_watts: 195,
  max_watts: 450,
  average_cadence: 82.4,
  kilojoules: 999,
  has_heartrate: true,
  device_watts: true,
  trainer: false,
  device_name: "Garmin Edge 540",
};

const BASE_STREAMS: StravaStreams = {
  time: { data: [0, 1, 2, 3, 4] },
  latlng: {
    data: [
      [40.4168, -3.7038],
      [40.4169, -3.7037],
      [40.417, -3.7036],
      [40.4171, -3.7035],
      [40.4172, -3.7034],
    ],
  },
  altitude: { data: [680, 681, 682, 683, 684] },
  heartrate: { data: [120, 125, 130, 135, 140] },
  watts: { data: [150, 180, 200, 190, 175] },
  cadence: { data: [80, 82, 85, 83, 78] },
  velocity_smooth: { data: [8.33, 8.5, 8.7, 8.6, 8.3] },
  distance: { data: [0, 8.5, 17.2, 25.8, 34.1] },
};

describe("isStravaCyclingActivity", () => {
  it("retorna true para Ride", () => {
    expect(isStravaCyclingActivity("Ride")).toBe(true);
  });

  it("retorna true para MountainBikeRide", () => {
    expect(isStravaCyclingActivity("MountainBikeRide")).toBe(true);
  });

  it("retorna true para VirtualRide", () => {
    expect(isStravaCyclingActivity("VirtualRide")).toBe(true);
  });

  it("retorna true para GravelRide", () => {
    expect(isStravaCyclingActivity("GravelRide")).toBe(true);
  });

  it("retorna true para EBikeRide", () => {
    expect(isStravaCyclingActivity("EBikeRide")).toBe(true);
  });

  it("retorna true para Velodrome", () => {
    expect(isStravaCyclingActivity("Velodrome")).toBe(true);
  });

  it("retorna false para Run", () => {
    expect(isStravaCyclingActivity("Run")).toBe(false);
  });

  it("retorna false para Swim", () => {
    expect(isStravaCyclingActivity("Swim")).toBe(false);
  });

  it("retorna false para Walk", () => {
    expect(isStravaCyclingActivity("Walk")).toBe(false);
  });

  it("retorna false para string vacío", () => {
    expect(isStravaCyclingActivity("")).toBe(false);
  });
});

describe("mapStravaToActivity", () => {
  describe("actividad completa con streams", () => {
    it("mapea todos los campos correctamente", () => {
      const result = mapStravaToActivity(BASE_ACTIVITY, BASE_STREAMS);

      expect(result.activityData.name).toBe("Ruta por la sierra");
      expect(result.activityData.date).toBe("2026-02-25");
      expect(result.activityData.type).toBe("endurance");
      expect(result.activityData.duration_seconds).toBe(5400);
      expect(result.activityData.distance_km).toBe(45.23);
      expect(result.activityData.avg_power_watts).toBe(186);
      expect(result.activityData.avg_hr_bpm).toBe(142);
      expect(result.activityData.max_hr_bpm).toBe(178);
      expect(result.activityData.avg_cadence_rpm).toBe(82);
      expect(result.activityData.strava_id).toBe(1234567890);
      expect(result.activityData.source).toBe("strava");
    });

    it("genera trackPoints correctos", () => {
      const result = mapStravaToActivity(BASE_ACTIVITY, BASE_STREAMS);

      expect(result.trackPoints).toHaveLength(5);
      expect(result.trackPoints[0].lat).toBe(40.4168);
      expect(result.trackPoints[0].lon).toBe(-3.7038);
      expect(result.trackPoints[0].elevation).toBe(680);
      expect(result.trackPoints[0].power).toBe(150);
      expect(result.trackPoints[0].hr).toBe(120);
      expect(result.trackPoints[0].cadence).toBe(80);
    });

    it("calcula timestamps de trackPoints correctamente", () => {
      const result = mapStravaToActivity(BASE_ACTIVITY, BASE_STREAMS);
      const startEpoch = new Date("2026-02-25T08:00:00Z").getTime();

      expect(result.trackPoints[0].timestamp).toBe(startEpoch);
      expect(result.trackPoints[1].timestamp).toBe(startEpoch + 1000);
      expect(result.trackPoints[4].timestamp).toBe(startEpoch + 4000);
    });

    it("genera metrics correctos", () => {
      const result = mapStravaToActivity(BASE_ACTIVITY, BASE_STREAMS);

      expect(result.metrics).toHaveLength(5);
      expect(result.metrics[0].timestampSeconds).toBe(0);
      expect(result.metrics[0].powerWatts).toBe(150);
      expect(result.metrics[0].hrBpm).toBe(120);
      expect(result.metrics[0].cadenceRpm).toBe(80);
    });

    it("convierte velocidad de m/s a km/h", () => {
      const result = mapStravaToActivity(BASE_ACTIVITY, BASE_STREAMS);

      // 8.33 m/s * 3.6 = 29.988 → 29.99
      expect(result.metrics[0].speedKmh).toBe(29.99);
    });
  });

  describe("actividad sin streams", () => {
    it("retorna arrays vacíos con streams null", () => {
      const result = mapStravaToActivity(BASE_ACTIVITY, null);

      expect(result.activityData.name).toBe("Ruta por la sierra");
      expect(result.trackPoints).toEqual([]);
      expect(result.metrics).toEqual([]);
    });

    it("retorna arrays vacíos con streams vacíos", () => {
      const result = mapStravaToActivity(BASE_ACTIVITY, {});

      expect(result.trackPoints).toEqual([]);
      expect(result.metrics).toEqual([]);
    });

    it("retorna arrays vacíos con time.data vacío", () => {
      const result = mapStravaToActivity(BASE_ACTIVITY, { time: { data: [] } });

      expect(result.trackPoints).toEqual([]);
      expect(result.metrics).toEqual([]);
    });
  });

  describe("actividad sin potencia", () => {
    it("mapea avg_power_watts como null", () => {
      const noPowerActivity = { ...BASE_ACTIVITY, average_watts: undefined };
      const result = mapStravaToActivity(noPowerActivity, null);

      expect(result.activityData.avg_power_watts).toBeNull();
    });
  });

  describe("actividad sin HR", () => {
    it("mapea HR como null", () => {
      const noHrActivity = {
        ...BASE_ACTIVITY,
        has_heartrate: false,
        average_heartrate: undefined,
        max_heartrate: undefined,
      };
      const result = mapStravaToActivity(noHrActivity, null);

      expect(result.activityData.avg_hr_bpm).toBeNull();
      expect(result.activityData.max_hr_bpm).toBeNull();
    });
  });

  describe("actividad sin cadencia", () => {
    it("mapea cadencia como null", () => {
      const noCadenceActivity = { ...BASE_ACTIVITY, average_cadence: undefined };
      const result = mapStravaToActivity(noCadenceActivity, null);

      expect(result.activityData.avg_cadence_rpm).toBeNull();
    });
  });

  describe("conversión de distancia", () => {
    it("convierte metros a km con 2 decimales", () => {
      const result = mapStravaToActivity(BASE_ACTIVITY, null);
      // 45230.5 m / 1000 = 45.2305 → 45.23
      expect(result.activityData.distance_km).toBe(45.23);
    });

    it("retorna null si distancia es 0", () => {
      const zeroDistance = { ...BASE_ACTIVITY, distance: 0 };
      const result = mapStravaToActivity(zeroDistance, null);
      expect(result.activityData.distance_km).toBeNull();
    });
  });

  describe("mapeo de sport_type", () => {
    it("mapea Ride a endurance", () => {
      const result = mapStravaToActivity({ ...BASE_ACTIVITY, sport_type: "Ride" }, null);
      expect(result.activityData.type).toBe("endurance");
    });

    it("mapea VirtualRide a endurance", () => {
      const result = mapStravaToActivity({ ...BASE_ACTIVITY, sport_type: "VirtualRide" }, null);
      expect(result.activityData.type).toBe("endurance");
    });

    it("mapea Velodrome a intervals", () => {
      const result = mapStravaToActivity({ ...BASE_ACTIVITY, sport_type: "Velodrome" }, null);
      expect(result.activityData.type).toBe("intervals");
    });

    it("mapea sport_type desconocido a endurance (default)", () => {
      const result = mapStravaToActivity({ ...BASE_ACTIVITY, sport_type: "UnknownType" }, null);
      expect(result.activityData.type).toBe("endurance");
    });
  });

  describe("streams parciales", () => {
    it("maneja streams sin GPS (latlng)", () => {
      const noGpsStreams: StravaStreams = {
        time: { data: [0, 1, 2] },
        watts: { data: [150, 180, 200] },
        heartrate: { data: [120, 125, 130] },
      };
      const result = mapStravaToActivity(BASE_ACTIVITY, noGpsStreams);

      expect(result.trackPoints).toHaveLength(3);
      expect(result.trackPoints[0].lat).toBe(0);
      expect(result.trackPoints[0].lon).toBe(0);
      expect(result.trackPoints[0].power).toBe(150);
    });

    it("maneja streams sin potencia", () => {
      const noPowerStreams: StravaStreams = {
        time: { data: [0, 1] },
        heartrate: { data: [120, 125] },
        latlng: {
          data: [
            [40.41, -3.7],
            [40.42, -3.71],
          ],
        },
      };
      const result = mapStravaToActivity(BASE_ACTIVITY, noPowerStreams);

      expect(result.metrics[0].powerWatts).toBeNull();
      expect(result.metrics[0].hrBpm).toBe(120);
    });

    it("maneja streams sin velocidad", () => {
      const noSpeedStreams: StravaStreams = {
        time: { data: [0, 1] },
        watts: { data: [150, 180] },
      };
      const result = mapStravaToActivity(BASE_ACTIVITY, noSpeedStreams);

      expect(result.metrics[0].speedKmh).toBeNull();
    });
  });

  describe("extracción de fecha", () => {
    it("extrae fecha de start_date_local con timezone positivo", () => {
      const result = mapStravaToActivity(
        { ...BASE_ACTIVITY, start_date_local: "2026-02-25T09:00:00+01:00" },
        null,
      );
      expect(result.activityData.date).toBe("2026-02-25");
    });

    it("extrae fecha de start_date_local con timezone negativo", () => {
      const result = mapStravaToActivity(
        { ...BASE_ACTIVITY, start_date_local: "2026-03-15T07:30:00-05:00" },
        null,
      );
      expect(result.activityData.date).toBe("2026-03-15");
    });
  });

  describe("redondeo de valores", () => {
    it("redondea avg_power_watts", () => {
      const result = mapStravaToActivity({ ...BASE_ACTIVITY, average_watts: 185.7 }, null);
      expect(result.activityData.avg_power_watts).toBe(186);
    });

    it("redondea avg_hr_bpm", () => {
      const result = mapStravaToActivity({ ...BASE_ACTIVITY, average_heartrate: 142.3 }, null);
      expect(result.activityData.avg_hr_bpm).toBe(142);
    });

    it("redondea avg_cadence_rpm", () => {
      const result = mapStravaToActivity({ ...BASE_ACTIVITY, average_cadence: 82.4 }, null);
      expect(result.activityData.avg_cadence_rpm).toBe(82);
    });
  });
});
