"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { HomeDashboard } from "@/components/home/HomeDashboard";
import { CompanionMascot } from "@/components/mascot/CompanionMascot";
import { fetchCloudJournals, fetchUserProfile } from "@/lib/client/api";
import type { MascotArchetype } from "@/lib/domain/user-profile";
import { computeJournalStreak } from "@/lib/services/streak";

export default function HomePage() {
  const { data: session, status } = useSession();
  const [archetype, setArchetype] = useState<MascotArchetype>("explorer");
  const [streak, setStreak] = useState(0);
  const [welcome, setWelcome] = useState("Welcome back. Your canvas missed you.");

  const load = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const { profile } = await fetchUserProfile();
      if (profile?.archetype) setArchetype(profile.archetype);
      const entries = await fetchCloudJournals();
      setStreak(computeJournalStreak(entries));
      const name = session.user.name ?? session.user.email?.split("@")[0] ?? "friend";
      setWelcome(`Hi ${name}. However today felt, you made it here.`);
    } catch {
      setWelcome("Welcome back. Take a breath before you write if you need one.");
    }
  }, [session?.user?.id, session?.user?.name, session?.user?.email]);

  useEffect(() => {
    if (status === "authenticated") void load();
  }, [status, load]);

  return (
    <main className="min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-fuchsia-600 to-sky-500 px-4 pb-16 pt-10 text-white sm:px-8 sm:pb-20 sm:pt-14">
        <div className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-amber-300/30 blur-3xl" />
        <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl space-y-3 text-center lg:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">Mind Canvas</p>
            <h1 className="font-display text-3xl leading-tight sm:text-4xl">{welcome}</h1>
            <p className="text-sm text-white/85">
              Your daily journal stays with your account. If you choose Google sign in, a private backup travels with
              the Google profile you used, so your words feel a little more portable.
            </p>
          </div>
          {status === "authenticated" ? (
            <CompanionMascot archetype={archetype} mood="welcome" streak={streak} />
          ) : null}
        </div>
      </section>
      <div className="bg-gradient-to-b from-zinc-50 to-white px-4 py-10 sm:px-8">
        <HomeDashboard />
      </div>
    </main>
  );
}
