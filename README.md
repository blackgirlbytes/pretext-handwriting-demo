# Handwriter

Handwriter is a handwriting-to-scrapbook experiment built around three input paths:

- `Draw`: write directly in the browser on a canvas
- `Upload Image`: recognize handwriting from an uploaded image
- `Camera`: capture a photo and recognize handwriting from that frame

The project is intentionally not just a generic OCR demo. The longer-term goal is a scrapbook-style composition surface where recognized text becomes movable visual artifacts, and Pretext is used where programmable layout is visibly necessary.

## Recognition Architecture

The OCR split is deliberate:

- `Draw` uses captured stroke data and sends it to Google Input Tools over HTTP
- `Upload Image` uses the OpenAI Responses API with image input
- `Camera` uses the same OpenAI image-recognition flow as `Upload Image`

This means Draw mode does not rely on the browser handwriting API, and image-based modes do not use the Google stroke recognizer.

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a local `.env`

```bash
cp .env.example .env
```

Then edit `.env` and set your own values:

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_OCR_MODEL=gpt-4.1-mini
```

Notes:

- `OPENAI_API_KEY` is required for `Upload Image` and `Camera`
- `OPENAI_OCR_MODEL` is optional and defaults to `gpt-4.1-mini`
- Do not commit `.env`
- Do not put a real API key in this README or any tracked file

### 3. Start the app

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

## How To Use It

### Draw

- Open `Draw` mode
- Write on the canvas
- Recognition should run after you pause

### Upload Image

- Open `Upload Image`
- Choose a handwriting image
- OCR runs through the local server using your OpenAI API key

### Camera

- Open `Camera`
- Allow camera access
- Capture a frame containing handwriting
- OCR runs through the same local OpenAI-backed image endpoint

### Scrapbook

- After text is recognized, switch to the scrapbook view
- Add a shape artifact such as a sticky note, circle, or heart
- Drag and resize artifacts on the composition surface
- Background text is laid out with Pretext so it can route around moving obstacles

## Project Structure

Small high-level map:

- [public/index.html](/Users/rizel/Documents/agent-experiments/pretext-handwriting-demo/public/index.html): app shell and mode UI
- [public/styles.css](/Users/rizel/Documents/agent-experiments/pretext-handwriting-demo/public/styles.css): visual styling
- [public/js/app.js](/Users/rizel/Documents/agent-experiments/pretext-handwriting-demo/public/js/app.js): client bootstrapping
- [public/js/lib/scrapbook-board.js](/Users/rizel/Documents/agent-experiments/pretext-handwriting-demo/public/js/lib/scrapbook-board.js): scrapbook artifact interactions and motion
- [public/js/lib/pretext-scrapbook-layout.js](/Users/rizel/Documents/agent-experiments/pretext-handwriting-demo/public/js/lib/pretext-scrapbook-layout.js): Pretext background text layout
- [server/index.js](/Users/rizel/Documents/agent-experiments/pretext-handwriting-demo/server/index.js): Express server and API routes
- [server/google-input-tools.js](/Users/rizel/Documents/agent-experiments/pretext-handwriting-demo/server/google-input-tools.js): Draw-mode handwriting recognition proxy
- [server/openai-image-ocr.js](/Users/rizel/Documents/agent-experiments/pretext-handwriting-demo/server/openai-image-ocr.js): OpenAI image OCR integration

## Environment Variables

Supported local settings:

- `OPENAI_API_KEY`
  Used by image-based OCR flows.

- `OPENAI_OCR_MODEL`
  Optional model override for image OCR.

- `PORT`
  Optional local port override. Defaults to `3000`.

## Current Limitations

- Draw mode depends on the Google Input Tools web endpoint
- Image OCR depends on a valid OpenAI API key and network access
- Scrapbook state is local to the browser session and is not persisted
- The app is still an experiment, so deployment hardening is not finished

## Security Note

Use your own local `.env` for API keys during development. Keep `.env` out of git and out of screenshots, docs, and shared code snippets.
