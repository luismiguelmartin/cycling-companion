import { Zap, Droplets, Moon, Sun } from "lucide-react";

interface AICoachCardProps {
  recommendation: string;
  tips?: {
    hydration?: string;
    sleep?: string;
    nutrition?: string;
  };
}

const TIP_CONFIG = [
  { key: "hydration" as const, icon: Droplets, color: "#3b82f6", label: "Hidratación" },
  { key: "sleep" as const, icon: Moon, color: "#8b5cf6", label: "Sueño" },
  { key: "nutrition" as const, icon: Sun, color: "#eab308", label: "Nutrición" },
];

export function AICoachCard({ recommendation, tips }: AICoachCardProps) {
  const activeTips = TIP_CONFIG.filter((t) => tips?.[t.key]);

  return (
    <div className="rounded-2xl border border-[var(--ai-border)] bg-[var(--ai-bg)] p-4 md:p-5">
      {/* Badge */}
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-orange-500 to-orange-600">
          <Zap className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-[12px] font-bold uppercase tracking-wider text-orange-500">
          Entrenador IA
        </span>
      </div>

      {/* Recommendation */}
      <p className="text-[13px] leading-[1.6] text-[var(--text-secondary)]">{recommendation}</p>

      {/* Tips */}
      {activeTips.length > 0 && (
        <>
          <div className="my-3 border-t border-orange-500/[0.12]" />
          <div className="flex flex-col gap-2">
            {activeTips.map((tip) => {
              const TipIcon = tip.icon;
              return (
                <div key={tip.key} className="flex items-center gap-2">
                  <TipIcon className="h-3.5 w-3.5 shrink-0" style={{ color: tip.color }} />
                  <span className="text-[12px] text-[var(--text-secondary)]">
                    <span className="font-medium text-[var(--text-primary)]">{tip.label}:</span>{" "}
                    {tips![tip.key]}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
