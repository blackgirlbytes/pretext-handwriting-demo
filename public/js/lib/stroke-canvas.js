function createEmptyStroke() {
  return { x: [], y: [], t: [] };
}

export class StrokeCanvas {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.context.lineCap = "round";
    this.context.lineJoin = "round";
    this.context.strokeStyle = "#111827";
    this.context.lineWidth = 4;

    this.strokes = [];
    this.currentStroke = null;
    this.pointerId = null;
    this.sessionStart = 0;
    this.listeners = {
      input: new Set(),
      strokeEnd: new Set(),
      clear: new Set()
    };

    this.resize = this.resize.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);

    window.addEventListener("resize", this.resize);
    this.canvas.addEventListener("pointerdown", this.onPointerDown);
    this.canvas.addEventListener("pointermove", this.onPointerMove);
    this.canvas.addEventListener("pointerup", this.onPointerUp);
    this.canvas.addEventListener("pointerleave", this.onPointerUp);
    this.canvas.addEventListener("pointercancel", this.onPointerUp);

    this.resize();
    this.clear();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    this.canvas.width = Math.round(rect.width * ratio);
    this.canvas.height = Math.round(rect.height * ratio);
    this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.redraw();
  }

  clear() {
    this.strokes = [];
    this.currentStroke = null;
    this.pointerId = null;
    this.sessionStart = 0;
    this.redraw();
    this.emit("clear");
  }

  hasInk() {
    return this.strokes.length > 0;
  }

  getPayload() {
    return {
      width: this.canvas.clientWidth,
      height: this.canvas.clientHeight,
      strokes: this.strokes
    };
  }

  toPoint(event) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: Math.round(event.clientX - rect.left),
      y: Math.round(event.clientY - rect.top),
      t: Math.round(performance.now() - this.sessionStart)
    };
  }

  beginStroke(event) {
    if (!this.sessionStart) {
      this.sessionStart = performance.now();
    }

    this.currentStroke = createEmptyStroke();
    this.strokes.push(this.currentStroke);
    this.addPoint(event);
  }

  addPoint(event) {
    if (!this.currentStroke) {
      return;
    }

    const point = this.toPoint(event);
    this.currentStroke.x.push(point.x);
    this.currentStroke.y.push(point.y);
    this.currentStroke.t.push(point.t);
    this.redraw();
    this.emit("input");
  }

  endStroke() {
    this.currentStroke = null;
    this.pointerId = null;
    this.emit("strokeEnd");
  }

  on(eventName, listener) {
    this.listeners[eventName]?.add(listener);
  }

  emit(eventName) {
    for (const listener of this.listeners[eventName] ?? []) {
      listener();
    }
  }

  onPointerDown(event) {
    event.preventDefault();

    this.pointerId = event.pointerId;
    this.canvas.setPointerCapture(event.pointerId);
    this.beginStroke(event);
  }

  onPointerMove(event) {
    if (event.pointerId !== this.pointerId || !this.currentStroke) {
      return;
    }

    event.preventDefault();
    this.addPoint(event);
  }

  onPointerUp(event) {
    if (event.pointerId !== this.pointerId) {
      return;
    }

    event.preventDefault();
    this.endStroke();
  }

  redraw() {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    this.context.clearRect(0, 0, width, height);
    this.context.fillStyle = "#fffef8";
    this.context.fillRect(0, 0, width, height);

    for (const stroke of this.strokes) {
      if (stroke.x.length === 0) {
        continue;
      }

      this.context.beginPath();
      this.context.moveTo(stroke.x[0], stroke.y[0]);

      if (stroke.x.length === 1) {
        this.context.lineTo(stroke.x[0] + 0.01, stroke.y[0] + 0.01);
      }

      for (let i = 1; i < stroke.x.length; i += 1) {
        this.context.lineTo(stroke.x[i], stroke.y[i]);
      }

      this.context.stroke();
    }
  }
}
