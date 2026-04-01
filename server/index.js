import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { recognizeHandwriting } from "./google-input-tools.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "..", "public");

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "1mb" }));
app.use(express.static(publicDir));

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

app.listen(port, () => {
  console.log(`Handwriter running at http://localhost:${port}`);
});
