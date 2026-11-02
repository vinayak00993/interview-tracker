/**
 * Structured interview prep. Each sheet is generated from the candidate's
 * profile, the role, the cached job description, the specific round, and
 * everything learned in earlier rounds: debrief notes, questions that were
 * actually asked, and the gaps flagged by earlier prep sheets.
 */
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropic, modelFor, STYLE_RULES, AiRefusedError } from "./client";
import { refusalExplanation } from "./client";
import type { OpportunityDetail } from "@/lib/data/opportunities";
import type { UserProfile, InterviewPrep } from "@prisma/client";

export const PREP_PROMPT_VERSION = 2;

export const PrepSheetSchema = z.object({
  headline: z.string().describe("One sentence on how to position the candidate for this specific round"),
  talkingPoints: z
    .array(
      z.object({
        point: z.string().describe("The claim to make about the candidate"),
        evidence: z.string().describe("The specific project, company, or result from their background that backs it"),
      })
    )
    .describe("3 to 5 talking points that map the candidate's experience to what this role requires"),
  gaps: z
    .array(
      z.object({
        gap: z.string().describe("A real gap between the background and the role"),
        howToAddress: z.string().describe("How to reframe, bridge, or acknowledge it in conversation"),
        carriedFromEarlierRound: z.boolean().describe("True if this gap was flagged in an earlier round and is still open"),
      })
    )
    .describe("2 to 4 honest gaps"),
  likelyQuestions: z
    .array(
      z.object({
        question: z.string(),
        angle: z.string().describe("What the interviewer is really probing for and how to answer it"),
      })
    )
    .describe("4 to 6 questions this round is likely to ask, informed by the round type and earlier debriefs"),
  stories: z
    .array(
      z.object({
        title: z.string(),
        situation: z.string(),
        task: z.string(),
        action: z.string(),
        result: z.string(),
        useFor: z.string().describe("Which likely question or competency this story answers"),
      })
    )
    .describe("3 to 4 STAR stories from the candidate's actual experience"),
  questionsToAsk: z.array(z.string()).describe("5 to 7 questions the candidate should ask"),
  research: z.array(z.string()).describe("3 to 4 things to research before the interview"),
});

export type PrepSheet = z.infer<typeof PrepSheetSchema>;

export function parsePrepContent(prep: InterviewPrep): PrepSheet | null {
  try {
    return PrepSheetSchema.parse(JSON.parse(prep.content));
  } catch {
    return null;
  }
}

const SYSTEM_PROMPT = `You are an expert interview coach preparing a candidate for one specific interview round. You have their resume, the role, the job description, and notes from every earlier round in this process.

Rules:
- Every talking point and story must reference the candidate's actual experience. Never invent employers, titles, metrics, or projects.
- Treat earlier debriefs as ground truth about what this company cares about. If an earlier interviewer pushed on a theme, assume later rounds will too.
- If an earlier prep sheet flagged a gap and the debrief shows it was not resolved, carry it forward and mark it.
- Tailor likely questions to the round type: recruiter screens probe motivation, logistics, and comp; hiring managers probe execution and judgment; panels and technical rounds probe depth; final rounds probe culture and commitment.
- ${STYLE_RULES}`;

interface PrepContextInput {
  opportunity: OpportunityDetail;
  profile: UserProfile;
  jdText: string | null;
  targetInterviewId: string | null;
  priorPreps: InterviewPrep[];
}

export function buildPrepContext(input: PrepContextInput): string {
  const { opportunity: opp, profile, jdText, targetInterviewId, priorPreps } = input;
  const target = opp.interviews.find((i) => i.id === targetInterviewId) ?? null;
  const completed = opp.interviews.filter((i) => i.status === "completed");
  const priorGaps = priorPreps
    .map((p) => {
      try {
        return PrepSheetSchema.parse(JSON.parse(p.content)).gaps;
      } catch {
        return [];
      }
    })
    .flat()
    .slice(0, 8);

  const sections: string[] = [];

  sections.push(
    [
      "# Candidate",
      profile.resumeText ? `## Resume\n${profile.resumeText}` : "",
      profile.linkedInAbout ? `## LinkedIn about\n${profile.linkedInAbout}` : "",
    ]
      .filter(Boolean)
      .join("\n\n")
  );

  sections.push(
    [
      "# Opportunity",
      `Company: ${opp.company}`,
      `Role: ${opp.role}`,
      opp.location ? `Location: ${opp.location}${opp.remote ? " (remote)" : ""}` : "",
      opp.compMin && opp.compMax ? `Comp range: $${opp.compMin}K to $${opp.compMax}K` : "",
      opp.fitScore != null ? `Candidate's own fit score: ${opp.fitScore}/100` : "",
      opp.notes ? `\n## Candidate's notes\n${opp.notes}` : "",
      opp.keyGaps ? `\n## Gaps the candidate already knows about\n${opp.keyGaps}` : "",
      opp.prosConsNotes ? `\n## Pros and cons\n${opp.prosConsNotes}` : "",
      jdText ? `\n## Job description\n${jdText}` : "",
    ]
      .filter(Boolean)
      .join("\n")
  );

  if (target) {
    sections.push(
      [
        "# This round",
        `Round: ${target.round} (round ${target.roundNumber})`,
        target.format ? `Format: ${target.format}${target.durationMin ? `, ${target.durationMin} minutes` : ""}` : "",
        target.interviewerName ? `Interviewer: ${target.interviewerName}${target.interviewerTitle ? `, ${target.interviewerTitle}` : ""}` : "",
        target.prepNotes ? `\nCandidate's own prep notes:\n${target.prepNotes}` : "",
        target.questionsToAsk ? `\nQuestions the candidate already plans to ask:\n${target.questionsToAsk}` : "",
      ]
        .filter(Boolean)
        .join("\n")
    );
  } else {
    const next = opp.interviews.find((i) => i.status === "scheduled");
    sections.push(
      next
        ? `# This round\nNo round was selected. The next scheduled round is ${next.round} (round ${next.roundNumber}).`
        : "# This round\nNo round is scheduled yet. Prepare for the first conversation with this company."
    );
  }

  if (completed.length) {
    sections.push(
      [
        "# Earlier rounds",
        ...completed.map((i) =>
          [
            `## ${i.round} (round ${i.roundNumber})${i.interviewerName ? ` with ${i.interviewerName}` : ""}${i.sentiment ? `, felt ${i.sentiment}` : ""}`,
            i.debriefNotes ? `Debrief: ${i.debriefNotes}` : "",
            i.questionsAsked ? `Questions they asked: ${i.questionsAsked}` : "",
            i.nextSteps ? `Next steps they described: ${i.nextSteps}` : "",
          ]
            .filter(Boolean)
            .join("\n")
        ),
      ].join("\n\n")
    );
  }

  if (priorGaps.length) {
    sections.push(
      ["# Gaps flagged in earlier prep sheets", ...priorGaps.map((g) => `- ${g.gap} (plan was: ${g.howToAddress})`)].join("\n")
    );
  }

  return sections.join("\n\n---\n\n");
}

export interface GeneratedPrep {
  sheet: PrepSheet;
  model: string;
  inputTokens: number;
  outputTokens: number;
}

export async function generatePrepSheet(context: string): Promise<GeneratedPrep> {
  const client = getAnthropic();
  const model = modelFor("standard");
  const response = await client.messages.parse({
    model,
    max_tokens: 16000,
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    messages: [
      {
        role: "user",
        content: `${context}\n\n---\n\nProduce the prep sheet for this round.`,
      },
    ],
    output_config: { format: zodOutputFormat(PrepSheetSchema) },
  });

  if (response.stop_reason === "refusal") {
    throw new AiRefusedError(refusalExplanation(response));
  }
  if (!response.parsed_output) {
    throw new Error("The model returned an unreadable prep sheet. Try again.");
  }
  return {
    sheet: response.parsed_output,
    model,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}
