import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileContent } from "./profile-content";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, email, display_name, age, weight_kg, ftp, max_hr, rest_hr, goal")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/onboarding");
  }

  return <ProfileContent profile={profile} />;
}
