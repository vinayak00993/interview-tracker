/**
 * Offer letter extraction (fast tier) and the offer advisor (deep tier).
 */
import { z } from "zod";
import type Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropic, modelFor, STYLE_RULES, AiRefusedError } from "./client";
import { refusalExplanation } from "./client";
import type { OfferWithOpportunity } from "@/lib/data/offers";
import type { UserProfile } from "@prisma/client";

export const OfferExtractionSchema = z.object({
  baseComp: z.number().nullable().describe("Annual base in thousands USD, e.g. 180 for $180,000"),
  signOnBonus: z.number().nullable().describe("One-time sign-on in thousands USD"),
  annualBonus: z.number().nullable().describe("Target annual bonus in thousands USD"),
  bonusPercent: z.number().nullable().describe("Target bonus as percent of base"),
  equityType: z.enum(["RSU", "ISO", "NSO", "options", "none"]).nullable(),
  equityValue: z.number().nullable().describe("Total grant value in thousands USD"),
  equityShares: z.number().nullable(),
  vestYears: z.number().nullable(),
  vestCliff: z.number().nullable().describe("Cliff in months"),
  vestSchedule: z.string().nullable(),
  ptoDays: z.number().nullable().describe("Annual PTO days, or -1 for unlimited"),
  healthcare: z.string().nullable(),
  remotePolicy: z.string().nullable(),
  startDate: z.string().nullable(),
  expiryDate: z.string().nullable(),
  location: z.string().nullable(),
  title: z.string().nullable(),
  level: z.string().nullable(),
  benefits: z.string().nullable(),
  aiSummary: z.string().describe("One or two plain sentences summarizing the offer highlights"),
});
export type OfferExtraction = z.infer<typeof OfferExtractionSchema>;

const EXTRACT_SYSTEM = `You extract compensation and benefit details from job offer letters and emails. Use only what the document states. If a value is not stated, return null. Never infer or estimate numbers. All dollar amounts are in thousands of USD (180 means $180,000). ${STYLE_RULES}`;

export async function extractOffer(input: { text?: string; image?: { data: string; mediaType: string } }): Promise<OfferExtraction> {
  const client = getAnthropic();
  const content: Anthropic.ContentBlockParam[] = [];
  if (input.image) {
    content.push({
      type: "image",
      source: { type: "base64", media_type: input.image.mediaType as "image/png" | "image/jpeg" | "image/webp" | "image/gif", data: input.image.data },
    });
    content.push({ type: "text", text: "Extract the offer details from this image." });
  } else {
    content.push({ type: "text", text: input.text ?? "" });
  }
  const response = await client.messages.parse({
    model: modelFor("fast"),
    max_tokens: 4096,
    output_config: { format: zodOutputFormat(OfferExtractionSchema), effort: "low" },
    system: EXTRACT_SYSTEM,
    messages: [{ role: "user", content }],
  });
  if (response.stop_reason === "refusal") throw new AiRefusedError(refusalExplanation(response));
  if (!response.parsed_output) throw new Error("Could not read the offer. Try pasting the text instead.");
  return response.parsed_output;
}

const ADVISOR_SYSTEM = `You are a senior career advisor helping a candidate choose between job offers. You reason clearly about compensation structure, career growth, risk, and fit. Use only the numbers provided; never invent any. Be direct and practical. ${STYLE_RULES}

Produce Markdown with these sections:

## TL;DR
One or two sentences on which offer is strongest overall and why, acknowledging uncertainty.

## Compensation comparison
A table of estimated annualized comp (base + bonus + equity per year) with the inputs shown.

## Where each offer wins
Short bullets per offer.

## Where each offer loses
Short bullets per offer, including missing information.

## Questions to ask before deciding
Three to five concrete questions.

## Negotiation levers
Specific asks with a realistic chance of success given these competing offers.

## Final recommendation
One clear take. If the numbers are close, say so rather than forcing a winner.`;

export function buildAdvisorPrompt(offers: OfferWithOpportunity[], profile: UserProfile | null): string {
  const summary = offers
    .map((o, i) => {
      const bonus = o.annualBonus ?? (o.bonusPercent && o.baseComp ? Math.round((o.baseComp * o.bonusPercent) / 100) : 0);
      const equityPerYear = o.equityValue && o.vestYears ? Math.round(o.equityValue / o.vestYears) : 0;
      const total = (o.baseComp ?? 0) + (bonus ?? 0) + equityPerYear;
      return `## Offer ${i + 1}: ${o.company}, ${o.title || o.role}
- Base: ${o.baseComp ? `$${o.baseComp}K` : "not stated"}
- Annual bonus: ${o.annualBonus ? `$${o.annualBonus}K` : o.bonusPercent ? `${o.bonusPercent}% of base` : "not stated"}
- Sign-on: ${o.signOnBonus ? `$${o.signOnBonus}K` : "none"}
- Equity: ${o.equityType || "unknown type"}, ${o.equityValue ? `$${o.equityValue}K` : "value not stated"} over ${o.vestYears ?? "?"} years${o.vestCliff ? `, ${o.vestCliff} month cliff` : ""}
- Estimated annualized comp: about $${total}K
- Level / title: ${o.level || "?"} / ${o.title || o.role}
- Location / remote: ${o.location || "?"} / ${o.remotePolicy || "?"}
- PTO: ${o.ptoDays === -1 ? "unlimited" : o.ptoDays ? `${o.ptoDays} days` : "?"}
- Benefits: ${o.benefits || "not specified"}
- Start: ${o.startDate || "flexible"}. Expires: ${o.expiryDate || "?"}`;
    })
    .join("\n\n");

  return `Candidate background:
${profile?.resumeText ? profile.resumeText.slice(0, 6000) : "(resume not provided)"}

${profile?.linkedInAbout ? `LinkedIn summary:\n${profile.linkedInAbout}\n` : ""}
Offers:
${summary}

Compare these offers and make a recommendation.`;
}

export function streamAdvisor(prompt: string) {
  const client = getAnthropic();
  const model = modelFor("deep");
  const stream = client.messages.stream({
    model,
    max_tokens: 16000,
    output_config: { effort: "high" },
    system: ADVISOR_SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });
  return { stream, model };
}
