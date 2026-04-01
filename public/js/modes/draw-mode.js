export class DrawMode {
  constructor({ strokeCanvas, recognitionApi, languageSelect, recognizeButton, clearButton, resultText, candidateList, status }) {
    this.strokeCanvas = strokeCanvas;
    this.recognitionApi = recognitionApi;
    this.languageSelect = languageSelect;
    this.recognizeButton = recognizeButton;
    this.clearButton = clearButton;
    this.resultText = resultText;
    this.candidateList = candidateList;
    this.status = status;

    this.onRecognize = this.onRecognize.bind(this);
    this.onClear = this.onClear.bind(this);
  }

  mount() {
    this.recognizeButton.addEventListener("click", this.onRecognize);
    this.clearButton.addEventListener("click", this.onClear);
  }

  setStatus(message) {
    this.status.textContent = message;
  }

  setCandidates(candidates) {
    this.candidateList.innerHTML = "";

    if (!candidates.length) {
      const item = document.createElement("li");
      item.textContent = "No alternatives returned.";
      this.candidateList.append(item);
      return;
    }

    for (const candidate of candidates) {
      const item = document.createElement("li");
      item.textContent = candidate;
      this.candidateList.append(item);
    }
  }

  async onRecognize() {
    if (!this.strokeCanvas.hasInk()) {
      this.setStatus("Draw something before running recognition.");
      return;
    }

    this.recognizeButton.disabled = true;
    this.setStatus("Recognizing handwriting...");

    try {
      const payload = {
        ...this.strokeCanvas.getPayload(),
        language: this.languageSelect.value
      };

      const result = await this.recognitionApi.recognizeDrawInput(payload);
      this.resultText.textContent = result.text || "No text recognized.";
      this.setCandidates(result.candidates || []);
      this.setStatus("Recognition complete.");
    } catch (error) {
      this.resultText.textContent = "Recognition failed.";
      this.setCandidates([]);
      this.setStatus(error instanceof Error ? error.message : "Recognition failed.");
    } finally {
      this.recognizeButton.disabled = false;
    }
  }

  onClear() {
    this.strokeCanvas.clear();
    this.resultText.textContent = "Nothing recognized yet.";
    this.setCandidates([]);
    this.setStatus("Canvas cleared.");
  }
}
