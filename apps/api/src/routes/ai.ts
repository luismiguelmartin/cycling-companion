import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { AppError } from "../plugins/error-handler.js";
import {
  analyzeActivity,
  generateWeeklyPlan,
  generateWeeklySummary,
  getCoachTip,
} from "../services/ai/ai.service.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const analyzeBodySchema = z.object({
  activity_id: z.string().regex(UUID_RE, "Invalid UUID format"),
});

const weeklyPlanBodySchema = z.object({
  week_start: z.string().regex(DATE_RE, "Must be YYYY-MM-DD").optional(),
  force_regenerate: z.boolean().optional(),
});

const weeklySummaryBodySchema = z.object({
  period_a_start: z.string().regex(DATE_RE, "Must be YYYY-MM-DD"),
  period_a_end: z.string().regex(DATE_RE, "Must be YYYY-MM-DD"),
  period_b_start: z.string().regex(DATE_RE, "Must be YYYY-MM-DD"),
  period_b_end: z.string().regex(DATE_RE, "Must be YYYY-MM-DD"),
});

export default async function aiRoutes(fastify: FastifyInstance) {
  fastify.post("/ai/analyze-activity", async (request) => {
    const parsed = analyzeBodySchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError("Missing or invalid field: activity_id", 400, "BAD_REQUEST");
    }

    const analysis = await analyzeActivity(request.userId, parsed.data.activity_id);
    return { data: analysis };
  });

  fastify.post("/ai/weekly-plan", async (request) => {
    const parsed = weeklyPlanBodySchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      throw new AppError("Invalid request body", 400, "BAD_REQUEST");
    }

    const result = await generateWeeklyPlan(
      request.userId,
      parsed.data.week_start,
      parsed.data.force_regenerate,
    );
    return { data: result };
  });

  fastify.post("/ai/weekly-summary", async (request) => {
    const parsed = weeklySummaryBodySchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError(
        "Missing or invalid date fields (YYYY-MM-DD): period_a_start, period_a_end, period_b_start, period_b_end",
        400,
        "BAD_REQUEST",
      );
    }

    const summary = await generateWeeklySummary(
      request.userId,
      parsed.data.period_a_start,
      parsed.data.period_a_end,
      parsed.data.period_b_start,
      parsed.data.period_b_end,
    );
    return { data: summary };
  });

  fastify.get("/ai/coach-tip", async (request) => {
    const tip = await getCoachTip(request.userId);
    return { data: tip };
  });
}
