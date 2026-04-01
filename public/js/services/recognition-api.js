export class RecognitionApi {
  async recognizeDrawInput(payload) {
    const response = await fetch("/api/recognize/draw", {
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
