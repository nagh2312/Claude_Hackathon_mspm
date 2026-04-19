"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import type { AnalysisResult, CaptureMode, ProcessEntryResponse, StoredEntry } from "@/lib/domain/types";
import { processEntry } from "@/lib/client/api";
import { saveEntry, loadEntries } from "@/lib/services/persistence";
import { CapturePhase } from "@/components/phases/CapturePhase";
import { CrisisSupportPhase } from "@/components/phases/CrisisSupportPhase";
import { CreativeOutcomePhase } from "@/components/phases/CreativeOutcomePhase";
import { NurturePhase } from "@/components/phases/NurturePhase";
import { ReflectGarden } from "@/components/phases/ReflectGarden";
import { CompanionChat } from "@/components/companion/CompanionChat";
import { DailyJournalCloud } from "@/components/journal/DailyJournalCloud";
import { AuthBar } from "@/components/auth/AuthBar";
import { ReminderPanel } from "@/components/reminders/ReminderPanel";
import { buildAppMoodShell, defaultAppMoodShell } from "@/lib/services/app-mood-shell";

type View = "companion" | "flow" | "garden" | "daily";

export default function HomePage() {
  const [view, setView] = useState<View>("flow");
  const [phase, setPhase] = useState<"capture" | "processing" | "outcome">("capture");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessEntryResponse | null>(null);
  const [pendingPayload, setPendingPayload] = useState<{
    captureMode: CaptureMode;
    text: string;
    imageBase64?: string;
    imageMime?: string;
  } | null>(null);
  const [savedNote, setSavedNote] = useState<string | null>(null);
  const [entries, setEntries] = useState<StoredEntry[]>([]);
  const [isPending, startTransition] = useTransition();
  const [moodShell, setMoodShell] = useState(defaultAppMoodShell);

  const applyMoodFromAnalysis = useCallback((analysis: AnalysisResult) => {
    setMoodShell(buildAppMoodShell(analysis));
  }, []);

  const refreshEntries = useCallback(() => {
    setEntries(loadEntries());
  }, []);

  useEffect(() => {
    refreshEntries();
  }, [refreshEntries]);

  useEffect(() => {
    if (result?.analysis) {
      applyMoodFromAnalysis(result.analysis);
    }
  }, [result, applyMoodFromAnalysis]);

  const handleSubmit = useCallback(
    (payload: {
      captureMode: CaptureMode;
      text: string;
      imageBase64?: string;
      imageMime?: string;
    }) => {
      setError(null);
      setSavedNote(null);
      setPendingPayload(payload);
      setPhase("processing");
      startTransition(async () => {
        try {
          const res = await processEntry({
            captureMode: payload.captureMode,
            text: payload.text,
            imageBase64: payload.imageBase64,
            imageMime: payload.imageMime,
          });
          setResult(res);
          setPhase("outcome");
        } catch (e) {
          setError(e instanceof Error ? e.message : "Something went wrong");
          setPhase("capture");
        }
      });
    },
    []
  );

  const handleSave = useCallback(() => {
    if (!result || !pendingPayload) return;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `entry-${Date.now()}`;
    const record: StoredEntry = {
      id,
      createdAt: new Date().toISOString(),
      captureMode: pendingPayload.captureMode,
      rawText: pendingPayload.text,
      normalizedText: result.normalizedText,
      analysis: result.analysis,
      fork: result.fork,
      visual: result.visual,
      nurture: result.nurture,
    };
    saveEntry(record);
    setSavedNote("Saved locally for your Reflection Garden.");
    refreshEntries();
  }, [pendingPayload, result, refreshEntries]);

  const handleReset = useCallback(() => {
    setPhase("capture");
    setResult(null);
    setPendingPayload(null);
    setError(null);
    setSavedNote(null);
    setMoodShell(defaultAppMoodShell);
  }, []);

  const outcome = useMemo(() => {
    if (!result) return null;
    if (result.fork === "crisis") {
      return <CrisisSupportPhase />;
    }
    return (
      <div className="space-y-10">
        <CreativeOutcomePhase result={result} />
        {result.nurture ? <NurturePhase suggestion={result.nurture} /> : null}
      </div>
    );
  }, [result]);

  const navButton = (id: View, label: string) => (
    <button
      type="button"
      className={`rounded-full px-4 py-2 text-sm font-medium ${
        view === id ? "bg-zinc-900 text-white" : "text-zinc-600 hover:text-zinc-900"
      }`}
      onClick={() => {
        if (id === "garden") refreshEntries();
        setView(id);
      }}
    >
      {label}
    </button>
  );

  return (
    <main className="min-h-screen px-4 py-10 sm:px-8" style={moodShell.shellStyle}>
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">Reflection Journal</p>
            <h1 className="mt-2 font-display text-4xl text-zinc-900">Space that shifts with how you feel</h1>
          </div>
          <AuthBar />
        </header>

        <div
          className="rounded-2xl border px-4 py-3 text-sm text-zinc-800 sm:px-5"
          style={{
            ...moodShell.surfaceStyle,
            borderLeftWidth: 4,
            borderLeftColor: moodShell.accent,
            borderTopColor: moodShell.surfaceStyle.borderColor as string,
            borderRightColor: moodShell.surfaceStyle.borderColor as string,
            borderBottomColor: moodShell.surfaceStyle.borderColor as string,
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Feeling summary (feature 2)</p>
          <p className="mt-1 text-sm font-medium text-zinc-900">{moodShell.feelingTag}</p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-700">{moodShell.moodSummary}</p>
          <p className="mt-3 text-xs text-zinc-500">
            After you process an entry or chat with the companion, gradients and cards shift to match the tone of your
            words.
          </p>
        </div>

        <section className="rounded-2xl border border-zinc-200 bg-white/70 p-4 text-sm text-zinc-700 shadow-sm sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">What you can do here</p>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            <li>
              <button
                type="button"
                className="text-left font-medium text-zinc-900 underline decoration-zinc-300 decoration-2 underline-offset-2 hover:decoration-zinc-900"
                onClick={() => setView("companion")}
              >
                Feature 1 — AI companion chat
              </button>
              <p className="mt-1 text-xs text-zinc-600">Open the Companion tab for a warm back-and-forth.</p>
            </li>
            <li>
              <button
                type="button"
                className="text-left font-medium text-zinc-900 underline decoration-zinc-300 decoration-2 underline-offset-2 hover:decoration-zinc-900"
                onClick={() => setView("flow")}
              >
                Today’s flow — text, voice &amp; photo
              </button>
              <p className="mt-1 text-xs text-zinc-600">
                Voice and photo capture live in this tab (pick ✎ Text, 🎤 Voice, or 📷 Photo in the card).
              </p>
            </li>
            <li>
              <button
                type="button"
                className="text-left font-medium text-zinc-900 underline decoration-zinc-300 decoration-2 underline-offset-2 hover:decoration-zinc-900"
                onClick={() => {
                  refreshEntries();
                  setView("garden");
                }}
              >
                Reflection Garden
              </button>
              <p className="mt-1 text-xs text-zinc-600">Past entries saved on this device.</p>
            </li>
            <li>
              <button
                type="button"
                className="text-left font-medium text-zinc-900 underline decoration-zinc-300 decoration-2 underline-offset-2 hover:decoration-zinc-900"
                onClick={() => setView("daily")}
              >
                Feature 3 — Daily journal + Google
              </button>
              <p className="mt-1 text-xs text-zinc-600">Sign in above, then save journals to the server.</p>
            </li>
          </ul>
          <p className="mt-3 text-xs text-zinc-500">
            Feature 4 — <strong>Reminders</strong> (desktop + email) are at the bottom of the page after you pick a tab.
          </p>
        </section>

        <nav className="sticky top-0 z-30 -mx-4 border-b border-zinc-200/80 bg-white/85 px-4 py-3 backdrop-blur-md sm:-mx-8 sm:px-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div
              className="flex flex-wrap gap-2 rounded-full p-1 shadow-sm ring-1 ring-zinc-200/80"
              style={moodShell.surfaceStyle}
            >
              {navButton("companion", "Companion")}
              {navButton("flow", "Today’s flow")}
              {navButton("garden", "Reflection Garden")}
              {navButton("daily", "Daily journal")}
            </div>
            {result?.usedMockAnalysis ? (
              <p className="text-xs text-amber-800">
                Demo analysis mode — add <code className="rounded bg-amber-100 px-1">ANTHROPIC_API_KEY</code> for
                Claude.
              </p>
            ) : result && !result.usedMockAnalysis ? (
              <p className="text-xs text-zinc-600">Structured response from Claude (server-side).</p>
            ) : (
              <p className="text-xs text-zinc-500">Tip: use Today’s flow for voice/photo capture.</p>
            )}
          </div>
        </nav>

        {view === "companion" ? (
          <CompanionChat onMoodFromAnalysis={applyMoodFromAnalysis} surfaceStyle={moodShell.surfaceStyle} />
        ) : null}

        {view === "daily" ? <DailyJournalCloud surfaceStyle={moodShell.surfaceStyle} /> : null}

        {view === "garden" ? <ReflectGarden entries={entries} /> : null}

        {view === "flow" ? (
          <div className="space-y-8">
            {phase === "capture" ? (
              <div
                className="rounded-3xl border border-zinc-200/90 bg-white/95 p-4 shadow-md sm:p-8"
                style={moodShell.surfaceStyle}
              >
                <CapturePhase onSubmit={handleSubmit} disabled={isPending} />
              </div>
            ) : null}

            {phase === "processing" ? (
              <section
                className="rounded-3xl border p-10 text-center shadow-sm"
                style={{
                  ...moodShell.surfaceStyle,
                  borderWidth: 1,
                  borderStyle: "solid",
                }}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  Phases 2–3 — Normalize & understand
                </p>
                <h2 className="mt-4 font-display text-3xl text-zinc-900">Listening quietly on the server…</h2>
                <p className="mt-3 text-sm text-zinc-600">
                  Voice becomes text, photos become descriptions, parallel tracks score sentiment, themes, patterns, and
                  safety.
                </p>
              </section>
            ) : null}

            {phase === "outcome" && outcome ? (
              <div className="space-y-8">
                {outcome}
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleSave}
                    className="rounded-full bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-emerald-800"
                  >
                    Save to device (Phase 6)
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="rounded-full border border-zinc-300 px-5 py-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                  >
                    New entry
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      refreshEntries();
                      setView("garden");
                    }}
                    className="rounded-full border border-transparent px-5 py-3 text-sm font-semibold text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline"
                  >
                    Open Reflection Garden
                  </button>
                </div>
                {savedNote ? <p className="text-sm text-emerald-800">{savedNote}</p> : null}
              </div>
            ) : null}

            {error ? <p className="text-sm text-rose-700">{error}</p> : null}
          </div>
        ) : null}

        <ReminderPanel />
      </div>
    </main>
  );
}
