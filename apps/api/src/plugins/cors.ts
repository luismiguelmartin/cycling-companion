import cors from "@fastify/cors";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { env } from "../config/env.js";

/**
 * CORS plugin para permitir peticiones desde el frontend.
 * Configura origen, métodos, headers y credentials según variables de entorno.
 */
async function corsPlugin(fastify: FastifyInstance) {
  await fastify.register(cors, {
    origin: env.FRONTEND_URL,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  });
}

export default fp(corsPlugin);
