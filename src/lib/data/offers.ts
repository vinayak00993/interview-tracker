import type { Offer } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { nowIso } from "@/lib/time";
import type { OfferUpsertInput } from "@/lib/validation";

export type OfferWithOpportunity = Offer & { company: string; role: string; website: string | null };

export async function listOffers(userId: string): Promise<OfferWithOpportunity[]> {
  const rows = await prisma.offer.findMany({
    where: { opportunity: { userId } },
    orderBy: { createdAt: "desc" },
    include: { opportunity: { select: { company: true, role: true, website: true } } },
  });
  return rows.map(({ opportunity, ...offer }) => ({ ...offer, ...opportunity }));
}

export async function getOfferForOpportunity(userId: string, opportunityId: string): Promise<Offer | null> {
  return prisma.offer.findFirst({ where: { opportunityId, opportunity: { userId } } });
}

/** Creates or updates the offer and moves the opportunity to the offer stage. */
export async function upsertOffer(userId: string, input: OfferUpsertInput): Promise<Offer | null> {
  const { opportunityId, ...fields } = input;
  const opp = await prisma.opportunity.findFirst({ where: { id: opportunityId, userId } });
  if (!opp) return null;
  const ts = nowIso();
  const offer = await prisma.offer.upsert({
    where: { opportunityId },
    create: { opportunityId, ...fields, createdAt: ts, updatedAt: ts },
    update: { ...fields, updatedAt: ts },
  });
  if (opp.status !== "offer") {
    await prisma.opportunity.update({ where: { id: opportunityId }, data: { status: "offer", updatedAt: ts } });
    await prisma.activity.create({
      data: {
        userId,
        opportunityId,
        type: "offer_received",
        description: `Offer received from ${opp.company}${fields.baseComp ? ` ($${fields.baseComp}K base)` : ""}`,
        date: ts,
        createdAt: ts,
      },
    });
  }
  return offer;
}

export async function deleteOffer(userId: string, opportunityId: string): Promise<boolean> {
  const result = await prisma.offer.deleteMany({ where: { opportunityId, opportunity: { userId } } });
  return result.count > 0;
}
