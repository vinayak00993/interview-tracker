"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { InterviewWithFollowUps } from "@/lib/data/opportunities";
import { deleteInterviewAction } from "@/lib/actions/interviews";
import { INTERVIEW_STATUS_BADGE, SENTIMENT_TEXT, humanize } from "@/lib/pipeline";
import { formatDate } from "@/lib/format";
import { Badge, Button, Card, EmptyState, ErrorText, cx } from "@/components/ui";
import { InterviewFormDialog } from "./InterviewFormDialog";
import { DebriefDialog } from "./DebriefDialog";
import { FollowUpDraftPanel } from "./FollowUpDraftPanel";

interface Props {
  opportunityId: string;
  interviews: InterviewWithFollowUps[];
  latestGaps: string[];
}

export function InterviewList({ opportunityId, interviews, latestGaps }: Props) {
  const [expanded, setExpanded] = useState<string | null>(interviews.find((i) => i.status === "scheduled")?.id ?? null);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<InterviewWithFollowUps | null>(null);
  const [debriefing, setDebriefing] = useState<InterviewWithFollowUps | null>(null);
  const [drafting, setDrafting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const remove = (interview: InterviewWithFollowUps) => {
    if (!confirm(`Delete ${interview.round}? This cannot be undone.`)) return;
    setError(null);
    start(async () => {
      const r = await deleteInterviewAction(opportunityId, interview.id);
      if (!r.ok) setError(r.error);
    });
  };

  return (
    <div className="animate-fade-in-up">
      <div className="flex items-center justify-between mb-4 gap-3">
        <p className="text-sm font-serif italic text-ink-700">
          {interviews.length === 0 ? "No rounds yet." : `${interviews.length} round${interviews.length > 1 ? "s" : ""}, ${interviews.filter((i) => i.status === "completed").length} done.`}
        </p>
        <Button onClick={() => setAdding(true)}>+ Add interview</Button>
      </div>
      <ErrorText>{error}</ErrorText>

      {interviews.length === 0 ? (
        <Card tone="low">
          <EmptyState title="Nothing scheduled." hint="Add the first round once the recruiter confirms a time. Prep and debriefs hang off each round." action={<Button onClick={() => setAdding(true)}>Add interview</Button>} />
        </Card>
      ) : (
        <div className="space-y-3">
          {interviews.map((interview) => {
            const open = expanded === interview.id;
            const draft = interview.followUps[0];
            return (
              <Card key={interview.id} className={cx(pending && "opacity-70")}>
                <button type="button" onClick={() => setExpanded(open ? null : interview.id)} className="w-full text-left flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] uppercase tracking-label text-ink-600 font-semibold">Round {interview.roundNumber}</span>
                      <Badge className={INTERVIEW_STATUS_BADGE[interview.status] ?? "bg-vellum-high text-ink-700"}>{interview.status}</Badge>
                      {interview.sentiment && <span className={cx("text-[10px] font-semibold uppercase tracking-label", SENTIMENT_TEXT[interview.sentiment])}>{interview.sentiment}</span>}
                    </div>
                    <h3 className="font-serif text-lg text-ink-900 leading-tight mt-1">{interview.round}</h3>
                    <p className="text-xs text-ink-700 mt-1">
                      {interview.dateTime ? formatDate(interview.dateTime, "long") : "Date to be confirmed"}
                      {" · "}
                      {humanize(interview.format)}
                      {interview.durationMin ? ` · ${interview.durationMin} min` : ""}
                    </p>
                    {interview.interviewerName && (
                      <p className="text-xs text-ink-700 mt-0.5">
                        {interview.interviewerName}
                        {interview.interviewerTitle ? `, ${interview.interviewerTitle}` : ""}
                        {interview.interviewerLinkedIn && (
                          <>
                            {" "}
                            <a href={interview.interviewerLinkedIn} target="_blank" rel="noopener noreferrer" className="text-terracotta hover:underline" onClick={(e) => e.stopPropagation()}>
                              LinkedIn ↗
                            </a>
                          </>
                        )}
                      </p>
                    )}
                  </div>
                  <span className="text-ink-600 text-lg leading-none mt-1" aria-hidden="true">
                    {open ? "−" : "+"}
                  </span>
                </button>

                {open && (
                  <div className="mt-4 pt-4 border-t border-vellum-high space-y-4">
                    <NoteBlock label="Prep notes" value={interview.prepNotes} />
                    <NoteBlock label="Questions to ask" value={interview.questionsToAsk} />
                    <NoteBlock label="Debrief" value={interview.debriefNotes} />
                    <NoteBlock label="Questions they asked" value={interview.questionsAsked} />
                    <NoteBlock label="Next steps" value={interview.nextSteps} />

                    {draft && drafting !== interview.id && (
                      <div className="bg-vellum-low rounded p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[10px] uppercase tracking-label text-ink-600 font-semibold">Follow-up draft</p>
                          <span className={cx("text-[10px] uppercase tracking-label font-semibold", draft.sentAt ? "text-sage" : "text-umber")}>{draft.sentAt ? `Sent ${formatDate(draft.sentAt)}` : "Not sent"}</span>
                        </div>
                        <p className="text-sm text-ink-900 font-medium mt-1">{draft.subject}</p>
                        <p className="text-xs text-ink-700 mt-1 line-clamp-2 whitespace-pre-wrap">{draft.body}</p>
                      </div>
                    )}

                    {drafting === interview.id && <FollowUpDraftPanel opportunityId={opportunityId} interview={interview} onClose={() => setDrafting(null)} />}

                    <div className="flex flex-wrap gap-2 pt-1">
                      {interview.status !== "completed" && (
                        <Link href={`/opportunities/${opportunityId}/prep?interview=${interview.id}`} className="inline-flex items-center px-4 py-2 text-[11px] font-semibold uppercase tracking-label bg-terracotta text-vellum rounded shadow-card hover:bg-terracotta-deep transition-colors">
                          Prep for this round
                        </Link>
                      )}
                      <Button variant="secondary" onClick={() => setDebriefing(interview)}>
                        {interview.status === "completed" ? "Edit debrief" : "Debrief"}
                      </Button>
                      {interview.status === "completed" && drafting !== interview.id && (
                        <Button variant="secondary" onClick={() => setDrafting(interview.id)}>
                          {draft ? "Redraft follow-up" : "Draft follow-up"}
                        </Button>
                      )}
                      <Button variant="ghost" onClick={() => setEditing(interview)}>
                        Edit
                      </Button>
                      <Button variant="danger" onClick={() => remove(interview)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <InterviewFormDialog open={adding} onClose={() => setAdding(false)} opportunityId={opportunityId} defaultRoundNumber={interviews.length + 1} />
      <InterviewFormDialog open={Boolean(editing)} onClose={() => setEditing(null)} opportunityId={opportunityId} interview={editing ?? undefined} defaultRoundNumber={editing?.roundNumber ?? 1} />
      <DebriefDialog open={Boolean(debriefing)} onClose={() => setDebriefing(null)} opportunityId={opportunityId} interview={debriefing} latestGaps={latestGaps} />
    </div>
  );
}

function NoteBlock({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[10px] uppercase tracking-label text-ink-600 font-semibold mb-1">{label}</p>
      <p className="text-sm text-ink-800 whitespace-pre-wrap leading-relaxed">{value}</p>
    </div>
  );
}
