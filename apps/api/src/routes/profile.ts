import type { FastifyInstance } from "fastify";
import type { OnboardingData } from "shared";
import { getProfile, updateProfile } from "../services/profile.service.js";

export default async function profileRoutes(fastify: FastifyInstance) {
  fastify.get("/profile", async (request) => {
    const profile = await getProfile(request.userId);
    return { data: profile };
  });

  fastify.patch("/profile", async (request) => {
    const profile = await updateProfile(request.userId, request.body as Partial<OnboardingData>);
    return { data: profile };
  });
}
