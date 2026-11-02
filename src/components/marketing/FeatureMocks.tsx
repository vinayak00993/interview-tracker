import { Badge } from "@/components/ui";

/** Static illustrative cards for the landing page. No data, just shape. */

export function PrepMock() {
  return (
    <div className="bg-vellum-lowest rounded-lg shadow-card p-5 text-left">
      <p className="manuscript-label">Prep · Hiring manager round</p>
      <p className="font-serif text-[15px] text-ink-900 leading-snug mt-1.5">
        Position yourself as the operator who makes partner programs accountable, not the strategist who designs them.
      </p>
      <div className="mt-4 space-y-2.5">
        <MockLine label="Talking point" text="Grew the marketplace channel from zero to eight figures with a two person team." />
        <MockLine label="Talking point" text="Ran quarterly reviews that cut partner churn by a third." />
        <div className="bg-terracotta/5 rounded px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] uppercase tracking-label text-terracotta font-semibold">Gap</p>
            <Badge className="bg-terracotta/10 text-terracotta">Carried from round 1</Badge>
          </div>
          <p className="text-xs text-ink-800 mt-1">No direct example of holding a partner accountable without authority. Lead with the regional hub story.</p>
        </div>
      </div>
    </div>
  );
}

export function DebriefMock() {
  return (
    <div className="grid gap-3">
      <div className="bg-vellum-lowest rounded-lg shadow-card p-5 text-left">
        <div className="flex items-center justify-between gap-2">
          <p className="manuscript-label">Debrief · Recruiter screen</p>
          <span className="text-[10px] font-semibold uppercase tracking-label text-sage">Positive</span>
        </div>
        <p className="text-xs text-ink-800 mt-2 leading-relaxed">
          Pushed hard on governance. Used the hub example. Hinted the hiring manager wants a concrete operating cadence.
        </p>
        <p className="text-[10px] uppercase tracking-label text-ink-600 font-semibold mt-3">They asked</p>
        <p className="text-xs text-ink-700 mt-1">Tell me about a partner relationship that went sideways.</p>
      </div>
      <div className="bg-vellum-lowest rounded-lg shadow-card p-5 text-left">
        <p className="manuscript-label">Follow-up draft</p>
        <p className="text-xs text-ink-900 font-medium mt-2">Subject: Thank you, and the operating cadence we discussed</p>
        <p className="text-xs text-ink-700 mt-1.5 leading-relaxed">
          Hi Marcus, thanks for the time today. The governance question stuck with me, so I wrote up the quarterly review cadence we used with the regional hubs...
          <span className="inline-block w-1.5 h-3 bg-terracotta/70 align-middle ml-0.5 animate-pulse" aria-hidden="true" />
        </p>
      </div>
    </div>
  );
}

export function OffersMock() {
  const rows = [
    { company: "Stripe", total: 450, base: 285, equity: 80 },
    { company: "Ramp", total: 408, base: 225, equity: 138 },
  ];
  const max = Math.max(...rows.map((r) => r.total));
  return (
    <div className="bg-vellum-lowest rounded-lg shadow-card p-5 text-left">
      <p className="manuscript-label">Estimated annualized total</p>
      <div className="space-y-4 mt-3">
        {rows.map((r) => (
          <div key={r.company}>
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-sm font-serif font-medium text-ink-900">{r.company}</span>
              <span className="text-sm font-semibold text-terracotta">
                ${r.total}K <span className="text-[10px] uppercase tracking-label text-ink-600 font-medium">/yr</span>
              </span>
            </div>
            <div className="h-2.5 bg-vellum-mid rounded-full overflow-hidden flex">
              <div className="h-full bg-terracotta" style={{ width: `${(r.base / max) * 100}%` }} title="Base" />
              <div className="h-full bg-umber" style={{ width: `${((r.total - r.base - r.equity) / max) * 100}%` }} title="Bonus" />
              <div className="h-full bg-sage" style={{ width: `${(r.equity / max) * 100}%` }} title="Equity per year" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-3 text-[10px] uppercase tracking-label text-ink-600 font-semibold">
        <Legend cls="bg-terracotta" label="Base" />
        <Legend cls="bg-umber" label="Bonus" />
        <Legend cls="bg-sage" label="Equity / yr" />
      </div>
    </div>
  );
}

function MockLine({ label, text }: { label: string; text: string }) {
  return (
    <div className="bg-vellum-low rounded px-3 py-2">
      <p className="text-[10px] uppercase tracking-label text-ink-600 font-semibold">{label}</p>
      <p className="text-xs text-ink-800 mt-0.5">{text}</p>
    </div>
  );
}

function Legend({ cls, label }: { cls: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${cls}`} aria-hidden="true" />
      {label}
    </span>
  );
}
