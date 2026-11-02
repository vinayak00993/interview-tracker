import { withAuth, jsonError } from "@/lib/api";
import { listOffers } from "@/lib/data/offers";
import { getProfile } from "@/lib/data/profile";
import { buildAdvisorPrompt, streamAdvisor, ndjsonResponse, describeAiError, isAiConfigured, refusalExplanation } from "@/lib/ai";

/** Streams a Markdown comparison of every offer the user has recorded. */
export const POST = withAuth(async (_req, _ctx, userId) => {
  if (!isAiConfigured()) return jsonError("AI features are not configured.", 503);
  const [offers, profile] = await Promise.all([listOffers(userId), getProfile(userId)]);
  if (offers.length < 2) return jsonError("Add at least two offers to compare.", 400);

  const prompt = buildAdvisorPrompt(offers, profile);
  return ndjsonResponse(async (emit) => {
    try {
      const { stream, model } = streamAdvisor(prompt);
      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          emit({ type: "delta", text: event.delta.text });
        }
      }
      const final = await stream.finalMessage();
      if (final.stop_reason === "refusal") {
        emit({ type: "error", message: refusalExplanation(final) || "The model declined this request." });
        return;
      }
      emit({ type: "done", model });
    } catch (error) {
      console.error("[api] offers/advise failed:", error);
      emit({ type: "error", message: describeAiError(error).message });
    }
  });
});
