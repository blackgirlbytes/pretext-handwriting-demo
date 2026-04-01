export class RecognitionApi {
  async recognizeDrawInput(payload) {
    return this.post("/api/recognize/draw", payload);
  }

  async recognizeUploadedImage(payload) {
    return this.post("/api/recognize/image", payload);
  }

  async post(url, payload) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Recognition request failed.");
    }

    return data;
  }
}
