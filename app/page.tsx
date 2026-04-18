"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import type { CaptureMode, ProcessEntryResponse, StoredEntry } from "@/lib/domain/types";
import { processEntry } from "@/lib/client/api";
import { saveEntry, loadEntries } from "@/lib/services/persistence";
import { CapturePhase } from "@/components/phases/CapturePhase";
import { CrisisSupportPhase } from "@/components/phases/CrisisSupportPhase";
import { CreativeOutcomePhase } from "@/components/phases/CreativeOutcomePhase";
import { NurturePhase } from "@/components/phases/NurturePhase";
import { ReflectGarden } from "@/components/phases/ReflectGarden";

type View = "flow" | "garden";

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

  const refreshEntries = useCallback(() => {
    setEntries(loadEntries());
  }, []);

  useEffect(() => {
    refreshEntries();
  }, [refreshEntries]);

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

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-8">
      <nav className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2 rounded-full bg-white/80 p-1 shadow-sm ring-1 ring-zinc-200">
          <button
            type="button"
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              view === "flow" ? "bg-zinc-900 text-white" : "text-zinc-600 hover:text-zinc-900"
            }`}
            onClick={() => setView("flow")}
          >
            Today&apos;s flow
          </button>
          <button
            type="button"
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              view === "garden" ? "bg-zinc-900 text-white" : "text-zinc-600 hover:text-zinc-900"
            }`}
            onClick={() => {
              refreshEntries();
              setView("garden");
            }}
          >
            Reflection Garden
          </button>
        </div>
        {result?.usedMockAnalysis ? (
          <p className="text-xs text-amber-700">
            Demo analysis mode — add <code className="rounded bg-amber-100 px-1">ANTHROPIC_API_KEY</code> for Claude.
          </p>
        ) : result && !result.usedMockAnalysis ? (
          <p className="text-xs text-zinc-500">Structured response from Claude (server-side).</p>
        ) : null}
      </nav>

      {view === "garden" ? (
        <ReflectGarden entries={entries} />
      ) : (
        <div className="space-y-8">
          {phase === "capture" ? <CapturePhase onSubmit={handleSubmit} disabled={isPending} /> : null}

          {phase === "processing" ? (
            <section className="rounded-3xl border border-zinc-200 bg-white p-10 text-center shadow-sm">
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
      )}
    </main>
  );
}
