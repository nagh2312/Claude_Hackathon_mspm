import type { AnalysisResult } from "@/lib/domain/types";

const crisisKeywords = [
  "kill myself",
  "end my life",
  "suicide",
  "want to die",
  "better off dead",
  "hurt myself",
  "self harm",
  "no reason to live",
];

function containsCrisisLanguage(text: string): boolean {
  const t = text.toLowerCase();
  return crisisKeywords.some((k) => t.includes(k));
}

/**
 * Deterministic offline analysis for demos and CI builds.
 */
export function mockAnalysis(unifiedText: string): AnalysisResult {
  const len = unifiedText.length || 1;
  const words = unifiedText.trim().split(/\s+/).filter(Boolean).length;
  const stressed =
    /\b(stress|anxious|panic|overwhelm|can't cope|cannot cope)\b/i.test(unifiedText);
  const hopeful = /\b(hope|better|grateful|small win|relief)\b/i.test(unifiedText);

  let valence = (words % 17) / 34 - 0.25;
  if (hopeful) valence += 0.25;
  if (stressed) valence -= 0.2;
  valence = Math.max(-1, Math.min(1, valence));

  let arousal = stressed ? 0.72 : 0.35 + (len % 10) / 100;
  arousal = Math.max(0, Math.min(1, arousal));

  const themes = [
    { label: "work", weight: /\b(work|job|boss|deadline)\b/i.test(unifiedText) ? 0.8 : 0.2 },
    { label: "rest", weight: /\b(sleep|tired|insomnia|rest)\b/i.test(unifiedText) ? 0.75 : 0.15 },
    {
      label: "relationships",
      weight: /\b(friend|partner|family|mom|dad)\b/i.test(unifiedText) ? 0.7 : 0.1,
    },
  ].sort((a, b) => b.weight - a.weight);

  const crisisHigh = containsCrisisLanguage(unifiedText);

  return {
    sentiment: { valence, arousal },
    themes: themes.slice(0, 3),
    patterns: [
      { windowDays: 7, summary: "Demo mode: connect API keys for longitudinal comparisons." },
      { windowDays: 30, summary: "Patterns will compare this entry with your saved history." },
    ],
    crisis: {
      level: crisisHigh ? "high" : "none",
      rationale: crisisHigh
        ? "Keyword-based demo guard triggered — real deployments should use a dedicated safety model and policy review."
        : "No demo keyword hits — still not a clinical assessment.",
    },
    reflectionBlurb:
      "This is a local demo read of your words — not therapy. With API keys enabled, a structured model response replaces this text.",
  };
}
