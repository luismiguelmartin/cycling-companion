import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "./app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("display_name, email")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/onboarding");
  }

  return (
    <AppShell userName={profile.display_name} userEmail={profile.email ?? user.email ?? ""}>
      {children}
    </AppShell>
  );
}
