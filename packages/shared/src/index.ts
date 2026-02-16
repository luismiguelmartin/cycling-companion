// Schemas
export {
  goalEnum,
  onboardingSchema,
  userProfileSchema,
  type GoalType,
  type OnboardingData,
  type UserProfile,
} from "./schemas/user-profile.js";

export {
  activityTypeEnum,
  activitySchema,
  activityCreateSchema,
  type ActivityType,
  type Activity,
  type ActivityCreate,
  type ActivityCreateInput,
} from "./schemas/activity.js";

// Constants
export { GOALS, ONBOARDING_STEPS } from "./constants/goals.js";
export { NAV_ITEMS } from "./constants/navigation.js";
export { ACTIVITY_TYPES, type ActivityTypeKey } from "./constants/activity-types.js";
export {
  POWER_ZONES,
  HR_ZONES,
  calculateZones,
  type ZoneDefinition,
  type CalculatedZone,
} from "./constants/zones.js";
export { ACTIVITY_FILTERS, type ActivityFilterKey } from "./constants/activity-filters.js";
export { MAX_RPE, RPE_DESCRIPTIONS, RPE_COLORS, getRPEColor } from "./constants/rpe.js";
export { INTENSITY_LEVELS, type IntensityLevel } from "./constants/intensity-levels.js";
export { WEATHER_TYPES, type WeatherTypeKey, type WeatherType } from "./constants/weather.js";

export {
  planDaySchema,
  weeklyPlanSchema,
  type PlanDay,
  type WeeklyPlan,
} from "./schemas/weekly-plan.js";

export {
  periodRangeSchema,
  comparisonMetricSchema,
  radarDimensionSchema,
  insightsAnalysisSchema,
  type PeriodRange,
  type ComparisonMetric,
  type RadarDimension,
  type InsightsAnalysis,
} from "./schemas/insights.js";

// Training calculations
export {
  calculateIF,
  calculateTSS,
  calculateCTL,
  calculateATL,
  calculateTrainingLoad,
  calculateWeeklyTSS,
  calculateNP,
  classifyActivityZone,
  type TrainingActivityInput,
  type TrainingLoad,
} from "./utils/training-calculations.js";

// Training rules
export {
  checkOverloadAlert,
  checkRestAlert,
  checkDetrainingAlert,
  checkRampRateAlert,
  evaluateTrainingAlerts,
  type AlertLevel,
  type TrainingAlert,
  type AlertParams,
} from "./utils/training-rules.js";

// AI response schemas
export {
  aiActivityAnalysisSchema,
  aiCoachTipSchema,
  aiWeeklySummarySchema,
  aiPlanDaySchema,
  aiWeeklyPlanResponseSchema,
  type AIActivityAnalysis,
  type AICoachTip,
  type AIWeeklySummary,
  type AIWeeklyPlanResponse,
} from "./schemas/ai-response.js";
