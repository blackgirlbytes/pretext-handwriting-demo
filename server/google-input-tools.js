const GOOGLE_INPUT_TOOLS_URL = "https://inputtools.google.com/request";

function buildPayload({ strokes, width, height, language, preContext = "" }) {
  return {
    app_version: 0.4,
    api_level: "537.36",
    device: "pretext-handwriting-demo",
    input_type: 0,
    options: "enable_pre_space",
    requests: [
      {
        writing_guide: {
          writing_area_width: Math.max(1, Math.round(width)),
          writing_area_height: Math.max(1, Math.round(height))
        },
        pre_context: preContext,
        max_num_results: 8,
        max_completions: 0,
        language,
        ink: strokes.map((stroke) => [stroke.x, stroke.y, stroke.t])
      }
    ]
  };
}

function parseResponse(payload) {
  if (!Array.isArray(payload) || payload[0] !== "SUCCESS") {
    const message = Array.isArray(payload) ? payload[0] : "Unexpected response";
    throw new Error(`Google Input Tools request failed: ${message}`);
  }

  const firstResult = payload[1]?.[0];
  const candidates = firstResult?.[1] ?? [];

  return {
    text: candidates[0] ?? "",
    candidates
  };
}

export async function recognizeHandwriting({ strokes, width, height, language }) {
  const payload = buildPayload({ strokes, width, height, language });
  const params = new URLSearchParams({
    itc: `${language}-t-i0-handwrit`,
    app: "demopage"
  });

  const response = await fetch(`${GOOGLE_INPUT_TOOLS_URL}?${params.toString()}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=UTF-8"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Google Input Tools HTTP ${response.status}`);
  }

  const data = await response.json();
  return parseResponse(data);
}
