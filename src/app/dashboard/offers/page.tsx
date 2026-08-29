import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { findOffersForUser, findOpportunities } from "@/lib/db";
import OfferComparison from "./OfferComparison";
import MobileTabBar from "@/components/MobileTabBar";

export default async function OffersPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = (session.user as { id?: string }).id as string;
  const [offers, opportunities] = await Promise.all([
    findOffersForUser(userId),
    findOpportunities(userId),
  ]);

  // Only show opportunities that are offer-stage OR further (and don't already have an offer record)
  const eligibleOpps = opportunities
    .filter((o) => ["offer", "interviewing"].includes(o.status))
    .filter((o) => !offers.find((off) => off.opportunityId === o.id));

  return (
    <>
      <div className="pb-24 md:pb-0">
        <OfferComparison offers={offers} eligibleOpps={eligibleOpps} />
      </div>
      <MobileTabBar />
    </>
  );
}
