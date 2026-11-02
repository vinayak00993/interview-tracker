"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { OpportunityDetail } from "@/lib/data/opportunities";
import { ALL_STATUSES, stageFor, formatComp, formatLocation } from "@/lib/pipeline";
import { changeStatusAction, deleteOpportunityAction } from "@/lib/actions/opportunities";
import { Badge, Button, ErrorText } from "@/components/ui";
import { CompanyAvatar } from "@/components/CompanyAvatar";
import { EditOpportunityDialog } from "./EditOpportunityDialog";

export function OpportunityHeader({ opportunity: opp }: { opportunity: OpportunityDetail }) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const stage = stageFor(opp.status);
  const comp = formatComp(opp.compMin, opp.compMax);

  const onStatus = (status: string) =>
    start(async () => {
      const r = await changeStatusAction(opp.id, status);
      if (!r.ok) setError(r.error);
    });

  const onDelete = () => {
    if (!confirm(`Delete ${opp.company}, ${opp.role}? This removes its interviews, prep, and notes.`)) return;
    start(async () => {
      const r = await deleteOpportunityAction(opp.id);
      if (!r.ok) setError(r.error);
    });
  };

  return (
    <div className="mb-6">
      <Link href="/dashboard" className="inline-block text-[11px] font-semibold uppercase tracking-label text-ink-600 hover:text-terracotta transition-colors mb-4">
        ← Pipeline
      </Link>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
        <div className="flex-1 min-w-0 flex items-start gap-4">
          <CompanyAvatar company={opp.company} website={opp.website} size={44} className="mt-1 hidden sm:flex" />
          <div className="min-w-0">
            <p className="manuscript-label">{opp.source ? `via ${opp.source.replace("_", " ")}` : "Opportunity"}</p>
            <h1 className="manuscript-display text-3xl sm:text-4xl lg:text-[2.75rem] font-semibold text-ink-900 leading-[1.05] tracking-tight mt-1">{opp.role}</h1>
            <p className="text-lg font-serif italic text-ink-700 mt-2">
              at <span className="text-ink-900 not-italic font-medium">{opp.company}</span>
              {(opp.location || opp.remote) && <span className="text-ink-600"> · {formatLocation(opp.location, opp.remote)}</span>}
            </p>
            <div className="flex items-center gap-3 mt-4 flex-wrap">
              <Badge className={stage.badge}>{stage.label}</Badge>
              {comp && <span className="text-[11px] text-ink-700 font-medium">{comp}</span>}
              {opp.fitScore != null && <span className="text-[11px] font-semibold uppercase tracking-label text-terracotta">{opp.fitScore}% fit</span>}
              {opp.tier && <Badge className="bg-vellum-high text-ink-700">Tier {opp.tier}</Badge>}
              {opp.priority && <Badge className="bg-vellum-high text-ink-700">{opp.priority} priority</Badge>}
              {opp.jdLink && (
                <a href={opp.jdLink} target="_blank" rel="noopener noreferrer" className="text-[11px] font-semibold uppercase tracking-label text-terracotta hover:text-terracotta-deep underline underline-offset-2">
                  View JD ↗
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={opp.status}
            disabled={pending}
            onChange={(e) => onStatus(e.target.value)}
            className="px-3 py-2 text-[11px] font-semibold uppercase tracking-label bg-vellum-lowest text-ink-900 rounded shadow-card focus:outline-none focus:ring-2 focus:ring-terracotta/20 cursor-pointer"
            aria-label="Status"
          >
            {ALL_STATUSES.map((s) => (
              <option key={s.status} value={s.status}>
                {s.label}
              </option>
            ))}
          </select>
          <Button variant="ghost" onClick={() => setEditing(true)}>
            Edit
          </Button>
          <Button variant="danger" onClick={onDelete} disabled={pending}>
            Delete
          </Button>
        </div>
      </div>
      {error && <div className="mt-3"><ErrorText>{error}</ErrorText></div>}
      <EditOpportunityDialog opportunity={opp} open={editing} onClose={() => setEditing(false)} />
    </div>
  );
}
