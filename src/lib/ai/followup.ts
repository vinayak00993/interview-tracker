/**
 * Follow-up email drafts, streamed token by token so the user can watch it
 * form, then persisted when the stream finishes.
 */
import { getAnthropic, modelFor, STYLE_RULES } from "./client";
import type { InterviewWithContext } from "@/lib/data/interviews";
import type { UserProfile } from "@prisma/client";

const SYSTEM_PROMPT = `You write follow-up emails after job interviews on behalf of the candidate. The email must sound like a real person wrote it, never like a template.

Return exactly this format and nothing else:
SUBJECT: <subject line>
---
<email body, starting with the greeting, ready to send>

Rules:
- Thank the interviewer by name when known.
- Reference one or two specific things that were actually discussed, taken from the debrief notes. If there are no notes, keep it short and do not invent topics.
- Reinforce fit in one sentence, tied to something concrete from the candidate's background.
- Under 180 words.
- ${STYLE_RULES}`;

export function buildFollowUpPrompt(interview: InterviewWithContext, profile: UserProfile | null, candidateName: string): string {
  const opp = interview.opportunity;
  return [
    `Candidate name: ${candidateName}`,
    `Company: ${opp.company}`,
    `Role: ${opp.role}`,
    `Interview round: ${interview.round}`,
    interview.interviewerName ? `Interviewer: ${interview.interviewerName}${interview.interviewerTitle ? ` (${interview.interviewerTitle})` : ""}` : "",
    interview.debriefNotes ? `\nWhat was discussed (debrief notes):\n${interview.debriefNotes}` : "",
    interview.questionsAsked ? `\nQuestions they asked:\n${interview.questionsAsked}` : "",
    interview.nextSteps ? `\nNext steps they mentioned: ${interview.nextSteps}` : "",
    profile?.resumeText ? `\nCandidate background (excerpt):\n${profile.resumeText.slice(0, 1500)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function splitFollowUp(text: string): { subject: string; body: string } {
  const parts = text.split(/\n---\n?/);
  let subject = "Thank you for the conversation";
  let body = text.trim();
  if (parts.length >= 2) {
    const m = parts[0].match(/SUBJECT:\s*(.+)/i);
    if (m) subject = m[1].trim();
    body = parts.slice(1).join("\n---\n").trim();
  }
  return { subject, body };
}

/** Streams the raw draft text. Caller splits it with splitFollowUp when done. */
export function streamFollowUp(prompt: string) {
  const client = getAnthropic();
  const model = modelFor("standard");
  const stream = client.messages.stream({
    model,
    max_tokens: 2048,
    output_config: { effort: "low" },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });
  return { stream, model };
}
