"use client";

import { useCallback, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useSession } from "next-auth/react";
import { fetchCloudJournals, saveCloudJournal } from "@/lib/client/api";
import { useAppFlags } from "@/components/providers/AppProviders";
import { touchJournalActivity } from "@/lib/services/persistence";
import type { CloudJournalEntry } from "@/lib/domain/types";

interface DailyJournalCloudProps {
  surfaceStyle?: CSSProperties;
}

export function DailyJournalCloud({ surfaceStyle }: DailyJournalCloudProps) {
  const { data: session, status } = useSession();
  const { googleAuthEnabled } = useAppFlags();
  const [body, setBody] = useState("");
  const [entries, setEntries] = useState<CloudJournalEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const list = await fetchCloudJournals();
      setEntries(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load cloud journals.");
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (session?.user?.id) void refresh();
    else setEntries([]);
  }, [session?.user?.id, refresh]);

  const onSave = useCallback(async () => {
    if (!body.trim()) return;
    setSaving(true);
    setNote(null);
    setError(null);
    try {
      await saveCloudJournal({ body });
      touchJournalActivity();
      setBody("");
      setNote("Saved to your account on this server.");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }, [body, refresh]);

  if (!googleAuthEnabled) {
    return null;
  }

  if (status === "loading") {
    return <p className="text-sm text-zinc-500">Loading session…</p>;
  }

  if (!session?.user) {
    return (
      <p className="text-sm text-zinc-600">
        Sign in with Google on the bar above to keep a daily journal synced to this deployment.
      </p>
    );
  }

  return (
    <section
      className="rounded-3xl border p-6 shadow-sm sm:p-8"
      style={{
        ...surfaceStyle,
        borderWidth: 1,
        borderStyle: "solid",
      }}
    >
      <header className="mb-6 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Daily journal</p>
        <h2 className="font-display text-3xl text-zinc-900">Write for today</h2>
        <p className="text-sm text-zinc-600">
          Entries are stored in <code className="rounded bg-zinc-100 px-1 text-xs">data/journals.json</code> on the
          server (hackathon-friendly). For production, swap in a database.
        </p>
      </header>

      <div className="space-y-4">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={8}
          placeholder="What happened, what you felt, what you hope tomorrow remembers…"
          className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 shadow-inner outline-none focus:border-zinc-500"
        />
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void onSave()}
            disabled={saving || !body.trim()}
            className="rounded-full bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save today’s journal"}
          </button>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading}
            className="rounded-full border border-zinc-300 px-5 py-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
          >
            {loading ? "Refreshing…" : "Refresh list"}
          </button>
        </div>
        {note ? <p className="text-sm text-emerald-800">{note}</p> : null}
        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      </div>

      <div className="mt-10">
        <h3 className="text-sm font-semibold text-zinc-800">Recent cloud entries</h3>
        <ul className="mt-4 space-y-4">
          {entries.length === 0 && !loading ? (
            <li className="text-sm text-zinc-500">No cloud entries yet — your first line can be imperfect.</li>
          ) : null}
          {entries.map((e) => (
            <li key={e.id} className="rounded-2xl border border-zinc-200 bg-white/80 p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                {e.date} · saved {new Date(e.createdAt).toLocaleString()}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-800">{e.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
