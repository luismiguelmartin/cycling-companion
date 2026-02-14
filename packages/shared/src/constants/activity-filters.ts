export const ACTIVITY_FILTERS = {
  all: { label: "Todas", type: null },
  intervals: { label: "Intervalos", type: "intervals" },
  endurance: { label: "Resistencia", type: "endurance" },
  recovery: { label: "Recuperación", type: "recovery" },
  tempo: { label: "Tempo", type: "tempo" },
} as const;

export type ActivityFilterKey = keyof typeof ACTIVITY_FILTERS;
