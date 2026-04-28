import { TOOL_ERASER } from "./constants";

let measurementCanvas;

function getMeasurementContext() {
  if (!measurementCanvas && typeof document !== "undefined") {
    measurementCanvas = document.createElement("canvas");
  }

  return measurementCanvas?.getContext("2d") || null;
}

export function createItemId(prefix) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function drawStroke(ctx, stroke) {
  if (!stroke?.points?.length) {
    return;
  }

  ctx.save();
  ctx.globalCompositeOperation = stroke.tool === TOOL_ERASER ? "destination-out" : "source-over";
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.size;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  if (stroke.points.length === 1) {
    const point = stroke.points[0];
    ctx.beginPath();
    ctx.fillStyle = stroke.tool === TOOL_ERASER ? "#000000" : stroke.color;
    ctx.arc(point.x, point.y, stroke.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  if (stroke.points.length === 2) {
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    ctx.lineTo(stroke.points[1].x, stroke.points[1].y);
    ctx.stroke();
    ctx.restore();
    return;
  }

  ctx.beginPath();
  ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

  for (let index = 1; index < stroke.points.length - 1; index += 1) {
    const currentPoint = stroke.points[index];
    const nextPoint = stroke.points[index + 1];
    const midPointX = (currentPoint.x + nextPoint.x) / 2;
    const midPointY = (currentPoint.y + nextPoint.y) / 2;
    ctx.quadraticCurveTo(currentPoint.x, currentPoint.y, midPointX, midPointY);
  }

  const secondLastPoint = stroke.points[stroke.points.length - 2];
  const lastPoint = stroke.points[stroke.points.length - 1];
  ctx.quadraticCurveTo(secondLastPoint.x, secondLastPoint.y, lastPoint.x, lastPoint.y);
  ctx.stroke();
  ctx.restore();
}

export function drawTextElement(ctx, textItem) {
  if (!textItem?.text) {
    return;
  }

  ctx.save();
  ctx.fillStyle = textItem.color;
  ctx.font = `${textItem.fontWeight || 400} ${textItem.size || 28}px sans-serif`;
  ctx.textBaseline = "top";

  const lines = textItem.text.split("\n");
  lines.forEach((line, index) => {
    ctx.fillText(line, textItem.x, textItem.y + index * ((textItem.size || 28) + 6));
  });
  ctx.restore();
}

function drawTextLockIndicator(ctx, textItem, lockInfo, currentUserId) {
  const bounds = getTextBounds(textItem);
  const isLockedByCurrentUser = lockInfo?.userId === currentUserId;

  ctx.save();
  ctx.strokeStyle = isLockedByCurrentUser ? "rgba(37, 99, 235, 0.85)" : "rgba(249, 115, 22, 0.9)";
  ctx.setLineDash([6, 4]);
  ctx.lineWidth = 1.4;
  ctx.strokeRect(bounds.left - 6, bounds.top - 6, bounds.width + 12, bounds.height + 12);
  ctx.setLineDash([]);
  ctx.fillStyle = isLockedByCurrentUser ? "rgba(37, 99, 235, 0.9)" : "rgba(249, 115, 22, 0.92)";
  ctx.font = "600 12px sans-serif";
  ctx.textBaseline = "bottom";
  ctx.fillText(isLockedByCurrentUser ? "Editing" : "User is editing", bounds.left - 4, bounds.top - 10);
  ctx.restore();
}

export function renderScene(
  ctx,
  strokes,
  texts,
  remoteDrafts,
  localDraft,
  activeTool,
  brushSize,
  cursorPos,
  textLocks,
  currentUserId
) {
  const { width, height } = ctx.canvas;

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.restore();

  const camera = ctx.__camera || { x: 0, y: 0, zoom: 1 };
  const dpr = ctx.__dpr || 1;
  const viewWidth = width / dpr;
  const viewHeight = height / dpr;

  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.translate(viewWidth / 2, viewHeight / 2);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);

  for (const stroke of strokes) {
    drawStroke(ctx, stroke);
  }

  for (const textItem of texts) {
    const lockInfo = textLocks?.[textItem.id];
    const isLockedByCurrentUser = lockInfo?.userId === currentUserId;
    const hasVisibleText = typeof textItem?.text === "string" && textItem.text.trim().length > 0;

    if (!isLockedByCurrentUser) {
      drawTextElement(ctx, textItem);
    }

    if (lockInfo && hasVisibleText && !isLockedByCurrentUser) {
      drawTextLockIndicator(ctx, textItem, lockInfo, currentUserId);
    }
  }

  for (const stroke of Object.values(remoteDrafts)) {
    drawStroke(ctx, stroke);
  }

  if (localDraft) {
    drawStroke(ctx, localDraft);
  }

  if (activeTool === TOOL_ERASER && cursorPos) {
    drawEraserCursor(ctx, cursorPos, brushSize);
  }

  ctx.restore();
}

function drawEraserCursor(ctx, cursorPos, brushSize) {
  const eraserSize = Math.max(Number(brushSize) * 2, 12);
  ctx.save();
  ctx.strokeStyle = "rgba(15, 23, 42, 0.5)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cursorPos.x, cursorPos.y, eraserSize / 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawGrid(ctx, camera, viewWidth, viewHeight) {
  const minorStep = 24 * camera.zoom;
  const majorStep = minorStep * 5;
  const offsetX = ((-camera.x * camera.zoom + viewWidth / 2) % minorStep + minorStep) % minorStep;
  const offsetY = ((-camera.y * camera.zoom + viewHeight / 2) % minorStep + minorStep) % minorStep;
  const majorOffsetX = ((-camera.x * camera.zoom + viewWidth / 2) % majorStep + majorStep) % majorStep;
  const majorOffsetY = ((-camera.y * camera.zoom + viewHeight / 2) % majorStep + majorStep) % majorStep;

  ctx.save();
  ctx.fillStyle = "#fffefb";
  ctx.fillRect(0, 0, viewWidth, viewHeight);

  ctx.strokeStyle = "rgba(15, 23, 42, 0.025)";
  ctx.lineWidth = 1;
  for (let x = offsetX; x <= viewWidth; x += minorStep) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, viewHeight);
    ctx.stroke();
  }

  for (let y = offsetY; y <= viewHeight; y += minorStep) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(viewWidth, y);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(15, 23, 42, 0.045)";
  for (let x = majorOffsetX; x <= viewWidth; x += majorStep) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, viewHeight);
    ctx.stroke();
  }

  for (let y = majorOffsetY; y <= viewHeight; y += majorStep) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(viewWidth, y);
    ctx.stroke();
  }
  ctx.restore();
}

export function syncCanvasSize(canvas) {
  const bounds = canvas.getBoundingClientRect();
  const dpr = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
  const width = Math.max(Math.round(bounds.width * dpr), 1);
  const height = Math.max(Math.round(bounds.height * dpr), 1);

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  return {
    dpr,
    width: bounds.width,
    height: bounds.height
  };
}

export function pointFromEvent(canvas, event, camera) {
  const bounds = canvas.getBoundingClientRect();
  const screenX = event.clientX - bounds.left;
  const screenY = event.clientY - bounds.top;

  return {
    x: camera.x + (screenX - bounds.width / 2) / camera.zoom,
    y: camera.y + (screenY - bounds.height / 2) / camera.zoom
  };
}

export function overlayPosition(point, camera, viewport) {
  const width = viewport?.width || 0;
  const height = viewport?.height || 0;

  return {
    left: `${width / 2 + (point.x - camera.x) * camera.zoom}px`,
    top: `${height / 2 + (point.y - camera.y) * camera.zoom}px`
  };
}

export function measureTextItem(textItem) {
  const fallbackSize = textItem?.size || 28;
  const lines = (textItem?.text || "").split("\n");
  const ctx = getMeasurementContext();
  const lineHeight = fallbackSize + 6;

  if (!ctx) {
    const longestLineLength = lines.reduce((longest, line) => Math.max(longest, line.length), 1);
    return {
      width: Math.max(longestLineLength * fallbackSize * 0.58, 80),
      height: Math.max(lines.length * lineHeight, fallbackSize + 12)
    };
  }

  ctx.font = `${textItem?.fontWeight || 400} ${fallbackSize}px sans-serif`;
  const width = lines.reduce((longest, line) => Math.max(longest, ctx.measureText(line || " ").width), 0);

  return {
    width: Math.max(width, 80),
    height: Math.max(lines.length * lineHeight, fallbackSize + 12)
  };
}

export function getTextBounds(textItem) {
  const { width, height } = measureTextItem(textItem);

  return {
    left: textItem.x,
    top: textItem.y,
    right: textItem.x + width,
    bottom: textItem.y + height,
    width,
    height
  };
}

export function findTextAtPoint(texts, point) {
  for (let index = texts.length - 1; index >= 0; index -= 1) {
    const textItem = texts[index];
    const bounds = getTextBounds(textItem);
    if (
      point.x >= bounds.left &&
      point.x <= bounds.right &&
      point.y >= bounds.top &&
      point.y <= bounds.bottom
    ) {
      return textItem;
    }
  }

  return null;
}

export function zoomCameraAtPoint(camera, nextZoom, screenPoint) {
  const zoomRatio = nextZoom / camera.zoom;

  return {
    x: camera.x + (screenPoint.x - screenPoint.x / zoomRatio) / camera.zoom,
    y: camera.y + (screenPoint.y - screenPoint.y / zoomRatio) / camera.zoom,
    zoom: nextZoom
  };
}
