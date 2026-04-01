const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = process.env.OPENAI_OCR_MODEL || "gpt-4.1-mini";

function extractOutputText(payload) {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const parts = payload?.output ?? [];

  for (const item of parts) {
    for (const content of item?.content ?? []) {
      if (content?.type === "output_text" && typeof content.text === "string" && content.text.trim()) {
        return content.text.trim();
      }
    }
  }

  return "";
}

export async function recognizeHandwritingFromImage({ imageDataUrl, mimeType, apiKey }) {
  const resolvedApiKey = apiKey || process.env.OPENAI_API_KEY;

  if (!resolvedApiKey) {
    throw new Error("OpenAI API key is not configured for this session.");
  }

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resolvedApiKey}`
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: "Read the handwriting in this image and return only the recognized text. Preserve line breaks where they are clear. Do not add explanation."
            },
            {
              type: "input_image",
              image_url: imageDataUrl,
              detail: "auto"
            }
          ]
        }
      ]
    })
  });

  const payload = await response.json();

  if (!response.ok) {
    const message = payload?.error?.message || `OpenAI Responses API HTTP ${response.status}`;
    throw new Error(message);
  }

  return {
    text: extractOutputText(payload),
    model: payload.model || DEFAULT_MODEL,
    mimeType
  };
}
