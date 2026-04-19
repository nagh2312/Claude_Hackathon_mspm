import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const googleConfigured =
  Boolean(process.env.GOOGLE_CLIENT_ID?.trim()) && Boolean(process.env.GOOGLE_CLIENT_SECRET?.trim());

export const authOptions: NextAuthOptions = {
  providers: googleConfigured
    ? [
        GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
      ]
    : [],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    jwt({ token, profile }) {
      if (profile && typeof profile === "object" && "sub" in profile && typeof profile.sub === "string") {
        token.uid = profile.sub;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (typeof token.uid === "string" && token.uid) || token.sub || "";
      }
      return session;
    },
  },
};

export function isGoogleAuthConfigured(): boolean {
  return googleConfigured && Boolean(process.env.NEXTAUTH_SECRET?.trim());
}
