import { TOOL_ERASER } from "./constants";

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
  ctx.beginPath();
  ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

  for (let index = 1; index < stroke.points.length; index += 1) {
    const point = stroke.points[index];
    ctx.lineTo(point.x, point.y);
  }

  if (stroke.points.length === 1) {
    const point = stroke.points[0];
    ctx.beginPath();
    ctx.fillStyle = stroke.tool === TOOL_ERASER ? "#000000" : stroke.color;
    ctx.arc(point.x, point.y, stroke.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  ctx.stroke();
  ctx.restore();
}

export function drawTextElement(ctx, textItem) {
  if (!textItem?.text) {
    return;
  }

  ctx.save();
  ctx.fillStyle = textItem.color;
  ctx.font = `${textItem.size || 28}px sans-serif`;
  ctx.textBaseline = "top";

  const lines = textItem.text.split("\n");
  lines.forEach((line, index) => {
    ctx.fillText(line, textItem.x, textItem.y + index * ((textItem.size || 28) + 6));
  });
  ctx.restore();
}

export function renderScene(ctx, strokes, texts, remoteDrafts, localDraft) {
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
    drawTextElement(ctx, textItem);
  }

  for (const stroke of Object.values(remoteDrafts)) {
    drawStroke(ctx, stroke);
  }

  if (localDraft) {
    drawStroke(ctx, localDraft);
  }

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

export function overlayPosition(point, camera) {
  return {
    left: `${(point.x - camera.x) * camera.zoom}px`,
    top: `${(point.y - camera.y) * camera.zoom}px`,
    transform: "translate(calc(50vw - 6px), calc(50vh - 6px))"
  };
}

export function zoomCameraAtPoint(camera, nextZoom, screenPoint) {
  const zoomRatio = nextZoom / camera.zoom;

  return {
    x: camera.x + (screenPoint.x - screenPoint.x / zoomRatio) / camera.zoom,
    y: camera.y + (screenPoint.y - screenPoint.y / zoomRatio) / camera.zoom,
    zoom: nextZoom
  };
}
