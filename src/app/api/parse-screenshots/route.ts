import { NextResponse } from "next/server";
import { withAuth, jsonError } from "@/lib/api";
import { extractFromScreenshots, describeAiError } from "@/lib/ai";

const MAX_FILES = 6;
const MAX_BYTES = 8 * 1024 * 1024;

export const POST = withAuth(async (req) => {
  const form = await req.formData();
  const files = form.getAll("screenshots").filter((f): f is File => f instanceof File);
  if (!files.length) return jsonError("No screenshots provided", 400);
  if (files.length > MAX_FILES) return jsonError(`Up to ${MAX_FILES} screenshots at a time`, 400);

  const images: { data: string; type: string }[] = [];
  for (const file of files) {
    if (!file.type.startsWith("image/")) return jsonError("Only image files are accepted", 400);
    if (file.size > MAX_BYTES) return jsonError("Each screenshot must be under 8 MB", 400);
    images.push({ data: Buffer.from(await file.arrayBuffer()).toString("base64"), type: file.type });
  }

  try {
    const extracted = await extractFromScreenshots(images);
    return NextResponse.json({
      company: extracted.company ?? undefined,
      role: extracted.role?.slice(0, 200) ?? undefined,
      location: extracted.location ?? undefined,
      website: extracted.website ?? undefined,
      remote: extracted.remote ?? undefined,
      compMin: extracted.compMin && extracted.compMin > 0 ? Math.round(extracted.compMin) : undefined,
      compMax: extracted.compMax && extracted.compMax > 0 ? Math.round(extracted.compMax) : undefined,
      jdText: extracted.rawText.slice(0, 12000),
    });
  } catch (error) {
    const { message, status } = describeAiError(error);
    console.error("[api] parse-screenshots failed:", error);
    return jsonError(message, status);
  }
});
