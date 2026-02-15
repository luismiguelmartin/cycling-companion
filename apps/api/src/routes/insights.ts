import type { FastifyInstance } from "fastify";
import { AppError } from "../plugins/error-handler.js";
import { getInsights, checkOverload } from "../services/insights.service.js";

export default async function insightsRoutes(fastify: FastifyInstance) {
  fastify.get("/insights", async (request) => {
    const query = request.query as {
      period_a_start?: string;
      period_a_end?: string;
      period_b_start?: string;
      period_b_end?: string;
    };

    if (
      !query.period_a_start ||
      !query.period_a_end ||
      !query.period_b_start ||
      !query.period_b_end
    ) {
      throw new AppError(
        "Missing required query params: period_a_start, period_a_end, period_b_start, period_b_end",
        400,
        "BAD_REQUEST",
      );
    }

    const result = await getInsights(
      request.userId,
      query.period_a_start,
      query.period_a_end,
      query.period_b_start,
      query.period_b_end,
    );

    return { data: result };
  });

  fastify.get("/insights/overload-check", async (request) => {
    const result = await checkOverload(request.userId);
    return { data: result };
  });
}
