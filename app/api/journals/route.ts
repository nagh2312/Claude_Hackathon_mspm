import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import type { JWT } from "next-auth/jwt";
import type { CloudJournalEntry } from "@/lib/domain/types";
import { addJournalForUser, listJournalsForUser } from "@/lib/server/journal-file-store";
import { readJournalsFromDrive, writeJournalsToDrive } from "@/lib/server/google-drive-journals";

function mergeById(a: CloudJournalEntry[], b: CloudJournalEntry[]): CloudJournalEntry[] {
  const map = new Map<string, CloudJournalEntry>();
  for (const e of a.concat(b)) map.set(e.id, e);
  return Array.from(map.values()).sort((x, y) => y.createdAt.localeCompare(x.createdAt));
}

export const runtime = "nodejs";

async function getUserId(req: NextRequest): Promise<string | null> {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return null;
  const token = await getToken({ req, secret });
  const id = (typeof token?.sub === "string" && token.sub) || (typeof token?.uid === "string" && token.uid);
  return id || null;
}

function isGoogleDriveUser(
  token: Awaited<ReturnType<typeof getToken>>
): token is JWT & { refresh_token: string; provider: "google" } {
  if (!token || typeof token !== "object") return false;
  const t = token as JWT;
  return t.provider === "google" && typeof t.refresh_token === "string" && t.refresh_token.length > 0;
}

export async function GET(req: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Sign-in is not configured on the server." }, { status: 503 });
  }
  const token = await getToken({ req, secret });
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Sign in to see your journals." }, { status: 401 });
  }

  const fromFile = await listJournalsForUser(userId);
  if (isGoogleDriveUser(token)) {
    const fromDrive = await readJournalsFromDrive(token.refresh_token);
    if (fromDrive !== null) {
      return NextResponse.json({ entries: mergeById(fromDrive, fromFile) });
    }
  }
  return NextResponse.json({ entries: fromFile });
}

export async function POST(req: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Sign-in is not configured on the server." }, { status: 503 });
  }
  const token = await getToken({ req, secret });
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Sign in to save your journal." }, { status: 401 });
  }

  try {
    const body = (await req.json()) as { body?: string; date?: string };
    const entry = await addJournalForUser(userId, body.body ?? "", body.date);

    if (isGoogleDriveUser(token)) {
      const merged = await listJournalsForUser(userId);
      await writeJournalsToDrive(token.refresh_token, merged);
    }

    return NextResponse.json({ entry });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not save journal.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
