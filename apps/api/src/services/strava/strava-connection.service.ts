import { STRAVA_CONFIG } from "shared";
import { supabaseAdmin } from "../supabase.js";
import { encrypt, decrypt } from "../../utils/crypto.js";
import { refreshAccessToken } from "./strava-api.service.js";
import { AppError } from "../../plugins/error-handler.js";
import type { StravaTokenResponse, DecryptedStravaConnection } from "./types.js";

/** Guarda o actualiza una conexión Strava (cifra tokens antes de guardar) */
export async function saveStravaConnection(
  userId: string,
  tokens: StravaTokenResponse,
): Promise<void> {
  const encryptedAccess = encrypt(tokens.access_token);
  const encryptedRefresh = encrypt(tokens.refresh_token);
  const athleteName = `${tokens.athlete.firstname} ${tokens.athlete.lastname}`.trim();

  const { error } = await supabaseAdmin.from("strava_connections").upsert(
    {
      user_id: userId,
      strava_athlete_id: tokens.athlete.id,
      access_token: encryptedAccess,
      refresh_token: encryptedRefresh,
      token_expires_at: new Date(tokens.expires_at * 1000).toISOString(),
      scope: STRAVA_CONFIG.DEFAULT_SCOPE,
      connected_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    throw new AppError(`Error al guardar conexión Strava: ${error.message}`, 500, "DATABASE_ERROR");
  }

  // Guardar athlete_name no es una columna — lo derivamos del token response
  // El nombre se obtiene de la respuesta de Strava en cada llamada
  void athleteName; // eslint: usado para logging futuro
}

/** Obtiene la conexión Strava de un usuario (descifra tokens) */
export async function getStravaConnection(
  userId: string,
): Promise<DecryptedStravaConnection | null> {
  const { data, error } = await supabaseAdmin
    .from("strava_connections")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new AppError(`Error al obtener conexión Strava: ${error.message}`, 500, "DATABASE_ERROR");
  }

  if (!data) return null;

  return {
    id: data.id,
    user_id: data.user_id,
    strava_athlete_id: data.strava_athlete_id,
    access_token: decrypt(data.access_token),
    refresh_token: decrypt(data.refresh_token),
    token_expires_at: new Date(data.token_expires_at),
    scope: data.scope,
    connected_at: new Date(data.connected_at),
    last_sync_at: data.last_sync_at ? new Date(data.last_sync_at) : null,
  };
}

/** Obtiene la conexión por strava_athlete_id (para webhooks) */
export async function getStravaConnectionByAthleteId(
  athleteId: number,
): Promise<DecryptedStravaConnection | null> {
  const { data, error } = await supabaseAdmin
    .from("strava_connections")
    .select("*")
    .eq("strava_athlete_id", athleteId)
    .maybeSingle();

  if (error) {
    throw new AppError(`Error al obtener conexión Strava: ${error.message}`, 500, "DATABASE_ERROR");
  }

  if (!data) return null;

  return {
    id: data.id,
    user_id: data.user_id,
    strava_athlete_id: data.strava_athlete_id,
    access_token: decrypt(data.access_token),
    refresh_token: decrypt(data.refresh_token),
    token_expires_at: new Date(data.token_expires_at),
    scope: data.scope,
    connected_at: new Date(data.connected_at),
    last_sync_at: data.last_sync_at ? new Date(data.last_sync_at) : null,
  };
}

/** Elimina la conexión Strava de un usuario */
export async function deleteStravaConnection(userId: string): Promise<void> {
  const { error } = await supabaseAdmin.from("strava_connections").delete().eq("user_id", userId);

  if (error) {
    throw new AppError(
      `Error al eliminar conexión Strava: ${error.message}`,
      500,
      "DATABASE_ERROR",
    );
  }
}

/** Actualiza los tokens (tras refresh) */
export async function updateStravaTokens(
  userId: string,
  accessToken: string,
  refreshToken: string,
  expiresAt: Date,
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("strava_connections")
    .update({
      access_token: encrypt(accessToken),
      refresh_token: encrypt(refreshToken),
      token_expires_at: expiresAt.toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    throw new AppError(
      `Error al actualizar tokens Strava: ${error.message}`,
      500,
      "DATABASE_ERROR",
    );
  }
}

/** Actualiza last_sync_at */
export async function updateLastSyncAt(userId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("strava_connections")
    .update({ last_sync_at: new Date().toISOString() })
    .eq("user_id", userId);

  if (error) {
    throw new AppError(`Error al actualizar last_sync_at: ${error.message}`, 500, "DATABASE_ERROR");
  }
}

/** Obtiene un access token válido (refresca si necesario) */
export async function getValidAccessToken(userId: string): Promise<string> {
  const connection = await getStravaConnection(userId);
  if (!connection) {
    throw new AppError("No hay conexión con Strava", 404, "STRAVA_NOT_CONNECTED");
  }

  const now = new Date();
  const bufferMs = STRAVA_CONFIG.TOKEN_EXPIRY_BUFFER_SECONDS * 1000;

  if (connection.token_expires_at.getTime() > now.getTime() + bufferMs) {
    return connection.access_token;
  }

  // Token expirado o a punto de expirar — refrescar
  const newTokens = await refreshAccessToken(connection.refresh_token);

  await updateStravaTokens(
    userId,
    newTokens.access_token,
    newTokens.refresh_token,
    new Date(newTokens.expires_at * 1000),
  );

  return newTokens.access_token;
}
