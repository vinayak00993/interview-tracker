import { NextResponse } from "next/server";
import { withAuth, parseJson, jsonError } from "@/lib/api";
import { aiPrepSchema } from "@/lib/validation";
import { getOpportunity } from "@/lib/data/opportunities";
import { getProfile, hasProfileContent } from "@/lib/data/profile";
import { listPreps, savePrep } from "@/lib/data/prep";
import { prisma } from "@/lib/prisma";
import { nowIso } from "@/lib/time";
import { fetchJobPosting } from "@/lib/jd";
import { buildPrepContext, generatePrepSheet, describeAiError, PREP_PROMPT_VERSION } from "@/lib/ai";

/**
 * Generates and persists a structured prep sheet for an opportunity, and
 * optionally for one specific interview round.
 */
export const POST = withAuth(async (req, _ctx, userId) => {
  const parsed = await parseJson(req, aiPrepSchema);
  if (!parsed.ok) return parsed.response;
  const { opportunityId, interviewId } = parsed.data;

  const [opportunity, profile, priorPreps] = await Promise.all([
    getOpportunity(opportunityId, userId),
    getProfile(userId),
    listPreps(opportunityId, userId),
  ]);
  if (!opportunity) return jsonError("Opportunity not found", 404);
  if (!hasProfileContent(profile) || !profile) {
    return jsonError("Set up your profile first. Upload your resume or paste your LinkedIn about section.", 400);
  }
  if (interviewId && !opportunity.interviews.some((i) => i.id === interviewId)) {
    return jsonError("Interview not found", 404);
  }

  // Cache the job description text the first time we need it.
  let jdText = opportunity.jdText;
  if (!jdText && opportunity.jdLink) {
    try {
      const posting = await fetchJobPosting(opportunity.jdLink);
      jdText = posting.jdText || null;
      if (jdText) {
        await prisma.opportunity.update({ where: { id: opportunityId }, data: { jdText, updatedAt: nowIso() } });
      }
    } catch {
      // The prep still works without the JD text.
    }
  }

  try {
    const context = buildPrepContext({ opportunity, profile, jdText, targetInterviewId: interviewId ?? null, priorPreps });
    const generated = await generatePrepSheet(context);
    const saved = await savePrep({
      opportunityId,
      interviewId: interviewId ?? null,
      content: JSON.stringify(generated.sheet),
      model: generated.model,
      promptVersion: PREP_PROMPT_VERSION,
      inputTokens: generated.inputTokens,
      outputTokens: generated.outputTokens,
    });
    return NextResponse.json({ prep: saved, sheet: generated.sheet });
  } catch (error) {
    const { message, status } = describeAiError(error);
    console.error("[api] ai-prep failed:", error);
    return jsonError(message, status);
  }
});
