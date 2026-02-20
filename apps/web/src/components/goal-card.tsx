"use client";

import { Check, Target, Heart, TrendingDown, Shield, type LucideIcon } from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Target,
  Heart,
  TrendingDown,
  Shield,
};

interface GoalCardProps {
  icon: string;
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
}

export function GoalCard({ icon, label, description, active, onClick }: GoalCardProps) {
  const IconComponent = ICON_MAP[icon];

  return (
    <button
      onClick={onClick}
      className={`flex w-full flex-col gap-1 rounded-xl p-4 text-left transition-all duration-200 ${
        active
          ? "border-2 border-orange-500 bg-orange-500/[0.12] dark:bg-orange-500/[0.12]"
          : "border border-[var(--input-border)] bg-[var(--input-bg)] hover:border-orange-500/40"
      }`}
      role="radio"
      aria-checked={active}
    >
      <div className="flex items-center gap-2">
        {IconComponent ? (
          <IconComponent
            className={`h-5 w-5 ${active ? "text-orange-500" : "text-[var(--text-muted)]"}`}
          />
        ) : (
          <span className="text-[22px]">{icon}</span>
        )}
        <span
          className={`flex-1 text-[15px] font-semibold ${
            active ? "text-orange-500" : "text-[var(--text-primary)]"
          }`}
        >
          {label}
        </span>
        {active && <Check className="h-4 w-4 text-orange-500" />}
      </div>
      <p className="pl-8 text-[12px] text-[var(--text-muted)]">{description}</p>
    </button>
  );
}
