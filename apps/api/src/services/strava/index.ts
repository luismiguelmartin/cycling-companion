export type {
  StravaTokenResponse,
  StravaDetailedActivity,
  StravaSummaryActivity,
  StravaStreams,
  StravaAthlete,
  StravaWebhookEvent,
  DecryptedStravaConnection,
} from "./types.js";

export {
  exchangeAuthCode,
  refreshAccessToken,
  deauthorizeAthlete,
  getStravaActivity,
  getStravaActivityStreams,
  listStravaActivities,
  getStravaAthlete,
  StravaAuthError,
  StravaRateLimitError,
} from "./strava-api.service.js";

export {
  saveStravaConnection,
  getStravaConnection,
  getStravaConnectionByAthleteId,
  deleteStravaConnection,
  updateStravaTokens,
  updateLastSyncAt,
  getValidAccessToken,
} from "./strava-connection.service.js";

export {
  mapStravaToActivity,
  isStravaCyclingActivity,
  type MappedActivityData,
  type MappedStravaResult,
} from "./strava-mapper.service.js";
