import { NextResponse } from "next/server";
import type { ProcessEntryRequest, ProcessEntryResponse } from "@/lib/domain/types";
import { describeImageBase64 } from "@/lib/server/normalize-entry";
import { runModelAnalysis } from "@/lib/server/run-model-analysis";
import { routeFork } from "@/lib/services/safety-router";
import { pickNurture } from "@/lib/services/nurture";
import { sentimentToVisualTheme } from "@/lib/services/creative-visual";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ProcessEntryRequest;
    const text = (body.text ?? "").trim();
    const hasImage = Boolean(body.imageBase64);

    let normalizedText = text;
    if (hasImage) {
      const description = await describeImageBase64(
        body.imageBase64!,
        body.imageMime ?? "image/jpeg",
        text
      );
      normalizedText = [description, text].filter(Boolean).join("\n\n");
    }

    if (!normalizedText.trim()) {
      return NextResponse.json({ error: "Nothing to process yet." }, { status: 400 });
    }

    const { analysis, usedMockAnalysis } = await runModelAnalysis(normalizedText);
    const fork = routeFork(analysis);

    const payload: ProcessEntryResponse = {
      normalizedText,
      analysis,
      fork,
      usedMockAnalysis,
    };

    if (fork === "creative") {
      payload.visual = sentimentToVisualTheme(analysis);
      payload.nurture = pickNurture(analysis);
    }

    return NextResponse.json(payload);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
