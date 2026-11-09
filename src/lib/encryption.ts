import crypto from "crypto";

const ENCRYPTION_PREFIX = "enc:v1:";
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH_BYTES = 12; // 96-bit IV recommended for AES-GCM

/**
 * Resolves a 32-byte Buffer key from environment variables or explicit override.
 * Priority:
 *   1. Explicit `keyOverride`
 *   2. `process.env.APP_ENCRYPTION_KEY`
 *   3. `process.env.ENCRYPTION_KEY`
 *   4. Fallback SHA-256 hash of `AUTH_SECRET` / `NEXTAUTH_SECRET`
 */
export function getEncryptionKey(keyOverride?: string): Buffer {
  const rawKey =
    keyOverride ||
    process.env.APP_ENCRYPTION_KEY ||
    process.env.ENCRYPTION_KEY ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET;

  if (!rawKey) {
    throw new Error(
      "Missing master encryption key. Please set APP_ENCRYPTION_KEY in your environment (run `npm run secret:keygen` to generate one)."
    );
  }

  // 1. If 64 hex characters (32 bytes)
  if (/^[0-9a-fA-F]{64}$/.test(rawKey)) {
    return Buffer.from(rawKey, "hex");
  }

  // 2. If valid 32-byte Base64 string
  if (/^[A-Za-z0-9+/=]{43,44}$/.test(rawKey)) {
    const buf = Buffer.from(rawKey, "base64");
    if (buf.length === 32) return buf;
  }

  // 3. Otherwise, derive deterministic 32-byte key using SHA-256
  return crypto.createHash("sha256").update(rawKey).digest();
}

/**
 * Generates a cryptographically secure 256-bit (64-character hex) master encryption key.
 */
export function generateMasterKey(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Tests whether a given string is an encrypted token.
 */
export function isEncrypted(value?: string | null): boolean {
  return typeof value === "string" && value.startsWith(ENCRYPTION_PREFIX);
}

/**
 * Encrypts a plaintext secret (such as an API key or password) using AES-256-GCM.
 * Output format: `enc:v1:<iv_hex>:<auth_tag_hex>:<ciphertext_hex>`
 */
export function encryptSecret(plaintext: string, keyOverride?: string): string {
  if (!plaintext) return "";
  const key = getEncryptionKey(keyOverride);
  const iv = crypto.randomBytes(IV_LENGTH_BYTES);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return `${ENCRYPTION_PREFIX}${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Decrypts a secret encrypted with `encryptSecret`.
 * If the input does not start with `enc:v1:`, it is treated as unencrypted and returned as-is.
 */
export function decryptSecret(value: string, keyOverride?: string): string {
  if (!value || typeof value !== "string") return value || "";
  if (!value.startsWith(ENCRYPTION_PREFIX)) {
    // Unencrypted legacy value: return directly
    return value;
  }

  const parts = value.slice(ENCRYPTION_PREFIX.length).split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted token format. Expected enc:v1:<iv>:<tag>:<ciphertext>");
  }

  const [ivHex, tagHex, cipherHex] = parts;
  const key = getEncryptionKey(keyOverride);
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(tagHex, "hex");
  const ciphertext = Buffer.from(cipherHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  try {
    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Failed to decrypt secret: Authentication tag mismatch or corrupted ciphertext. (${msg})`
    );
  }
}

