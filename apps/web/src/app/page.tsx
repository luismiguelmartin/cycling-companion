import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verificar si el usuario tiene perfil (onboarding completado)
  const { data: profile } = await supabase.from("users").select("id").eq("id", user.id).single();

  if (!profile) {
    redirect("/onboarding");
  }

  // Placeholder hasta que se implemente el dashboard
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--surface-bg)]">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Dashboard (próximamente)</h1>
        <p className="mt-2 text-[var(--text-secondary)]">Bienvenido, {user.email}</p>
      </div>
    </main>
  );
}
