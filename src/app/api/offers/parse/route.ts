import { NextResponse } from "next/server";
import mammoth from "mammoth";
import { withAuth, jsonError } from "@/lib/api";
import { ownsOpportunity } from "@/lib/data/opportunities";
import { extractOffer, describeAiError } from "@/lib/ai";

const MAX_UPLOAD = 10 * 1024 * 1024;

/**
 * Extracts structured offer fields from pasted text (JSON {text, opportunityId})
 * or an uploaded file (multipart: file + opportunityId). Does not persist.
 */
export const POST = withAuth(async (req, _ctx, userId) => {
  let rawText = "";
  let sourceType = "manual";
  let image: { data: string; mediaType: string } | null = null;
  let opportunityId = "";

  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const body = (await req.json()) as { text?: string; opportunityId?: string };
    rawText = String(body.text || "").trim();
    opportunityId = String(body.opportunityId || "");
    sourceType = "email";
  } else if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    opportunityId = String(form.get("opportunityId") || "");
    const file = form.get("file");
    if (!(file instanceof File)) return jsonError("No file uploaded", 400);
    if (file.size > MAX_UPLOAD) return jsonError("File is too large (10 MB max)", 400);
    const buf = Buffer.from(await file.arrayBuffer());
    const name = file.name.toLowerCase();
    if (name.endsWith(".docx")) {
      rawText = (await mammoth.extractRawText({ buffer: buf })).value;
      sourceType = "docx";
    } else if (name.endsWith(".txt") || name.endsWith(".md")) {
      rawText = buf.toString("utf8");
      sourceType = "txt";
    } else if (/\.(png|jpe?g|webp|gif)$/.test(name)) {
      image = { data: buf.toString("base64"), mediaType: file.type || "image/png" };
      sourceType = "image";
    } else {
      return jsonError("Unsupported file type. Use .docx, .txt, or an image.", 400);
    }
  } else {
    return jsonError("Unsupported content type", 415);
  }

  if (!opportunityId) return jsonError("opportunityId is required", 400);
  if (!(await ownsOpportunity(opportunityId, userId))) return jsonError("Opportunity not found", 404);
  if (!rawText && !image) return jsonError("No offer content provided", 400);

  try {
    const extracted = await extractOffer(image ? { image } : { text: rawText.slice(0, 50000) });
    return NextResponse.json({ ...extracted, rawText: rawText || "(image)", sourceType, opportunityId });
  } catch (error) {
    const { message, status } = describeAiError(error);
    console.error("[api] offers/parse failed:", error);
    return jsonError(message, status);
  }
});
