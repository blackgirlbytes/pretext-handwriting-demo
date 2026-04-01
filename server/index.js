import "dotenv/config";

import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { recognizeHandwriting } from "./google-input-tools.js";
import { recognizeHandwritingFromImage } from "./openai-image-ocr.js";
import { getSession } from "./session-store.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "..", "public");
const pretextDir = path.join(__dirname, "..", "node_modules", "@chenglou", "pretext");

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "15mb" }));
app.use("/vendor/pretext", express.static(pretextDir));
app.use(express.static(publicDir));

app.get("/api/session/openai-key", (req, res) => {
  res.set("Cache-Control", "no-store");
  const session = getSession(req, res);

  return res.json({
    hasKey: Boolean(session.openAiApiKey || process.env.OPENAI_API_KEY),
    source: session.openAiApiKey ? "session" : (process.env.OPENAI_API_KEY ? "server" : "none")
  });
});

app.post("/api/session/openai-key", (req, res) => {
  res.set("Cache-Control", "no-store");
  const { apiKey } = req.body ?? {};

  if (typeof apiKey !== "string" || !apiKey.trim()) {
    return res.status(400).json({ error: "An OpenAI API key is required." });
  }

  const session = getSession(req, res);
  session.openAiApiKey = apiKey.trim();

  return res.status(201).json({
    hasKey: true,
    source: "session"
  });
});

app.delete("/api/session/openai-key", (req, res) => {
  res.set("Cache-Control", "no-store");
  const session = getSession(req, res);
  session.openAiApiKey = "";

  return res.status(204).end();
});

app.post("/api/recognize/draw", async (req, res) => {
  const { strokes, width, height, language = "en" } = req.body ?? {};

  if (!Array.isArray(strokes) || strokes.length === 0) {
    return res.status(400).json({ error: "At least one stroke is required." });
  }

  const invalidStroke = strokes.some((stroke) => {
    return !stroke || !Array.isArray(stroke.x) || !Array.isArray(stroke.y) || !Array.isArray(stroke.t);
  });

  if (invalidStroke) {
    return res.status(400).json({ error: "Each stroke must provide x, y, and t arrays." });
  }

  const mismatchedStroke = strokes.some((stroke) => {
    return stroke.x.length === 0 || stroke.x.length !== stroke.y.length || stroke.x.length !== stroke.t.length;
  });

  if (mismatchedStroke) {
    return res.status(400).json({ error: "Stroke point arrays must be non-empty and the same length." });
  }

  try {
    const result = await recognizeHandwriting({ strokes, width, height, language });
    return res.json(result);
  } catch (error) {
    return res.status(502).json({
      error: error instanceof Error ? error.message : "Recognition failed."
    });
  }
});

app.post("/api/recognize/image", async (req, res) => {
  res.set("Cache-Control", "no-store");
  const { imageDataUrl, mimeType = "image/png" } = req.body ?? {};

  if (typeof imageDataUrl !== "string" || !imageDataUrl.startsWith("data:image/")) {
    return res.status(400).json({ error: "A valid image data URL is required." });
  }

  if (!["image/png", "image/jpeg", "image/webp"].includes(mimeType)) {
    return res.status(400).json({ error: "Supported image types are PNG, JPEG, and WebP." });
  }

  try {
    const session = getSession(req, res);
    const apiKey = session.openAiApiKey || process.env.OPENAI_API_KEY;
    const result = await recognizeHandwritingFromImage({ imageDataUrl, mimeType, apiKey });
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Recognition failed.";
    const statusCode = message === "OpenAI API key is not configured for this session." ? 401 : 502;

    return res.status(statusCode).json({ error: message });
  }
});

app.listen(port, () => {
  console.log(`Handwriter running at http://localhost:${port}`);
});
