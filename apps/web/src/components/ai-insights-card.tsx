import { Zap } from "lucide-react";

interface AIInsightsCardProps {
  analysis: {
    summary: string;
    alert?: string;
    recommendation: string;
  } | null;
}

export function AIInsightsCard({ analysis }: AIInsightsCardProps) {
  return (
    <div className="rounded-[14px] border border-[var(--ai-border)] bg-[var(--ai-bg)] p-3.5 md:p-5">
      {/* Badge */}
      <div className="mb-3 flex items-center gap-2">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}
        >
          <Zap className="h-[13px] w-[13px] text-white" />
        </div>
        <span className="text-xs font-bold uppercase text-[var(--accent)]">Analisis IA</span>
      </div>

      {analysis ? (
        <div className="space-y-2 text-[13px] leading-[1.7] text-[var(--text-secondary)]">
          <p>{analysis.summary}</p>
          {analysis.alert && <p className="font-medium text-amber-500">{analysis.alert}</p>}
          <p>{analysis.recommendation}</p>
        </div>
      ) : (
        <p className="text-[13px] text-[var(--text-muted)]">
          El analisis comparativo se generara cuando haya datos suficientes.
        </p>
      )}
    </div>
  );
}
