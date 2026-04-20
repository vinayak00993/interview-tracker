"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Offer = {
  id: string;
  opportunityId: string;
  company: string;
  role: string;
  baseComp: number | null;
  signOnBonus: number | null;
  annualBonus: number | null;
  bonusPercent: number | null;
  equityType: string | null;
  equityValue: number | null;
  vestYears: number | null;
  vestCliff: number | null;
  ptoDays: number | null;
  healthcare: string | null;
  remotePolicy: string | null;
  startDate: string | null;
  expiryDate: string | null;
  location: string | null;
  title: string | null;
  level: string | null;
  benefits: string | null;
  aiSummary: string | null;
  rawText: string | null;
  sourceType: string | null;
};

type EligibleOpp = { id: string; company: string; role: string; status: string };

export default function OfferComparison({
  offers: initialOffers,
  eligibleOpps,
}: {
  offers: Offer[];
  eligibleOpps: EligibleOpp[];
}) {
  const [offers, setOffers] = useState(initialOffers);
  const [showAdd, setShowAdd] = useState(false);
  const [advice, setAdvice] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Estimated annualized total comp: base + bonus + equity/vest years
  const estTotal = (o: Offer) => {
    const base = o.baseComp || 0;
    const bonus = o.annualBonus ?? (o.bonusPercent ? Math.round(base * o.bonusPercent / 100) : 0);
    const equityPerYear = o.equityValue && o.vestYears ? Math.round(o.equityValue / o.vestYears) : 0;
    return base + bonus + equityPerYear;
  };

  const maxTotal = useMemo(
    () => Math.max(1, ...offers.map(estTotal)),
    [offers]
  );

  const runAdvisor = async () => {
    setLoading(true);
    setAdvice("");
    try {
      const res = await fetch("/api/offers/advise", { method: "POST" });
      const data = await res.json();
      if (res.ok) setAdvice(data.markdown);
      else setAdvice(`Error: ${data.error}`);
    } catch (e) {
      setAdvice(`Error: ${e instanceof Error ? e.message : "unknown"}`);
    }
    setLoading(false);
  };

  const handleDelete = async (opportunityId: string) => {
    if (!confirm("Remove this offer from comparison?")) return;
    await fetch(`/api/offers?opportunityId=${opportunityId}`, { method: "DELETE" });
    setOffers(offers.filter((o) => o.opportunityId !== opportunityId));
  };

  return (
    <div className="min-h-screen bg-vellum">
      <header className="manuscript-glass sticky top-0 z-20">
        <div className="px-4 sm:px-10 lg:px-16 py-4 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-[11px] font-semibold uppercase tracking-label text-ink-700 hover:text-terracotta hover:bg-vellum-high px-3 py-1.5 rounded transition-all"
          >
            ← The Pipeline
          </Link>
          <span className="text-ink-400">/</span>
          <span className="text-[11px] font-semibold uppercase tracking-label text-ink-600">Offers</span>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-vellum-high to-transparent" />
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-10 lg:px-16 py-8 sm:py-12">
        <div className="flex items-end justify-between mb-8 gap-3 flex-wrap">
          <div>
            <p className="manuscript-label">The Decision</p>
            <h1 className="manuscript-display text-3xl sm:text-4xl font-semibold text-ink-900 mt-1 leading-tight">
              Offer Comparison
            </h1>
            <p className="text-sm font-serif italic text-ink-700 mt-2 max-w-xl">
              Add offer letters to compare side-by-side. The advisor considers your resume,
              the offers, and market context to help you decide.
            </p>
          </div>
          <div className="flex gap-2">
            {offers.length >= 2 && (
              <button
                onClick={runAdvisor}
                disabled={loading}
                className="px-4 py-2 text-[11px] font-semibold uppercase tracking-label bg-terracotta hover:bg-terracotta-deep text-vellum rounded shadow-card hover:shadow-lift hover:-translate-y-0.5 transition-all disabled:opacity-50"
              >
                {loading ? "Thinking..." : "Ask the Advisor"}
              </button>
            )}
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="px-4 py-2 text-[11px] font-semibold uppercase tracking-label border border-terracotta text-terracotta hover:bg-terracotta/5 rounded transition-all"
            >
              + Add Offer
            </button>
          </div>
        </div>

        {showAdd && (
          <AddOfferForm
            eligibleOpps={eligibleOpps}
            onAdded={(offer) => {
              setOffers([offer, ...offers.filter((o) => o.opportunityId !== offer.opportunityId)]);
              setShowAdd(false);
            }}
            onClose={() => setShowAdd(false)}
          />
        )}

        {offers.length === 0 && !showAdd && (
          <div className="bg-vellum-lowest rounded-lg p-10 text-center shadow-card">
            <p className="font-serif italic text-ink-700">No offers yet.</p>
            <p className="text-sm text-ink-600 mt-2">
              Add an offer letter or paste an offer email to start comparing.
            </p>
          </div>
        )}

        {/* Comparison bars */}
        {offers.length >= 1 && (
          <div className="bg-vellum-lowest rounded-lg p-6 shadow-card mb-6">
            <h2 className="text-[11px] font-semibold uppercase tracking-label text-ink-600 mb-4">
              Estimated annualized total
            </h2>
            <div className="space-y-3">
              {offers.map((o) => {
                const total = estTotal(o);
                const pct = (total / maxTotal) * 100;
                return (
                  <div key={o.id}>
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-sm font-serif font-medium text-ink-900">{o.company}</span>
                      <span className="text-sm font-semibold text-terracotta">
                        ${total}K <span className="text-[10px] uppercase tracking-label text-ink-600 font-medium">/yr</span>
                      </span>
                    </div>
                    <div className="h-2 bg-vellum-mid rounded-full overflow-hidden">
                      <div
                        className="h-full bg-terracotta rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Side-by-side table */}
        {offers.length >= 1 && (
          <div className="overflow-x-auto bg-vellum-lowest rounded-lg shadow-card mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-vellum-high">
                  <th className="text-left p-4 text-[10px] uppercase tracking-label text-ink-600 font-semibold w-40">Field</th>
                  {offers.map((o) => (
                    <th key={o.id} className="text-left p-4 min-w-[200px]">
                      <div className="text-[10px] uppercase tracking-label text-ink-600 font-semibold">{o.company}</div>
                      <div className="text-sm font-serif font-medium text-ink-900 mt-0.5">{o.title || o.role}</div>
                      <button
                        onClick={() => handleDelete(o.opportunityId)}
                        className="text-[10px] text-ink-400 hover:text-terracotta mt-1 uppercase tracking-label"
                      >
                        remove
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-ink-800">
                <Row label="Base" offers={offers} render={(o) => o.baseComp ? `$${o.baseComp}K` : "—"} />
                <Row label="Annual bonus" offers={offers} render={(o) =>
                  o.annualBonus ? `$${o.annualBonus}K` : o.bonusPercent ? `${o.bonusPercent}%` : "—"
                } />
                <Row label="Sign-on" offers={offers} render={(o) => o.signOnBonus ? `$${o.signOnBonus}K` : "—"} />
                <Row label="Equity" offers={offers} render={(o) =>
                  o.equityValue ? `${o.equityType || "?"} $${o.equityValue}K` : "—"
                } />
                <Row label="Vest" offers={offers} render={(o) =>
                  o.vestYears ? `${o.vestYears}yr${o.vestCliff ? ` (${o.vestCliff}mo cliff)` : ""}` : "—"
                } />
                <Row label="Level" offers={offers} render={(o) => o.level || "—"} />
                <Row label="Location" offers={offers} render={(o) => o.location || "—"} />
                <Row label="Remote" offers={offers} render={(o) => o.remotePolicy || "—"} />
                <Row label="PTO" offers={offers} render={(o) =>
                  o.ptoDays === -1 ? "unlimited" : o.ptoDays ? `${o.ptoDays} days` : "—"
                } />
                <Row label="Start" offers={offers} render={(o) => o.startDate || "—"} />
                <Row label="Expires" offers={offers} render={(o) => o.expiryDate || "—"} />
                <Row label="Benefits" offers={offers} render={(o) => o.benefits || "—"} multiline />
                <Row label="Summary" offers={offers} render={(o) => o.aiSummary || "—"} multiline />
              </tbody>
            </table>
          </div>
        )}

        {advice && (
          <div className="bg-vellum-lowest rounded-lg p-6 shadow-card">
            <h2 className="manuscript-label mb-3">The Advisor</h2>
            <div className="prose prose-sm max-w-none text-ink-800 font-serif leading-relaxed whitespace-pre-wrap">
              {advice}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  offers,
  render,
  multiline,
}: {
  label: string;
  offers: Offer[];
  render: (o: Offer) => string;
  multiline?: boolean;
}) {
  return (
    <tr className="border-b border-vellum-mid/40">
      <td className="p-4 text-[10px] uppercase tracking-label text-ink-600 font-semibold align-top">{label}</td>
      {offers.map((o) => (
        <td key={o.id} className={`p-4 align-top ${multiline ? "text-xs" : "text-sm"}`}>
          {render(o)}
        </td>
      ))}
    </tr>
  );
}

function AddOfferForm({
  eligibleOpps,
  onAdded,
  onClose,
}: {
  eligibleOpps: EligibleOpp[];
  onAdded: (o: Offer) => void;
  onClose: () => void;
}) {
  const [opportunityId, setOpportunityId] = useState(eligibleOpps[0]?.id || "");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState("");

  const parseOffer = async () => {
    if (!opportunityId) return setError("Select an opportunity first.");
    if (!text.trim() && !file) return setError("Paste offer text or upload a file.");
    setError("");
    setParsing(true);
    try {
      let res: Response;
      if (file) {
        const fd = new FormData();
        fd.set("file", file);
        fd.set("opportunityId", opportunityId);
        res = await fetch("/api/offers/parse", { method: "POST", body: fd });
      } else {
        res = await fetch("/api/offers/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, opportunityId }),
        });
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Parse failed");
        setParsing(false);
        return;
      }

      // Persist
      const saveRes = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const saved = await saveRes.json();
      if (!saveRes.ok) {
        setError(saved.error || "Save failed");
        setParsing(false);
        return;
      }

      const opp = eligibleOpps.find((o) => o.id === opportunityId);
      onAdded({
        ...saved.offer,
        company: opp?.company || "",
        role: opp?.role || "",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
    setParsing(false);
  };

  return (
    <div className="manuscript-glass bg-vellum-lowest/85 rounded-lg p-6 mb-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="manuscript-label">New offer</h2>
        <button onClick={onClose} className="text-[10px] uppercase tracking-label text-ink-600 hover:text-terracotta">
          cancel
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-[10px] uppercase tracking-label text-ink-600 font-semibold mb-1">
            Opportunity
          </label>
          <select
            value={opportunityId}
            onChange={(e) => setOpportunityId(e.target.value)}
            className="w-full px-3 py-2 bg-vellum-low rounded text-ink-900 text-sm focus:outline-none"
          >
            <option value="">Select...</option>
            {eligibleOpps.map((o) => (
              <option key={o.id} value={o.id}>
                {o.company} — {o.role}
              </option>
            ))}
          </select>
          {eligibleOpps.length === 0 && (
            <p className="text-[10px] text-ink-600 italic mt-1">
              No eligible opportunities. Add one from the pipeline first.
            </p>
          )}
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-label text-ink-600 font-semibold mb-1">
            Paste offer email or letter
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 bg-vellum-low rounded text-ink-900 text-sm font-mono focus:outline-none resize-y"
            placeholder="Paste the full text of the offer letter or email here..."
          />
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-label text-ink-600 font-semibold mb-1">
            Or upload (.docx, .txt, image)
          </label>
          <input
            type="file"
            accept=".docx,.txt,.md,image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="text-sm text-ink-700"
          />
        </div>

        {error && <p className="text-terracotta text-xs font-serif italic">{error}</p>}

        <div className="flex justify-end">
          <button
            onClick={parseOffer}
            disabled={parsing}
            className="px-5 py-2 text-[11px] font-semibold uppercase tracking-label bg-terracotta hover:bg-terracotta-deep text-vellum rounded shadow-card hover:-translate-y-0.5 transition-all disabled:opacity-50"
          >
            {parsing ? "Parsing..." : "Parse & Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
