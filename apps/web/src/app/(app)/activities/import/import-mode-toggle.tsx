"use client";

import { Upload, Edit3 } from "lucide-react";

interface ImportModeToggleProps {
  mode: "file" | "manual";
  onModeChange: (mode: "file" | "manual") => void;
}

const MODES = [
  { key: "file" as const, icon: Upload, label: "Archivo .fit/.gpx" },
  { key: "manual" as const, icon: Edit3, label: "Manual" },
];

export function ImportModeToggle({ mode, onModeChange }: ImportModeToggleProps) {
  return (
    <div className="mb-5 inline-flex gap-1 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] p-1">
      {MODES.map((m) => {
        const isActive = mode === m.key;
        return (
          <button
            key={m.key}
            type="button"
            onClick={() => onModeChange(m.key)}
            className={`flex items-center gap-[7px] rounded-[9px] border px-3.5 py-2 text-[13px] transition-all duration-150 md:px-[18px] md:py-[9px] ${
              isActive
                ? "border-orange-500/30 bg-[var(--active-nav-bg)] font-semibold text-[var(--accent)]"
                : "border-transparent bg-transparent font-normal text-[var(--text-secondary)]"
            }`}
          >
            <m.icon className="h-[15px] w-[15px]" />
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
