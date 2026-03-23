"use client";

import { useState, useCallback, useRef } from "react";
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
  { status: "saved", label: "Saved", color: "#8a7d6d" },
  { status: "applied", label: "Applied", color: "#d4a03c" },
  { status: "interviewing", label: "Interviewing", color: "#b33a3a" },
  { status: "offer", label: "Offer", color: "#6b9e5c" },
  { status: "rejected", label: "Rejected", color: "#c44848" },
  { status: "withdrawn", label: "Withdrawn", color: "#9b7bb8" },
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
  const [jdUrl, setJdUrl] = useState("");
  const [isFetchingJd, setIsFetchingJd] = useState(false);
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [screenshotPreviews, setScreenshotPreviews] = useState<string[]>([]);
  const [isProcessingScreenshots, setIsProcessingScreenshots] = useState(false);
  const [ocrStatus, setOcrStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-medium text-warm-600 uppercase tracking-wider">
          Pipeline
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3 py-1.5 text-xs font-medium bg-terra hover:bg-terra-light text-white rounded-lg transition-colors"
        >
          + Add Opportunity
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="mb-6 bg-white border border-warm-300 rounded-lg p-5 shadow-sm">
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
      <div className="flex gap-4 min-h-[calc(100vh-220px)]">
        {grouped.map((col) => (
          <div
            key={col.status}
            className={`flex-1 min-w-[220px] flex flex-col rounded-lg transition-colors ${
              dragOverColumn === col.status
                ? "bg-warm-200"
                : "bg-warm-100/60"
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
            <div className="flex-1 px-2 pb-2 space-y-2 overflow-y-auto">
              {col.items.map((opp) => (
                <div
                  key={opp.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, opp.id)}
                  className={`group bg-white border border-warm-300 rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-warm-400 hover:shadow-sm transition-all ${
                    draggedId === opp.id ? "opacity-40" : ""
                  }`}
                >
                  <Link href={`/opportunities/${opp.id}`} className="block">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm font-medium text-warm-900 truncate">
                          {opp.company}
                        </h3>
                        <p className="text-xs text-warm-600 truncate mt-0.5">
                          {opp.role}
                        </p>
                      </div>
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
                      {opp._count.interviews > 0 && (
                        <span className="text-[10px] text-warm-500">
                          {opp._count.interviews} int.
                        </span>
                      )}
                    </div>

                    {opp.compMin != null && opp.compMax != null && (
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
