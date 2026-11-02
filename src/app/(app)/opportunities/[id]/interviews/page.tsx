import { notFound } from "next/navigation";
import { requireUserId } from "@/lib/session";
import { getOpportunityCached } from "@/lib/data/cached";
import { InterviewList } from "@/components/opportunity/InterviewList";

function latestGapsOf(content: string | undefined): string[] {
  if (!content) return [];
  try {
    const parsed = JSON.parse(content) as { gaps?: { gap?: unknown }[] };
    return (parsed.gaps ?? []).map((g) => (typeof g.gap === "string" ? g.gap : "")).filter(Boolean);
  } catch {
    return [];
  }
}

export default async function InterviewsPage({ params }: { params: { id: string } }) {
  const userId = await requireUserId();
  const opp = await getOpportunityCached(params.id, userId);
  if (!opp) notFound();

  return <InterviewList opportunityId={opp.id} interviews={opp.interviews} latestGaps={latestGapsOf(opp.preps[0]?.content)} />;
}
