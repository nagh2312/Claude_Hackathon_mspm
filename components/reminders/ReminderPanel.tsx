"use client";

import { useState } from "react";
import { sendJournalReminderEmail } from "@/lib/client/api";
import { useJournalReminders } from "@/lib/hooks/useJournalReminders";
import { useSession } from "next-auth/react";

export function ReminderPanel() {
  const reminders = useJournalReminders();
  const { data: session } = useSession();
  const [emailNote, setEmailNote] = useState<string | null>(null);
  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [emailPending, setEmailPending] = useState(false);

  const onEmailNudge = async () => {
    setEmailNote(null);
    setEmailErr(null);
    setEmailPending(true);
    try {
      const res = await sendJournalReminderEmail();
      if (!res.ok) {
        setEmailErr(res.error ?? "Email could not be sent.");
        return;
      }
      setEmailNote("Sent. Check your inbox (and spam) in a minute.");
    } catch (e) {
      setEmailErr(e instanceof Error ? e.message : "Email request failed.");
    } finally {
      setEmailPending(false);
    }
  };

  return (
    <section className="rounded-3xl border border-dashed border-zinc-300 bg-white/60 p-5 text-sm text-zinc-700">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Reminders</p>
      <div className="mt-3 grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <h3 className="font-medium text-zinc-900">Desktop notifications</h3>
          <p className="text-xs text-zinc-600">
            We will ping once a day at your chosen hour if you have not journaled yet, with a gentle historical nudge.
          </p>
          {reminders.permission === "unsupported" ? (
            <p className="text-xs text-amber-800">This browser doesn’t support notifications.</p>
          ) : (
            <button
              type="button"
              onClick={() => void reminders.requestPermission()}
              className="rounded-full border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-50"
            >
              {reminders.permission === "granted" ? "Notifications allowed ✓" : "Allow notifications"}
            </button>
          )}
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={reminders.enabled}
              onChange={(e) => reminders.setEnabled(e.target.checked)}
              disabled={reminders.permission !== "granted"}
            />
            Daily reminder at{" "}
            <select
              value={reminders.hour}
              onChange={(e) => reminders.setHour(Number(e.target.value))}
              className="rounded-md border border-zinc-300 bg-white px-2 py-1"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {String(i).padStart(2, "0")}:00
                </option>
              ))}
            </select>{" "}
            local time
          </label>
          <button
            type="button"
            onClick={reminders.sendTestNotification}
            disabled={reminders.permission !== "granted"}
            className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-40"
          >
            Send test desktop ping
          </button>
        </div>

        <div className="space-y-3">
          <h3 className="font-medium text-zinc-900">Email nudge</h3>
          <p className="text-xs text-zinc-600">
            Sends one engaging message to your Google address now. Automated daily sends need a cron job + verified
            domain in production.
          </p>
          <button
            type="button"
            onClick={() => void onEmailNudge()}
            disabled={!session?.user?.email || emailPending}
            className="rounded-full border border-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-900 hover:text-white disabled:opacity-40"
          >
            {emailPending ? "Sending…" : "Email me a nudge now"}
          </button>
          {!session?.user?.email ? (
            <p className="text-xs text-zinc-500">Sign in with Google to enable email nudges.</p>
          ) : null}
          {emailNote ? <p className="text-xs text-emerald-800">{emailNote}</p> : null}
          {emailErr ? <p className="text-xs text-rose-700">{emailErr}</p> : null}
        </div>
      </div>
    </section>
  );
}
