import { ApiKeyGate } from "./lib/api-key-gate.js";
import { StrokeCanvas } from "./lib/stroke-canvas.js";
import { ResultView } from "./lib/result-view.js";
import { ScrapbookBoard } from "./lib/scrapbook-board.js";
import { CameraMode } from "./modes/camera-mode.js";
import { DrawMode } from "./modes/draw-mode.js";
import { ModeSwitcher } from "./modes/mode-switcher.js";
import { UploadMode } from "./modes/upload-mode.js";
import { RecognitionApi } from "./services/recognition-api.js";

const strokeCanvas = new StrokeCanvas(document.querySelector("#draw-canvas"));
const recognitionApi = new RecognitionApi();
const addToScrapbookButton = document.querySelector("#add-to-scrapbook-button");
const invalidScrapbookTexts = new Set([
  "Nothing recognized yet.",
  "Recognition failed.",
  "No text recognized."
]);
let latestRecognizedText = "Nothing recognized yet.";

function hasScrapbookReadyText(text) {
  return Boolean(text && text.trim() && !invalidScrapbookTexts.has(text));
}

const apiKeyGate = new ApiKeyGate({
  recognitionApi,
  gate: document.querySelector("#api-key-gate"),
  form: document.querySelector("#api-key-form"),
  input: document.querySelector("#api-key-input"),
  message: document.querySelector("#api-key-message"),
  appShell: document.querySelector(".app-shell"),
  statusBadge: document.querySelector("#api-key-status-badge"),
  changeButton: document.querySelector("#change-api-key-button")
});

const resultView = new ResultView({
  resultText: document.querySelector("#result-text"),
  candidateList: document.querySelector("#candidate-list"),
  status: document.querySelector("#status"),
  onResultTextChange: (text) => {
    latestRecognizedText = text;
    addToScrapbookButton.disabled = !hasScrapbookReadyText(text);
  }
});
const scrapbookBoard = new ScrapbookBoard({
  surface: document.querySelector("#scrapbook-surface"),
  styleSelect: document.querySelector("#artifact-style-select"),
  backgroundLayer: document.querySelector("#scrapbook-background-layer"),
  artifactsLayer: document.querySelector("#scrapbook-artifacts-layer")
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
  clearButton: document.querySelector("#upload-clear-button"),
  previewImage: document.querySelector("#upload-preview-image"),
  fileName: document.querySelector("#image-file-name"),
  resultView
});

const cameraMode = new CameraMode({
  recognitionApi,
  captureButton: document.querySelector("#camera-capture-button"),
  retakeButton: document.querySelector("#camera-retake-button"),
  video: document.querySelector("#camera-video"),
  previewImage: document.querySelector("#camera-preview-image"),
  resultView
});

const modeSwitcher = new ModeSwitcher({
  buttons: {
    draw: document.querySelector("#mode-draw-button"),
    upload: document.querySelector("#mode-upload-button"),
    camera: document.querySelector("#mode-camera-button")
  },
  panels: {
    draw: document.querySelector("#draw-panel"),
    upload: document.querySelector("#upload-panel"),
    camera: document.querySelector("#camera-panel")
  },
  title: document.querySelector("#mode-title"),
  hint: document.querySelector("#mode-hint"),
  alternativesCard: document.querySelector("#alternatives-card"),
  resultView,
  onModeChange: async (mode) => {
    cameraMode.leaveMode();

    if (mode === "draw") {
      strokeCanvas.resize();
    }

    if (mode === "camera") {
      await cameraMode.enterMode();
    }
  }
});

drawMode.mount();
uploadMode.mount();
cameraMode.mount();
modeSwitcher.mount();
scrapbookBoard.mount();
apiKeyGate.mount();

addToScrapbookButton.disabled = true;

const outputTabs = {
  transcript: document.querySelector("#output-transcript-tab"),
  scrapbook: document.querySelector("#output-scrapbook-tab")
};

const outputPanels = {
  transcript: document.querySelector("#transcript-panel"),
  scrapbook: document.querySelector("#scrapbook-panel")
};

function setOutputTab(activeTab) {
  for (const [name, button] of Object.entries(outputTabs)) {
    button.dataset.active = String(name === activeTab);
  }

  for (const [name, panel] of Object.entries(outputPanels)) {
    panel.classList.toggle("is-active", name === activeTab);
  }

  if (activeTab === "scrapbook") {
    requestAnimationFrame(() => scrapbookBoard.refresh());
  }
}

outputTabs.transcript.addEventListener("click", () => setOutputTab("transcript"));
outputTabs.scrapbook.addEventListener("click", () => setOutputTab("scrapbook"));

addToScrapbookButton.addEventListener("click", () => {
  if (!hasScrapbookReadyText(latestRecognizedText)) {
    resultView.setStatus("Recognize some handwriting before adding it to the scrapbook.");
    return;
  }

  const hasArtifact = scrapbookBoard.addArtifact(latestRecognizedText);

  if (!hasArtifact) {
    resultView.setStatus("Recognize some handwriting before adding it to the scrapbook.");
    return;
  }

  resultView.setStatus("Added recognized text to the scrapbook.");
  setOutputTab("scrapbook");
});

apiKeyGate.init();
