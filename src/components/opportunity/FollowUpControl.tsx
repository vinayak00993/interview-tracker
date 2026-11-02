"use client";

import { useState, useTransition } from "react";
import { completeFollowUpAction, setFollowUpAction } from "@/lib/actions/opportunities";
import { Button, Card, ErrorText, Input } from "@/components/ui";
import { formatDate, relativeDays, toDateInputValue } from "@/lib/format";

export function FollowUpControl({ opportunityId, followUpAt }: { opportunityId: string; followUpAt: string | null }) {
  const [date, setDate] = useState(toDateInputValue(followUpAt));
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const due = followUpAt ? new Date(followUpAt).getTime() <= Date.now() : false;

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setError(null);
    start(async () => {
      const r = await fn();
      if (!r.ok) setError(r.error ?? "Something went wrong.");
    });
  };

  const setReminder = () => {
    if (!date) return;
    run(() => setFollowUpAction(opportunityId, new Date(`${date}T09:00`).toISOString()));
  };

  return (
    <Card tone={due ? "accent" : "paper"}>
      {followUpAt ? (
        <>
          <p className="text-sm text-ink-900 font-medium">
            Reminder {relativeDays(followUpAt)}
            <span className="text-ink-600 font-normal"> · {formatDate(followUpAt)}</span>
          </p>
          <div className="flex gap-2 mt-3 flex-wrap">
            <Button size="sm" onClick={() => run(() => completeFollowUpAction(opportunityId))} loading={pending}>
              Mark followed up
            </Button>
            <Button size="sm" variant="ghost" onClick={() => run(() => setFollowUpAction(opportunityId, null))} disabled={pending}>
              Clear
            </Button>
          </div>
        </>
      ) : (
        <p className="text-sm font-serif italic text-ink-700">No reminder set. Pick a date and it will surface on the dashboard when due.</p>
      )}
      <div className="flex items-end gap-2 mt-3">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Follow-up date" className="flex-1" />
        <Button size="sm" variant="secondary" onClick={setReminder} disabled={!date || pending}>
          {followUpAt ? "Reschedule" : "Set reminder"}
        </Button>
      </div>
      <div className="mt-2">
        <ErrorText>{error}</ErrorText>
      </div>
    </Card>
  );
}
