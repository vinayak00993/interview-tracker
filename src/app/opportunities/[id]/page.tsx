import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { findOpportunityById } from "@/lib/db";
import OpportunityDetail from "./OpportunityDetail";

interface Props {
  params: { id: string };
}

export default async function OpportunityPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = (session.user as any).id;
  const opportunity = await findOpportunityById(params.id, userId);

  if (!opportunity) notFound();

  return <OpportunityDetail opportunity={opportunity} />;
}
