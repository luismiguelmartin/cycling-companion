import { STRAVA_CONFIG, STRAVA_STREAM_KEYS } from "shared";
import { AppError } from "../../plugins/error-handler.js";
import type {
  StravaTokenResponse,
  StravaDetailedActivity,
  StravaStreams,
  StravaSummaryActivity,
  StravaAthlete,
} from "./types.js";

const REQUEST_TIMEOUT_MS = 15_000;

export class StravaAuthError extends AppError {
  constructor(message = "Strava authentication failed") {
    super(message, 401, "STRAVA_AUTH_ERROR");
  }
}

export class StravaRateLimitError extends AppError {
  constructor(
    public usage15min: string = "",
    public usageDaily: string = "",
  ) {
    super("Strava rate limit exceeded", 429, "STRAVA_RATE_LIMIT");
  }
}

function getClientCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new AppError("Strava integration not configured", 503, "STRAVA_NOT_CONFIGURED");
  }
  return { clientId, clientSecret };
}

async function stravaFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (res.status === 401) {
    throw new StravaAuthError();
  }

  if (res.status === 429) {
    throw new StravaRateLimitError(
      res.headers.get("X-RateLimit-Usage") ?? "",
      res.headers.get("X-ReadRateLimit-Usage") ?? "",
    );
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new AppError(
      `Strava API error: ${res.status} ${res.statusText} - ${body}`,
      res.status >= 500 ? 502 : 400,
      "STRAVA_API_ERROR",
    );
  }

  return res.json() as Promise<T>;
}

/** Intercambia auth code por tokens OAuth */
export async function exchangeAuthCode(code: string): Promise<StravaTokenResponse> {
  const { clientId, clientSecret } = getClientCredentials();

  return stravaFetch<StravaTokenResponse>(STRAVA_CONFIG.OAUTH_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
    }),
  });
}

/** Refresca un access token expirado */
export async function refreshAccessToken(refreshToken: string): Promise<StravaTokenResponse> {
  const { clientId, clientSecret } = getClientCredentials();

  return stravaFetch<StravaTokenResponse>(STRAVA_CONFIG.OAUTH_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
}

/** Revoca el acceso (deauthorize) */
export async function deauthorizeAthlete(accessToken: string): Promise<void> {
  await stravaFetch<unknown>(STRAVA_CONFIG.OAUTH_DEAUTHORIZE, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

/** Obtiene el detalle completo de una actividad */
export async function getStravaActivity(
  accessToken: string,
  activityId: number,
): Promise<StravaDetailedActivity> {
  return stravaFetch<StravaDetailedActivity>(
    `${STRAVA_CONFIG.API_URL}/activities/${activityId}?include_all_efforts=false`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    },
  );
}

/** Obtiene los streams de datos de una actividad */
export async function getStravaActivityStreams(
  accessToken: string,
  activityId: number,
): Promise<StravaStreams> {
  const keys = STRAVA_STREAM_KEYS.join(",");
  return stravaFetch<StravaStreams>(
    `${STRAVA_CONFIG.API_URL}/activities/${activityId}/streams?keys=${keys}&key_by_type=true`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    },
  );
}

/** Lista actividades del atleta (para backfill) */
export async function listStravaActivities(
  accessToken: string,
  options: { after?: number; before?: number; page?: number; perPage?: number } = {},
): Promise<StravaSummaryActivity[]> {
  const params = new URLSearchParams();
  if (options.after != null) params.set("after", String(options.after));
  if (options.before != null) params.set("before", String(options.before));
  params.set("page", String(options.page ?? 1));
  params.set("per_page", String(options.perPage ?? STRAVA_CONFIG.BACKFILL_PAGE_SIZE));

  return stravaFetch<StravaSummaryActivity[]>(
    `${STRAVA_CONFIG.API_URL}/athlete/activities?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    },
  );
}

/** Obtiene el perfil del atleta */
export async function getStravaAthlete(accessToken: string): Promise<StravaAthlete> {
  return stravaFetch<StravaAthlete>(`${STRAVA_CONFIG.API_URL}/athlete`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });
}
