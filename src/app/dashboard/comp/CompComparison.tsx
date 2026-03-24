"use client";

import Link from "next/link";

interface Opportunity {
  id: string;
  company: string;
  role: string;
  compMin: number | null;
  compMax: number | null;
  status: string;
  priority: string;
  tier: number | null;
  fitScore: number | null;
  location: string | null;
  remote: boolean;
}

const STATUS_COLORS: Record<string, { bar: string; text: string }> = {
  saved: { bar: "bg-warm-400", text: "text-warm-700" },
  applied: { bar: "bg-yellow-500", text: "text-yellow-700" },
  interviewing: { bar: "bg-terra", text: "text-terra" },
  offer: { bar: "bg-green-500", text: "text-green-700" },
  rejected: { bar: "bg-red-400", text: "text-red-600" },
  withdrawn: { bar: "bg-purple-400", text: "text-purple-600" },
};

export default function CompComparison({ opportunities }: { opportunities: Opportunity[] }) {
  // Filter to only those with comp data, sort by max comp descending
  const withComp = opportunities
    .filter((o) => o.compMin != null && o.compMax != null)
    .sort((a, b) => (b.compMax! - a.compMax!) || (b.compMin! - a.compMin!));

  const withoutComp = opportunities.filter((o) => o.compMin == null || o.compMax == null);

  // Find the global max for scaling bars
  const globalMax = withComp.length > 0 ? Math.max(...withComp.map((o) => o.compMax!)) : 500;

  // Stats
  const avgMin = withComp.length > 0 ? Math.round(withComp.reduce((s, o) => s + o.compMin!, 0) / withComp.length) : 0;
  const avgMax = withComp.length > 0 ? Math.round(withComp.reduce((s, o) => s + o.compMax!, 0) / withComp.length) : 0;
  const highestMax = withComp.length > 0 ? Math.max(...withComp.map((o) => o.compMax!)) : 0;
  const lowestMin = withComp.length > 0 ? Math.min(...withComp.map((o) => o.compMin!)) : 0;

  return (
    <div className="min-h-screen bg-warm-100">
      <header className="border-b border-warm-300 px-6 py-3 flex items-center gap-4 bg-warm-50">
        <Link href="/dashboard" className="text-xs text-warm-600 hover:text-warm-900 transition-colors">
          ← Dashboard
        </Link>
        <div className="h-4 w-px bg-warm-300" />
        <h1 className="text-sm font-semibold text-warm-900">Comp Comparison</h1>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <StatCard label="Opportunities" value={String(withComp.length)} sub={`of ${opportunities.length} total`} />
          <StatCard label="Avg Range" value={`$${avgMin}K – $${avgMax}K`} />
          <StatCard label="Highest Max" value={`$${highestMax}K`} accent />
          <StatCard label="Lowest Min" value={`$${lowestMin}K`} />
        </div>

        {/* Bar chart */}
        {withComp.length === 0 ? (
          <div className="text-center py-12 text-warm-500">
            <p className="text-sm">No opportunities with comp data yet.</p>
            <p className="text-xs mt-1">Add comp ranges to your opportunities to see them compared here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Scale labels */}
            <div className="flex items-center justify-between text-[10px] text-warm-400 pl-48 pr-2 mb-1">
              <span>$0K</span>
              <span>${Math.round(globalMax / 4)}K</span>
              <span>${Math.round(globalMax / 2)}K</span>
              <span>${Math.round((globalMax * 3) / 4)}K</span>
              <span>${globalMax}K</span>
            </div>

            {withComp.map((opp) => {
              const minPct = (opp.compMin! / globalMax) * 100;
              const rangePct = ((opp.compMax! - opp.compMin!) / globalMax) * 100;
              const colors = STATUS_COLORS[opp.status] || STATUS_COLORS.saved;

              return (
                <Link
                  key={opp.id}
                  href={`/opportunities/${opp.id}`}
                  className="flex items-center gap-3 group hover:bg-warm-200/50 rounded-lg py-2 px-2 -mx-2 transition-colors"
                >
                  {/* Label */}
                  <div className="w-44 shrink-0 text-right pr-2">
                    <p className="text-xs font-medium text-warm-900 truncate group-hover:text-terra transition-colors">
                      {opp.company}
                    </p>
                    <p className="text-[10px] text-warm-500 truncate">{opp.role}</p>
                  </div>

                  {/* Bar */}
                  <div className="flex-1 relative h-8">
                    {/* Background track */}
                    <div className="absolute inset-0 bg-warm-200 rounded" />
                    {/* Range bar */}
                    <div
                      className={`absolute top-0 bottom-0 ${colors.bar} rounded opacity-80 group-hover:opacity-100 transition-opacity`}
                      style={{ left: `${minPct}%`, width: `${Math.max(rangePct, 1)}%` }}
                    />
                    {/* Labels on bar */}
                    <div
                      className="absolute top-0 bottom-0 flex items-center justify-between px-1.5 text-[10px] font-medium text-white"
                      style={{ left: `${minPct}%`, width: `${Math.max(rangePct, 1)}%` }}
                    >
                      {rangePct > 8 && <span>${opp.compMin}K</span>}
                      {rangePct > 8 && <span>${opp.compMax}K</span>}
                    </div>
                    {/* Tooltip for narrow bars */}
                    {rangePct <= 8 && (
                      <div
                        className="absolute top-0 bottom-0 flex items-center text-[10px] font-medium text-warm-700 pl-1"
                        style={{ left: `${minPct + rangePct + 1}%` }}
                      >
                        ${opp.compMin}K – ${opp.compMax}K
                      </div>
                    )}
                  </div>

                  {/* Status + meta */}
                  <div className="w-24 shrink-0 text-right">
                    <span className={`text-[10px] ${colors.text}`}>{opp.status}</span>
                    {opp.tier && (
                      <span className="text-[10px] text-warm-500 ml-1.5">T{opp.tier}</span>
                    )}
                    {opp.fitScore != null && (
                      <p className={`text-[10px] ${opp.fitScore >= 80 ? "text-green-600" : opp.fitScore >= 60 ? "text-yellow-600" : "text-warm-500"}`}>
                        {opp.fitScore}% fit
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Opportunities without comp data */}
        {withoutComp.length > 0 && (
          <div className="mt-8 pt-6 border-t border-warm-300">
            <h3 className="text-xs font-medium text-warm-500 uppercase tracking-wider mb-3">
              Missing Comp Data ({withoutComp.length})
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {withoutComp.map((opp) => (
                <Link
                  key={opp.id}
                  href={`/opportunities/${opp.id}`}
                  className="text-xs text-warm-600 hover:text-terra py-1 transition-colors"
                >
                  {opp.company} — {opp.role}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="bg-white border border-warm-300 rounded-lg p-4">
      <p className="text-[10px] text-warm-500 uppercase tracking-wider">{label}</p>
      <p className={`text-lg font-semibold mt-1 ${accent ? "text-terra" : "text-warm-900"}`}>{value}</p>
      {sub && <p className="text-[10px] text-warm-500 mt-0.5">{sub}</p>}
    </div>
  );
}
