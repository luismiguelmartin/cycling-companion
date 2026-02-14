import { Zap, Droplets, Sun, Moon } from "lucide-react";

interface AIAnalysis {
  summary: string;
  recommendation: string;
  tips: {
    hydration?: string;
    nutrition?: string;
    sleep?: string;
  };
}

interface AIAnalysisCardProps {
  analysis: AIAnalysis | null;
}

export function AIAnalysisCard({ analysis }: AIAnalysisCardProps) {
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
        <span className="text-xs font-bold uppercase text-[var(--accent)]">Análisis IA</span>
      </div>

      {analysis ? (
        <>
          {/* Analysis text */}
          <div className="space-y-2 text-[13px] leading-[1.7] text-[var(--text-secondary)]">
            <p>{analysis.summary}</p>
            <p>{analysis.recommendation}</p>
          </div>

          {/* Tips */}
          {(analysis.tips.hydration || analysis.tips.nutrition || analysis.tips.sleep) && (
            <div
              className="mt-3 flex flex-wrap gap-2 pt-2.5 md:gap-3.5"
              style={{ borderTop: "1px solid rgba(249,115,22,0.12)" }}
            >
              {analysis.tips.hydration && (
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
                  <Droplets className="h-3 w-3" style={{ color: "#3b82f6" }} />
                  {analysis.tips.hydration}
                </div>
              )}
              {analysis.tips.nutrition && (
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
                  <Sun className="h-3 w-3" style={{ color: "#eab308" }} />
                  {analysis.tips.nutrition}
                </div>
              )}
              {analysis.tips.sleep && (
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
                  <Moon className="h-3 w-3" style={{ color: "#8b5cf6" }} />
                  {analysis.tips.sleep}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <p className="text-[13px] text-[var(--text-muted)]">
          El análisis IA se generará automáticamente cuando esté disponible.
        </p>
      )}
    </div>
  );
}
