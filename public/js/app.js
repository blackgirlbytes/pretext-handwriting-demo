import { StrokeCanvas } from "./lib/stroke-canvas.js";
import { DrawMode } from "./modes/draw-mode.js";
import { RecognitionApi } from "./services/recognition-api.js";

const strokeCanvas = new StrokeCanvas(document.querySelector("#draw-canvas"));
const recognitionApi = new RecognitionApi();

const drawMode = new DrawMode({
  strokeCanvas,
  recognitionApi,
  languageSelect: document.querySelector("#language-select"),
  recognizeButton: document.querySelector("#recognize-button"),
  clearButton: document.querySelector("#clear-button"),
  resultText: document.querySelector("#result-text"),
  candidateList: document.querySelector("#candidate-list"),
  status: document.querySelector("#status")
});

drawMode.mount();
