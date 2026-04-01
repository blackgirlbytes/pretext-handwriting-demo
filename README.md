# Handwriter Demo

Small local app for Draw mode and Upload Image handwriting recognition.

## Run

```bash
npm install
cp .env.example .env
# edit .env and set OPENAI_API_KEY
npm run dev
```

Open `http://localhost:3000`.

## Modes

- `Draw`: captures canvas strokes in the browser and sends them to Google Input Tools through the local server.
- `Upload Image`: sends an uploaded image to the local server, which calls the OpenAI Responses API for handwriting OCR.
