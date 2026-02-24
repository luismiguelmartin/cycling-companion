export type { TrackPoint, ActivitySummary } from "./types.js";
export { METRICS_THRESHOLDS } from "./types.js";
export { haversineDistance } from "./haversine.js";
export { sanitizeTrackPoints } from "./sanitize.js";
export { sortAndDeduplicate, resampleTo1Hz } from "./resample.js";
export { computeSpeed } from "./speed.js";
export { detectMovement } from "./movement.js";
export {
  avgPower,
  avgPowerNonZero,
  maxPower,
  normalizedPower,
  variabilityIndex,
} from "./power-metrics.js";
export { elevationGain } from "./elevation.js";
export { computeActivitySummary } from "./compute-summary.js";
