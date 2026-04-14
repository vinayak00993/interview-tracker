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
  website: string | null;
  _count: { interviews: number };
}

interface KanbanBoardProps {
  opportunities: Opportunity[];
}

// Earthen Manuscript column palette — uniform elevated surface for every
// column so the kanban reads as a single rack; each stage gets a small
// coloured marker dot in the header so status stays visually identifiable.
const COLUMNS = [
  { status: "saved",        label: "Saved",        surface: "bg-vellum-lowest", accent: "text-ink-700",    chip: "bg-vellum-high text-ink-700",     marker: "bg-ink-400" },
  { status: "applied",      label: "Applied",      surface: "bg-vellum-lowest", accent: "text-ink-700",    chip: "bg-umber-soft text-umber",        marker: "bg-umber" },
  { status: "interviewing", label: "Interviewing", surface: "bg-vellum-lowest", accent: "text-terracotta", chip: "bg-terracotta text-vellum",       marker: "bg-terracotta" },
  { status: "offer",        label: "Offer",        surface: "bg-vellum-lowest", accent: "text-sage",       chip: "bg-sage/15 text-sage",            marker: "bg-sage" },
  { status: "rejected",     label: "Archived",     surface: "bg-vellum-lowest", accent: "text-ink-700",    chip: "bg-vellum-high text-ink-700",     marker: "bg-[#88726e]" },
  { status: "withdrawn",    label: "Withdrawn",    surface: "bg-vellum-lowest", accent: "text-ink-700",    chip: "bg-vellum-high text-ink-700",     marker: "bg-ink-300" },
];

const PRIORITY_DOT: Record<string, string> = {
  high: "bg-terracotta",
  medium: "bg-umber",
  low: "bg-ink-400",
};

// Generate a consistent color from a string — now confined to the Earthen palette
function stringToColor(str: string): string {
  const colors = ["#843728", "#a24e3d", "#695c4c", "#4c513e", "#88726e", "#b98a3c", "#7a6e85"];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function CompanyAvatar({ company, website }: { company: string; website?: string | null }) {
  const [imgError, setImgError] = useState(false);

  let logoDomain: string;
  if (website) {
    try {
      logoDomain = new URL(website).hostname;
    } catch {
      logoDomain = website.replace(/^https?:\/\//, "").split("/")[0];
    }
  } else {
    logoDomain = company
      .replace(/\s*\(.*?\)\s*/g, "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase() + ".com";
  }
  const logoUrl = `https://www.google.com/s2/favicons?domain=${logoDomain}&sz=128`;
  const initial = company.charAt(0).toUpperCase();
  const color = stringToColor(company);

  if (imgError) {
    return (
      <div
        className="w-8 h-8 rounded flex items-center justify-center text-[12px] font-serif font-medium text-vellum shrink-0"
        style={{ backgroundColor: color }}
      >
        {initial}
      </div>
    );
  }

  // Render the <img> directly, with the tinted initial as an instant
  // backdrop. Favicon paints over it when it arrives. No JS timeout.
  return (
    <div
      className="relative w-8 h-8 rounded flex items-center justify-center text-[12px] font-serif font-medium text-vellum shrink-0 overflow-hidden"
      style={{ backgroundColor: color }}
    >
      <span className="absolute inset-0 flex items-center justify-center">{initial}</span>
      <img
        src={logoUrl}
        alt={company}
        loading="lazy"
        decoding="async"
        className="w-8 h-8 rounded object-contain bg-vellum-lowest relative z-10"
        onError={() => setImgError(true)}
      />
    </div>
  );
}

const PRIORITY_LABEL: Record<string, string> = {
  high: "HIGH",
  medium: "MED",
  low: "LOW",
};

export default function KanbanBoard({ opportunities }: KanbanBoardProps) {
  const router = useRouter();
  const [localOpps, setLocalOpps] = useState(opportunities);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

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

  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterTier, setFilterTier] = useState("");
  const [showComp, setShowComp] = useState(true);

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

      const previousStatus = opp.status;
      setLocalOpps((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
      );
      setDraggedId(null);

      fetch(`/api/opportunities/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
        .then((res) => {
          if (!res.ok) {
            setLocalOpps((prev) =>
              prev.map((o) => (o.id === id ? { ...o, status: previousStatus } : o))
            );
          }
        })
        .catch(() => {
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
    const fields = ["company", "role", "location", "compMin", "compMax", "jdLink", "website"];
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
    setOcrStatus("Reading screenshots...");

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
        setOcrStatus("Fields auto-filled");
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
      {/* Toolbar — editorial section heading */}
      <div className="flex items-end justify-between mb-5 gap-3 flex-wrap">
        <div>
          <p className="manuscript-label">The Archive</p>
          <h2 className="manuscript-display text-2xl sm:text-[1.75rem] font-semibold text-ink-900 leading-tight mt-0.5">
            Active Pursuits
          </h2>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 text-[11px] font-semibold uppercase tracking-label bg-terracotta hover:bg-terracotta-deep text-vellum rounded shadow-card hover:shadow-lift hover:-translate-y-0.5 transition-all"
        >
          + New Entry
        </button>
      </div>

      {/* Search & filter bar */}
      <div className="flex flex-wrap items-center gap-2 mb-6 bg-vellum-low rounded px-3 py-2">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search company, role, or location..."
            className="w-full pl-8 pr-3 py-1.5 bg-transparent text-ink-900 text-xs focus:outline-none focus:bg-vellum-lowest rounded border-b border-transparent focus:border-terracotta transition-all placeholder:text-ink-600"
          />
          <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="px-2.5 py-1.5 bg-transparent text-ink-700 text-[11px] font-medium uppercase tracking-label focus:outline-none cursor-pointer"
        >
          <option value="">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          value={filterTier}
          onChange={(e) => setFilterTier(e.target.value)}
          className="px-2.5 py-1.5 bg-transparent text-ink-700 text-[11px] font-medium uppercase tracking-label focus:outline-none cursor-pointer"
        >
          <option value="">All tiers</option>
          <option value="1">Tier I</option>
          <option value="2">Tier II</option>
          <option value="3">Tier III</option>
        </select>
        <button
          onClick={() => setShowComp(!showComp)}
          className={`px-2.5 py-1 text-[11px] font-semibold uppercase tracking-label rounded transition-all ${
            showComp
              ? "text-terracotta bg-terracotta/10"
              : "text-ink-600 hover:text-terracotta"
          }`}
        >
          {showComp ? "Hide Salary" : "Show Salary"}
        </button>
        {hasActiveFilters && (
          <button
            onClick={() => { setSearchQuery(""); setFilterPriority(""); setFilterTier(""); }}
            className="px-2 py-1 text-[11px] uppercase tracking-label text-ink-600 hover:text-terracotta transition-colors"
          >
            Clear
          </button>
        )}
        {hasActiveFilters && (
          <span className="text-[10px] uppercase tracking-label text-ink-600 ml-auto">
            {filtered.length} of {localOpps.length}
          </span>
        )}
      </div>

      {/* Add form — frosted manuscript card */}
      {showAddForm && (
        <div className="mb-6 manuscript-glass bg-vellum-lowest/85 rounded-lg p-6 shadow-elevated animate-scale-in">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="manuscript-label">New Entry</p>
              <h3 className="manuscript-display text-lg font-semibold text-ink-900 mt-0.5">Document your next chapter</h3>
            </div>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-ink-600 hover:text-terracotta text-lg leading-none w-6 h-6 flex items-center justify-center"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* JD URL */}
          <div className="mb-5">
            <label className="manuscript-label block mb-1.5">Job Description URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={jdUrl}
                onChange={(e) => setJdUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 px-3 py-2 bg-transparent text-ink-900 text-sm focus:outline-none border-b border-outlineSoft focus:border-terracotta transition-colors placeholder:text-ink-600"
              />
              <button
                type="button"
                onClick={handleFetchJd}
                disabled={isFetchingJd || !jdUrl.trim()}
                className="px-4 py-2 text-[11px] font-semibold uppercase tracking-label bg-umber-soft text-umber hover:bg-terracotta hover:text-vellum disabled:opacity-40 rounded transition-colors"
              >
                {isFetchingJd ? "Reading..." : "Auto-fill"}
              </button>
            </div>
          </div>

          {/* Screenshot zone */}
          <div className="mb-5">
            <label className="manuscript-label block mb-1.5">Or · Capture / Upload JD</label>
            <div
              onPaste={handleScreenshotPaste}
              onDrop={handleScreenshotDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              tabIndex={0}
              className="bg-vellum-low rounded p-5 text-center cursor-pointer hover:bg-vellum-mid transition-colors focus:outline-none focus:ring-2 focus:ring-terracotta/20"
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
                <div className="py-3">
                  <p className="text-sm text-ink-700 font-serif italic">
                    Click, drop, or paste screenshots of the job description
                  </p>
                  <p className="text-[11px] uppercase tracking-label text-ink-600 mt-2">
                    Multiple accepted
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 justify-center">
                  {screenshotPreviews.map((src, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={src}
                        alt={`Screenshot ${i + 1}`}
                        className="h-20 rounded object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeScreenshot(i); }}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-terracotta text-vellum rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {screenshots.length > 0 && (
              <div className="flex items-center gap-3 mt-3">
                <button
                  type="button"
                  onClick={processScreenshots}
                  disabled={isProcessingScreenshots}
                  className="px-4 py-2 text-[11px] font-semibold uppercase tracking-label bg-umber-soft text-umber hover:bg-terracotta hover:text-vellum disabled:opacity-40 rounded transition-colors"
                >
                  {isProcessingScreenshots ? "Reading..." : `Extract from ${screenshots.length}`}
                </button>
                {ocrStatus && (
                  <span className={`text-[11px] uppercase tracking-label ${ocrStatus.startsWith("Error") ? "text-terracotta" : "text-sage"}`}>
                    {ocrStatus}
                  </span>
                )}
              </div>
            )}
          </div>

          <form onSubmit={handleAddOpportunity} className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <Input name="company" label="Company" required />
            <Input name="role" label="Role" required />
            <Input name="jdLink" label="JD Link" />
            <Input name="website" label="Company Website" />
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
            <div className="flex items-end pb-1.5">
              <label className="flex items-center gap-2 text-sm text-ink-900 cursor-pointer">
                <input
                  type="checkbox"
                  name="remote"
                  value="true"
                  className="rounded accent-terracotta"
                />
                Remote
              </label>
            </div>
            <div className="col-span-1 sm:col-span-3">
              <label className="manuscript-label block mb-1.5">Initial Thoughts</label>
              <textarea
                name="notes"
                rows={2}
                className="w-full px-3 py-2 bg-vellum-low text-ink-900 text-sm focus:outline-none focus:bg-vellum-lowest border-b border-outlineSoft focus:border-terracotta transition-all resize-none rounded-t"
                placeholder="Why this role — and why now?"
              />
            </div>
            <div className="col-span-1 sm:col-span-3 flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-[11px] font-semibold uppercase tracking-label text-ink-600 hover:text-terracotta transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-[11px] font-semibold uppercase tracking-label bg-terracotta hover:bg-terracotta-deep disabled:opacity-50 text-vellum rounded shadow-card hover:shadow-lift transition-all"
              >
                {isSubmitting ? "Adding..." : "Add to Pipeline"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Kanban columns — tonal shift only */}
      <div className="flex gap-3 sm:gap-4 min-h-[50vh] sm:min-h-[calc(100vh-260px)] overflow-x-auto pb-4 -mx-2 px-2">
        {grouped.map((col) => {
          const isDropTarget = dragOverColumn === col.status;
          return (
            <div
              key={col.status}
              className={`flex-1 min-w-[180px] sm:min-w-[240px] flex flex-col rounded-lg transition-all duration-300 ${
                isDropTarget ? "ring-2 ring-terracotta/30 scale-[1.01] bg-vellum-mid" : col.surface
              }`}
              onDragOver={(e) => handleDragOver(e, col.status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.status)}
            >
              {/* Column header — marker dot + label + count chip. */}
              <div className="px-4 pt-4 pb-3 flex items-center justify-between">
                <span className="flex items-center gap-2 min-w-0">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${col.marker}`} aria-hidden="true" />
                  <span className={`text-[11px] font-semibold uppercase tracking-label truncate ${col.accent}`}>
                    {col.label}
                  </span>
                </span>
                <span className={`min-w-[22px] h-5 px-1.5 rounded text-[10px] font-semibold flex items-center justify-center ${col.chip}`}>
                  {col.items.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 px-3 pb-3 space-y-2.5 overflow-y-auto">
                {col.items.map((opp) => (
                  <div
                    key={opp.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, opp.id)}
                    className={`group bg-vellum-lowest rounded p-3 cursor-grab active:cursor-grabbing shadow-card hover-lift transition-all ${
                      draggedId === opp.id ? "opacity-40 scale-95 rotate-1" : ""
                    }`}
                  >
                    <Link href={`/opportunities/${opp.id}`} className="block">
                      <div className="flex items-start gap-2.5">
                        <CompanyAvatar company={opp.company} website={opp.website} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="min-w-0">
                              <p className="text-[10px] uppercase tracking-label text-ink-600 font-semibold truncate">
                                {opp.company}
                              </p>
                              <h3 className="text-[15px] font-serif font-medium text-ink-900 leading-tight mt-0.5 line-clamp-2">
                                {opp.role}
                              </h3>
                            </div>
                            {opp.priority && (
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${PRIORITY_DOT[opp.priority] || "bg-ink-400"}`}
                                title={`${opp.priority} priority`}
                              />
                            )}
                          </div>
                        </div>
                      </div>

                      {showComp && opp.compMin != null && opp.compMax != null && (
                        <p className="text-[11px] text-ink-700 mt-2 font-medium">
                          ${opp.compMin}K – ${opp.compMax}K
                        </p>
                      )}

                      {opp.location && (
                        <p className="text-[11px] text-ink-600 mt-0.5 truncate">
                          {opp.location}{opp.remote && " · Remote"}
                        </p>
                      )}

                      {(() => {
                        const chips: React.ReactNode[] = [];
                        if (opp.fitScore != null) {
                          chips.push(
                            <span key="fit" className="text-[10px] font-semibold uppercase tracking-label text-terracotta">
                              {opp.fitScore}% fit
                            </span>
                          );
                        }
                        if (opp.tier != null) {
                          chips.push(
                            <span key="tier" className="text-[10px] font-semibold uppercase tracking-label text-ink-600">
                              T{opp.tier}
                            </span>
                          );
                        }
                        if (opp.source === "referral") {
                          chips.push(
                            <span key="ref" className="text-[10px] font-semibold uppercase tracking-label text-sage">
                              Referral
                            </span>
                          );
                        }
                        if (opp._count.interviews > 0) {
                          chips.push(
                            <span key="int" className="text-[10px] font-semibold uppercase tracking-label text-ink-600">
                              {opp._count.interviews} int.
                            </span>
                          );
                        }
                        if (chips.length === 0) return null;
                        return (
                          <div className="flex items-center gap-x-2 gap-y-1 mt-2 flex-wrap">
                            {chips.map((chip, i) => (
                              <span key={i} className="flex items-center gap-x-2">
                                {i > 0 && <span className="text-ink-400 text-[10px]">·</span>}
                                {chip}
                              </span>
                            ))}
                          </div>
                        );
                      })()}
                    </Link>
                  </div>
                ))}

                {col.items.length === 0 && (
                  <div className="text-[11px] font-serif italic text-ink-600 px-2 py-4 text-center">
                    —
                  </div>
                )}
              </div>

              {/* Inline add CTA for saved column */}
              {col.status === "saved" && (
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="mx-3 mb-3 mt-1 py-2.5 text-[11px] font-semibold uppercase tracking-label text-terracotta hover:bg-terracotta/5 rounded transition-colors flex items-center justify-center gap-2"
                >
                  <span>+</span>
                  <span>Add Opportunity</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Helper form components — ghost bottom-border inputs per DESIGN.md
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
      <label className="manuscript-label block mb-1.5">
        {label}{required && <span className="text-terracotta ml-0.5 normal-case">*</span>}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        className="w-full px-0 py-1.5 bg-transparent text-ink-900 text-sm font-body focus:outline-none border-b border-outlineSoft focus:border-terracotta transition-colors"
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
      <label className="manuscript-label block mb-1.5">{label}</label>
      <select
        name={name}
        defaultValue={defaultValue}
        className="w-full px-0 py-1.5 bg-transparent text-ink-900 text-sm font-body focus:outline-none border-b border-outlineSoft focus:border-terracotta transition-colors cursor-pointer"
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
