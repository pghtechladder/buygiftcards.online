import { DefaultSession } from "next-auth";

// Extends next-auth's built-in Session/User types with the fields our
// callbacks in src/lib/auth.ts actually attach (see the jwt/session
// callbacks) — without this, session.user.id etc. are typed as unknown.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      firstName: string | null;
      lastName: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    firstName?: string | null;
    lastName?: string | null;
  }
}
