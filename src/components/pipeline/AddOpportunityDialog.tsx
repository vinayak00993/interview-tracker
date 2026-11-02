"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/Dialog";
import { Button, Field, Input, Select, Textarea, Checkbox, ErrorText } from "@/components/ui";
import { createOpportunityAction } from "@/lib/actions/opportunities";

interface Draft {
  company: string;
  role: string;
  jdLink: string;
  website: string;
  compMin: string;
  compMax: string;
  location: string;
  remote: boolean;
  priority: string;
  tier: string;
  source: string;
  fitScore: string;
  notes: string;
  jdText: string;
}

const EMPTY: Draft = { company: "", role: "", jdLink: "", website: "", compMin: "", compMax: "", location: "", remote: false, priority: "medium", tier: "", source: "", fitScore: "", notes: "", jdText: "" };

export function AddOpportunityDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [jdUrl, setJdUrl] = useState("");
  const [fetchingJd, setFetchingJd] = useState(false);
  const [jdStatus, setJdStatus] = useState<string | null>(null);
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [ocrStatus, setOcrStatus] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  const applyParsed = (parsed: Record<string, unknown>) => {
    const patch: Partial<Draft> = {};
    for (const key of ["company", "role", "location", "jdLink", "website", "jdText"] as const) {
      if (typeof parsed[key] === "string" && parsed[key]) patch[key] = parsed[key] as string;
    }
    for (const key of ["compMin", "compMax"] as const) {
      if (typeof parsed[key] === "number") patch[key] = String(parsed[key]);
    }
    if (parsed.remote === true) patch.remote = true;
    set(patch);
  };

  const fetchJd = async () => {
    if (!jdUrl.trim()) return;
    setFetchingJd(true);
    setJdStatus(null);
    try {
      const res = await fetch("/api/parse-jd", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: jdUrl.trim() }) });
      const data = await res.json();
      if (!res.ok) {
        setJdStatus(`Error: ${data.error || "could not read that page"}`);
      } else {
        applyParsed(data);
        setJdStatus("Fields filled from the posting");
      }
    } catch {
      setJdStatus("Error: could not reach the parser");
    }
    setFetchingJd(false);
  };

  const addFiles = (files: FileList | File[]) => {
    const images = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!images.length) return;
    setScreenshots((prev) => [...prev, ...images]);
    for (const file of images) {
      const reader = new FileReader();
      reader.onload = (e) => setPreviews((prev) => [...prev, String(e.target?.result)]);
      reader.readAsDataURL(file);
    }
  };

  const readScreenshots = async () => {
    if (!screenshots.length) return;
    setReading(true);
    setOcrStatus("Reading screenshots");
    try {
      const form = new FormData();
      screenshots.forEach((f) => form.append("screenshots", f));
      const res = await fetch("/api/parse-screenshots", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) setOcrStatus(`Error: ${data.error || "could not read the screenshots"}`);
      else {
        applyParsed(data);
        setOcrStatus("Fields filled from the screenshots");
      }
    } catch {
      setOcrStatus("Error: could not reach the reader");
    }
    setReading(false);
  };

  const reset = () => {
    setDraft(EMPTY);
    setJdUrl("");
    setJdStatus(null);
    setScreenshots([]);
    setPreviews([]);
    setOcrStatus(null);
    setError(null);
  };

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = new FormData();
    Object.entries(draft).forEach(([k, v]) => {
      if (k === "remote") form.set(k, v ? "true" : "false");
      else if (v !== "") form.set(k, String(v));
    });
    startTransition(async () => {
      const result = await createOpportunityAction(form);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      reset();
      onClose();
      router.push(`/opportunities/${result.data.id}`);
    });
  };

  return (
    <Dialog open={open} onClose={() => { if (!pending) onClose(); }} eyebrow="New opportunity" title="Add a role you're tracking" size="lg">
      {/* Autofill from a URL */}
      <div className="mb-5">
        <Field label="Job posting URL" hint={jdStatus ?? "Paste a careers page or job board link and we fill in what we can."}>
          <div className="flex gap-2">
            <Input type="url" value={jdUrl} onChange={(e) => setJdUrl(e.target.value)} placeholder="https://" className="flex-1" />
            <Button type="button" variant="secondary" onClick={fetchJd} loading={fetchingJd} disabled={!jdUrl.trim()}>
              Auto-fill
            </Button>
          </div>
        </Field>
      </div>

      {/* Autofill from screenshots */}
      <div className="mb-6">
        <p className="manuscript-label mb-1.5">Or paste screenshots</p>
        <div
          onPaste={(e) => { const files = Array.from(e.clipboardData.items).filter((i) => i.type.startsWith("image/")).map((i) => i.getAsFile()).filter((f): f is File => Boolean(f)); if (files.length) { e.preventDefault(); addFiles(files); } }}
          onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInput.current?.click()}
          tabIndex={0}
          role="button"
          className="bg-vellum-low rounded p-4 text-center cursor-pointer hover:bg-vellum-mid transition-colors focus:outline-none focus:ring-2 focus:ring-terracotta/20"
        >
          <input ref={fileInput} type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && addFiles(e.target.files)} />
          {previews.length === 0 ? (
            <p className="text-sm text-ink-700 font-serif italic py-2">Click, drop, or paste screenshots of the posting</p>
          ) : (
            <div className="flex flex-wrap gap-2 justify-center">
              {previews.map((src, i) => (
                <div key={i} className="relative">
                  <img src={src} alt="" className="h-16 rounded object-cover" />
                  <button type="button" onClick={(e) => { e.stopPropagation(); setScreenshots((p) => p.filter((_, j) => j !== i)); setPreviews((p) => p.filter((_, j) => j !== i)); }} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-terracotta text-vellum rounded-full text-xs flex items-center justify-center" aria-label="Remove">
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        {screenshots.length > 0 && (
          <div className="flex items-center gap-3 mt-2">
            <Button type="button" variant="secondary" onClick={readScreenshots} loading={reading}>
              Read {screenshots.length} screenshot{screenshots.length > 1 ? "s" : ""}
            </Button>
            {ocrStatus && <span className={`text-[11px] uppercase tracking-label ${ocrStatus.startsWith("Error") ? "text-terracotta" : "text-sage"}`}>{ocrStatus}</span>}
          </div>
        )}
      </div>

      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Field label={<>Company <span className="text-terracotta normal-case">*</span></>}>
          <Input name="company" required value={draft.company} onChange={(e) => set({ company: e.target.value })} />
        </Field>
        <Field label={<>Role <span className="text-terracotta normal-case">*</span></>}>
          <Input name="role" required value={draft.role} onChange={(e) => set({ role: e.target.value })} />
        </Field>
        <Field label="Location">
          <Input name="location" value={draft.location} onChange={(e) => set({ location: e.target.value })} />
        </Field>
        <Field label="JD link">
          <Input type="url" name="jdLink" value={draft.jdLink} onChange={(e) => set({ jdLink: e.target.value })} placeholder="https://" />
        </Field>
        <Field label="Company website">
          <Input type="url" name="website" value={draft.website} onChange={(e) => set({ website: e.target.value })} placeholder="https://" />
        </Field>
        <div className="flex items-end pb-1.5">
          <Checkbox label="Remote" checked={draft.remote} onChange={(e) => set({ remote: e.target.checked })} />
        </div>
        <Field label="Comp min ($K)">
          <Input type="number" name="compMin" min={0} value={draft.compMin} onChange={(e) => set({ compMin: e.target.value })} />
        </Field>
        <Field label="Comp max ($K)">
          <Input type="number" name="compMax" min={0} value={draft.compMax} onChange={(e) => set({ compMax: e.target.value })} />
        </Field>
        <Field label="Fit score (0 to 100)">
          <Input type="number" name="fitScore" min={0} max={100} value={draft.fitScore} onChange={(e) => set({ fitScore: e.target.value })} />
        </Field>
        <Field label="Priority">
          <Select name="priority" value={draft.priority} onChange={(e) => set({ priority: e.target.value })}>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </Select>
        </Field>
        <Field label="Tier">
          <Select name="tier" value={draft.tier} onChange={(e) => set({ tier: e.target.value })}>
            <option value="">Select</option>
            <option value="1">Tier I, dream role</option>
            <option value="2">Tier II</option>
            <option value="3">Tier III, backup</option>
          </Select>
        </Field>
        <Field label="Source">
          <Select name="source" value={draft.source} onChange={(e) => set({ source: e.target.value })}>
            <option value="">Select</option>
            <option value="direct">Direct</option>
            <option value="recruiter">Recruiter</option>
            <option value="referral">Referral</option>
            <option value="job_board">Job board</option>
          </Select>
        </Field>
        <Field label="Notes" className="sm:col-span-3">
          <Textarea name="notes" rows={2} value={draft.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Why this role? What stands out?" />
        </Field>
        <div className="sm:col-span-3 flex items-center justify-between gap-3 pt-1">
          <ErrorText>{error}</ErrorText>
          <div className="flex gap-2 ml-auto">
            <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              Add to pipeline
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
