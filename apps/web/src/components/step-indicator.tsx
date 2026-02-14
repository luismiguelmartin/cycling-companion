"use client";

interface StepIndicatorProps {
  current: number;
  total: number;
}

export function StepIndicator({ current, total }: StepIndicatorProps) {
  return (
    <div
      className="flex items-center justify-center gap-1.5"
      role="progressbar"
      aria-label={`Paso ${current + 1} de ${total}`}
      aria-valuenow={current + 1}
      aria-valuemin={1}
      aria-valuemax={total}
    >
      {Array.from({ length: total }, (_, i) => {
        const isActive = i === current;
        const isCompleted = i < current;

        return (
          <div
            key={i}
            className={`h-2 rounded transition-all duration-300 ease-in-out ${
              isActive
                ? "w-8 bg-orange-500"
                : isCompleted
                  ? "w-2 bg-orange-500/50"
                  : "w-2 bg-slate-600/30"
            }`}
          />
        );
      })}
    </div>
  );
}
