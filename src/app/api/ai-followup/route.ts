import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { withAuth, parseJson, jsonError } from "@/lib/api";
import { aiFollowUpSchema } from "@/lib/validation";
import { getInterview } from "@/lib/data/interviews";
import { getProfile } from "@/lib/data/profile";
import { saveFollowUp } from "@/lib/data/prep";
import { buildFollowUpPrompt, streamFollowUp, splitFollowUp, ndjsonResponse, describeAiError, isAiConfigured, refusalExplanation } from "@/lib/ai";

/** Streams a follow-up email draft and saves it when complete. */
export const POST = withAuth(async (req, _ctx, userId) => {
  if (!isAiConfigured()) return jsonError("AI features are not configured.", 503);
  const parsed = await parseJson(req, aiFollowUpSchema);
  if (!parsed.ok) return parsed.response;

  const [interview, profile, session] = await Promise.all([
    getInterview(parsed.data.interviewId, userId),
    getProfile(userId),
    getServerSession(authOptions),
  ]);
  if (!interview) return jsonError("Interview not found", 404);

  const prompt = buildFollowUpPrompt(interview, profile, session?.user?.name || "the candidate");
  return ndjsonResponse(async (emit) => {
    try {
      const { stream, model } = streamFollowUp(prompt);
      let text = "";
      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          text += event.delta.text;
          emit({ type: "delta", text: event.delta.text });
        }
      }
      const final = await stream.finalMessage();
      if (final.stop_reason === "refusal") {
        emit({ type: "error", message: refusalExplanation(final) || "The model declined this request." });
        return;
      }
      const { subject, body } = splitFollowUp(text);
      const draft = await saveFollowUp({ interviewId: interview.id, subject, body, model });
      emit({ type: "done", draft });
    } catch (error) {
      console.error("[api] ai-followup failed:", error);
      emit({ type: "error", message: describeAiError(error).message });
    }
  });
});
