"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useAppFlags } from "@/components/providers/AppProviders";

export function AuthBar() {
  const { data: session, status } = useSession();
  const { googleAuthEnabled } = useAppFlags();

  if (status === "loading") {
    return <p className="text-xs text-zinc-500">Checking sign-in…</p>;
  }

  if (!googleAuthEnabled) {
    return (
      <p className="max-w-xs text-xs text-amber-800">
        Cloud journals need Google OAuth env vars: <code className="rounded bg-amber-100 px-1">GOOGLE_CLIENT_ID</code>,{" "}
        <code className="rounded bg-amber-100 px-1">GOOGLE_CLIENT_SECRET</code>,{" "}
        <code className="rounded bg-amber-100 px-1">NEXTAUTH_SECRET</code>, and{" "}
        <code className="rounded bg-amber-100 px-1">NEXTAUTH_URL</code>.
      </p>
    );
  }

  if (!session?.user) {
    return (
      <button
        type="button"
        onClick={() => void signIn("google")}
        className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50"
      >
        Sign in with Google
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <p className="text-xs text-zinc-600">
        Signed in as <span className="font-medium text-zinc-900">{session.user.email ?? "your Google account"}</span>
      </p>
      <button
        type="button"
        onClick={() => void signOut({ callbackUrl: "/" })}
        className="rounded-full border border-transparent px-3 py-1 text-xs font-semibold text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline"
      >
        Sign out
      </button>
    </div>
  );
}
