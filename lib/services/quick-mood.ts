import type { AnalysisResult } from "@/lib/domain/types";

/**
 * Lightweight mood signal from free text (companion chat) when we don't have structured analysis.
 */
export function quickAnalysisFromText(text: string): AnalysisResult {
  const t = text.toLowerCase();
  let valence = 0;
  let arousal = 0.35;

  const neg = ["sad", "lonely", "hurt", "angry", "anxious", "scared", "tired", "hopeless", "grief", "worried"];
  const pos = ["happy", "grateful", "hope", "love", "peace", "calm", "excited", "joy", "relief", "proud"];
  const high = ["panic", "can't cope", "overwhelmed", "rage", "furious", "shaking", "heart racing"];

  for (const w of neg) if (t.includes(w)) valence -= 0.12;
  for (const w of pos) if (t.includes(w)) valence += 0.12;
  for (const w of high) if (t.includes(w)) arousal += 0.18;

  valence = Math.max(-1, Math.min(1, valence));
  arousal = Math.max(0, Math.min(1, arousal));

  const reflectionBlurb =
    valence < -0.15
      ? "Sounds like you're carrying something heavy. However you feel is information, not failure."
      : valence > 0.15
        ? "There's a little warmth in what you shared — nice to notice when it shows up."
        : "Thanks for trusting the page with what's on your mind — steady counts too.";

  return {
    sentiment: { valence, arousal },
    themes: [],
    patterns: [],
    crisis: { level: "none", rationale: "Heuristic companion mood only." },
    reflectionBlurb,
  };
}
