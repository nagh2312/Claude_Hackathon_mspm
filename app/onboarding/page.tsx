"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveUserProfile } from "@/lib/client/api";
import type { MascotArchetype } from "@/lib/domain/user-profile";
import { CompanionMascot } from "@/components/mascot/CompanionMascot";

type Choice = { id: string; label: string; scores: Partial<Record<MascotArchetype, number>> };

const Q1: Choice[] = [
  { id: "morning", label: "Early light, slow coffee", scores: { zen: 2, planner: 1 } },
  { id: "night", label: "Late hours, big ideas", scores: { explorer: 2, spark: 1 } },
  { id: "steady", label: "Whenever the day allows", scores: { planner: 1, zen: 1 } },
];

const Q2: Choice[] = [
  { id: "talk", label: "Call someone I trust", scores: { spark: 2, explorer: 1 } },
  { id: "quiet", label: "Hide under blankets or a quiet corner", scores: { zen: 2 } },
  { id: "write", label: "Pour it into a page", scores: { planner: 2, explorer: 1 } },
  { id: "move", label: "Walk, stretch, shake it out", scores: { explorer: 2, spark: 1 } },
];

const Q3: Choice[] = [
  { id: "soft", label: "Pastels, open sky, linen", scores: { zen: 2 } },
  { id: "bold", label: "Neon, contrast, loud music", scores: { spark: 2 } },
  { id: "earth", label: "Wood, plants, warm brown", scores: { explorer: 2 } },
  { id: "grid", label: "Clean lines, lists, tidy desk", scores: { planner: 2 } },
];

const Q4: Choice[] = [
  { id: "solo", label: "Alone time fills my cup", scores: { zen: 2, explorer: 1 } },
  { id: "mix", label: "A little of both", scores: { planner: 1, zen: 1 } },
  { id: "people", label: "People charge me up", scores: { spark: 2 } },
];

function pickArchetype(answers: string[]): MascotArchetype {
  const totals: Record<MascotArchetype, number> = {
    explorer: 0,
    zen: 0,
    planner: 0,
    spark: 0,
  };
  const all: { choices: Choice[]; answer: string }[] = [
    { choices: Q1, answer: answers[0] ?? "" },
    { choices: Q2, answer: answers[1] ?? "" },
    { choices: Q3, answer: answers[2] ?? "" },
    { choices: Q4, answer: answers[3] ?? "" },
  ];
  for (const { choices, answer } of all) {
    const c = choices.find((x) => x.id === answer);
    if (!c?.scores) continue;
    (Object.keys(c.scores) as MascotArchetype[]).forEach((k) => {
      totals[k] += c.scores[k] ?? 0;
    });
  }
  let best: MascotArchetype = "explorer";
  let max = -1;
  (Object.keys(totals) as MascotArchetype[]).forEach((k) => {
    if (totals[k] > max) {
      max = totals[k];
      best = k;
    }
  });
  return best;
}

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("redo") === "1") {
      setStep(0);
      setAnswers([]);
    }
  }, [searchParams]);

  const questions = useMemo(
    () => [
      { title: "When does your brain feel kindest?", subtitle: "No wrong answer.", choices: Q1 },
      { title: "When the day feels heavy, what helps first?", subtitle: "Pick what you reach for most.", choices: Q2 },
      { title: "Which world feels most like you?", subtitle: "Trust your gut aesthetic.", choices: Q3 },
      { title: "How do you refill your social battery?", subtitle: "Be honest, not polite.", choices: Q4 },
    ],
    []
  );

  const archetype = useMemo(() => pickArchetype(answers), [answers]);

  const onPick = useCallback(
    (id: string) => {
      const next = [...answers];
      next[step] = id;
      setAnswers(next);
      if (step < questions.length - 1) setStep((s) => s + 1);
      else setStep(questions.length);
    },
    [answers, questions.length, step]
  );

  const finish = useCallback(async () => {
    setBusy(true);
    setErr(null);
    try {
      const tags = answers.filter(Boolean);
      await saveUserProfile({
        onboardingComplete: true,
        archetype,
        tags,
      });
      router.replace("/");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save. Try again.");
    } finally {
      setBusy(false);
    }
  }, [answers, archetype, router]);

  const current = step < questions.length ? questions[step] : null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-500 px-4 py-12 text-white sm:px-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-10 lg:flex-row lg:items-center">
        <div className="flex-1 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">Mind Canvas</p>
          <h1 className="font-display text-3xl sm:text-4xl">Let us meet the version of you that shows up here</h1>
          <p className="text-sm text-white/85">
            Four tiny questions shape your on screen buddy. You can revisit this later in settings.
          </p>
          {err ? <p className="text-sm text-amber-200">{err}</p> : null}
        </div>
        <div className="flex flex-1 flex-col items-center gap-6">
          <CompanionMascot archetype={archetype} mood="gentle" caption="This little one is yours to keep." />
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-xl rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-md sm:p-8">
        {current ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
              Question {step + 1} of {questions.length}
            </p>
            <h2 className="mt-2 font-display text-2xl text-white">{current.title}</h2>
            <p className="mt-1 text-sm text-white/80">{current.subtitle}</p>
            <div className="mt-6 grid gap-3">
              {current.choices.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onPick(c.id)}
                  className="rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-left text-sm font-medium text-white transition hover:bg-white/20"
                >
                  {c.label}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-4 text-center">
            <h2 className="font-display text-2xl text-white">Lovely. Your companion is ready.</h2>
            <p className="text-sm text-white/85">We will use this vibe to tint buttons, cards, and nudges, never to label you.</p>
            <button
              type="button"
              disabled={busy || answers.filter(Boolean).length < 4}
              onClick={() => void finish()}
              className="mt-4 w-full rounded-full bg-white py-3 text-sm font-semibold text-violet-700 shadow-lg hover:bg-zinc-50 disabled:opacity-50"
            >
              {busy ? "Saving…" : "Enter Mind Canvas"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
