import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { nowIso, parseStoredDate, daysBetween } from "@/lib/time";
import type { OpportunityCreateInput, OpportunityUpdateInput, OpportunityStatus } from "@/lib/validation";

const STATUS_LABEL: Record<string, string> = {
  saved: "Saved",
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
  archived: "Archived",
};

export async function listOpportunities(userId: string) {
  return prisma.opportunity.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { interviews: true } } },
  });
}
export type OpportunitySummary = Awaited<ReturnType<typeof listOpportunities>>[number];

const detailInclude = {
  interviews: {
    orderBy: [{ roundNumber: "asc" }, { dateTime: "asc" }],
    include: {
      followUps: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  },
  opportunityContacts: { include: { contact: true } },
  activities: { orderBy: { date: "desc" }, take: 50 },
  documentsSent: { include: { document: true } },
  offer: true,
  preps: { orderBy: { createdAt: "desc" } },
} satisfies Prisma.OpportunityInclude;

export async function getOpportunity(id: string, userId: string) {
  return prisma.opportunity.findFirst({ where: { id, userId }, include: detailInclude });
}
export type OpportunityDetail = NonNullable<Awaited<ReturnType<typeof getOpportunity>>>;
export type InterviewWithFollowUps = OpportunityDetail["interviews"][number];

export async function ownsOpportunity(id: string, userId: string): Promise<boolean> {
  const row = await prisma.opportunity.findFirst({ where: { id, userId }, select: { id: true } });
  return Boolean(row);
}

export async function createOpportunity(userId: string, input: OpportunityCreateInput) {
  const ts = nowIso();
  const created = await prisma.opportunity.create({
    data: {
      userId,
      ...input,
      appliedDate: input.appliedDate ?? (input.status === "applied" ? ts : null),
      createdAt: ts,
      updatedAt: ts,
    },
    include: { _count: { select: { interviews: true } } },
  });
  await prisma.activity.create({
    data: {
      userId,
      opportunityId: created.id,
      type: "note",
      description: `Added ${created.company}, ${created.role} to the pipeline`,
      date: ts,
      createdAt: ts,
    },
  });
  return created;
}

export async function updateOpportunity(id: string, userId: string, input: OpportunityUpdateInput) {
  const existing = await prisma.opportunity.findFirst({ where: { id, userId } });
  if (!existing) return null;
  const ts = nowIso();
  const updated = await prisma.opportunity.update({
    where: { id },
    data: { ...input, updatedAt: ts },
  });
  if (input.status && input.status !== existing.status) {
    await recordStatusChange(userId, id, existing.status, input.status, ts);
  }
  return updated;
}

async function recordStatusChange(userId: string, opportunityId: string, from: string, to: string, ts: string) {
  await prisma.activity.create({
    data: {
      userId,
      opportunityId,
      type: "status_change",
      description: `Moved from ${STATUS_LABEL[from] ?? from} to ${STATUS_LABEL[to] ?? to}`,
      date: ts,
      createdAt: ts,
    },
  });
}

export async function updateOpportunityStatus(id: string, userId: string, status: OpportunityStatus) {
  const existing = await prisma.opportunity.findFirst({ where: { id, userId } });
  if (!existing) return null;
  const ts = nowIso();
  const updated = await prisma.opportunity.update({
    where: { id },
    data: {
      status,
      updatedAt: ts,
      appliedDate: status === "applied" && !existing.appliedDate ? ts : existing.appliedDate,
    },
  });
  if (existing.status !== status) {
    await recordStatusChange(userId, id, existing.status, status, ts);
  }
  return updated;
}

export async function setFollowUp(id: string, userId: string, followUpAt: string | null) {
  const existing = await prisma.opportunity.findFirst({ where: { id, userId }, select: { id: true } });
  if (!existing) return null;
  return prisma.opportunity.update({ where: { id }, data: { followUpAt, updatedAt: nowIso() } });
}

export async function deleteOpportunity(id: string, userId: string): Promise<boolean> {
  const result = await prisma.opportunity.deleteMany({ where: { id, userId } });
  return result.count > 0;
}

export interface FollowUpItem {
  id: string;
  company: string;
  role: string;
  status: string;
  reason: "scheduled" | "stale";
  daysSinceActivity: number;
  followUpAt: string | null;
}

/**
 * Opportunities that need attention: an explicit reminder that has come due,
 * or an active opportunity with no logged activity for `staleDays`.
 */
export async function findFollowUps(userId: string, staleDays = 5): Promise<FollowUpItem[]> {
  const rows = await prisma.opportunity.findMany({
    where: { userId, status: { in: ["applied", "interviewing", "offer"] } },
    include: { activities: { orderBy: { date: "desc" }, take: 1, select: { date: true } } },
  });
  const now = new Date();
  const items: FollowUpItem[] = [];
  for (const o of rows) {
    const last = parseStoredDate(o.activities[0]?.date) ?? parseStoredDate(o.updatedAt) ?? now;
    const days = daysBetween(last, now);
    const due = parseStoredDate(o.followUpAt);
    if (due && due.getTime() <= now.getTime()) {
      items.push({ id: o.id, company: o.company, role: o.role, status: o.status, reason: "scheduled", daysSinceActivity: days, followUpAt: o.followUpAt });
    } else if (!due && o.status !== "offer" && days >= staleDays) {
      items.push({ id: o.id, company: o.company, role: o.role, status: o.status, reason: "stale", daysSinceActivity: days, followUpAt: null });
    }
  }
  return items.sort((a, b) => b.daysSinceActivity - a.daysSinceActivity).slice(0, 10);
}
