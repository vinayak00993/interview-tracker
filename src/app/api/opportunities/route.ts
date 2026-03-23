import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { findOpportunities, createOpportunity } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    const opportunities = await findOpportunities(userId);
    return NextResponse.json(opportunities);
  } catch (error) {
    console.error("GET /api/opportunities error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    const body = await req.json();
    if (!body.company || !body.role) {
      return NextResponse.json({ error: "Company and role are required" }, { status: 400 });
    }

    const opportunity = await createOpportunity(userId, body);
    return NextResponse.json(opportunity, { status: 201 });
  } catch (error) {
    console.error("POST /api/opportunities error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
