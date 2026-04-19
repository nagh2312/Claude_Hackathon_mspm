"use client";

import { useCallback, useRef, useState } from "react";
import type { CaptureMode } from "@/lib/domain/types";

interface CapturePhaseProps {
  onSubmit: (payload: {
    captureMode: CaptureMode;
    text: string;
    imageBase64?: string;
    imageMime?: string;
  }) => void;
  disabled?: boolean;
}

function fileToBase64(file: File): Promise<{ base64: string; mime: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result;
      if (typeof res !== "string") {
        reject(new Error("Could not read file"));
        return;
      }
      const comma = res.indexOf(",");
      const base64 = comma >= 0 ? res.slice(comma + 1) : res;
      resolve({ base64, mime: file.type || "image/jpeg" });
    };
    reader.onerror = () => reject(reader.error ?? new Error("read error"));
    reader.readAsDataURL(file);
  });
}

export function CapturePhase({ onSubmit, disabled }: CapturePhaseProps) {
  const [mode, setMode] = useState<CaptureMode>("text");
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [recording, setRecording] = useState(false);
  const [speechNote, setSpeechNote] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const onPickImage = useCallback(async (file: File | null) => {
    if (!file) {
      setImageFile(null);
      setImagePreview(null);
      return;
    }
    setImageFile(file);
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(r.error);
      r.readAsDataURL(file);
    });
    setImagePreview(dataUrl);
  }, []);

  const startSpeech = useCallback(() => {
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Ctor) {
      setSpeechNote("Speech-to-text is not available in this browser. Type or upload audio to the server instead.");
      return;
    }
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (ev) => {
      const said = ev.results[0]?.[0]?.transcript ?? "";
      setText((t) => (t ? `${t}\n${said}` : said));
    };
    rec.onerror = () => setSpeechNote("Speech capture hit an error — you can still type.");
    rec.start();
    setSpeechNote("Listening… speak naturally, then pause.");
  }, []);

  const toggleRecord = useCallback(async () => {
    if (recording) {
      mediaRecorderRef.current?.stop();
      setRecording(false);
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    chunksRef.current = [];
    mr.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    mr.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      if (blob.size < 10) return;
      try {
        const { transcribeAudio } = await import("@/lib/client/api");
        const transcript = await transcribeAudio(blob);
        setText((t) => (t ? `${t}\n${transcript}` : transcript));
        setSpeechNote("Server transcription complete.");
      } catch {
        setSpeechNote(
          "Server transcription is unavailable (add OPENAI_API_KEY) — try typing, or use the speech button in Chrome."
        );
      }
    };
    mediaRecorderRef.current = mr;
    mr.start();
    setRecording(true);
    setSpeechNote("Recording… tap again to stop and send audio for transcription.");
  }, [recording]);

  const handleSubmit = async () => {
    let imageBase64: string | undefined;
    let imageMime: string | undefined;
    if (imageFile) {
      const img = await fileToBase64(imageFile);
      imageBase64 = img.base64;
      imageMime = img.mime;
    }
    onSubmit({
      captureMode: mode,
      text,
      imageBase64,
      imageMime,
    });
  };

  return (
    <section className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Phase 1 — Capture</p>
        <h1 className="font-display text-4xl text-zinc-900 sm:text-5xl">Start wherever you are</h1>
        <p className="max-w-2xl text-zinc-600">
          No scales, no preamble. Choose a door — words, voice, or a photo — and let it be imperfect.
        </p>
      </header>

      <div
        className="flex flex-wrap gap-2 rounded-2xl border border-zinc-200 bg-white/90 p-2 shadow-sm"
        role="tablist"
        aria-label="Capture mode"
      >
        {(
          [
            ["text", "✎ Text", "Type or paste"],
            ["voice", "🎤 Voice", "Speak or record"],
            ["photo", "📷 Photo", "Upload an image"],
          ] as const
        ).map(([id, label, hint]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={mode === id}
            onClick={() => setMode(id)}
            className={`flex min-w-[7.5rem] flex-1 flex-col items-start rounded-xl px-4 py-3 text-left text-sm transition sm:min-w-0 sm:flex-1 ${
              mode === id
                ? "bg-zinc-900 text-white shadow-md ring-2 ring-zinc-900 ring-offset-2 ring-offset-white"
                : "bg-zinc-50 text-zinc-800 ring-1 ring-zinc-200 hover:bg-zinc-100"
            }`}
          >
            <span className="font-semibold">{label}</span>
            <span className={`mt-0.5 text-xs ${mode === id ? "text-zinc-300" : "text-zinc-500"}`}>{hint}</span>
          </button>
        ))}
      </div>

      {mode === "text" ? (
        <label className="block space-y-2">
          <span className="text-sm text-zinc-600">Write anything — fragments are welcome.</span>
          <textarea
            className="min-h-[220px] w-full rounded-2xl border border-zinc-200 bg-white/80 p-4 text-base text-zinc-900 shadow-inner outline-none ring-zinc-300 focus:ring-2"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Today is… / I keep thinking about… / I do not need this to sound wise."
          />
        </label>
      ) : null}

      {mode === "voice" ? (
        <div className="space-y-4 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/80 p-6">
          <p className="text-sm text-zinc-600">
            Use quick speech-to-text in the browser, or record a clip for optional server transcription.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={startSpeech}
              className="rounded-full bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-sm ring-1 ring-zinc-200 hover:bg-zinc-50"
            >
              Speak (browser)
            </button>
            <button
              type="button"
              onClick={toggleRecord}
              className={`rounded-full px-4 py-2 text-sm font-medium shadow-sm ring-1 ${
                recording
                  ? "bg-rose-600 text-white ring-rose-700"
                  : "bg-zinc-900 text-white ring-zinc-900"
              }`}
            >
              {recording ? "Stop recording" : "Record for server transcript"}
            </button>
          </div>
          <textarea
            className="min-h-[160px] w-full rounded-xl border border-zinc-200 bg-white p-3 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Transcript appears here — edit freely."
          />
        </div>
      ) : null}

      {mode === "photo" ? (
        <div className="space-y-4">
          <input
            ref={photoInputRef}
            id="capture-photo-file"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => void onPickImage(e.target.files?.[0] ?? null)}
          />
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/90 p-8 text-center text-sm text-zinc-600">
            <p className="font-medium text-zinc-800">Add a photo (required for this mode)</p>
            <p className="max-w-md text-xs text-zinc-500">
              Use the button so the file picker always opens reliably in every browser.
            </p>
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-zinc-800"
            >
              Choose photo…
            </button>
            {imageFile ? (
              <p className="text-xs text-zinc-600">
                Selected: <span className="font-medium text-zinc-900">{imageFile.name}</span>
              </p>
            ) : null}
          </div>
          {imagePreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imagePreview} alt="Selected" className="max-h-64 rounded-xl object-contain shadow-md" />
          ) : null}
          <label className="block space-y-2">
            <span className="text-sm text-zinc-600">Optional caption</span>
            <textarea
              className="min-h-[100px] w-full rounded-xl border border-zinc-200 bg-white p-3 text-sm outline-none ring-zinc-300 focus:ring-2"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </label>
        </div>
      ) : null}

      {speechNote ? <p className="text-sm text-zinc-500">{speechNote}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={disabled || (!text.trim() && !imageFile)}
          onClick={() => void handleSubmit()}
          className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-zinc-900/20 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          Continue
        </button>
        <p className="text-xs text-zinc-500">Phases 2–3 run privately on the server when you continue.</p>
      </div>
    </section>
  );
}
