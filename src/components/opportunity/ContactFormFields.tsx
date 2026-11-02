"use client";

import type { Contact } from "@prisma/client";
import { Field, Input, Select, Textarea } from "@/components/ui";

export const CONTACT_TYPES = ["recruiter", "hiring_manager", "referral", "peer", "mentor", "other"];
export const CONTACT_ROLES = ["recruiter", "hiring_manager", "interviewer", "referral", "peer", "other"];

const label = (v: string) => v.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

/** Shared fields for creating and editing a contact. */
export function ContactFormFields({ contact, role, showRole = true }: { contact?: Contact | null; role?: string | null; showRole?: boolean }) {
  return (
    <>
      <Field label="Name" className="sm:col-span-2">
        <Input name="name" required defaultValue={contact?.name ?? ""} />
      </Field>
      <Field label="Title">
        <Input name="title" defaultValue={contact?.title ?? ""} />
      </Field>
      <Field label="Company">
        <Input name="company" defaultValue={contact?.company ?? ""} />
      </Field>
      <Field label="Email">
        <Input type="email" name="email" defaultValue={contact?.email ?? ""} />
      </Field>
      <Field label="Phone">
        <Input name="phone" defaultValue={contact?.phone ?? ""} />
      </Field>
      <Field label="LinkedIn" className="sm:col-span-2">
        <Input type="url" name="linkedIn" defaultValue={contact?.linkedIn ?? ""} placeholder="https://" />
      </Field>
      <Field label="Type">
        <Select name="type" defaultValue={contact?.type ?? "recruiter"}>
          {CONTACT_TYPES.map((t) => (
            <option key={t} value={t}>
              {label(t)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Warmth">
        <Select name="warmth" defaultValue={contact?.warmth ?? ""}>
          <option value="">Unknown</option>
          <option value="cold">Cold</option>
          <option value="warm">Warm</option>
          <option value="hot">Hot</option>
        </Select>
      </Field>
      {showRole && (
        <Field label="Role in this process" className="sm:col-span-2">
          <Select name="role" defaultValue={role ?? ""}>
            <option value="">Not set</option>
            {CONTACT_ROLES.map((r) => (
              <option key={r} value={r}>
                {label(r)}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <Field label="Notes" className="sm:col-span-2">
        <Textarea name="notes" rows={2} defaultValue={contact?.notes ?? ""} />
      </Field>
    </>
  );
}
