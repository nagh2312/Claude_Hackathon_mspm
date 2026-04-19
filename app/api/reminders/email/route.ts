import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Resend } from "resend";
import { authOptions } from "@/lib/auth/options";
import { buildJournalReminderEmail } from "@/lib/services/reminder-email";

export const runtime = "nodejs";

export async function POST() {
  const session = await getServerSession(authOptions);
  const to = session?.user?.email;
  if (!to) {
    return NextResponse.json({ error: "Sign in so we know where to send your reminder." }, { status: 401 });
  }

  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim() || "Reflection Journal <onboarding@resend.dev>";

  if (!key) {
    return NextResponse.json(
      {
        error:
          "Email reminders need RESEND_API_KEY (and optionally EMAIL_FROM) in your server environment. Desktop reminders still work in the browser.",
        configured: false,
      },
      { status: 503 }
    );
  }

  const resend = new Resend(key);
  const { subject, html } = buildJournalReminderEmail();

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject,
    html,
  });

  if (error) {
    return NextResponse.json({ error: error.message ?? "Resend rejected the send." }, { status: 502 });
  }

  return NextResponse.json({ ok: true, id: data?.id });
}
