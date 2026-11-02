import { revalidatePath } from "next/cache";
import type { ZodTypeAny, z } from "zod";
import { formatZodError } from "@/lib/validation";
import { getSessionUserId } from "@/lib/session";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

export function fail(error: string): ActionResult<never> {
  return { ok: false, error };
}

export function succeed<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

/** Converts FormData into a plain object. Checkbox absence stays undefined. */
export function formToObject(form: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  form.forEach((value, key) => {
    if (typeof value === "string") out[key] = value;
  });
  return out;
}

export function validate<S extends ZodTypeAny>(schema: S, input: unknown): { ok: true; data: z.output<S> } | { ok: false; error: string } {
  const result = schema.safeParse(input);
  if (!result.success) return { ok: false, error: formatZodError(result.error) };
  return { ok: true, data: result.data };
}

/** Runs an action with the session user, mapping thrown errors to a result. */
export async function withUser<T>(fn: (userId: string) => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  const userId = await getSessionUserId();
  if (!userId) return fail("You need to sign in again.");
  try {
    return await fn(userId);
  } catch (error) {
    console.error("[action] failed:", error);
    return fail("Something went wrong. Try again.");
  }
}

export function revalidateOpportunity(id: string) {
  revalidatePath("/dashboard");
  revalidatePath(`/opportunities/${id}`, "layout");
}
