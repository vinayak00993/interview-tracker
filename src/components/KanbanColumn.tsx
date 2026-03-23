"use client";

import { useState, useCallback } from "react";
import OpportunityCard from "./OpportunityCard";

interface OpportunityData {
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

interface KanbanColumnProps {
  status: string;
  label: string;
  opportunities: OpportunityData[];
  onDrop: (oppId: string, newStatus: string) => void;
}

const STATUS_HEADER_COLOR: Record<string, string> = {
  saved: "#6b7280",
  applied: "#f59e0b",
  interviewing: "#3b82f6",
  offer: "#22c55e",
  rejected: "#ef4444",
  withdrawn: "#8b5cf6",
};

export default function KanbanColumn({
  status,
  label,
  opportunities,
  onDrop,
}: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const headerColor = STATUS_HEADER_COLOR[status.toLowerCase()] ?? "#6b7280";

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setIsDragOver(true);
    },
    []
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      // Only count as leave if we left the column itself
      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        setIsDragOver(false);
      }
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      const oppId = e.dataTransfer.getData("text/plain");
      if (oppId) {
        onDrop(oppId, status);
      }
    },
    [onDrop, status]
  );

  return (
    <div
      className={`
        flex flex-col rounded-xl bg-[#0d0d14] min-h-[400px] w-[300px] flex-shrink-0
        transition-colors duration-150
        ${isDragOver ? "ring-1 ring-[#6366f1]/40 bg-[#0f0f1a]" : ""}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column header */}
      <div className="flex items-center gap-2.5 px-3.5 py-3">
        <span
          className="h-2.5 w-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: headerColor }}
        />
        <h2 className="text-sm font-semibold text-[#e2e8f0]">{label}</h2>
        <span className="ml-auto text-xs font-medium text-[#64748b] tabular-nums">
          {opportunities.length}
        </span>
      </div>

      {/* Divider with status color */}
      <div
        className="mx-3 h-px opacity-30"
        style={{ backgroundColor: headerColor }}
      />

      {/* Cards */}
      <div className="flex flex-col gap-2 p-2.5 flex-1">
        {opportunities.map((opp) => (
          <OpportunityCard key={opp.id} {...opp} />
        ))}

        {opportunities.length === 0 && (
          <div
            className={`
              flex items-center justify-center rounded-lg border border-dashed
              border-[#2a2a3a] py-10 text-xs text-[#64748b]
              transition-colors duration-150
              ${isDragOver ? "border-[#6366f1]/40 text-[#94a3b8]" : ""}
            `}
          >
            Drop here
          </div>
        )}
      </div>
    </div>
  );
}
