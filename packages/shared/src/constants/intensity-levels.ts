export const INTENSITY_LEVELS = {
  alta: { color: "#ef4444", label: "Alta" },
  "media-alta": { color: "#f97316", label: "Media-alta" },
  media: { color: "#eab308", label: "Media" },
  baja: { color: "#22c55e", label: "Baja" },
  "—": { color: "#64748b", label: "—" },
} as const;

export type IntensityLevel = keyof typeof INTENSITY_LEVELS;
