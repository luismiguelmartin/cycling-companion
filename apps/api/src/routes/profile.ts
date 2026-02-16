import type { FastifyInstance } from "fastify";
import type { OnboardingData } from "shared";
import { AppError } from "../plugins/error-handler.js";
import { getProfile, updateProfile } from "../services/profile.service.js";

export default async function profileRoutes(fastify: FastifyInstance) {
  fastify.get("/profile", async (request) => {
    const profile = await getProfile(request.userId);
    return { data: profile };
  });

  fastify.patch("/profile", async (request) => {
    const body = request.body;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new AppError("Request body must be a JSON object", 400, "BAD_REQUEST");
    }
    const profile = await updateProfile(request.userId, body as Partial<OnboardingData>);
    return { data: profile };
  });
}
