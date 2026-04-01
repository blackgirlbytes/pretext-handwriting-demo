export class ModeSwitcher {
  constructor({ buttons, panels, title, hint, alternativesCard, resultView, onModeChange }) {
    this.buttons = buttons;
    this.panels = panels;
    this.title = title;
    this.hint = hint;
    this.alternativesCard = alternativesCard;
    this.resultView = resultView;
    this.onModeChange = onModeChange;

    this.modeMeta = {
      draw: {
        title: "Draw",
        hint: "Draw with a mouse, trackpad, or touch. Recognition runs against Google Input Tools through the local app server.",
        resultStatus: "Draw something. Recognition starts after you pause.",
        showAlternatives: true
      },
      upload: {
        title: "Upload Image",
        hint: "Upload a handwriting image. Recognition runs through the local server with the OpenAI Responses API.",
        resultStatus: "Choose an image. Recognition starts immediately.",
        showAlternatives: false
      },
      camera: {
        title: "Camera",
        hint: "Capture a handwriting frame from the camera. Recognition runs through the same OpenAI image endpoint used by Upload Image.",
        resultStatus: "Open the camera and capture a frame to recognize handwriting.",
        showAlternatives: false
      }
    };
  }

  mount(defaultMode = "draw") {
    for (const [mode, button] of Object.entries(this.buttons)) {
      button.addEventListener("click", () => this.setMode(mode));
    }

    this.setMode(defaultMode);
  }

  setMode(mode) {
    for (const [name, button] of Object.entries(this.buttons)) {
      button.dataset.active = String(name === mode);
    }

    for (const [name, panel] of Object.entries(this.panels)) {
      panel.hidden = name !== mode;
    }

    this.title.textContent = this.modeMeta[mode].title;
    this.hint.textContent = this.modeMeta[mode].hint;
    this.alternativesCard.hidden = !this.modeMeta[mode].showAlternatives;
    this.resultView.setResultText("Nothing recognized yet.");
    this.resultView.setCandidates([]);
    this.resultView.setStatus(this.modeMeta[mode].resultStatus);
    return this.onModeChange?.(mode);
  }
}
