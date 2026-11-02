"use client";

import { useState, useTransition } from "react";
import type { InterviewWithFollowUps } from "@/lib/data/opportunities";
import { createInterviewAction, updateInterviewAction } from "@/lib/actions/interviews";
import { Dialog } from "@/components/ui/Dialog";
import { Button, ErrorText, Field, Input, Select, Textarea } from "@/components/ui";
import { toLocalInputValue } from "@/lib/format";

const FORMATS = ["video", "phone", "onsite", "async"];
const STATUSES = ["scheduled", "completed", "cancelled", "rescheduled"];

interface Props {
  open: boolean;
  onClose: () => void;
  opportunityId: string;
  interview?: InterviewWithFollowUps;
  defaultRoundNumber: number;
}

export function InterviewFormDialog({ open, onClose, opportunityId, interview, defaultRoundNumber }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const local = form.get("dateTime");
    if (typeof local === "string" && local) form.set("dateTime", new Date(local).toISOString());
    setError(null);
    start(async () => {
      const r = interview ? await updateInterviewAction(opportunityId, interview.id, form) : await createInterviewAction(opportunityId, form);
      if (!r.ok) setError(r.error);
      else onClose();
    });
  };

  return (
    <Dialog open={open} onClose={onClose} eyebrow="Interview" title={interview ? `Edit ${interview.round}` : "Add a round"} size="lg">
      <form key={interview?.id ?? "new"} onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Field label="Round name" className="sm:col-span-2">
          <Input name="round" required defaultValue={interview?.round ?? ""} placeholder="Recruiter screen, Hiring manager, Panel" />
        </Field>
        <Field label="Round number">
          <Input type="number" name="roundNumber" min={1} max={50} defaultValue={interview?.roundNumber ?? defaultRoundNumber} />
        </Field>
        <Field label="Date and time">
          <Input type="datetime-local" name="dateTime" defaultValue={toLocalInputValue(interview?.dateTime)} />
        </Field>
        <Field label="Duration (min)">
          <Input type="number" name="durationMin" min={1} max={1440} defaultValue={interview?.durationMin ?? ""} />
        </Field>
        <Field label="Format">
          <Select name="format" defaultValue={interview?.format ?? "video"}>
            {FORMATS.map((f) => (
              <option key={f} value={f}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Interviewer">
          <Input name="interviewerName" defaultValue={interview?.interviewerName ?? ""} />
        </Field>
        <Field label="Their title">
          <Input name="interviewerTitle" defaultValue={interview?.interviewerTitle ?? ""} />
        </Field>
        <Field label="Their LinkedIn">
          <Input type="url" name="interviewerLinkedIn" defaultValue={interview?.interviewerLinkedIn ?? ""} placeholder="https://" />
        </Field>
        {interview && (
          <Field label="Status">
            <Select name="status" defaultValue={interview.status}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label="Prep notes" className="sm:col-span-3" hint="Your own notes. The generated prep sheet lives on the Prep tab.">
          <Textarea name="prepNotes" rows={3} defaultValue={interview?.prepNotes ?? ""} />
        </Field>
        <Field label="Questions to ask" className="sm:col-span-3">
          <Textarea name="questionsToAsk" rows={3} defaultValue={interview?.questionsToAsk ?? ""} />
        </Field>
        <div className="sm:col-span-3 flex items-center justify-between gap-3">
          <ErrorText>{error}</ErrorText>
          <div className="flex gap-2 ml-auto">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              {interview ? "Save changes" : "Add round"}
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
