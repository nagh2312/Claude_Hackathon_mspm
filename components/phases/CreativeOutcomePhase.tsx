"use client";

import type { ProcessEntryResponse } from "@/lib/domain/types";
import { JournalPage } from "@/components/journal/JournalPage";

interface CreativeOutcomePhaseProps {
  result: ProcessEntryResponse;
}

export function CreativeOutcomePhase({ result }: CreativeOutcomePhaseProps) {
  const theme = result.visual!;
  const topThemes = result.analysis.themes.slice(0, 3).map((t) => t.label).join(" · ");

  return (
    <section className="space-y-10">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Phase 4a — Creative mirror</p>
        <h2 className="font-display text-3xl text-zinc-900 sm:text-4xl">A page shaped by today&apos;s weather inside</h2>
        <p className="max-w-2xl text-zinc-600">
          Typography and color follow your sentiment — not as a label, but as atmosphere. Themes in the background:{" "}
          <span className="font-medium text-zinc-800">{topThemes || "still unfolding"}</span>.
        </p>
      </header>

      <JournalPage
        title="Entry"
        subtitle={result.analysis.reflectionBlurb}
        body={result.normalizedText}
        theme={theme}
      />

      <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Phase 3 — Signals (read-only)</p>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-zinc-500">Valence</dt>
            <dd className="text-2xl font-semibold text-zinc-900">
              {result.analysis.sentiment.valence.toFixed(2)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Arousal</dt>
            <dd className="text-2xl font-semibold text-zinc-900">
              {result.analysis.sentiment.arousal.toFixed(2)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Crisis scan</dt>
            <dd className="text-sm font-medium capitalize text-zinc-900">{result.analysis.crisis.level}</dd>
          </div>
        </dl>
        <ul className="mt-4 space-y-2 text-sm text-zinc-600">
          {result.analysis.patterns.map((p) => (
            <li key={p.windowDays}>
              <span className="font-medium text-zinc-800">{p.windowDays} days:</span> {p.summary}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
