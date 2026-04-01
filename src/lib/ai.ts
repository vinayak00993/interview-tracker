/**
 * Tiered AI router with exponential backoff for interview-tracker.
 *
 * Tiers:
 *   - haiku  → fast, cheap (classification, short emails, tags)
 *   - sonnet → default (complex tasks, long-form prep)
 *   - opus   → explicit request only
 *
 * Prompt caching: static system prompts should be passed as `system`
 * to benefit from Anthropic's auto-cache on repeated prefixes.
 */

import Anthropic from "@anthropic-ai/sdk";

export type Tier = "haiku" | "sonnet" | "opus";

const MODELS: Record<Tier, string> = {
  haiku: "claude-haiku-4-20250514",
  sonnet: "claude-sonnet-4-20250514",
  opus: "claude-opus-4-20250514",
};

const MAX_RETRIES = 4;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 60_000;

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");
  return new Anthropic({ apiKey });
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function jitter(ms: number): number {
  // Add up to ±20% random jitter to avoid thundering herd
  return ms * (0.8 + Math.random() * 0.4);
}

export interface CallOptions {
  tier?: Tier;
  system?: string;
  messages: Anthropic.MessageParam[];
  maxTokens?: number;
}

export interface CallResult {
  text: string;
  usage: { input: number; output: number };
  tier: Tier;
  model: string;
}

/**
 * Call Anthropic with automatic exponential backoff on 429 / 529 errors.
 * Falls back one tier on persistent rate limits if tier is "sonnet" → "haiku".
 */
export async function callAI(opts: CallOptions): Promise<CallResult> {
  const tier: Tier = opts.tier ?? "sonnet";
  const client = getClient();
  let attempt = 0;
  let currentTier = tier;

  while (attempt <= MAX_RETRIES) {
    try {
      const params: Anthropic.MessageCreateParamsNonStreaming = {
        model: MODELS[currentTier],
        max_tokens: opts.maxTokens ?? 2000,
        messages: opts.messages,
      };
      if (opts.system) {
        params.system = opts.system;
      }

      const message = await client.messages.create(params);
      const content = message.content[0];
      const text = content.type === "text" ? content.text : "";

      return {
        text,
        usage: {
          input: message.usage.input_tokens,
          output: message.usage.output_tokens,
        },
        tier: currentTier,
        model: MODELS[currentTier],
      };
    } catch (err: any) {
      const status = err?.status ?? err?.statusCode ?? 0;
      const isRateLimit = status === 429 || status === 529;

      if (!isRateLimit || attempt === MAX_RETRIES) {
        throw err;
      }

      // If last attempt on sonnet, try falling back to haiku before giving up
      if (attempt === MAX_RETRIES - 1 && currentTier === "sonnet") {
        console.warn(`[ai] Sonnet rate-limited, falling back to haiku`);
        currentTier = "haiku";
      }

      const retryAfterHeader = err?.headers?.["retry-after"];
      let delay: number;
      if (retryAfterHeader) {
        delay = parseFloat(retryAfterHeader) * 1000;
      } else {
        delay = Math.min(BASE_DELAY_MS * Math.pow(2, attempt), MAX_DELAY_MS);
      }

      const delayWithJitter = jitter(delay);
      console.warn(
        `[ai] Rate limited (attempt ${attempt + 1}/${MAX_RETRIES}), retrying in ${Math.round(delayWithJitter)}ms`
      );
      await sleep(delayWithJitter);
      attempt++;
    }
  }

  throw new Error("AI call failed after max retries");
}

// ─── Convenience wrappers ────────────────────────────────────────────────────

/**
 * Quick call with Haiku — for short tasks, classification, email drafts.
 */
export function callHaiku(
  userPrompt: string,
  system?: string,
  maxTokens = 1000
): Promise<CallResult> {
  return callAI({
    tier: "haiku",
    system,
    messages: [{ role: "user", content: userPrompt }],
    maxTokens,
  });
}

/**
 * Standard call with Sonnet — for complex reasoning, long-form output.
 */
export function callSonnet(
  userPrompt: string,
  system?: string,
  maxTokens = 2000
): Promise<CallResult> {
  return callAI({
    tier: "sonnet",
    system,
    messages: [{ role: "user", content: userPrompt }],
    maxTokens,
  });
}
