import { NextResponse } from "next/server";
import { verifyEmailToken } from "@/lib/server/platform-users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** One-click link from the verification email. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? "";
  const result = await verifyEmailToken(token);
  const dest = new URL("/login", url.origin);
  if (result.ok) dest.searchParams.set("verified", "1");
  else dest.searchParams.set("verifyError", result.reason);
  return NextResponse.redirect(dest);
}
