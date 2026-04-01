export class ApiKeyGate {
  constructor({
    recognitionApi,
    gate,
    form,
    input,
    submitButton,
    message,
    appShell,
    statusBadge,
    changeButton
  }) {
    this.recognitionApi = recognitionApi;
    this.gate = gate;
    this.form = form;
    this.input = input;
    this.submitButton = submitButton;
    this.message = message;
    this.appShell = appShell;
    this.statusBadge = statusBadge;
    this.changeButton = changeButton;

    this.onSubmit = this.onSubmit.bind(this);
    this.onSubmitButtonClick = this.onSubmitButtonClick.bind(this);
    this.onChangeKey = this.onChangeKey.bind(this);
    this.onKeyRequired = this.onKeyRequired.bind(this);
  }

  mount() {
    this.form.addEventListener("submit", this.onSubmit);
    this.submitButton.addEventListener("click", this.onSubmitButtonClick);
    this.changeButton.addEventListener("click", this.onChangeKey);
    window.addEventListener("handwriter:openai-key-required", this.onKeyRequired);
  }

  async init() {
    try {
      const status = await this.recognitionApi.getOpenAiKeyStatus();

      if (status.hasKey) {
        this.unlockApp(status.source);
      } else {
        this.lockApp("Enter your OpenAI API key to use image and camera handwriting recognition in this deployed app.");
      }
    } catch (error) {
      this.lockApp(error instanceof Error ? error.message : "OpenAI key setup is unavailable.");
    }
  }

  setBadgeText(text) {
    this.statusBadge.textContent = text;
  }

  setSubmitState({ disabled, label }) {
    this.submitButton.disabled = disabled;
    this.input.disabled = disabled;

    if (label) {
      this.submitButton.textContent = label;
    }
  }

  lockApp(message, { preserveInput = true } = {}) {
    this.gate.hidden = false;
    this.appShell.inert = true;
    this.appShell.setAttribute("aria-hidden", "true");
    this.message.textContent = message;
    this.setBadgeText("OpenAI key required");
    this.setSubmitState({
      disabled: false,
      label: "Start with this key"
    });

    if (!preserveInput) {
      this.input.value = "";
    }

    window.requestAnimationFrame(() => this.input.focus());
  }

  unlockApp(source = "session") {
    this.gate.hidden = true;
    this.appShell.inert = false;
    this.appShell.removeAttribute("aria-hidden");
    this.input.value = "";
    this.message.textContent = "Your key is used only for this browser session through the server-side OCR proxy.";
    this.setBadgeText(
      source === "server" ? "Server OpenAI key active" : "Session OpenAI key active"
    );
    this.setSubmitState({
      disabled: false,
      label: "Start with this key"
    });
  }

  async onSubmit(event) {
    event.preventDefault();
    const apiKey = this.input.value.trim();

    if (!apiKey) {
      this.message.textContent = "Enter an OpenAI API key before continuing.";
      this.input.focus();
      return;
    }

    this.message.textContent = "Saving key for this session...";
    this.setSubmitState({
      disabled: true,
      label: "Saving..."
    });

    try {
      const status = await this.recognitionApi.saveOpenAiApiKey(apiKey);
      this.unlockApp(status.source);
    } catch (error) {
      this.setSubmitState({
        disabled: false,
        label: "Start with this key"
      });
      this.message.textContent = error instanceof Error ? error.message : "Failed to save API key.";
    }
  }

  onSubmitButtonClick() {
    this.form.requestSubmit();
  }

  onChangeKey() {
    this.lockApp("Enter a different OpenAI API key for this browser session.", {
      preserveInput: false
    });
  }

  onKeyRequired(event) {
    const message = event.detail?.message || "Your OpenAI session key is missing. Enter it again to continue.";
    this.lockApp(message);
  }
}
