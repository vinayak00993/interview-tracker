import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, parseJson, jsonError } from "@/lib/api";
import { markDocumentSent, unmarkDocumentSent } from "@/lib/data/documents";

type Ctx = { params: { id: string } };

const bodySchema = z.object({ documentId: z.string().min(1), sentAt: z.string().max(40).nullable().optional() });

export const POST = withAuth<Ctx>(async (req, { params }, userId) => {
  const parsed = await parseJson(req, bodySchema);
  if (!parsed.ok) return parsed.response;
  const link = await markDocumentSent(userId, params.id, parsed.data.documentId, parsed.data.sentAt);
  if (!link) return jsonError("Not found", 404);
  return NextResponse.json(link, { status: 201 });
});

export const DELETE = withAuth<Ctx>(async (req, { params }, userId) => {
  const documentId = new URL(req.url).searchParams.get("documentId");
  if (!documentId) return jsonError("documentId is required", 400);
  const ok = await unmarkDocumentSent(userId, params.id, documentId);
  if (!ok) return jsonError("Not found", 404);
  return NextResponse.json({ ok: true });
});
