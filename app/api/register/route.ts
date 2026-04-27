import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createPlatformUser } from "@/lib/server/platform-users";
import { sendSignupVerificationEmail } from "@/lib/server/send-verification-email";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      name?: string;
      email?: string;
      password?: string;
      passwordConfirm?: string;
    };
    const name = body.name?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";
    const passwordConfirm = body.passwordConfirm ?? "";

    if (!name || name.length > 120) {
      return NextResponse.json({ error: "Please enter your name (max 120 characters)." }, { status: 400 });
    }
    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password should be at least 8 characters." }, { status: 400 });
    }
    if (password !== passwordConfirm) {
      return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
    }

    const onVercel = process.env.VERCEL === "1";
    const hasResend = Boolean(process.env.RESEND_API_KEY?.trim());
    const hasDatabase = Boolean(process.env.DATABASE_URL?.trim());

    if (onVercel && !hasDatabase) {
      return NextResponse.json(
        {
          error:
            "This host needs a database to store accounts. In Vercel, add DATABASE_URL (create a Neon or Vercel Postgres database), redeploy, then try again.",
        },
        { status: 503 }
      );
    }
    if (onVercel && !hasResend) {
      return NextResponse.json(
        {
          error:
            "Email verification needs Resend. Add RESEND_API_KEY and EMAIL_FROM in Vercel Environment Variables, redeploy, then try again.",
        },
        { status: 503 }
      );
    }

    const autoVerify = !hasResend;
    const hash = await bcrypt.hash(password, 12);
    const verificationToken = randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const user = await createPlatformUser({
      email,
      passwordHash: hash,
      name,
      verificationToken,
      verificationExpires,
      autoVerify,
    });

    if (!autoVerify) {
      const sent = await sendSignupVerificationEmail(user.email, verificationToken);
      if (!sent.ok) {
        return NextResponse.json(
          { error: sent.error || "Could not send verification email. Try again later." },
          { status: 502 }
        );
      }
    }

    return NextResponse.json({
      ok: true,
      id: user.id,
      needsEmailVerification: !autoVerify,
      devAutoVerified: autoVerify && hasResend === false,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not create account.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
