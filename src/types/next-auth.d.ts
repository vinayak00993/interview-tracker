import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      provider?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    provider?: string;
  }
}
