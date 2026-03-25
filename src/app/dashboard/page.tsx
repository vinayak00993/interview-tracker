import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { findOpportunities, findUpcomingInterviews, findRecentActivities } from "@/lib/db";
import Link from "next/link";
import KanbanBoard from "./KanbanBoard";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = (session.user as any).id;

  const opportunities = await findOpportunities(userId);
  const upcomingInterviews = await findUpcomingInterviews(userId);
  const recentActivity = await findRecentActivities(userId);

  const stats = {
    total: opportunities.length,
    interviewing: opportunities.filter((o) => o.status === "interviewing").length,
    upcoming: upcomingInterviews.length,
  };

  return (
    <div className="min-h-screen bg-warm-100">
      {/* Header */}
      <header className="border-b border-warm-300/60 px-6 py-4 flex items-center justify-between bg-warm-50/80 backdrop-blur-sm sticky top-0 z-10 animate-fade-in">
        <div>
          <h1 className="text-lg font-semibold text-warm-900 tracking-tight">
            Interview Tracker
          </h1>
          <p className="text-xs text-warm-600 mt-0.5">
            {stats.total} opportunities · {stats.interviewing} active · {stats.upcoming} upcoming
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/comp"
            className="px-3 py-1.5 text-xs font-medium text-warm-600 hover:text-warm-900 border border-warm-300/60 hover:border-warm-400 rounded-lg hover:shadow-card hover:-translate-y-px transition-all duration-200"
          >
            Comp Compare
          </Link>
          <Link
            href="/profile"
            className="px-3 py-1.5 text-xs font-medium text-warm-600 hover:text-warm-900 border border-warm-300/60 hover:border-warm-400 rounded-lg hover:shadow-card hover:-translate-y-px transition-all duration-200"
          >
            Profile
          </Link>
          <span className="text-sm text-warm-700">{session.user?.name}</span>
        </div>
      </header>

      <div className="flex">
        {/* Main content — Kanban */}
        <main className="flex-1 p-6 overflow-x-auto animate-fade-in-up">
          <KanbanBoard opportunities={opportunities} />
        </main>

        {/* Right sidebar */}
        <aside className="w-80 border-l border-warm-300/60 p-5 space-y-6 shrink-0 bg-warm-50/80 backdrop-blur-sm animate-slide-in-right">
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
