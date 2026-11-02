import { NextResponse } from "next/server";
import { withAuth, parseJson } from "@/lib/api";
import { listDocuments, createDocument } from "@/lib/data/documents";
import { documentCreateSchema } from "@/lib/validation";

export const GET = withAuth(async (_req, _ctx, userId) => NextResponse.json(await listDocuments(userId)));

export const POST = withAuth(async (req, _ctx, userId) => {
  const parsed = await parseJson(req, documentCreateSchema);
  if (!parsed.ok) return parsed.response;
  return NextResponse.json(await createDocument(userId, parsed.data), { status: 201 });
});
