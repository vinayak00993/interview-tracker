"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

type DemoOffer = {
  id: string;
  company: string;
  website: string;
  accent: string; // hex accent per offer for chart bars, etc.
  role: string;
  title: string;
  level: string;
  baseComp: number;
  signOnBonus: number;
  annualBonus: number | null;
  bonusPercent: number | null;
  equityType: string;
  equityValue: number;
  vestYears: number;
  vestCliff: number;
  ptoDays: number; // -1 = unlimited
  healthcare: string;
  remotePolicy: string;
  startDate: string;
  expiryDate: string;
  location: string;
  benefits: string;
  aiSummary: string;
  wins: string[];
  losses: string[];
};

const DEMO_OFFERS: DemoOffer[] = [
  {
    id: "d1",
    company: "Anthropic",
    website: "https://anthropic.com",
    accent: "#843728",
    role: "Strategic Partnerships Lead",
    title: "Senior Manager, Strategic Partnerships",
    level: "M5",
    baseComp: 240,
    signOnBonus: 40,
    annualBonus: null,
    bonusPercent: null,
    equityType: "RSU",
    equityValue: 480,
    vestYears: 4,
    vestCliff: 12,
    ptoDays: -1,
    healthcare: "Full coverage, 100% premium covered",
    remotePolicy: "SF-hybrid, 3 days in-office",
    startDate: "Jun 1, 2026",
    expiryDate: "May 1, 2026",
    location: "San Francisco, CA",
    benefits: "$2K home office, $3K learning budget, 16wk parental leave, 401k 6% match",
    aiSummary: "High-growth AI lab. Strong equity upside ($120K/yr), but SF hybrid and below-market base.",
    wins: ["AI category leadership", "Strong equity upside", "Unlimited PTO", "Generous learning + parental"],
    losses: ["Below-market base", "SF hybrid mandate", "Equity valuation risk"],
  },
  {
    id: "d2",
    company: "Stripe",
    website: "https://stripe.com",
    accent: "#635bff",
    role: "Head of Strategic Partnerships",
    title: "Head of Partnerships, Embedded Finance",
    level: "L6",
    baseComp: 285,
    signOnBonus: 75,
    annualBonus: 85,
    bonusPercent: 30,
    equityType: "RSU",
    equityValue: 320,
    vestYears: 4,
    vestCliff: 12,
    ptoDays: 25,
    healthcare: "Full coverage for family, $0 premium",
    remotePolicy: "Fully remote (US)",
    startDate: "May 15, 2026",
    expiryDate: "Apr 30, 2026",
    location: "Remote",
    benefits: "$5K WFH setup, $4K learning, 20wk parental leave, 401k 5% match, FSA/HSA",
    aiSummary: "Highest cash comp and fully remote. Late-stage private — more liquid but less upside.",
    wins: ["Highest cash ($285K base)", "Fully remote", "Best healthcare + 401k", "Biggest sign-on"],
    losses: ["Smallest equity grant", "IPO timing uncertain", "Late-stage means limited upside"],
  },
  {
    id: "d3",
    company: "Ramp",
    website: "https://ramp.com",
    accent: "#f1ef9c",
    role: "Director of Strategic Partnerships",
    title: "Director, Partnerships",
    level: "D1",
    baseComp: 225,
    signOnBonus: 25,
    annualBonus: 45,
    bonusPercent: 20,
    equityType: "ISO",
    equityValue: 550,
    vestYears: 4,
    vestCliff: 12,
    ptoDays: -1,
    healthcare: "Full coverage, employee-only",
    remotePolicy: "NYC-hybrid, 4 days in-office",
    startDate: "May 20, 2026",
    expiryDate: "May 5, 2026",
    location: "New York, NY",
    benefits: "$1K home office, $2K learning, 12wk parental leave, no 401k match",
    aiSummary: "Largest equity grant ($138K/yr vesting) + Director title. NYC 4-day in-office is the cost.",
    wins: ["Highest equity grant", "Director title", "Unlimited PTO", "Category tailwinds"],
    losses: ["NYC 4-day in-office", "No 401k match", "Weakest healthcare", "Lower base"],
  },
];

const DEMO_ADVICE = `## TL;DR

**Anthropic is the strongest all-around offer** if you value equity upside and category leadership in AI. **Stripe** wins if cash and remote flexibility matter more. **Ramp** is close on paper but penalized by the NYC 4-day in-office requirement.

Stripe leads on year-one cash ($450K). Ramp leads on equity grant size ($550K total, $138K/yr). Anthropic has the highest probability-weighted upside given company trajectory.

## Questions to ask before deciding

1. **Anthropic** — What's the current 409A and how has it tracked over the last 4 rounds? Expected IPO window?
2. **Stripe** — Are the RSUs double-trigger (IPO + time) or single-trigger? What if IPO slips 2+ years?
3. **Ramp** — Is 4-day negotiable down to 3? What's the promo timeline to the next level?
4. **All three** — Severance policy and change-of-control clause on equity?

## Negotiation levers

- **Anthropic** — push base to $260K citing Stripe's $285K. Equity is their strongest card; let them lead there.
- **Stripe** — ask for an additional $150K RSU grant citing Ramp's larger equity package.
- **Ramp** — push to 3-day in-office and ask for 401k match. Use Anthropic's equity trajectory as leverage.

## Final recommendation

If your top priorities are **equity upside + category positioning** → **Anthropic.**
If they're **cash + remote + short-term stability** → **Stripe.**
Ramp is competitive on comp; it's the in-office burden that weakens it.

The numbers are close enough that **fit, manager, and trajectory** should be the tie-breaker — not comp.`;

function CompanyLogo({ offer, size = 48 }: { offer: DemoOffer; size?: number }) {
  const domain = new URL(offer.website).hostname;
  const logoUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  return (
    <div
      className="rounded-lg flex items-center justify-center shrink-0 overflow-hidden relative bg-vellum-low"
      style={{ width: size, height: size }}
    >
      <span
        className="absolute inset-0 flex items-center justify-center font-serif font-medium text-vellum"
        style={{ backgroundColor: offer.accent, fontSize: size * 0.5 }}
      >
        {offer.company.charAt(0)}
      </span>
      <img
        src={logoUrl}
        alt={offer.company}
        className="relative w-full h-full object-contain bg-vellum-lowest z-10"
        loading="lazy"
      />
    </div>
  );
}

export default function DemoOffersPage() {
  const [showAdvice, setShowAdvice] = useState(false);
  const [loading, setLoading] = useState(false);

  const totals = useMemo(() => {
    return DEMO_OFFERS.map((o) => {
      const bonus = o.annualBonus ?? (o.bonusPercent ? Math.round((o.baseComp * o.bonusPercent) / 100) : 0);
      const equityPerYear = Math.round(o.equityValue / o.vestYears);
      return {
        id: o.id,
        base: o.baseComp,
        bonus,
        equity: equityPerYear,
        total: o.baseComp + bonus + equityPerYear,
      };
    });
  }, []);

  const maxTotal = Math.max(...totals.map((t) => t.total));
  const bestId = totals.reduce((best, t) => (t.total > best.total ? t : best), totals[0]).id;

  const runAdvisor = () => {
    setLoading(true);
    setTimeout(() => {
      setShowAdvice(true);
      setLoading(false);
    }, 2400);
  };

  return (
    <div className="min-h-screen bg-vellum">
      <div className="bg-terracotta/10 border-b border-transparent px-4 py-2.5 text-center">
        <p className="text-xs text-terracotta-deep">
          Demo with sample offers.{" "}
          <Link href="/login" className="font-semibold underline underline-offset-2 hover:text-terracotta">
            Sign up free
          </Link>{" "}
          to compare your own.
        </p>
      </div>

      <header className="manuscript-glass sticky top-0 z-20">
        <div className="px-4 sm:px-10 lg:px-16 py-4 flex items-center gap-4">
          <Link
            href="/demo"
            className="text-[11px] font-semibold uppercase tracking-label text-ink-700 hover:text-terracotta px-3 py-1.5 rounded transition-all"
          >
            ← Pipeline demo
          </Link>
          <span className="text-ink-400">/</span>
          <span className="text-[11px] font-semibold uppercase tracking-label text-ink-600">Offers</span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-10 lg:px-16 py-8 sm:py-12">
        {/* Hero */}
        <div className="flex items-end justify-between mb-10 gap-3 flex-wrap">
          <div>
            <p className="manuscript-label">The Decision</p>
            <h1 className="manuscript-display text-3xl sm:text-4xl font-semibold text-ink-900 mt-1 leading-tight">
              Three offers on the table
            </h1>
            <p className="text-sm font-serif italic text-ink-700 mt-2 max-w-xl">
              Side-by-side comparison. Claude Sonnet reads your resume, weighs the trade-offs,
              and gives a recommendation in one click.
            </p>
          </div>
          <button
            onClick={runAdvisor}
            disabled={loading || showAdvice}
            className="px-4 py-2 text-[11px] font-semibold uppercase tracking-label bg-terracotta hover:bg-terracotta-deep text-vellum rounded shadow-card hover:shadow-lift hover:-translate-y-0.5 transition-all disabled:opacity-50"
          >
            {loading ? "Thinking..." : showAdvice ? "✓ Recommendation ready" : "Ask the Advisor"}
          </button>
        </div>

        {/* Offer hero cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {DEMO_OFFERS.map((o, i) => {
            const t = totals[i];
            const isBest = t.id === bestId;
            return (
              <div
                key={o.id}
                className={`relative bg-vellum-lowest rounded-xl p-5 shadow-card ${isBest ? "ring-2 ring-terracotta/30" : ""}`}
              >
                {isBest && (
                  <span className="absolute -top-2 right-4 px-2 py-0.5 bg-terracotta text-vellum text-[9px] font-bold uppercase tracking-label rounded">
                    Top comp
                  </span>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <CompanyLogo offer={o} size={44} />
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-label text-ink-600 font-semibold truncate">{o.company}</div>
                    <div className="text-sm font-serif font-medium text-ink-900 truncate">{o.title}</div>
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-2xl font-serif font-semibold text-ink-900">${t.total}K</span>
                  <span className="text-[10px] uppercase tracking-label text-ink-600">/yr total</span>
                </div>
                {/* Stacked comp bar */}
                <div className="h-2 rounded-full overflow-hidden flex bg-vellum-mid mb-3">
                  <div className="bg-terracotta" style={{ width: `${(t.base / t.total) * 100}%` }} title={`Base $${t.base}K`} />
                  <div className="bg-[#c59a3a]" style={{ width: `${(t.bonus / t.total) * 100}%` }} title={`Bonus $${t.bonus}K`} />
                  <div className="bg-sage" style={{ width: `${(t.equity / t.total) * 100}%` }} title={`Equity $${t.equity}K`} />
                </div>
                <div className="flex gap-3 text-[10px] text-ink-600">
                  <span><span className="inline-block w-1.5 h-1.5 rounded-full bg-terracotta mr-1 align-middle" />Base ${t.base}K</span>
                  <span><span className="inline-block w-1.5 h-1.5 rounded-full bg-[#c59a3a] mr-1 align-middle" />Bonus ${t.bonus}K</span>
                  <span><span className="inline-block w-1.5 h-1.5 rounded-full bg-sage mr-1 align-middle" />Equity ${t.equity}K</span>
                </div>
                <p className="text-xs text-ink-700 font-serif italic leading-relaxed mt-4">{o.aiSummary}</p>
              </div>
            );
          })}
        </div>

        {/* Comparison chart — horizontal bars against max */}
        <div className="bg-vellum-lowest rounded-xl p-6 shadow-card mb-8">
          <h2 className="text-[11px] font-semibold uppercase tracking-label text-ink-600 mb-5">
            Annualized total, side-by-side
          </h2>
          <div className="space-y-5">
            {DEMO_OFFERS.map((o, i) => {
              const t = totals[i];
              const pct = (t.total / maxTotal) * 100;
              return (
                <div key={o.id} className="flex items-center gap-4">
                  <CompanyLogo offer={o} size={32} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between mb-1.5">
                      <span className="text-sm font-serif font-medium text-ink-900">{o.company}</span>
                      <span className="text-sm font-semibold text-ink-900">${t.total}K</span>
                    </div>
                    <div className="h-3 bg-vellum-mid rounded-full overflow-hidden flex">
                      <div className="bg-terracotta transition-all duration-700" style={{ width: `${(t.base / maxTotal) * 100}%` }} />
                      <div className="bg-[#c59a3a] transition-all duration-700" style={{ width: `${(t.bonus / maxTotal) * 100}%` }} />
                      <div className="bg-sage transition-all duration-700" style={{ width: `${(t.equity / maxTotal) * 100}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Wins / losses mini-cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {DEMO_OFFERS.map((o) => (
            <div key={o.id} className="bg-vellum-lowest rounded-xl p-5 shadow-card">
              <div className="flex items-center gap-2.5 mb-4">
                <CompanyLogo offer={o} size={28} />
                <span className="text-[10px] uppercase tracking-label text-ink-600 font-semibold">{o.company}</span>
              </div>
              <div className="mb-4">
                <p className="text-[10px] uppercase tracking-label text-sage font-semibold mb-2">Strengths</p>
                <ul className="space-y-1 text-xs text-ink-800">
                  {o.wins.map((w, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-sage shrink-0">+</span>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-label text-terracotta font-semibold mb-2">Trade-offs</p>
                <ul className="space-y-1 text-xs text-ink-800">
                  {o.losses.map((l, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-terracotta shrink-0">−</span>
                      <span>{l}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Detailed table — collapsed by default feel */}
        <details className="bg-vellum-lowest rounded-xl shadow-card mb-8 overflow-hidden">
          <summary className="cursor-pointer px-6 py-4 text-[11px] font-semibold uppercase tracking-label text-ink-700 hover:bg-vellum-low flex items-center justify-between">
            <span>Full detail comparison</span>
            <span className="text-ink-400">▾</span>
          </summary>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-vellum-high">
                  <th className="text-left p-4 text-[10px] uppercase tracking-label text-ink-600 font-semibold w-40">Field</th>
                  {DEMO_OFFERS.map((o) => (
                    <th key={o.id} className="text-left p-4 min-w-[200px]">
                      <div className="flex items-center gap-2">
                        <CompanyLogo offer={o} size={24} />
                        <span className="text-[10px] uppercase tracking-label text-ink-600 font-semibold">{o.company}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-ink-800">
                <DemoRow label="Level" offers={DEMO_OFFERS} render={(o) => o.level} />
                <DemoRow label="Location" offers={DEMO_OFFERS} render={(o) => o.location} />
                <DemoRow label="Remote" offers={DEMO_OFFERS} render={(o) => o.remotePolicy} />
                <DemoRow label="Equity" offers={DEMO_OFFERS} render={(o) => `${o.equityType} $${o.equityValue}K`} />
                <DemoRow label="Vest" offers={DEMO_OFFERS} render={(o) => `${o.vestYears}yr (${o.vestCliff}mo cliff)`} />
                <DemoRow label="Sign-on" offers={DEMO_OFFERS} render={(o) => `$${o.signOnBonus}K`} />
                <DemoRow label="PTO" offers={DEMO_OFFERS} render={(o) => (o.ptoDays === -1 ? "unlimited" : `${o.ptoDays} days`)} />
                <DemoRow label="Healthcare" offers={DEMO_OFFERS} render={(o) => o.healthcare} multiline />
                <DemoRow label="Benefits" offers={DEMO_OFFERS} render={(o) => o.benefits} multiline />
                <DemoRow label="Start" offers={DEMO_OFFERS} render={(o) => o.startDate} />
                <DemoRow label="Expires" offers={DEMO_OFFERS} render={(o) => o.expiryDate} />
              </tbody>
            </table>
          </div>
        </details>

        {showAdvice && (
          <div className="bg-vellum-lowest rounded-xl p-6 sm:p-8 shadow-elevated animate-fade-in-up">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-vellum-high">
              <div className="w-8 h-8 rounded bg-terracotta/10 flex items-center justify-center text-terracotta text-sm">✦</div>
              <div>
                <p className="manuscript-label">The Advisor</p>
                <p className="text-[11px] text-ink-600 font-serif italic">Claude Sonnet 4.5 — considering your resume, offers, and market data</p>
              </div>
            </div>
            <div className="text-ink-800 leading-relaxed">
              <ReactMarkdown
                components={{
                  h2: ({ children }) => (
                    <h2 className="font-serif text-xl font-semibold text-ink-900 mt-7 mb-3 first:mt-0">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="font-serif text-base font-semibold text-ink-900 mt-5 mb-2">{children}</h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-sm sm:text-base text-ink-800 leading-relaxed my-3">{children}</p>
                  ),
                  ul: ({ children }) => <ul className="my-3 space-y-1.5 pl-5 list-disc marker:text-ink-400">{children}</ul>,
                  ol: ({ children }) => <ol className="my-3 space-y-1.5 pl-5 list-decimal marker:text-ink-400">{children}</ol>,
                  li: ({ children }) => <li className="text-sm sm:text-base text-ink-800 leading-relaxed">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold text-terracotta">{children}</strong>,
                  em: ({ children }) => <em className="italic text-ink-700">{children}</em>,
                  table: ({ children }) => (
                    <div className="my-4 overflow-x-auto">
                      <table className="w-full text-sm border-collapse">{children}</table>
                    </div>
                  ),
                  thead: ({ children }) => <thead className="border-b border-vellum-high">{children}</thead>,
                  th: ({ children }) => (
                    <th className="text-left px-3 py-2 text-[10px] uppercase tracking-label text-ink-600 font-semibold">{children}</th>
                  ),
                  td: ({ children }) => <td className="px-3 py-2 text-sm text-ink-800 border-b border-vellum-mid/40">{children}</td>,
                  code: ({ children }) => (
                    <code className="px-1.5 py-0.5 bg-vellum-mid rounded text-xs font-mono text-ink-900">{children}</code>
                  ),
                }}
              >
                {DEMO_ADVICE}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DemoRow({
  label,
  offers,
  render,
  multiline,
}: {
  label: string;
  offers: DemoOffer[];
  render: (o: DemoOffer) => string;
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
