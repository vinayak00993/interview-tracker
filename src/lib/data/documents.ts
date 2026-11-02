import { prisma } from "@/lib/prisma";
import { nowIso } from "@/lib/time";
import type { DocumentCreateInput } from "@/lib/validation";

export async function listDocuments(userId: string) {
  return prisma.document.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { sentTo: { include: { opportunity: { select: { id: true, company: true, role: true } } } } },
  });
}
export type DocumentWithLinks = Awaited<ReturnType<typeof listDocuments>>[number];

export async function createDocument(userId: string, input: DocumentCreateInput) {
  const ts = nowIso();
  return prisma.document.create({ data: { userId, ...input, createdAt: ts, updatedAt: ts } });
}

export async function updateDocument(id: string, userId: string, input: Partial<DocumentCreateInput>) {
  const existing = await prisma.document.findFirst({ where: { id, userId }, select: { id: true } });
  if (!existing) return null;
  return prisma.document.update({ where: { id }, data: { ...input, updatedAt: nowIso() } });
}

export async function deleteDocument(id: string, userId: string): Promise<boolean> {
  const result = await prisma.document.deleteMany({ where: { id, userId } });
  return result.count > 0;
}

/** Records that a document was sent for an opportunity. */
export async function markDocumentSent(userId: string, opportunityId: string, documentId: string, sentAt?: string | null) {
  const [opp, doc] = await Promise.all([
    prisma.opportunity.findFirst({ where: { id: opportunityId, userId }, select: { id: true } }),
    prisma.document.findFirst({ where: { id: documentId, userId }, select: { id: true, name: true } }),
  ]);
  if (!opp || !doc) return null;
  const ts = sentAt ?? nowIso();
  const link = await prisma.opportunityDocument.upsert({
    where: { opportunityId_documentId: { opportunityId, documentId } },
    create: { opportunityId, documentId, sentAt: ts },
    update: { sentAt: ts },
    include: { document: true },
  });
  await prisma.activity.create({
    data: { userId, opportunityId, type: "emailed", description: `Sent ${doc.name}`, date: ts, createdAt: nowIso() },
  });
  return link;
}

export async function unmarkDocumentSent(userId: string, opportunityId: string, documentId: string): Promise<boolean> {
  const result = await prisma.opportunityDocument.deleteMany({
    where: { opportunityId, documentId, opportunity: { userId } },
  });
  return result.count > 0;
}
