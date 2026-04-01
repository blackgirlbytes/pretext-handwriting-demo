export class ModeSwitcher {
  constructor({ buttons, panels, title, hint, resultView, onModeChange }) {
    this.buttons = buttons;
    this.panels = panels;
    this.title = title;
    this.hint = hint;
    this.resultView = resultView;
    this.onModeChange = onModeChange;

    this.modeMeta = {
      draw: {
        title: "Draw",
        hint: "Draw with a mouse, trackpad, or touch. Recognition runs against Google Input Tools through the local app server.",
        resultStatus: "Draw something, then click Recognize."
      },
      upload: {
        title: "Upload Image",
        hint: "Upload a handwriting image. Recognition runs through the local server with the OpenAI Responses API.",
        resultStatus: "Choose an image, then click Recognize."
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
    this.resultView.setResultText("Nothing recognized yet.");
    this.resultView.setCandidates([]);
    this.resultView.setStatus(this.modeMeta[mode].resultStatus);
    this.onModeChange?.(mode);
  }
}
