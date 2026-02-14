import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginButton } from "./login-button";

export default async function LoginPage() {
  const supabase = await createClient();

  // Si el usuario ya está autenticado, redirigir al dashboard
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-10 shadow-2xl dark:bg-slate-800">
        {/* Logo / Brand */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            Cycling Companion
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Tu entrenador personal de ciclismo impulsado por IA
          </p>
        </div>

        {/* Welcome Message */}
        <div className="mt-8 text-center">
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200">
            Bienvenido
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Inicia sesión para acceder a tu dashboard de entrenamiento
          </p>
        </div>

        {/* Login Button */}
        <div className="mt-8">
          <LoginButton />
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400">
          Al continuar, aceptas nuestros términos de servicio y política de privacidad
        </div>
      </div>
    </div>
  );
}
