import type { FastifyInstance, FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";

/**
 * Custom application error with status code and error code
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = "INTERNAL_ERROR",
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * Standard error response format
 */
interface ErrorResponse {
  error: string;
  code: string;
  details?: unknown;
}

/**
 * Fastify plugin for centralized error handling
 */
export async function errorHandler(fastify: FastifyInstance) {
  fastify.setErrorHandler(
    (
      error: FastifyError | AppError | ZodError | Error,
      request: FastifyRequest,
      reply: FastifyReply,
    ) => {
      // 1. Handle Zod validation errors
      if (error instanceof ZodError) {
        const response: ErrorResponse = {
          error: "Validation failed",
          code: "VALIDATION_ERROR",
        };

        // Include validation details only in development
        if (process.env.NODE_ENV !== "production") {
          response.details = error.issues;
        }

        return reply.status(400).send(response);
      }

      // 2. Handle custom AppError
      if (error instanceof AppError) {
        const response: ErrorResponse = {
          error: error.message,
          code: error.code,
        };

        // Log 5xx errors
        if (error.statusCode >= 500) {
          request.log.error(error);
        }

        return reply.status(error.statusCode).send(response);
      }

      // 3. Handle Fastify errors with statusCode
      if ("statusCode" in error && typeof error.statusCode === "number") {
        const statusCode = error.statusCode;
        const response: ErrorResponse = {
          error: error.message,
          code: getErrorCode(statusCode),
        };

        // Log 5xx errors
        if (statusCode >= 500) {
          request.log.error(error);
        }

        return reply.status(statusCode).send(response);
      }

      // 4. Handle generic errors (500 Internal Server Error)
      request.log.error(error);

      const response: ErrorResponse = {
        error: process.env.NODE_ENV === "production" ? "Internal server error" : error.message,
        code: "INTERNAL_ERROR",
      };

      return reply.status(500).send(response);
    },
  );
}

/**
 * Get error code from HTTP status code
 */
function getErrorCode(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return "BAD_REQUEST";
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    case 422:
      return "UNPROCESSABLE_ENTITY";
    case 429:
      return "TOO_MANY_REQUESTS";
    case 500:
      return "INTERNAL_ERROR";
    case 502:
      return "BAD_GATEWAY";
    case 503:
      return "SERVICE_UNAVAILABLE";
    case 504:
      return "GATEWAY_TIMEOUT";
    default:
      return statusCode >= 500 ? "INTERNAL_ERROR" : "CLIENT_ERROR";
  }
}
