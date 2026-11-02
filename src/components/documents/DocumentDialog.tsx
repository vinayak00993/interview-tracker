"use client";

import { useState, useTransition } from "react";
import type { Document } from "@prisma/client";
import { Dialog } from "@/components/ui/Dialog";
import { Button, ErrorText, Field, Input, Select, Textarea } from "@/components/ui";
import { createDocumentAction, updateDocumentAction } from "@/lib/actions/documents";
import { DOCUMENT_TYPES } from "@/lib/validation";
import { humanize } from "@/lib/pipeline";

export function DocumentDialog({ open, onClose, document: doc }: { open: boolean; onClose: () => void; document?: Document | null }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError(null);
    start(async () => {
      const r = doc ? await updateDocumentAction(doc.id, form) : await createDocumentAction(form);
      if (!r.ok) setError(r.error);
      else onClose();
    });
  };

  return (
    <Dialog open={open} onClose={onClose} eyebrow={doc ? "Document" : "New document"} title={doc ? doc.name : "Add a document"}>
      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label={<>Name <span className="text-terracotta normal-case">*</span></>} className="sm:col-span-2">
          <Input name="name" required defaultValue={doc?.name ?? ""} placeholder="Resume, AI companies" />
        </Field>
        <Field label="Type">
          <Select name="type" defaultValue={doc?.type ?? "resume"}>
            {DOCUMENT_TYPES.map((t) => (
              <option key={t} value={t}>{humanize(t)}</option>
            ))}
          </Select>
        </Field>
        <Field label="Version"><Input name="version" defaultValue={doc?.version ?? ""} placeholder="v3" /></Field>
        <Field label="Link or path" className="sm:col-span-2" hint="Optional. Where the file lives, for your own reference.">
          <Input name="filePath" defaultValue={doc?.filePath ?? ""} />
        </Field>
        <Field label="Notes" className="sm:col-span-2">
          <Textarea name="notes" rows={3} defaultValue={doc?.notes ?? ""} placeholder="What is different about this version?" />
        </Field>
        <div className="sm:col-span-2 flex items-center justify-between gap-3">
          <ErrorText>{error}</ErrorText>
          <div className="flex gap-2 ml-auto">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={pending}>{doc ? "Save changes" : "Add document"}</Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
