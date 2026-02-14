"use client";

import { Sun, Moon } from "lucide-react";

const VARIANTS = {
  nutrition: {
    bg: "rgba(234, 179, 8, 0.05)",
    border: "rgba(234, 179, 8, 0.15)",
    icon: Sun,
    title: "Nutrición",
    color: "#eab308",
  },
  rest: {
    bg: "rgba(139, 92, 246, 0.05)",
    border: "rgba(139, 92, 246, 0.15)",
    icon: Moon,
    title: "Descanso",
    color: "#8b5cf6",
  },
} as const;

interface TipCardProps {
  variant: "nutrition" | "rest";
  text: string;
}

export function TipCard({ variant, text }: TipCardProps) {
  const config = VARIANTS[variant];
  const Icon = config.icon;

  return (
    <div
      className="rounded-xl p-3.5"
      style={{
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
      }}
    >
      <div className="mb-1.5 flex items-center gap-2">
        <Icon className="h-3.5 w-3.5" style={{ color: config.color }} />
        <span className="text-[12px] font-semibold" style={{ color: config.color }}>
          {config.title}
        </span>
      </div>
      <p className="text-[12px] leading-relaxed text-[var(--text-secondary)]">{text}</p>
    </div>
  );
}
