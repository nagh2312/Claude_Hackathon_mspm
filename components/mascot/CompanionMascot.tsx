"use client";

import { useCallback, useState } from "react";
import type { MascotArchetype } from "@/lib/domain/user-profile";
import { randomMascotFact } from "@/lib/services/mascot-facts";

const archetypeStyles: Record<
  MascotArchetype,
  { body: string; cheek: string; accent: string; horn?: boolean }
> = {
  explorer: { body: "#8b5cf6", cheek: "#c4b5fd", accent: "#fbbf24", horn: true },
  zen: { body: "#34d399", cheek: "#a7f3d0", accent: "#6ee7b7" },
  planner: { body: "#60a5fa", cheek: "#bfdbfe", accent: "#f472b6" },
  spark: { body: "#f472b6", cheek: "#fbcfe8", accent: "#fbbf24", horn: true },
};

export type MascotMood = "welcome" | "happy" | "gentle";

interface CompanionMascotProps {
  archetype: MascotArchetype;
  mood?: MascotMood;
  streak?: number;
  caption?: string;
  className?: string;
}

export function CompanionMascot({
  archetype,
  mood = "gentle",
  streak = 0,
  caption,
  className = "",
}: CompanionMascotProps) {
  const [fact, setFact] = useState(() => randomMascotFact());
  const s = archetypeStyles[archetype] ?? archetypeStyles.explorer;

  const bounce = mood === "welcome" || mood === "happy";

  const onTap = useCallback(() => setFact(randomMascotFact()), []);

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <button
        type="button"
        onClick={onTap}
        className="group relative rounded-3xl border-0 bg-transparent p-0 text-left shadow-none outline-none ring-0 focus-visible:ring-2 focus-visible:ring-violet-400"
        aria-label="Tap your companion for a small encouragement"
      >
        <svg
          width={200}
          height={200}
          viewBox="0 0 200 200"
          className={`drop-shadow-xl transition-transform duration-500 ${bounce ? "animate-mascot-bounce" : ""}`}
        >
          <defs>
            <radialGradient id="glow" cx="40%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="100%" stopColor={s.body} stopOpacity="1" />
            </radialGradient>
          </defs>
          <ellipse cx="100" cy="110" rx="72" ry="68" fill="url(#glow)" />
          <ellipse cx="100" cy="118" rx="62" ry="54" fill={s.body} opacity="0.35" />
          <circle cx="72" cy="96" r="10" fill="#0f172a" />
          <circle cx="128" cy="96" r="10" fill="#0f172a" />
          <circle cx="75" cy="93" r="3" fill="#fff" opacity="0.7" />
          <circle cx="131" cy="93" r="3" fill="#fff" opacity="0.7" />
          <ellipse cx="100" cy="118" rx="18" ry="10" fill="#0f172a" opacity="0.15" />
          <path
            d="M 78 128 Q 100 142 122 128"
            stroke="#0f172a"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            opacity="0.35"
          />
          <ellipse cx="58" cy="108" rx="9" ry="6" fill={s.cheek} opacity="0.85" />
          <ellipse cx="142" cy="108" rx="9" ry="6" fill={s.cheek} opacity="0.85" />
          {s.horn ? (
            <>
              <path d="M 58 52 L 68 78 L 48 72 Z" fill={s.accent} opacity="0.9" />
              <path d="M 142 52 L 132 78 L 152 72 Z" fill={s.accent} opacity="0.9" />
            </>
          ) : null}
          <circle
            cx="100"
            cy="40"
            r="6"
            fill={s.accent}
            className="opacity-80 group-hover:scale-110 transition-transform"
          />
        </svg>
        <span className="sr-only">Tap for a new tip</span>
      </button>

      <div className="max-w-sm space-y-2 text-center">
        {caption ? <p className="text-sm font-medium text-white/95 drop-shadow-sm">{caption}</p> : null}
        {streak > 0 ? (
          <p className="rounded-full bg-white/20 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white">
            {streak} day journal streak
          </p>
        ) : null}
        <p className="text-sm leading-relaxed text-white/90">{fact}</p>
        <p className="text-xs text-white/60">Tap the character for another little nudge.</p>
      </div>
    </div>
  );
}
