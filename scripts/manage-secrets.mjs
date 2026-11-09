#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const ENCRYPTION_PREFIX = "enc:v1:";
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH_BYTES = 12;

function loadKey(keyOverride) {
  if (keyOverride) {
    return parseKey(keyOverride);
  }

  // 1. Process env
  if (process.env.APP_ENCRYPTION_KEY) return parseKey(process.env.APP_ENCRYPTION_KEY);
  if (process.env.ENCRYPTION_KEY) return parseKey(process.env.ENCRYPTION_KEY);

  // 2. Check local env files for APP_ENCRYPTION_KEY
  for (const f of [".env.local", ".env", "env-us"]) {
    const fullPath = path.join(rootDir, f);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, "utf8");
      const match = content.match(/^(?:APP_ENCRYPTION_KEY|ENCRYPTION_KEY)\s*=\s*["']?([^"'\r\n]+)["']?/m);
      if (match && match[1]) {
        return parseKey(match[1]);
      }
    }
  }

  // 3. Fallback to AUTH_SECRET
  if (process.env.AUTH_SECRET) return parseKey(process.env.AUTH_SECRET);

  return null;
}

function parseKey(rawKey) {
  if (/^[0-9a-fA-F]{64}$/.test(rawKey)) {
    return Buffer.from(rawKey, "hex");
  }
  if (/^[A-Za-z0-9+/=]{43,44}$/.test(rawKey)) {
    const buf = Buffer.from(rawKey, "base64");
    if (buf.length === 32) return buf;
  }
  return crypto.createHash("sha256").update(rawKey).digest();
}

function encrypt(plaintext, keyBuffer) {
  const iv = crypto.randomBytes(IV_LENGTH_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${ENCRYPTION_PREFIX}${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

function decrypt(cipherToken, keyBuffer) {
  if (!cipherToken.startsWith(ENCRYPTION_PREFIX)) return cipherToken;
  const parts = cipherToken.slice(ENCRYPTION_PREFIX.length).split(":");
  if (parts.length !== 3) throw new Error("Invalid format. Expected enc:v1:<iv>:<tag>:<ciphertext>");
  const [ivHex, tagHex, cipherHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const ciphertext = Buffer.from(cipherHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString("utf8");
}

const args = process.argv.slice(2);
const command = args[0] || "help";

switch (command) {
  case "keygen": {
    const newKey = crypto.randomBytes(32).toString("hex");
    console.log("\n=======================================================");
    console.log("  New Master Encryption Key (256-bit AES-GCM)");
    console.log("=======================================================");
    console.log(`\nAPP_ENCRYPTION_KEY="${newKey}"\n`);
    console.log("Instructions:");
    console.log("1. Add this key to your .env.local and Vercel Environment Variables.");
    console.log("2. Keep this key safe and NEVER commit it to a public repository.");
    console.log("=======================================================\n");
    break;
  }

  case "encrypt": {
    const secret = args[1];
    if (!secret) {
      console.error("Usage: node scripts/manage-secrets.mjs encrypt <plaintext-secret> [key]");
      process.exit(1);
    }
    const key = loadKey(args[2]);
    if (!key) {
      console.error("\nError: No master encryption key found.");
      console.error("Please run `npm run secret:keygen` first or specify the key as argument.\n");
      process.exit(1);
    }
    const token = encrypt(secret, key);
    console.log("\nEncrypted Token (safe to store in env files / database):");
    console.log("-------------------------------------------------------");
    console.log(token);
    console.log("-------------------------------------------------------\n");
    break;
  }

  case "decrypt": {
    const token = args[1];
    if (!token) {
      console.error("Usage: node scripts/manage-secrets.mjs decrypt <enc:v1:...> [key]");
      process.exit(1);
    }
    const key = loadKey(args[2]);
    if (!key) {
      console.error("\nError: No master encryption key found.\n");
      process.exit(1);
    }
    try {
      const plaintext = decrypt(token, key);
      console.log("\nDecrypted Plaintext:");
      console.log("-------------------------------------------------------");
      console.log(plaintext);
      console.log("-------------------------------------------------------\n");
    } catch (e) {
      console.error("Decryption failed:", e.message);
      process.exit(1);
    }
    break;
  }

  case "test": {
    const testKey = crypto.randomBytes(32);
    const sample = "prod_sample_test_key_123456789";
    const enc = encrypt(sample, testKey);
    const dec = decrypt(enc, testKey);
    if (dec !== sample) throw new Error("Self-test failed: plaintext mismatch!");
    console.log("Self-test PASSED: AES-256-GCM encryption and decryption verified.");
    break;
  }

  default: {
    console.log(`
Usage: node scripts/manage-secrets.mjs <command> [arguments]

Commands:
  keygen              Generate a secure 256-bit master encryption key
  encrypt <secret>    Encrypt an API key or password into an enc:v1:... token
  decrypt <token>     Decrypt an enc:v1:... token back to plaintext
  test                Run self-test on encryption & decryption logic
`);
  }
}

