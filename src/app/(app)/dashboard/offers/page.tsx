import type { Metadata } from "next";
import { requireUserId } from "@/lib/session";
import { listOffers } from "@/lib/data/offers";
import { listOpportunities } from "@/lib/data/opportunities";
import { OfferComparison } from "@/components/offers/OfferComparison";

export const metadata: Metadata = { title: "Offers" };

export default async function OffersPage() {
  const userId = await requireUserId();
  const [offers, opportunities] = await Promise.all([listOffers(userId), listOpportunities(userId)]);
  const taken = new Set(offers.map((o) => o.opportunityId));
  const eligible = opportunities
    .filter((o) => ["interviewing", "offer"].includes(o.status) && !taken.has(o.id))
    .map((o) => ({ id: o.id, company: o.company, role: o.role, compMin: o.compMin, compMax: o.compMax }));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-12 py-6 sm:py-10 animate-fade-in-up">
      <OfferComparison offers={offers} eligible={eligible} />
    </div>
  );
}
