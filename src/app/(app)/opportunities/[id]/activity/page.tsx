import { notFound } from "next/navigation";
import { requireUserId } from "@/lib/session";
import { getOpportunityCached } from "@/lib/data/cached";
import { ACTIVITY_BADGE, humanize } from "@/lib/pipeline";
import { formatDate } from "@/lib/format";
import { Badge, Card, EmptyState, SectionTitle } from "@/components/ui";
import { LogActivityForm } from "@/components/opportunity/LogActivityForm";

export default async function ActivityPage({ params }: { params: { id: string } }) {
  const userId = await requireUserId();
  const opp = await getOpportunityCached(params.id, userId);
  if (!opp) notFound();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in-up">
      <div className="lg:col-span-2">
        <SectionTitle>Timeline</SectionTitle>
        {opp.activities.length === 0 ? (
          <Card tone="low">
            <EmptyState title="Nothing logged yet." hint="Status changes, debriefs, sent documents and follow-ups land here automatically. Add anything else by hand." />
          </Card>
        ) : (
          <Card>
            <ol className="relative border-l border-vellum-high ml-2 space-y-4">
              {opp.activities.map((a) => (
                <li key={a.id} className="pl-5 relative">
                  <span className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-terracotta/60" aria-hidden="true" />
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] uppercase tracking-label text-ink-600 font-medium">{formatDate(a.date)}</span>
                    <Badge className={ACTIVITY_BADGE[a.type] ?? "bg-vellum-high text-ink-700"}>{humanize(a.type)}</Badge>
                  </div>
                  <p className="text-sm text-ink-900 font-serif leading-snug mt-1">{a.description}</p>
                </li>
              ))}
            </ol>
          </Card>
        )}
      </div>
      <div>
        <SectionTitle>Log activity</SectionTitle>
        <LogActivityForm opportunityId={opp.id} />
      </div>
    </div>
  );
}
