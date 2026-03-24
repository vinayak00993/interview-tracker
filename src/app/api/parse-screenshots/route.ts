import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

const EXTRACTION_PROMPT = `You are extracting job posting details from a screenshot. Analyze the image and extract all visible text and job-related information.

Return a JSON object with these fields (use null for any field you cannot determine):
{
  "company": "Company name",
  "role": "Job title / role name",
  "location": "City, State or location listed",
  "remote": true/false (whether the role mentions remote/hybrid/WFH),
  "compMin": number (minimum compensation in thousands, e.g. 150 for $150k),
  "compMax": number (maximum compensation in thousands, e.g. 200 for $200k),
  "rawText": "All visible text extracted from the screenshot"
}

Rules:
- For compensation, convert to thousands (e.g. $150,000 = 150, $200K = 200)
- Only include compensation if explicitly stated with numbers
- Extract ALL visible text into rawText
- Return ONLY the JSON object, no markdown fences or other text`;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
    }

    const formData = await req.formData();
    const files = formData.getAll("screenshots") as File[];

    if (!files.length) {
      return NextResponse.json({ error: "No screenshots provided" }, { status: 400 });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // Build image content blocks for all screenshots
    const imageBlocks: Anthropic.ImageBlockParam[] = [];
    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64Data = buffer.toString("base64");

      // Map common image MIME types to the allowed media types
      let mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" = "image/png";
      if (file.type === "image/jpeg" || file.type === "image/jpg") {
        mediaType = "image/jpeg";
      } else if (file.type === "image/png") {
        mediaType = "image/png";
      } else if (file.type === "image/gif") {
        mediaType = "image/gif";
      } else if (file.type === "image/webp") {
        mediaType = "image/webp";
      }

      imageBlocks.push({
        type: "image",
        source: {
          type: "base64",
          media_type: mediaType,
          data: base64Data,
        },
      });
    }

    // Send all images in a single request with the extraction prompt
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [
            ...imageBlocks,
            { type: "text", text: EXTRACTION_PROMPT },
          ],
        },
      ],
    });

    // Extract the text response
    const responseText = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    // Parse the JSON response from Claude
    let parsed: Record<string, any>;
    try {
      // Strip markdown code fences if present
      const cleaned = responseText.replace(/^```(?:json)?\s*\n?/m, "").replace(/\n?```\s*$/m, "");
      parsed = JSON.parse(cleaned);
    } catch {
      // If JSON parsing fails, return the raw text as-is
      return NextResponse.json({ rawText: responseText.substring(0, 3000) });
    }

    // Build the result with the expected shape
    const result: Record<string, any> = {};

    if (parsed.company) result.company = String(parsed.company);
    if (parsed.role) result.role = String(parsed.role).substring(0, 100);
    if (parsed.location) result.location = String(parsed.location);
    if (parsed.remote === true) result.remote = true;
    if (parsed.compMin && typeof parsed.compMin === "number" && parsed.compMin > 0) {
      result.compMin = parsed.compMin;
    }
    if (parsed.compMax && typeof parsed.compMax === "number" && parsed.compMax > 0) {
      result.compMax = parsed.compMax;
    }

    const rawText = parsed.rawText ? String(parsed.rawText) : responseText;
    result.rawText = rawText.substring(0, 3000);

    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/parse-screenshots error:", error);
    return NextResponse.json({ error: "Failed to process screenshots" }, { status: 500 });
  }
}
