import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { supabaseAdmin } from "../services/supabase.js";

/**
 * Plugin de autenticación JWT para Supabase.
 *
 * Verifica el token Bearer en el header Authorization y decora el request
 * con userId y userEmail si el token es válido.
 *
 * @example
 * // Registrar en rutas protegidas:
 * app.register(authPlugin, { prefix: '/api/v1' });
 */
const authPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorateRequest("userId", "");
  fastify.decorateRequest("userEmail", "");

  fastify.addHook("onRequest", async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    try {
      const {
        data: { user },
        error,
      } = await supabaseAdmin.auth.getUser(token);

      if (error || !user) {
        return reply.status(401).send({ error: "Unauthorized" });
      }

      // Decorate request with user info
      request.userId = user.id;
      request.userEmail = user.email ?? "";
    } catch (err) {
      fastify.log.error({ err }, "Error verifying JWT token");
      return reply.status(401).send({ error: "Unauthorized" });
    }
  });
};

export default fp(authPlugin);
