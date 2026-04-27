"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { registerAccount } from "@/lib/client/api";

type Mode = "signin" | "signup";

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [infoBanner, setInfoBanner] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [googleAvailable, setGoogleAvailable] = useState(false);
  const [signInReady, setSignInReady] = useState<boolean | null>(null);

  useEffect(() => {
    if (searchParams.get("verified") === "1") {
      setInfoBanner("Your email is verified. Sign in with your password below, or use Google if your team enabled it.");
    }
    const ve = searchParams.get("verifyError");
    if (ve === "invalid_or_expired") {
      setErrorBanner(
        "That verification link is invalid or has expired. Create your account again or ask for a new link from your host."
      );
    } else if (ve && ve !== "") {
      setErrorBanner("We could not complete verification from that link.");
    }
  }, [searchParams]);

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

  const onSignIn = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });
      if (res?.error) {
        setMessage(
          "That email or password does not match our records. If you just registered, open the verification link in your email first, then try again."
        );
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
  }, [email, password, router]);

  const onCreateAccount = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    setInfoBanner(null);
    setErrorBanner(null);
    try {
      const r = await registerAccount({
        name: name.trim(),
        email: email.trim(),
        password,
        passwordConfirm,
      });
      if (!r.ok) {
        setMessage(r.error ?? "Could not create your account.");
        setBusy(false);
        return;
      }
      if (r.needsEmailVerification) {
        setMessage(null);
        setInfoBanner(
          "Check your inbox for a verification link from Mind Canvas. After you verify, come back here and sign in with email and password or Google."
        );
        setPassword("");
        setPasswordConfirm("");
        setBusy(false);
        setMode("signin");
        return;
      }
      const res = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });
      if (res?.error) {
        setMessage("Account created, but sign-in failed. Try signing in manually.");
        setBusy(false);
        setMode("signin");
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }, [email, name, password, passwordConfirm, router]);

  if (signInReady === null) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-violet-700 via-fuchsia-700 to-sky-600 px-6 text-center text-white">
        <p className="text-sm text-white/90">Checking this site…</p>
      </main>
    );
  }

  if (!signInReady) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-violet-700 via-fuchsia-700 to-sky-600 px-6 py-12 text-center text-white">
        <h1 className="font-display text-3xl">Sign-in is not wired up on the live site yet</h1>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/90">
          Your laptop file <code className="rounded bg-white/15 px-1.5 py-0.5 text-xs">.env.local</code> does not
          travel to the internet. The host (for example Vercel) needs the same two values you use locally for secure
          sessions.
        </p>
        <ol className="mt-8 max-w-lg list-decimal space-y-3 pl-5 text-left text-sm text-white/90">
          <li>
            Open{" "}
            <a
              href="https://vercel.com/dashboard"
              className="font-semibold text-white underline underline-offset-2"
              target="_blank"
              rel="noreferrer"
            >
              Vercel
            </a>{" "}
            → your project → <strong>Settings</strong> →{" "}
            <a
              href="https://vercel.com/docs/projects/environment-variables"
              className="font-semibold text-white underline underline-offset-2"
              target="_blank"
              rel="noreferrer"
            >
              Environment Variables
            </a>
            .
          </li>
          <li>
            Add <code className="rounded bg-white/15 px-1 text-xs">NEXTAUTH_SECRET</code> with a long random string
            (copy the one from your local <code className="rounded bg-white/15 px-1 text-xs">.env.local</code>, or
            generate a new one and update local too).
          </li>
          <li>
            Add <code className="rounded bg-white/15 px-1 text-xs">NEXTAUTH_URL</code> set to this site&apos;s public
            URL, for example <code className="rounded bg-white/15 px-1 text-xs">https://your-app.vercel.app</code> (no
            path at the end).
          </li>
          <li>
            For accounts on Vercel, add <code className="rounded bg-white/15 px-1 text-xs">DATABASE_URL</code> (Neon
            or Vercel Postgres) and <code className="rounded bg-white/15 px-1 text-xs">RESEND_API_KEY</code> +{" "}
            <code className="rounded bg-white/15 px-1 text-xs">EMAIL_FROM</code> for verification email.
          </li>
          <li>
            For Google sign-in, add <code className="rounded bg-white/15 px-1 text-xs">GOOGLE_CLIENT_ID</code> and{" "}
            <code className="rounded bg-white/15 px-1 text-xs">GOOGLE_CLIENT_SECRET</code>, and add this URL in{" "}
            <a
              href="https://console.cloud.google.com/apis/credentials"
              className="font-semibold text-white underline underline-offset-2"
              target="_blank"
              rel="noreferrer"
            >
              Google Cloud OAuth
            </a>
            .
          </li>
          <li>
            Click <strong>Redeploy</strong> on the latest deployment so the new variables load.
          </li>
        </ol>
        <p className="mt-8 text-xs text-white/70">
          After that, refresh this page. If you are not the host, send them this short list.
        </p>
      </main>
    );
  }

  const signupValid =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 8 &&
    password === passwordConfirm;

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

        {errorBanner ? (
          <p className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-center text-sm text-rose-900">
            {errorBanner}
          </p>
        ) : null}
        {infoBanner ? (
          <p className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-sm text-emerald-900">
            {infoBanner}
          </p>
        ) : null}

        <div className="mt-8 space-y-4">
          {mode === "signup" ? (
            <label className="block text-sm font-medium text-zinc-700">
              Name
              <input
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-zinc-900 outline-none ring-violet-400 focus:ring-2"
                placeholder="How we should greet you"
              />
            </label>
          ) : null}
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
          {mode === "signup" ? (
            <label className="block text-sm font-medium text-zinc-700">
              Re-type password
              <input
                type="password"
                autoComplete="new-password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-zinc-900 outline-none ring-violet-400 focus:ring-2"
                placeholder="Same as above"
              />
            </label>
          ) : null}
          {message ? <p className="text-sm text-rose-600">{message}</p> : null}

          {mode === "signup" ? (
            <button
              type="button"
              disabled={busy || !signupValid}
              onClick={() => void onCreateAccount()}
              className="w-full rounded-full bg-zinc-900 py-3 text-sm font-semibold text-white shadow-lg hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Please wait…" : "Create account"}
            </button>
          ) : (
            <button
              type="button"
              disabled={busy || !email.trim() || !password}
              onClick={() => void onSignIn()}
              className="w-full rounded-full bg-zinc-900 py-3 text-sm font-semibold text-white shadow-lg hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Please wait…" : "Continue"}
            </button>
          )}
        </div>

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
          disabled={busy || !googleAvailable}
          onClick={() => void onGoogle()}
          title={!googleAvailable ? "Google sign-in needs GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET on the server." : undefined}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white py-3 text-sm font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="text-lg" aria-hidden>
            G
          </span>
          Continue with Google
        </button>
        {!googleAvailable ? (
          <p className="mt-2 text-center text-xs text-zinc-500">
            Google sign-in appears when your host adds <code className="rounded bg-zinc-100 px-1">GOOGLE_CLIENT_ID</code>{" "}
            and <code className="rounded bg-zinc-100 px-1">GOOGLE_CLIENT_SECRET</code> in the server environment.
          </p>
        ) : null}

        <p className="mt-8 text-center text-xs text-zinc-500">
          By continuing you agree this is a wellness style journal, not medical care. Need the science version? Ask your
          team for their privacy note.
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-violet-700 via-fuchsia-700 to-sky-600 px-6 text-center text-white">
          <p className="text-sm text-white/90">Loading…</p>
        </main>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
