"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, User, Heart, Target, Check, ChevronLeft, ChevronRight, Activity } from "lucide-react";
import { onboardingSchema, GOALS, ONBOARDING_STEPS } from "shared";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";
import { StepIndicator } from "@/components/step-indicator";
import { OnboardingField } from "@/components/onboarding-field";
import { GoalCard } from "@/components/goal-card";
import { InfoBox } from "@/components/info-box";
import { ProfileSummary } from "./profile-summary";
import { AICoachWelcome } from "./ai-coach-welcome";

const STEP_ICONS = { User, Heart, Target, Check } as const;

interface OnboardingWizardProps {
  userId: string;
  userEmail: string;
}

export function OnboardingWizard({ userId, userEmail }: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [data, setData] = useState({
    name: "",
    age: "",
    weight: "",
    ftp: "",
    maxHR: "",
    restHR: "",
    goal: "performance",
  });

  const updateField = (field: string, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const canNext = (): boolean => {
    if (step === 0) return data.name.trim() !== "" && data.age !== "" && data.weight !== "";
    return true;
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleComplete = async () => {
    setSubmitting(true);
    setError(null);

    const parsed = onboardingSchema.safeParse({
      display_name: data.name.trim(),
      age: parseInt(data.age, 10),
      weight_kg: parseFloat(data.weight),
      ftp: data.ftp ? parseInt(data.ftp, 10) : null,
      max_hr: data.maxHR ? parseInt(data.maxHR, 10) : null,
      rest_hr: data.restHR ? parseInt(data.restHR, 10) : null,
      goal: data.goal,
    });

    if (!parsed.success) {
      setError("Datos inválidos. Revisa los campos e inténtalo de nuevo.");
      setSubmitting(false);
      return;
    }

    const supabase = createClient();
    const { error: dbError } = await supabase.from("users").insert({
      id: userId,
      email: userEmail,
      display_name: parsed.data.display_name,
      age: parsed.data.age,
      weight_kg: parsed.data.weight_kg,
      ftp: parsed.data.ftp ?? null,
      max_hr: parsed.data.max_hr ?? null,
      rest_hr: parsed.data.rest_hr ?? null,
      goal: parsed.data.goal,
    });

    if (dbError) {
      if (dbError.code === "23505") {
        // Profile already exists (unique violation)
        router.push("/");
        return;
      }
      setError("Error al guardar el perfil. Inténtalo de nuevo.");
      setSubmitting(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  const currentStep = ONBOARDING_STEPS[step];
  const StepIcon = STEP_ICONS[currentStep.iconName as keyof typeof STEP_ICONS];

  const maxHRHint =
    data.age && !data.maxHR ? `Estimación: ${220 - parseInt(data.age, 10)} bpm` : undefined;

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-[var(--surface-bg)] p-4">
      {/* Theme toggle */}
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      {/* Logo mini */}
      <div className="mb-6 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-orange-500 to-orange-600">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <span className="text-base font-bold text-[var(--text-primary)]">Cycling Companion</span>
      </div>

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
        <div className="mb-6">
          {step === 0 && (
            <div className="flex flex-col gap-4">
              <OnboardingField
                label="Nombre"
                placeholder="Tu nombre"
                value={data.name}
                onChange={(v) => updateField("name", v)}
              />
              <div className="grid grid-cols-2 gap-4">
                <OnboardingField
                  label="Edad"
                  placeholder="45"
                  value={data.age}
                  onChange={(v) => updateField("age", v)}
                  unit="años"
                  type="number"
                />
                <OnboardingField
                  label="Peso"
                  placeholder="75"
                  value={data.weight}
                  onChange={(v) => updateField("weight", v)}
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
                onChange={(v) => updateField("ftp", v)}
                unit="W"
                hint="Potencia sostenible durante 1 hora. Déjalo vacío si no lo conoces."
                type="number"
              />
              <div className="grid grid-cols-2 gap-4">
                <OnboardingField
                  label="FC máxima"
                  placeholder="185"
                  value={data.maxHR}
                  onChange={(v) => updateField("maxHR", v)}
                  unit="bpm"
                  hint={maxHRHint}
                  type="number"
                />
                <OnboardingField
                  label="FC reposo"
                  placeholder="55"
                  value={data.restHR}
                  onChange={(v) => updateField("restHR", v)}
                  unit="bpm"
                  type="number"
                />
              </div>
              <InfoBox>
                💡 <strong className="text-[var(--text-primary)]">No te preocupes</strong> si no
                tienes estos datos. La IA calculará estimaciones a partir de tus actividades y las
                irá ajustando automáticamente.
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
                  onClick={() => updateField("goal", goal.key)}
                />
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-4">
              <ProfileSummary data={data} />
              <AICoachWelcome userName={data.name || undefined} />
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-center text-sm text-red-500">
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3">
          {step > 0 ? (
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 rounded-xl border border-[var(--input-border)] px-4 py-2.5 text-[14px] font-medium text-[var(--text-secondary)] transition-all duration-200 hover:bg-[var(--input-bg)]"
            >
              <ChevronLeft className="h-4 w-4" />
              Atrás
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={!canNext()}
              className={`flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-[14px] font-semibold transition-all duration-200 ${
                canNext()
                  ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/30 hover:-translate-y-px hover:shadow-lg"
                  : "cursor-not-allowed bg-slate-600/30 text-slate-400"
              }`}
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3 text-[15px] font-bold text-white shadow-lg shadow-orange-500/30 transition-all duration-200 hover:-translate-y-px hover:shadow-xl disabled:opacity-50"
            >
              <Activity className="h-5 w-5" />
              {submitting ? "Guardando..." : "Empezar a entrenar"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
