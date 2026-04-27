import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";

export interface PlatformUserRecord {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

type Store = { users: PlatformUserRecord[] };

const filePath = () => path.join(process.cwd(), "data", "platform-users.json");

async function readStore(): Promise<Store> {
  try {
    const raw = await fs.readFile(filePath(), "utf-8");
    const parsed = JSON.parse(raw) as Store;
    return parsed?.users ? parsed : { users: [] };
  } catch {
    return { users: [] };
  }
}

async function writeStore(store: Store): Promise<void> {
  const dir = path.dirname(filePath());
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath(), JSON.stringify(store, null, 2), "utf-8");
}

export async function findUserByEmail(email: string): Promise<PlatformUserRecord | null> {
  const e = email.trim().toLowerCase();
  const { users } = await readStore();
  return users.find((u) => u.email === e) ?? null;
}

export async function createPlatformUser(email: string, passwordHash: string): Promise<PlatformUserRecord> {
  const e = email.trim().toLowerCase();
  if (!e || !passwordHash) throw new Error("Missing email or password.");
  const store = await readStore();
  if (store.users.some((u) => u.email === e)) {
    throw new Error("An account with this email already exists.");
  }
  const user: PlatformUserRecord = {
    id: randomUUID(),
    email: e,
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  store.users.push(user);
  await writeStore(store);
  return user;
}
