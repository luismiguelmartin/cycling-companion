/** Mapeo de sport_type de Strava a nuestro activity_type */
export const STRAVA_SPORT_TYPE_MAP: Record<string, string> = {
  Ride: "endurance",
  MountainBikeRide: "endurance",
  GravelRide: "endurance",
  EBikeRide: "endurance",
  EMountainBikeRide: "endurance",
  VirtualRide: "endurance",
  Velodrome: "intervals",
  Handcycle: "endurance",
};

/** sport_types de Strava que son ciclismo (filtrar otros deportes) */
export const STRAVA_CYCLING_SPORT_TYPES = Object.keys(STRAVA_SPORT_TYPE_MAP);

/** Streams de datos a solicitar a Strava */
export const STRAVA_STREAM_KEYS = [
  "time",
  "latlng",
  "distance",
  "altitude",
  "heartrate",
  "cadence",
  "watts",
  "velocity_smooth",
] as const;

/** Configuración de la API de Strava */
export const STRAVA_CONFIG = {
  BASE_URL: "https://www.strava.com",
  API_URL: "https://www.strava.com/api/v3",
  OAUTH_AUTHORIZE: "https://www.strava.com/oauth/authorize",
  OAUTH_TOKEN: "https://www.strava.com/oauth/token",
  OAUTH_DEAUTHORIZE: "https://www.strava.com/oauth/deauthorize",
  DEFAULT_SCOPE: "activity:read_all",
  TOKEN_EXPIRY_BUFFER_SECONDS: 300,
  BACKFILL_DEFAULT_COUNT: 30,
  BACKFILL_MAX_COUNT: 100,
  BACKFILL_PAGE_SIZE: 30,
  RATE_LIMIT_15MIN: 200,
  RATE_LIMIT_DAILY: 2000,
} as const;
