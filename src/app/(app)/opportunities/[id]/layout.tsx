import { notFound } from "next/navigation";
import { requireUserId } from "@/lib/session";
import { getOpportunityCached } from "@/lib/data/cached";
import { OpportunityHeader } from "@/components/opportunity/OpportunityHeader";
import { OpportunityTabs } from "@/components/opportunity/OpportunityTabs";

export default async function OpportunityLayout({ params, children }: { params: { id: string }; children: React.ReactNode }) {
  const userId = await requireUserId();
  const opp = await getOpportunityCached(params.id, userId);
  if (!opp) notFound();

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-8 lg:px-12 py-6 sm:py-10 animate-fade-in-up">
      <OpportunityHeader opportunity={opp} />
      <OpportunityTabs
        id={opp.id}
        counts={{
          interviews: opp.interviews.length,
          prep: opp.preps.length,
          contacts: opp.opportunityContacts.length,
          activity: opp.activities.length,
        }}
      />
      <div className="mt-6">{children}</div>
    </div>
  );
}
