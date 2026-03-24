import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { findOpportunities } from "@/lib/db";
import CompComparison from "./CompComparison";

export default async function CompPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = (session.user as any).id;
  const opportunities = await findOpportunities(userId);

  return <CompComparison opportunities={opportunities} />;
}
