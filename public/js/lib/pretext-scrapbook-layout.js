import { layoutNextLine, prepareWithSegments } from "/vendor/pretext/dist/layout.js";

const BACKGROUND_TEXT = [
  "The scrapbook starts as a field of notes, memories, and partial thoughts scattered across a page that keeps changing shape.",
  "Handwritten fragments become movable pieces, and the background writing has to keep finding a new path whenever one of those pieces drifts into its way.",
  "This is the difference between ordinary boxed text and a programmable layout surface: each line responds to geometry in the shared composition space instead of pretending the page is empty.",
  "Sticky notes interrupt the paragraph like pinned reminders, circles carve out softer pockets in the flow, and hearts create stranger contours that push the text into new routes.",
  "As you move each artifact, the page should feel more like a living collage than a static OCR result, with the background body visibly rerouting itself around the obstacles."
].join(" ");

const FONT = "16px Arial";
const LINE_HEIGHT = 24;
const PADDING = 28;
const MIN_SEGMENT_WIDTH = 36;

function mergeIntervals(intervals) {
  if (intervals.length === 0) {
    return [];
  }

  const sorted = intervals
    .map((interval) => ({
      start: Math.min(interval.start, interval.end),
      end: Math.max(interval.start, interval.end)
    }))
    .sort((a, b) => a.start - b.start);

  const merged = [sorted[0]];

  for (let i = 1; i < sorted.length; i += 1) {
    const current = sorted[i];
    const previous = merged[merged.length - 1];

    if (current.start <= previous.end) {
      previous.end = Math.max(previous.end, current.end);
    } else {
      merged.push(current);
    }
  }

  return merged;
}

function subtractIntervals(baseInterval, blockedIntervals) {
  const available = [];
  let cursor = baseInterval.start;

  for (const blocked of blockedIntervals) {
    if (blocked.end <= cursor) {
      continue;
    }

    if (blocked.start > cursor) {
      available.push({ start: cursor, end: blocked.start });
    }

    cursor = Math.max(cursor, blocked.end);
  }

  if (cursor < baseInterval.end) {
    available.push({ start: cursor, end: baseInterval.end });
  }

  return available.filter((interval) => interval.end - interval.start >= MIN_SEGMENT_WIDTH);
}

function getCircleInterval(obstacle, rowCenter) {
  const radius = obstacle.width / 2;
  const centerX = obstacle.x + radius;
  const centerY = obstacle.y + obstacle.height / 2;
  const deltaY = rowCenter - centerY;

  if (Math.abs(deltaY) >= radius) {
    return null;
  }

  const deltaX = Math.sqrt((radius * radius) - (deltaY * deltaY));
  return {
    start: centerX - deltaX,
    end: centerX + deltaX
  };
}

function getHeartHalfWidthRatio(normalizedY) {
  if (normalizedY < 0 || normalizedY > 1) {
    return 0;
  }

  if (normalizedY < 0.28) {
    return 0.18 + (normalizedY / 0.28) * 0.32;
  }

  if (normalizedY < 0.55) {
    return 0.5 - ((normalizedY - 0.28) / 0.27) * 0.08;
  }

  return Math.max(0.08, 0.42 * (1 - ((normalizedY - 0.55) / 0.45)));
}

function getHeartInterval(obstacle, rowCenter) {
  const normalizedY = (rowCenter - obstacle.y) / obstacle.height;
  const halfWidthRatio = getHeartHalfWidthRatio(normalizedY);

  if (halfWidthRatio <= 0) {
    return null;
  }

  const centerX = obstacle.x + obstacle.width / 2;
  const halfWidth = obstacle.width * halfWidthRatio;

  return {
    start: centerX - halfWidth,
    end: centerX + halfWidth
  };
}

function getObstacleIntervalForRow(obstacle, rowTop, rowBottom) {
  if (rowBottom <= obstacle.y || rowTop >= obstacle.y + obstacle.height) {
    return null;
  }

  if (obstacle.style === "sticky") {
    return {
      start: obstacle.x,
      end: obstacle.x + obstacle.width
    };
  }

  const rowCenter = rowTop + (LINE_HEIGHT / 2);

  if (obstacle.style === "circle") {
    return getCircleInterval(obstacle, rowCenter);
  }

  if (obstacle.style === "heart") {
    return getHeartInterval(obstacle, rowCenter);
  }

  return null;
}

function createLineElement(lineText, x, y, width) {
  const element = document.createElement("p");
  element.className = "scrapbook-background-line";
  element.textContent = lineText;
  element.style.left = `${x}px`;
  element.style.top = `${y}px`;
  element.style.width = `${Math.ceil(width)}px`;
  return element;
}

export class PretextScrapbookLayout {
  constructor({ layer }) {
    this.layer = layer;
    this.prepared = prepareWithSegments(BACKGROUND_TEXT, FONT);
  }

  render({ width, height, obstacles }) {
    this.layer.innerHTML = "";

    if (width <= PADDING * 2 || height <= PADDING * 2) {
      return;
    }

    const baseInterval = {
      start: PADDING,
      end: width - PADDING
    };

    let cursor = { segmentIndex: 0, graphemeIndex: 0 };
    let y = PADDING;
    const maxY = Math.max(PADDING, height - PADDING - LINE_HEIGHT);

    while (y <= maxY) {
      const rowTop = y;
      const rowBottom = y + LINE_HEIGHT;
      const blockedIntervals = mergeIntervals(
        obstacles
          .map((obstacle) => getObstacleIntervalForRow(obstacle, rowTop, rowBottom))
          .filter(Boolean)
          .map((interval) => ({
            start: Math.max(baseInterval.start, interval.start),
            end: Math.min(baseInterval.end, interval.end)
          }))
          .filter((interval) => interval.end > interval.start)
      );

      const availableIntervals = subtractIntervals(baseInterval, blockedIntervals);

      for (const interval of availableIntervals) {
        const line = layoutNextLine(this.prepared, cursor, interval.end - interval.start);

        if (line === null) {
          return;
        }

        this.layer.append(createLineElement(line.text, interval.start, y, line.width));
        cursor = line.end;
      }

      y += LINE_HEIGHT;
    }
  }
}
