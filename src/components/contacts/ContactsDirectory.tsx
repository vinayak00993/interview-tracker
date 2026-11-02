"use client";

import { useMemo, useState, useTransition } from "react";
import type { ContactWithLinks } from "@/lib/data/contacts";
import { Button, Card, EmptyState, ErrorText, PageTitle } from "@/components/ui";
import { deleteContactAction } from "@/lib/actions/contacts";
import { CONTACT_TYPES } from "@/lib/validation";
import { humanize } from "@/lib/pipeline";
import { ContactCard } from "./ContactCard";
import { ContactDialog } from "./ContactDialog";

export function ContactsDirectory({ contacts }: { contacts: ContactWithLinks[] }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [editing, setEditing] = useState<ContactWithLinks | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, start] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return contacts.filter((c) => {
      if (type && c.type !== type) return false;
      if (!q) return true;
      return [c.name, c.company, c.title].some((v) => v?.toLowerCase().includes(q));
    });
  }, [contacts, query, type]);

  const remove = (c: ContactWithLinks) => {
    if (!confirm(`Delete ${c.name}? This also unlinks them from every opportunity.`)) return;
    setError(null);
    setPendingId(c.id);
    start(async () => {
      const r = await deleteContactAction(c.id);
      if (!r.ok) setError(r.error);
      setPendingId(null);
    });
  };

  return (
    <div>
      <PageTitle
        eyebrow="People"
        title="Contacts"
        description="Recruiters, hiring managers, referrals, and everyone else in the process."
        actions={<Button onClick={() => setAdding(true)}>+ Add contact</Button>}
      />

      {contacts.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-6 bg-vellum-low rounded px-3 py-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, company, or title"
            className="flex-1 min-w-[180px] px-2 py-1.5 bg-transparent text-ink-900 text-xs focus:outline-none focus:bg-vellum-lowest rounded border-b border-transparent focus:border-terracotta transition-all placeholder:text-ink-600"
          />
          <select value={type} onChange={(e) => setType(e.target.value)} className="px-2.5 py-1.5 bg-transparent text-ink-700 text-[11px] font-medium uppercase tracking-label focus:outline-none cursor-pointer">
            <option value="">All types</option>
            {CONTACT_TYPES.map((t) => (
              <option key={t} value={t}>{humanize(t)}</option>
            ))}
          </select>
          {(query || type) && (
            <span className="text-[10px] uppercase tracking-label text-ink-600 ml-auto">
              {filtered.length} of {contacts.length}
            </span>
          )}
        </div>
      )}

      {error && <div className="mb-4"><ErrorText>{error}</ErrorText></div>}

      {contacts.length === 0 ? (
        <Card>
          <EmptyState
            title="No contacts yet."
            hint="Add recruiters and hiring managers here, or from the Contacts tab on any opportunity, and they show up in both places."
            action={<Button onClick={() => setAdding(true)}>+ Add contact</Button>}
          />
        </Card>
      ) : filtered.length === 0 ? (
        <Card><EmptyState title="No one matches that search." /></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((c) => (
            <ContactCard key={c.id} contact={c} onEdit={() => setEditing(c)} onDelete={() => remove(c)} pending={pendingId === c.id} />
          ))}
        </div>
      )}

      <ContactDialog open={adding} onClose={() => setAdding(false)} />
      <ContactDialog open={Boolean(editing)} onClose={() => setEditing(null)} contact={editing} />
    </div>
  );
}
