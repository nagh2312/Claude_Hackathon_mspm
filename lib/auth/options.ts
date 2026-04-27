import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { findUserByEmail } from "@/lib/server/platform-users";

const googleConfigured =
  Boolean(process.env.GOOGLE_CLIENT_ID?.trim()) && Boolean(process.env.GOOGLE_CLIENT_SECRET?.trim());

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString().trim().toLowerCase();
        const password = credentials?.password?.toString() ?? "";
        if (!email || !password) return null;
        const user = await findUserByEmail(email);
        if (!user) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;
        if (!user.emailVerifiedAt) return null;
        const display = user.name?.trim() || user.email.split("@")[0] || "there";
        return { id: user.id, email: user.email, name: display };
      },
    }),
    ...(googleConfigured
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
              params: {
                prompt: "consent",
                access_type: "offline",
                response_type: "code",
                scope:
                  "openid email profile https://www.googleapis.com/auth/drive.appdata",
              },
            },
          }),
        ]
      : []),
  ],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.uid = user.id;
        token.sub = user.id;
      }
      if (account) {
        token.provider = account.provider;
        if (account.provider === "google") {
          if (account.refresh_token) {
            token.refresh_token = account.refresh_token as string;
          }
          if (account.access_token) token.access_token = account.access_token as string;
          if (account.expires_at) token.access_token_expires = account.expires_at;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id =
          (typeof token.uid === "string" && token.uid) ||
          (typeof token.sub === "string" && token.sub) ||
          "";
        session.user.provider = typeof token.provider === "string" ? token.provider : undefined;
      }
      return session;
    },
  },
};

export function isGoogleAuthConfigured(): boolean {
  return googleConfigured && Boolean(process.env.NEXTAUTH_SECRET?.trim());
}

export function isAuthConfigured(): boolean {
  return Boolean(process.env.NEXTAUTH_SECRET?.trim());
}
