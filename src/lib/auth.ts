import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import Apple from "next-auth/providers/apple";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Every OAuth provider below is only registered if its credentials are
// actually configured — none of Google/Apple/Facebook work out of the box.
// Each requires the SITE OWNER to create their own app in that provider's
// developer console (Google Cloud Console, Apple Developer Program, Meta for
// Developers) and add the resulting client id/secret to the environment.
// This mirrors how Tango Card and Kit.com were wired elsewhere in this repo:
// present in code, inert until real credentials exist. See NEXT_STEPS below.
const providers: NextAuthConfig["providers"] = [
  Credentials({
    name: "Email and password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const email = credentials?.email;
      const password = credentials?.password;
      if (typeof email !== "string" || typeof password !== "string") return null;

      const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      // Also rejects OAuth-only accounts (passwordHash is null) — they must
      // sign in with the provider they registered with.
      if (!user || !user.passwordHash) return null;

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) return null;

      return {
        id: user.id,
        email: user.email,
        name: [user.firstName, user.lastName].filter(Boolean).join(" ") || null,
        firstName: user.firstName,
        lastName: user.lastName,
      };
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(Google({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET }));
}
if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
  providers.push(Facebook({ clientId: process.env.FACEBOOK_CLIENT_ID, clientSecret: process.env.FACEBOOK_CLIENT_SECRET }));
}
if (process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET) {
  // APPLE_CLIENT_SECRET here is the pre-generated signed JWT Apple's flow
  // requires (built from a Services ID + Team ID + Key ID + .p8 private key
  // from the Apple Developer Portal) — Auth.js does not generate this for
  // you, and neither can we without your Apple Developer account.
  providers.push(Apple({ clientId: process.env.APPLE_CLIENT_ID, clientSecret: process.env.APPLE_CLIENT_SECRET }));
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // Required alongside the Credentials provider — Auth.js can't persist a
  // database session for credentials logins, only for OAuth ones. The
  // adapter above is still used for Google/Apple/Facebook account linking.
  session: { strategy: "jwt" },
  pages: {
    signIn: "/", // we open the AuthModal instead of a dedicated page
  },
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.firstName = (user as { firstName?: string | null }).firstName ?? null;
        token.lastName = (user as { lastName?: string | null }).lastName ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.firstName = (token.firstName as string | null) ?? null;
        session.user.lastName = (token.lastName as string | null) ?? null;
      }
      return session;
    },
  },
});
