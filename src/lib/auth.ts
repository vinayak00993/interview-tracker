import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { findUserByEmail } from "./db";

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
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
