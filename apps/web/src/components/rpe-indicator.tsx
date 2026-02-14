import { getRPEColor } from "shared";

interface RPEIndicatorProps {
  value: number | null;
}

export function RPEIndicator({ value }: RPEIndicatorProps) {
  const color = value != null ? getRPEColor(value) : undefined;

  return (
    <div
      className="flex items-end gap-[2px]"
      role="img"
      aria-label={value != null ? `RPE ${value} de 10` : "RPE no registrado"}
    >
      {Array.from({ length: 10 }, (_, i) => {
        const isActive = value != null && i < value;
        return (
          <div
            key={i}
            className="w-1 rounded-sm"
            style={{
              height: 12,
              backgroundColor: isActive ? color : "var(--text-muted)",
              opacity: isActive ? 1 : 0.2,
            }}
          />
        );
      })}
    </div>
  );
}
