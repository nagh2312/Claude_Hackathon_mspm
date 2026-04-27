import type { CloudJournalEntry } from "@/lib/domain/types";

function dayKey(isoOrDate: string): string {
  if (isoOrDate.length >= 10) return isoOrDate.slice(0, 10);
  return new Date(isoOrDate).toISOString().slice(0, 10);
}

function prevDay(key: string): string {
  const d = new Date(`${key}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Current run: counts back from today, or from yesterday if today is empty but yesterday has an entry. */
export function computeJournalStreak(entries: CloudJournalEntry[]): number {
  if (entries.length === 0) return 0;
  const days = new Set(entries.map((e) => (e.date ? dayKey(e.date) : dayKey(e.createdAt))));
  const today = new Date().toISOString().slice(0, 10);
  let start = today;
  if (!days.has(today)) {
    const y = prevDay(today);
    if (days.has(y)) start = y;
    else return 0;
  }
  let streak = 0;
  let cur = start;
  while (days.has(cur)) {
    streak += 1;
    cur = prevDay(cur);
  }
  return streak;
}
