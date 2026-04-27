"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export default function SettingsPage() {
  const { data: session } = useSession();

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-50 to-white px-4 py-12 sm:px-8">
      <div className="mx-auto max-w-lg space-y-8">
        <div>
          <Link href="/home" className="text-sm font-medium text-violet-600 hover:text-violet-800">
            Back to Mind Canvas
          </Link>
          <h1 className="mt-4 font-display text-3xl text-zinc-900">Settings</h1>
          <p className="mt-2 text-sm text-zinc-600">Account basics, the way many apps keep it simple.</p>
        </div>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900">Account</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Signed in as <span className="font-medium text-zinc-900">{session?.user?.email ?? "your account"}</span>
          </p>
          <button
            type="button"
            onClick={() => void signOut({ callbackUrl: "/login" })}
            className="mt-4 w-full rounded-full border border-zinc-200 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
          >
            Log out
          </button>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900">Your companion</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Want to redo the personality questions and refresh your little character&apos;s vibe?
          </p>
          <Link
            href="/onboarding?redo=1"
            className="mt-4 inline-flex rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
          >
            Update personality quiz
          </Link>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900">General</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Quiet hours, reminders, and email nudges still live on your main canvas under the reminders card. We kept
            this page calm on purpose.
          </p>
        </section>
      </div>
    </main>
  );
}
