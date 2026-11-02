import { prisma } from "@/lib/prisma";
import { nowIso } from "@/lib/time";
import type { InterviewCreateInput, InterviewUpdateInput } from "@/lib/validation";

export async function createInterview(userId: string, input: InterviewCreateInput) {
  const opp = await prisma.opportunity.findFirst({ where: { id: input.opportunityId, userId }, select: { id: true } });
  if (!opp) return null;
  const ts = nowIso();
  return prisma.interview.create({ data: { ...input, createdAt: ts, updatedAt: ts } });
}

/** Loads an interview only if it belongs to the user, with its opportunity. */
export async function getInterview(id: string, userId: string) {
  return prisma.interview.findFirst({
    where: { id, opportunity: { userId } },
    include: {
      opportunity: true,
      followUps: { orderBy: { createdAt: "desc" } },
      preps: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
}
export type InterviewWithContext = NonNullable<Awaited<ReturnType<typeof getInterview>>>;

export async function updateInterview(id: string, userId: string, input: InterviewUpdateInput) {
  const existing = await prisma.interview.findFirst({ where: { id, opportunity: { userId } }, select: { id: true, status: true, opportunityId: true, round: true } });
  if (!existing) return null;
  const ts = nowIso();
  const updated = await prisma.interview.update({ where: { id }, data: { ...input, updatedAt: ts } });
  if (input.status === "completed" && existing.status !== "completed") {
    await prisma.activity.create({
      data: {
        userId,
        opportunityId: existing.opportunityId,
        type: "interviewed",
        description: `Completed ${existing.round}${input.sentiment ? ` (${input.sentiment})` : ""}`,
        date: ts,
        createdAt: ts,
      },
    });
  }
  return updated;
}

export async function deleteInterview(id: string, userId: string): Promise<boolean> {
  const existing = await prisma.interview.findFirst({ where: { id, opportunity: { userId } }, select: { id: true } });
  if (!existing) return false;
  await prisma.interview.delete({ where: { id } });
  return true;
}

export async function listUpcomingInterviews(userId: string, limit = 5) {
  return prisma.interview.findMany({
    where: { opportunity: { userId }, status: "scheduled", dateTime: { gte: nowIso() } },
    orderBy: { dateTime: "asc" },
    take: limit,
    include: { opportunity: { select: { id: true, company: true, role: true } } },
  });
}
export type UpcomingInterview = Awaited<ReturnType<typeof listUpcomingInterviews>>[number];
