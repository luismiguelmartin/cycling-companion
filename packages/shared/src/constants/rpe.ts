export const RPE_COLORS = {
  low: { range: [1, 3], color: "#22c55e", label: "Bajo" },
  moderate: { range: [4, 6], color: "#eab308", label: "Moderado" },
  high: { range: [7, 8], color: "#f97316", label: "Alto" },
  max: { range: [9, 10], color: "#ef4444", label: "Máximo" },
} as const;

export function getRPEColor(value: number): string {
  if (value <= 3) return RPE_COLORS.low.color;
  if (value <= 6) return RPE_COLORS.moderate.color;
  if (value <= 8) return RPE_COLORS.high.color;
  return RPE_COLORS.max.color;
}
