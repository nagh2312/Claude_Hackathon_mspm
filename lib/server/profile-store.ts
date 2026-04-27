import fs from "fs/promises";
import path from "path";
import type { UserPersonalityProfile } from "@/lib/domain/user-profile";

type Store = Record<string, UserPersonalityProfile>;

const filePath = () => path.join(process.cwd(), "data", "profiles.json");

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

export async function getUserProfile(userId: string): Promise<UserPersonalityProfile | null> {
  const store = await readStore();
  return store[userId] ?? null;
}

export async function saveUserProfile(userId: string, profile: UserPersonalityProfile): Promise<void> {
  const store = await readStore();
  store[userId] = profile;
  await writeStore(store);
}
