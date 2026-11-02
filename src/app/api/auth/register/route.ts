import { NextResponse } from "next/server";
import { createUser, EmailExistsError } from "@/lib/data/users";
import { consumeRateLimit } from "@/lib/data/rate-limit";
import { registerSchema } from "@/lib/validation";
import { jsonError, parseJson } from "@/lib/api";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = await consumeRateLimit(`register:${ip}`, 10, 60 * 60 * 1000);
  if (!limit.allowed) return jsonError("Too many sign-ups from this address. Try again later.", 429);

  const parsed = await parseJson(req, registerSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const user = await createUser(parsed.data.email, parsed.data.password, parsed.data.name);
    return NextResponse.json({ id: user.id, email: user.email, name: user.name }, { status: 201 });
  } catch (error) {
    if (error instanceof EmailExistsError) return jsonError("An account with this email already exists", 409);
    console.error("[api] register failed:", error);
    return jsonError("Registration failed", 500);
  }
}
