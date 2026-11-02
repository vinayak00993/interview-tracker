"use server";

import { revalidatePath } from "next/cache";
import {
  createContact,
  updateContact,
  deleteContact,
  attachContact,
  detachContact,
  createContactForOpportunity,
} from "@/lib/data/contacts";
import { contactCreateSchema, contactUpdateSchema } from "@/lib/validation";
import { withUser, validate, fail, succeed, formToObject, revalidateOpportunity, type ActionResult } from "./shared";

function revalidateContacts(opportunityId?: string) {
  revalidatePath("/contacts");
  if (opportunityId) revalidateOpportunity(opportunityId);
}

export async function createContactAction(form: FormData): Promise<ActionResult<{ id: string }>> {
  return withUser(async (userId) => {
    const v = validate(contactCreateSchema, formToObject(form));
    if (!v.ok) return fail(v.error);
    const created = await createContact(userId, v.data);
    revalidateContacts();
    return succeed({ id: created.id });
  });
}

export async function updateContactAction(id: string, form: FormData, opportunityId?: string): Promise<ActionResult> {
  return withUser(async (userId) => {
    const v = validate(contactUpdateSchema, formToObject(form));
    if (!v.ok) return fail(v.error);
    const updated = await updateContact(id, userId, v.data);
    if (!updated) return fail("Contact not found.");
    revalidateContacts(opportunityId);
    return succeed(undefined);
  });
}

export async function deleteContactAction(id: string, opportunityId?: string): Promise<ActionResult> {
  return withUser(async (userId) => {
    const ok = await deleteContact(id, userId);
    if (!ok) return fail("Contact not found.");
    revalidateContacts(opportunityId);
    return succeed(undefined);
  });
}

export async function attachContactAction(opportunityId: string, contactId: string, role: string | null): Promise<ActionResult> {
  return withUser(async (userId) => {
    const link = await attachContact(userId, opportunityId, contactId, role || null);
    if (!link) return fail("Contact or opportunity not found.");
    revalidateContacts(opportunityId);
    return succeed(undefined);
  });
}

export async function createContactForOpportunityAction(opportunityId: string, form: FormData): Promise<ActionResult<{ id: string }>> {
  return withUser(async (userId) => {
    const raw = formToObject(form);
    const role = typeof raw.role === "string" && raw.role ? raw.role : null;
    delete raw.role;
    const v = validate(contactCreateSchema, raw);
    if (!v.ok) return fail(v.error);
    const created = await createContactForOpportunity(userId, opportunityId, v.data, role);
    if (!created) return fail("Opportunity not found.");
    revalidateContacts(opportunityId);
    return succeed({ id: created.id });
  });
}

export async function detachContactAction(opportunityId: string, contactId: string): Promise<ActionResult> {
  return withUser(async (userId) => {
    const ok = await detachContact(userId, opportunityId, contactId);
    if (!ok) return fail("Link not found.");
    revalidateContacts(opportunityId);
    return succeed(undefined);
  });
}
