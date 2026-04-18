import type { StoredEntry, ThemeTag } from "@/lib/domain/types";

export interface MoodPoint {
  date: string;
  valence: number;
  arousal: number;
}

export function moodTimeline(entries: StoredEntry[]): MoodPoint[] {
  return [...entries]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((e) => ({
      date: e.createdAt.slice(0, 10),
      valence: e.analysis.sentiment.valence,
      arousal: e.analysis.sentiment.arousal,
    }));
}

export function aggregateThemes(entries: StoredEntry[]): ThemeTag[] {
  const map = new Map<string, number>();
  for (const e of entries) {
    for (const t of e.analysis.themes) {
      map.set(t.label, (map.get(t.label) ?? 0) + t.weight);
    }
  }
  return Array.from(map.entries())
    .map(([label, weight]) => ({ label, weight }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 8);
}

export function entriesThisMonth(entries: StoredEntry[]): StoredEntry[] {
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return entries.filter((e) => e.createdAt.startsWith(ym));
}

export function buildMonthlyInsight(entries: StoredEntry[]): string {
  const month = entriesThisMonth(entries);
  if (month.length === 0) {
    return "Once you have entries this month, a short pattern summary will appear here.";
  }
  const top = aggregateThemes(month)[0];
  const calmest = [...month].sort(
    (a, b) => a.analysis.sentiment.arousal - b.analysis.sentiment.arousal
  )[0];
  const calmDay = calmest?.createdAt.slice(0, 10) ?? "—";
  return `You logged ${month.length} entr${month.length === 1 ? "y" : "ies"} this month. A recurring theme is “${top?.label ?? "reflection"}”. Your lowest-arousal entry so far was on ${calmDay}.`;
}
