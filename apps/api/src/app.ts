import Fastify, { FastifyInstance, FastifyServerOptions } from "fastify";
import corsPlugin from "./plugins/cors.js";
import { errorHandler } from "./plugins/error-handler.js";
import authPlugin from "./plugins/auth.js";
import healthRoutes from "./routes/health.js";
import profileRoutes from "./routes/profile.js";
import activityRoutes from "./routes/activities.js";
import insightsRoutes from "./routes/insights.js";
import aiRoutes from "./routes/ai.js";

/**
 * Factory function to build and configure the Fastify application.
 * Separated from index.ts to facilitate testing.
 *
 * @param opts - Fastify server options (logger, etc.)
 * @returns Configured Fastify instance
 */
export async function buildApp(opts: FastifyServerOptions = {}): Promise<FastifyInstance> {
  const fastify = Fastify(opts);

  // 1. Register CORS plugin
  await fastify.register(corsPlugin);

  // 2. Register error handler plugin
  await fastify.register(errorHandler);

  // 3. Register health routes (no prefix, public route)
  await fastify.register(healthRoutes);

  // 4. Register protected routes with /api/v1 prefix
  await fastify.register(
    async function protectedRoutes(scope) {
      await scope.register(authPlugin);
      await scope.register(profileRoutes);
      await scope.register(activityRoutes);
      await scope.register(insightsRoutes);
      await scope.register(aiRoutes);
    },
    { prefix: "/api/v1" },
  );

  return fastify;
}
