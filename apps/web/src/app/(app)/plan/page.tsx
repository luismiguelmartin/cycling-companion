import { createClient } from "@/lib/supabase/server";
import { PlanContent } from "./plan-content";

export default async function PlanPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Intentar cargar plan semanal de Supabase
  let planDays = null;

  if (user) {
    const now = new Date();
    const dayOfWeek = now.getDay();
    // getDay: 0=Sunday, ajustar a lunes=0
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + diffToMonday);
    weekStart.setHours(0, 0, 0, 0);
    const weekStartStr = weekStart.toISOString().split("T")[0];

    const { data: plan } = await supabase
      .from("weekly_plans")
      .select("days")
      .eq("user_id", user.id)
      .eq("week_start", weekStartStr)
      .single();

    if (plan?.days) {
      planDays = plan.days;
    }
  }

  return <PlanContent serverPlanDays={planDays} />;
}
