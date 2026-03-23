"use client";

import Link from "next/link";
import StatusBadge from "./StatusBadge";

interface OpportunityCardProps {
  id: string;
  company: string;
  role: string;
  location?: string | null;
  fitScore?: number | null;
  compMin?: number | null;
  compMax?: number | null;
  tier?: number | null;
  priority?: string | null;
  interviewCount?: number;
  status: string;
}

const PRIORITY_DOT: Record<string, string> = {
  high: "bg-pipeline-rejected",
  medium: "bg-pipeline-applied",
  low: "bg-pipeline-saved",
};

function formatComp(value: number): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
  return `$${value}`;
}

export default function OpportunityCard({
  id,
  company,
  role,
  location,
  fitScore,
  compMin,
  compMax,
  tier,
  priority,
  interviewCount = 0,
  status,
}: OpportunityCardProps) {
  const hasComp = compMin != null || compMax != null;

  return (
    <Link
      href={`/opportunities/${id}`}
      draggable
      data-id={id}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", id);
        e.dataTransfer.effectAllowed = "move";
      }}
      className="
        group block rounded-lg border border-[#2a2a3a] bg-[#111118] p-3.5
        transition-all duration-150
        hover:border-[#3a3a4a] hover:bg-[#16161f] hover:shadow-lg hover:shadow-black/20
        hover:-translate-y-0.5
        cursor-grab active:cursor-grabbing
      "
    >
      {/* Header: company + priority dot */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-[#e2e8f0] leading-tight truncate">
          {company}
        </h3>
        {priority && (
          <span
            className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${PRIORITY_DOT[priority] ?? "bg-pipeline-saved"}`}
            title={`${priority} priority`}
          />
        )}
      </div>

      {/* Role */}
      <p className="mt-0.5 text-xs text-[#94a3b8] leading-snug truncate">
        {role}
      </p>

      {/* Location */}
      {location && (
        <p className="mt-1 text-xs text-[#64748b] truncate">
          {location}
        </p>
      )}

      {/* Metadata row */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {/* Fit score */}
        {fitScore != null && (
          <span
            className={`
              inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium
              ${fitScore >= 80 ? "bg-pipeline-offer-bg text-pipeline-offer-light"
                : fitScore >= 60 ? "bg-pipeline-applied-bg text-pipeline-applied-light"
                : "bg-pipeline-saved-bg text-pipeline-saved-light"}
            `}
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {fitScore}%
          </span>
        )}

        {/* Comp range */}
        {hasComp && (
          <span className="text-xs text-[#64748b]">
            {compMin != null && compMax != null
              ? `${formatComp(compMin)} - ${formatComp(compMax)}`
              : compMin != null
              ? `${formatComp(compMin)}+`
              : `Up to ${formatComp(compMax!)}`}
          </span>
        )}
      </div>

      {/* Footer row */}
      <div className="mt-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {tier != null && (
            <span className="text-[10px] font-medium uppercase tracking-wider text-[#64748b]">
              Tier {tier}
            </span>
          )}
          {interviewCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-[#64748b]">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {interviewCount}
            </span>
          )}
        </div>
        <StatusBadge status={status} size="sm" />
      </div>
    </Link>
  );
}
