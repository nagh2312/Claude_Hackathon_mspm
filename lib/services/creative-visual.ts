import type { AnalysisResult, JournalVisualTheme } from "@/lib/domain/types";

/**
 * Deterministic mapping from analysis → visual parameters (no image gen required).
 */
export function sentimentToVisualTheme(a: AnalysisResult): JournalVisualTheme {
  const { valence, arousal } = a.sentiment;
  const palette: JournalVisualTheme["palette"] =
    valence > 0.15 ? "warm" : valence < -0.15 ? "cool" : "neutral";

  let typography: JournalVisualTheme["typography"] = "calm";
  if (arousal > 0.55 && valence < 0) typography = "tense";
  else if (valence > 0.2) typography = "hopeful";

  const density: JournalVisualTheme["density"] =
    arousal > 0.6 ? "compact" : "open";

  const accent =
    palette === "warm"
      ? "#f59e0b"
      : palette === "cool"
        ? "#38bdf8"
        : "#a3a3a3";

  return { palette, typography, density, accent };
}

export function themeToCssVars(v: JournalVisualTheme): Record<string, string> {
  const letter =
    v.typography === "tense"
      ? "-0.04em"
      : v.typography === "hopeful"
        ? "0.02em"
        : "0em";
  const leading =
    v.density === "compact" ? "1.25" : v.typography === "hopeful" ? "1.75" : "1.55";
  const radius = v.typography === "hopeful" ? "28px" : v.typography === "tense" ? "6px" : "16px";
  const bg =
    v.palette === "warm"
      ? "linear-gradient(145deg, #fff7ed 0%, #ffedd5 45%, #ffffff 100%)"
      : v.palette === "cool"
        ? "linear-gradient(145deg, #ecfeff 0%, #e0f2fe 40%, #ffffff 100%)"
        : "linear-gradient(145deg, #fafafa 0%, #f4f4f5 50%, #ffffff 100%)";

  return {
    "--journal-accent": v.accent,
    "--journal-letter": letter,
    "--journal-leading": leading,
    "--journal-radius": radius,
    "--journal-bg": bg,
    "--journal-shadow":
      v.typography === "tense"
        ? "8px 10px 0 rgba(15,23,42,0.12)"
        : "0 25px 60px rgba(15,23,42,0.08)",
  };
}

export function mockVisualFromText(text: string): JournalVisualTheme {
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash += text.charCodeAt(i);
  const palettes: JournalVisualTheme["palette"][] = ["warm", "cool", "neutral"];
  const typos: JournalVisualTheme["typography"][] = ["calm", "tense", "hopeful"];
  const dens: JournalVisualTheme["density"][] = ["open", "compact"];
  return {
    palette: palettes[hash % palettes.length],
    typography: typos[(hash >> 2) % typos.length],
    density: dens[(hash >> 4) % dens.length],
    accent: ["#f472b6", "#34d399", "#818cf8"][hash % 3],
  };
}
