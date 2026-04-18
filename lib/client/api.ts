import type { ProcessEntryRequest, ProcessEntryResponse } from "@/lib/domain/types";

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
