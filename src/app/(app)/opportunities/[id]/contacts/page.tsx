import { notFound } from "next/navigation";
import { requireUserId } from "@/lib/session";
import { getOpportunityCached } from "@/lib/data/cached";
import { listContacts } from "@/lib/data/contacts";
import { OpportunityContacts } from "@/components/opportunity/OpportunityContacts";

export default async function ContactsPage({ params }: { params: { id: string } }) {
  const userId = await requireUserId();
  const [opp, directory] = await Promise.all([getOpportunityCached(params.id, userId), listContacts(userId)]);
  if (!opp) notFound();

  return (
    <OpportunityContacts
      opportunityId={opp.id}
      links={opp.opportunityContacts}
      directory={directory.map((c) => ({ id: c.id, name: c.name, title: c.title, company: c.company }))}
    />
  );
}
