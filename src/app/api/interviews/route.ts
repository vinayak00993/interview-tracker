import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createInterview, db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    const body = await req.json();
    if (!body.opportunityId || !body.round) {
      return NextResponse.json({ error: "opportunityId and round are required" }, { status: 400 });
    }

    // Verify opportunity belongs to user
    const opp = db.prepare("SELECT id FROM Opportunity WHERE id = ? AND userId = ?").get(body.opportunityId, userId);
    if (!opp) return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });

    const interview = createInterview(body);
    return NextResponse.json(interview, { status: 201 });
  } catch (error) {
    console.error("POST /api/interviews error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
