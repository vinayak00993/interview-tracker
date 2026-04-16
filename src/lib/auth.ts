import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import {
  findUserByEmail,
  findUserByGoogleId,
  createGoogleUser,
  linkGoogleToUser,
} from "./db";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.error("[auth] Missing credentials");
            return null;
          }

          console.log("[auth] Looking up user:", credentials.email);
          const user = await findUserByEmail(credentials.email);
          if (!user) {
            console.error("[auth] User not found:", credentials.email);
            return null;
          }

          if (!user.passwordHash) {
            console.error("[auth] User has no password — Google-only account:", credentials.email);
            return null;
          }

          console.log("[auth] User found, checking password");
          const isValid = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          );
          if (!isValid) {
            console.error("[auth] Invalid password");
            return null;
          }

          console.log("[auth] Login successful for:", user.email);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        } catch (error) {
          console.error("[auth] Authorize error:", error);
          return null;
        }
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          // offline = returns a refresh_token so we can call the Calendar
          // API later without the user being present. prompt=consent forces
          // Google to re-issue the refresh token on every sign-in, which we
          // want while developing / swapping scopes.
          access_type: "offline",
          prompt: "consent",
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/calendar.events.readonly",
          ].join(" "),
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    /**
     * Runs AFTER Google successfully authenticates and BEFORE the JWT
     * is issued. Here we:
     *   - Look up an existing User by googleId → reuse
     *   - Else look up by email → link Google to the existing account
     *   - Else create a new Google-only user
     * Then we stash the DB user id back on the `user` object so the
     * `jwt` callback can pick it up.
     */
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") {
        return true; // Credentials provider — already handled in authorize()
      }

      try {
        const googleId = account.providerAccountId;
        const email = user.email;
        if (!email || !googleId) {
          console.error("[auth] Google signIn missing email or googleId");
          return false;
        }

        const scopes = (account.scope as string | undefined) ?? null;
        const accessToken = (account.access_token as string | undefined) ?? null;
        const refreshToken = (account.refresh_token as string | undefined) ?? null;
        const expiresAt = (account.expires_at as number | undefined) ?? null;
        const image = (user.image as string | undefined) ?? ((profile as { picture?: string } | undefined)?.picture ?? null);

        // 1. Already have a googleId match → just refresh tokens
        const byGoogle = await findUserByGoogleId(googleId);
        if (byGoogle) {
          await linkGoogleToUser(byGoogle.id, {
            googleId,
            name: user.name ?? null,
            image: image ?? null,
            accessToken,
            refreshToken,
            expiresAt,
            scopes,
          });
          (user as { dbId?: string }).dbId = byGoogle.id;
          return true;
        }

        // 2. Existing email-password account → link Google to it
        const byEmail = await findUserByEmail(email);
        if (byEmail) {
          await linkGoogleToUser(byEmail.id, {
            googleId,
            name: user.name ?? null,
            image: image ?? null,
            accessToken,
            refreshToken,
            expiresAt,
            scopes,
          });
          (user as { dbId?: string }).dbId = byEmail.id;
          return true;
        }

        // 3. Brand new — create Google-only user
        const created = await createGoogleUser({
          googleId,
          email,
          name: user.name ?? null,
          image: image ?? null,
          accessToken,
          refreshToken,
          expiresAt,
          scopes,
        });
        (user as { dbId?: string }).dbId = created.id;
        return true;
      } catch (error) {
        console.error("[auth] Google signIn error:", error);
        return false;
      }
    },

    async jwt({ token, user, account }) {
      // First sign-in — stash DB id on the token
      if (user) {
        const dbId = (user as { dbId?: string; id?: string }).dbId ?? (user as { id?: string }).id;
        if (dbId) token.id = dbId;
      }
      // Carry the provider through so the client can show
      // "connected as google" hints
      if (account?.provider) {
        token.provider = account.provider;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string | undefined;
        (session.user as { provider?: string }).provider = token.provider as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
