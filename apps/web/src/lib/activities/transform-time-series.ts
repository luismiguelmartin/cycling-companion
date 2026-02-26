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

function isMoving(m: ActivityMetricRow): boolean {
  if (m.speed_kmh != null && Number(m.speed_kmh) > 0.5) return true;
  if ((m.power_watts ?? 0) > 0 || (m.cadence_rpm ?? 0) > 0) return true;
  return false;
}

export function transformTimeSeries(
  metrics: ActivityMetricRow[],
  totalDistanceKm?: number | null,
): ChartDataPoint[] {
  if (metrics.length === 0) return [];

  // Filter out stopped points (pauses)
  const moving = metrics.filter(isMoving);
  if (moving.length === 0) return [];

  // Try speed-based accumulation first
  let cumulativeKm = 0;
  let hasSpeed = false;
  const points = moving.map((m, i) => {
    const speed = m.speed_kmh != null ? Number(m.speed_kmh) : null;
    if (i > 0 && speed && speed > 0) {
      hasSpeed = true;
      const dtHours = (m.timestamp_seconds - moving[i - 1].timestamp_seconds) / 3600;
      cumulativeKm += speed * dtHours;
    }
    return {
      km: Math.round(cumulativeKm * 10) / 10,
      power: m.power_watts ?? 0,
      hr: m.hr_bpm ?? 0,
      cadence: m.cadence_rpm ?? 0,
    };
  });

  // If speed data produced valid distances, return as-is
  if (hasSpeed && cumulativeKm > 0) return points;

  // Fallback: distribute totalDistanceKm proportionally across timestamps
  if (totalDistanceKm && totalDistanceKm > 0) {
    const totalTime = moving[moving.length - 1].timestamp_seconds - moving[0].timestamp_seconds;
    if (totalTime > 0) {
      return moving.map((m) => {
        const elapsed = m.timestamp_seconds - moving[0].timestamp_seconds;
        const km = Math.round(((totalDistanceKm * elapsed) / totalTime) * 10) / 10;
        return {
          km,
          power: m.power_watts ?? 0,
          hr: m.hr_bpm ?? 0,
          cadence: m.cadence_rpm ?? 0,
        };
      });
    }
  }

  return points;
}
