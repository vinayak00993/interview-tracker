"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Opportunity {
  id: string;
  company: string;
  role: string;
  location: string | null;
  remote: boolean;
  fitScore: number | null;
  compMin: number | null;
  compMax: number | null;
  priority: string;
  tier: number | null;
  status: string;
  _count: { interviews: number };
}

interface KanbanBoardProps {
  opportunities: Opportunity[];
}

const COLUMNS = [
  { status: "saved", label: "Saved", color: "#6b7280" },
  { status: "applied", label: "Applied", color: "#f59e0b" },
  { status: "interviewing", label: "Interviewing", color: "#3b82f6" },
  { status: "offer", label: "Offer", color: "#22c55e" },
  { status: "rejected", label: "Rejected", color: "#ef4444" },
  { status: "withdrawn", label: "Withdrawn", color: "#8b5cf6" },
];

const PRIORITY_ICONS: Record<string, string> = {
  high: "↑",
  medium: "→",
  low: "↓",
};

export default function KanbanBoard({ opportunities }: KanbanBoardProps) {
  const router = useRouter();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const grouped = COLUMNS.map((col) => ({
    ...col,
    items: opportunities.filter((o) => o.status === col.status),
  }));

  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, status: string) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (dragOverColumn !== status) setDragOverColumn(status);
    },
    [dragOverColumn]
  );

  const handleDragLeave = useCallback(() => {
    setDragOverColumn(null);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, newStatus: string) => {
      e.preventDefault();
      setDragOverColumn(null);
      const id = e.dataTransfer.getData("text/plain");
      if (!id) return;

      const opp = opportunities.find((o) => o.id === id);
      if (!opp || opp.status === newStatus) {
        setDraggedId(null);
        return;
      }

      try {
        const res = await fetch(`/api/opportunities/${id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        if (res.ok) {
          router.refresh();
        }
      } catch (err) {
        console.error("Failed to update status:", err);
      }
      setDraggedId(null);
    },
    [opportunities, router]
  );

  const handleAddOpportunity = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    const data: Record<string, any> = {};
    formData.forEach((value, key) => {
      if (value === "") return;
      if (key === "compMin" || key === "compMax" || key === "fitScore" || key === "tier") {
        data[key] = parseInt(value as string, 10);
      } else if (key === "remote") {
        data[key] = true;
      } else {
        data[key] = value;
      }
    });
    if (!formData.get("remote")) data.remote = false;

    try {
      const res = await fetch("/api/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setShowAddForm(false);
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to create opportunity:", err);
    }
    setIsSubmitting(false);
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
          Pipeline
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
        >
          + Add Opportunity
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="mb-6 bg-[#111118] border border-[#2a2a3a] rounded-lg p-5">
          <h3 className="text-sm font-medium text-white mb-4">New Opportunity</h3>
          <form onSubmit={handleAddOpportunity} className="grid grid-cols-3 gap-4">
            <Input name="company" label="Company" required />
            <Input name="role" label="Role" required />
            <Input name="jdLink" label="JD Link" />
            <Input name="compMin" label="Comp Min ($K)" type="number" />
            <Input name="compMax" label="Comp Max ($K)" type="number" />
            <Input name="location" label="Location" />
            <Select
              name="priority"
              label="Priority"
              options={["high", "medium", "low"]}
              defaultValue="medium"
            />
            <Select
              name="tier"
              label="Tier"
              options={["1", "2", "3"]}
            />
            <Select
              name="source"
              label="Source"
              options={["direct", "recruiter", "referral", "job_board"]}
            />
            <Input name="fitScore" label="Fit Score (0-100)" type="number" />
            <div className="flex items-end gap-2 pb-1">
              <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  name="remote"
                  value="true"
                  className="rounded border-[#2a2a3a] bg-[#0a0a0f]"
                />
                Remote
              </label>
            </div>
            <div className="col-span-3">
              <label className="block text-xs font-medium text-slate-500 mb-1">Notes</label>
              <textarea
                name="notes"
                rows={2}
                className="w-full px-3 py-2 bg-[#0a0a0f] border border-[#2a2a3a] rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none"
              />
            </div>
            <div className="col-span-3 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                {isSubmitting ? "Adding..." : "Add Opportunity"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Kanban columns */}
      <div className="flex gap-4 min-h-[calc(100vh-220px)]">
        {grouped.map((col) => (
          <div
            key={col.status}
            className={`flex-1 min-w-[220px] flex flex-col rounded-lg transition-colors ${
              dragOverColumn === col.status
                ? "bg-[#1a1a24]"
                : "bg-[#0d0d14]"
            }`}
            onDragOver={(e) => handleDragOver(e, col.status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.status)}
          >
            {/* Column header */}
            <div className="p-3 flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: col.color }}
              />
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                {col.label}
              </span>
              <span className="text-xs text-slate-600 ml-auto">
                {col.items.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex-1 px-2 pb-2 space-y-2 overflow-y-auto">
              {col.items.map((opp) => (
                <div
                  key={opp.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, opp.id)}
                  className={`group bg-[#111118] border border-[#2a2a3a] rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-[#3a3a4a] transition-all ${
                    draggedId === opp.id ? "opacity-40" : ""
                  }`}
                >
                  <Link href={`/opportunities/${opp.id}`} className="block">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm font-medium text-white truncate">
                          {opp.company}
                        </h3>
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {opp.role}
                        </p>
                      </div>
                      {opp.priority && (
                        <span
                          className={`text-xs shrink-0 ${
                            opp.priority === "high"
                              ? "text-orange-400"
                              : opp.priority === "low"
                              ? "text-slate-600"
                              : "text-slate-500"
                          }`}
                          title={`${opp.priority} priority`}
                        >
                          {PRIORITY_ICONS[opp.priority] || ""}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {opp.fitScore != null && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {opp.fitScore}%
                        </span>
                      )}
                      {opp.tier != null && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-400 border border-slate-500/20">
                          T{opp.tier}
                        </span>
                      )}
                      {opp._count.interviews > 0 && (
                        <span className="text-[10px] text-slate-500">
                          {opp._count.interviews} int.
                        </span>
                      )}
                    </div>

                    {opp.compMin != null && opp.compMax != null && (
                      <p className="text-[10px] text-slate-600 mt-1.5">
                        ${opp.compMin}K – ${opp.compMax}K
                      </p>
                    )}

                    {opp.location && (
                      <p className="text-[10px] text-slate-600 mt-0.5 truncate">
                        {opp.location}
                        {opp.remote && " · Remote"}
                      </p>
                    )}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper form components
function Input({
  name,
  label,
  type = "text",
  required = false,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">
        {label}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        className="w-full px-3 py-2 bg-[#0a0a0f] border border-[#2a2a3a] rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
      />
    </div>
  );
}

function Select({
  name,
  label,
  options,
  defaultValue,
}: {
  name: string;
  label: string;
  options: string[];
  defaultValue?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">
        {label}
      </label>
      <select
        name={name}
        defaultValue={defaultValue}
        className="w-full px-3 py-2 bg-[#0a0a0f] border border-[#2a2a3a] rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
      >
        <option value="">—</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt.charAt(0).toUpperCase() + opt.slice(1)}
          </option>
        ))}
      </select>
    </div>
  );
}
