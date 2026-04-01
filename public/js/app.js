import { StrokeCanvas } from "./lib/stroke-canvas.js";
import { ResultView } from "./lib/result-view.js";
import { CameraMode } from "./modes/camera-mode.js";
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
