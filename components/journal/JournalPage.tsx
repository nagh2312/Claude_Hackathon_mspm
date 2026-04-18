"use client";

import type { JournalVisualTheme } from "@/lib/domain/types";
import { themeToCssVars } from "@/lib/services/creative-visual";

interface JournalPageProps {
  title: string;
  body: string;
  theme: JournalVisualTheme;
  subtitle?: string;
}

export function JournalPage({ title, body, theme, subtitle }: JournalPageProps) {
  const vars = themeToCssVars(theme);
  const tense = theme.typography === "tense";
  const hopeful = theme.typography === "hopeful";

  return (
    <article
      className="relative overflow-hidden border border-zinc-200/80 p-8 shadow-xl transition-[transform,box-shadow] duration-300"
      style={{
        ...vars,
        background: "var(--journal-bg)",
        borderRadius: "var(--journal-radius)",
        boxShadow: "var(--journal-shadow)",
      }}
    >
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-40 blur-3xl"
        style={{ background: `radial-gradient(circle at 30% 30%, var(--journal-accent), transparent 70%)` }}
      />
      <header className="relative space-y-2">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Journal page</p>
        <h2
          className={`font-display text-3xl text-zinc-900 sm:text-4xl ${
            tense ? "font-semibold" : "font-medium"
          }`}
          style={{
            letterSpacing: "var(--journal-letter)",
            lineHeight: hopeful ? 1.15 : 1.05,
          }}
        >
          {title}
        </h2>
        {subtitle ? (
          <p className="max-w-prose text-sm text-zinc-600" style={{ lineHeight: "var(--journal-leading)" }}>
            {subtitle}
          </p>
        ) : null}
      </header>
      <div
        className={`relative mt-8 whitespace-pre-wrap font-display text-lg text-zinc-800 ${
          tense ? "skew-x-[-1deg]" : ""
        }`}
        style={{ lineHeight: "var(--journal-leading)" }}
      >
        {body}
      </div>
      <footer className="relative mt-10 flex items-center justify-between text-xs text-zinc-500">
        <span>Made for you — not a medical record</span>
        <span className="rounded-full bg-white/60 px-3 py-1 text-[10px] uppercase tracking-widest text-zinc-500">
          {theme.palette} · {theme.typography}
        </span>
      </footer>
    </article>
  );
}
