export class DrawMode {
  constructor({ strokeCanvas, recognitionApi, languageSelect, recognizeButton, clearButton, resultView }) {
    this.strokeCanvas = strokeCanvas;
    this.recognitionApi = recognitionApi;
    this.languageSelect = languageSelect;
    this.recognizeButton = recognizeButton;
    this.clearButton = clearButton;
    this.resultView = resultView;

    this.onRecognize = this.onRecognize.bind(this);
    this.onClear = this.onClear.bind(this);
  }

  mount() {
    this.recognizeButton.addEventListener("click", this.onRecognize);
    this.clearButton.addEventListener("click", this.onClear);
  }

  async onRecognize() {
    if (!this.strokeCanvas.hasInk()) {
      this.resultView.setStatus("Draw something before running recognition.");
      return;
    }

    this.recognizeButton.disabled = true;
    this.resultView.setStatus("Recognizing handwriting...");

    try {
      const payload = {
        ...this.strokeCanvas.getPayload(),
        language: this.languageSelect.value
      };

      const result = await this.recognitionApi.recognizeDrawInput(payload);
      this.resultView.setResultText(result.text || "No text recognized.");
      this.resultView.setCandidates(result.candidates || []);
      this.resultView.setStatus("Recognition complete.");
    } catch (error) {
      this.resultView.setResultText("Recognition failed.");
      this.resultView.setCandidates([]);
      this.resultView.setStatus(error instanceof Error ? error.message : "Recognition failed.");
    } finally {
      this.recognizeButton.disabled = false;
    }
  }

  onClear() {
    this.strokeCanvas.clear();
    this.resultView.setResultText("Nothing recognized yet.");
    this.resultView.setCandidates([]);
    this.resultView.setStatus("Canvas cleared.");
  }
}
