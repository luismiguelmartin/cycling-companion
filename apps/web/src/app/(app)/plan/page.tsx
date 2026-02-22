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

  // Calcular inicio de semana (lunes)
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + diffToMonday);
  weekStart.setHours(0, 0, 0, 0);
  const weekStartStr = weekStart.toISOString().split("T")[0];

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
