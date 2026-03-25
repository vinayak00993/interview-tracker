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
  };

  return (
    <div className="min-h-screen bg-warm-100">
      {/* Header */}
      <header className="border-b border-warm-300/60 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between bg-warm-50/80 backdrop-blur-sm sticky top-0 z-10 animate-fade-in">
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-semibold text-warm-900 tracking-tight">
            Interview Tracker
          </h1>
          <p className="text-[10px] sm:text-xs text-warm-600 mt-0.5">
            {stats.total} opps · {stats.interviewing} active · {stats.upcoming} upcoming
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-end">
          <div className="hidden sm:flex items-center gap-2">
            <Link
              href="/dashboard/comp"
              className="px-3 py-1.5 text-xs font-medium text-warm-600 hover:text-warm-900 border border-warm-300/60 hover:border-warm-400 rounded-lg hover:shadow-card hover:-translate-y-px transition-all duration-200"
            >
              Comp Compare
            </Link>
            <a
              href="/api/export?format=csv"
              className="px-3 py-1.5 text-xs font-medium text-warm-600 hover:text-warm-900 border border-warm-300/60 hover:border-warm-400 rounded-lg hover:shadow-card hover:-translate-y-px transition-all duration-200"
            >
              Export
            </a>
            <Link
              href="/profile"
              className="px-3 py-1.5 text-xs font-medium text-warm-600 hover:text-warm-900 border border-warm-300/60 hover:border-warm-400 rounded-lg hover:shadow-card hover:-translate-y-px transition-all duration-200"
            >
              Profile
            </Link>
          </div>
          <span className="text-xs sm:text-sm text-warm-700 truncate max-w-[80px] sm:max-w-none">{session.user?.name}</span>
          <LogoutButton />
        </div>
      </header>

      {/* Mobile nav links */}
      <div className="sm:hidden flex items-center gap-2 px-4 py-2 border-b border-warm-300/40 bg-warm-50/60 overflow-x-auto">
        <Link href="/dashboard/comp" className="px-2.5 py-1 text-[10px] font-medium text-warm-600 border border-warm-300/60 rounded-lg whitespace-nowrap">
          Comp Compare
        </Link>
        <a href="/api/export?format=csv" className="px-2.5 py-1 text-[10px] font-medium text-warm-600 border border-warm-300/60 rounded-lg whitespace-nowrap">
          Export
        </a>
        <Link href="/profile" className="px-2.5 py-1 text-[10px] font-medium text-warm-600 border border-warm-300/60 rounded-lg whitespace-nowrap">
          Profile
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Main content — Kanban */}
        <main className="flex-1 p-4 sm:p-6 overflow-x-auto animate-fade-in-up">
          <KanbanBoard opportunities={opportunities} />
        </main>

        {/* Right sidebar — collapses below on mobile */}
        <aside className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-warm-300/60 p-4 sm:p-5 space-y-6 shrink-0 bg-warm-50/80 backdrop-blur-sm animate-slide-in-right">
          {/* Upcoming Interviews */}
          <div>
            <h2 className="text-xs font-medium text-warm-600 uppercase tracking-wider mb-3">
              Upcoming Interviews
            </h2>
            {upcomingInterviews.length === 0 ? (
              <p className="text-sm text-warm-500">No interviews scheduled.</p>
            ) : (
              <div className="space-y-2">
                {upcomingInterviews.map((interview: any) => (
                  <div
                    key={interview.id}
                    className="bg-white/80 border border-warm-300/60 rounded-lg p-3 shadow-card hover:shadow-card-hover"
                  >
                    <p className="text-sm text-warm-900 font-medium">
                      {interview.opportunity.company}
                    </p>
                    <p className="text-xs text-warm-600">{interview.round}</p>
                    {interview.dateTime && (
                      <p className="text-xs text-terra-light mt-1">
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
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Overdue Follow-ups */}
          {overdueFollowups.length > 0 && (
            <div>
              <h2 className="text-xs font-medium text-terra uppercase tracking-wider mb-3">
                Needs Follow-up
              </h2>
              <div className="space-y-2">
                {overdueFollowups.map((item: any) => (
                  <Link
                    key={item.id}
                    href={`/opportunities/${item.id}`}
                    className="block bg-terra/5 border border-terra/15 rounded-lg p-3 hover:bg-terra/10 transition-colors"
                  >
                    <p className="text-sm text-warm-900 font-medium">{item.company}</p>
                    <p className="text-xs text-warm-600">{item.role}</p>
                    <p className="text-xs text-terra mt-1">
                      {item.daysSinceActivity} days since last activity
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div>
            <h2 className="text-xs font-medium text-warm-600 uppercase tracking-wider mb-3">
              Recent Activity
            </h2>
            <div className="space-y-2">
              {recentActivity.map((activity: any) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-2 text-xs"
                >
                  <span className="text-warm-500 shrink-0 w-14">
                    {new Date(activity.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <div>
                    <span className="text-warm-800">
                      {activity.description}
                    </span>
                    {activity.opportunity && (
                      <span className="text-warm-500 block">
                        {activity.opportunity.company} — {activity.opportunity.role}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
