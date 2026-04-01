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

const ENTRY_DURATION_MS = 760;
const SURFACE_PADDING = 18;
const SPAWN_ANCHORS = [
  { x: 0.12, y: 0.14 },
  { x: 0.68, y: 0.16 },
  { x: 0.23, y: 0.38 },
  { x: 0.63, y: 0.42 },
  { x: 0.14, y: 0.7 },
  { x: 0.58, y: 0.74 }
];

function easeOutCubic(value) {
  return 1 - ((1 - value) ** 3);
}

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
    this.artifactElements = new Map();
    this.animationFrameId = null;

    this.tick = this.tick.bind(this);
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

  getSurfaceSize() {
    return {
      width: Math.max(this.surface.clientWidth, 720),
      height: Math.max(this.surface.clientHeight, 680)
    };
  }

  getPlacementForArtifact(preset, artifactId) {
    const surfaceSize = this.getSurfaceSize();
    const slot = SPAWN_ANCHORS[(artifactId - 1) % SPAWN_ANCHORS.length];
    const jitterSeed = artifactId * 37;
    const jitterX = ((jitterSeed % 5) - 2) * 18;
    const jitterY = ((Math.floor(jitterSeed / 5) % 5) - 2) * 16;
    const maxX = Math.max(SURFACE_PADDING, surfaceSize.width - preset.width - SURFACE_PADDING);
    const maxY = Math.max(SURFACE_PADDING, surfaceSize.height - preset.height - SURFACE_PADDING);
    const x = this.clamp((surfaceSize.width * slot.x) + jitterX, SURFACE_PADDING, maxX);
    const y = this.clamp((surfaceSize.height * slot.y) + jitterY, SURFACE_PADDING, maxY);

    return { x, y };
  }

  scheduleAnimation() {
    if (this.animationFrameId !== null) {
      return;
    }

    this.animationFrameId = window.requestAnimationFrame(this.tick);
  }

  tick(timestamp) {
    this.animationFrameId = null;
    this.updateAnimatedState(timestamp);
    this.renderBackground();
    this.renderArtifacts();

    if (this.artifacts.length > 0) {
      this.scheduleAnimation();
    }
  }

  addArtifact(text) {
    const trimmedText = String(text || "").trim();

    if (!trimmedText) {
      return false;
    }

    const style = this.styleSelect.value;
    const preset = STYLE_PRESETS[style];
    const artifactId = this.nextId;
    const placement = this.getPlacementForArtifact(preset, artifactId);
    const artifact = {
      id: artifactId,
      text: trimmedText,
      style,
      width: preset.width,
      height: preset.height,
      x: placement.x,
      y: placement.y,
      currentX: placement.x,
      currentY: placement.y,
      currentWidth: preset.width,
      currentHeight: preset.height,
      currentOpacity: 1,
      zIndex: artifactId,
      createdAt: performance.now(),
      driftPhaseX: artifactId * 0.73,
      driftPhaseY: artifactId * 1.11,
      driftSpeedX: 0.2 + ((artifactId % 4) * 0.03),
      driftSpeedY: 0.15 + ((artifactId % 3) * 0.025),
      driftAmplitudeX: 8 + ((artifactId % 3) * 3),
      driftAmplitudeY: 6 + ((artifactId % 4) * 2),
      spawnOffsetX: ((artifactId % 2) === 0 ? -1 : 1) * (28 + ((artifactId % 3) * 10)),
      spawnOffsetY: -24 - ((artifactId % 4) * 5)
    };

    this.nextId += 1;
    this.artifacts.push(artifact);
    this.render();
    this.scheduleAnimation();
    return true;
  }

  bringToFront(artifact) {
    artifact.zIndex = this.nextId;
    this.nextId += 1;
  }

  getObstacleGeometry() {
    return this.artifacts.map((artifact) => ({
      style: artifact.style,
      x: artifact.currentX,
      y: artifact.currentY,
      width: artifact.currentWidth,
      height: artifact.currentHeight
    }));
  }

  clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  syncArtifactToAnimatedState(artifact) {
    artifact.x = artifact.currentX;
    artifact.y = artifact.currentY;
    artifact.createdAt = performance.now() - ENTRY_DURATION_MS;
    artifact.spawnOffsetX = 0;
    artifact.spawnOffsetY = 0;
  }

  updateAnimatedState(timestamp = performance.now()) {
    const surfaceSize = this.getSurfaceSize();
    const timeSeconds = timestamp / 1000;

    for (const artifact of this.artifacts) {
      const isActive = this.dragState?.artifactId === artifact.id || this.resizeState?.artifactId === artifact.id;
      const progress = this.clamp((timestamp - artifact.createdAt) / ENTRY_DURATION_MS, 0, 1);
      const easedProgress = easeOutCubic(progress);
      const driftWeight = 0.35 + (0.65 * easedProgress);
      const driftX = isActive
        ? 0
        : Math.sin((timeSeconds * artifact.driftSpeedX * Math.PI * 2) + artifact.driftPhaseX) * artifact.driftAmplitudeX * driftWeight;
      const driftY = isActive
        ? 0
        : Math.cos((timeSeconds * artifact.driftSpeedY * Math.PI * 2) + artifact.driftPhaseY) * artifact.driftAmplitudeY * driftWeight;
      const entryFactor = 1 - easedProgress;
      const entryScale = 0.9 + (0.1 * easedProgress);
      const targetWidth = isActive ? artifact.width : artifact.width * entryScale;
      const targetHeight = isActive ? artifact.height : artifact.height * entryScale;
      const maxX = Math.max(SURFACE_PADDING, surfaceSize.width - targetWidth - SURFACE_PADDING);
      const maxY = Math.max(SURFACE_PADDING, surfaceSize.height - targetHeight - SURFACE_PADDING);
      const originX = artifact.x + (isActive ? 0 : artifact.spawnOffsetX * entryFactor) + driftX;
      const originY = artifact.y + (isActive ? 0 : artifact.spawnOffsetY * entryFactor) + driftY;

      artifact.currentWidth = targetWidth;
      artifact.currentHeight = targetHeight;
      artifact.currentX = this.clamp(originX, SURFACE_PADDING, maxX);
      artifact.currentY = this.clamp(originY, SURFACE_PADDING, maxY);
      artifact.currentOpacity = isActive ? 1 : 0.58 + (0.42 * easedProgress);
    }
  }

  onArtifactPointerDown(event, artifactId) {
    if (event.target.closest(".scrapbook-artifact-resize-handle") || this.resizeState) {
      return;
    }

    const artifact = this.artifacts.find((item) => item.id === artifactId);

    if (!artifact) {
      return;
    }

    this.updateAnimatedState(performance.now());
    this.syncArtifactToAnimatedState(artifact);
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

    this.updateAnimatedState(performance.now());
    this.syncArtifactToAnimatedState(artifact);
    this.bringToFront(artifact);
    artifact.width = artifact.currentWidth;
    artifact.height = artifact.currentHeight;
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
      this.scheduleAnimation();
    }

    if (this.resizeState && event.pointerId === this.resizeState.pointerId) {
      this.resizeState = null;
      this.render();
      this.scheduleAnimation();
    }
  }

  ensureArtifactElement(artifact) {
    let element = this.artifactElements.get(artifact.id);

    if (element) {
      return element;
    }

    const preset = STYLE_PRESETS[artifact.style];
    element = document.createElement("article");
    element.className = `scrapbook-artifact ${preset.className}`;
    element.dataset.artifactId = String(artifact.id);

    const label = document.createElement("p");
    label.className = "scrapbook-artifact-label";

    const text = document.createElement("p");
    text.className = "scrapbook-artifact-text";

    const resizeHandle = document.createElement("button");
    resizeHandle.className = "scrapbook-artifact-resize-handle";
    resizeHandle.type = "button";
    resizeHandle.title = "Resize shape";
    resizeHandle.setAttribute("aria-label", "Resize shape");
    resizeHandle.addEventListener("pointerdown", (event) => this.onResizeHandlePointerDown(event, artifact.id));

    element.append(label, text, resizeHandle);
    element.addEventListener("pointerdown", (event) => this.onArtifactPointerDown(event, artifact.id));

    this.artifactElements.set(artifact.id, element);
    this.artifactsLayer.append(element);
    return element;
  }

  renderArtifacts() {
    const activeIds = new Set(this.artifacts.map((artifact) => artifact.id));

    for (const [artifactId, element] of this.artifactElements.entries()) {
      if (!activeIds.has(artifactId)) {
        element.remove();
        this.artifactElements.delete(artifactId);
      }
    }

    for (const artifact of this.artifacts) {
      const preset = STYLE_PRESETS[artifact.style];
      const element = this.ensureArtifactElement(artifact);
      const label = element.querySelector(".scrapbook-artifact-label");
      const text = element.querySelector(".scrapbook-artifact-text");

      element.className = `scrapbook-artifact ${preset.className}`;
      element.classList.toggle("is-dragging", this.dragState?.artifactId === artifact.id);
      element.classList.toggle("is-resizing", this.resizeState?.artifactId === artifact.id);
      element.style.left = `${artifact.currentX}px`;
      element.style.top = `${artifact.currentY}px`;
      element.style.width = `${artifact.currentWidth}px`;
      element.style.height = `${artifact.currentHeight}px`;
      element.style.opacity = String(artifact.currentOpacity);
      element.style.zIndex = String(artifact.zIndex);

      if (label.textContent !== preset.label) {
        label.textContent = preset.label;
      }

      if (text.textContent !== artifact.text) {
        text.textContent = artifact.text;
      }
    }
  }

  renderBackground() {
    this.backgroundLayout.render({
      width: this.surface.clientWidth,
      height: this.surface.clientHeight,
      obstacles: this.getObstacleGeometry()
    });
  }

  render() {
    this.updateAnimatedState(performance.now());
    this.renderBackground();
    this.renderArtifacts();
  }
}
