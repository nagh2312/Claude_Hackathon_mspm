import type { CloudJournalEntry, ProcessEntryRequest, ProcessEntryResponse } from "@/lib/domain/types";

export async function processEntry(payload: ProcessEntryRequest): Promise<ProcessEntryResponse> {
  const res = await fetch("/api/process-entry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Could not process entry");
  }
  return res.json() as Promise<ProcessEntryResponse>;
}

export async function transcribeAudio(blob: Blob): Promise<string> {
  const fd = new FormData();
  fd.append("file", blob, "recording.webm");
  const res = await fetch("/api/transcribe", { method: "POST", body: fd });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Transcription unavailable");
  }
  const data = (await res.json()) as { text?: string };
  return data.text ?? "";
}

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function companionChat(messages: ChatMessage[]): Promise<{ reply: string; usedMock?: boolean }> {
  const res = await fetch("/api/companion-chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Companion unavailable");
  }
  return res.json() as Promise<{ reply: string; usedMock?: boolean }>;
}

export async function fetchCloudJournals(): Promise<CloudJournalEntry[]> {
  const res = await fetch("/api/journals", { method: "GET" });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Could not load journals");
  }
  const data = (await res.json()) as { entries?: CloudJournalEntry[] };
  return data.entries ?? [];
}

export async function saveCloudJournal(payload: { body: string; date?: string }): Promise<CloudJournalEntry> {
  const res = await fetch("/api/journals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Could not save journal");
  }
  const data = (await res.json()) as { entry?: CloudJournalEntry };
  if (!data.entry) throw new Error("Malformed save response");
  return data.entry;
}

export async function registerAccount(payload: {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
}): Promise<{
  ok: boolean;
  error?: string;
  needsEmailVerification?: boolean;
  devAutoVerified?: boolean;
}> {
  const res = await fetch("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    needsEmailVerification?: boolean;
    devAutoVerified?: boolean;
  };
  if (!res.ok) return { ok: false, error: data.error ?? "Could not create account." };
  return {
    ok: true,
    needsEmailVerification: Boolean(data.needsEmailVerification),
    devAutoVerified: Boolean(data.devAutoVerified),
  };
}

export async function fetchUserProfile(): Promise<{
  profile: import("@/lib/domain/user-profile").UserPersonalityProfile | null;
}> {
  const res = await fetch("/api/user-profile", { method: "GET" });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Could not load profile");
  }
  return res.json() as Promise<{
    profile: import("@/lib/domain/user-profile").UserPersonalityProfile | null;
  }>;
}

export async function saveUserProfile(payload: {
  onboardingComplete: boolean;
  archetype: import("@/lib/domain/user-profile").MascotArchetype;
  tags: string[];
}): Promise<void> {
  const res = await fetch("/api/user-profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Could not save profile");
  }
}

export async function sendJournalReminderEmail(): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch("/api/reminders/email", { method: "POST" });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    return { ok: false, error: data.error ?? "Email not sent" };
  }
  return { ok: true };
}
