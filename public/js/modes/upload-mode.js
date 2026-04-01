import { readFileAsDataUrl } from "../lib/read-file-as-data-url.js";

export class UploadMode {
  constructor({ recognitionApi, fileInput, uploadButton, clearButton, previewImage, fileName, resultView }) {
    this.recognitionApi = recognitionApi;
    this.fileInput = fileInput;
    this.uploadButton = uploadButton;
    this.clearButton = clearButton;
    this.previewImage = previewImage;
    this.fileName = fileName;
    this.resultView = resultView;
    this.selectedFile = null;

    this.onFileChange = this.onFileChange.bind(this);
    this.onRecognize = this.onRecognize.bind(this);
    this.onClear = this.onClear.bind(this);
  }

  mount() {
    this.fileInput.addEventListener("change", this.onFileChange);
    this.uploadButton.addEventListener("click", this.onRecognize);
    this.clearButton.addEventListener("click", this.onClear);
  }

  async onFileChange(event) {
    const [file] = event.target.files ?? [];
    this.selectedFile = file || null;

    if (!this.selectedFile) {
      this.previewImage.removeAttribute("src");
      this.previewImage.hidden = true;
      this.fileName.textContent = "No file selected.";
      return;
    }

    this.fileName.textContent = this.selectedFile.name;

    try {
      const dataUrl = await readFileAsDataUrl(this.selectedFile);
      this.previewImage.src = dataUrl;
      this.previewImage.hidden = false;
      this.resultView.setStatus("Image ready. Click Recognize.");
    } catch (error) {
      this.resultView.setStatus(error instanceof Error ? error.message : "Failed to load image.");
    }
  }

  async onRecognize() {
    if (!this.selectedFile) {
      this.resultView.setStatus("Choose an image before running recognition.");
      return;
    }

    this.uploadButton.disabled = true;
    this.resultView.setStatus("Recognizing handwriting from image...");

    try {
      const imageDataUrl = await readFileAsDataUrl(this.selectedFile);
      const result = await this.recognitionApi.recognizeUploadedImage({
        imageDataUrl,
        mimeType: this.selectedFile.type
      });

      this.resultView.setResultText(result.text || "No text recognized.");
      this.resultView.setCandidates([]);
      this.resultView.setStatus("Image recognition complete.");
    } catch (error) {
      this.resultView.setResultText("Recognition failed.");
      this.resultView.setCandidates([]);
      this.resultView.setStatus(error instanceof Error ? error.message : "Recognition failed.");
    } finally {
      this.uploadButton.disabled = false;
    }
  }

  onClear() {
    this.selectedFile = null;
    this.fileInput.value = "";
    this.previewImage.removeAttribute("src");
    this.previewImage.hidden = true;
    this.fileName.textContent = "No file selected.";
    this.resultView.setResultText("Nothing recognized yet.");
    this.resultView.setCandidates([]);
    this.resultView.setStatus("Upload selection cleared.");
  }
}
