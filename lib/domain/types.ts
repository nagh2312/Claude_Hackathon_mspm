/**
 * Shared domain types for the journal pipeline (capture → reflect).
 */

export type CaptureMode = "text" | "voice" | "photo";

export type ForkPath = "creative" | "crisis";

export interface SentimentScores {
  /** -1 (very low) … 1 (very high) */
  valence: number;
  /** 0 calm … 1 activated / keyed up */
  arousal: number;
}

export interface ThemeTag {
  label: string;
  weight: number;
}

export interface PatternNote {
  windowDays: 7 | 30 | 90;
  summary: string;
}

export interface CrisisAssessment {
  level: "none" | "elevated" | "high";
  rationale: string;
}

export interface AnalysisResult {
  sentiment: SentimentScores;
  themes: ThemeTag[];
  patterns: PatternNote[];
  crisis: CrisisAssessment;
  /** Unified narrative the UI can quote */
  reflectionBlurb: string;
}

export interface JournalVisualTheme {
  palette: "cool" | "warm" | "neutral";
  typography: "calm" | "tense" | "hopeful";
  density: "open" | "compact";
  accent: string;
}

export interface NurtureSuggestion {
  id: string;
  title: string;
  body: string;
  kind: "breathing" | "prompt" | "gratitude";
}

export interface StoredEntry {
  id: string;
  createdAt: string;
  captureMode: CaptureMode;
  rawText: string;
  rawImageDataUrl?: string;
  normalizedText: string;
  analysis: AnalysisResult;
  fork: ForkPath;
  visual?: JournalVisualTheme;
  nurture?: NurtureSuggestion;
}

export interface ProcessEntryRequest {
  captureMode: CaptureMode;
  text?: string;
  imageBase64?: string;
  imageMime?: string;
}

export interface ProcessEntryResponse {
  normalizedText: string;
  analysis: AnalysisResult;
  fork: ForkPath;
  visual?: JournalVisualTheme;
  nurture?: NurtureSuggestion;
  usedMockAnalysis: boolean;
}

/** Server-persisted daily journal row (see `data/journals.json`). */
export interface CloudJournalEntry {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  body: string;
  createdAt: string;
}
