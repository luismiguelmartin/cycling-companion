import type { ZodSchema } from "zod";
import {
  aiActivityAnalysisSchema,
  aiCoachTipSchema,
  aiWeeklySummarySchema,
  aiWeeklyPlanResponseSchema,
  calculateTrainingLoad,
  evaluateTrainingAlerts,
  calculateWeeklyTSS,
  classifyActivityZone,
  type AIActivityAnalysis,
  type AICoachTip,
  type AIWeeklySummary,
  type AIWeeklyPlanResponse,
  type Activity,
  type TrainingActivityInput,
} from "shared";
import { anthropic } from "../anthropic.js";
import { supabaseAdmin } from "../supabase.js";
import { AppError } from "../../plugins/error-handler.js";
import { getProfile } from "../profile.service.js";
import { getActivity, listActivities } from "../activity.service.js";
import {
  PROMPT_VERSION,
  buildAnalyzeActivityPrompt,
  buildWeeklyPlanPrompt,
  buildWeeklySummaryPrompt,
  buildCoachTipPrompt,
} from "./prompts.js";
import {
  fallbackAnalyzeActivity,
  fallbackWeeklyPlan,
  fallbackWeeklySummary,
  fallbackCoachTip,
} from "./fallback.js";

const MODEL = "claude-sonnet-4-5-20250929";
const MAX_DAILY_CALLS = 20;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function callClaude(system: string, user: string, maxTokens = 2048): Promise<string> {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    temperature: 0.3,
    system,
    messages: [{ role: "user", content: user }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }
  return textBlock.text;
}

async function checkRateLimit(userId: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);

  const { count, error } = await supabaseAdmin
    .from("ai_cache")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", `${today}T00:00:00Z`);

  if (error) return; // Don't block on rate limit query failure

  if ((count ?? 0) >= MAX_DAILY_CALLS) {
    throw new AppError(
      `Has alcanzado el límite de ${MAX_DAILY_CALLS} consultas IA por día.`,
      429,
      "RATE_LIMITED",
    );
  }
}

async function getCachedResponse<T>(
  userId: string,
  cacheKey: string,
  schema: ZodSchema<T>,
): Promise<T | null> {
  const now = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("ai_cache")
    .select("response")
    .eq("user_id", userId)
    .eq("cache_key", cacheKey)
    .gt("expires_at", now)
    .single();

  if (error || !data) return null;

  const parsed = schema.safeParse(data.response);
  return parsed.success ? parsed.data : null;
}

async function cacheResponse(
  userId: string,
  cacheKey: string,
  endpoint: string,
  response: unknown,
  expiresAt: Date,
): Promise<void> {
  await supabaseAdmin.from("ai_cache").upsert(
    {
      user_id: userId,
      cache_key: cacheKey,
      endpoint,
      response,
      model: MODEL,
      prompt_version: PROMPT_VERSION,
      expires_at: expiresAt.toISOString(),
    },
    { onConflict: "user_id,cache_key" },
  );
}

function parseAndValidate<T>(raw: string, schema: ZodSchema<T>): T {
  const json = JSON.parse(raw);
  return schema.parse(json);
}

function getRecentActivities(activities: Activity[]): TrainingActivityInput[] {
  return activities.map((a) => ({
    date: a.date,
    duration_seconds: a.duration_seconds,
    avg_power_watts: a.avg_power_watts,
    tss: a.tss,
  }));
}

function getWeekDates(weekStart: string): Array<{ day: string; date: string }> {
  const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const start = new Date(weekStart);
  return days.map((day, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return { day, date: d.toISOString().slice(0, 10) };
  });
}

function getWeekStart(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayOfWeek = d.getUTCDay();
  const diff = d.getUTCDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  d.setUTCDate(diff);
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Exported functions
// ---------------------------------------------------------------------------

export async function analyzeActivity(
  userId: string,
  activityId: string,
): Promise<AIActivityAnalysis> {
  await checkRateLimit(userId);

  const cacheKey = `analyze_activity_${activityId}`;
  const cached = await getCachedResponse(userId, cacheKey, aiActivityAnalysisSchema);
  if (cached) return cached;

  const [profile, activity, recent] = await Promise.all([
    getProfile(userId),
    getActivity(userId, activityId),
    listActivities({ userId, limit: 14 }),
  ]);

  const trainingInputs = getRecentActivities(recent.data);
  const today = new Date().toISOString().slice(0, 10);
  const trainingLoad = calculateTrainingLoad(trainingInputs, today);
  const zone = classifyActivityZone(activity.avg_power_watts, profile.ftp ?? null);

  const weekStart = getWeekStart(new Date());
  const weeklyTSS = calculateWeeklyTSS(trainingInputs, weekStart);
  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);
  const avgWeeklyTSS = calculateWeeklyTSS(trainingInputs, prevWeekStart.toISOString().slice(0, 10));

  const alerts = evaluateTrainingAlerts({
    weeklyTSS,
    avgWeeklyTSS,
    recentActivities: recent.data.map((a) => ({
      date: a.date,
      tss: a.tss,
      rpe: a.rpe,
    })),
    trainingLoad,
    ctlPreviousWeek: trainingLoad.ctl,
    lastActivityDate: recent.data[0]?.date ?? null,
    today,
  });

  try {
    const prompt = buildAnalyzeActivityPrompt({
      profile,
      activity,
      recentActivities: recent.data,
      trainingLoad,
      alerts,
      zone,
    });

    const raw = await callClaude(prompt.system, prompt.user, 1024);
    const result = parseAndValidate(raw, aiActivityAnalysisSchema);

    // Persist to activity and cache
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await Promise.all([
      supabaseAdmin
        .from("activities")
        .update({ ai_analysis: result })
        .eq("id", activityId)
        .eq("user_id", userId),
      cacheResponse(userId, cacheKey, "analyze-activity", result, expiresAt),
    ]);

    return result;
  } catch {
    return fallbackAnalyzeActivity(activity, profile, trainingLoad, alerts);
  }
}

export async function generateWeeklyPlan(
  userId: string,
  weekStart?: string,
  forceRegenerate?: boolean,
): Promise<AIWeeklyPlanResponse> {
  await checkRateLimit(userId);

  const effectiveWeekStart = weekStart ?? getWeekStart(new Date());
  const cacheKey = `weekly_plan_${effectiveWeekStart}`;

  if (!forceRegenerate) {
    const cached = await getCachedResponse(userId, cacheKey, aiWeeklyPlanResponseSchema);
    if (cached) return cached;
  }

  const [profile, recent] = await Promise.all([
    getProfile(userId),
    listActivities({ userId, limit: 14 }),
  ]);

  const trainingInputs = getRecentActivities(recent.data);
  const today = new Date().toISOString().slice(0, 10);
  const trainingLoad = calculateTrainingLoad(trainingInputs, today);

  const weeklyTSS = calculateWeeklyTSS(trainingInputs, getWeekStart(new Date()));
  const prevWeekStart = new Date(getWeekStart(new Date()));
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);
  const avgWeeklyTSS = calculateWeeklyTSS(trainingInputs, prevWeekStart.toISOString().slice(0, 10));

  const alerts = evaluateTrainingAlerts({
    weeklyTSS,
    avgWeeklyTSS,
    recentActivities: recent.data.map((a) => ({
      date: a.date,
      tss: a.tss,
      rpe: a.rpe,
    })),
    trainingLoad,
    ctlPreviousWeek: trainingLoad.ctl,
    lastActivityDate: recent.data[0]?.date ?? null,
    today,
  });

  const weekDates = getWeekDates(effectiveWeekStart);

  try {
    const prompt = buildWeeklyPlanPrompt({
      profile,
      recentActivities: recent.data,
      trainingLoad,
      alerts,
      weekDates,
    });

    const raw = await callClaude(prompt.system, prompt.user, 2048);
    const result = parseAndValidate(raw, aiWeeklyPlanResponseSchema);

    // Persist to weekly_plans (upsert) and cache
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const planDays = result.days.map((d) => ({
      ...d,
      done: false,
      actual_power: null,
    }));

    await Promise.all([
      supabaseAdmin.from("weekly_plans").upsert(
        {
          user_id: userId,
          week_start: effectiveWeekStart,
          plan_data: { days: planDays },
          ai_rationale: result.rationale,
        },
        { onConflict: "user_id,week_start" },
      ),
      cacheResponse(userId, cacheKey, "weekly-plan", result, expiresAt),
    ]);

    return result;
  } catch {
    const fallback = fallbackWeeklyPlan(weekDates, profile, trainingLoad, alerts);

    // Persist fallback too
    const planDays = fallback.days.map((d) => ({
      ...d,
      done: false,
      actual_power: null,
    }));

    await supabaseAdmin.from("weekly_plans").upsert(
      {
        user_id: userId,
        week_start: effectiveWeekStart,
        plan_data: { days: planDays },
        ai_rationale: fallback.rationale,
      },
      { onConflict: "user_id,week_start" },
    );

    return fallback;
  }
}

export async function generateWeeklySummary(
  userId: string,
  periodAStart: string,
  periodAEnd: string,
  periodBStart: string,
  periodBEnd: string,
): Promise<AIWeeklySummary> {
  await checkRateLimit(userId);

  const cacheKey = `weekly_summary_${periodAStart}_${periodBStart}`;
  const cached = await getCachedResponse(userId, cacheKey, aiWeeklySummarySchema);
  if (cached) return cached;

  const [profile, recentResult] = await Promise.all([
    getProfile(userId),
    listActivities({ userId, limit: 30 }),
  ]);

  const allActivities = recentResult.data;
  const trainingInputs = getRecentActivities(allActivities);
  const today = new Date().toISOString().slice(0, 10);
  const trainingLoad = calculateTrainingLoad(trainingInputs, today);

  // Aggregate period metrics
  const periodAActivities = allActivities.filter(
    (a) => a.date >= periodAStart && a.date <= periodAEnd,
  );
  const periodBActivities = allActivities.filter(
    (a) => a.date >= periodBStart && a.date <= periodBEnd,
  );

  const avgPower = (acts: Activity[]) => {
    const powers = acts.map((a) => a.avg_power_watts).filter((v): v is number => v != null);
    return powers.length > 0 ? Math.round(powers.reduce((s, v) => s + v, 0) / powers.length) : null;
  };

  const periodA = {
    start: periodAStart,
    end: periodAEnd,
    sessionCount: periodAActivities.length,
    totalTSS: periodAActivities.reduce((s, a) => s + (a.tss ?? 0), 0),
    avgPower: avgPower(periodAActivities),
  };

  const periodB = {
    start: periodBStart,
    end: periodBEnd,
    sessionCount: periodBActivities.length,
    totalTSS: periodBActivities.reduce((s, a) => s + (a.tss ?? 0), 0),
    avgPower: avgPower(periodBActivities),
  };

  const weeklyTSS = calculateWeeklyTSS(trainingInputs, getWeekStart(new Date()));
  const prevWeekStart = new Date(getWeekStart(new Date()));
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);
  const avgWeeklyTSS = calculateWeeklyTSS(trainingInputs, prevWeekStart.toISOString().slice(0, 10));

  const alerts = evaluateTrainingAlerts({
    weeklyTSS,
    avgWeeklyTSS,
    recentActivities: allActivities.map((a) => ({
      date: a.date,
      tss: a.tss,
      rpe: a.rpe,
    })),
    trainingLoad,
    ctlPreviousWeek: trainingLoad.ctl,
    lastActivityDate: allActivities[0]?.date ?? null,
    today,
  });

  try {
    const prompt = buildWeeklySummaryPrompt({
      profile,
      periodA,
      periodB,
      trainingLoad,
      alerts,
    });

    const raw = await callClaude(prompt.system, prompt.user, 1024);
    const result = parseAndValidate(raw, aiWeeklySummarySchema);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1);
    await cacheResponse(userId, cacheKey, "weekly-summary", result, expiresAt);

    return result;
  } catch {
    return fallbackWeeklySummary(periodA, periodB, alerts);
  }
}

export async function getCoachTip(userId: string): Promise<AICoachTip> {
  await checkRateLimit(userId);

  const today = new Date().toISOString().slice(0, 10);
  const cacheKey = `coach_tip_${today}`;
  const cached = await getCachedResponse(userId, cacheKey, aiCoachTipSchema);
  if (cached) return cached;

  const [profile, recent] = await Promise.all([
    getProfile(userId),
    listActivities({ userId, limit: 14 }),
  ]);

  const trainingInputs = getRecentActivities(recent.data);
  const trainingLoad = calculateTrainingLoad(trainingInputs, today);
  const lastActivity = recent.data[0] ?? null;

  const weeklyTSS = calculateWeeklyTSS(trainingInputs, getWeekStart(new Date()));
  const prevWeekStart = new Date(getWeekStart(new Date()));
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);
  const avgWeeklyTSS = calculateWeeklyTSS(trainingInputs, prevWeekStart.toISOString().slice(0, 10));

  const alerts = evaluateTrainingAlerts({
    weeklyTSS,
    avgWeeklyTSS,
    recentActivities: recent.data.map((a) => ({
      date: a.date,
      tss: a.tss,
      rpe: a.rpe,
    })),
    trainingLoad,
    ctlPreviousWeek: trainingLoad.ctl,
    lastActivityDate: lastActivity?.date ?? null,
    today,
  });

  try {
    const prompt = buildCoachTipPrompt({
      profile,
      lastActivity,
      trainingLoad,
      alerts,
    });

    const raw = await callClaude(prompt.system, prompt.user, 512);
    const result = parseAndValidate(raw, aiCoachTipSchema);

    // Cache for the rest of the day
    const expiresAt = new Date(`${today}T23:59:59Z`);
    await cacheResponse(userId, cacheKey, "coach-tip", result, expiresAt);

    return result;
  } catch {
    return fallbackCoachTip(profile, lastActivity, trainingLoad, alerts);
  }
}
