"use client";

import { useState, useTransition } from "react";
import type { OpportunityDetail } from "@/lib/data/opportunities";
import { updateOpportunityAction } from "@/lib/actions/opportunities";
import { Dialog } from "@/components/ui/Dialog";
import { Button, Checkbox, ErrorText, Field, Input, Select, Textarea } from "@/components/ui";
import { toDateInputValue } from "@/lib/format";

export function EditOpportunityDialog({ opportunity: opp, open, onClose }: { opportunity: OpportunityDetail; open: boolean; onClose: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError(null);
    start(async () => {
      const r = await updateOpportunityAction(opp.id, form);
      if (!r.ok) setError(r.error);
      else onClose();
    });
  };

  return (
    <Dialog open={open} onClose={onClose} eyebrow="Opportunity" title="Edit details" size="lg">
      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Field label="Company"><Input name="company" required defaultValue={opp.company} /></Field>
        <Field label="Role"><Input name="role" required defaultValue={opp.role} /></Field>
        <Field label="Location"><Input name="location" defaultValue={opp.location ?? ""} /></Field>
        <Field label="JD link"><Input type="url" name="jdLink" defaultValue={opp.jdLink ?? ""} placeholder="https://" /></Field>
        <Field label="Company website"><Input type="url" name="website" defaultValue={opp.website ?? ""} placeholder="https://" /></Field>
        <div className="flex items-end pb-1.5"><Checkbox name="remote" value="true" label="Remote" defaultChecked={opp.remote} /></div>
        <Field label="Comp min ($K)"><Input type="number" name="compMin" min={0} defaultValue={opp.compMin ?? ""} /></Field>
        <Field label="Comp max ($K)"><Input type="number" name="compMax" min={0} defaultValue={opp.compMax ?? ""} /></Field>
        <Field label="Fit score (0 to 100)"><Input type="number" name="fitScore" min={0} max={100} defaultValue={opp.fitScore ?? ""} /></Field>
        <Field label="Priority">
          <Select name="priority" defaultValue={opp.priority}>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </Select>
        </Field>
        <Field label="Tier">
          <Select name="tier" defaultValue={opp.tier ?? ""}>
            <option value="">None</option>
            <option value="1">Tier I, dream role</option>
            <option value="2">Tier II</option>
            <option value="3">Tier III, backup</option>
          </Select>
        </Field>
        <Field label="Source">
          <Select name="source" defaultValue={opp.source ?? ""}>
            <option value="">None</option>
            <option value="direct">Direct</option>
            <option value="recruiter">Recruiter</option>
            <option value="referral">Referral</option>
            <option value="job_board">Job board</option>
          </Select>
        </Field>
        <Field label="Applied on"><Input type="date" name="appliedDate" defaultValue={toDateInputValue(opp.appliedDate)} /></Field>
        <Field label="Follow up on" hint="Shows in the sidebar when due."><Input type="date" name="followUpAt" defaultValue={toDateInputValue(opp.followUpAt)} /></Field>
        <div />
        <Field label="Notes" className="sm:col-span-3"><Textarea name="notes" rows={4} defaultValue={opp.notes ?? ""} /></Field>
        <Field label="Key gaps" className="sm:col-span-3" hint="Feeds the prep generator."><Textarea name="keyGaps" rows={2} defaultValue={opp.keyGaps ?? ""} /></Field>
        <Field label="Pros and cons" className="sm:col-span-3"><Textarea name="prosConsNotes" rows={2} defaultValue={opp.prosConsNotes ?? ""} /></Field>
        <Field label="Job description text" className="sm:col-span-3" hint="Cached from the posting. Edit if the page could not be read.">
          <Textarea name="jdText" rows={4} defaultValue={opp.jdText ?? ""} className="font-mono text-xs" />
        </Field>
        <div className="sm:col-span-3 flex items-center justify-between gap-3">
          <ErrorText>{error}</ErrorText>
          <div className="flex gap-2 ml-auto">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={pending}>Save changes</Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
