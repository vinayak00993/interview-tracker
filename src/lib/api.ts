/**
 * Small helpers shared by the route handlers: auth gate, body validation,
 * and consistent error shapes.
 */
import { NextResponse } from "next/server";
import type { ZodTypeAny, z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { formatZodError } from "@/lib/validation";

export function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

type Handler<Ctx> = (req: Request, ctx: Ctx, userId: string) => Promise<Response>;

/** Wraps a route handler: 401 without a session, 500 with a logged error. */
export function withAuth<Ctx = unknown>(handler: Handler<Ctx>) {
  return async (req: Request, ctx: Ctx): Promise<Response> => {
    const userId = await getSessionUserId();
    if (!userId) return jsonError("Unauthorized", 401);
    try {
      return await handler(req, ctx, userId);
    } catch (error) {
      console.error(`[api] ${req.method} ${new URL(req.url).pathname} failed:`, error);
      return jsonError("Internal server error", 500);
    }
  };
}

export type Parsed<T> = { ok: true; data: T } | { ok: false; response: NextResponse };

/** Parses a JSON body against a schema. */
export async function parseJson<S extends ZodTypeAny>(req: Request, schema: S): Promise<Parsed<z.output<S>>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { ok: false, response: jsonError("Request body must be JSON", 400) };
  }
  const result = schema.safeParse(body);
  if (!result.success) return { ok: false, response: jsonError(formatZodError(result.error), 400) };
  return { ok: true, data: result.data };
}

/** Converts FormData to a plain object so the same schemas can validate it. */
export function formToObject(form: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  form.forEach((value, key) => {
    if (typeof value === "string") out[key] = value;
  });
  return out;
}
