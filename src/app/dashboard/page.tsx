import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { findOpportunities, findUpcomingInterviews, findRecentActivities, findOverdueFollowups } from "@/lib/db";
import Link from "next/link";
import KanbanBoard from "./KanbanBoard";
import LogoutButton from "./LogoutButton";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = (session.user as any).id;

  const [opportunities, upcomingInterviews, recentActivity, overdueFollowups] = await Promise.all([
    findOpportunities(userId),
    findUpcomingInterviews(userId),
    findRecentActivities(userId),
    findOverdueFollowups(userId),
  ]);

  const stats = {
    total: opportunities.length,
    interviewing: opportunities.filter((o) => o.status === "interviewing").length,
    upcoming: upcomingInterviews.length,
    offers: opportunities.filter((o) => o.status === "offer").length,
  };

  return (
    <div className="min-h-screen bg-vellum">
      {/* Header — editorial masthead */}
      <header className="manuscript-glass sticky top-0 z-20 animate-fade-in">
        <div className="px-4 sm:px-10 lg:px-16 py-4 sm:py-5 flex items-center justify-between">
          <div className="min-w-0 flex items-center gap-3 sm:gap-5">
            <div className="h-8 w-8 rounded-sm bg-terracotta flex items-center justify-center shadow-card shrink-0">
              <span className="text-vellum font-serif text-base leading-none">IT</span>
            </div>
            <div className="min-w-0">
              <h1 className="manuscript-display text-xl sm:text-2xl lg:text-[1.75rem] font-semibold text-ink-900 leading-tight truncate">
                The Pipeline
              </h1>
              <p className="text-[10px] sm:text-[11px] font-medium uppercase tracking-label text-ink-600 mt-0.5">
                <span className="text-terracotta">{stats.total}</span> opps
                <span className="mx-2 text-ink-400">·</span>
                <span className="text-terracotta">{stats.interviewing}</span> active
                <span className="mx-2 text-ink-400">·</span>
                <span className="text-terracotta">{stats.upcoming}</span> upcoming
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:flex items-center gap-1">
              <Link
                href="/dashboard/comp"
                className="px-3 py-1.5 text-[11px] font-medium uppercase tracking-label text-ink-700 hover:text-terracotta hover:bg-vellum-high rounded transition-all"
              >
                Compensation
              </Link>
              <a
                href="/api/export?format=csv"
                className="px-3 py-1.5 text-[11px] font-medium uppercase tracking-label text-ink-700 hover:text-terracotta hover:bg-vellum-high rounded transition-all"
              >
                Export
              </a>
              <Link
                href="/profile"
                className="px-3 py-1.5 text-[11px] font-medium uppercase tracking-label text-ink-700 hover:text-terracotta hover:bg-vellum-high rounded transition-all"
              >
                Profile
              </Link>
            </div>
            <div className="flex items-center gap-2 pl-2 sm:pl-3 sm:border-l sm:border-vellum-high">
              <span className="hidden sm:inline text-xs text-ink-700 font-medium truncate max-w-[140px]">
                {session.user?.name}
              </span>
              <LogoutButton />
            </div>
          </div>
        </div>
        {/* Tonal shift seam — no hard border */}
        <div className="h-px bg-gradient-to-r from-transparent via-vellum-high to-transparent" />
      </header>

      {/* Mobile secondary nav */}
      <div className="md:hidden flex items-center gap-1 px-4 py-2 bg-vellum-low overflow-x-auto">
        <Link href="/dashboard/comp" className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-label text-ink-700 whitespace-nowrap">
          Compensation
        </Link>
        <a href="/api/export?format=csv" className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-label text-ink-700 whitespace-nowrap">
          Export
        </a>
        <Link href="/profile" className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-label text-ink-700 whitespace-nowrap">
          Profile
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row pb-20 lg:pb-0">
        {/* Main content — Kanban */}
        <main className="flex-1 px-4 sm:px-10 lg:px-16 py-6 sm:py-8 overflow-x-auto animate-fade-in-up">
          <KanbanBoard opportunities={opportunities} />
        </main>

        {/* Right sidebar — marginalia */}
        <aside className="w-full lg:w-80 xl:w-96 bg-vellum-low lg:sticky lg:top-[85px] lg:self-start lg:max-h-[calc(100vh-85px)] lg:overflow-y-auto px-4 sm:px-10 lg:px-8 py-6 sm:py-8 space-y-8 shrink-0 animate-slide-in-right">
          {/* Upcoming Interviews */}
          <div>
            <h2 className="manuscript-label mb-3 flex items-center justify-between">
              <span>Upcoming</span>
              {upcomingInterviews.length > 0 && (
                <span className="text-[10px] text-terracotta font-semibold normal-case tracking-normal">
                  {upcomingInterviews.length}
                </span>
              )}
            </h2>
            {upcomingInterviews.length === 0 ? (
              <p className="text-sm text-ink-600 italic font-serif">
                No interviews on the calendar.
              </p>
            ) : (
              <div className="space-y-2">
                {upcomingInterviews.map((interview: any) => (
                  <Link
                    href={`/opportunities/${interview.opportunity.id}`}
                    key={interview.id}
                    className="block bg-vellum-lowest rounded px-3 py-2.5 hover-lift"
                  >
                    <p className="text-sm text-ink-900 font-serif font-medium leading-tight">
                      {interview.opportunity.company}
                    </p>
                    <p className="text-[11px] text-ink-600 mt-0.5">{interview.round}</p>
                    {interview.dateTime && (
                      <p className="text-[10px] uppercase tracking-label text-terracotta mt-1.5 font-medium">
                        {new Date(interview.dateTime).toLocaleDateString(
                          "en-US",
                          {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Overdue Follow-ups */}
          {overdueFollowups.length > 0 && (
            <div>
              <h2 className="manuscript-label mb-3 text-terracotta">Needs Follow-up</h2>
              <div className="space-y-2">
                {overdueFollowups.map((item: any) => (
                  <Link
                    key={item.id}
                    href={`/opportunities/${item.id}`}
                    className="block bg-terracotta/5 rounded px-3 py-2.5 hover:bg-terracotta/10 transition-colors"
                  >
                    <p className="text-sm text-ink-900 font-serif font-medium leading-tight">{item.company}</p>
                    <p className="text-[11px] text-ink-600 mt-0.5">{item.role}</p>
                    <p className="text-[10px] uppercase tracking-label text-terracotta mt-1.5 font-medium">
                      {item.daysSinceActivity} days silent
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div>
            <h2 className="manuscript-label mb-3">Marginalia</h2>
            <div className="space-y-2.5">
              {recentActivity.map((activity: any) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 text-xs"
                >
                  <span className="text-[10px] uppercase tracking-label text-ink-600 shrink-0 w-12 pt-0.5 font-medium">
                    {new Date(activity.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <div className="min-w-0">
                    <span className="text-ink-900 font-serif leading-snug block">
                      {activity.description}
                    </span>
                    {activity.opportunity && (
                      <span className="text-ink-600 text-[11px] block mt-0.5">
                        {activity.opportunity.company} · {activity.opportunity.role}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 manuscript-glass safe-bottom border-t border-vellum-high/60">
        <div className="flex items-center justify-around py-2">
          <Link href="/dashboard" className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-terracotta">
            <span className="text-base">◪</span>
            <span className="text-[9px] uppercase tracking-label font-semibold">Pipeline</span>
          </Link>
          <Link href="/dashboard/comp" className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-ink-700">
            <span className="text-base">$</span>
            <span className="text-[9px] uppercase tracking-label font-semibold">Comp</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-ink-700">
            <span className="text-base">✎</span>
            <span className="text-[9px] uppercase tracking-label font-semibold">Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
