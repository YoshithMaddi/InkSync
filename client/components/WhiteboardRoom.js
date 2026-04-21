"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { API_URL } from "../lib/api";
import { createItemId, pointFromEvent, renderScene } from "./whiteboard/canvas";
import { CANVAS_HEIGHT, CANVAS_WIDTH, TOOL_ERASER, TOOL_PEN, TOOL_TEXT } from "./whiteboard/constants";
import RoomChip from "./whiteboard/RoomChip";
import TextEditorOverlay from "./whiteboard/TextEditorOverlay";
import ToolboxPanel from "./whiteboard/ToolboxPanel";

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
      setRoomError(payload?.error || "Room not found.Nor muskoni room create cheyu ra barre.");
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

          <TextEditorOverlay
            pendingText={pendingText}
            textInputRef={textInputRef}
            onBlur={submitText}
            onChange={(event) =>
              setPendingText((currentValue) => ({
                ...currentValue,
                text: event.target.value
              }))
            }
            onKeyDown={handleTextKeyDown}
          />
        </div>
      </section>

      <div className="right-dock">
        <RoomChip participantCount={participantCount} roomId={roomId} onShareCode={handleShareCode} />

        <ToolboxPanel
          activeTool={activeTool}
          brushColor={brushColor}
          brushSize={brushSize}
          onBrushColorChange={(event) => setBrushColor(event.target.value)}
          onBrushSizeChange={(event) => setBrushSize(event.target.value)}
          onClearBoard={handleClearBoard}
          onToolChange={setActiveTool}
        />
      </div>
    </main>
  );
}
