import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";
import type { CloudJournalEntry } from "@/lib/domain/types";

type Store = Record<string, CloudJournalEntry[]>;

const filePath = () => path.join(process.cwd(), "data", "journals.json");

async function readStore(): Promise<Store> {
  try {
    const raw = await fs.readFile(filePath(), "utf-8");
    const parsed = JSON.parse(raw) as Store;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function writeStore(store: Store): Promise<void> {
  const dir = path.dirname(filePath());
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath(), JSON.stringify(store, null, 2), "utf-8");
}

export async function listJournalsForUser(userId: string): Promise<CloudJournalEntry[]> {
  const store = await readStore();
  const list = store[userId];
  return Array.isArray(list) ? [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : [];
}

export async function addJournalForUser(
  userId: string,
  body: string,
  date?: string
): Promise<CloudJournalEntry> {
  const trimmed = body.trim();
  if (!trimmed) {
    throw new Error("Journal text is empty.");
  }
  const store = await readStore();
  const list = store[userId] ?? [];
  const id = randomUUID();
  const d = (date ?? new Date().toISOString().slice(0, 10)).slice(0, 10);
  const entry: CloudJournalEntry = {
    id,
    date: d,
    body: trimmed.slice(0, 20000),
    createdAt: new Date().toISOString(),
  };
  store[userId] = [entry, ...list].slice(0, 500);
  await writeStore(store);
  return entry;
}
