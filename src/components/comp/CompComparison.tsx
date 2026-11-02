import Link from "next/link";
import type { OpportunitySummary } from "@/lib/data/opportunities";
import { stageFor } from "@/lib/pipeline";
import { Card, EmptyState, PageTitle, SectionTitle, cx } from "@/components/ui";

type Opp = Pick<OpportunitySummary, "id" | "company" | "role" | "compMin" | "compMax" | "status" | "tier" | "fitScore">;

export function CompComparison({ opportunities }: { opportunities: Opp[] }) {
  const withComp = opportunities
    .filter((o) => o.compMin != null && o.compMax != null)
    .sort((a, b) => b.compMax! - a.compMax! || b.compMin! - a.compMin!);
  const withoutComp = opportunities.filter((o) => o.compMin == null || o.compMax == null);

  const globalMax = withComp.length ? Math.max(...withComp.map((o) => o.compMax!)) : 500;
  const avg = (fn: (o: Opp) => number) => (withComp.length ? Math.round(withComp.reduce((s, o) => s + fn(o), 0) / withComp.length) : 0);
  const avgMin = avg((o) => o.compMin!);
  const avgMax = avg((o) => o.compMax!);
  const highest = withComp.length ? Math.max(...withComp.map((o) => o.compMax!)) : 0;
  const lowest = withComp.length ? Math.min(...withComp.map((o) => o.compMin!)) : 0;

  return (
    <div>
      <PageTitle eyebrow="Compensation" title="Comp across the pipeline" description="Base ranges from every opportunity, side by side. Sorted by the top of the range." />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <Stat label="With comp data" value={String(withComp.length)} sub={`of ${opportunities.length} tracked`} />
        <Stat label="Average range" value={withComp.length ? `$${avgMin}K to $${avgMax}K` : "n/a"} />
        <Stat label="Highest max" value={withComp.length ? `$${highest}K` : "n/a"} accent />
        <Stat label="Lowest min" value={withComp.length ? `$${lowest}K` : "n/a"} />
      </div>

      {withComp.length === 0 ? (
        <Card>
          <EmptyState title="No comp ranges yet." hint="Add a comp min and max to an opportunity and it shows up here." />
        </Card>
      ) : (
        <div className="space-y-2">
          <div className="hidden sm:flex items-center justify-between text-[10px] uppercase tracking-label text-ink-600 pl-48 pr-28 mb-1">
            <span>$0K</span>
            <span>${Math.round(globalMax / 4)}K</span>
            <span>${Math.round(globalMax / 2)}K</span>
            <span>${Math.round((globalMax * 3) / 4)}K</span>
            <span>${globalMax}K</span>
          </div>

          {withComp.map((opp) => {
            const minPct = (opp.compMin! / globalMax) * 100;
            const rangePct = Math.max(((opp.compMax! - opp.compMin!) / globalMax) * 100, 1);
            const stage = stageFor(opp.status);
            return (
              <Link
                key={opp.id}
                href={`/opportunities/${opp.id}`}
                className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 group hover:bg-vellum-low rounded-lg py-2 px-2 -mx-2 transition-colors"
              >
                <div className="w-full sm:w-44 shrink-0 text-left sm:text-right sm:pr-2 min-w-0">
                  <p className="text-xs font-medium text-ink-900 truncate group-hover:text-terracotta transition-colors">{opp.company}</p>
                  <p className="text-[10px] text-ink-600 truncate">{opp.role}</p>
                </div>

                <div className="w-full sm:flex-1 relative h-8">
                  <div className="absolute inset-0 bg-vellum-high rounded" />
                  <div className={cx("absolute top-0 bottom-0 rounded opacity-80 group-hover:opacity-100 transition-opacity", stage.marker)} style={{ left: `${minPct}%`, width: `${rangePct}%` }} />
                  {rangePct > 10 ? (
                    <div className="absolute top-0 bottom-0 flex items-center justify-between px-1.5 text-[10px] font-medium text-vellum" style={{ left: `${minPct}%`, width: `${rangePct}%` }}>
                      <span>${opp.compMin}K</span>
                      <span>${opp.compMax}K</span>
                    </div>
                  ) : (
                    <div className="absolute top-0 bottom-0 flex items-center text-[10px] font-medium text-ink-700 pl-1" style={{ left: `${Math.min(minPct + rangePct + 1, 70)}%` }}>
                      ${opp.compMin}K to ${opp.compMax}K
                    </div>
                  )}
                </div>

                <div className="hidden sm:block w-24 shrink-0 text-right">
                  <span className={cx("text-[10px] font-semibold uppercase tracking-label", stage.accent)}>{stage.label}</span>
                  {opp.tier && <span className="text-[10px] text-ink-600 ml-1.5">T{opp.tier}</span>}
                  {opp.fitScore != null && (
                    <p className={cx("text-[10px]", opp.fitScore >= 80 ? "text-sage" : opp.fitScore >= 60 ? "text-umber" : "text-ink-600")}>{opp.fitScore}% fit</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {withoutComp.length > 0 && (
        <div className="mt-10 pt-6 border-t border-vellum-high">
          <SectionTitle>Missing comp data ({withoutComp.length})</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {withoutComp.map((opp) => (
              <Link key={opp.id} href={`/opportunities/${opp.id}`} className="text-xs text-ink-700 hover:text-terracotta py-1 transition-colors">
                {opp.company} · {opp.role}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <Card className="!p-4">
      <p className="text-[10px] uppercase tracking-label text-ink-600 font-semibold">{label}</p>
      <p className={cx("manuscript-display text-lg sm:text-xl mt-1 leading-tight", accent ? "text-terracotta" : "text-ink-900")}>{value}</p>
      {sub && <p className="text-[10px] text-ink-600 mt-0.5">{sub}</p>}
    </Card>
  );
}
