import type { AnalysisResult, NurtureSuggestion } from "@/lib/domain/types";

/**
 * One nudge only — framed as invitation, not prescription.
 */
export function pickNurture(a: AnalysisResult): NurtureSuggestion {
  const { valence, arousal } = a.sentiment;

  if (arousal > 0.55 && valence < 0.1) {
    return {
      id: "breath-2m",
      title: "A two-minute breathing space",
      body: "Inhale for 4, hold for 2, exhale for 6 — repeat quietly. You can stop anytime; there is no score.",
      kind: "breathing",
    };
  }

  if (valence < -0.05 && arousal < 0.45) {
    return {
      id: "prompt-notice",
      title: "A small noticing prompt",
      body: "Write three things you noticed today that surprised you — even tiny details count.",
      kind: "prompt",
    };
  }

  return {
    id: "gratitude-micro",
    title: "A gentle gratitude micro-moment",
    body: "Name one thing that softened the day, even slightly — a texture, a sound, a sip of water.",
    kind: "gratitude",
  };
}
