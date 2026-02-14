import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full max-w-2xl space-y-8 rounded-xl bg-white p-10 shadow-2xl dark:bg-slate-800">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
            🚴 Cycling Companion
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            ¡Bienvenido, {user.email}!
          </p>
        </div>

        <div className="rounded-lg bg-green-50 p-6 dark:bg-green-900/20">
          <h2 className="text-xl font-semibold text-green-800 dark:text-green-400">
            ✅ Autenticación Exitosa
          </h2>
          <p className="mt-2 text-green-700 dark:text-green-300">
            Has iniciado sesión correctamente con Google. El sistema de autenticación está
            funcionando.
          </p>
        </div>

        <div className="space-y-4 rounded-lg bg-slate-50 p-6 dark:bg-slate-700/50">
          <h3 className="font-semibold text-slate-900 dark:text-white">Información del Usuario</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-600 dark:text-slate-400">Email:</dt>
              <dd className="font-mono text-slate-900 dark:text-white">{user.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-600 dark:text-slate-400">User ID:</dt>
              <dd className="font-mono text-xs text-slate-900 dark:text-white">{user.id}</dd>
            </div>
          </dl>
        </div>

        <div className="text-center">
          <LogoutButton />
        </div>

        <div className="text-center text-sm text-slate-500 dark:text-slate-400">
          <p>Próximos pasos:</p>
          <ul className="mt-2 space-y-1">
            <li>✅ Autenticación con Google</li>
            <li>🔄 Onboarding flow</li>
            <li>⏳ Dashboard principal</li>
            <li>⏳ Gestión de actividades</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
