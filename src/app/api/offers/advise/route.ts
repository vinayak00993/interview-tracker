import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";
import { db, findOffersForUser } from "@/lib/db";

/**
 * POST /api/offers/advise
 *
 * Takes all offers for the current user, pulls their resume/profile for
 * context, and asks Claude Sonnet to produce a structured recommendation.
 * Returns markdown.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string }).id as string;

  const offers = await findOffersForUser(userId);
  if (offers.length < 2) {
    return NextResponse.json(
      { error: "Need at least 2 offers to compare." },
      { status: 400 }
    );
  }

  // Pull profile for context
  const profileRes = await db.execute(
    "SELECT resumeText, linkedInAbout FROM UserProfile WHERE userId = ?",
    [userId]
  );
  const profile = profileRes.rows[0] as { resumeText?: string; linkedInAbout?: string } | undefined;

  const offersSummary = offers
    .map((o, i) => {
      const total = (o.baseComp || 0) + (o.annualBonus || 0) + (o.equityValue || 0) / (o.vestYears || 4);
      return `## Offer ${i + 1}: ${o.company} — ${o.title || o.role}
- Base: ${o.baseComp ? `$${o.baseComp}K` : "?"}
- Annual bonus: ${o.annualBonus ? `$${o.annualBonus}K` : o.bonusPercent ? `${o.bonusPercent}% of base` : "?"}
- Sign-on: ${o.signOnBonus ? `$${o.signOnBonus}K` : "none"}
- Equity: ${o.equityType || "?"}, ${o.equityValue ? `$${o.equityValue}K` : "?"} over ${o.vestYears || "?"} years (cliff: ${o.vestCliff || "?"}mo)
- Est. annualized comp: ~$${Math.round(total)}K
- Level / title: ${o.level || "?"} / ${o.title || "?"}
- Location / remote: ${o.location || "?"} — ${o.remotePolicy || "?"}
- PTO: ${o.ptoDays === -1 ? "unlimited" : o.ptoDays ? `${o.ptoDays} days` : "?"}
- Benefits: ${o.benefits || "not specified"}
- Start: ${o.startDate || "flexible"} | Expires: ${o.expiryDate || "?"}`;
    })
    .join("\n\n");

  const systemPrompt = `You are a senior career advisor helping a candidate choose between multiple job offers. You reason clearly about compensation structure, career growth, risk, and fit. You NEVER invent numbers — only use what's provided. You're direct and practical, not saccharine.

Produce a Markdown response with these sections:

## TL;DR
One or two sentences on which offer seems strongest OVERALL and why. Be clear but acknowledge uncertainty.

## Compensation comparison
A clean table or bullet breakdown of total estimated annualized comp (base + bonus + equity/year).

## Where each offer wins
Short bullets per offer on its strongest dimension.

## Where each offer loses
Short bullets per offer on its weakest dimension or missing info.

## Questions to ask before deciding
3-5 concrete questions the candidate should get answers to (e.g. "What's the equity valuation methodology?", "What's the expected promo timeline?").

## Negotiation levers
Specific asks that have high probability of success given these offers competing with each other.

## Final recommendation
One clear take, caveated appropriately. If numbers are close, say so rather than forcing a winner.`;

  const userPrompt = `Candidate background:
Resume:
${profile?.resumeText || "(not provided)"}

LinkedIn summary:
${profile?.linkedInAbout || "(not provided)"}

Offers:
${offersSummary}

Now produce your comparison and recommendation.`;

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 3000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const markdown = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    return NextResponse.json({ markdown });
  } catch (err) {
    console.error("[offers/advise] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Advisor failed" },
      { status: 500 }
    );
  }
}
