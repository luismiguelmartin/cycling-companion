import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { randomBytes } from "node:crypto";

// Generar clave de test antes de importar el módulo
const TEST_KEY = randomBytes(32).toString("base64");

describe("crypto utils", () => {
  let encrypt: typeof import("./crypto.js").encrypt;
  let decrypt: typeof import("./crypto.js").decrypt;

  beforeAll(async () => {
    process.env.STRAVA_TOKEN_ENCRYPTION_KEY = TEST_KEY;
    // Importar dinámicamente para que use la env var
    const mod = await import("./crypto.js");
    encrypt = mod.encrypt;
    decrypt = mod.decrypt;
  });

  afterAll(() => {
    delete process.env.STRAVA_TOKEN_ENCRYPTION_KEY;
  });

  it("cifra y descifra correctamente", () => {
    const plaintext = "my-secret-access-token-1234567890";
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it("produce cifrados distintos para el mismo input (IV random)", () => {
    const plaintext = "same-text";
    const encrypted1 = encrypt(plaintext);
    const encrypted2 = encrypt(plaintext);
    expect(encrypted1).not.toBe(encrypted2);
    // Pero ambos descifran al mismo valor
    expect(decrypt(encrypted1)).toBe(plaintext);
    expect(decrypt(encrypted2)).toBe(plaintext);
  });

  it("maneja strings vacíos", () => {
    const encrypted = encrypt("");
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe("");
  });

  it("maneja strings con caracteres especiales", () => {
    const plaintext = 'tøken-with-spëcial-chars!@#$%^&*()_+{}[]|\\:";<>?,./~`';
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it("maneja strings largos (tokens reales)", () => {
    const plaintext = randomBytes(256).toString("base64");
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it("produce formato correcto iv:authTag:ciphertext", () => {
    const encrypted = encrypt("test");
    const parts = encrypted.split(":");
    expect(parts).toHaveLength(3);
    // IV: 12 bytes = 24 hex chars
    expect(parts[0]).toHaveLength(24);
    // Auth tag: 16 bytes = 32 hex chars
    expect(parts[1]).toHaveLength(32);
    // Ciphertext: al menos algo
    expect(parts[2].length).toBeGreaterThan(0);
  });

  it("falla con ciphertext corrupto", () => {
    const encrypted = encrypt("test");
    const parts = encrypted.split(":");
    // Corromper el ciphertext
    const corrupted = `${parts[0]}:${parts[1]}:${parts[2].replace(/.$/, "0")}`;
    expect(() => decrypt(corrupted)).toThrow();
  });

  it("falla con auth tag corrupto", () => {
    const encrypted = encrypt("test");
    const parts = encrypted.split(":");
    const corrupted = `${parts[0]}:${"0".repeat(32)}:${parts[2]}`;
    expect(() => decrypt(corrupted)).toThrow();
  });

  it("falla con formato inválido", () => {
    expect(() => decrypt("not-valid-format")).toThrow("Invalid encrypted format");
  });

  it("falla sin STRAVA_TOKEN_ENCRYPTION_KEY", async () => {
    const originalKey = process.env.STRAVA_TOKEN_ENCRYPTION_KEY;
    delete process.env.STRAVA_TOKEN_ENCRYPTION_KEY;

    // Reimportar para resetear el estado
    vi.resetModules();
    const mod = await import("./crypto.js");

    expect(() => mod.encrypt("test")).toThrow("STRAVA_TOKEN_ENCRYPTION_KEY is not configured");

    process.env.STRAVA_TOKEN_ENCRYPTION_KEY = originalKey;
  });

  it("falla con clave de longitud incorrecta", async () => {
    const originalKey = process.env.STRAVA_TOKEN_ENCRYPTION_KEY;
    // 16 bytes en lugar de 32
    process.env.STRAVA_TOKEN_ENCRYPTION_KEY = randomBytes(16).toString("base64");

    vi.resetModules();
    const mod = await import("./crypto.js");

    expect(() => mod.encrypt("test")).toThrow("must be 32 bytes");

    process.env.STRAVA_TOKEN_ENCRYPTION_KEY = originalKey;
  });
});
