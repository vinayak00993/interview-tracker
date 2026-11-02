import { prisma } from "@/lib/prisma";
import { nowIso } from "@/lib/time";
import type { ContactCreateInput, ContactUpdateInput } from "@/lib/validation";

export async function listContacts(userId: string) {
  return prisma.contact.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    include: { opportunityContacts: { include: { opportunity: { select: { id: true, company: true, role: true } } } } },
  });
}
export type ContactWithLinks = Awaited<ReturnType<typeof listContacts>>[number];

export async function createContact(userId: string, input: ContactCreateInput) {
  const ts = nowIso();
  return prisma.contact.create({ data: { userId, ...input, createdAt: ts, updatedAt: ts } });
}

export async function updateContact(id: string, userId: string, input: ContactUpdateInput) {
  const existing = await prisma.contact.findFirst({ where: { id, userId }, select: { id: true } });
  if (!existing) return null;
  return prisma.contact.update({ where: { id }, data: { ...input, updatedAt: nowIso() } });
}

export async function deleteContact(id: string, userId: string): Promise<boolean> {
  const result = await prisma.contact.deleteMany({ where: { id, userId } });
  return result.count > 0;
}

/** Links a contact to an opportunity. Both must belong to the user. */
export async function attachContact(userId: string, opportunityId: string, contactId: string, role: string | null) {
  const [opp, contact] = await Promise.all([
    prisma.opportunity.findFirst({ where: { id: opportunityId, userId }, select: { id: true } }),
    prisma.contact.findFirst({ where: { id: contactId, userId }, select: { id: true } }),
  ]);
  if (!opp || !contact) return null;
  return prisma.opportunityContact.upsert({
    where: { opportunityId_contactId: { opportunityId, contactId } },
    create: { opportunityId, contactId, role },
    update: { role },
    include: { contact: true },
  });
}

export async function detachContact(userId: string, opportunityId: string, contactId: string): Promise<boolean> {
  const result = await prisma.opportunityContact.deleteMany({
    where: { opportunityId, contactId, opportunity: { userId } },
  });
  return result.count > 0;
}

/** Creates a contact and links it to an opportunity in one step. */
export async function createContactForOpportunity(
  userId: string,
  opportunityId: string,
  input: ContactCreateInput,
  role: string | null
) {
  const opp = await prisma.opportunity.findFirst({ where: { id: opportunityId, userId }, select: { id: true } });
  if (!opp) return null;
  const contact = await createContact(userId, input);
  await prisma.opportunityContact.create({ data: { opportunityId, contactId: contact.id, role } });
  return contact;
}
