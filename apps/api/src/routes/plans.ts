import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { planDaySchema } from "shared";
import { AppError } from "../plugins/error-handler.js";
import { getPlan, updatePlan, deletePlan } from "../services/plan.service.js";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const updatePlanBodySchema = z.object({
  week_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  days: z.array(planDaySchema).length(7),
});

export default async function planRoutes(fastify: FastifyInstance) {
  fastify.get("/plan", async (request) => {
    const { week_start } = request.query as { week_start?: string };
    if (week_start && !DATE_RE.test(week_start)) {
      throw new AppError("week_start must be YYYY-MM-DD format", 400, "BAD_REQUEST");
    }
    const plan = await getPlan(request.userId, week_start);
    return { data: plan };
  });

  fastify.patch("/plan", async (request) => {
    const parsed = updatePlanBodySchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError("Datos inválidos", 400, "BAD_REQUEST");
    }

    const result = await updatePlan(request.userId, parsed.data.week_start, parsed.data.days);
    return { data: result };
  });

  fastify.delete("/plan", async (request, reply) => {
    const { week_start } = request.query as { week_start?: string };
    if (!week_start) {
      throw new AppError("Missing required query param: week_start", 400, "BAD_REQUEST");
    }
    if (!DATE_RE.test(week_start)) {
      throw new AppError("week_start must be YYYY-MM-DD format", 400, "BAD_REQUEST");
    }

    await deletePlan(request.userId, week_start);
    return reply.status(204).send();
  });
}
