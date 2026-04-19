import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { addJournalForUser, listJournalsForUser } from "@/lib/server/journal-file-store";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Sign in to load your cloud journals." }, { status: 401 });
  }
  const entries = await listJournalsForUser(userId);
  return NextResponse.json({ entries });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Sign in to save journals to your account." }, { status: 401 });
  }
  try {
    const body = (await req.json()) as { body?: string; date?: string };
    const entry = await addJournalForUser(userId, body.body ?? "", body.date);
    return NextResponse.json({ entry });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not save journal.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
