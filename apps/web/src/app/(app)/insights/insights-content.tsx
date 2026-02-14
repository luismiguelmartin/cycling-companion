"use client";

import { ArrowRight } from "lucide-react";
import { ComparisonMetricCard } from "@/components/comparison-metric-card";
import { PerformanceRadarChart } from "@/components/charts/performance-radar-chart";
import { AIInsightsCard } from "@/components/ai-insights-card";
import type {
  ComparisonMetric,
  RadarDimension,
  InsightsAnalysis,
} from "@/lib/insights/calculations";
import type { PeriodRange } from "@/lib/insights/periods";

interface InsightsContentProps {
  periodA: PeriodRange;
  periodB: PeriodRange;
  comparisonMetrics: ComparisonMetric[];
  radarDimensions: RadarDimension[];
  analysis: InsightsAnalysis | null;
  isEmpty: boolean;
}

export function InsightsContent({
  periodA,
  periodB,
  comparisonMetrics,
  radarDimensions,
  analysis,
  isEmpty,
}: InsightsContentProps) {
  if (isEmpty) {
    return (
      <div>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[22px] font-bold text-[var(--text-primary)] md:text-[26px]">
            Comparar periodos
          </h1>
          <p className="mt-1 text-[13px] text-[var(--text-muted)]">
            Analiza tu progresion entre semanas
          </p>
        </div>

        {/* Empty state */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] px-6 py-12 text-center">
          <p className="text-[15px] font-semibold text-[var(--text-primary)]">
            Necesitas al menos 2 semanas de datos para comparar periodos.
          </p>
          <p className="mt-2 text-[13px] text-[var(--text-muted)]">
            Sigue entrenando y podras ver tu progresion aqui.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-[var(--text-primary)] md:text-[26px]">
          Comparar periodos
        </h1>
        <p className="mt-1 text-[13px] text-[var(--text-muted)]">
          Analiza tu progresion entre semanas
        </p>
      </div>

      {/* Period selectors */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {/* Period A badge */}
        <div className="flex items-center gap-2.5 rounded-[10px] border border-blue-500/25 bg-blue-500/[0.08] px-3.5 py-2">
          <div className="h-2.5 w-2.5 rounded-sm bg-blue-500" />
          <div>
            <p className="text-[10px] text-[var(--text-muted)]">Periodo A</p>
            <p className="text-[13px] font-semibold text-[var(--text-primary)]">{periodA.label}</p>
          </div>
        </div>

        {/* Arrow */}
        <ArrowRight className="h-4 w-4 text-[var(--text-muted)]" />

        {/* Period B badge */}
        <div className="flex items-center gap-2.5 rounded-[10px] border border-orange-500/25 bg-orange-500/[0.08] px-3.5 py-2">
          <div className="h-2.5 w-2.5 rounded-sm bg-orange-500" />
          <div>
            <p className="text-[10px] text-[var(--text-muted)]">Periodo B</p>
            <p className="text-[13px] font-semibold text-[var(--text-primary)]">{periodB.label}</p>
          </div>
        </div>
      </div>

      {/* Comparison metric cards grid */}
      <div className="mb-6 grid grid-cols-2 gap-2.5 md:grid-cols-3">
        {comparisonMetrics.map((m) => (
          <ComparisonMetricCard
            key={m.metric}
            metric={m.metric}
            valueA={m.valueA}
            valueB={m.valueB}
            unit={m.unit}
            color={m.color}
            inverse={m.inverse}
          />
        ))}
      </div>

      {/* Radar chart */}
      <div className="mb-6">
        <PerformanceRadarChart data={radarDimensions} />
      </div>

      {/* AI Insights card */}
      <div>
        <AIInsightsCard analysis={analysis} />
      </div>
    </div>
  );
}
