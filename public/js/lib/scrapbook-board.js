import { PretextScrapbookLayout } from "./pretext-scrapbook-layout.js";

const STYLE_PRESETS = {
  sticky: {
    label: "Sticky Note",
    className: "artifact-sticky",
    width: 220,
    height: 172
  },
  circle: {
    label: "Circle",
    className: "artifact-circle",
    width: 188,
    height: 188
  },
  heart: {
    label: "Heart",
    className: "artifact-heart",
    width: 200,
    height: 184
  }
};

export class ScrapbookBoard {
  constructor({ surface, styleSelect, backgroundLayer, artifactsLayer }) {
    this.surface = surface;
    this.styleSelect = styleSelect;
    this.backgroundLayer = backgroundLayer;
    this.artifactsLayer = artifactsLayer;
    this.backgroundLayout = new PretextScrapbookLayout({ layer: backgroundLayer });
    this.artifacts = [];
    this.nextId = 1;
    this.dragState = null;
    this.resizeState = null;

    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.onResize = this.onResize.bind(this);
  }

  mount() {
    window.addEventListener("pointermove", this.onPointerMove);
    window.addEventListener("pointerup", this.onPointerUp);
    window.addEventListener("pointercancel", this.onPointerUp);
    window.addEventListener("resize", this.onResize);
    this.render();
  }

  onResize() {
    this.render();
  }

  refresh() {
    this.render();
  }

  addArtifact(text) {
    const trimmedText = String(text || "").trim();

    if (!trimmedText) {
      return false;
    }

    const style = this.styleSelect.value;
    const preset = STYLE_PRESETS[style];
    const artifact = {
      id: this.nextId,
      text: trimmedText,
      style,
      width: preset.width,
      height: preset.height,
      x: 28 + ((this.nextId - 1) % 3) * 108,
      y: 24 + ((this.nextId - 1) % 4) * 82,
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

  getObstacleGeometry() {
    return this.artifacts.map((artifact) => ({
      style: artifact.style,
      x: artifact.x,
      y: artifact.y,
      width: artifact.width,
      height: artifact.height
    }));
  }

  clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  onArtifactPointerDown(event, artifactId) {
    if (event.target.closest(".scrapbook-artifact-resize-handle") || this.resizeState) {
      return;
    }

    const artifact = this.artifacts.find((item) => item.id === artifactId);

    if (!artifact) {
      return;
    }

    const artifactElement = event.currentTarget;
    const artifactRect = artifactElement.getBoundingClientRect();
    const surfaceRect = this.surface.getBoundingClientRect();

    this.dragState = {
      artifactId,
      pointerId: event.pointerId,
      offsetX: event.clientX - artifactRect.left,
      offsetY: event.clientY - artifactRect.top,
      surfaceRect
    };

    this.bringToFront(artifact);
    event.preventDefault();
    this.render();
  }

  onResizeHandlePointerDown(event, artifactId) {
    event.stopPropagation();

    if (this.dragState) {
      return;
    }

    const artifact = this.artifacts.find((item) => item.id === artifactId);

    if (!artifact) {
      return;
    }

    this.bringToFront(artifact);
    this.resizeState = {
      artifactId,
      pointerId: event.pointerId,
      startWidth: artifact.width,
      startHeight: artifact.height,
      startX: event.clientX,
      startY: event.clientY
    };

    event.preventDefault();
    this.render();
  }

  onPointerMove(event) {
    if (this.dragState && event.pointerId === this.dragState.pointerId) {
      const artifact = this.artifacts.find((item) => item.id === this.dragState.artifactId);

      if (!artifact) {
        return;
      }

      const maxX = Math.max(0, this.surface.clientWidth - artifact.width);
      const maxY = Math.max(0, this.surface.clientHeight - artifact.height);
      const nextX = event.clientX - this.dragState.surfaceRect.left - this.dragState.offsetX;
      const nextY = event.clientY - this.dragState.surfaceRect.top - this.dragState.offsetY;

      artifact.x = this.clamp(nextX, 0, maxX);
      artifact.y = this.clamp(nextY, 0, maxY);
      event.preventDefault();
      this.render();
      return;
    }

    if (this.resizeState && event.pointerId === this.resizeState.pointerId) {
      const artifact = this.artifacts.find((item) => item.id === this.resizeState.artifactId);

      if (!artifact) {
        return;
      }

      const minWidth = artifact.style === "circle" ? 132 : 140;
      const minHeight = artifact.style === "circle" ? 132 : 120;
      const maxWidth = Math.max(minWidth, this.surface.clientWidth - artifact.x);
      const maxHeight = Math.max(minHeight, this.surface.clientHeight - artifact.y);
      const nextWidth = this.resizeState.startWidth + (event.clientX - this.resizeState.startX);
      const nextHeight = this.resizeState.startHeight + (event.clientY - this.resizeState.startY);

      artifact.width = this.clamp(nextWidth, minWidth, maxWidth);
      artifact.height = this.clamp(nextHeight, minHeight, maxHeight);

      if (artifact.style === "circle") {
        const diameter = Math.min(artifact.width, artifact.height);
        artifact.width = diameter;
        artifact.height = diameter;
      }

      event.preventDefault();
      this.render();
    }
  }

  onPointerUp(event) {
    if (this.dragState && event.pointerId === this.dragState.pointerId) {
      this.dragState = null;
      this.render();
    }

    if (this.resizeState && event.pointerId === this.resizeState.pointerId) {
      this.resizeState = null;
      this.render();
    }
  }

  renderArtifacts() {
    this.artifactsLayer.innerHTML = "";

    for (const artifact of this.artifacts) {
      const preset = STYLE_PRESETS[artifact.style];
      const element = document.createElement("article");
      element.className = `scrapbook-artifact ${preset.className}`;
      if (this.dragState?.artifactId === artifact.id) {
        element.classList.add("is-dragging");
      }
      if (this.resizeState?.artifactId === artifact.id) {
        element.classList.add("is-resizing");
      }
      element.style.left = `${artifact.x}px`;
      element.style.top = `${artifact.y}px`;
      element.style.width = `${artifact.width}px`;
      element.style.height = `${artifact.height}px`;
      element.style.zIndex = String(artifact.zIndex);
      element.dataset.artifactId = String(artifact.id);

      const label = document.createElement("p");
      label.className = "scrapbook-artifact-label";
      label.textContent = preset.label;

      const text = document.createElement("p");
      text.className = "scrapbook-artifact-text";
      text.textContent = artifact.text;

      const resizeHandle = document.createElement("button");
      resizeHandle.className = "scrapbook-artifact-resize-handle";
      resizeHandle.type = "button";
      resizeHandle.title = "Resize shape";
      resizeHandle.setAttribute("aria-label", "Resize shape");
      resizeHandle.addEventListener("pointerdown", (event) => this.onResizeHandlePointerDown(event, artifact.id));

      element.append(label, text, resizeHandle);
      element.addEventListener("pointerdown", (event) => this.onArtifactPointerDown(event, artifact.id));
      this.artifactsLayer.append(element);
    }
  }

  render() {
    this.backgroundLayout.render({
      width: this.surface.clientWidth,
      height: this.surface.clientHeight,
      obstacles: this.getObstacleGeometry()
    });
    this.renderArtifacts();
  }
}
