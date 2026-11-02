import Link from "next/link";
import type { UpcomingInterview } from "@/lib/data/interviews";
import type { RecentActivity } from "@/lib/data/activities";
import type { FollowUpItem } from "@/lib/data/opportunities";
import { formatDate } from "@/lib/format";
import { FollowUpCard } from "./FollowUpCard";

interface Props {
  upcoming: UpcomingInterview[];
  recent: RecentActivity[];
  followUps: FollowUpItem[];
  stats: { total: number; interviewing: number; offers: number };
}

export function DashboardSidebar({ upcoming, recent, followUps, stats }: Props) {
  return (
    <aside className="w-full lg:w-80 xl:w-96 bg-vellum-low lg:sticky lg:top-16 lg:self-start lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto px-4 sm:px-8 lg:px-8 py-6 sm:py-8 space-y-8 shrink-0 animate-slide-in-right">
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Tracked" value={stats.total} />
        <Stat label="Active" value={stats.interviewing} accent />
        <Stat label="Offers" value={stats.offers} />
      </div>

      <section>
        <h2 className="manuscript-label mb-3 flex items-center justify-between">
          <span>Upcoming</span>
          {upcoming.length > 0 && <span className="text-terracotta">{upcoming.length}</span>}
        </h2>
        {upcoming.length === 0 ? (
          <p className="text-sm font-serif italic text-ink-600">No interviews scheduled.</p>
        ) : (
          <div className="space-y-2">
            {upcoming.map((i) => (
              <Link key={i.id} href={`/opportunities/${i.opportunity.id}/interviews`} className="block bg-vellum-lowest rounded px-3 py-2.5 hover-lift">
                <p className="text-sm text-ink-900 font-serif font-medium leading-tight">{i.opportunity.company}</p>
                <p className="text-[11px] text-ink-600 mt-0.5">{i.round}</p>
                {i.dateTime && <p className="text-[10px] uppercase tracking-label text-terracotta mt-1.5 font-medium">{formatDate(i.dateTime, "long")}</p>}
              </Link>
            ))}
          </div>
        )}
      </section>

      {followUps.length > 0 && (
        <section>
          <h2 className="manuscript-label mb-3 text-terracotta">Needs a follow-up</h2>
          <div className="space-y-2">
            {followUps.map((item) => (
              <FollowUpCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="manuscript-label mb-3">Recent activity</h2>
        {recent.length === 0 ? (
          <p className="text-sm font-serif italic text-ink-600">Nothing logged yet.</p>
        ) : (
          <div className="space-y-2.5">
            {recent.map((a) => (
              <div key={a.id} className="flex items-start gap-3 text-xs">
                <span className="text-[10px] uppercase tracking-label text-ink-600 shrink-0 w-12 pt-0.5 font-medium">{formatDate(a.date)}</span>
                <div className="min-w-0">
                  <span className="text-ink-900 font-serif leading-snug block">{a.description}</span>
                  {a.opportunity && (
                    <Link href={`/opportunities/${a.opportunity.id}`} className="text-ink-600 text-[11px] block mt-0.5 hover:text-terracotta transition-colors">
                      {a.opportunity.company} · {a.opportunity.role}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </aside>
  );
}

function Stat({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="bg-vellum-lowest rounded px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-label text-ink-600 font-semibold">{label}</p>
      <p className={`manuscript-display text-2xl leading-none mt-1 ${accent ? "text-terracotta" : "text-ink-900"}`}>{value}</p>
    </div>
  );
}
