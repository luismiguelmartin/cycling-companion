"use client";

import { useState } from "react";
import { Zap, Droplets, Sun, Moon, Loader2 } from "lucide-react";
import { apiClientPost } from "@/lib/api/client";

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
  activityId: string;
}

interface AnalyzeResponse {
  data: {
    summary: string;
    recommendation: string;
    tips?: {
      hydration?: string;
      nutrition?: string;
      sleep?: string;
    };
  };
}

export function AIAnalysisCard({ analysis: initialAnalysis, activityId }: AIAnalysisCardProps) {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(initialAnalysis);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClientPost<AnalyzeResponse>("/ai/analyze-activity", {
        activity_id: activityId,
      });
      setAnalysis({
        summary: res.data.summary,
        recommendation: res.data.recommendation,
        tips: res.data.tips ?? {},
      });
    } catch {
      setError("No se pudo generar el análisis. Inténtalo más tarde.");
    } finally {
      setLoading(false);
    }
  }

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
        <div className="space-y-3">
          <p className="text-[13px] text-[var(--text-muted)]">
            Genera un análisis inteligente de esta actividad con recomendaciones personalizadas.
          </p>
          {error && <p className="text-[12px] text-red-500">{error}</p>}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium text-white transition-opacity disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Analizando...
              </>
            ) : (
              <>
                <Zap className="h-3.5 w-3.5" />
                Generar análisis
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
