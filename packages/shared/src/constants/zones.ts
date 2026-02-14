export interface ZoneDefinition {
  zone: string;
  name: string;
  minPct: number;
  maxPct: number;
  color: string;
}

export const POWER_ZONES: readonly ZoneDefinition[] = [
  { zone: "Z1", name: "Recuperación", minPct: 0, maxPct: 0.56, color: "#94a3b8" },
  { zone: "Z2", name: "Resistencia", minPct: 0.56, maxPct: 0.75, color: "#3b82f6" },
  { zone: "Z3", name: "Tempo", minPct: 0.76, maxPct: 0.9, color: "#22c55e" },
  { zone: "Z4", name: "Umbral", minPct: 0.91, maxPct: 1.05, color: "#f97316" },
  { zone: "Z5", name: "VO2máx", minPct: 1.06, maxPct: 1.2, color: "#ef4444" },
  { zone: "Z6", name: "Anaeróbico", minPct: 1.2, maxPct: Infinity, color: "#dc2626" },
];

export const HR_ZONES: readonly ZoneDefinition[] = [
  { zone: "Z1", name: "Recuperación", minPct: 0.5, maxPct: 0.6, color: "#94a3b8" },
  { zone: "Z2", name: "Resistencia", minPct: 0.6, maxPct: 0.7, color: "#3b82f6" },
  { zone: "Z3", name: "Tempo", minPct: 0.7, maxPct: 0.8, color: "#22c55e" },
  { zone: "Z4", name: "Umbral", minPct: 0.8, maxPct: 0.9, color: "#f97316" },
  { zone: "Z5", name: "VO2máx", minPct: 0.9, maxPct: 1.0, color: "#ef4444" },
];

export interface CalculatedZone extends ZoneDefinition {
  min: number;
  max: number;
  label: string;
}

export function calculateZones(
  zones: readonly ZoneDefinition[],
  referenceValue: number,
  unit: string = "W",
): CalculatedZone[] {
  return zones.map((z) => {
    const min = Math.round(referenceValue * z.minPct);
    const max = z.maxPct === Infinity ? Infinity : Math.round(referenceValue * z.maxPct);
    const label = max === Infinity ? `>${min}${unit}` : `${min}-${max}${unit}`;
    return { ...z, min, max, label };
  });
}
