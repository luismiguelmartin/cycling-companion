import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { AppError, errorHandler } from "./error-handler.js";

describe("AppError", () => {
  it("creates with default statusCode 500 and code INTERNAL_ERROR", () => {
    const error = new AppError("Something went wrong");
    expect(error.message).toBe("Something went wrong");
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe("INTERNAL_ERROR");
  });

  it("creates with custom statusCode and code", () => {
    const error = new AppError("Resource not found", 404, "NOT_FOUND");
    expect(error.message).toBe("Resource not found");
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe("NOT_FOUND");
  });

  it("has name AppError", () => {
    const error = new AppError("Test");
    expect(error.name).toBe("AppError");
  });

  it("is instanceof Error", () => {
    const error = new AppError("Test");
    expect(error).toBeInstanceOf(Error);
  });
});

describe("errorHandler plugin", () => {
  let app: FastifyInstance;
  const originalNodeEnv = process.env.NODE_ENV;

  async function buildTestApp() {
    const fastify = Fastify({ logger: false });
    await fastify.register(errorHandler);
    return fastify;
  }

  beforeEach(async () => {
    app = await buildTestApp();
  });

  afterEach(async () => {
    await app.close();
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("handles ZodError with 400 and VALIDATION_ERROR code", async () => {
    app.get("/test", async () => {
      throw new ZodError([
        {
          code: "invalid_type",
          expected: "string",
          received: "number",
          path: ["name"],
          message: "Expected string",
        },
      ]);
    });

    const response = await app.inject({ method: "GET", url: "/test" });
    expect(response.statusCode).toBe(400);
    const body = response.json();
    expect(body.error).toBe("Validation failed");
    expect(body.code).toBe("VALIDATION_ERROR");
  });

  it("includes ZodError details in development", async () => {
    delete process.env.NODE_ENV;
    app = await buildTestApp();
    app.get("/test", async () => {
      throw new ZodError([
        {
          code: "invalid_type",
          expected: "string",
          received: "number",
          path: ["email"],
          message: "Expected string, received number",
        },
      ]);
    });

    const response = await app.inject({ method: "GET", url: "/test" });
    expect(response.statusCode).toBe(400);
    const body = response.json();
    expect(body.details).toBeDefined();
    expect(Array.isArray(body.details)).toBe(true);
  });

  it("excludes ZodError details in production", async () => {
    process.env.NODE_ENV = "production";
    app = await buildTestApp();
    app.get("/test", async () => {
      const err = new ZodError([
        {
          code: "invalid_type",
          expected: "string",
          received: "number",
          path: ["name"],
          message: "Expected string",
        },
      ]);
      (err as ZodError & { statusCode: number }).statusCode = 400;
      throw err;
    });

    const response = await app.inject({ method: "GET", url: "/test" });
    expect(response.statusCode).toBe(400);
    const body = response.json();
    expect(body.details).toBeUndefined();
  });

  it("handles AppError 404 with NOT_FOUND code", async () => {
    app.get("/test", async () => {
      throw new AppError("Resource not found", 404, "NOT_FOUND");
    });

    const response = await app.inject({ method: "GET", url: "/test" });
    expect(response.statusCode).toBe(404);
    const body = response.json();
    expect(body.code).toBe("NOT_FOUND");
  });

  it("handles AppError 500", async () => {
    app.get("/test", async () => {
      throw new AppError("Internal error occurred");
    });

    const response = await app.inject({ method: "GET", url: "/test" });
    expect(response.statusCode).toBe(500);
    const body = response.json();
    expect(body.code).toBe("INTERNAL_ERROR");
  });

  it("handles generic Error with 500", async () => {
    app.get("/test", async () => {
      throw new Error("Something broke");
    });

    const response = await app.inject({ method: "GET", url: "/test" });
    expect(response.statusCode).toBe(500);
  });

  it("hides error details in production for generic errors", async () => {
    process.env.NODE_ENV = "production";
    app = await buildTestApp();
    app.get("/test", async () => {
      throw new Error("Sensitive internal details");
    });

    const response = await app.inject({ method: "GET", url: "/test" });
    expect(response.statusCode).toBe(500);
    const body = response.json();
    expect(body.error || body.message).not.toContain("Sensitive");
  });
});
