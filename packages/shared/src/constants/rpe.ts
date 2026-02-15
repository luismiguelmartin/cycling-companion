export const MAX_RPE = 10;

export const RPE_DESCRIPTIONS: Record<number, string> = {
  1: "Reposo total",
  2: "Muy ligero, apenas esfuerzo",
  3: "Ligero, respiración cómoda",
  4: "Moderado-ligero, conversación fácil",
  5: "Moderado, respiración más notable",
  6: "Moderado-alto, conversación difícil",
  7: "Alto, esfuerzo sostenido",
  8: "Muy alto, difícil mantener el ritmo",
  9: "Máximo, al límite",
  10: "Esfuerzo total, sprint máximo",
};

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
