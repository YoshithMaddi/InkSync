"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { API_URL } from "../lib/api";

const CANVAS_WIDTH = 1400;
const CANVAS_HEIGHT = 900;
const TOOL_PEN = "pen";
const TOOL_ERASER = "eraser";
const TOOL_TEXT = "text";

function ToolIcon({ kind }) {
  if (kind === "pen") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M4 20l4.5-1 9-9-3.5-3.5-9 9L4 20zM12.8 5.3l3.5 3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (kind === "eraser") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M8 16l6.8-6.8a2 2 0 012.8 0l1.2 1.2a2 2 0 010 2.8L14 18H9.8L8 16zm-2.6-2.6l6.2-6.2a2 2 0 012.8 0l1.2 1.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M14 18h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (kind === "text") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M6 6h12M12 6v12M9 18h6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (kind === "thickness") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="8" cy="12" r="2" fill="currentColor" />
        <circle cx="16" cy="12" r="4" fill="currentColor" />
      </svg>
    );
  }

  if (kind === "clear") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M6 7h12M9 7V5h6v2M8 7l1 12h6l1-12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (kind === "close") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M7 7l10 10M17 7L7 17"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8" fill="currentColor" />
    </svg>
  );
}

function createItemId(prefix) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function drawStroke(ctx, stroke) {
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

function drawTextElement(ctx, textItem) {
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

function renderScene(ctx, strokes, texts, remoteDrafts, localDraft) {
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

function pointFromEvent(canvas, event) {
  const bounds = canvas.getBoundingClientRect();
  const scaleX = CANVAS_WIDTH / bounds.width;
  const scaleY = CANVAS_HEIGHT / bounds.height;

  return {
    x: (event.clientX - bounds.left) * scaleX,
    y: (event.clientY - bounds.top) * scaleY
  };
}

function overlayPosition(point) {
  return {
    left: `${(point.x / CANVAS_WIDTH) * 100}%`,
    top: `${(point.y / CANVAS_HEIGHT) * 100}%`
  };
}

export default function WhiteboardRoom({
  roomId,
  initialStrokes = [],
  initialTexts = [],
  initialParticipantCount = 0,
  initialError = ""
}) {
  const canvasRef = useRef(null);
  const textInputRef = useRef(null);
  const socketRef = useRef(null);
  const currentStrokeRef = useRef(null);
  const [activeTool, setActiveTool] = useState(TOOL_PEN);
  const [brushColor, setBrushColor] = useState("#0f172a");
  const [brushSize, setBrushSize] = useState(5);
  const [strokes, setStrokes] = useState(initialStrokes);
  const [texts, setTexts] = useState(initialTexts);
  const [participantCount, setParticipantCount] = useState(initialParticipantCount);
  const [roomError, setRoomError] = useState(initialError);
  const [isDrawing, setIsDrawing] = useState(false);
  const [remoteDrafts, setRemoteDrafts] = useState({});
  const [pendingText, setPendingText] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const ctx = canvas.getContext("2d");
    renderScene(ctx, strokes, texts, remoteDrafts, currentStrokeRef.current);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const ctx = canvas.getContext("2d");
    renderScene(ctx, strokes, texts, remoteDrafts, currentStrokeRef.current);
  }, [strokes, texts, remoteDrafts]);

  useEffect(() => {
    if (pendingText && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [pendingText]);

  useEffect(() => {
    const socket = io(API_URL, {
      transports: ["websocket"]
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join-room", { roomId });
    });

    socket.on("room-state", (payload) => {
      setRoomError("");
      setStrokes(Array.isArray(payload.strokes) ? payload.strokes : []);
      setTexts(Array.isArray(payload.texts) ? payload.texts : []);
      setParticipantCount(Number(payload.participantCount) || 0);
      setRemoteDrafts({});
    });

    socket.on("participant-count", (payload) => {
      setParticipantCount(Number(payload.participantCount) || 0);
    });

    socket.on("stroke-added", (payload) => {
      setStrokes(payload.strokes);
      setRemoteDrafts((currentDrafts) => {
        const nextDrafts = { ...currentDrafts };
        delete nextDrafts[payload.senderId];
        return nextDrafts;
      });
    });

    socket.on("text-added", (payload) => {
      setTexts(payload.texts);
    });

    socket.on("stroke-started", ({ senderId, stroke }) => {
      setRemoteDrafts((currentDrafts) => ({
        ...currentDrafts,
        [senderId]: stroke
      }));
    });

    socket.on("stroke-progress", ({ senderId, point }) => {
      setRemoteDrafts((currentDrafts) => {
        const currentStroke = currentDrafts[senderId];
        if (!currentStroke) {
          return currentDrafts;
        }

        return {
          ...currentDrafts,
          [senderId]: {
            ...currentStroke,
            points: [...currentStroke.points, point]
          }
        };
      });
    });

    socket.on("board-cleared", () => {
      setStrokes([]);
      setTexts([]);
      setRemoteDrafts({});
      setPendingText(null);
    });

    socket.on("room-error", (payload) => {
      setRoomError(payload?.error || "Room not found. Create a room first.");
      setPendingText(null);
      setIsDrawing(false);
      currentStrokeRef.current = null;
      socket.disconnect();
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId]);

  function handlePointerDown(event) {
    if (roomError) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const point = pointFromEvent(canvas, event);

    if (activeTool === TOOL_TEXT) {
      setPendingText({
        id: createItemId("text"),
        x: point.x,
        y: point.y,
        text: "",
        color: brushColor,
        size: Math.max(Number(brushSize) * 5, 18)
      });
      return;
    }

    setPendingText(null);
    setIsDrawing(true);
    currentStrokeRef.current = {
      id: createItemId("stroke"),
      tool: activeTool,
      color: activeTool === TOOL_ERASER ? "#000000" : brushColor,
      size: activeTool === TOOL_ERASER ? Math.max(Number(brushSize) * 2, 12) : Number(brushSize),
      points: [point]
    };

    socketRef.current?.emit("stroke-start", {
      roomId,
      stroke: currentStrokeRef.current
    });
  }

  function handlePointerMove(event) {
    if (roomError) {
      return;
    }

    if (!isDrawing || !currentStrokeRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    currentStrokeRef.current.points.push(pointFromEvent(canvas, event));
    const ctx = canvas.getContext("2d");
    renderScene(ctx, strokes, texts, remoteDrafts, currentStrokeRef.current);
    socketRef.current?.emit("stroke-progress", {
      roomId,
      point: currentStrokeRef.current.points[currentStrokeRef.current.points.length - 1]
    });
  }

  function finishStroke() {
    if (roomError) {
      return;
    }

    if (!isDrawing || !currentStrokeRef.current || !socketRef.current) {
      return;
    }

    const nextStroke = currentStrokeRef.current;
    socketRef.current.emit("stroke-end", {
      roomId,
      stroke: nextStroke
    });

    currentStrokeRef.current = null;
    setIsDrawing(false);
  }

  async function handleShareCode() {
    try {
      await navigator.clipboard.writeText(roomId);
    } catch {}
  }

  function handleClearBoard() {
    if (roomError) {
      return;
    }

    socketRef.current?.emit("clear-board", { roomId });
  }

  function submitText() {
    if (roomError) {
      return;
    }

    if (!pendingText) {
      return;
    }

    const text = pendingText.text.trim();
    if (!text) {
      setPendingText(null);
      return;
    }

    const nextText = {
      ...pendingText,
      text
    };

    socketRef.current?.emit("add-text", {
      roomId,
      textItem: nextText
    });
    setPendingText(null);
  }

  function handleTextKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitText();
    }

    if (event.key === "Escape") {
      setPendingText(null);
    }
  }

  return (
    <main className="board-shell">
      <Link className="back-fab" href="/" aria-label="Back to lobby" title="Back to lobby">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M15 6l-6 6 6 6M9.5 12H20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="back-fab-text">Back to lobby</span>
      </Link>

      <section className="canvas-stage">
        <div className="canvas-stack">
          <canvas
            ref={canvasRef}
            className="canvas-surface canvas-surface-full"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishStroke}
            onPointerLeave={finishStroke}
            onPointerCancel={finishStroke}
          />

          {roomError ? (
            <div className="room-error-toast card">
              <div className="room-error-title">Room unavailable</div>
              <div className="room-error-copy">{roomError}</div>
            </div>
          ) : null}

          {pendingText ? (
            <textarea
              ref={textInputRef}
              className="text-editor"
              style={overlayPosition(pendingText)}
              value={pendingText.text}
              onChange={(event) =>
                setPendingText((currentValue) => ({
                  ...currentValue,
                  text: event.target.value
                }))
              }
              onBlur={submitText}
              onKeyDown={handleTextKeyDown}
              placeholder="Type text"
            />
          ) : null}
        </div>
      </section>

      <div className="right-dock">
        <aside className="room-chip card">
          <div className="room-chip-label">Room ID</div>
          <div className="room-chip-code">{roomId}</div>
          <div className="room-chip-meta">
            {participantCount} {participantCount === 1 ? "person" : "people"} in room
          </div>
          <button className="room-chip-button" type="button" onClick={handleShareCode}>
            Copy ID
          </button>
        </aside>

        <section className="card toolbox-panel" aria-label="Whiteboard tools">
          <div className="toolbox-header">
            <div className="toolbox-badge">Tools</div>
          </div>

          <div className="tool-button-grid">
            <button
              className={`tool-button ${activeTool === TOOL_PEN ? "tool-button-active" : ""}`}
              type="button"
              onClick={() => setActiveTool(TOOL_PEN)}
              aria-label="Pen"
              title="Pen"
            >
              <ToolIcon kind="pen" />
            </button>
            <button
              className={`tool-button ${activeTool === TOOL_ERASER ? "tool-button-active" : ""}`}
              type="button"
              onClick={() => setActiveTool(TOOL_ERASER)}
              aria-label="Eraser"
              title="Eraser"
            >
              <ToolIcon kind="eraser" />
            </button>
            <button
              className={`tool-button ${activeTool === TOOL_TEXT ? "tool-button-active" : ""}`}
              type="button"
              onClick={() => setActiveTool(TOOL_TEXT)}
              aria-label="Text"
              title="Text"
            >
              <ToolIcon kind="text" />
            </button>
          </div>

          <div className="toolbox-controls">
            <label className="tool-slider" htmlFor="brushSize" title="Thickness">
              <span className="tool-slider-icon" aria-hidden="true">
                <ToolIcon kind="thickness" />
              </span>
              <input
                id="brushSize"
                type="range"
                min="2"
                max="24"
                value={brushSize}
                onChange={(event) => setBrushSize(event.target.value)}
                aria-label="Thickness"
              />
            </label>

            <label className="color-button" htmlFor="brushColor" title="Color">
              <input
                id="brushColor"
                type="color"
                value={brushColor}
                onChange={(event) => setBrushColor(event.target.value)}
                aria-label="Color"
              />
            </label>

            <button
              className="tool-button tool-button-danger full-width"
              type="button"
              onClick={handleClearBoard}
              aria-label="Full erase"
              title="Full erase"
            >
              <ToolIcon kind="clear" />
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
