# Handwriter Demo

Small local app for Draw mode and Upload Image handwriting recognition.

## Run

```bash
npm install
export OPENAI_API_KEY=your_api_key_here
npm run dev
```

Open `http://localhost:3000`.

## Modes

- `Draw`: captures canvas strokes in the browser and sends them to Google Input Tools through the local server.
- `Upload Image`: sends an uploaded image to the local server, which calls the OpenAI Responses API for handwriting OCR.
