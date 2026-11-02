"use client";

import { useState, useTransition } from "react";
import type { OpportunityDetail } from "@/lib/data/opportunities";
import { attachContactAction, createContactForOpportunityAction, detachContactAction, updateContactAction } from "@/lib/actions/contacts";
import { WARMTH_BADGE, humanize } from "@/lib/pipeline";
import { Dialog } from "@/components/ui/Dialog";
import { Badge, Button, Card, EmptyState, ErrorText, Field, Select, cx } from "@/components/ui";
import { ContactFormFields, CONTACT_ROLES } from "./ContactFormFields";

type Link = OpportunityDetail["opportunityContacts"][number];
type EditTarget = Pick<Link, "id" | "role" | "contact">;
interface DirectoryEntry {
  id: string;
  name: string;
  title: string | null;
  company: string | null;
}

export function OpportunityContacts({ opportunityId, links, directory }: { opportunityId: string; links: Link[]; directory: DirectoryEntry[] }) {
  const [adding, setAdding] = useState(false);
  const [mode, setMode] = useState<"existing" | "new">("new");
  const [pick, setPick] = useState("");
  const [pickRole, setPickRole] = useState("");
  const [editing, setEditing] = useState<EditTarget | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const available = directory.filter((c) => !links.some((l) => l.contact.id === c.id));

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) => {
    setError(null);
    start(async () => {
      const r = await fn();
      if (!r.ok) setError(r.error ?? "Something went wrong.");
      else after?.();
    });
  };

  const openAdd = () => {
    setMode(available.length ? "existing" : "new");
    setPick(available[0]?.id ?? "");
    setPickRole("");
    setAdding(true);
  };

  const createNew = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    run(() => createContactForOpportunityAction(opportunityId, form), () => setAdding(false));
  };

  const saveEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing) return;
    const form = new FormData(e.currentTarget);
    const role = form.get("role");
    form.delete("role");
    const contactId = editing.contact.id;
    run(
      async () => {
        const r = await updateContactAction(contactId, form, opportunityId);
        if (!r.ok) return r;
        if ((typeof role === "string" ? role : "") !== (editing.role ?? "")) {
          return attachContactAction(opportunityId, contactId, typeof role === "string" && role ? role : null);
        }
        return r;
      },
      () => setEditing(null)
    );
  };

  return (
    <div className="animate-fade-in-up">
      <div className="flex items-center justify-between mb-4 gap-3">
        <p className="text-sm font-serif italic text-ink-700">{links.length === 0 ? "No one linked yet." : `${links.length} ${links.length === 1 ? "person" : "people"} in this process.`}</p>
        <Button onClick={openAdd}>+ Add contact</Button>
      </div>
      <ErrorText>{error}</ErrorText>

      {links.length === 0 ? (
        <Card tone="low">
          <EmptyState title="Nobody here yet." hint="Add the recruiter, hiring manager, and anyone who referred you. Prep and follow-ups use their names." action={<Button onClick={openAdd}>Add contact</Button>} />
        </Card>
      ) : (
        <div className={cx("grid grid-cols-1 sm:grid-cols-2 gap-4", pending && "opacity-70")}>
          {links.map(({ id, role, contact }) => (
            <Card key={id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-serif text-lg text-ink-900 leading-tight">{contact.name}</h3>
                  <p className="text-xs text-ink-700 mt-0.5">
                    {contact.title}
                    {contact.title && contact.company ? " at " : ""}
                    {contact.company}
                  </p>
                </div>
                <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
                  {role && <Badge className="bg-terracotta/10 text-terracotta">{humanize(role)}</Badge>}
                  {contact.warmth && <Badge className={WARMTH_BADGE[contact.warmth] ?? "bg-vellum-high text-ink-700"}>{contact.warmth}</Badge>}
                </div>
              </div>
              <div className="mt-3 space-y-1 text-xs">
                {contact.email && (
                  <p>
                    <a href={`mailto:${contact.email}`} className="text-terracotta hover:underline">
                      {contact.email}
                    </a>
                  </p>
                )}
                {contact.phone && <p className="text-ink-700">{contact.phone}</p>}
                {contact.linkedIn && (
                  <p>
                    <a href={contact.linkedIn} target="_blank" rel="noopener noreferrer" className="text-terracotta hover:underline">
                      LinkedIn ↗
                    </a>
                  </p>
                )}
              </div>
              {contact.notes && <p className="text-xs text-ink-700 mt-3 pt-3 border-t border-vellum-high leading-relaxed">{contact.notes}</p>}
              <div className="flex gap-3 mt-3">
                <button type="button" onClick={() => setEditing({ id, role, contact })} className="text-[10px] font-semibold uppercase tracking-label text-ink-600 hover:text-terracotta">
                  Edit
                </button>
                <button type="button" onClick={() => run(() => detachContactAction(opportunityId, contact.id))} className="text-[10px] font-semibold uppercase tracking-label text-ink-600 hover:text-terracotta">
                  Unlink
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={adding} onClose={() => setAdding(false)} eyebrow="Contacts" title="Add someone to this process" size="lg">
        <div className="flex gap-1 mb-5 bg-vellum-low rounded p-1">
          {(["existing", "new"] as const).map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)} className={cx("flex-1 py-1.5 text-[11px] font-semibold uppercase tracking-label rounded transition-colors", mode === m ? "bg-vellum-lowest text-terracotta shadow-card" : "text-ink-600")}>
              {m === "existing" ? "Someone you know" : "New contact"}
            </button>
          ))}
        </div>
        {mode === "existing" ? (
          <div className="space-y-5">
            {available.length === 0 ? (
              <p className="text-sm font-serif italic text-ink-700">Everyone in your contacts is already linked here. Add a new contact instead.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Contact">
                  <Select value={pick} onChange={(e) => setPick(e.target.value)}>
                    {available.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                        {c.company ? `, ${c.company}` : ""}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Role in this process">
                  <Select value={pickRole} onChange={(e) => setPickRole(e.target.value)}>
                    <option value="">Not set</option>
                    {CONTACT_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {humanize(r)}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setAdding(false)}>
                Cancel
              </Button>
              <Button onClick={() => run(() => attachContactAction(opportunityId, pick, pickRole || null), () => setAdding(false))} loading={pending} disabled={!pick}>
                Link contact
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={createNew} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <ContactFormFields />
            <div className="sm:col-span-2 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setAdding(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={pending}>
                Add contact
              </Button>
            </div>
          </form>
        )}
        <div className="mt-3">
          <ErrorText>{error}</ErrorText>
        </div>
      </Dialog>

      <Dialog open={Boolean(editing)} onClose={() => setEditing(null)} eyebrow="Contacts" title={editing ? `Edit ${editing.contact.name}` : ""} size="lg">
        <form key={editing?.id ?? "none"} onSubmit={saveEdit} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <ContactFormFields contact={editing?.contact} role={editing?.role} />
          <div className="sm:col-span-2 flex items-center justify-between gap-3">
            <ErrorText>{error}</ErrorText>
            <div className="flex gap-2 ml-auto">
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit" loading={pending}>
                Save changes
              </Button>
            </div>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
