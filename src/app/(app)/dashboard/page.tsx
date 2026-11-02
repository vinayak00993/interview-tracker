import type { Metadata } from "next";
import { requireUserId } from "@/lib/session";
import { listOpportunities, findFollowUps } from "@/lib/data/opportunities";
import { listUpcomingInterviews } from "@/lib/data/interviews";
import { listRecentActivities } from "@/lib/data/activities";
import { PipelineBoard } from "@/components/pipeline/PipelineBoard";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

export const metadata: Metadata = { title: "Pipeline" };

export default async function DashboardPage() {
  const userId = await requireUserId();
  const [opportunities, upcoming, recent, followUps] = await Promise.all([
    listOpportunities(userId),
    listUpcomingInterviews(userId, 5),
    listRecentActivities(userId, 10),
    findFollowUps(userId),
  ]);

  return (
    <div className="flex flex-col lg:flex-row">
      <main className="flex-1 min-w-0 px-4 sm:px-8 lg:px-12 py-6 sm:py-8 animate-fade-in-up">
        <PipelineBoard opportunities={opportunities} />
      </main>
      <DashboardSidebar upcoming={upcoming} recent={recent} followUps={followUps} stats={{ total: opportunities.length, interviewing: opportunities.filter((o) => o.status === "interviewing").length, offers: opportunities.filter((o) => o.status === "offer").length }} />
    </div>
  );
}
