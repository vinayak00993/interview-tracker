"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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
  source: string | null;
  _count: { interviews: number };
}

interface KanbanBoardProps {
  opportunities: Opportunity[];
}

const COLUMNS = [
  { status: "saved", label: "Saved", color: "#8a7d6d", bg: "bg-warm-100/40" },
  { status: "applied", label: "Applied", color: "#d4a03c", bg: "bg-amber-50/40" },
  { status: "interviewing", label: "Interviewing", color: "#b33a3a", bg: "bg-terra/[0.03]" },
  { status: "offer", label: "Offer", color: "#6b9e5c", bg: "bg-green-50/40" },
  { status: "rejected", label: "Rejected", color: "#c44848", bg: "bg-red-50/30" },
  { status: "withdrawn", label: "Withdrawn", color: "#9b7bb8", bg: "bg-purple-50/30" },
];

const PRIORITY_BORDER: Record<string, string> = {
  high: "border-l-terra",
  medium: "border-l-amber-400",
  low: "border-l-warm-300",
};

// Generate a consistent color from a string
function stringToColor(str: string): string {
  const colors = [
    "#b33a3a", "#d4a03c", "#6b9e5c", "#5b8abf", "#9b7bb8",
    "#c47a5a", "#7a9e8e", "#b07ab0", "#8a7d6d", "#5a8a9e",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function CompanyAvatar({ company }: { company: string }) {
  const [imgError, setImgError] = useState(false);
  const domain = company
    .replace(/\s*\(.*?\)\s*/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
  const logoUrl = `https://logo.clearbit.com/${domain}.com`;
  const initial = company.charAt(0).toUpperCase();
  const color = stringToColor(company);

  if (imgError) {
    return (
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-semibold text-white shrink-0"
        style={{ backgroundColor: color }}
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={logoUrl}
      alt={company}
      className="w-7 h-7 rounded-lg object-contain bg-white border border-warm-200/60 shrink-0"
      onError={() => setImgError(true)}
    />
  );
}

const PRIORITY_ICONS: Record<string, string> = {
  high: "↑",
  medium: "→",
  low: "↓",
};

export default function KanbanBoard({ opportunities }: KanbanBoardProps) {
  const router = useRouter();
  const [localOpps, setLocalOpps] = useState(opportunities);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Sync local state when server data changes (e.g. after adding a new opp)
  useEffect(() => {
    setLocalOpps(opportunities);
  }, [opportunities]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jdUrl, setJdUrl] = useState("");
  const [isFetchingJd, setIsFetchingJd] = useState(false);
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [screenshotPreviews, setScreenshotPreviews] = useState<string[]>([]);
  const [isProcessingScreenshots, setIsProcessingScreenshots] = useState(false);
  const [ocrStatus, setOcrStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterTier, setFilterTier] = useState("");
  const [showComp, setShowComp] = useState(true);

  // Apply search and filters
  const filtered = localOpps.filter((o) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matches =
        o.company.toLowerCase().includes(q) ||
        o.role.toLowerCase().includes(q) ||
        (o.location && o.location.toLowerCase().includes(q));
      if (!matches) return false;
    }
    if (filterPriority && o.priority !== filterPriority) return false;
    if (filterTier && o.tier !== parseInt(filterTier, 10)) return false;
    return true;
  });

  const hasActiveFilters = searchQuery || filterPriority || filterTier;

  const grouped = COLUMNS.map((col) => ({
    ...col,
    items: filtered.filter((o) => o.status === col.status),
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
    (e: React.DragEvent, newStatus: string) => {
      e.preventDefault();
      setDragOverColumn(null);
      const id = e.dataTransfer.getData("text/plain");
      if (!id) return;

      const opp = localOpps.find((o) => o.id === id);
      if (!opp || opp.status === newStatus) {
        setDraggedId(null);
        return;
      }

      // Optimistic update — move card instantly
      const previousStatus = opp.status;
      setLocalOpps((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
      );
      setDraggedId(null);

      // Fire API in background, rollback on failure
      fetch(`/api/opportunities/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
        .then((res) => {
          if (!res.ok) {
            // Rollback
            setLocalOpps((prev) =>
              prev.map((o) => (o.id === id ? { ...o, status: previousStatus } : o))
            );
          }
        })
        .catch(() => {
          // Rollback
          setLocalOpps((prev) =>
            prev.map((o) => (o.id === id ? { ...o, status: previousStatus } : o))
          );
        });
    },
    [localOpps]
  );

  const handleFetchJd = async () => {
    if (!jdUrl.trim()) return;
    setIsFetchingJd(true);
    try {
      const res = await fetch("/api/parse-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: jdUrl }),
      });
      if (res.ok) {
        const parsed = await res.json();
        fillFormFields(parsed);
      }
    } catch (err) {
      console.error("Failed to parse JD:", err);
    }
    setIsFetchingJd(false);
  };

  const fillFormFields = (parsed: Record<string, any>) => {
    const form = document.querySelector("form") as HTMLFormElement;
    if (!form) return;
    const fields = ["company", "role", "location", "compMin", "compMax", "jdLink"];
    for (const field of fields) {
      const input = form.querySelector(`[name="${field}"]`) as HTMLInputElement;
      if (input && parsed[field]) {
        input.value = String(parsed[field]);
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }
    if (parsed.remote) {
      const checkbox = form.querySelector('[name="remote"]') as HTMLInputElement;
      if (checkbox) checkbox.checked = true;
    }
  };

  const addScreenshots = (files: FileList | File[]) => {
    const newFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!newFiles.length) return;
    setScreenshots((prev) => [...prev, ...newFiles]);
    for (const file of newFiles) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setScreenshotPreviews((prev) => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeScreenshot = (index: number) => {
    setScreenshots((prev) => prev.filter((_, i) => i !== index));
    setScreenshotPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleScreenshotPaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) imageFiles.push(file);
      }
    }
    if (imageFiles.length) {
      e.preventDefault();
      addScreenshots(imageFiles);
    }
  };

  const handleScreenshotDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) {
      addScreenshots(e.dataTransfer.files);
    }
  };

  const processScreenshots = async () => {
    if (!screenshots.length) return;
    setIsProcessingScreenshots(true);
    setOcrStatus("Processing screenshots...");

    try {
      const formData = new FormData();
      for (const file of screenshots) {
        formData.append("screenshots", file);
      }

      const res = await fetch("/api/parse-screenshots", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const parsed = await res.json();
        fillFormFields(parsed);
        setOcrStatus("Fields auto-filled from screenshots");
      } else {
        const err = await res.json();
        setOcrStatus(`Error: ${err.error || "Failed to process"}`);
      }
    } catch (err) {
      console.error("Failed to process screenshots:", err);
      setOcrStatus("Error processing screenshots");
    }
    setIsProcessingScreenshots(false);
  };

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
        setJdUrl("");
        setScreenshots([]);
        setScreenshotPreviews([]);
        setOcrStatus("");
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
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-warm-600 uppercase tracking-wider">
          Pipeline
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3 py-1.5 text-xs font-medium bg-terra hover:bg-terra-light text-white rounded-lg shadow-card hover:shadow-glow hover:-translate-y-px transition-all duration-200"
        >
          + Add Opportunity
        </button>
      </div>

      {/* Search & Filter bar */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by company, role, or location..."
            className="w-full pl-8 pr-3 py-1.5 bg-white/80 backdrop-blur-sm border border-warm-300/60 rounded-lg text-warm-900 text-xs focus:outline-none focus:border-terra focus:shadow-glow/30 transition-all duration-200 placeholder:text-warm-400"
          />
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-warm-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="px-2.5 py-1.5 bg-white border border-warm-300 rounded-lg text-warm-700 text-xs focus:outline-none focus:border-terra transition-colors"
        >
          <option value="">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          value={filterTier}
          onChange={(e) => setFilterTier(e.target.value)}
          className="px-2.5 py-1.5 bg-white border border-warm-300 rounded-lg text-warm-700 text-xs focus:outline-none focus:border-terra transition-colors"
        >
          <option value="">All tiers</option>
          <option value="1">Tier 1</option>
          <option value="2">Tier 2</option>
          <option value="3">Tier 3</option>
        </select>
        <button
          onClick={() => setShowComp(!showComp)}
          className={`px-2.5 py-1.5 text-xs font-medium border rounded-lg transition-all duration-200 ${
            showComp
              ? "text-warm-700 border-warm-400 bg-warm-200/60"
              : "text-warm-500 border-warm-300/60 hover:border-warm-400"
          }`}
          title={showComp ? "Hide compensation" : "Show compensation"}
        >
          {showComp ? "$ visible" : "$ hidden"}
        </button>
        {hasActiveFilters && (
          <button
            onClick={() => { setSearchQuery(""); setFilterPriority(""); setFilterTier(""); }}
            className="px-2.5 py-1.5 text-xs text-warm-500 hover:text-warm-800 transition-colors"
          >
            Clear filters
          </button>
        )}
        {hasActiveFilters && (
          <span className="text-xs text-warm-500">
            {filtered.length} of {localOpps.length} shown
          </span>
        )}
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="mb-6 bg-white/90 backdrop-blur-sm border border-warm-300/60 rounded-xl p-5 shadow-elevated animate-scale-in">
          <h3 className="text-sm font-medium text-warm-900 mb-4">New Opportunity</h3>

          {/* JD URL paste bar */}
          <div className="mb-4 flex gap-2">
            <input
              type="url"
              value={jdUrl}
              onChange={(e) => setJdUrl(e.target.value)}
              placeholder="Paste a job description URL to auto-fill fields..."
              className="flex-1 px-3 py-2 bg-warm-100 border border-warm-300 rounded-lg text-warm-900 text-sm focus:outline-none focus:border-terra transition-colors placeholder:text-warm-500"
            />
            <button
              type="button"
              onClick={handleFetchJd}
              disabled={isFetchingJd || !jdUrl.trim()}
              className="px-4 py-2 text-xs font-medium bg-terra/20 text-terra-light border border-terra/30 hover:bg-terra/30 disabled:opacity-40 rounded-lg transition-colors"
            >
              {isFetchingJd ? "Parsing..." : "Auto-fill"}
            </button>
          </div>

          {/* Screenshot paste/drop zone */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-warm-500">or</span>
              <span className="text-xs font-medium text-warm-600">Paste / drop screenshots of the job description</span>
            </div>
            <div
              onPaste={handleScreenshotPaste}
              onDrop={handleScreenshotDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              tabIndex={0}
              className="border-2 border-dashed border-warm-300 rounded-lg p-4 text-center cursor-pointer hover:border-terra/40 hover:bg-terra/5 transition-colors focus:outline-none focus:border-terra/40"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && addScreenshots(e.target.files)}
              />
              {screenshotPreviews.length === 0 ? (
                <div className="py-2">
                  <p className="text-sm text-warm-500">
                    Click to upload, drag & drop, or paste (Ctrl+V) screenshots
                  </p>
                  <p className="text-xs text-warm-400 mt-1">
                    Supports multiple screenshots for long job descriptions
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 justify-center">
                  {screenshotPreviews.map((src, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={src}
                        alt={`Screenshot ${i + 1}`}
                        className="h-20 rounded border border-warm-300 object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeScreenshot(i); }}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {screenshots.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={processScreenshots}
                  disabled={isProcessingScreenshots}
                  className="px-4 py-2 text-xs font-medium bg-terra/20 text-terra border border-terra/30 hover:bg-terra/30 disabled:opacity-40 rounded-lg transition-colors"
                >
                  {isProcessingScreenshots ? "Processing..." : `Extract from ${screenshots.length} screenshot${screenshots.length > 1 ? "s" : ""}`}
                </button>
                {ocrStatus && (
                  <span className={`text-xs ${ocrStatus.startsWith("Error") ? "text-red-600" : "text-green-700"}`}>
                    {ocrStatus}
                  </span>
                )}
              </div>
            )}
          </div>

          <form onSubmit={handleAddOpportunity} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              options={["direct", "recruiter", "referral", "job board"]}
            />
            <Input name="fitScore" label="Fit Score (0-100)" type="number" />
            <div className="flex items-end gap-2 pb-1">
              <label className="flex items-center gap-2 text-xs text-warm-700 cursor-pointer">
                <input
                  type="checkbox"
                  name="remote"
                  value="true"
                  className="rounded border-warm-300 bg-warm-100"
                />
                Remote
              </label>
            </div>
            <div className="col-span-3">
              <label className="block text-xs font-medium text-warm-600 mb-1">Notes</label>
              <textarea
                name="notes"
                rows={2}
                className="w-full px-3 py-2 bg-warm-100 border border-warm-300 rounded-lg text-warm-900 text-sm focus:outline-none focus:border-terra transition-colors resize-none"
              />
            </div>
            <div className="col-span-3 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-xs text-warm-600 hover:text-warm-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 text-xs font-medium bg-terra hover:bg-terra-light disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                {isSubmitting ? "Adding..." : "Add Opportunity"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Kanban columns */}
      <div className="flex gap-3 sm:gap-4 min-h-[50vh] sm:min-h-[calc(100vh-220px)] overflow-x-auto pb-4 -mx-2 px-2">
        {grouped.map((col) => (
          <div
            key={col.status}
            className={`flex-1 min-w-[160px] sm:min-w-[220px] flex flex-col rounded-xl transition-all duration-150 ${
              dragOverColumn === col.status
                ? "bg-warm-200/80 ring-2 ring-terra/20 scale-[1.01]"
                : col.bg
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
              <span className="text-xs font-medium text-warm-700 uppercase tracking-wider">
                {col.label}
              </span>
              <span className="text-xs text-warm-500 ml-auto">
                {col.items.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex-1 px-2 pb-2 space-y-2 overflow-y-auto stagger-children">
              {col.items.map((opp) => (
                <div
                  key={opp.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, opp.id)}
                  className={`group bg-white/80 backdrop-blur-sm border border-warm-300/60 border-l-[3px] ${PRIORITY_BORDER[opp.priority] || "border-l-warm-300"} rounded-xl p-3 cursor-grab active:cursor-grabbing shadow-card hover:shadow-card-hover hover:border-warm-400/80 hover:-translate-y-0.5 transition-all duration-200 ${
                    draggedId === opp.id ? "opacity-40 scale-95 rotate-1" : ""
                  }`}
                >
                  <Link href={`/opportunities/${opp.id}`} className="block">
                    <div className="flex items-start gap-2.5">
                      <CompanyAvatar company={opp.company} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <h3 className="text-sm font-medium text-warm-900 truncate">
                            {opp.company}
                          </h3>
                          {opp.priority && (
                            <span
                              className={`text-xs shrink-0 ${
                                opp.priority === "high"
                                  ? "text-terra"
                                  : opp.priority === "low"
                                  ? "text-warm-400"
                                  : "text-warm-500"
                              }`}
                              title={`${opp.priority} priority`}
                            >
                              {PRIORITY_ICONS[opp.priority] || ""}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-warm-600 truncate mt-0.5">
                          {opp.role}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {opp.fitScore != null && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-terra/10 text-terra border border-terra/20">
                          {opp.fitScore}%
                        </span>
                      )}
                      {opp.tier != null && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-warm-200 text-warm-700 border border-warm-300">
                          T{opp.tier}
                        </span>
                      )}
                      {opp.source === "referral" && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-50 text-green-700 border border-green-200" title="Referral">
                          ref
                        </span>
                      )}
                      {opp._count.interviews > 0 && (
                        <span className="text-[10px] text-warm-500">
                          {opp._count.interviews} int.
                        </span>
                      )}
                    </div>

                    {showComp && opp.compMin != null && opp.compMax != null && (
                      <p className="text-[10px] text-warm-500 mt-1.5">
                        ${opp.compMin}K – ${opp.compMax}K
                      </p>
                    )}

                    {opp.location && (
                      <p className="text-[10px] text-warm-500 mt-0.5 truncate">
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
      <label className="block text-xs font-medium text-warm-600 mb-1">
        {label}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        className="w-full px-3 py-2 bg-warm-100 border border-warm-300 rounded-lg text-warm-900 text-sm focus:outline-none focus:border-terra transition-colors"
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
      <label className="block text-xs font-medium text-warm-600 mb-1">
        {label}
      </label>
      <select
        name={name}
        defaultValue={defaultValue}
        className="w-full px-3 py-2 bg-warm-100 border border-warm-300 rounded-lg text-warm-900 text-sm focus:outline-none focus:border-terra transition-colors"
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
