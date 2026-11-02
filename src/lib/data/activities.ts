import { prisma } from "@/lib/prisma";
import { nowIso } from "@/lib/time";

export async function logActivity(
  userId: string,
  data: { opportunityId?: string | null; type: string; description: string; date?: string | null }
) {
  const ts = nowIso();
  return prisma.activity.create({
    data: {
      userId,
      opportunityId: data.opportunityId ?? null,
      type: data.type,
      description: data.description,
      date: data.date ?? ts,
      createdAt: ts,
    },
  });
}

export async function listRecentActivities(userId: string, limit = 10) {
  return prisma.activity.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: limit,
    include: { opportunity: { select: { id: true, company: true, role: true } } },
  });
}

export type RecentActivity = Awaited<ReturnType<typeof listRecentActivities>>[number];

export async function deleteActivity(id: string, userId: string): Promise<boolean> {
  const result = await prisma.activity.deleteMany({ where: { id, userId } });
  return result.count > 0;
}
