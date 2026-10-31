import { PrismaClient } from "@prisma/client";

const RETRYABLE_PRISMA_CODES = new Set(["P1001", "P1002", "P1008", "P1017", "P2024"]);

function createPrismaClient() {
  const base = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  // Automatically reconnect and retry queries when serverless Postgres (db.prisma.io / Neon)
  // closes an idle pooled TCP connection (`P1017: Server has closed the connection`).
  base.$use(async (params, next) => {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await next(params);
      } catch (err: any) {
        const code = err?.code;
        const msg = String(err?.message || "");
        const isClosedConn =
          RETRYABLE_PRISMA_CODES.has(code) ||
          /Server has closed the connection|Connection reset|Can't reach database server|Closed/i.test(msg);

        if (isClosedConn && attempt < 3) {
          console.warn(
            `[prisma] Transient connection drop (${code || "closed"}) on ${params.model}.${params.action} — reconnecting (attempt ${attempt}/3)...`
          );
          await base.$disconnect().catch(() => {});
          await new Promise((r) => setTimeout(r, 150 * attempt));
          await base.$connect().catch(() => {});
          continue;
        }
        throw err;
      }
    }
  });

  return base;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = prisma;
