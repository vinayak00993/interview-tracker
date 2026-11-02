import { NextResponse } from "next/server";
import { withAuth, parseJson, jsonError } from "@/lib/api";
import { updateDocument, deleteDocument } from "@/lib/data/documents";
import { documentUpdateSchema } from "@/lib/validation";

type Ctx = { params: { id: string } };

export const PUT = withAuth<Ctx>(async (req, { params }, userId) => {
  const parsed = await parseJson(req, documentUpdateSchema);
  if (!parsed.ok) return parsed.response;
  const updated = await updateDocument(params.id, userId, parsed.data);
  if (!updated) return jsonError("Not found", 404);
  return NextResponse.json(updated);
});

export const DELETE = withAuth<Ctx>(async (_req, { params }, userId) => {
  const ok = await deleteDocument(params.id, userId);
  if (!ok) return jsonError("Not found", 404);
  return NextResponse.json({ ok: true });
});
