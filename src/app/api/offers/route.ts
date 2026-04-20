import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  db,
  findOffersForUser,
  upsertOffer,
  deleteOffer,
  Offer,
} from "@/lib/db";

/**
 * GET /api/offers — list all offers for current user.
 * POST /api/offers — upsert offer for { opportunityId, ...fields }.
 * DELETE /api/offers?opportunityId=... — remove offer.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string }).id as string;
  const offers = await findOffersForUser(userId);
  return NextResponse.json({ offers });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string }).id as string;

  const body = await req.json();
  const { opportunityId, ...fields } = body;
  if (!opportunityId) {
    return NextResponse.json({ error: "opportunityId required" }, { status: 400 });
  }

  // Verify opportunity belongs to user
  const check = await db.execute(
    "SELECT id FROM Opportunity WHERE id = ? AND userId = ?",
    [opportunityId, userId]
  );
  if (check.rows.length === 0) {
    return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
  }

  // Whitelist allowed fields
  const allowed: (keyof Omit<Offer, "id" | "opportunityId" | "createdAt" | "updatedAt">)[] = [
    "baseComp", "signOnBonus", "annualBonus", "bonusPercent",
    "equityType", "equityValue", "equityShares", "vestYears", "vestCliff", "vestSchedule",
    "ptoDays", "healthcare", "remotePolicy", "startDate", "expiryDate",
    "location", "title", "level", "benefits", "rawText", "sourceType", "aiSummary",
  ];
  const clean: Record<string, unknown> = {};
  for (const k of allowed) {
    if (k in fields) clean[k] = fields[k];
  }

  const offer = await upsertOffer(opportunityId, clean);

  // Also move the opportunity to 'offer' status if it isn't already
  await db.execute(
    "UPDATE Opportunity SET status = 'offer', updatedAt = datetime('now') WHERE id = ? AND status != 'offer'",
    [opportunityId]
  );

  return NextResponse.json({ offer });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id?: string }).id as string;

  const opportunityId = req.nextUrl.searchParams.get("opportunityId");
  if (!opportunityId) {
    return NextResponse.json({ error: "opportunityId required" }, { status: 400 });
  }

  const check = await db.execute(
    "SELECT id FROM Opportunity WHERE id = ? AND userId = ?",
    [opportunityId, userId]
  );
  if (check.rows.length === 0) {
    return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
  }

  await deleteOffer(opportunityId);
  return NextResponse.json({ ok: true });
}
