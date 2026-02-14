interface ActivityMetricRow {
  timestamp_seconds: number;
  power_watts: number | null;
  hr_bpm: number | null;
  cadence_rpm: number | null;
}

interface ChartDataPoint {
  min: number;
  power: number;
  hr: number;
  cadence: number;
}

export function transformTimeSeries(metrics: ActivityMetricRow[]): ChartDataPoint[] {
  return metrics.map((m) => ({
    min: Math.round(m.timestamp_seconds / 60),
    power: m.power_watts ?? 0,
    hr: m.hr_bpm ?? 0,
    cadence: m.cadence_rpm ?? 0,
  }));
}
