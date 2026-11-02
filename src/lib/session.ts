import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/** Returns the signed-in user's id, or null when there is no session. */
export async function getSessionUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

/** Like getSessionUserId but throws. For server actions and route handlers. */
export async function requireUserId(): Promise<string> {
  const id = await getSessionUserId();
  if (!id) throw new UnauthorizedError();
  return id;
}
