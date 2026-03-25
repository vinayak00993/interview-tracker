import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { findUserProfile } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";

// Inline query to load interview + opportunity since no dedicated function exists
async function loadInterviewWithContext(interviewId: string, userId: string) {
  const { db } = await import("@/lib/db");
  const intResult = await db.execute(
    "SELECT i.*, o.company, o.role, o.jdLink FROM Interview i JOIN Opportunity o ON i.opportunityId = o.id WHERE i.id = ? AND o.userId = ?",
    [interviewId, userId]
  );
  const row = intResult.rows[0];
  if (!row) return null;
  // Flatten row proxy to plain object
  const obj: Record<string, any> = {};
  for (const key of Object.keys(row)) {
    obj[key] = (row as any)[key];
  }
  return obj;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI features not configured — ANTHROPIC_API_KEY missing" }, { status: 500 });
    }

    const userId = (session.user as any).id;
    const { interviewId } = await req.json();
    if (!interviewId) return NextResponse.json({ error: "interviewId required" }, { status: 400 });

    const [interview, profile] = await Promise.all([
      loadInterviewWithContext(interviewId, userId),
      findUserProfile(userId),
    ]);

    if (!interview) return NextResponse.json({ error: "Interview not found" }, { status: 404 });

    const candidateName = (session.user as any).name || "the candidate";

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: `Generate a professional follow-up/thank-you email after a job interview.

## Context
- Candidate name: ${candidateName}
- Company: ${interview.company}
- Role: ${interview.role}
- Interview round: ${interview.round}
${interview.interviewerName ? `- Interviewer: ${interview.interviewerName}${interview.interviewerTitle ? ` (${interview.interviewerTitle})` : ""}` : ""}
${interview.debriefNotes ? `- What was discussed: ${interview.debriefNotes}` : ""}
${interview.questionsAsked ? `- Questions they asked: ${interview.questionsAsked}` : ""}
${interview.nextSteps ? `- Next steps mentioned: ${interview.nextSteps}` : ""}
${profile?.resumeText ? `- Candidate background (brief): ${profile.resumeText.slice(0, 500)}` : ""}

## Instructions
Write a warm, professional thank-you email that:
1. Thanks the interviewer by name (if known) for their time
2. References 1-2 specific topics from the discussion (from debrief notes)
3. Briefly reinforces why the candidate is a strong fit
4. Expresses genuine enthusiasm for the role
5. Is concise (under 200 words)
6. Feels personal, not template-y

Return your response in this exact format:
SUBJECT: [email subject line]
---
[email body - ready to send, starting with the greeting]`,
      }],
    });

    const content = message.content[0];
    const text = content.type === "text" ? content.text : "";

    // Parse subject and body
    const parts = text.split("---");
    let subject = "Thank you for the interview";
    let email = text;

    if (parts.length >= 2) {
      const subjectMatch = parts[0].match(/SUBJECT:\s*(.+)/i);
      if (subjectMatch) subject = subjectMatch[1].trim();
      email = parts.slice(1).join("---").trim();
    }

    return NextResponse.json({ subject, email });
  } catch (error: any) {
    console.error("POST /api/ai-followup error:", error);
    return NextResponse.json({
      error: error.message || "Failed to generate follow-up email",
    }, { status: 500 });
  }
}
