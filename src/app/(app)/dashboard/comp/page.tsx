import type { Metadata } from "next";
import { requireUserId } from "@/lib/session";
import { listOpportunities } from "@/lib/data/opportunities";
import { CompComparison } from "@/components/comp/CompComparison";

export const metadata: Metadata = { title: "Compensation" };

export default async function CompPage() {
  const userId = await requireUserId();
  const opportunities = await listOpportunities(userId);
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 lg:px-12 py-6 sm:py-10 animate-fade-in-up">
      <CompComparison opportunities={opportunities} />
    </div>
  );
}
