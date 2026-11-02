import { NextResponse } from "next/server";
import { withAuth, parseJson, jsonError } from "@/lib/api";
import { getOpportunity, updateOpportunity, deleteOpportunity } from "@/lib/data/opportunities";
import { opportunityUpdateSchema } from "@/lib/validation";

type Ctx = { params: { id: string } };

export const GET = withAuth<Ctx>(async (_req, { params }, userId) => {
  const opp = await getOpportunity(params.id, userId);
  if (!opp) return jsonError("Not found", 404);
  return NextResponse.json(opp);
});

export const PUT = withAuth<Ctx>(async (req, { params }, userId) => {
  const parsed = await parseJson(req, opportunityUpdateSchema);
  if (!parsed.ok) return parsed.response;
  const updated = await updateOpportunity(params.id, userId, parsed.data);
  if (!updated) return jsonError("Not found", 404);
  return NextResponse.json(updated);
});

export const DELETE = withAuth<Ctx>(async (_req, { params }, userId) => {
  const deleted = await deleteOpportunity(params.id, userId);
  if (!deleted) return jsonError("Not found", 404);
  return NextResponse.json({ ok: true });
});
