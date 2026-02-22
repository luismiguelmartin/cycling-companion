import { apiGet, getServerToken } from "@/lib/api/server";
import type { PlanDay } from "shared";
import { PlanContent } from "./plan-content";

interface PlanResponse {
  data: {
    id: string;
    week_start: string;
    days: PlanDay[];
    ai_rationale: string | null;
  };
}

export default async function PlanPage() {
  const token = await getServerToken();
  if (!token) return null;

  // Calcular inicio de semana (lunes) en UTC — debe coincidir con plan.service.ts getWeekStart()
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dayOfWeek = d.getUTCDay();
  const diff = d.getUTCDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  d.setUTCDate(diff);
  const weekStartStr = d.toISOString().slice(0, 10);

  let planDays: PlanDay[] | null = null;

  try {
    const res = await apiGet<PlanResponse>(`/plan?week_start=${weekStartStr}`, token);
    if (res.data?.days) {
      planDays = res.data.days;
    }
  } catch {
    // No plan found — will show empty state
  }

  return <PlanContent serverPlanDays={planDays} />;
}
