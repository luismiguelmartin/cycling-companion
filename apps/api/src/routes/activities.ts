import type { FastifyInstance } from "fastify";
import type { ActivityCreateInput, ActivityType } from "shared";
import {
  listActivities,
  getActivity,
  createActivity,
  updateActivity,
  deleteActivity,
  getActivityMetrics,
} from "../services/activity.service.js";
import { getProfile } from "../services/profile.service.js";
import { processUpload } from "../services/import.service.js";
import { AppError } from "../plugins/error-handler.js";

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
      request.body as ActivityCreateInput,
      profile.ftp,
    );
    return reply.status(201).send({ data: activity });
  });

  fastify.patch("/activities/:id", async (request) => {
    const { id } = request.params as { id: string };
    const activity = await updateActivity(
      request.userId,
      id,
      request.body as Partial<ActivityCreateInput>,
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

  fastify.post("/activities/upload", async (request, reply) => {
    const data = await request.file();

    if (!data) {
      throw new AppError("No se recibió ningún archivo", 400, "BAD_REQUEST");
    }

    const fileName = data.filename;
    const ext = fileName.toLowerCase().split(".").pop();
    if (ext !== "fit" && ext !== "gpx") {
      throw new AppError("Formato no soportado. Usa .fit o .gpx", 400, "UNSUPPORTED_FORMAT");
    }

    const fileBuffer = await data.toBuffer();

    // Extraer overrides de los campos multipart
    const fields = data.fields;
    const name = (fields.name as { value?: string } | undefined)?.value;
    const type = (fields.type as { value?: string } | undefined)?.value as
      | ActivityType
      | undefined;
    const rpeStr = (fields.rpe as { value?: string } | undefined)?.value;
    const notes = (fields.notes as { value?: string } | undefined)?.value;

    const rpe = rpeStr ? parseInt(rpeStr, 10) : undefined;

    const result = await processUpload(request.userId, fileBuffer, fileName, {
      name: name || undefined,
      type: type || undefined,
      rpe: rpe && !isNaN(rpe) ? rpe : undefined,
      notes: notes || undefined,
    });

    const activity = await getActivity(request.userId, result.activityId);

    return reply.status(201).send({
      data: { ...activity, metrics_count: result.metricsCount },
    });
  });
}
