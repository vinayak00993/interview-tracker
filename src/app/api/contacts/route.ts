import { NextResponse } from "next/server";
import { withAuth, parseJson } from "@/lib/api";
import { listContacts, createContact } from "@/lib/data/contacts";
import { contactCreateSchema } from "@/lib/validation";

export const GET = withAuth(async (_req, _ctx, userId) => NextResponse.json(await listContacts(userId)));

export const POST = withAuth(async (req, _ctx, userId) => {
  const parsed = await parseJson(req, contactCreateSchema);
  if (!parsed.ok) return parsed.response;
  return NextResponse.json(await createContact(userId, parsed.data), { status: 201 });
});
