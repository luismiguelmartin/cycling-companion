import type { FastifyInstance } from "fastify";
import type { ActivityCreate } from "shared";
import {
  listActivities,
  getActivity,
  createActivity,
  updateActivity,
  deleteActivity,
  getActivityMetrics,
} from "../services/activity.service.js";
import { getProfile } from "../services/profile.service.js";

export default async function activityRoutes(fastify: FastifyInstance) {
  fastify.get("/activities", async (request) => {
    const query = request.query as {
      page?: string;
      limit?: string;
      type?: string;
      date_from?: string;
      date_to?: string;
      search?: string;
    };
    const result = await listActivities({
      userId: request.userId,
      page: query.page ? Number(query.page) : undefined,
      limit: query.limit ? Number(query.limit) : undefined,
      type: query.type,
      dateFrom: query.date_from,
      dateTo: query.date_to,
      search: query.search,
    });
    return result;
  });

  fastify.get("/activities/:id", async (request) => {
    const { id } = request.params as { id: string };
    const activity = await getActivity(request.userId, id);
    return { data: activity };
  });

  fastify.post("/activities", async (request, reply) => {
    const profile = await getProfile(request.userId);
    const activity = await createActivity(
      request.userId,
      request.body as ActivityCreate,
      profile.ftp,
    );
    return reply.status(201).send({ data: activity });
  });

  fastify.patch("/activities/:id", async (request) => {
    const { id } = request.params as { id: string };
    const activity = await updateActivity(
      request.userId,
      id,
      request.body as Partial<ActivityCreate>,
    );
    return { data: activity };
  });

  fastify.delete("/activities/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    await deleteActivity(request.userId, id);
    return reply.status(204).send();
  });

  fastify.get("/activities/:id/metrics", async (request) => {
    const { id } = request.params as { id: string };
    const metrics = await getActivityMetrics(request.userId, id);
    return { data: metrics };
  });
}
