"use client";

interface RPEInputProps {
  value: number;
  onChange: (value: number) => void;
}

const RPE_BAR_COLORS = [
  "",
  "#22c55e",
  "#22c55e",
  "#22c55e",
  "#84cc16",
  "#eab308",
  "#eab308",
  "#f97316",
  "#f97316",
  "#ef4444",
  "#ef4444",
];

const RPE_LABELS = [
  "",
  "Muy fácil",
  "Fácil",
  "Ligero",
  "Moderado",
  "Algo duro",
  "Duro",
  "Muy duro",
  "Intenso",
  "Máximo",
  "Límite absoluto",
];

export function RPEInput({ value, onChange }: RPEInputProps) {
  return (
    <div>
      <div className="mb-2 text-[12px] font-medium text-[var(--text-primary)]">
        Esfuerzo percibido (RPE)
      </div>
      <div
        className="mb-1.5 flex items-end gap-1"
        role="slider"
        aria-valuemin={1}
        aria-valuemax={10}
        aria-valuenow={value || undefined}
        aria-label="Esfuerzo percibido"
      >
        {Array.from({ length: 10 }, (_, i) => {
          const n = i + 1;
          const isActive = n <= value;
          return (
            <button
              key={n}
              type="button"
              className="flex flex-1 items-center justify-center rounded-[5px] border-none text-[10px] font-bold transition-all duration-150"
              style={{
                height: isActive ? 36 : 28,
                backgroundColor: isActive ? RPE_BAR_COLORS[n] : "var(--text-muted)",
                opacity: isActive ? 1 : 0.15,
                color: isActive ? "#ffffff" : "transparent",
                cursor: "pointer",
              }}
              onClick={() => onChange(n)}
            >
              {n}
            </button>
          );
        })}
      </div>
      {value > 0 && (
        <div className="text-[12px] font-medium" style={{ color: RPE_BAR_COLORS[value] }}>
          {value}/10 — {RPE_LABELS[value]}
        </div>
      )}
    </div>
  );
}
