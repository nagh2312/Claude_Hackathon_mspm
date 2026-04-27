import { Resend } from "resend";
import { getPublicAppOrigin } from "@/lib/server/public-app-url";

export async function sendSignupVerificationEmail(to: string, token: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return { ok: false, error: "RESEND_API_KEY is not set." };

  const from =
    process.env.EMAIL_FROM?.trim() || "Mind Canvas <onboarding@resend.dev>";
  const origin = getPublicAppOrigin();
  const link = `${origin}/api/verify-email?token=${encodeURIComponent(token)}`;

  const resend = new Resend(key);
  const { error } = await resend.emails.send({
    from,
    to,
    subject: "Verify your Mind Canvas email",
    html: `
      <p>Hi,</p>
      <p>Thanks for signing up. Confirm your email to finish creating your account:</p>
      <p><a href="${link}">Verify my email</a></p>
      <p>If you did not sign up, you can ignore this message.</p>
    `,
  });

  if (error) return { ok: false, error: error.message ?? "Resend rejected the send." };
  return { ok: true };
}
