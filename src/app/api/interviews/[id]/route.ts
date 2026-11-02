import { NextResponse } from "next/server";
import { withAuth, parseJson, jsonError } from "@/lib/api";
import { getInterview, updateInterview, deleteInterview } from "@/lib/data/interviews";
import { interviewUpdateSchema } from "@/lib/validation";

type Ctx = { params: { id: string } };

export const GET = withAuth<Ctx>(async (_req, { params }, userId) => {
  const interview = await getInterview(params.id, userId);
  if (!interview) return jsonError("Not found", 404);
  return NextResponse.json(interview);
});

export const PUT = withAuth<Ctx>(async (req, { params }, userId) => {
  const parsed = await parseJson(req, interviewUpdateSchema);
  if (!parsed.ok) return parsed.response;
  const updated = await updateInterview(params.id, userId, parsed.data);
  if (!updated) return jsonError("Not found", 404);
  return NextResponse.json(updated);
});

export const DELETE = withAuth<Ctx>(async (_req, { params }, userId) => {
  const ok = await deleteInterview(params.id, userId);
  if (!ok) return jsonError("Not found", 404);
  return NextResponse.json({ ok: true });
});
