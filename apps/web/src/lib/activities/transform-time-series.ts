interface ActivityMetricRow {
  timestamp_seconds: number;
  power_watts: number | null;
  hr_bpm: number | null;
  cadence_rpm: number | null;
  speed_kmh: number | null;
}

interface ChartDataPoint {
  km: number;
  power: number;
  hr: number;
  cadence: number;
}

export function transformTimeSeries(metrics: ActivityMetricRow[]): ChartDataPoint[] {
  let cumulativeKm = 0;
  return metrics.map((m, i) => {
    if (i > 0 && m.speed_kmh) {
      const dtHours = (m.timestamp_seconds - metrics[i - 1].timestamp_seconds) / 3600;
      cumulativeKm += m.speed_kmh * dtHours;
    }
    return {
      km: Math.round(cumulativeKm * 10) / 10,
      power: m.power_watts ?? 0,
      hr: m.hr_bpm ?? 0,
      cadence: m.cadence_rpm ?? 0,
    };
  });
}
