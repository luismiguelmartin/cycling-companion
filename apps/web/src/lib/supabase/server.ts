import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente de Supabase para uso en Server Components y Server Actions
 * Maneja automáticamente las cookies para mantener la sesión del usuario
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // La función setAll fue llamada desde un Server Component.
            // Esto puede ser ignorado si tienes middleware refrescando las cookies del usuario.
          }
        },
      },
    },
  );
}
