"use client";

import { User, Heart, Target, Check } from "lucide-react";
import { GOALS, ONBOARDING_STEPS } from "shared";
import { StepIndicator } from "@/components/step-indicator";
import { OnboardingField } from "@/components/onboarding-field";
import { GoalCard } from "@/components/goal-card";
import { InfoBox } from "@/components/info-box";
import { ProfileSummary } from "@/app/(auth)/onboarding/profile-summary";
import { AICoachWelcome } from "@/app/(auth)/onboarding/ai-coach-welcome";
import { DEMO_ONBOARDING_DATA } from "@/lib/demo/mock-data";

const STEP_ICONS = { User, Heart, Target, Check } as const;

const noop = () => {};

interface DemoOnboardingStepProps {
  step: number;
}

export function DemoOnboardingStep({ step }: DemoOnboardingStepProps) {
  const data = DEMO_ONBOARDING_DATA;
  const currentStep = ONBOARDING_STEPS[step];
  const StepIcon = STEP_ICONS[currentStep.iconName as keyof typeof STEP_ICONS];

  return (
    <div className="flex flex-col items-center px-4 py-6">
      {/* Step indicator */}
      <div className="mb-6">
        <StepIndicator current={step} total={4} />
      </div>

      {/* Card */}
      <div className="w-full rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-xl backdrop-blur-sm md:w-[520px] md:p-9">
        {/* Step header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div
            className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${
              step === 3 ? "bg-gradient-to-br from-green-500 to-green-600" : "bg-orange-500/15"
            }`}
          >
            <StepIcon className={`h-7 w-7 ${step === 3 ? "text-white" : "text-orange-500"}`} />
          </div>
          <h2 className="text-[22px] font-bold text-[var(--text-primary)]">{currentStep.title}</h2>
          <p className="mt-1 text-[13px] text-[var(--text-muted)]">{currentStep.subtitle}</p>
        </div>

        {/* Step content */}
        <div>
          {step === 0 && (
            <div className="flex flex-col gap-4">
              <OnboardingField
                label="Nombre"
                placeholder="Tu nombre"
                value={data.name}
                onChange={noop}
              />
              <div className="grid grid-cols-2 gap-4">
                <OnboardingField
                  label="Edad"
                  placeholder="45"
                  value={data.age}
                  onChange={noop}
                  unit="años"
                  type="number"
                />
                <OnboardingField
                  label="Peso"
                  placeholder="75"
                  value={data.weight}
                  onChange={noop}
                  unit="kg"
                  type="number"
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-4">
              <OnboardingField
                label="FTP (Functional Threshold Power)"
                placeholder="250"
                value={data.ftp}
                onChange={noop}
                unit="W"
                hint="Potencia sostenible durante 1 hora. Déjalo vacío si no lo conoces."
                type="number"
              />
              <div className="grid grid-cols-2 gap-4">
                <OnboardingField
                  label="FC máxima"
                  placeholder="185"
                  value={data.maxHR}
                  onChange={noop}
                  unit="bpm"
                  type="number"
                />
                <OnboardingField
                  label="FC reposo"
                  placeholder="55"
                  value={data.restHR}
                  onChange={noop}
                  unit="bpm"
                  type="number"
                />
              </div>
              <InfoBox>
                <span>
                  <strong className="text-[var(--text-primary)]">No te preocupes</strong> si no
                  tienes estos datos. La IA calculará estimaciones a partir de tus actividades y las
                  irá ajustando automáticamente.
                </span>
              </InfoBox>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-3">
              {GOALS.map((goal) => (
                <GoalCard
                  key={goal.key}
                  icon={goal.icon}
                  label={goal.label}
                  description={goal.description}
                  active={data.goal === goal.key}
                  onClick={noop}
                />
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-4">
              <ProfileSummary data={data} />
              <AICoachWelcome userName={data.name} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
