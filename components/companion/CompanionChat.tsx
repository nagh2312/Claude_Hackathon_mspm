"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { AnalysisResult } from "@/lib/domain/types";
import { companionChat } from "@/lib/client/api";
import { quickAnalysisFromText } from "@/lib/services/quick-mood";

type Msg = { role: "user" | "assistant"; content: string };

interface CompanionChatProps {
  onMoodFromAnalysis: (analysis: AnalysisResult) => void;
  surfaceStyle?: CSSProperties;
}

export function CompanionChat({ onMoodFromAnalysis, surfaceStyle }: CompanionChatProps) {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hey — I'm here to listen, not to judge. What's alive for you today, even if it's messy or small?",
    },
  ]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || pending) return;
    setError(null);
    const userMsg: Msg = { role: "user", content: text };
    const thread = [...messages, userMsg];
    setInput("");
    setMessages(thread);
    setPending(true);
    onMoodFromAnalysis(quickAnalysisFromText(text));
    try {
      const { reply } = await companionChat(thread);
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
      onMoodFromAnalysis(quickAnalysisFromText(`${text}\n${reply}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reach the companion.");
    } finally {
      setPending(false);
    }
  }, [input, messages, onMoodFromAnalysis, pending]);

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
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Companion</p>
        <h2 className="font-display text-3xl text-zinc-900">A quiet conversation</h2>
        <p className="text-sm text-zinc-600">
          This is supportive chat, not therapy or crisis care. For emergencies, use local emergency services.
        </p>
      </header>

      <div className="max-h-[420px] space-y-4 overflow-y-auto rounded-2xl border border-zinc-200/80 bg-white/70 p-4">
        {messages.map((m, i) => (
          <div
            key={`${m.role}-${i}`}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-800 ring-1 ring-zinc-200/80"
              }`}
            >
              <span className="mb-1 block text-[10px] uppercase tracking-widest opacity-70">
                {m.role === "user" ? "You" : "Companion"}
              </span>
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1 text-sm text-zinc-600">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">Your words</span>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={3}
            placeholder="Say it however it comes out…"
            className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 shadow-inner outline-none ring-0 focus:border-zinc-500"
          />
        </label>
        <button
          type="button"
          onClick={() => void send()}
          disabled={pending || !input.trim()}
          className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Sending…" : "Send"}
        </button>
      </div>
    </section>
  );
}
