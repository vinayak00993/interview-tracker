import { NextResponse } from "next/server";
import { withAuth, parseJson } from "@/lib/api";
import { listOpportunities, createOpportunity } from "@/lib/data/opportunities";
import { opportunityCreateSchema } from "@/lib/validation";

export const GET = withAuth(async (_req, _ctx, userId) => {
  return NextResponse.json(await listOpportunities(userId));
});

export const POST = withAuth(async (req, _ctx, userId) => {
  const parsed = await parseJson(req, opportunityCreateSchema);
  if (!parsed.ok) return parsed.response;
  const created = await createOpportunity(userId, parsed.data);
  return NextResponse.json(created, { status: 201 });
});
