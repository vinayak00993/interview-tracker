"use client";

import { useState, useTransition } from "react";
import type { InterviewWithFollowUps } from "@/lib/data/opportunities";
import { debriefInterviewAction } from "@/lib/actions/interviews";
import { Dialog } from "@/components/ui/Dialog";
import { Button, ErrorText, Field, Select, Textarea } from "@/components/ui";

interface Props {
  open: boolean;
  onClose: () => void;
  opportunityId: string;
  interview: InterviewWithFollowUps | null;
  latestGaps: string[];
}

export function DebriefDialog({ open, onClose, opportunityId, interview, latestGaps }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!interview) return;
    const form = new FormData(e.currentTarget);
    setError(null);
    start(async () => {
      const r = await debriefInterviewAction(opportunityId, interview.id, form);
      if (!r.ok) setError(r.error);
      else onClose();
    });
  };

  return (
    <Dialog open={open && Boolean(interview)} onClose={onClose} eyebrow="Debrief" title={interview ? `How did ${interview.round} go?` : ""} size="lg">
      {latestGaps.length > 0 && (
        <div className="bg-terracotta/5 rounded p-3 mb-5">
          <p className="text-[10px] uppercase tracking-label text-terracotta font-semibold mb-1.5">Flagged before this round</p>
          <ul className="space-y-1">
            {latestGaps.map((gap, i) => (
              <li key={i} className="text-sm text-ink-800 leading-snug">
                · {gap}
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-ink-600 mt-2 font-serif italic">Did any of these come up? Note it below so the next prep sheet knows.</p>
        </div>
      )}
      <form key={interview?.id ?? "none"} onSubmit={submit} className="space-y-5">
        <Field label="What happened" hint="Topics covered, how it felt, what they seemed to care about.">
          <Textarea name="debriefNotes" rows={5} required defaultValue={interview?.debriefNotes ?? ""} />
        </Field>
        <Field label="Questions they asked" hint="One per line. These shape the likely questions in later rounds.">
          <Textarea name="questionsAsked" rows={3} defaultValue={interview?.questionsAsked ?? ""} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="How it felt">
            <Select name="sentiment" defaultValue={interview?.sentiment ?? ""}>
              <option value="">Not sure</option>
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
            </Select>
          </Field>
          <Field label="Next steps they mentioned">
            <Textarea name="nextSteps" rows={1} defaultValue={interview?.nextSteps ?? ""} />
          </Field>
        </div>
        <div className="flex items-center justify-between gap-3">
          <ErrorText>{error}</ErrorText>
          <div className="flex gap-2 ml-auto">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              Save and mark completed
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
