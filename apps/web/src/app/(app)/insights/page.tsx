import { apiGet, getServerToken } from "@/lib/api/server";
import { getDefaultPeriods } from "@/lib/insights/periods";
import type { ComparisonMetric, RadarDimension, InsightsAnalysis } from "shared";
import { InsightsContent } from "./insights-content";

interface InsightsResponse {
  data: {
    comparison: ComparisonMetric[];
    radar: RadarDimension[];
    analysis: InsightsAnalysis | null;
  };
}

export default async function InsightsPage() {
  const token = await getServerToken();
  if (!token) return null;

  const { periodA, periodB } = getDefaultPeriods();

  const res = await apiGet<InsightsResponse>(
    `/insights?period_a_start=${periodA.start}&period_a_end=${periodA.end}&period_b_start=${periodB.start}&period_b_end=${periodB.end}`,
    token,
  );

  const { comparison, radar, analysis } = res.data;
  const isEmpty = comparison.every((m) => m.valueA === 0 && m.valueB === 0);

  return (
    <InsightsContent
      periodA={periodA}
      periodB={periodB}
      comparisonMetrics={comparison}
      radarDimensions={radar}
      analysis={analysis}
      isEmpty={isEmpty}
    />
  );
}
