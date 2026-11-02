"use server";

import { revalidatePath } from "next/cache";
import { upsertOffer, deleteOffer } from "@/lib/data/offers";
import { offerUpsertSchema } from "@/lib/validation";
import { withUser, validate, fail, succeed, formToObject, revalidateOpportunity, type ActionResult } from "./shared";

export async function saveOfferAction(form: FormData): Promise<ActionResult> {
  return withUser(async (userId) => {
    const v = validate(offerUpsertSchema, formToObject(form));
    if (!v.ok) return fail(v.error);
    const offer = await upsertOffer(userId, v.data);
    if (!offer) return fail("Opportunity not found.");
    revalidatePath("/dashboard/offers");
    revalidateOpportunity(v.data.opportunityId);
    return succeed(undefined);
  });
}

export async function deleteOfferAction(opportunityId: string): Promise<ActionResult> {
  return withUser(async (userId) => {
    const ok = await deleteOffer(userId, opportunityId);
    if (!ok) return fail("Offer not found.");
    revalidatePath("/dashboard/offers");
    revalidateOpportunity(opportunityId);
    return succeed(undefined);
  });
}
