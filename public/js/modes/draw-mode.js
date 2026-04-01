export class DrawMode {
  constructor({ strokeCanvas, recognitionApi, languageSelect, clearButton, resultView }) {
    this.strokeCanvas = strokeCanvas;
    this.recognitionApi = recognitionApi;
    this.languageSelect = languageSelect;
    this.clearButton = clearButton;
    this.resultView = resultView;
    this.autoRecognizeDelayMs = 700;
    this.autoRecognizeTimer = null;
    this.activeRequestId = 0;
    this.lastRecognizedSignature = "";

    this.onRecognize = this.onRecognize.bind(this);
    this.onClear = this.onClear.bind(this);
    this.scheduleAutoRecognize = this.scheduleAutoRecognize.bind(this);
    this.onStrokeCanvasClear = this.onStrokeCanvasClear.bind(this);
  }

  mount() {
    this.clearButton.addEventListener("click", this.onClear);
    this.strokeCanvas.on("input", this.scheduleAutoRecognize);
    this.strokeCanvas.on("strokeEnd", this.scheduleAutoRecognize);
    this.strokeCanvas.on("clear", this.onStrokeCanvasClear);
  }

  buildSignature(payload) {
    return JSON.stringify({
      width: payload.width,
      height: payload.height,
      language: payload.language,
      strokes: payload.strokes
    });
  }

  scheduleAutoRecognize() {
    if (!this.strokeCanvas.hasInk()) {
      return;
    }

    window.clearTimeout(this.autoRecognizeTimer);
    this.resultView.setStatus("Waiting for you to finish writing...");
    this.autoRecognizeTimer = window.setTimeout(() => {
      this.onRecognize({ source: "auto" });
    }, this.autoRecognizeDelayMs);
  }

  onStrokeCanvasClear() {
    window.clearTimeout(this.autoRecognizeTimer);
    this.lastRecognizedSignature = "";
  }

  async onRecognize({ source = "manual" } = {}) {
    if (!this.strokeCanvas.hasInk()) {
      this.resultView.setStatus("Draw something before running recognition.");
      return;
    }

    window.clearTimeout(this.autoRecognizeTimer);

    const payload = {
      ...this.strokeCanvas.getPayload(),
      language: this.languageSelect.value
    };
    const signature = this.buildSignature(payload);

    if (signature === this.lastRecognizedSignature) {
      if (source === "auto") {
        this.resultView.setStatus("Recognition is up to date.");
      }
      return;
    }

    this.resultView.setStatus("Recognizing handwriting...");

    const requestId = this.activeRequestId + 1;
    this.activeRequestId = requestId;

    try {
      const result = await this.recognitionApi.recognizeDrawInput(payload);

      if (requestId !== this.activeRequestId) {
        return;
      }

      this.lastRecognizedSignature = signature;
      this.resultView.setResultText(result.text || "No text recognized.");
      this.resultView.setCandidates(result.candidates || []);
      this.resultView.setStatus("Recognition complete.");
    } catch (error) {
      if (requestId !== this.activeRequestId) {
        return;
      }

      this.resultView.setResultText("Recognition failed.");
      this.resultView.setCandidates([]);
      this.resultView.setStatus(error instanceof Error ? error.message : "Recognition failed.");
    } finally {
      if (requestId !== this.activeRequestId) {
        return;
      }
    }
  }

  onClear() {
    window.clearTimeout(this.autoRecognizeTimer);
    this.strokeCanvas.clear();
    this.resultView.setResultText("Nothing recognized yet.");
    this.resultView.setCandidates([]);
    this.resultView.setStatus("Canvas cleared.");
  }
}
