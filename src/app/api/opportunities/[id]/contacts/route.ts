import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, parseJson, jsonError } from "@/lib/api";
import { attachContact, detachContact, createContactForOpportunity } from "@/lib/data/contacts";
import { attachContactSchema, contactCreateSchema } from "@/lib/validation";

type Ctx = { params: { id: string } };

/** Attach an existing contact ({contactId, role}) or create a new one ({contact, role}). */
const bodySchema = z.union([
  attachContactSchema,
  z.object({ contact: contactCreateSchema, role: z.string().trim().max(100).nullable().optional() }),
]);

export const POST = withAuth<Ctx>(async (req, { params }, userId) => {
  const parsed = await parseJson(req, bodySchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;
  const result =
    "contactId" in body
      ? await attachContact(userId, params.id, body.contactId, body.role ?? null)
      : await createContactForOpportunity(userId, params.id, body.contact, body.role ?? null);
  if (!result) return jsonError("Not found", 404);
  return NextResponse.json(result, { status: 201 });
});

export const DELETE = withAuth<Ctx>(async (req, { params }, userId) => {
  const contactId = new URL(req.url).searchParams.get("contactId");
  if (!contactId) return jsonError("contactId is required", 400);
  const ok = await detachContact(userId, params.id, contactId);
  if (!ok) return jsonError("Not found", 404);
  return NextResponse.json({ ok: true });
});
