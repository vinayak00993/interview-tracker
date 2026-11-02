import { NextResponse } from "next/server";
import { withAuth, parseJson, jsonError } from "@/lib/api";
import { logActivity, listRecentActivities } from "@/lib/data/activities";
import { ownsOpportunity } from "@/lib/data/opportunities";
import { activityCreateSchema } from "@/lib/validation";

export const GET = withAuth(async (req, _ctx, userId) => {
  const limit = Math.min(100, Number(new URL(req.url).searchParams.get("limit") ?? 20) || 20);
  return NextResponse.json(await listRecentActivities(userId, limit));
});

export const POST = withAuth(async (req, _ctx, userId) => {
  const parsed = await parseJson(req, activityCreateSchema);
  if (!parsed.ok) return parsed.response;
  if (parsed.data.opportunityId && !(await ownsOpportunity(parsed.data.opportunityId, userId))) {
    return jsonError("Opportunity not found", 404);
  }
  return NextResponse.json(await logActivity(userId, parsed.data), { status: 201 });
});
