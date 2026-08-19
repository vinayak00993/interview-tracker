import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOnboardingStatus, setOnboardingDismissed } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;
    const status = await getOnboardingStatus(userId);
    return NextResponse.json(status);
  } catch (error) {
    console.error("GET /api/onboarding error:", error);
    return NextResponse.json({ error: "Failed to load onboarding status" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;
    const body = await req.json();
    if (typeof body.dismissed !== "boolean") {
      return NextResponse.json({ error: "dismissed must be a boolean" }, { status: 400 });
    }

    await setOnboardingDismissed(userId, body.dismissed);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PATCH /api/onboarding error:", error);
    return NextResponse.json({ error: "Failed to update onboarding" }, { status: 500 });
  }
}
