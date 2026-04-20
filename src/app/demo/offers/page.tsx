"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type DemoOffer = {
  id: string;
  company: string;
  role: string;
  title: string;
  level: string;
  baseComp: number;
  signOnBonus: number | null;
  annualBonus: number | null;
  bonusPercent: number | null;
  equityType: string;
  equityValue: number;
  vestYears: number;
  vestCliff: number;
  ptoDays: number;
  healthcare: string;
  remotePolicy: string;
  startDate: string;
  expiryDate: string;
  location: string;
  benefits: string;
  aiSummary: string;
};

const DEMO_OFFERS: DemoOffer[] = [
  {
    id: "d1",
    company: "Anthropic",
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
    startDate: "2026-06-01",
    expiryDate: "2026-05-01",
    location: "San Francisco, CA",
    benefits: "$2K home office stipend, $3K learning budget, 16 weeks parental leave, 401k 6% match",
    aiSummary: "High-growth AI lab offer with strong equity upside ($120K/yr) but SF hybrid requirement. Below-average base for the role.",
  },
  {
    id: "d2",
    company: "Stripe",
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
    healthcare: "Full coverage including family, $0 premium",
    remotePolicy: "Fully remote within US",
    startDate: "2026-05-15",
    expiryDate: "2026-04-30",
    location: "Remote",
    benefits: "$5K WFH setup, $4K annual learning, 20 weeks parental leave, 401k 5% match, FSA/HSA",
    aiSummary: "Highest cash comp offer with fully remote flexibility. Late-stage private equity — lower upside but more liquid.",
  },
  {
    id: "d3",
    company: "Ramp",
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
    startDate: "2026-05-20",
    expiryDate: "2026-05-05",
    location: "New York, NY",
    benefits: "$1K home office, $2K learning budget, 12 weeks parental leave, 401k no match",
    aiSummary: "Highest equity upside ($138K/yr) with Director title, but NYC 4-day in-office and lower benefits package.",
  },
];

const DEMO_ADVICE = `## TL;DR
**Anthropic is the strongest all-around offer** if you value equity upside and category leadership in AI — but Stripe wins if cash and remote flexibility matter more. Ramp is close to Anthropic on paper but penalized by the NYC 4-day in-office requirement.

## Compensation comparison

| Company | Base | Bonus | Equity/yr | Est. total |
|---|---|---|---|---|
| Anthropic | $240K | — | $120K | **$360K** |
| Stripe | $285K | $85K | $80K | **$450K** |
| Ramp | $225K | $45K | $138K | **$408K** |

Stripe leads on year-one cash. Ramp leads on equity grant size. Anthropic has the highest probability-weighted upside given company trajectory.

## Where each offer wins
- **Anthropic**: AI category leadership, unlimited PTO, strong equity in a still-private leader, generous learning + parental leave
- **Stripe**: Highest cash, fully remote, best healthcare + 401k match, biggest sign-on
- **Ramp**: Director title, highest nominal equity grant, unlimited PTO

## Where each offer loses
- **Anthropic**: Below-market base, SF hybrid mandate, equity valuation assumes continued private-round markups
- **Stripe**: Smallest equity grant, IPO timing uncertain, late-stage means limited upside
- **Ramp**: NYC 4-day in-office is a real lifestyle hit, no 401k match, healthcare weaker (employee-only)

## Questions to ask before deciding
1. **Anthropic**: What's the current 409A valuation and how has it tracked over the past 4 rounds? What's the expected IPO window?
2. **Stripe**: Are the RSUs double-trigger (IPO + time) or single-trigger? What happens if IPO slips 2+ years?
3. **Ramp**: Is the 4-day in-office negotiable down to 3? What's the promo timeline to the next level?
4. **All three**: What's the severance policy and is there a change-of-control clause on equity?

## Negotiation levers
- **Anthropic**: Push base to $260K citing Stripe's $285K. Equity is their strongest card; let them lead there.
- **Stripe**: Ask for an additional $150K RSU grant citing Ramp's larger equity package.
- **Ramp**: Push remote flex to 3 days and 401k match. Use Anthropic's equity valuation trajectory as leverage.

## Final recommendation
If your top two priorities are **equity upside + category positioning** → **Anthropic**. If they're **cash + remote + short-term stability** → **Stripe**. Ramp is the weakest only because of the in-office burden, not the comp — if NYC is your preferred city and you want the Director title, it's competitive.

The numbers are close enough that **fit, manager, and trajectory** should be the tie-breaker, not comp.`;

export default function DemoOffersPage() {
  const [showAdvice, setShowAdvice] = useState(false);
  const [loading, setLoading] = useState(false);

  const estTotal = (o: DemoOffer) => {
    const bonus = o.annualBonus ?? (o.bonusPercent ? Math.round(o.baseComp * o.bonusPercent / 100) : 0);
    return o.baseComp + bonus + Math.round(o.equityValue / o.vestYears);
  };

  const maxTotal = useMemo(() => Math.max(...DEMO_OFFERS.map(estTotal)), []);

  const runAdvisor = () => {
    setLoading(true);
    // Fake latency so it feels real without burning API credits on demo day
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
        <div className="flex items-end justify-between mb-8 gap-3 flex-wrap">
          <div>
            <p className="manuscript-label">The Decision</p>
            <h1 className="manuscript-display text-3xl sm:text-4xl font-semibold text-ink-900 mt-1 leading-tight">
              Three offers on the table
            </h1>
            <p className="text-sm font-serif italic text-ink-700 mt-2 max-w-xl">
              Side-by-side comparison. Claude Sonnet pulls your resume, weighs trade-offs,
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

        {/* Total comp bars */}
        <div className="bg-vellum-lowest rounded-lg p-6 shadow-card mb-6">
          <h2 className="text-[11px] font-semibold uppercase tracking-label text-ink-600 mb-4">
            Estimated annualized total
          </h2>
          <div className="space-y-3">
            {DEMO_OFFERS.map((o) => {
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
                      className="h-full bg-terracotta rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Comparison table */}
        <div className="overflow-x-auto bg-vellum-lowest rounded-lg shadow-card mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-vellum-high">
                <th className="text-left p-4 text-[10px] uppercase tracking-label text-ink-600 font-semibold w-40">Field</th>
                {DEMO_OFFERS.map((o) => (
                  <th key={o.id} className="text-left p-4 min-w-[200px]">
                    <div className="text-[10px] uppercase tracking-label text-ink-600 font-semibold">{o.company}</div>
                    <div className="text-sm font-serif font-medium text-ink-900 mt-0.5">{o.title}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-ink-800">
              <DemoRow label="Base" offers={DEMO_OFFERS} render={(o) => `$${o.baseComp}K`} />
              <DemoRow label="Annual bonus" offers={DEMO_OFFERS} render={(o) =>
                o.annualBonus ? `$${o.annualBonus}K` : o.bonusPercent ? `${o.bonusPercent}%` : "—"
              } />
              <DemoRow label="Sign-on" offers={DEMO_OFFERS} render={(o) => o.signOnBonus ? `$${o.signOnBonus}K` : "—"} />
              <DemoRow label="Equity" offers={DEMO_OFFERS} render={(o) => `${o.equityType} $${o.equityValue}K`} />
              <DemoRow label="Vest" offers={DEMO_OFFERS} render={(o) => `${o.vestYears}yr (${o.vestCliff}mo cliff)`} />
              <DemoRow label="Level" offers={DEMO_OFFERS} render={(o) => o.level} />
              <DemoRow label="Location" offers={DEMO_OFFERS} render={(o) => o.location} />
              <DemoRow label="Remote" offers={DEMO_OFFERS} render={(o) => o.remotePolicy} />
              <DemoRow label="PTO" offers={DEMO_OFFERS} render={(o) => o.ptoDays === -1 ? "unlimited" : `${o.ptoDays} days`} />
              <DemoRow label="Benefits" offers={DEMO_OFFERS} render={(o) => o.benefits} multiline />
              <DemoRow label="Summary" offers={DEMO_OFFERS} render={(o) => o.aiSummary} multiline />
            </tbody>
          </table>
        </div>

        {showAdvice && (
          <div className="bg-vellum-lowest rounded-lg p-6 sm:p-8 shadow-card animate-fade-in-up">
            <h2 className="manuscript-label mb-4">The Advisor</h2>
            <div className="text-ink-800 font-serif leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
              {DEMO_ADVICE}
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
