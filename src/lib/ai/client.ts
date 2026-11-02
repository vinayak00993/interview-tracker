/**
 * Tiered AI router. Tier selection is always server-side.
 *
 *   fast     extraction and OCR, where speed and cost matter most
 *   standard prep sheets and follow-up drafts
 *   deep     the offer advisor, where judgment matters most
 */
import Anthropic from "@anthropic-ai/sdk";

export const AI_MODELS = {
  fast: "claude-haiku-5-5",
  standard: "claude-sonnet-5-5",
  deep: "claude-opus-5-5",
} as const;

export type AiTier = keyof typeof AI_MODELS;

export class AiNotConfiguredError extends Error {
  constructor() {
    super("AI features are not configured. Set ANTHROPIC_API_KEY.");
    this.name = "AiNotConfiguredError";
  }
}

export class AiRefusedError extends Error {
  constructor(explanation?: string | null) {
    super(explanation || "The model declined to answer this request.");
    this.name = "AiRefusedError";
  }
}

export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let cached: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new AiNotConfiguredError();
  if (!cached) cached = new Anthropic({ apiKey, maxRetries: 2 });
  return cached;
}

export function modelFor(tier: AiTier): string {
  return AI_MODELS[tier];
}

/** House style shared by every prompt. */
export const STYLE_RULES =
  "Write in plain, natural prose. Be specific and direct, no generic advice. Do not use em dashes or en dashes anywhere; use commas, periods, or hyphens instead.";

/** Maps SDK errors to a message safe to show the user. */
export function describeAiError(error: unknown): { message: string; status: number } {
  if (error instanceof AiNotConfiguredError) return { message: error.message, status: 503 };
  if (error instanceof AiRefusedError) return { message: error.message, status: 422 };
  if (error instanceof Anthropic.AuthenticationError) return { message: "The AI API key was rejected.", status: 503 };
  if (error instanceof Anthropic.RateLimitError) return { message: "The AI service is busy. Try again in a moment.", status: 429 };
  if (error instanceof Anthropic.BadRequestError) return { message: `The AI request was invalid: ${error.message}`, status: 500 };
  if (error instanceof Anthropic.APIConnectionError) return { message: "Could not reach the AI service.", status: 503 };
  if (error instanceof Anthropic.APIError) return { message: `AI service error (${error.status}).`, status: 502 };
  return { message: error instanceof Error ? error.message : "AI request failed", status: 500 };
}

/**
 * Refusal details arrived in the API after this SDK version's types, so
 * read them without relying on the typed Message shape.
 */
export function refusalExplanation(message: unknown): string | null {
  const details = (message as { stop_details?: { explanation?: string | null } | null }).stop_details;
  return details?.explanation ?? null;
}
