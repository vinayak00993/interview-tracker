import { NextResponse } from "next/server";
import { withAuth, parseJson, jsonError } from "@/lib/api";
import { setFollowUp } from "@/lib/data/opportunities";
import { followUpSchema } from "@/lib/validation";

type Ctx = { params: { id: string } };

export const PATCH = withAuth<Ctx>(async (req, { params }, userId) => {
  const parsed = await parseJson(req, followUpSchema);
  if (!parsed.ok) return parsed.response;
  const updated = await setFollowUp(params.id, userId, parsed.data.followUpAt ?? null);
  if (!updated) return jsonError("Not found", 404);
  return NextResponse.json(updated);
});
