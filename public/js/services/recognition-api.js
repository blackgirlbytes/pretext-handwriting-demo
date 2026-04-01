export class RecognitionApi {
  async getOpenAiKeyStatus() {
    return this.get("/api/session/openai-key");
  }

  async saveOpenAiApiKey(apiKey) {
    return this.post("/api/session/openai-key", { apiKey });
  }

  async clearOpenAiApiKey() {
    return this.delete("/api/session/openai-key");
  }

  async recognizeDrawInput(payload) {
    return this.post("/api/recognize/draw", payload);
  }

  async recognizeImageInput(payload) {
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
      throw this.createError(response.status, data.error || "Recognition request failed.");
    }

    return data;
  }

  async get(url) {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw this.createError(response.status, data.error || "Request failed.");
    }

    return data;
  }

  async delete(url) {
    const response = await fetch(url, { method: "DELETE" });

    if (!response.ok) {
      let data = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      throw this.createError(response.status, data?.error || "Request failed.");
    }
  }

  createError(status, message) {
    if (status === 401) {
      window.dispatchEvent(
        new CustomEvent("handwriter:openai-key-required", {
          detail: { message }
        })
      );
    }

    const error = new Error(message);
    error.status = status;
    return error;
  }
}
