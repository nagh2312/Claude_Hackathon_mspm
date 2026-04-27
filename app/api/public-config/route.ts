import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function productionNextAuthUrl(): boolean {
  const u = process.env.NEXTAUTH_URL?.trim() ?? "";
  if (!u.startsWith("https://")) return false;
  if (/localhost|127\.0\.0\.1/i.test(u)) return false;
  return true;
}

/** Non-sensitive flags for the sign-in UI. */
export async function GET() {
  const secretOk = Boolean(process.env.NEXTAUTH_SECRET?.trim());
  const urlOk = productionNextAuthUrl();
  const signInReady = secretOk && urlOk;

  return NextResponse.json(
    {
      signInReady,
      googleAvailable:
        Boolean(process.env.GOOGLE_CLIENT_ID?.trim()) &&
        Boolean(process.env.GOOGLE_CLIENT_SECRET?.trim()) &&
        secretOk,
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
