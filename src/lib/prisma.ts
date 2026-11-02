/**
 * Single database client for every environment.
 *
 * Local dev talks to a SQLite file and production talks to Turso, but both
 * go through @libsql/client, so the query path is identical and Prisma gives
 * us one set of generated types.
 */
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

export function resolveDatabase(env: NodeJS.ProcessEnv = process.env): { url: string; authToken?: string } {
  const turso = env.TURSO_DATABASE_URL;
  if (turso) {
    // Tokens pasted into dashboards often carry a trailing newline, which
    // makes the Authorization header invalid.
    const authToken = (env.TURSO_AUTH_TOKEN || "").trim() || undefined;
    return { url: turso, authToken };
  }
  const raw = env.DATABASE_URL || "file:./dev.db";
  if (raw.startsWith("file:")) {
    const p = raw.slice("file:".length);
    // Prisma CLI resolves relative file paths against prisma/, so we do too.
    const abs = path.isAbsolute(p) ? p : path.resolve(process.cwd(), "prisma", p);
    return { url: `file:${abs}` };
  }
  return { url: raw };
}

function createPrisma(): PrismaClient {
  const { url, authToken } = resolveDatabase();
  const adapter = new PrismaLibSQL({ url, authToken });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
