import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ChatMessage = { role: "user" | "assistant"; content: string };

const SYSTEM = `You are a warm, emotionally intelligent companion for someone using a reflection journal app.
You are not a therapist, not clinical care, and you do not diagnose. You listen, validate gently, and offer small, human-scale reflections.
Keep replies concise (two to five short paragraphs max unless they ask for depth). Use plain language. Never shame. If they seem at risk of harming themselves, encourage reaching trusted people or crisis lines without being alarmist.
Match their tone: calm if they are calm; soft if they are hurting; a little lighter if they welcome it.`;

function trimMessages(messages: ChatMessage[]): ChatMessage[] {
  const safe = messages
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({
      role: m.role,
      content: m.content.slice(0, 8000),
    }));
  return safe.slice(-24);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { messages?: ChatMessage[] };
    const messages = trimMessages(body.messages ?? []);
    if (!messages.length || messages[messages.length - 1]?.role !== "user") {
      return NextResponse.json({ error: "Send at least one user message." }, { status: 400 });
    }

    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) {
      const last = messages[messages.length - 1]?.content ?? "";
      const stub = `I am here with you. The full companion brain is resting right now, but I can still sit with what you wrote.

You shared: "${last.slice(0, 200)}${last.length > 200 ? "…" : ""}"

Whatever you are carrying sounds like it matters. If you want, say a little more about what felt strongest today. No pressure to fix anything, just to be heard.`;
      return NextResponse.json({ reply: stub, usedMock: true });
    }

    const client = new Anthropic({ apiKey: key });
    const apiMessages = messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const msg = await client.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 900,
      temperature: 0.65,
      system: SYSTEM,
      messages: apiMessages,
    });

    const block = msg.content.find((b) => b.type === "text");
    const text = block && block.type === "text" ? block.text : "";
    return NextResponse.json({
      reply: text.trim() || "I am here. Tell me a bit more when you are ready.",
      usedMock: false,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Companion chat failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
