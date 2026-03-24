import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { findOpportunityById, findUserProfile } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI prep not configured — ANTHROPIC_API_KEY missing" }, { status: 500 });
    }

    const userId = (session.user as any).id;
    const { opportunityId } = await req.json();
    if (!opportunityId) return NextResponse.json({ error: "opportunityId required" }, { status: 400 });

    // Load opportunity + profile
    const [opp, profile] = await Promise.all([
      findOpportunityById(opportunityId, userId),
      findUserProfile(userId),
    ]);

    if (!opp) return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });

    if (!profile?.resumeText && !profile?.linkedInAbout) {
      return NextResponse.json({
        error: "Set up your profile first — upload your resume or paste your LinkedIn about section.",
      }, { status: 400 });
    }

    // Build context
    const profileContext = [
      profile.resumeText ? `## Resume\n${profile.resumeText}` : "",
      profile.linkedInAbout ? `## LinkedIn About\n${profile.linkedInAbout}` : "",
    ].filter(Boolean).join("\n\n");

    const oppContext = [
      `## Opportunity`,
      `Company: ${opp.company}`,
      `Role: ${opp.role}`,
      opp.location ? `Location: ${opp.location}${opp.remote ? " (Remote)" : ""}` : "",
      opp.compMin && opp.compMax ? `Comp: $${opp.compMin}K – $${opp.compMax}K` : "",
      opp.fitScore ? `Fit Score: ${opp.fitScore}%` : "",
      opp.jdLink ? `JD Link: ${opp.jdLink}` : "",
      opp.notes ? `\n## Notes\n${opp.notes}` : "",
      opp.keyGaps ? `\n## Known Gaps\n${opp.keyGaps}` : "",
      opp.interviews.length > 0 ? `\n## Interview History\n${opp.interviews.map((i: any) =>
        `- ${i.round} (${i.status})${i.debriefNotes ? `: ${i.debriefNotes}` : ""}`
      ).join("\n")}` : "",
    ].filter(Boolean).join("\n");

    // Fetch JD content if available
    let jdContent = "";
    if (opp.jdLink) {
      try {
        const jdRes = await fetch(opp.jdLink, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "text/html",
          },
          signal: AbortSignal.timeout(5000),
        });
        if (jdRes.ok) {
          const html = await jdRes.text();
          jdContent = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/&\w+;/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 4000);
        }
      } catch {
        // JD fetch failed, proceed without it
      }
    }

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{
        role: "user",
        content: `You are an expert career coach helping a job candidate prepare for an opportunity. Based on their profile and the job details, generate a tailored prep sheet.

# Candidate Profile
${profileContext}

# Target Opportunity
${oppContext}
${jdContent ? `\n## Job Description Content\n${jdContent}` : ""}

Generate the following sections in markdown format:

## Tailored Talking Points
3-5 specific talking points that map the candidate's experience directly to what this role requires. Be specific — reference actual projects, companies, and achievements from their resume.

## Gap Analysis
Honestly assess 2-3 gaps between the candidate's background and the role requirements. For each gap, suggest how to address it in conversation (reframe, bridge experience, acknowledge and show willingness to learn).

## STAR Stories to Prepare
3-4 specific stories from the candidate's experience formatted as brief STAR outlines (Situation, Task, Action, Result) that would resonate for this role.

## Questions to Ask
5-7 thoughtful questions the candidate should ask that demonstrate strategic thinking and genuine interest in the role.

## Key Research Points
3-4 things the candidate should research about the company before interviewing.

Be direct and specific — no generic advice. Every point should reference the candidate's actual experience or the specific role.`,
      }],
    });

    const content = message.content[0];
    const prepText = content.type === "text" ? content.text : "";

    return NextResponse.json({
      prep: prepText,
      tokensUsed: {
        input: message.usage.input_tokens,
        output: message.usage.output_tokens,
      },
    });
  } catch (error: any) {
    console.error("POST /api/ai-prep error:", error);
    return NextResponse.json({
      error: error.message || "Failed to generate AI prep",
    }, { status: 500 });
  }
}
