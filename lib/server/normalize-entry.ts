import Anthropic from "@anthropic-ai/sdk";

function toAnthropicMediaType(mime: string): "image/jpeg" | "image/png" | "image/gif" | "image/webp" {
  if (mime === "image/png" || mime === "image/gif" || mime === "image/webp") return mime;
  return "image/jpeg";
}

export async function describeImageBase64(
  imageBase64: string,
  imageMime: string,
  userText: string
): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return `[Image attached — add ANTHROPIC_API_KEY for vision description.] ${userText}`.trim();
  }

  const client = new Anthropic({ apiKey: key });
  const mediaType = toAnthropicMediaType(imageMime || "image/jpeg");

  const msg = await client.messages.create({
    model: "claude-3-5-haiku-20241022",
    max_tokens: 600,
    temperature: 0.3,
    system:
      "Describe what is in the image for a private journal. Note mood-relevant cues (setting, objects, weather) without diagnosing. 1 short paragraph.",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: imageBase64 },
          },
          {
            type: "text",
            text: userText
              ? `The person added this note with the photo:\n${userText}`
              : "No additional note with the photo.",
          },
        ],
      },
    ],
  });

  const block = msg.content.find((b) => b.type === "text");
  return block && block.type === "text" ? block.text : "";
}
