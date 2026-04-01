import { readFileAsDataUrl } from "../lib/read-file-as-data-url.js";

export class UploadMode {
  constructor({ recognitionApi, fileInput, clearButton, previewImage, fileName, resultView }) {
    this.recognitionApi = recognitionApi;
    this.fileInput = fileInput;
    this.clearButton = clearButton;
    this.previewImage = previewImage;
    this.fileName = fileName;
    this.resultView = resultView;
    this.selectedFile = null;
    this.selectedImageDataUrl = "";
    this.activeRequestId = 0;

    this.onFileChange = this.onFileChange.bind(this);
    this.onRecognize = this.onRecognize.bind(this);
    this.onClear = this.onClear.bind(this);
  }

  mount() {
    this.fileInput.addEventListener("change", this.onFileChange);
    this.clearButton.addEventListener("click", this.onClear);
  }

  async onFileChange(event) {
    const [file] = event.target.files ?? [];
    this.selectedFile = file || null;

    if (!this.selectedFile) {
      this.selectedImageDataUrl = "";
      this.previewImage.removeAttribute("src");
      this.previewImage.hidden = true;
      this.fileName.textContent = "No file selected.";
      return;
    }

    this.fileName.textContent = this.selectedFile.name;

    try {
      const dataUrl = await readFileAsDataUrl(this.selectedFile);
      this.selectedImageDataUrl = dataUrl;
      this.previewImage.src = dataUrl;
      this.previewImage.hidden = false;
      this.resultView.setStatus("Recognizing handwriting from image...");
      this.onRecognize();
    } catch (error) {
      this.resultView.setStatus(error instanceof Error ? error.message : "Failed to load image.");
    }
  }

  async onRecognize() {
    if (!this.selectedFile) {
      this.resultView.setStatus("Choose an image before running recognition.");
      return;
    }

    this.resultView.setStatus("Recognizing handwriting from image...");
    const requestId = this.activeRequestId + 1;
    this.activeRequestId = requestId;

    try {
      const result = await this.recognitionApi.recognizeImageInput({
        imageDataUrl: this.selectedImageDataUrl,
        mimeType: this.selectedFile.type
      });

      if (requestId !== this.activeRequestId) {
        return;
      }

      this.resultView.setResultText(result.text || "No text recognized.");
      this.resultView.setCandidates([]);
      this.resultView.setStatus("Image recognition complete.");
    } catch (error) {
      if (requestId !== this.activeRequestId) {
        return;
      }

      this.resultView.setResultText("Recognition failed.");
      this.resultView.setCandidates([]);
      this.resultView.setStatus(error instanceof Error ? error.message : "Recognition failed.");
    }
  }

  onClear() {
    this.selectedFile = null;
    this.selectedImageDataUrl = "";
    this.activeRequestId += 1;
    this.fileInput.value = "";
    this.previewImage.removeAttribute("src");
    this.previewImage.hidden = true;
    this.fileName.textContent = "No file selected.";
    this.resultView.setResultText("Nothing recognized yet.");
    this.resultView.setCandidates([]);
    this.resultView.setStatus("Upload selection cleared.");
  }
}
