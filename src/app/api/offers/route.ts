import { NextResponse } from "next/server";
import { withAuth, parseJson, jsonError } from "@/lib/api";
import { listOffers, upsertOffer, deleteOffer } from "@/lib/data/offers";
import { offerUpsertSchema } from "@/lib/validation";

export const GET = withAuth(async (_req, _ctx, userId) => NextResponse.json({ offers: await listOffers(userId) }));

export const POST = withAuth(async (req, _ctx, userId) => {
  const parsed = await parseJson(req, offerUpsertSchema);
  if (!parsed.ok) return parsed.response;
  const offer = await upsertOffer(userId, parsed.data);
  if (!offer) return jsonError("Opportunity not found", 404);
  return NextResponse.json({ offer });
});

export const DELETE = withAuth(async (req, _ctx, userId) => {
  const opportunityId = new URL(req.url).searchParams.get("opportunityId");
  if (!opportunityId) return jsonError("opportunityId is required", 400);
  const ok = await deleteOffer(userId, opportunityId);
  if (!ok) return jsonError("Not found", 404);
  return NextResponse.json({ ok: true });
});
