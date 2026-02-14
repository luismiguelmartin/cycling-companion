import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="max-w-md space-y-8 rounded-xl bg-white p-10 text-center shadow-xl dark:bg-slate-800">
        <div className="text-6xl">⚠️</div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Error de Autenticación
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Hubo un problema al procesar tu inicio de sesión. Por favor, inténtalo de nuevo.
        </p>
        <Link
          href="/login"
          className="inline-block rounded-lg bg-orange-500 px-6 py-3 font-medium text-white transition-colors hover:bg-orange-600"
        >
          Volver a intentar
        </Link>
      </div>
    </div>
  );
}
