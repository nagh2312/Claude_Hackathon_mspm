"use client";

import type { NurtureSuggestion } from "@/lib/domain/types";

interface NurturePhaseProps {
  suggestion: NurtureSuggestion;
}

export function NurturePhase({ suggestion }: NurturePhaseProps) {
  return (
    <section className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50/90 to-white p-8 shadow-inner">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">A small next step</p>
      <h3 className="mt-3 font-display text-2xl text-emerald-950">{suggestion.title}</h3>
      <p className="mt-3 max-w-2xl text-emerald-900/85">{suggestion.body}</p>
      <p className="mt-4 text-xs text-emerald-800/70">
        One invitation. Skip it without guilt, or bookmark it for later.
      </p>
    </section>
  );
}
