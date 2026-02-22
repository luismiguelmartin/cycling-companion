import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { activityCreateSchema, activityTypeEnum } from "shared";
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

const MAX_LIMIT = 100;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateUUID(id: string): void {
  if (!UUID_RE.test(id)) {
    throw new AppError("Invalid UUID format", 400, "BAD_REQUEST");
  }
}

const uploadOverridesSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  type: activityTypeEnum.optional(),
  rpe: z.coerce.number().int().min(1).max(10).optional(),
  notes: z.string().max(1000).optional(),
});

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

    const page = query.page ? Math.max(1, Math.floor(Number(query.page) || 1)) : undefined;
    const limit = query.limit
      ? Math.min(MAX_LIMIT, Math.max(1, Math.floor(Number(query.limit) || 20)))
      : undefined;

    const result = await listActivities({
      userId: request.userId,
      page,
      limit,
      type: query.type,
      dateFrom: query.date_from && DATE_RE.test(query.date_from) ? query.date_from : undefined,
      dateTo: query.date_to && DATE_RE.test(query.date_to) ? query.date_to : undefined,
      search: query.search,
    });
    return result;
  });

  fastify.get("/activities/:id", async (request) => {
    const { id } = request.params as { id: string };
    validateUUID(id);
    const activity = await getActivity(request.userId, id);
    return { data: activity };
  });

  fastify.post("/activities", async (request, reply) => {
    const parsed = activityCreateSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError("Datos de actividad inválidos", 400, "BAD_REQUEST");
    }
    const profile = await getProfile(request.userId);
    const activity = await createActivity(request.userId, parsed.data, profile.ftp);
    return reply.status(201).send({ data: activity });
  });

  fastify.patch("/activities/:id", async (request) => {
    const { id } = request.params as { id: string };
    validateUUID(id);
    const parsed = activityCreateSchema.partial().safeParse(request.body);
    if (!parsed.success) {
      throw new AppError("Datos de actividad inválidos", 400, "BAD_REQUEST");
    }
    const activity = await updateActivity(request.userId, id, parsed.data);
    return { data: activity };
  });

  fastify.delete("/activities/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    validateUUID(id);
    await deleteActivity(request.userId, id);
    return reply.status(204).send();
  });

  fastify.get("/activities/:id/metrics", async (request) => {
    const { id } = request.params as { id: string };
    validateUUID(id);
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

    // Extraer y validar overrides de los campos multipart
    const fields = data.fields;
    const rawOverrides = {
      name: (fields.name as { value?: string } | undefined)?.value || undefined,
      type: (fields.type as { value?: string } | undefined)?.value || undefined,
      rpe: (fields.rpe as { value?: string } | undefined)?.value || undefined,
      notes: (fields.notes as { value?: string } | undefined)?.value || undefined,
    };

    const parsedOverrides = uploadOverridesSchema.safeParse(rawOverrides);
    if (!parsedOverrides.success) {
      throw new AppError("Campos de actividad inválidos", 400, "BAD_REQUEST");
    }

    const result = await processUpload(request.userId, fileBuffer, fileName, parsedOverrides.data);

    const activity = await getActivity(request.userId, result.activityId);

    return reply.status(201).send({
      data: { ...activity, metrics_count: result.metricsCount },
    });
  });
}
