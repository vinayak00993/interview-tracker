/** Job posting extraction from screenshots, fast tier. */
import { z } from "zod";
import type Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropic, modelFor, AiRefusedError } from "./client";
import { refusalExplanation } from "./client";

export const ScreenshotExtractionSchema = z.object({
  company: z.string().nullable(),
  role: z.string().nullable(),
  location: z.string().nullable(),
  remote: z.boolean().nullable().describe("True if the posting mentions remote, hybrid, or work from home"),
  compMin: z.number().nullable().describe("Minimum compensation in thousands USD, only if explicitly stated"),
  compMax: z.number().nullable().describe("Maximum compensation in thousands USD, only if explicitly stated"),
  website: z.string().nullable().describe("Company website if visible"),
  rawText: z.string().describe("All visible text from the screenshots, in reading order"),
});
export type ScreenshotExtraction = z.infer<typeof ScreenshotExtractionSchema>;

type MediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

function toMediaType(type: string): MediaType {
  if (type === "image/jpeg" || type === "image/jpg") return "image/jpeg";
  if (type === "image/gif") return "image/gif";
  if (type === "image/webp") return "image/webp";
  return "image/png";
}

export async function extractFromScreenshots(images: { data: string; type: string }[]): Promise<ScreenshotExtraction> {
  const client = getAnthropic();
  const blocks: Anthropic.ContentBlockParam[] = images.map((img) => ({
    type: "image",
    source: { type: "base64", media_type: toMediaType(img.type), data: img.data },
  }));
  blocks.push({
    type: "text",
    text: "These are screenshots of a job posting. Extract the posting details. Convert any salary to thousands of USD (e.g. $150,000 becomes 150). Only include compensation when numbers are explicitly shown.",
  });
  const response = await client.messages.parse({
    model: modelFor("fast"),
    max_tokens: 4096,
    output_config: { format: zodOutputFormat(ScreenshotExtractionSchema), effort: "low" },
    messages: [{ role: "user", content: blocks }],
  });
  if (response.stop_reason === "refusal") throw new AiRefusedError(refusalExplanation(response));
  if (!response.parsed_output) throw new Error("Could not read the screenshots.");
  return response.parsed_output;
}
