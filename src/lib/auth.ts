import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import {
  findUserByEmail,
  findUserByGoogleId,
  createGoogleUser,
  linkGoogleToUser,
  verifyPassword,
} from "@/lib/data/users";
import { consumeRateLimit, resetRateLimit } from "@/lib/data/rate-limit";

const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

function clientIp(headers: Record<string, string | string[] | undefined> | undefined): string {
  const forwarded = headers?.["x-forwarded-for"];
  const value = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return value?.split(",")[0]?.trim() || "unknown";
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        // Rate limit per IP and per account so a single address cannot
        // hammer one login and a botnet cannot spray one account.
        const ip = clientIp(req?.headers as Record<string, string | undefined> | undefined);
        const email = credentials.email.toLowerCase().trim();
        const [byIp, byEmail] = await Promise.all([
          consumeRateLimit(`login:ip:${ip}`, LOGIN_MAX_ATTEMPTS * 4, LOGIN_WINDOW_MS),
          consumeRateLimit(`login:email:${email}`, LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MS),
        ]);
        if (!byIp.allowed || !byEmail.allowed) {
          throw new Error("Too many login attempts. Try again in 15 minutes.");
        }

        try {
          const user = await findUserByEmail(email);
          if (!user || !(await verifyPassword(user, credentials.password))) return null;
          await resetRateLimit(`login:email:${email}`);
          return { id: user.id, email: user.email, name: user.name, image: user.image };
        } catch (error) {
          console.error("[auth] authorize failed:", error instanceof Error ? error.message : error);
          return null;
        }
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      // Identity only. No calendar or offline scopes: we do not store
      // Google tokens, so we do not ask for anything we cannot use.
      authorization: { params: { scope: "openid email profile" } },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return true;
      try {
        const googleId = account.providerAccountId;
        const email = user.email;
        if (!email || !googleId) return false;
        const image = user.image ?? (profile as { picture?: string } | undefined)?.picture ?? null;
        const identity = { googleId, name: user.name ?? null, image };

        const byGoogle = await findUserByGoogleId(googleId);
        if (byGoogle) {
          (user as { dbId?: string }).dbId = byGoogle.id;
          return true;
        }
        const byEmail = await findUserByEmail(email);
        if (byEmail) {
          await linkGoogleToUser(byEmail.id, identity);
          (user as { dbId?: string }).dbId = byEmail.id;
          return true;
        }
        const created = await createGoogleUser({ ...identity, email });
        (user as { dbId?: string }).dbId = created.id;
        return true;
      } catch (error) {
        console.error("[auth] Google sign-in failed:", error instanceof Error ? error.message : error);
        return false;
      }
    },

    async jwt({ token, user, account }) {
      if (user) {
        const dbId = (user as { dbId?: string; id?: string }).dbId ?? (user as { id?: string }).id;
        if (dbId) token.id = dbId;
      }
      if (account?.provider) token.provider = account.provider;
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.provider = token.provider;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
};
