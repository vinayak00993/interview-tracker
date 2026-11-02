import { NextResponse } from "next/server";
import { withAuth, parseJson, jsonError } from "@/lib/api";
import { parseJdSchema } from "@/lib/validation";
import { fetchJobPosting } from "@/lib/jd";
import { UnsafeUrlError } from "@/lib/safe-fetch";

export const POST = withAuth(async (req) => {
  const parsed = await parseJson(req, parseJdSchema);
  if (!parsed.ok) return parsed.response;
  try {
    const posting = await fetchJobPosting(parsed.data.url);
    return NextResponse.json(posting);
  } catch (error) {
    if (error instanceof UnsafeUrlError) return jsonError(error.message, 400);
    return jsonError(error instanceof Error ? error.message : "Could not read that page", 400);
  }
});
