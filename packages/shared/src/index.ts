// Schemas
export {
  goalEnum,
  onboardingSchema,
  userProfileSchema,
  type GoalType,
  type OnboardingData,
  type UserProfile,
} from "./schemas/user-profile";

export {
  activityTypeEnum,
  activitySchema,
  activityCreateSchema,
  type ActivityType,
  type Activity,
  type ActivityCreate,
  type ActivityCreateInput,
} from "./schemas/activity";

// Constants
export { GOALS, ONBOARDING_STEPS } from "./constants/goals";
export { NAV_ITEMS } from "./constants/navigation";
export { ACTIVITY_TYPES, type ActivityTypeKey } from "./constants/activity-types";
export {
  POWER_ZONES,
  HR_ZONES,
  calculateZones,
  type ZoneDefinition,
  type CalculatedZone,
} from "./constants/zones";
export { ACTIVITY_FILTERS, type ActivityFilterKey } from "./constants/activity-filters";
export { RPE_COLORS, getRPEColor } from "./constants/rpe";
export { INTENSITY_LEVELS, type IntensityLevel } from "./constants/intensity-levels";

export {
  planDaySchema,
  weeklyPlanSchema,
  type PlanDay,
  type WeeklyPlan,
} from "./schemas/weekly-plan";

export {
  periodRangeSchema,
  comparisonMetricSchema,
  radarDimensionSchema,
  insightsAnalysisSchema,
  type PeriodRange,
  type ComparisonMetric,
  type RadarDimension,
  type InsightsAnalysis,
} from "./schemas/insights";

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
} from "./utils/training-calculations";

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
} from "./utils/training-rules";

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
} from "./schemas/ai-response";
