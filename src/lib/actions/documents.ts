"use server";

import { revalidatePath } from "next/cache";
import { createDocument, updateDocument, deleteDocument, markDocumentSent, unmarkDocumentSent } from "@/lib/data/documents";
import { documentCreateSchema, documentUpdateSchema } from "@/lib/validation";
import { withUser, validate, fail, succeed, formToObject, revalidateOpportunity, type ActionResult } from "./shared";

function revalidateDocuments(opportunityId?: string) {
  revalidatePath("/documents");
  if (opportunityId) revalidateOpportunity(opportunityId);
}

export async function createDocumentAction(form: FormData, opportunityId?: string): Promise<ActionResult<{ id: string }>> {
  return withUser(async (userId) => {
    const v = validate(documentCreateSchema, formToObject(form));
    if (!v.ok) return fail(v.error);
    const created = await createDocument(userId, v.data);
    if (opportunityId) await markDocumentSent(userId, opportunityId, created.id);
    revalidateDocuments(opportunityId);
    return succeed({ id: created.id });
  });
}

export async function updateDocumentAction(id: string, form: FormData): Promise<ActionResult> {
  return withUser(async (userId) => {
    const v = validate(documentUpdateSchema, formToObject(form));
    if (!v.ok) return fail(v.error);
    const updated = await updateDocument(id, userId, v.data);
    if (!updated) return fail("Document not found.");
    revalidateDocuments();
    return succeed(undefined);
  });
}

export async function deleteDocumentAction(id: string): Promise<ActionResult> {
  return withUser(async (userId) => {
    const ok = await deleteDocument(id, userId);
    if (!ok) return fail("Document not found.");
    revalidateDocuments();
    return succeed(undefined);
  });
}

export async function markDocumentSentAction(opportunityId: string, documentId: string): Promise<ActionResult> {
  return withUser(async (userId) => {
    const link = await markDocumentSent(userId, opportunityId, documentId);
    if (!link) return fail("Document or opportunity not found.");
    revalidateDocuments(opportunityId);
    return succeed(undefined);
  });
}

export async function unmarkDocumentSentAction(opportunityId: string, documentId: string): Promise<ActionResult> {
  return withUser(async (userId) => {
    const ok = await unmarkDocumentSent(userId, opportunityId, documentId);
    if (!ok) return fail("Link not found.");
    revalidateDocuments(opportunityId);
    return succeed(undefined);
  });
}
