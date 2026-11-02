"use client";

import { useState, useTransition } from "react";
import type { Contact } from "@prisma/client";
import { Dialog } from "@/components/ui/Dialog";
import { Button, ErrorText, Field, Input, Select, Textarea } from "@/components/ui";
import { createContactAction, updateContactAction } from "@/lib/actions/contacts";
import { CONTACT_TYPES, WARMTH } from "@/lib/validation";
import { humanize } from "@/lib/pipeline";
import { toDateInputValue } from "@/lib/format";

/** Create or edit a contact. Pass `contact` to edit. */
export function ContactDialog({ open, onClose, contact }: { open: boolean; onClose: () => void; contact?: Contact | null }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError(null);
    start(async () => {
      const r = contact ? await updateContactAction(contact.id, form) : await createContactAction(form);
      if (!r.ok) setError(r.error);
      else onClose();
    });
  };

  return (
    <Dialog open={open} onClose={onClose} eyebrow={contact ? "Contact" : "New contact"} title={contact ? contact.name : "Add a person"} size="lg">
      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label={<>Name <span className="text-terracotta normal-case">*</span></>}>
          <Input name="name" required defaultValue={contact?.name ?? ""} />
        </Field>
        <Field label="Title"><Input name="title" defaultValue={contact?.title ?? ""} /></Field>
        <Field label="Company"><Input name="company" defaultValue={contact?.company ?? ""} /></Field>
        <Field label="Type">
          <Select name="type" defaultValue={contact?.type ?? "other"}>
            {CONTACT_TYPES.map((t) => (
              <option key={t} value={t}>{humanize(t)}</option>
            ))}
          </Select>
        </Field>
        <Field label="Email"><Input type="email" name="email" defaultValue={contact?.email ?? ""} /></Field>
        <Field label="Phone"><Input name="phone" defaultValue={contact?.phone ?? ""} /></Field>
        <Field label="LinkedIn"><Input type="url" name="linkedIn" defaultValue={contact?.linkedIn ?? ""} placeholder="https://" /></Field>
        <Field label="Warmth" hint="How strong is the connection?">
          <Select name="warmth" defaultValue={contact?.warmth ?? ""}>
            <option value="">Not set</option>
            {WARMTH.map((w) => (
              <option key={w} value={w}>{humanize(w)}</option>
            ))}
          </Select>
        </Field>
        <Field label="Last contacted"><Input type="date" name="lastContactedAt" defaultValue={toDateInputValue(contact?.lastContactedAt)} /></Field>
        <div />
        <Field label="Notes" className="sm:col-span-2">
          <Textarea name="notes" rows={3} defaultValue={contact?.notes ?? ""} placeholder="How you know them, what they care about, anything to remember." />
        </Field>
        <div className="sm:col-span-2 flex items-center justify-between gap-3">
          <ErrorText>{error}</ErrorText>
          <div className="flex gap-2 ml-auto">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={pending}>{contact ? "Save changes" : "Add contact"}</Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
