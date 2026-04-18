import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Optional Whisper path. Requires OPENAI_API_KEY on the server.
 * The UI also supports Web Speech API without this endpoint.
 */
export async function POST(req: Request) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured on the server." },
      { status: 501 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof Blob) || file.size === 0) {
    return NextResponse.json({ error: "Missing audio file." }, { status: 400 });
  }

  const fd = new FormData();
  fd.append("model", "whisper-1");
  fd.append("file", file, "clip.webm");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: fd,
  });

  if (!res.ok) {
    const errText = await res.text();
    return NextResponse.json(
      { error: "Transcription failed.", detail: errText },
      { status: 502 }
    );
  }

  const data = (await res.json()) as { text?: string };
  return NextResponse.json({ text: data.text ?? "" });
}
