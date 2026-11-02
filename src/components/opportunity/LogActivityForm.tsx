"use client";

import { useRef, useState, useTransition } from "react";
import { logActivityAction } from "@/lib/actions/opportunities";
import { Button, Card, ErrorText, Field, Input, Select, SuccessText, Textarea } from "@/components/ui";
import { humanize } from "@/lib/pipeline";

const TYPES = ["note", "emailed", "followed_up", "researched", "applied", "interviewed", "offer_received", "rejected", "withdrew"];

export function LogActivityForm({ opportunityId }: { opportunityId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const today = new Date().toISOString().slice(0, 10);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const date = form.get("date");
    if (typeof date === "string" && date) form.set("date", new Date(`${date}T12:00`).toISOString());
    setError(null);
    setSaved(false);
    start(async () => {
      const r = await logActivityAction(form);
      if (!r.ok) setError(r.error);
      else {
        setSaved(true);
        formRef.current?.reset();
      }
    });
  };

  return (
    <Card>
      <form ref={formRef} onSubmit={submit} className="space-y-4">
        <input type="hidden" name="opportunityId" value={opportunityId} />
        <Field label="Type">
          <Select name="type" defaultValue="note">
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {humanize(t)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="What happened">
          <Textarea name="description" rows={3} required placeholder="Sent thank-you note to Dana" />
        </Field>
        <Field label="Date">
          <Input type="date" name="date" defaultValue={today} />
        </Field>
        <div className="flex items-center justify-between gap-3">
          <div>
            <ErrorText>{error}</ErrorText>
            {saved && <SuccessText>Logged.</SuccessText>}
          </div>
          <Button type="submit" loading={pending}>
            Log it
          </Button>
        </div>
      </form>
    </Card>
  );
}
