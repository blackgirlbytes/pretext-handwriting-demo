export class CameraMode {
  constructor({ recognitionApi, captureButton, retakeButton, video, previewImage, resultView }) {
    this.recognitionApi = recognitionApi;
    this.captureButton = captureButton;
    this.retakeButton = retakeButton;
    this.video = video;
    this.previewImage = previewImage;
    this.resultView = resultView;
    this.stream = null;
    this.capturedImageDataUrl = "";
    this.activeRequestId = 0;
    this.isActiveMode = false;

    this.onCapture = this.onCapture.bind(this);
    this.onRetake = this.onRetake.bind(this);
  }

  mount() {
    this.captureButton.addEventListener("click", this.onCapture);
    this.retakeButton.addEventListener("click", this.onRetake);
    this.syncControls();
  }

  async enterMode() {
    this.isActiveMode = true;

    if (!this.capturedImageDataUrl) {
      await this.startCamera();
    } else {
      this.syncControls();
    }
  }

  leaveMode() {
    this.isActiveMode = false;
    this.stopCamera();
  }

  async startCamera() {
    if (this.stream || !this.isActiveMode) {
      this.syncControls();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      this.resultView.setStatus("This browser does not support camera capture.");
      this.syncControls();
      return;
    }

    this.resultView.setStatus("Starting camera...");

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" }
        },
        audio: false
      });

      this.video.srcObject = this.stream;
      await this.video.play();
      this.previewImage.hidden = true;
      this.video.hidden = false;
      this.resultView.setStatus("Point the camera at handwriting, then capture a frame.");
    } catch (error) {
      this.resultView.setStatus(
        error instanceof Error ? error.message : "Unable to access the camera."
      );
    } finally {
      this.syncControls();
    }
  }

  stopCamera() {
    if (!this.stream) {
      return;
    }

    for (const track of this.stream.getTracks()) {
      track.stop();
    }

    this.video.pause();
    this.video.srcObject = null;
    this.stream = null;
    this.syncControls();
  }

  syncControls() {
    this.captureButton.disabled = !this.stream;
    this.retakeButton.disabled = !this.capturedImageDataUrl;
  }

  async onCapture() {
    if (!this.stream) {
      await this.startCamera();
      return;
    }

    if (!this.video.videoWidth || !this.video.videoHeight) {
      this.resultView.setStatus("Camera is not ready yet. Try again in a moment.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = this.video.videoWidth;
    canvas.height = this.video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      this.resultView.setStatus("Unable to capture a frame from the camera.");
      return;
    }
    context.drawImage(this.video, 0, 0, canvas.width, canvas.height);

    this.capturedImageDataUrl = canvas.toDataURL("image/jpeg", 0.92);
    this.previewImage.src = this.capturedImageDataUrl;
    this.previewImage.hidden = false;
    this.video.hidden = true;
    this.stopCamera();
    await this.runRecognition();
    this.syncControls();
  }

  async runRecognition() {
    if (!this.capturedImageDataUrl) {
      this.resultView.setStatus("Capture a frame before running recognition.");
      return;
    }

    this.resultView.setStatus("Recognizing handwriting from camera image...");
    const requestId = this.activeRequestId + 1;
    this.activeRequestId = requestId;

    try {
      const result = await this.recognitionApi.recognizeImageInput({
        imageDataUrl: this.capturedImageDataUrl,
        mimeType: "image/jpeg"
      });

      if (requestId !== this.activeRequestId) {
        return;
      }

      this.resultView.setResultText(result.text || "No text recognized.");
      this.resultView.setCandidates([]);
      this.resultView.setStatus("Camera recognition complete.");
    } catch (error) {
      if (requestId !== this.activeRequestId) {
        return;
      }

      this.resultView.setResultText("Recognition failed.");
      this.resultView.setCandidates([]);
      this.resultView.setStatus(error instanceof Error ? error.message : "Recognition failed.");
    }
  }

  async onRetake() {
    this.activeRequestId += 1;
    this.capturedImageDataUrl = "";
    this.previewImage.removeAttribute("src");
    this.previewImage.hidden = true;
    this.video.hidden = false;
    this.resultView.setResultText("Nothing recognized yet.");
    this.resultView.setCandidates([]);

    if (this.isActiveMode) {
      await this.startCamera();
    } else {
      this.resultView.setStatus("Camera cleared.");
    }
  }
}
