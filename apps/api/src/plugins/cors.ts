import cors from "@fastify/cors";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { env } from "../config/env.js";

/**
 * CORS plugin para permitir peticiones desde el frontend.
 * Acepta FRONTEND_URL y localhost para desarrollo.
 */
async function corsPlugin(fastify: FastifyInstance) {
  const allowedOrigins = [env.FRONTEND_URL];
  if (!env.FRONTEND_URL.includes("localhost")) {
    allowedOrigins.push("http://localhost:3000");
  }

  await fastify.register(cors, {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  });
}

export default fp(corsPlugin);
