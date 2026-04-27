import { NextResponse } from "next/server";

/** Non-sensitive flags for the sign-in UI. */
export async function GET() {
  return NextResponse.json({
    signInReady: Boolean(process.env.NEXTAUTH_SECRET?.trim()),
    googleAvailable:
      Boolean(process.env.GOOGLE_CLIENT_ID?.trim()) &&
      Boolean(process.env.GOOGLE_CLIENT_SECRET?.trim()) &&
      Boolean(process.env.NEXTAUTH_SECRET?.trim()),
  });
}
