"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createOpportunity,
  updateOpportunity,
  updateOpportunityStatus,
  deleteOpportunity,
  setFollowUp,
} from "@/lib/data/opportunities";
import { logActivity } from "@/lib/data/activities";
import { opportunityCreateSchema, opportunityUpdateSchema, statusChangeSchema, activityCreateSchema } from "@/lib/validation";
import { withUser, validate, fail, succeed, formToObject, revalidateOpportunity, type ActionResult } from "./shared";

export async function createOpportunityAction(form: FormData): Promise<ActionResult<{ id: string }>> {
  return withUser(async (userId) => {
    const v = validate(opportunityCreateSchema, formToObject(form));
    if (!v.ok) return fail(v.error);
    const created = await createOpportunity(userId, v.data);
    revalidatePath("/dashboard");
    return succeed({ id: created.id });
  });
}

export async function updateOpportunityAction(id: string, form: FormData): Promise<ActionResult> {
  return withUser(async (userId) => {
    const raw = formToObject(form);
    // An unchecked checkbox is absent from FormData, so treat it as false on edit.
    if (!("remote" in raw)) raw.remote = false;
    const v = validate(opportunityUpdateSchema, raw);
    if (!v.ok) return fail(v.error);
    const updated = await updateOpportunity(id, userId, v.data);
    if (!updated) return fail("Opportunity not found.");
    revalidateOpportunity(id);
    return succeed(undefined);
  });
}

export async function changeStatusAction(id: string, status: string): Promise<ActionResult> {
  return withUser(async (userId) => {
    const v = validate(statusChangeSchema, { status });
    if (!v.ok) return fail(v.error);
    const updated = await updateOpportunityStatus(id, userId, v.data.status);
    if (!updated) return fail("Opportunity not found.");
    revalidateOpportunity(id);
    revalidatePath("/dashboard/comp");
    revalidatePath("/dashboard/offers");
    return succeed(undefined);
  });
}

export async function setFollowUpAction(id: string, followUpAt: string | null): Promise<ActionResult> {
  return withUser(async (userId) => {
    const updated = await setFollowUp(id, userId, followUpAt);
    if (!updated) return fail("Opportunity not found.");
    revalidateOpportunity(id);
    return succeed(undefined);
  });
}

/** Marks a follow-up as done: logs the activity and clears the reminder. */
export async function completeFollowUpAction(id: string, note?: string): Promise<ActionResult> {
  return withUser(async (userId) => {
    const updated = await setFollowUp(id, userId, null);
    if (!updated) return fail("Opportunity not found.");
    await logActivity(userId, { opportunityId: id, type: "followed_up", description: note?.trim() || "Followed up" });
    revalidateOpportunity(id);
    return succeed(undefined);
  });
}

export async function logActivityAction(form: FormData): Promise<ActionResult> {
  return withUser(async (userId) => {
    const v = validate(activityCreateSchema, formToObject(form));
    if (!v.ok) return fail(v.error);
    await logActivity(userId, v.data);
    if (v.data.opportunityId) revalidateOpportunity(v.data.opportunityId);
    else revalidatePath("/dashboard");
    return succeed(undefined);
  });
}

export async function deleteOpportunityAction(id: string): Promise<ActionResult> {
  const result = await withUser(async (userId) => {
    const ok = await deleteOpportunity(id, userId);
    if (!ok) return fail("Opportunity not found.");
    revalidatePath("/dashboard");
    return succeed(undefined);
  });
  if (result.ok) redirect("/dashboard");
  return result;
}
