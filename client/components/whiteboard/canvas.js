import { CANVAS_HEIGHT, CANVAS_WIDTH, TOOL_ERASER } from "./constants";

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
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

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
}

export function pointFromEvent(canvas, event) {
  const bounds = canvas.getBoundingClientRect();
  const scaleX = CANVAS_WIDTH / bounds.width;
  const scaleY = CANVAS_HEIGHT / bounds.height;

  return {
    x: (event.clientX - bounds.left) * scaleX,
    y: (event.clientY - bounds.top) * scaleY
  };
}

export function overlayPosition(point) {
  return {
    left: `${(point.x / CANVAS_WIDTH) * 100}%`,
    top: `${(point.y / CANVAS_HEIGHT) * 100}%`
  };
}
