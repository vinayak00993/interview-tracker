"use client";

import { useState, useTransition } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button, ErrorText, Field, Input, Select, Textarea, cx } from "@/components/ui";
import { saveOfferAction } from "@/lib/actions/offers";
import type { EligibleOpp } from "./types";

type Fields = Record<string, string>;

const NUMERIC = ["baseComp", "signOnBonus", "annualBonus", "bonusPercent", "equityValue", "equityShares", "vestYears", "vestCliff", "ptoDays"] as const;
const TEXT = ["equityType", "vestSchedule", "healthcare", "remotePolicy", "startDate", "expiryDate", "location", "title", "level", "benefits", "aiSummary"] as const;

export function AddOfferDialog({ open, onClose, eligible }: { open: boolean; onClose: () => void; eligible: EligibleOpp[] }) {
  const [opportunityId, setOpportunityId] = useState(eligible[0]?.id || "");
  const [mode, setMode] = useState<"parse" | "form">("parse");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [fields, setFields] = useState<Fields>({});
  const [meta, setMeta] = useState<{ rawText: string; sourceType: string }>({ rawText: "", sourceType: "manual" });
  const [prefilledBase, setPrefilledBase] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const selected = eligible.find((o) => o.id === opportunityId);
  const set = (k: string, v: string) => setFields((f) => ({ ...f, [k]: v }));

  const applyBasePrefill = (next: Fields) => {
    if (!next.baseComp && selected?.compMax != null) {
      next.baseComp = String(selected.compMax);
      setPrefilledBase(true);
    } else {
      setPrefilledBase(false);
    }
    return next;
  };

  const parse = async () => {
    if (!opportunityId) return setError("Select an opportunity first.");
    if (!text.trim() && !file) return setError("Paste the offer text or upload a file.");
    setError(null);
    setParsing(true);
    try {
      let res: Response;
      if (file) {
        const fd = new FormData();
        fd.set("file", file);
        fd.set("opportunityId", opportunityId);
        res = await fetch("/api/offers/parse", { method: "POST", body: fd });
      } else {
        res = await fetch("/api/offers/parse", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, opportunityId }) });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not read the offer");
      const next: Fields = {};
      for (const k of [...NUMERIC, ...TEXT]) {
        if (data[k] != null && data[k] !== "") next[k] = String(data[k]);
      }
      setFields(applyBasePrefill(next));
      setMeta({ rawText: data.rawText || "", sourceType: data.sourceType || "manual" });
      setMode("form");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read the offer");
    }
    setParsing(false);
  };

  const startManual = () => {
    if (!opportunityId) return setError("Select an opportunity first.");
    setError(null);
    setFields(applyBasePrefill({}));
    setMeta({ rawText: "", sourceType: "manual" });
    setMode("form");
  };

  const reset = () => {
    setMode("parse");
    setText("");
    setFile(null);
    setFields({});
    setPrefilledBase(false);
    setError(null);
  };

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    form.set("opportunityId", opportunityId);
    form.set("rawText", meta.rawText);
    form.set("sourceType", meta.sourceType);
    setError(null);
    start(async () => {
      const r = await saveOfferAction(form);
      if (!r.ok) setError(r.error);
      else {
        reset();
        onClose();
      }
    });
  };

  return (
    <Dialog open={open} onClose={() => { if (!pending && !parsing) onClose(); }} eyebrow="New offer" title={mode === "parse" ? "Add an offer" : `Offer from ${selected?.company ?? ""}`} size="lg">
      {mode === "parse" ? (
        <div className="space-y-5">
          <Field label="Opportunity" hint={eligible.length === 0 ? "No eligible opportunities. Move one to Interviewing or Offer first." : undefined}>
            <Select value={opportunityId} onChange={(e) => setOpportunityId(e.target.value)}>
              <option value="">Select</option>
              {eligible.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.company} · {o.role}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Paste the offer email or letter">
            <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={7} className="font-mono text-xs" placeholder="Paste the full text here. The reader pulls out base, bonus, equity, vesting, PTO, and benefits." />
          </Field>
          <Field label="Or upload (.docx, .txt, or an image)">
            <input type="file" accept=".docx,.txt,.md,image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-sm text-ink-700" />
          </Field>
          <ErrorText>{error}</ErrorText>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <button type="button" onClick={startManual} className="text-[11px] font-semibold uppercase tracking-label text-ink-600 hover:text-terracotta">
              Enter by hand instead
            </button>
            <Button type="button" onClick={parse} loading={parsing} disabled={!opportunityId}>
              Read offer
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <p className="text-xs font-serif italic text-ink-700">
            {meta.sourceType === "manual" ? "Fill in what you know. Everything is optional." : "Check the extracted fields before saving. Amounts are in thousands of USD."}
          </p>
          {prefilledBase && (
            <p className="text-[11px] text-umber bg-umber-soft rounded px-3 py-2">
              Base was prefilled from the opportunity&apos;s comp range (${selected?.compMax}K). Adjust it to match the offer.
            </p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Num name="baseComp" label="Base ($K)" fields={fields} set={set} />
            <Num name="signOnBonus" label="Sign-on ($K)" fields={fields} set={set} />
            <Num name="annualBonus" label="Annual bonus ($K)" fields={fields} set={set} />
            <Num name="bonusPercent" label="Bonus (% of base)" fields={fields} set={set} step="0.1" />
            <Field label="Equity type">
              <Select name="equityType" value={fields.equityType ?? ""} onChange={(e) => set("equityType", e.target.value)}>
                <option value="">Select</option>
                {["RSU", "ISO", "NSO", "options", "none"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
            </Field>
            <Num name="equityValue" label="Equity value ($K)" fields={fields} set={set} />
            <Num name="equityShares" label="Shares" fields={fields} set={set} />
            <Num name="vestYears" label="Vest years" fields={fields} set={set} />
            <Num name="vestCliff" label="Cliff (months)" fields={fields} set={set} />
            <Txt name="vestSchedule" label="Vest schedule" fields={fields} set={set} />
            <Num name="ptoDays" label="PTO days (-1 unlimited)" fields={fields} set={set} />
            <Txt name="level" label="Level" fields={fields} set={set} />
            <Txt name="title" label="Offered title" fields={fields} set={set} />
            <Txt name="location" label="Location" fields={fields} set={set} />
            <Txt name="remotePolicy" label="Remote policy" fields={fields} set={set} />
            <Txt name="startDate" label="Start date" fields={fields} set={set} />
            <Txt name="expiryDate" label="Offer expires" fields={fields} set={set} />
            <Txt name="healthcare" label="Healthcare" fields={fields} set={set} />
          </div>
          <Field label="Benefits">
            <Textarea name="benefits" rows={2} value={fields.benefits ?? ""} onChange={(e) => set("benefits", e.target.value)} />
          </Field>
          <Field label="Summary">
            <Textarea name="aiSummary" rows={2} value={fields.aiSummary ?? ""} onChange={(e) => set("aiSummary", e.target.value)} placeholder="One or two sentences on the highlights." />
          </Field>
          <ErrorText>{error}</ErrorText>
          <div className="flex items-center justify-between gap-3 pt-1">
            <button type="button" onClick={reset} className={cx("text-[11px] font-semibold uppercase tracking-label text-ink-600 hover:text-terracotta")}>
              Back
            </button>
            <Button type="submit" loading={pending}>
              Save offer
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}

function Num({ name, label, fields, set, step }: { name: string; label: string; fields: Fields; set: (k: string, v: string) => void; step?: string }) {
  return (
    <Field label={label}>
      <Input type="number" name={name} step={step ?? "1"} value={fields[name] ?? ""} onChange={(e) => set(name, e.target.value)} />
    </Field>
  );
}

function Txt({ name, label, fields, set }: { name: string; label: string; fields: Fields; set: (k: string, v: string) => void }) {
  return (
    <Field label={label}>
      <Input name={name} value={fields[name] ?? ""} onChange={(e) => set(name, e.target.value)} />
    </Field>
  );
}
