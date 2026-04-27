import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createPlatformUser } from "@/lib/server/platform-users";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password should be at least 8 characters." }, { status: 400 });
    }
    const hash = await bcrypt.hash(password, 12);
    const user = await createPlatformUser(email, hash);
    return NextResponse.json({ ok: true, id: user.id });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not create account.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
