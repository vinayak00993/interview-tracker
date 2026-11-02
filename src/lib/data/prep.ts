import type { InterviewPrep, FollowUpDraft } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { nowIso } from "@/lib/time";

export type { InterviewPrep, FollowUpDraft };

export async function listPreps(opportunityId: string, userId: string): Promise<InterviewPrep[]> {
  return prisma.interviewPrep.findMany({
    where: { opportunityId, opportunity: { userId } },
    orderBy: { createdAt: "desc" },
  });
}

export async function savePrep(data: {
  opportunityId: string;
  interviewId: string | null;
  content: string;
  model: string;
  promptVersion: number;
  inputTokens?: number;
  outputTokens?: number;
}): Promise<InterviewPrep> {
  return prisma.interviewPrep.create({ data: { ...data, createdAt: nowIso() } });
}

export async function deletePrep(id: string, userId: string): Promise<boolean> {
  const result = await prisma.interviewPrep.deleteMany({ where: { id, opportunity: { userId } } });
  return result.count > 0;
}

export async function saveFollowUp(data: { interviewId: string; subject: string; body: string; model: string }): Promise<FollowUpDraft> {
  return prisma.followUpDraft.create({ data: { ...data, createdAt: nowIso() } });
}

export async function markFollowUpSent(id: string, userId: string): Promise<FollowUpDraft | null> {
  const draft = await prisma.followUpDraft.findFirst({
    where: { id, interview: { opportunity: { userId } } },
    include: { interview: { select: { opportunityId: true, round: true, interviewerName: true } } },
  });
  if (!draft) return null;
  const ts = nowIso();
  const updated = await prisma.followUpDraft.update({ where: { id }, data: { sentAt: ts } });
  await prisma.activity.create({
    data: {
      userId,
      opportunityId: draft.interview.opportunityId,
      type: "followed_up",
      description: `Sent follow-up after ${draft.interview.round}${draft.interview.interviewerName ? ` to ${draft.interview.interviewerName}` : ""}`,
      date: ts,
      createdAt: ts,
    },
  });
  return updated;
}
