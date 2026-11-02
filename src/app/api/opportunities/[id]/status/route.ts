import { NextResponse } from "next/server";
import { withAuth, parseJson, jsonError } from "@/lib/api";
import { updateOpportunityStatus } from "@/lib/data/opportunities";
import { statusChangeSchema } from "@/lib/validation";

type Ctx = { params: { id: string } };

export const PATCH = withAuth<Ctx>(async (req, { params }, userId) => {
  const parsed = await parseJson(req, statusChangeSchema);
  if (!parsed.ok) return parsed.response;
  const updated = await updateOpportunityStatus(params.id, userId, parsed.data.status);
  if (!updated) return jsonError("Not found", 404);
  return NextResponse.json(updated);
});
