import { NextResponse } from "next/server";
import { withAuth, parseJson, jsonError } from "@/lib/api";
import { createInterview } from "@/lib/data/interviews";
import { interviewCreateSchema } from "@/lib/validation";

export const POST = withAuth(async (req, _ctx, userId) => {
  const parsed = await parseJson(req, interviewCreateSchema);
  if (!parsed.ok) return parsed.response;
  const interview = await createInterview(userId, parsed.data);
  if (!interview) return jsonError("Opportunity not found", 404);
  return NextResponse.json(interview, { status: 201 });
});
