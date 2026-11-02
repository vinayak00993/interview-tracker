"use server";

import { createInterview, updateInterview, deleteInterview } from "@/lib/data/interviews";
import { deletePrep, markFollowUpSent } from "@/lib/data/prep";
import { interviewCreateSchema, interviewUpdateSchema, debriefSchema } from "@/lib/validation";
import { withUser, validate, fail, succeed, formToObject, revalidateOpportunity, type ActionResult } from "./shared";

export async function createInterviewAction(opportunityId: string, form: FormData): Promise<ActionResult<{ id: string }>> {
  return withUser(async (userId) => {
    const v = validate(interviewCreateSchema, { ...formToObject(form), opportunityId });
    if (!v.ok) return fail(v.error);
    const created = await createInterview(userId, v.data);
    if (!created) return fail("Opportunity not found.");
    revalidateOpportunity(opportunityId);
    return succeed({ id: created.id });
  });
}

export async function updateInterviewAction(opportunityId: string, interviewId: string, form: FormData): Promise<ActionResult> {
  return withUser(async (userId) => {
    const v = validate(interviewUpdateSchema, formToObject(form));
    if (!v.ok) return fail(v.error);
    const updated = await updateInterview(interviewId, userId, v.data);
    if (!updated) return fail("Interview not found.");
    revalidateOpportunity(opportunityId);
    return succeed(undefined);
  });
}

/** Saves debrief notes and marks the round completed. */
export async function debriefInterviewAction(opportunityId: string, interviewId: string, form: FormData): Promise<ActionResult> {
  return withUser(async (userId) => {
    const v = validate(debriefSchema, formToObject(form));
    if (!v.ok) return fail(v.error);
    const updated = await updateInterview(interviewId, userId, { ...v.data, status: "completed" });
    if (!updated) return fail("Interview not found.");
    revalidateOpportunity(opportunityId);
    return succeed(undefined);
  });
}

export async function deleteInterviewAction(opportunityId: string, interviewId: string): Promise<ActionResult> {
  return withUser(async (userId) => {
    const ok = await deleteInterview(interviewId, userId);
    if (!ok) return fail("Interview not found.");
    revalidateOpportunity(opportunityId);
    return succeed(undefined);
  });
}

export async function deletePrepAction(opportunityId: string, prepId: string): Promise<ActionResult> {
  return withUser(async (userId) => {
    const ok = await deletePrep(prepId, userId);
    if (!ok) return fail("Prep sheet not found.");
    revalidateOpportunity(opportunityId);
    return succeed(undefined);
  });
}

export async function markFollowUpSentAction(opportunityId: string, draftId: string): Promise<ActionResult> {
  return withUser(async (userId) => {
    const updated = await markFollowUpSent(draftId, userId);
    if (!updated) return fail("Draft not found.");
    revalidateOpportunity(opportunityId);
    return succeed(undefined);
  });
}
