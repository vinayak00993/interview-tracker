import { prisma } from "@/lib/prisma";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Fixed-window rate limiter backed by the database, so the count survives
 * restarts and is shared across instances.
 */
export async function consumeRateLimit(key: string, max: number, windowMs: number): Promise<RateLimitResult> {
  const now = Date.now();
  const existing = await prisma.rateLimit.findUnique({ where: { key } });
  const expired = !existing || new Date(existing.resetAt).getTime() <= now;

  if (expired) {
    const resetAt = new Date(now + windowMs);
    await prisma.rateLimit.upsert({
      where: { key },
      create: { key, count: 1, resetAt: resetAt.toISOString() },
      update: { count: 1, resetAt: resetAt.toISOString() },
    });
    return { allowed: true, remaining: max - 1, resetAt };
  }

  const resetAt = new Date(existing.resetAt);
  if (existing.count >= max) {
    return { allowed: false, remaining: 0, resetAt };
  }
  const updated = await prisma.rateLimit.update({ where: { key }, data: { count: { increment: 1 } } });
  return { allowed: true, remaining: Math.max(0, max - updated.count), resetAt };
}

/** Clears the counter, for example after a successful login. */
export async function resetRateLimit(key: string): Promise<void> {
  await prisma.rateLimit.deleteMany({ where: { key } });
}

/** Removes expired windows. Cheap enough to call opportunistically. */
export async function pruneRateLimits(): Promise<void> {
  await prisma.rateLimit.deleteMany({ where: { resetAt: { lt: new Date().toISOString() } } });
}
