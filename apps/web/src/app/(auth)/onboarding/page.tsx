import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "./onboarding-wizard";

export default async function OnboardingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Si ya tiene perfil, redirigir al home
  const { data: profile } = await supabase.from("users").select("id").eq("id", user.id).single();

  if (profile) {
    redirect("/");
  }

  return <OnboardingWizard userId={user.id} userEmail={user.email ?? ""} />;
}
