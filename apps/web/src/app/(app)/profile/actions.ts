"use server";

import { revalidatePath } from "next/cache";
import { apiPatch, getServerToken } from "@/lib/api/server";
import type { OnboardingData } from "shared";

interface SaveProfileResult {
  success: boolean;
  error?: string;
  code?: string;
}

export async function saveProfile(data: OnboardingData): Promise<SaveProfileResult> {
  const token = await getServerToken();
  if (!token) {
    return { success: false, error: "NO_SESSION", code: "NO_SESSION" };
  }

  try {
    await apiPatch("/profile", token, data);
    revalidatePath("/profile");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    // Extract HTTP status code from "API NNN: ..." format
    const statusMatch = message.match(/^API (\d+):/);
    const status = statusMatch ? parseInt(statusMatch[1]) : 500;

    if (status === 401) {
      return { success: false, error: "Sesión expirada. Recarga la página.", code: "UNAUTHORIZED" };
    }
    if (status >= 400 && status < 500) {
      return {
        success: false,
        error: "Error de validación. Revisa los datos e inténtalo de nuevo.",
        code: "VALIDATION",
      };
    }
    return {
      success: false,
      error: "Error del servidor al guardar. Inténtalo de nuevo.",
      code: "SERVER_ERROR",
    };
  }
}
