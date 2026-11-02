"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { DocumentWithLinks } from "@/lib/data/documents";
import { Badge, Button, Card, EmptyState, ErrorText, PageTitle } from "@/components/ui";
import { deleteDocumentAction } from "@/lib/actions/documents";
import { humanize } from "@/lib/pipeline";
import { formatDate } from "@/lib/format";
import { DocumentDialog } from "./DocumentDialog";

export function DocumentsLibrary({ documents }: { documents: DocumentWithLinks[] }) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<DocumentWithLinks | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, start] = useTransition();

  const remove = (d: DocumentWithLinks) => {
    if (!confirm(`Delete ${d.name}? Records of where it was sent go with it.`)) return;
    setError(null);
    setPendingId(d.id);
    start(async () => {
      const r = await deleteDocumentAction(d.id);
      if (!r.ok) setError(r.error);
      setPendingId(null);
    });
  };

  return (
    <div>
      <PageTitle
        eyebrow="Library"
        title="Documents"
        description="Resume versions, cover letters, and portfolios, with a record of which one went where."
        actions={<Button onClick={() => setAdding(true)}>+ Add document</Button>}
      />

      {error && <div className="mb-4"><ErrorText>{error}</ErrorText></div>}

      {documents.length === 0 ? (
        <Card>
          <EmptyState
            title="No documents yet."
            hint="Track each resume version here, then mark it as sent from an opportunity's Notes tab."
            action={<Button onClick={() => setAdding(true)}>+ Add document</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((d) => (
            <Card key={d.id} className={pendingId === d.id ? "opacity-50" : ""}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-base font-serif font-medium text-ink-900 leading-tight">{d.name}</h3>
                  {d.version && <p className="text-xs text-ink-600 mt-0.5">{d.version}</p>}
                </div>
                <Badge className="bg-vellum-high text-ink-700 shrink-0">{humanize(d.type)}</Badge>
              </div>
              {d.filePath && (
                <p className="text-xs mt-2 truncate">
                  {/^https?:\/\//.test(d.filePath) ? (
                    <a href={d.filePath} target="_blank" rel="noopener noreferrer" className="text-terracotta hover:text-terracotta-deep">{d.filePath}</a>
                  ) : (
                    <span className="text-ink-700 font-mono text-[11px]">{d.filePath}</span>
                  )}
                </p>
              )}
              {d.notes && <p className="text-xs text-ink-700 mt-2 whitespace-pre-wrap">{d.notes}</p>}
              <div className="mt-3 pt-3 border-t border-vellum-high">
                <p className="text-[10px] uppercase tracking-label text-ink-600 font-semibold mb-1">Sent to</p>
                {d.sentTo.length === 0 ? (
                  <p className="text-xs font-serif italic text-ink-600">Not sent anywhere yet.</p>
                ) : (
                  <ul className="space-y-0.5">
                    {d.sentTo.map((s) => (
                      <li key={s.id} className="text-xs flex items-center justify-between gap-3">
                        <Link href={`/opportunities/${s.opportunity.id}/notes`} className="text-ink-900 hover:text-terracotta transition-colors truncate">
                          {s.opportunity.company} · {s.opportunity.role}
                        </Link>
                        <span className="text-ink-600 shrink-0">{formatDate(s.sentAt)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="mt-3 flex justify-end gap-3">
                <button type="button" onClick={() => setEditing(d)} className="text-[10px] font-semibold uppercase tracking-label text-ink-700 hover:text-terracotta">Edit</button>
                <button type="button" onClick={() => remove(d)} className="text-[10px] font-semibold uppercase tracking-label text-ink-600 hover:text-terracotta">Delete</button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <DocumentDialog open={adding} onClose={() => setAdding(false)} />
      <DocumentDialog open={Boolean(editing)} onClose={() => setEditing(null)} document={editing} />
    </div>
  );
}
