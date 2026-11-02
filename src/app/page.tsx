import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PublicShell } from "@/components/marketing/PublicShell";
import { Hero, BoardFrame, Features, HowItWorks, FaqTeaser, FinalCta } from "@/components/marketing/LandingSections";
import { PipelineBoard } from "@/components/pipeline/PipelineBoard";
import { DEMO_OPPORTUNITIES } from "@/lib/demo-data";

export const metadata: Metadata = {
  title: "Interview Tracker · Prep smarter, debrief faster, land the role",
  description: "Track every opportunity in one pipeline, generate prep for each interview round from your resume and your own debriefs, and compare offers on what they actually pay.",
};

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session?.user) redirect("/dashboard");

  return (
    <PublicShell>
      <Hero />
      <BoardFrame>
        <PipelineBoard opportunities={DEMO_OPPORTUNITIES} readOnly />
      </BoardFrame>
      <Features />
      <HowItWorks />
      <FaqTeaser />
      <FinalCta />
    </PublicShell>
  );
}
