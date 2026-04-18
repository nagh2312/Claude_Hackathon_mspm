import Anthropic from "@anthropic-ai/sdk";
import type { AnalysisResult } from "@/lib/domain/types";
import { mockAnalysis } from "@/lib/services/mock-analysis";

const JSON_INSTRUCTION = `You are a careful journaling assistant, not a clinician.
Return ONLY valid JSON (no markdown) with this shape:
{
  "sentiment": { "valence": number -1 to 1, "arousal": number 0 to 1 },
  "themes": [{ "label": string, "weight": number 0 to 1 }],
  "patterns": [{ "windowDays": 7|30|90, "summary": string }],
  "crisis": { "level": "none"|"elevated"|"high", "rationale": string },
  "reflectionBlurb": string
}
Rules:
- crisis.level must be "high" if there is clear self-harm intent, method discussion, or goodbye notes; use "elevated" for sustained despair without clear plan; else "none".
- themes: up to 5 concise labels.
- patterns: 2 short summaries (you only see today's text; say what to watch for longitudinally).
- reflectionBlurb: 2 sentences, warm, non-clinical.`;

function coerceAnalysis(raw: unknown): AnalysisResult | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const sentiment = o.sentiment as Record<string, unknown> | undefined;
  const crisis = o.crisis as Record<string, unknown> | undefined;
  if (!sentiment || typeof sentiment.valence !== "number" || typeof sentiment.arousal !== "number")
    return null;
  if (!crisis || typeof crisis.level !== "string" || typeof crisis.rationale !== "string")
    return null;

  const themes = Array.isArray(o.themes)
    ? (o.themes as Record<string, unknown>[])
        .filter((t) => typeof t.label === "string" && typeof t.weight === "number")
        .map((t) => ({ label: t.label as string, weight: t.weight as number }))
    : [];

  const patterns = Array.isArray(o.patterns)
    ? (o.patterns as Record<string, unknown>[])
        .filter(
          (p) =>
            (p.windowDays === 7 || p.windowDays === 30 || p.windowDays === 90) &&
            typeof p.summary === "string"
        )
        .map((p) => ({
          windowDays: p.windowDays as 7 | 30 | 90,
          summary: p.summary as string,
        }))
    : [];

  const level = crisis.level === "high" || crisis.level === "elevated" || crisis.level === "none"
    ? crisis.level
    : "none";

  return {
    sentiment: {
      valence: Math.max(-1, Math.min(1, sentiment.valence)),
      arousal: Math.max(0, Math.min(1, sentiment.arousal)),
    },
    themes: themes.slice(0, 6),
    patterns: patterns.slice(0, 4),
    crisis: { level, rationale: crisis.rationale },
    reflectionBlurb: typeof o.reflectionBlurb === "string" ? o.reflectionBlurb : "",
  };
}

function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

export async function runModelAnalysis(unifiedText: string): Promise<{
  analysis: AnalysisResult;
  usedMockAnalysis: boolean;
}> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return { analysis: mockAnalysis(unifiedText), usedMockAnalysis: true };
  }

  const client = new Anthropic({ apiKey: key });
  const msg = await client.messages.create({
    model: "claude-3-5-haiku-20241022",
    max_tokens: 1200,
    temperature: 0.2,
    system: JSON_INSTRUCTION,
    messages: [
      {
        role: "user",
        content: `Journal entry (may include image description prefixed):\n\n${unifiedText}`,
      },
    ],
  });

  const block = msg.content.find((b) => b.type === "text");
  const text = block && block.type === "text" ? block.text : "";
  const parsed = extractJson(text);
  const analysis = coerceAnalysis(parsed);
  if (!analysis) {
    return { analysis: mockAnalysis(unifiedText), usedMockAnalysis: true };
  }
  return { analysis, usedMockAnalysis: false };
}
