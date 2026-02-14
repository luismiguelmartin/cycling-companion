import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente de Supabase para uso en componentes del lado del cliente (Client Components)
 * Este cliente usa las credenciales públicas (anon key) que son seguras para exponer
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
