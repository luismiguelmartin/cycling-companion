"use client";

import { useEffect, useState } from "react";
import { apiClientFetch } from "@/lib/api/client";
import { AICoachCard } from "./ai-coach-card";
import { AICoachCardSkeleton } from "./ai-coach-card-skeleton";

interface CoachTipResponse {
  data: {
    recommendation: string;
    tips?: {
      hydration?: string;
      sleep?: string;
      nutrition?: string;
    };
  };
}

interface AICoachCardClientProps {
  fallbackRecommendation: string;
  fallbackTips?: {
    hydration?: string;
    sleep?: string;
    nutrition?: string;
  };
}

export function AICoachCardClient({
  fallbackRecommendation,
  fallbackTips,
}: AICoachCardClientProps) {
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [tips, setTips] = useState<AICoachCardClientProps["fallbackTips"] | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClientFetch<CoachTipResponse>("/ai/coach-tip")
      .then((res) => {
        setRecommendation(res.data.recommendation);
        setTips(res.data.tips);
      })
      .catch(() => {
        setRecommendation(fallbackRecommendation);
        setTips(fallbackTips);
      })
      .finally(() => setLoading(false));
  }, [fallbackRecommendation, fallbackTips]);

  if (loading) {
    return <AICoachCardSkeleton />;
  }

  return <AICoachCard recommendation={recommendation ?? fallbackRecommendation} tips={tips} />;
}
