import type { FastifyInstance } from "fastify";
import { AppError } from "../plugins/error-handler.js";
import {
  analyzeActivity,
  generateWeeklyPlan,
  generateWeeklySummary,
  getCoachTip,
} from "../services/ai/ai.service.js";

export default async function aiRoutes(fastify: FastifyInstance) {
  fastify.post("/ai/analyze-activity", async (request) => {
    const { activity_id } = request.body as { activity_id?: string };

    if (!activity_id) {
      throw new AppError("Missing required field: activity_id", 400, "BAD_REQUEST");
    }

    const analysis = await analyzeActivity(request.userId, activity_id);
    return { data: analysis };
  });

  fastify.post("/ai/weekly-plan", async (request) => {
    const { week_start, force_regenerate } = (request.body ?? {}) as {
      week_start?: string;
      force_regenerate?: boolean;
    };

    const result = await generateWeeklyPlan(request.userId, week_start, force_regenerate);
    return { data: result };
  });

  fastify.post("/ai/weekly-summary", async (request) => {
    const body = request.body as {
      period_a_start?: string;
      period_a_end?: string;
      period_b_start?: string;
      period_b_end?: string;
    };

    const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
    const { period_a_start, period_a_end, period_b_start, period_b_end } = body;

    if (!period_a_start || !period_a_end || !period_b_start || !period_b_end) {
      throw new AppError(
        "Missing required fields: period_a_start, period_a_end, period_b_start, period_b_end",
        400,
        "BAD_REQUEST",
      );
    }

    if (
      !DATE_RE.test(period_a_start) ||
      !DATE_RE.test(period_a_end) ||
      !DATE_RE.test(period_b_start) ||
      !DATE_RE.test(period_b_end)
    ) {
      throw new AppError("Date fields must be YYYY-MM-DD format", 400, "BAD_REQUEST");
    }

    const summary = await generateWeeklySummary(
      request.userId,
      period_a_start,
      period_a_end,
      period_b_start,
      period_b_end,
    );
    return { data: summary };
  });

  fastify.get("/ai/coach-tip", async (request) => {
    const tip = await getCoachTip(request.userId);
    return { data: tip };
  });
}
