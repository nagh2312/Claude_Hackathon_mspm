import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";
import postgres from "postgres";

export interface PlatformUserRecord {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  /** ISO timestamp when email was verified; null = must verify before credentials login */
  emailVerifiedAt: string | null;
  verificationToken: string | null;
  verificationExpires: string | null;
  createdAt: string;
}

type FileStore = { users: PlatformUserRecord[] };

const filePath = () => path.join(process.cwd(), "data", "platform-users.json");

function isVercel(): boolean {
  return process.env.VERCEL === "1";
}

function hasDatabaseUrl(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

let sqlSingleton: ReturnType<typeof postgres> | null = null;
function getSql() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return null;
  if (!sqlSingleton) {
    const local = /localhost|127\.0\.0\.1/.test(url);
    sqlSingleton = postgres(url, local ? { max: 1 } : { ssl: "require", max: 1 });
  }
  return sqlSingleton;
}

let schemaReady: Promise<void> | null = null;
function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    const sql = getSql();
    if (!sql) return Promise.resolve();
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS platform_users (
          id text PRIMARY KEY,
          email text UNIQUE NOT NULL,
          password_hash text NOT NULL,
          name text NOT NULL DEFAULT '',
          email_verified_at timestamptz,
          verification_token text,
          verification_expires_at timestamptz,
          created_at timestamptz NOT NULL DEFAULT now()
        )
      `;
      await sql`ALTER TABLE platform_users ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT ''`;
      await sql`ALTER TABLE platform_users ADD COLUMN IF NOT EXISTS email_verified_at timestamptz`;
      await sql`ALTER TABLE platform_users ADD COLUMN IF NOT EXISTS verification_token text`;
      await sql`ALTER TABLE platform_users ADD COLUMN IF NOT EXISTS verification_expires_at timestamptz`;
    })();
  }
  return schemaReady;
}

function rowToUser(r: {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  email_verified_at: Date | null;
  verification_token: string | null;
  verification_expires_at: Date | null;
  created_at: Date;
}): PlatformUserRecord {
  return {
    id: r.id,
    email: r.email,
    passwordHash: r.password_hash,
    name: r.name || r.email.split("@")[0] || "",
    emailVerifiedAt: r.email_verified_at ? new Date(r.email_verified_at).toISOString() : null,
    verificationToken: r.verification_token,
    verificationExpires: r.verification_expires_at ? new Date(r.verification_expires_at).toISOString() : null,
    createdAt: new Date(r.created_at).toISOString(),
  };
}

function normalizeFileUser(u: Partial<PlatformUserRecord> & { email: string; id: string; passwordHash: string }): PlatformUserRecord {
  const createdAt = u.createdAt ?? new Date().toISOString();
  const legacy = u.emailVerifiedAt === undefined && u.verificationToken === undefined && u.verificationExpires === undefined;
  const emailVerifiedAt =
    u.emailVerifiedAt !== undefined && u.emailVerifiedAt !== null
      ? u.emailVerifiedAt
      : legacy
        ? createdAt
        : null;
  return {
    id: u.id,
    email: u.email,
    passwordHash: u.passwordHash,
    name: (u.name && String(u.name).trim()) || u.email.split("@")[0] || "",
    emailVerifiedAt,
    verificationToken: u.verificationToken ?? null,
    verificationExpires: u.verificationExpires ?? null,
    createdAt,
  };
}

async function readFileStore(): Promise<FileStore> {
  try {
    const raw = await fs.readFile(filePath(), "utf-8");
    const parsed = JSON.parse(raw) as { users?: Partial<PlatformUserRecord>[] };
    const users = (parsed.users ?? []).map((x) =>
      normalizeFileUser(x as PlatformUserRecord & { email: string; id: string; passwordHash: string })
    );
    return { users };
  } catch {
    return { users: [] };
  }
}

async function writeFileStore(store: FileStore): Promise<void> {
  if (isVercel() && !hasDatabaseUrl()) {
    throw new Error(
      "This deployment cannot save accounts on disk. Add DATABASE_URL (Vercel Postgres or Neon) in Environment Variables, redeploy, then try again."
    );
  }
  const dir = path.dirname(filePath());
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath(), JSON.stringify(store, null, 2), "utf-8");
}

export async function findUserByEmail(email: string): Promise<PlatformUserRecord | null> {
  const e = email.trim().toLowerCase();
  const sql = getSql();
  if (sql) {
    await ensureSchema();
    const rows = await sql<
      {
        id: string;
        email: string;
        password_hash: string;
        name: string;
        email_verified_at: Date | null;
        verification_token: string | null;
        verification_expires_at: Date | null;
        created_at: Date;
      }[]
    >`SELECT * FROM platform_users WHERE lower(email) = lower(${e}) LIMIT 1`;
    const r = rows[0];
    return r ? rowToUser(r) : null;
  }
  const { users } = await readFileStore();
  return users.find((u) => u.email === e) ?? null;
}

export async function createPlatformUser(input: {
  email: string;
  passwordHash: string;
  name: string;
  verificationToken: string;
  verificationExpires: string;
  /** When true, skip email verification (local dev without mail) */
  autoVerify: boolean;
}): Promise<PlatformUserRecord> {
  const e = input.email.trim().toLowerCase();
  const displayName = input.name.trim() || e.split("@")[0] || "there";
  if (!e || !input.passwordHash) throw new Error("Missing email or password.");
  const verifiedAt = input.autoVerify ? new Date().toISOString() : null;

  const sql = getSql();
  if (sql) {
    await ensureSchema();
    const id = randomUUID();
    try {
      await sql`
        INSERT INTO platform_users (
          id, email, password_hash, name, email_verified_at,
          verification_token, verification_expires_at, created_at
        ) VALUES (
          ${id},
          ${e},
          ${input.passwordHash},
          ${displayName},
          ${input.autoVerify ? new Date() : null},
          ${input.autoVerify ? null : input.verificationToken},
          ${input.autoVerify ? null : new Date(input.verificationExpires)},
          now()
        )
      `;
    } catch (err: unknown) {
      const code = typeof err === "object" && err && "code" in err ? String((err as { code?: string }).code) : "";
      if (code === "23505" || /unique|duplicate/i.test(err instanceof Error ? err.message : "")) {
        throw new Error("An account with this email already exists.");
      }
      throw err;
    }
    const created = await findUserByEmail(e);
    if (!created) throw new Error("Could not create account.");
    return created;
  }

  const store = await readFileStore();
  if (store.users.some((u) => u.email === e)) {
    throw new Error("An account with this email already exists.");
  }
  const user: PlatformUserRecord = {
    id: randomUUID(),
    email: e,
    passwordHash: input.passwordHash,
    name: displayName,
    emailVerifiedAt: verifiedAt,
    verificationToken: input.autoVerify ? null : input.verificationToken,
    verificationExpires: input.autoVerify ? null : input.verificationExpires,
    createdAt: new Date().toISOString(),
  };
  store.users.push(user);
  await writeFileStore(store);
  return user;
}

export async function verifyEmailToken(token: string): Promise<{ ok: true; email: string } | { ok: false; reason: string }> {
  const t = token.trim();
  if (!t) return { ok: false, reason: "missing_token" };

  const sql = getSql();
  if (sql) {
    await ensureSchema();
    const rows = await sql<{ id: string; email: string }[]>`
      UPDATE platform_users
      SET
        email_verified_at = now(),
        verification_token = NULL,
        verification_expires_at = NULL
      WHERE verification_token = ${t}
        AND (verification_expires_at IS NULL OR verification_expires_at > now())
      RETURNING id, email
    `;
    const r = rows[0];
    if (!r) return { ok: false, reason: "invalid_or_expired" };
    return { ok: true, email: r.email };
  }

  const store = await readFileStore();
  const now = Date.now();
  const idx = store.users.findIndex(
    (u) =>
      u.verificationToken === t &&
      (!u.verificationExpires || new Date(u.verificationExpires).getTime() > now)
  );
  if (idx === -1) return { ok: false, reason: "invalid_or_expired" };
  const u = store.users[idx];
  u.emailVerifiedAt = new Date().toISOString();
  u.verificationToken = null;
  u.verificationExpires = null;
  await writeFileStore(store);
  return { ok: true, email: u.email };
}
