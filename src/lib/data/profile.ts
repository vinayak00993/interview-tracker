import type { UserProfile } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { nowIso } from "@/lib/time";

export type { UserProfile };

export async function getProfile(userId: string): Promise<UserProfile | null> {
  return prisma.userProfile.findUnique({ where: { userId } });
}

export async function upsertProfile(
  userId: string,
  data: { resumeText?: string | null; linkedInAbout?: string | null; linkedInUrl?: string | null }
): Promise<UserProfile> {
  const ts = nowIso();
  return prisma.userProfile.upsert({
    where: { userId },
    create: { userId, ...data, createdAt: ts, updatedAt: ts },
    update: { ...data, updatedAt: ts },
  });
}

export function hasProfileContent(profile: UserProfile | null): boolean {
  return Boolean(profile?.resumeText || profile?.linkedInAbout);
}
