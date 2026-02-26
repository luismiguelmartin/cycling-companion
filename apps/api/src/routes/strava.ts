import crypto from "node:crypto";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { STRAVA_CONFIG } from "shared";
import { AppError } from "../plugins/error-handler.js";
import {
  exchangeAuthCode,
  getStravaConnection,
  getStravaConnectionByAthleteId,
  saveStravaConnection,
  deleteStravaConnection,
  deauthorizeAthlete,
  processWebhookEvent,
  backfillStravaActivities,
} from "../services/strava/index.js";
import { supabaseAdmin } from "../services/supabase.js";

const STATE_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutos

function getStravaEnv() {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;
  const backendUrl = process.env.BACKEND_URL;
  const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";

  if (!clientId || !clientSecret) {
    throw new AppError("Strava integration not configured", 503, "STRAVA_NOT_CONFIGURED");
  }

  return { clientId, clientSecret, backendUrl: backendUrl ?? "http://localhost:3001", frontendUrl };
}

function generateState(userId: string, clientSecret: string): string {
  const timestamp = Date.now().toString();
  const nonce = crypto.randomBytes(16).toString("hex");
  const hmac = crypto
    .createHmac("sha256", clientSecret)
    .update(`${userId}:${timestamp}:${nonce}`)
    .digest("hex");
  return `${userId}:${timestamp}:${nonce}:${hmac}`;
}

function verifyState(state: string, clientSecret: string): { valid: boolean; userId: string } {
  const parts = state.split(":");
  if (parts.length !== 4) return { valid: false, userId: "" };

  const [userId, timestamp, nonce, hmac] = parts;
  if (!userId || !timestamp || !nonce || !hmac) return { valid: false, userId: "" };

  // Verificar que no haya expirado
  const elapsed = Date.now() - Number(timestamp);
  if (isNaN(elapsed) || elapsed > STATE_MAX_AGE_MS || elapsed < 0) {
    return { valid: false, userId: "" };
  }

  // Verificar HMAC
  const expectedHmac = crypto
    .createHmac("sha256", clientSecret)
    .update(`${userId}:${timestamp}:${nonce}`)
    .digest("hex");

  if (!crypto.timingSafeEqual(Buffer.from(hmac, "hex"), Buffer.from(expectedHmac, "hex"))) {
    return { valid: false, userId: "" };
  }

  return { valid: true, userId };
}

/** Rutas protegidas de Strava (requieren auth) */
export async function stravaProtectedRoutes(fastify: FastifyInstance) {
  // GET /strava/auth-url — Genera URL de autorización OAuth
  fastify.get("/strava/auth-url", async (request: FastifyRequest) => {
    const { clientId, clientSecret, backendUrl } = getStravaEnv();

    const state = generateState(request.userId, clientSecret);
    const redirectUri = `${backendUrl}/api/v1/strava/callback`;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: STRAVA_CONFIG.DEFAULT_SCOPE,
      approval_prompt: "auto",
      state,
    });

    return { data: { url: `${STRAVA_CONFIG.OAUTH_AUTHORIZE}?${params.toString()}` } };
  });

  // GET /strava/status — Estado de conexión
  fastify.get("/strava/status", async (request: FastifyRequest) => {
    const connection = await getStravaConnection(request.userId);

    if (!connection) {
      return {
        data: {
          connected: false,
          athlete_name: null,
          strava_athlete_id: null,
          connected_at: null,
          last_sync_at: null,
          activities_count: 0,
        },
      };
    }

    // Contar actividades importadas de Strava
    const { count, error } = await supabaseAdmin
      .from("activities")
      .select("id", { count: "exact", head: true })
      .eq("user_id", request.userId)
      .eq("source", "strava");

    if (error) {
      fastify.log.error({ error }, "Error contando actividades Strava");
    }

    return {
      data: {
        connected: true,
        strava_athlete_id: connection.strava_athlete_id,
        connected_at: connection.connected_at.toISOString(),
        last_sync_at: connection.last_sync_at?.toISOString() ?? null,
        activities_count: count ?? 0,
      },
    };
  });

  // DELETE /strava/disconnect — Desconectar Strava
  fastify.delete("/strava/disconnect", async (request: FastifyRequest) => {
    const connection = await getStravaConnection(request.userId);

    if (!connection) {
      throw new AppError("No hay conexión con Strava", 404, "STRAVA_NOT_CONNECTED");
    }

    // Revocar acceso en Strava (best-effort, no bloquear si falla)
    try {
      await deauthorizeAthlete(connection.access_token);
    } catch {
      // Ignorar errores de revocación — seguimos desconectando localmente
    }

    await deleteStravaConnection(request.userId);

    return { data: { disconnected: true } };
  });

  // POST /strava/sync — Backfill manual de actividades
  fastify.post("/strava/sync", async (request: FastifyRequest<{ Body: { count?: number } }>) => {
    const connection = await getStravaConnection(request.userId);
    if (!connection) {
      throw new AppError("No hay conexión con Strava", 404, "STRAVA_NOT_CONNECTED");
    }

    const count = (request.body as { count?: number })?.count ?? 30;
    if (typeof count !== "number" || count < 1 || count > 100) {
      throw new AppError("count debe estar entre 1 y 100", 400, "BAD_REQUEST");
    }

    const result = await backfillStravaActivities(request.userId, { count });
    return { data: result };
  });
}

/** Ruta pública de callback OAuth (no requiere auth) */
export async function stravaPublicRoutes(fastify: FastifyInstance) {
  // GET /strava/callback — Callback OAuth de Strava
  fastify.get(
    "/strava/callback",
    async (
      request: FastifyRequest<{
        Querystring: { code?: string; scope?: string; state?: string; error?: string };
      }>,
      reply: FastifyReply,
    ) => {
      const { clientSecret, frontendUrl } = getStravaEnv();
      const { code, scope, state, error: stravaError } = request.query;

      const errorRedirect = (reason: string) =>
        reply.redirect(`${frontendUrl}/profile?strava=error&reason=${reason}`);

      // Si Strava devuelve error (e.g. usuario denegó acceso)
      if (stravaError) {
        return errorRedirect("access_denied");
      }

      // Verificar que tenemos code y state
      if (!code || !state) {
        return errorRedirect("invalid_state");
      }

      // Verificar CSRF state
      const { valid, userId } = verifyState(state, clientSecret);
      if (!valid) {
        return errorRedirect("invalid_state");
      }

      // Verificar scope
      if (!scope || !scope.includes("activity:read_all")) {
        return errorRedirect("insufficient_scope");
      }

      // Intercambiar code por tokens
      let tokens;
      try {
        tokens = await exchangeAuthCode(code);
      } catch {
        return errorRedirect("exchange_failed");
      }

      // Verificar que el atleta no esté ya vinculado a otro usuario
      const existing = await getStravaConnectionByAthleteId(tokens.athlete.id);
      if (existing && existing.user_id !== userId) {
        return errorRedirect("already_connected");
      }

      // Guardar conexión
      await saveStravaConnection(userId, tokens);

      return reply.redirect(`${frontendUrl}/profile?strava=connected`);
    },
  );

  // GET /strava/webhook — Validación de suscripción (Strava challenge)
  fastify.get(
    "/strava/webhook",
    async (
      request: FastifyRequest<{
        Querystring: {
          "hub.mode"?: string;
          "hub.challenge"?: string;
          "hub.verify_token"?: string;
        };
      }>,
      reply: FastifyReply,
    ) => {
      const mode = request.query["hub.mode"];
      const challenge = request.query["hub.challenge"];
      const verifyToken = request.query["hub.verify_token"];
      const expectedToken = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN;

      if (mode === "subscribe" && challenge && expectedToken && verifyToken === expectedToken) {
        return reply.status(200).send({ "hub.challenge": challenge });
      }

      return reply.status(403).send({ error: "Forbidden" });
    },
  );

  // POST /strava/webhook — Recepción de eventos (fire-and-forget)
  fastify.post("/strava/webhook", async (request: FastifyRequest, reply: FastifyReply) => {
    // Responder 200 inmediatamente — Strava requiere respuesta en < 2 segundos
    void reply.status(200).send("EVENT_RECEIVED");

    // Procesar evento en background
    const body = request.body as Record<string, unknown> | null;
    if (body && typeof body === "object" && body.object_type && body.owner_id) {
      processWebhookEvent(body as unknown as Parameters<typeof processWebhookEvent>[0]).catch(
        (err) => {
          request.log.error({ err }, "Error procesando webhook Strava");
        },
      );
    }
  });
}
