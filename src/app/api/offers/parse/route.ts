import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";
import mammoth from "mammoth";

/**
 * POST /api/offers/parse
 *
 * Accepts either:
 *   - JSON: { text: string, opportunityId: string }  — pasted email/text
 *   - multipart: file (pdf/docx/txt/image) + opportunityId
 *
 * Extracts structured offer fields via Claude Haiku (4.5) and returns
 * them. Does NOT persist — caller decides when to save.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let rawText = "";
  let sourceType = "manual";
  let imageBase64: string | null = null;
  let imageMediaType: string | null = null;
  let opportunityId = "";

  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = await req.json();
    rawText = String(body.text || "").trim();
    opportunityId = String(body.opportunityId || "");
    sourceType = "email";
  } else if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    opportunityId = String(form.get("opportunityId") || "");
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const buf = Buffer.from(await file.arrayBuffer());
    const name = file.name.toLowerCase();

    if (name.endsWith(".docx")) {
      const result = await mammoth.extractRawText({ buffer: buf });
      rawText = result.value;
      sourceType = "docx";
    } else if (name.endsWith(".txt") || name.endsWith(".md")) {
      rawText = buf.toString("utf8");
      sourceType = "txt";
    } else if (name.match(/\.(png|jpe?g|webp|gif)$/)) {
      imageBase64 = buf.toString("base64");
      imageMediaType = file.type || "image/png";
      sourceType = "image";
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Use .docx, .txt, or an image." },
        { status: 400 }
      );
    }
  }

  if (!opportunityId) {
    return NextResponse.json({ error: "opportunityId required" }, { status: 400 });
  }
  if (!rawText && !imageBase64) {
    return NextResponse.json({ error: "No offer content provided" }, { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const systemPrompt = `You are a precise extraction agent. You will be given a job offer letter or email. Extract every concrete compensation and benefit detail into a STRICT JSON object matching this schema. If a value is not stated, use null. Do NOT infer or make up numbers. All dollar amounts in THOUSANDS of USD (e.g. 180 means $180,000). Return ONLY valid JSON, no prose, no code fences.

{
  "baseComp": number | null,
  "signOnBonus": number | null,
  "annualBonus": number | null,
  "bonusPercent": number | null,
  "equityType": "RSU" | "ISO" | "NSO" | "options" | "none" | null,
  "equityValue": number | null,
  "equityShares": number | null,
  "vestYears": number | null,
  "vestCliff": number | null,
  "vestSchedule": string | null,
  "ptoDays": number | null,
  "healthcare": string | null,
  "remotePolicy": string | null,
  "startDate": string | null,
  "expiryDate": string | null,
  "location": string | null,
  "title": string | null,
  "level": string | null,
  "benefits": string | null,
  "aiSummary": string
}

"aiSummary" is a 1-2 sentence plain-English summary of the offer highlights.`;

  const userContent: Anthropic.ContentBlockParam[] = [];
  if (imageBase64 && imageMediaType) {
    userContent.push({
      type: "image",
      source: {
        type: "base64",
        media_type: imageMediaType as "image/png" | "image/jpeg" | "image/webp" | "image/gif",
        data: imageBase64,
      },
    });
    userContent.push({ type: "text", text: "Extract offer details from this image." });
  } else {
    userContent.push({ type: "text", text: rawText });
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    // Strip code fences if the model added them
    const cleaned = text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    return NextResponse.json({
      ...parsed,
      rawText: rawText || "(image)",
      sourceType,
      opportunityId,
    });
  } catch (err) {
    console.error("[offers/parse] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Parse failed" },
      { status: 500 }
    );
  }
}
