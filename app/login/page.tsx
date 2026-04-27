"use client";

import { useCallback, useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { registerAccount } from "@/lib/client/api";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [googleAvailable, setGoogleAvailable] = useState(false);
  const [signInReady, setSignInReady] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/public-config");
        const data = (await res.json()) as { googleAvailable?: boolean; signInReady?: boolean };
        setGoogleAvailable(Boolean(data.googleAvailable));
        setSignInReady(Boolean(data.signInReady));
      } catch {
        setSignInReady(false);
      }
    })();
  }, []);

  const onGoogle = useCallback(() => {
    setMessage(null);
    void signIn("google", { callbackUrl: "/" });
  }, []);

  const onEmailAuth = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    try {
      if (mode === "signup") {
        const r = await registerAccount({ email, password });
        if (!r.ok) {
          setMessage(r.error ?? "Could not create your account.");
          setBusy(false);
          return;
        }
      }
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        setMessage(mode === "signin" ? "That email or password does not match our records." : "Could not sign you in.");
        setBusy(false);
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }, [email, password, mode, router]);

  if (!signInReady) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-violet-700 via-fuchsia-700 to-sky-600 px-6 text-center text-white">
        <h1 className="font-display text-3xl">Mind Canvas is almost ready</h1>
        <p className="mt-4 max-w-md text-sm text-white/85">
          The person hosting this app still needs to finish one quick server setup so sign in can work safely. Check
          back soon, or ask your teammate to finish the launch checklist.
        </p>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-violet-700 via-fuchsia-600 to-cyan-500 px-4 py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/25 via-transparent to-transparent" />
      <div className="relative w-full max-w-md rounded-3xl border border-white/25 bg-white/95 p-8 shadow-2xl backdrop-blur-sm">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">Mind Canvas</p>
        <h1 className="mt-2 text-center font-display text-3xl text-zinc-900">Find your way in</h1>
        <p className="mt-2 text-center text-sm text-zinc-600">
          A calm corner for daily journaling, gentle prompts, and a little companion that cheers you on.
        </p>

        <div className="mt-8 flex rounded-full bg-zinc-100 p-1">
          <button
            type="button"
            className={`flex-1 rounded-full py-2 text-sm font-semibold ${
              mode === "signin" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-600"
            }`}
            onClick={() => {
              setMode("signin");
              setMessage(null);
            }}
          >
            Sign in
          </button>
          <button
            type="button"
            className={`flex-1 rounded-full py-2 text-sm font-semibold ${
              mode === "signup" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-600"
            }`}
            onClick={() => {
              setMode("signup");
              setMessage(null);
            }}
          >
            Create account
          </button>
        </div>

        <div className="mt-8 space-y-4">
          <label className="block text-sm font-medium text-zinc-700">
            Email
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-zinc-900 outline-none ring-violet-400 focus:ring-2"
              placeholder="you@example.com"
            />
          </label>
          <label className="block text-sm font-medium text-zinc-700">
            Password
            <input
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-zinc-900 outline-none ring-violet-400 focus:ring-2"
              placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
            />
          </label>
          {message ? <p className="text-sm text-rose-600">{message}</p> : null}
          <button
            type="button"
            disabled={busy || !email.trim() || !password}
            onClick={() => void onEmailAuth()}
            className="w-full rounded-full bg-zinc-900 py-3 text-sm font-semibold text-white shadow-lg hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Please wait…" : mode === "signup" ? "Create and continue" : "Continue"}
          </button>
        </div>

        {googleAvailable ? (
          <>
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wide text-zinc-400">
                <span className="bg-white/95 px-3">or</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onGoogle}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white py-3 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50"
            >
              <span className="text-lg" aria-hidden>
                G
              </span>
              Continue with Google
            </button>
          </>
        ) : null}

        <p className="mt-8 text-center text-xs text-zinc-500">
          By continuing you agree this is a wellness style journal, not medical care. Need the science version? Ask your
          team for their privacy note.
        </p>
      </div>
    </main>
  );
}
