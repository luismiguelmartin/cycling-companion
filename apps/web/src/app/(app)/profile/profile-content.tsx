"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Smartphone, Loader2 } from "lucide-react";
import { GOALS, onboardingSchema } from "shared";
import type { GoalType } from "shared";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { OnboardingField } from "@/components/onboarding-field";
import { GoalCard } from "@/components/goal-card";
import { ZoneTable } from "@/components/zone-table";
import { ProfileHeader } from "./profile-header";
import { apiClientPatch } from "@/lib/api/client";

interface ProfileContentProps {
  profile: {
    id: string;
    email: string;
    display_name: string;
    age: number;
    weight_kg: number;
    ftp: number | null;
    max_hr: number | null;
    rest_hr: number | null;
    goal: string;
  };
}

function buildInitialFormData(profile: ProfileContentProps["profile"]) {
  return {
    display_name: profile.display_name,
    age: String(profile.age),
    weight_kg: String(profile.weight_kg),
    ftp: profile.ftp ? String(profile.ftp) : "",
    max_hr: profile.max_hr ? String(profile.max_hr) : "",
    rest_hr: profile.rest_hr ? String(profile.rest_hr) : "",
    goal: profile.goal as GoalType,
  };
}

export function ProfileContent({ profile }: ProfileContentProps) {
  const router = useRouter();
  const [formData, setFormData] = useState(() => buildInitialFormData(profile));
  const [originalData, setOriginalData] = useState(() => buildInitialFormData(profile));
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isDirty = JSON.stringify(formData) !== JSON.stringify(originalData);

  function updateField(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  async function handleSave() {
    setIsSaving(true);
    setErrors({});

    const parsed = onboardingSchema.safeParse({
      display_name: formData.display_name,
      age: parseInt(formData.age) || 0,
      weight_kg: parseFloat(formData.weight_kg) || 0,
      ftp: formData.ftp ? parseInt(formData.ftp) : null,
      max_hr: formData.max_hr ? parseInt(formData.max_hr) : null,
      rest_hr: formData.rest_hr ? parseInt(formData.rest_hr) : null,
      goal: formData.goal,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (field) fieldErrors[String(field)] = issue.message;
      });
      setErrors(fieldErrors);
      setIsSaving(false);
      return;
    }

    try {
      await apiClientPatch("/profile", {
        display_name: parsed.data.display_name,
        age: parsed.data.age,
        weight_kg: parsed.data.weight_kg,
        ftp: parsed.data.ftp ?? null,
        max_hr: parsed.data.max_hr ?? null,
        rest_hr: parsed.data.rest_hr ?? null,
        goal: parsed.data.goal,
      });
      setOriginalData({ ...formData });
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al guardar. Inténtalo de nuevo.";
      if (message.includes("No authenticated session")) {
        setErrors({ _form: "Sesión expirada. Recarga la página e inténtalo de nuevo." });
      } else if (message.includes("API 4")) {
        setErrors({ _form: "Error de validación. Revisa los datos e inténtalo de nuevo." });
      } else {
        setErrors({ _form: "Error al guardar. Inténtalo de nuevo." });
      }
    }

    setIsSaving(false);
  }

  const ftpNumber = formData.ftp ? parseInt(formData.ftp) : null;
  const maxHrNumber = formData.max_hr ? parseInt(formData.max_hr) : null;

  return (
    <div className="flex flex-col gap-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-bold text-[var(--text-primary)] md:text-[28px]">Perfil</h1>
        <button
          onClick={handleSave}
          disabled={!isDirty || isSaving}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2.5 text-[13px] font-semibold text-white transition-opacity disabled:opacity-40"
          aria-label="Guardar cambios"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar
        </button>
      </div>

      {/* Form error */}
      {errors._form && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/[0.08] p-3 text-[13px] text-red-500">
          {errors._form}
        </div>
      )}

      {/* Profile header */}
      <ProfileHeader
        name={formData.display_name || profile.display_name}
        email={profile.email}
        ftp={ftpNumber && !isNaN(ftpNumber) ? ftpNumber : null}
        goal={formData.goal}
      />

      {/* Tabs */}
      <Tabs defaultValue="datos">
        <TabsList className="w-full rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)]">
          <TabsTrigger
            value="datos"
            className="flex-1 rounded-lg text-[13px] data-[state=active]:bg-orange-500/[0.12] data-[state=active]:text-orange-500"
          >
            Datos
          </TabsTrigger>
          <TabsTrigger
            value="zonas"
            className="flex-1 rounded-lg text-[13px] data-[state=active]:bg-orange-500/[0.12] data-[state=active]:text-orange-500"
          >
            Zonas
          </TabsTrigger>
          <TabsTrigger
            value="ajustes"
            className="flex-1 rounded-lg text-[13px] data-[state=active]:bg-orange-500/[0.12] data-[state=active]:text-orange-500"
          >
            Ajustes
          </TabsTrigger>
        </TabsList>

        {/* Tab: Datos */}
        <TabsContent value="datos" className="flex flex-col gap-6 pt-4">
          {/* Datos básicos */}
          <section>
            <h2 className="mb-3 text-[15px] font-semibold text-[var(--text-primary)]">
              Datos básicos
            </h2>
            <div className="flex flex-col gap-3">
              <OnboardingField
                label="Nombre"
                placeholder="Tu nombre"
                value={formData.display_name}
                onChange={(v) => updateField("display_name", v)}
                error={errors.display_name}
              />
              <div className="grid grid-cols-2 gap-3">
                <OnboardingField
                  label="Edad"
                  placeholder="40"
                  value={formData.age}
                  onChange={(v) => updateField("age", v)}
                  type="number"
                  unit="años"
                  error={errors.age}
                />
                <OnboardingField
                  label="Peso"
                  placeholder="75"
                  value={formData.weight_kg}
                  onChange={(v) => updateField("weight_kg", v)}
                  type="number"
                  unit="kg"
                  error={errors.weight_kg}
                />
              </div>
            </div>
          </section>

          {/* Datos de entrenamiento */}
          <section>
            <h2 className="mb-3 text-[15px] font-semibold text-[var(--text-primary)]">
              Entrenamiento
            </h2>
            <div className="flex flex-col gap-3">
              <OnboardingField
                label="FTP"
                placeholder="200"
                value={formData.ftp}
                onChange={(v) => updateField("ftp", v)}
                type="number"
                unit="W"
                hint="Functional Threshold Power"
                error={errors.ftp}
              />
              <div className="grid grid-cols-2 gap-3">
                <OnboardingField
                  label="FC máxima"
                  placeholder="185"
                  value={formData.max_hr}
                  onChange={(v) => updateField("max_hr", v)}
                  type="number"
                  unit="bpm"
                  error={errors.max_hr}
                />
                <OnboardingField
                  label="FC reposo"
                  placeholder="55"
                  value={formData.rest_hr}
                  onChange={(v) => updateField("rest_hr", v)}
                  type="number"
                  unit="bpm"
                  error={errors.rest_hr}
                />
              </div>
            </div>
          </section>

          {/* Objetivo */}
          <section>
            <h2 className="mb-3 text-[15px] font-semibold text-[var(--text-primary)]">Objetivo</h2>
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2" role="radiogroup">
              {GOALS.map((g) => (
                <GoalCard
                  key={g.key}
                  icon={
                    g.key === "performance"
                      ? "🎯"
                      : g.key === "health"
                        ? "❤️"
                        : g.key === "weight_loss"
                          ? "📉"
                          : "🛡️"
                  }
                  label={g.label}
                  description={g.description}
                  active={formData.goal === g.key}
                  onClick={() => updateField("goal", g.key)}
                />
              ))}
            </div>
          </section>
        </TabsContent>

        {/* Tab: Zonas */}
        <TabsContent value="zonas" className="flex flex-col gap-4 pt-4">
          <ZoneTable
            type="power"
            referenceValue={ftpNumber && !isNaN(ftpNumber) ? ftpNumber : null}
            label="Potencia"
          />
          <ZoneTable
            type="hr"
            referenceValue={maxHrNumber && !isNaN(maxHrNumber) ? maxHrNumber : null}
            label="Frecuencia Cardíaca"
          />
        </TabsContent>

        {/* Tab: Ajustes */}
        <TabsContent value="ajustes" className="flex flex-col gap-6 pt-4">
          {/* Dispositivos */}
          <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 md:p-5">
            <h2 className="mb-1 text-[16px] font-bold text-[var(--text-primary)]">Dispositivos</h2>
            <p className="mb-4 text-[12px] text-[var(--text-muted)]">
              Conecta tus dispositivos para sincronizar actividades
            </p>
            <div className="flex flex-col gap-3">
              {[
                { name: "Garmin Connect", status: "Próximamente" },
                { name: "Strava", status: "Próximamente" },
                { name: "Wahoo", status: "Próximamente" },
              ].map((device) => (
                <div
                  key={device.name}
                  className="flex items-center justify-between rounded-xl border border-[var(--card-border)] px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-[var(--text-muted)]" />
                    <span className="text-[14px] font-medium text-[var(--text-primary)]">
                      {device.name}
                    </span>
                  </div>
                  <span className="rounded-[5px] bg-[var(--active-nav-bg)] px-2 py-0.5 text-[11px] text-[var(--text-muted)]">
                    {device.status}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Notificaciones */}
          <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 md:p-5">
            <h2 className="mb-1 text-[16px] font-bold text-[var(--text-primary)]">
              Notificaciones
            </h2>
            <p className="mb-4 text-[12px] text-[var(--text-muted)]">
              Configura las notificaciones de la aplicación
            </p>
            <div className="flex flex-col gap-4">
              {[
                {
                  id: "alerts",
                  label: "Alertas de entrenamiento",
                  description: "Recibe alertas cuando sea hora de entrenar",
                },
                {
                  id: "overload",
                  label: "Alerta de sobrecarga",
                  description: "Aviso cuando la carga semanal exceda tu media",
                },
                {
                  id: "weekly",
                  label: "Resumen semanal",
                  description: "Resumen de tu semana cada domingo",
                },
              ].map((notification) => (
                <div key={notification.id} className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium text-[var(--text-primary)]">
                      {notification.label}
                    </p>
                    <p className="text-[12px] text-[var(--text-muted)]">
                      {notification.description}
                    </p>
                  </div>
                  <Switch />
                </div>
              ))}
            </div>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
