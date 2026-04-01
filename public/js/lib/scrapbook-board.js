const STYLE_PRESETS = {
  sticky: {
    label: "Sticky Note",
    className: "artifact-sticky"
  },
  circle: {
    label: "Circle",
    className: "artifact-circle"
  },
  heart: {
    label: "Heart",
    className: "artifact-heart"
  }
};

export class ScrapbookBoard {
  constructor({ surface, emptyState, styleSelect }) {
    this.surface = surface;
    this.emptyState = emptyState;
    this.styleSelect = styleSelect;
    this.artifacts = [];
    this.nextId = 1;
    this.dragState = null;

    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
  }

  mount() {
    window.addEventListener("pointermove", this.onPointerMove);
    window.addEventListener("pointerup", this.onPointerUp);
    window.addEventListener("pointercancel", this.onPointerUp);
    this.render();
  }

  addArtifact(text) {
    const trimmedText = String(text || "").trim();

    if (!trimmedText) {
      return false;
    }

    const artifact = {
      id: this.nextId,
      text: trimmedText,
      style: this.styleSelect.value,
      x: 24 + ((this.nextId - 1) % 3) * 100,
      y: 24 + ((this.nextId - 1) % 4) * 84,
      zIndex: this.nextId
    };

    this.nextId += 1;
    this.artifacts.push(artifact);
    this.render();
    return true;
  }

  bringToFront(artifact) {
    artifact.zIndex = this.nextId;
    this.nextId += 1;
  }

  onArtifactPointerDown(event, artifactId) {
    const artifact = this.artifacts.find((item) => item.id === artifactId);

    if (!artifact) {
      return;
    }

    const artifactElement = event.currentTarget;
    const artifactRect = artifactElement.getBoundingClientRect();
    const surfaceRect = this.surface.getBoundingClientRect();

    this.dragState = {
      artifactId,
      offsetX: event.clientX - artifactRect.left,
      offsetY: event.clientY - artifactRect.top,
      surfaceRect
    };

    this.bringToFront(artifact);
    artifactElement.setPointerCapture?.(event.pointerId);
    this.render();
  }

  onPointerMove(event) {
    if (!this.dragState) {
      return;
    }

    const artifact = this.artifacts.find((item) => item.id === this.dragState.artifactId);

    if (!artifact) {
      return;
    }

    const nextX = event.clientX - this.dragState.surfaceRect.left - this.dragState.offsetX;
    const nextY = event.clientY - this.dragState.surfaceRect.top - this.dragState.offsetY;

    artifact.x = Math.max(0, nextX);
    artifact.y = Math.max(0, nextY);
    this.render();
  }

  onPointerUp() {
    this.dragState = null;
  }

  render() {
    this.surface.innerHTML = "";
    this.emptyState.hidden = this.artifacts.length > 0;

    for (const artifact of this.artifacts) {
      const element = document.createElement("article");
      element.className = `scrapbook-artifact ${STYLE_PRESETS[artifact.style].className}`;
      element.style.left = `${artifact.x}px`;
      element.style.top = `${artifact.y}px`;
      element.style.zIndex = String(artifact.zIndex);
      element.dataset.artifactId = String(artifact.id);

      const label = document.createElement("p");
      label.className = "scrapbook-artifact-label";
      label.textContent = STYLE_PRESETS[artifact.style].label;

      const text = document.createElement("p");
      text.className = "scrapbook-artifact-text";
      text.textContent = artifact.text;

      element.append(label, text);
      element.addEventListener("pointerdown", (event) => this.onArtifactPointerDown(event, artifact.id));
      this.surface.append(element);
    }
  }
}
