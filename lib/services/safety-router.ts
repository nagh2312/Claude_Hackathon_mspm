import type { AnalysisResult, ForkPath } from "@/lib/domain/types";

/**
 * Hard routing rule: crisis path wins regardless of softer sentiment signals.
 */
export function routeFork(analysis: AnalysisResult): ForkPath {
  if (analysis.crisis.level === "high") return "crisis";
  if (analysis.crisis.level === "elevated") return "crisis";
  return "creative";
}
