import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LinkButton, Card, Eyebrow } from "@/components/ui";
import { Markdown } from "@/components/ui/Markdown";
import { CompanyAvatar } from "@/components/CompanyAvatar";
import { DEMO_OFFERS, DEMO_ADVICE, demoOfferTotal, type DemoOffer } from "@/lib/demo-data";

export const metadata: Metadata = {
  title: "Offer comparison demo",
  description: "See how Interview Tracker compares competing offers.",
};

const ROWS: { label: string; render: (o: DemoOffer) => string; multiline?: boolean }[] = [
  { label: "Base", render: (o) => `$${o.baseComp}K` },
  { label: "Annual bonus", render: (o) => (o.annualBonus ? `$${o.annualBonus}K` : o.bonusPercent ? `${o.bonusPercent}%` : "none") },
  { label: "Sign-on", render: (o) => `$${o.signOnBonus}K` },
  { label: "Equity", render: (o) => `${o.equityType} $${o.equityValue}K` },
  { label: "Vest", render: (o) => `${o.vestYears} yr, ${o.vestCliff} mo cliff` },
  { label: "Level", render: (o) => o.level },
  { label: "Location", render: (o) => o.location },
  { label: "Remote", render: (o) => o.remotePolicy },
  { label: "PTO", render: (o) => (o.ptoDays === -1 ? "Unlimited" : `${o.ptoDays} days`) },
  { label: "Start", render: (o) => o.startDate },
  { label: "Expires", render: (o) => o.expiryDate },
  { label: "Benefits", render: (o) => o.benefits, multiline: true },
  { label: "Summary", render: (o) => o.aiSummary, multiline: true },
];

export default function DemoOffersPage() {
  const totals = DEMO_OFFERS.map(demoOfferTotal);
  const max = Math.max(...totals);

  return (
    <div className="min-h-screen bg-vellum">
      <div className="bg-terracotta/10 px-4 py-2.5 text-center">
        <p className="text-xs text-terracotta-deep">
          Sample offers.{" "}
          <Link href="/login" className="font-semibold underline underline-offset-2 hover:text-terracotta">
            Sign up free
          </Link>{" "}
          to compare your own.
        </p>
      </div>
      <header className="manuscript-glass sticky top-0 z-20">
        <div className="px-4 sm:px-8 lg:px-12 h-14 sm:h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="inline-flex"><Logo size={26} /></Link>
            <span className="text-ink-400">/</span>
            <Link href="/demo" className="text-[11px] font-semibold uppercase tracking-label text-ink-700 hover:text-terracotta transition-colors">
              ← Pipeline demo
            </Link>
          </div>
          <LinkButton href="/login" variant="primary" size="sm">
            Sign up free
          </LinkButton>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-vellum-high to-transparent" />
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-12 animate-fade-in-up">
        <Eyebrow>Offers</Eyebrow>
        <h1 className="manuscript-display text-3xl sm:text-4xl font-semibold text-ink-900 mt-1 leading-tight">Three offers, one table</h1>
        <p className="text-sm font-serif italic text-ink-700 mt-2 max-w-xl">
          Offer letters are parsed into the same fields so the comparison is honest. The advisor reads them with your resume.
        </p>

        <div className="grid gap-4 sm:grid-cols-3 mt-8">
          {DEMO_OFFERS.map((o, i) => (
            <Card key={o.id} className="flex items-start gap-3">
              <CompanyAvatar company={o.company} website={o.website} size={40} />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-label text-ink-600 font-semibold truncate">{o.company}</p>
                <p className="font-serif text-[15px] font-medium text-ink-900 leading-tight mt-0.5">{o.title}</p>
                <p className="text-sm font-semibold text-terracotta mt-2">
                  ${totals[i]}K <span className="text-[10px] uppercase tracking-label text-ink-600 font-medium">/yr est.</span>
                </p>
              </div>
            </Card>
          ))}
        </div>

        <Card className="mt-6">
          <Eyebrow className="mb-4">Estimated annualized total</Eyebrow>
          <div className="space-y-3">
            {DEMO_OFFERS.map((o, i) => (
              <div key={o.id}>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-sm font-serif font-medium text-ink-900">{o.company}</span>
                  <span className="text-sm font-semibold text-terracotta">${totals[i]}K</span>
                </div>
                <div className="h-2 bg-vellum-mid rounded-full overflow-hidden">
                  <div className="h-full bg-terracotta rounded-full" style={{ width: `${(totals[i] / max) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="overflow-x-auto bg-vellum-lowest rounded-lg shadow-card mt-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-vellum-high">
                <th className="text-left p-4 text-[10px] uppercase tracking-label text-ink-600 font-semibold w-36">Field</th>
                {DEMO_OFFERS.map((o) => (
                  <th key={o.id} className="text-left p-4 min-w-[180px]">
                    <div className="text-[10px] uppercase tracking-label text-ink-600 font-semibold">{o.company}</div>
                    <div className="text-sm font-serif font-medium text-ink-900 mt-0.5">{o.title}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-ink-800">
              {ROWS.map((row) => (
                <tr key={row.label} className="border-b border-vellum-mid/40">
                  <td className="p-4 text-[10px] uppercase tracking-label text-ink-600 font-semibold align-top">{row.label}</td>
                  {DEMO_OFFERS.map((o) => (
                    <td key={o.id} className={`p-4 align-top ${row.multiline ? "text-xs" : "text-sm"}`}>
                      {row.render(o)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Card tone="glass" className="mt-6">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-vellum-high">
            <div className="w-8 h-8 rounded bg-terracotta/10 flex items-center justify-center text-terracotta text-sm">✦</div>
            <div>
              <Eyebrow>Advisor</Eyebrow>
              <p className="text-[11px] text-ink-600 font-serif italic">Sample recommendation</p>
            </div>
          </div>
          <Markdown>{DEMO_ADVICE}</Markdown>
        </Card>

        <div className="mt-10 text-center">
          <LinkButton href="/login" variant="primary">
            Compare your own offers
          </LinkButton>
        </div>
      </div>
    </div>
  );
}
