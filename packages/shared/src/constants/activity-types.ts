export const ACTIVITY_TYPES = {
  intervals: { label: "Intervalos", color: "#ef4444", bg: "rgba(239,68,68,0.1)", emoji: "🔴" },
  endurance: { label: "Resistencia", color: "#22c55e", bg: "rgba(34,197,94,0.1)", emoji: "🟢" },
  recovery: { label: "Recuperación", color: "#3b82f6", bg: "rgba(59,130,246,0.1)", emoji: "🔵" },
  tempo: { label: "Tempo", color: "#f97316", bg: "rgba(249,115,22,0.1)", emoji: "🟠" },
  rest: { label: "Descanso", color: "#64748b", bg: "rgba(100,116,139,0.1)", emoji: "⚪" },
  outdoor: { label: "Exterior", color: "#22c55e", bg: "rgba(34,197,94,0.1)", emoji: "🟢" },
  indoor: { label: "Interior", color: "#8b5cf6", bg: "rgba(139,92,246,0.1)", emoji: "🟣" },
} as const;

export type ActivityTypeKey = keyof typeof ACTIVITY_TYPES;
