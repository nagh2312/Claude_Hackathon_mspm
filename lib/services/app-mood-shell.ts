import type { CSSProperties } from "react";
import type { AnalysisResult } from "@/lib/domain/types";
import { sentimentToVisualTheme, themeToCssVars } from "@/lib/services/creative-visual";

export interface AppMoodShell {
  /** Short label for chips / headers */
  feelingTag: string;
  /** Human-readable summary (from analysis or heuristic) */
  moodSummary: string;
  /** Inline styles for the outer shell (background, default text) */
  shellStyle: CSSProperties;
  /** Slightly stronger nav / card tint */
  surfaceStyle: CSSProperties;
  accent: string;
}

function feelingTagFromScores(valence: number, arousal: number): string {
  if (valence < -0.25 && arousal > 0.55) return "Heavy & stirred";
  if (valence < -0.2) return "Tender or low";
  if (valence > 0.2 && arousal > 0.55) return "Bright & keyed up";
  if (valence > 0.2) return "Warm or uplifted";
  if (arousal > 0.6) return "Activated";
  return "Quietly steady";
}

export function buildAppMoodShell(analysis: AnalysisResult): AppMoodShell {
  const visual = sentimentToVisualTheme(analysis);
  const vars = themeToCssVars(visual);
  const { valence, arousal } = analysis.sentiment;
  const feelingTag = feelingTagFromScores(valence, arousal);
  const moodSummary =
    analysis.reflectionBlurb.trim() ||
    "We're reflecting the emotional colour of your latest words across the app.";

  const shellStyle: CSSProperties = {
    background: String(vars["--journal-bg"]),
    color: "#18181b",
    transition: "background 0.7s ease, color 0.4s ease",
  };

  const surfaceStyle: CSSProperties = {
    backgroundColor:
      visual.palette === "warm"
        ? "rgba(255, 255, 255, 0.72)"
        : visual.palette === "cool"
          ? "rgba(255, 255, 255, 0.78)"
          : "rgba(255, 255, 255, 0.85)",
    borderColor: visual.palette === "warm" ? "rgba(251, 191, 36, 0.35)" : "rgba(148, 163, 184, 0.35)",
    boxShadow: "0 18px 45px rgba(15, 23, 42, 0.06)",
  };

  return {
    feelingTag,
    moodSummary,
    shellStyle,
    surfaceStyle,
    accent: visual.accent,
  };
}

export const defaultAppMoodShell: AppMoodShell = {
  feelingTag: "Quietly open",
  moodSummary: "Neutral light — your next entry or chat will tint the space to match the feeling inside it.",
  shellStyle: {
    background: "linear-gradient(145deg, #fafafa 0%, #f4f4f5 50%, #ffffff 100%)",
    color: "#18181b",
    transition: "background 0.7s ease, color 0.4s ease",
  },
  surfaceStyle: {
    backgroundColor: "rgba(255, 255, 255, 0.88)",
    borderColor: "rgba(228, 228, 231, 0.9)",
    boxShadow: "0 18px 45px rgba(15, 23, 42, 0.05)",
  },
  accent: "#a3a3a3",
};
