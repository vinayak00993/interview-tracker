import { NextResponse } from "next/server";
import { withAuth, jsonError } from "@/lib/api";
import { markFollowUpSent } from "@/lib/data/prep";

type Ctx = { params: { id: string } };

export const POST = withAuth<Ctx>(async (_req, { params }, userId) => {
  const draft = await markFollowUpSent(params.id, userId);
  if (!draft) return jsonError("Not found", 404);
  return NextResponse.json(draft);
});
