import { createClient } from "@/lib/supabase/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * Fetch del API backend desde Client Components.
 * Obtiene el token de la sesión de Supabase en el browser.
 */
export async function apiClientFetch<T>(
  path: string,
  method: string = "GET",
  body?: unknown,
): Promise<T> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("No authenticated session");
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${session.access_token}`,
  };

  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_URL}/api/v1${path}`, {
    method,
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`API ${res.status}: ${text}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** Shorthand para POST desde Client Components */
export function apiClientPost<T>(path: string, body: unknown): Promise<T> {
  return apiClientFetch<T>(path, "POST", body);
}

/** Shorthand para PATCH desde Client Components */
export function apiClientPatch<T>(path: string, body: unknown): Promise<T> {
  return apiClientFetch<T>(path, "PATCH", body);
}

/** Shorthand para DELETE desde Client Components */
export function apiClientDelete<T>(path: string): Promise<T> {
  return apiClientFetch<T>(path, "DELETE");
}

/** Upload de archivo multipart desde Client Components */
export async function apiClientUpload<T>(path: string, formData: FormData): Promise<T> {
  return apiClientFetch<T>(path, "POST", formData);
}
