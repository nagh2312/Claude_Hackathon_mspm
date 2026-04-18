import type { StoredEntry } from "@/lib/domain/types";

const KEY = "reflection-journal-entries-v1";

export function loadEntries(): StoredEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveEntry(entry: StoredEntry): void {
  if (typeof window === "undefined") return;
  const prev = loadEntries();
  const next = [entry, ...prev].slice(0, 200);
  window.localStorage.setItem(KEY, JSON.stringify(next));
}

export function clearAllEntries(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
