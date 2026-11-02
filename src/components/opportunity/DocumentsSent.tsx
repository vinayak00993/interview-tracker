"use client";

import { useState, useTransition } from "react";
import { createDocumentAction, markDocumentSentAction, unmarkDocumentSentAction } from "@/lib/actions/documents";
import { humanize } from "@/lib/pipeline";
import { formatDate } from "@/lib/format";
import { Dialog } from "@/components/ui/Dialog";
import { Badge, Button, Card, EmptyState, ErrorText, Field, Input, SectionTitle, Select, Textarea, cx } from "@/components/ui";

interface DocRef {
  id: string;
  name: string;
  type: string;
  version: string | null;
}
interface SentDoc {
  id: string;
  sentAt: string;
  document: DocRef;
}

const DOC_TYPES = ["resume", "cover_letter", "portfolio", "references", "other"];

export function DocumentsSent({ opportunityId, sent, library }: { opportunityId: string; sent: SentDoc[]; library: DocRef[] }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"existing" | "new">(library.length ? "existing" : "new");
  const [pick, setPick] = useState(library[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const available = library.filter((d) => !sent.some((s) => s.document.id === d.id));

  const unlink = (documentId: string) =>
    start(async () => {
      const r = await unmarkDocumentSentAction(opportunityId, documentId);
      if (!r.ok) setError(r.error);
    });

  const attachExisting = () => {
    if (!pick) return;
    setError(null);
    start(async () => {
      const r = await markDocumentSentAction(opportunityId, pick);
      if (!r.ok) setError(r.error);
      else setOpen(false);
    });
  };

  const createNew = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError(null);
    start(async () => {
      const r = await createDocumentAction(form, opportunityId);
      if (!r.ok) setError(r.error);
      else setOpen(false);
    });
  };

  return (
    <section>
      <SectionTitle action={<Button size="sm" variant="ghost" onClick={() => setOpen(true)}>+ Attach a document</Button>}>Documents sent</SectionTitle>
      {sent.length === 0 ? (
        <Card tone="low">
          <EmptyState title="Nothing sent yet." hint="Record which resume or cover letter version went to this company so you know what they have seen." />
        </Card>
      ) : (
        <Card className={cx(pending && "opacity-70")}>
          <ul className="divide-y divide-vellum-high">
            {sent.map((s) => (
              <li key={s.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-ink-900 font-medium truncate">{s.document.name}</p>
                  <p className="text-[11px] text-ink-600 mt-0.5 flex items-center gap-2">
                    <Badge className="bg-vellum-high text-ink-700">{humanize(s.document.type)}</Badge>
                    {s.document.version && <span>{s.document.version}</span>}
                    <span>Sent {formatDate(s.sentAt)}</span>
                  </p>
                </div>
                <button type="button" onClick={() => unlink(s.document.id)} className="text-[10px] uppercase tracking-label text-ink-600 hover:text-terracotta shrink-0">
                  Unlink
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <div className="mt-2">
        <ErrorText>{error}</ErrorText>
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} eyebrow="Documents" title="Attach a document">
        <div className="flex gap-1 mb-5 bg-vellum-low rounded p-1">
          {(["existing", "new"] as const).map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)} className={cx("flex-1 py-1.5 text-[11px] font-semibold uppercase tracking-label rounded transition-colors", mode === m ? "bg-vellum-lowest text-terracotta shadow-card" : "text-ink-600")}>
              {m === "existing" ? "From your library" : "New document"}
            </button>
          ))}
        </div>

        {mode === "existing" ? (
          <div className="space-y-5">
            {available.length === 0 ? (
              <p className="text-sm font-serif italic text-ink-700">Every document in your library is already attached. Create a new one instead.</p>
            ) : (
              <Field label="Document">
                <Select value={pick} onChange={(e) => setPick(e.target.value)}>
                  {available.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                      {d.version ? ` (${d.version})` : ""}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={attachExisting} loading={pending} disabled={!available.length || !pick}>
                Mark as sent
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={createNew} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Name" className="sm:col-span-2">
              <Input name="name" required placeholder="Resume, AI companies" />
            </Field>
            <Field label="Type">
              <Select name="type" defaultValue="resume">
                {DOC_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {humanize(t)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Version">
              <Input name="version" placeholder="v3" />
            </Field>
            <Field label="Notes" className="sm:col-span-2" hint="What changed in this version.">
              <Textarea name="notes" rows={2} />
            </Field>
            <div className="sm:col-span-2 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={pending}>
                Create and mark as sent
              </Button>
            </div>
          </form>
        )}
        <div className="mt-3">
          <ErrorText>{error}</ErrorText>
        </div>
      </Dialog>
    </section>
  );
}
