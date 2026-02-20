"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { DEMO_SCREENS } from "@/lib/demo/screen-config";
import {
  DEMO_ACTIVITIES,
  DEMO_PLAN_DAYS,
  DEMO_INSIGHTS,
  DEMO_PROFILE,
} from "@/lib/demo/mock-data";
import { DemoOnboardingStep } from "./demo-onboarding-step";
import { DemoDashboard } from "./demo-dashboard";
import { DemoScreenWrapper } from "./demo-screen-wrapper";
import { ActivitiesContent } from "@/app/(app)/activities/activities-content";
import { PlanContent } from "@/app/(app)/plan/plan-content";
import { InsightsContent } from "@/app/(app)/insights/insights-content";
import { ProfileContent } from "@/app/(app)/profile/profile-content";

interface DemoModalProps {
  onClose: () => void;
}

export function DemoModal({ onClose }: DemoModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, DEMO_SCREENS.length - 1));
  }, []);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, goNext, goPrev]);

  const screen = DEMO_SCREENS[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === DEMO_SCREENS.length - 1;

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  function interceptLinks(e: React.MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.closest("a")) {
      e.preventDefault();
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      {/* Modal container */}
      <div className="relative flex h-[92vh] w-[96vw] max-w-6xl flex-col overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--page-bg)] shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--card-border)] bg-[var(--surface-bg)] px-5 py-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <span className="shrink-0 rounded-full bg-orange-500/15 px-2.5 py-0.5 text-[11px] font-bold text-orange-500">
                {currentIndex + 1}/{DEMO_SCREENS.length}
              </span>
              <h2 className="truncate text-[16px] font-bold text-[var(--text-primary)]">
                {screen.title}
              </h2>
            </div>
            <p className="mt-0.5 text-[12px] text-[var(--text-muted)]">{screen.description}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 shrink-0 rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]"
            aria-label="Cerrar demo"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden"
          onClick={interceptLinks}
        >
          <DemoSlide screenId={screen.id} />
        </div>

        {/* Footer navigation */}
        <div className="flex shrink-0 items-center justify-between border-t border-[var(--card-border)] bg-[var(--surface-bg)] px-5 py-3">
          {/* Prev button */}
          <button
            onClick={goPrev}
            disabled={isFirst}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--input-border)] px-4 py-2 text-[13px] font-medium text-[var(--text-secondary)] transition-all hover:bg-[var(--input-bg)] disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </button>

          {/* Dots */}
          <div className="flex items-center gap-1.5">
            {DEMO_SCREENS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`h-2 rounded-full transition-all ${
                  i === currentIndex
                    ? "w-6 bg-orange-500"
                    : "w-2 bg-[var(--text-muted)] opacity-30 hover:opacity-60"
                }`}
                aria-label={`Ir a pantalla ${i + 1}`}
              />
            ))}
          </div>

          {/* Next / CTA button */}
          {isLast ? (
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-2 text-[13px] font-semibold text-white shadow-md shadow-orange-500/30 transition-all hover:-translate-y-px hover:shadow-lg"
            >
              Empezar gratis
            </button>
          ) : (
            <button
              onClick={goNext}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition-all hover:opacity-90"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Slide renderer ─────────────────────────────────────────────
function DemoSlide({ screenId }: { screenId: string }) {
  switch (screenId) {
    case "onboarding-0":
      return <DemoOnboardingStep step={0} />;
    case "onboarding-1":
      return <DemoOnboardingStep step={1} />;
    case "onboarding-2":
      return <DemoOnboardingStep step={2} />;
    case "onboarding-3":
      return <DemoOnboardingStep step={3} />;
    case "dashboard":
      return (
        <DemoScreenWrapper activeScreenId="dashboard">
          <DemoDashboard />
        </DemoScreenWrapper>
      );
    case "activities":
      return (
        <DemoScreenWrapper activeScreenId="activities">
          <ActivitiesContent
            activities={DEMO_ACTIVITIES.map((a) => ({
              id: a.id,
              name: a.name,
              date: a.date,
              type: a.type,
              distance_km: a.distance_km,
              duration_seconds: a.duration_seconds,
              avg_power_watts: a.avg_power_watts,
              avg_hr_bpm: a.avg_hr_bpm,
              rpe: a.rpe,
            }))}
          />
        </DemoScreenWrapper>
      );
    case "plan":
      return (
        <DemoScreenWrapper activeScreenId="plan">
          <PlanContent serverPlanDays={DEMO_PLAN_DAYS} />
        </DemoScreenWrapper>
      );
    case "insights":
      return (
        <DemoScreenWrapper activeScreenId="insights">
          <InsightsContent
            periodA={DEMO_INSIGHTS.periodA}
            periodB={DEMO_INSIGHTS.periodB}
            comparisonMetrics={DEMO_INSIGHTS.comparisonMetrics}
            radarDimensions={DEMO_INSIGHTS.radarDimensions}
            analysis={DEMO_INSIGHTS.analysis}
            isEmpty={false}
          />
        </DemoScreenWrapper>
      );
    case "profile":
      return (
        <DemoScreenWrapper activeScreenId="profile">
          <ProfileContent profile={DEMO_PROFILE} />
        </DemoScreenWrapper>
      );
    default:
      return null;
  }
}

