import { notFound } from "next/navigation";
import { requireUserId } from "@/lib/session";
import { getOpportunityCached } from "@/lib/data/cached";
import { getProfile, hasProfileContent } from "@/lib/data/profile";
import { PrepPanel } from "@/components/opportunity/PrepPanel";

export default async function PrepPage({ params, searchParams }: { params: { id: string }; searchParams: { interview?: string } }) {
  const userId = await requireUserId();
  const [opp, profile] = await Promise.all([getOpportunityCached(params.id, userId), getProfile(userId)]);
  if (!opp) notFound();

  const requested = searchParams.interview && opp.interviews.some((i) => i.id === searchParams.interview) ? searchParams.interview : null;

  return (
    <PrepPanel
      opportunityId={opp.id}
      interviews={opp.interviews.map((i) => ({ id: i.id, round: i.round, roundNumber: i.roundNumber, status: i.status, dateTime: i.dateTime }))}
      preps={opp.preps.map((p) => ({ id: p.id, interviewId: p.interviewId, createdAt: p.createdAt, model: p.model, content: p.content }))}
      hasProfile={hasProfileContent(profile)}
      debriefCount={opp.interviews.filter((i) => i.status === "completed" && i.debriefNotes).length}
      initialInterviewId={requested}
    />
  );
}
