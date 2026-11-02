import bcrypt from "bcryptjs";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { nowIso } from "@/lib/time";

export type PublicUser = Omit<User, "passwordHash">;

export async function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
}

export async function findUserByGoogleId(googleId: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { googleId } });
}

export class EmailExistsError extends Error {
  constructor() {
    super("EMAIL_EXISTS");
    this.name = "EmailExistsError";
  }
}

export async function createUser(email: string, password: string, name: string): Promise<PublicUser> {
  const normalized = email.toLowerCase().trim();
  const existing = await findUserByEmail(normalized);
  if (existing) throw new EmailExistsError();
  const passwordHash = await bcrypt.hash(password, 10);
  const ts = nowIso();
  const user = await prisma.user.create({
    data: { email: normalized, passwordHash, name, createdAt: ts, updatedAt: ts },
  });
  const { passwordHash: _omit, ...rest } = user;
  void _omit;
  return rest;
}

export async function verifyPassword(user: User, password: string): Promise<boolean> {
  if (!user.passwordHash) return false;
  return bcrypt.compare(password, user.passwordHash);
}

export async function createGoogleUser(params: {
  googleId: string;
  email: string;
  name: string | null;
  image: string | null;
}): Promise<User> {
  const ts = nowIso();
  return prisma.user.create({
    data: {
      email: params.email.toLowerCase().trim(),
      googleId: params.googleId,
      name: params.name,
      image: params.image,
      createdAt: ts,
      updatedAt: ts,
    },
  });
}

/** Attach a Google identity to an existing account (same email). */
export async function linkGoogleToUser(
  userId: string,
  params: { googleId: string; name: string | null; image: string | null }
): Promise<User> {
  const current = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  return prisma.user.update({
    where: { id: userId },
    data: {
      googleId: params.googleId,
      name: current.name ?? params.name,
      image: current.image ?? params.image,
      updatedAt: nowIso(),
    },
  });
}
