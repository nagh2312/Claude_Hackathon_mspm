"use client";

import { useMemo } from "react";
import type { StoredEntry } from "@/lib/domain/types";
import { JournalPage } from "@/components/journal/JournalPage";
import { mockVisualFromText } from "@/lib/services/creative-visual";
import { aggregateThemes, buildMonthlyInsight, moodTimeline } from "@/lib/services/reflect";

interface ReflectGardenProps {
  entries: StoredEntry[];
}

export function ReflectGarden({ entries }: ReflectGardenProps) {
  const timeline = useMemo(() => moodTimeline(entries), [entries]);
  const themes = useMemo(() => aggregateThemes(entries), [entries]);
  const insight = useMemo(() => buildMonthlyInsight(entries), [entries]);
  const gallery = useMemo(
    () => entries.filter((e) => e.fork === "creative" && e.visual),
    [entries]
  );

  if (entries.length === 0) {
    return (
      <section className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50/60 p-10 text-center text-zinc-600">
        <p className="font-display text-2xl text-zinc-800">Reflection Garden</p>
        <p className="mt-3 text-sm">Save an entry to see mood arcs, themes, and your journal gallery grow here.</p>
      </section>
    );
  }

  return (
    <section className="space-y-12">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Phase 7 — Reflect</p>
        <h2 className="mt-2 font-display text-3xl text-zinc-900">Your long view</h2>
        <p className="mt-2 max-w-2xl text-zinc-600">{insight}</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-zinc-900">Mood timeline</h3>
          <p className="text-xs text-zinc-500">Valence by day — taller means more positive.</p>
          <div className="mt-6 flex h-40 items-end gap-1">
            {timeline.slice(-24).map((pt, idx) => {
              const h = Math.round(((pt.valence + 1) / 2) * 100);
              return (
                <div key={`${pt.date}-${idx}`} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-sky-200 to-indigo-500"
                    style={{ height: `${Math.max(8, h)}%` }}
                    title={`${pt.date}: valence ${pt.valence.toFixed(2)}`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-zinc-900">Theme clusters</h3>
          <ul className="mt-4 space-y-3">
            {themes.map((t) => (
              <li key={t.label} className="flex items-center gap-3">
                <span className="w-28 text-sm text-zinc-700">{t.label}</span>
                <div className="h-2 flex-1 rounded-full bg-zinc-100">
                  <div
                    className="h-2 rounded-full bg-zinc-800"
                    style={{ width: `${Math.min(100, t.weight * 40)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-zinc-900">Art gallery</h3>
        <p className="text-sm text-zinc-600">Pages you chose to keep — a visual autobiography in fragments.</p>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {gallery.slice(0, 6).map((e) => (
            <JournalPage
              key={e.id}
              title={new Date(e.createdAt).toLocaleDateString()}
              subtitle={e.analysis.reflectionBlurb}
              body={e.normalizedText.slice(0, 600) + (e.normalizedText.length > 600 ? "…" : "")}
              theme={e.visual ?? mockVisualFromText(e.normalizedText)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
