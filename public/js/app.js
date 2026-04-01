import { StrokeCanvas } from "./lib/stroke-canvas.js";
import { ResultView } from "./lib/result-view.js";
import { DrawMode } from "./modes/draw-mode.js";
import { ModeSwitcher } from "./modes/mode-switcher.js";
import { UploadMode } from "./modes/upload-mode.js";
import { RecognitionApi } from "./services/recognition-api.js";

const strokeCanvas = new StrokeCanvas(document.querySelector("#draw-canvas"));
const recognitionApi = new RecognitionApi();
const resultView = new ResultView({
  resultText: document.querySelector("#result-text"),
  candidateList: document.querySelector("#candidate-list"),
  status: document.querySelector("#status")
});

const drawMode = new DrawMode({
  strokeCanvas,
  recognitionApi,
  languageSelect: document.querySelector("#language-select"),
  clearButton: document.querySelector("#clear-button"),
  resultView
});

const uploadMode = new UploadMode({
  recognitionApi,
  fileInput: document.querySelector("#image-file"),
  uploadButton: document.querySelector("#upload-recognize-button"),
  clearButton: document.querySelector("#upload-clear-button"),
  previewImage: document.querySelector("#upload-preview-image"),
  fileName: document.querySelector("#image-file-name"),
  resultView
});

const modeSwitcher = new ModeSwitcher({
  buttons: {
    draw: document.querySelector("#mode-draw-button"),
    upload: document.querySelector("#mode-upload-button")
  },
  panels: {
    draw: document.querySelector("#draw-panel"),
    upload: document.querySelector("#upload-panel")
  },
  title: document.querySelector("#mode-title"),
  hint: document.querySelector("#mode-hint"),
  resultView,
  onModeChange: (mode) => {
    if (mode === "draw") {
      strokeCanvas.resize();
    }
  }
});

drawMode.mount();
uploadMode.mount();
modeSwitcher.mount();
