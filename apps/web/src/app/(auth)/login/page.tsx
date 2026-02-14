import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginContent } from "./login-content";

export default async function LoginPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  return <LoginContent />;
}
