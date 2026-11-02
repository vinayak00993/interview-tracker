import Link from "next/link";
import type { ContactWithLinks } from "@/lib/data/contacts";
import { Badge, Card } from "@/components/ui";
import { WARMTH_BADGE, humanize } from "@/lib/pipeline";
import { formatDate } from "@/lib/format";

export function ContactCard({ contact, onEdit, onDelete, pending }: { contact: ContactWithLinks; onEdit: () => void; onDelete: () => void; pending?: boolean }) {
  return (
    <Card className={pending ? "opacity-50" : ""}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-serif font-medium text-ink-900 leading-tight">{contact.name}</h3>
          <p className="text-xs text-ink-700 mt-0.5">
            {contact.title}
            {contact.title && contact.company && " at "}
            {contact.company}
          </p>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <Badge className="bg-vellum-high text-ink-700">{humanize(contact.type)}</Badge>
          {contact.warmth && <Badge className={WARMTH_BADGE[contact.warmth] ?? "bg-vellum-high text-ink-700"}>{contact.warmth}</Badge>}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {contact.email && <a href={`mailto:${contact.email}`} className="text-terracotta hover:text-terracotta-deep">{contact.email}</a>}
        {contact.phone && <span className="text-ink-700">{contact.phone}</span>}
        {contact.linkedIn && (
          <a href={contact.linkedIn} target="_blank" rel="noopener noreferrer" className="text-terracotta hover:text-terracotta-deep">
            LinkedIn ↗
          </a>
        )}
      </div>

      {contact.opportunityContacts.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] uppercase tracking-label text-ink-600 font-semibold mb-1">Linked to</p>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {contact.opportunityContacts.map((link) => (
              <Link key={link.id} href={`/opportunities/${link.opportunity.id}/contacts`} className="text-xs text-ink-900 hover:text-terracotta transition-colors">
                {link.opportunity.company} · {link.opportunity.role}
                {link.role && <span className="text-ink-600"> ({humanize(link.role)})</span>}
              </Link>
            ))}
          </div>
        </div>
      )}

      {contact.notes && <p className="text-xs text-ink-700 mt-3 pt-3 border-t border-vellum-high whitespace-pre-wrap">{contact.notes}</p>}

      <div className="mt-3 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-label text-ink-600">{contact.lastContactedAt ? `Last contact ${formatDate(contact.lastContactedAt)}` : "No contact logged"}</span>
        <div className="flex gap-3">
          <button type="button" onClick={onEdit} className="text-[10px] font-semibold uppercase tracking-label text-ink-700 hover:text-terracotta">Edit</button>
          <button type="button" onClick={onDelete} className="text-[10px] font-semibold uppercase tracking-label text-ink-600 hover:text-terracotta">Delete</button>
        </div>
      </div>
    </Card>
  );
}
