/** Respuesta de OAuth token exchange / refresh de Strava */
export interface StravaTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number; // epoch seconds
  expires_in: number;
  athlete: {
    id: number;
    firstname: string;
    lastname: string;
  };
}

/** Actividad detallada de Strava */
export interface StravaDetailedActivity {
  id: number;
  name: string;
  sport_type: string;
  type: string;
  distance: number; // metros
  moving_time: number; // segundos
  elapsed_time: number;
  total_elevation_gain: number;
  start_date: string; // ISO
  start_date_local: string; // ISO
  average_speed: number; // m/s
  max_speed: number; // m/s
  average_heartrate?: number;
  max_heartrate?: number;
  average_watts?: number;
  weighted_average_watts?: number;
  max_watts?: number;
  average_cadence?: number;
  kilojoules?: number;
  has_heartrate: boolean;
  device_watts: boolean;
  trainer: boolean;
  device_name?: string;
}

/** Actividad resumida de Strava (lista) */
export interface StravaSummaryActivity {
  id: number;
  name: string;
  sport_type: string;
  type: string;
  distance: number;
  moving_time: number;
  start_date_local: string;
  average_heartrate?: number;
  max_heartrate?: number;
  average_watts?: number;
  has_heartrate: boolean;
}

/** Streams de datos de una actividad Strava */
export interface StravaStreams {
  time?: { data: number[] };
  latlng?: { data: [number, number][] };
  altitude?: { data: number[] };
  heartrate?: { data: number[] };
  cadence?: { data: number[] };
  watts?: { data: number[] };
  velocity_smooth?: { data: number[] };
  distance?: { data: number[] };
}

/** Perfil del atleta Strava */
export interface StravaAthlete {
  id: number;
  firstname: string;
  lastname: string;
}

/** Evento de webhook de Strava */
export interface StravaWebhookEvent {
  object_type: "activity" | "athlete";
  object_id: number;
  aspect_type: "create" | "update" | "delete";
  updates: Record<string, string>;
  owner_id: number; // strava_athlete_id
  subscription_id: number;
  event_time: number; // epoch seconds
}

/** Conexión Strava descifrada (uso interno) */
export interface DecryptedStravaConnection {
  id: string;
  user_id: string;
  strava_athlete_id: number;
  access_token: string;
  refresh_token: string;
  token_expires_at: Date;
  scope: string;
  connected_at: Date;
  last_sync_at: Date | null;
}
