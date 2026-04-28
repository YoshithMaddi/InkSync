"use client";

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { API_URL } from "../lib/api";
import { getOrCreateClientId } from "../lib/session";
import {
  createItemId,
  pointFromEvent,
  renderScene,
  syncCanvasSize,
  zoomCameraAtPoint
} from "./whiteboard/canvas";
import {
  DEFAULT_CAMERA,
  MAX_ZOOM,
  MIN_ZOOM,
  TOOL_ERASER,
  TOOL_HAND,
  TOOL_PEN,
  TOOL_TEXT
} from "./whiteboard/constants";
import RoomChip from "./whiteboard/RoomChip";
import TextEditorOverlay from "./whiteboard/TextEditorOverlay";
import ToolboxPanel from "./whiteboard/ToolboxPanel";
import {
  BackFab,
  BackFabText,
  BoardShell,
  CanvasStack,
  CanvasStage,
  CanvasSurface,
  LeftDock,
  RightDock,
  RoomErrorCopy,
  RoomErrorTitle,
  RoomErrorToast
} from "./whiteboard/styles";

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
  const cameraRef = useRef(DEFAULT_CAMERA);
  const panStateRef = useRef(null);
  const blurGuardUntilRef = useRef(0);
  const sceneRef = useRef({
    strokes: initialStrokes,
    texts: initialTexts,
    remoteDrafts: {}
  });
  const [activeTool, setActiveTool] = useState(TOOL_PEN);
  const [brushColor, setBrushColor] = useState("#0f172a");
  const [brushSize, setBrushSize] = useState(5);
  const [strokes, setStrokes] = useState(initialStrokes);
  const [texts, setTexts] = useState(initialTexts);
  const [participantCount, setParticipantCount] = useState(initialParticipantCount);
  const [roomError, setRoomError] = useState(initialError);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [remoteDrafts, setRemoteDrafts] = useState({});
  const [pendingText, setPendingText] = useState(null);
  const [camera, setCamera] = useState(DEFAULT_CAMERA);
  const [clientId, setClientId] = useState("");
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [cursorPos, setCursorPos] = useState(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  function updateCamera(nextCamera) {
    cameraRef.current = nextCamera;
    setCamera(nextCamera);
  }

  function renderCurrentScene() {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    const nextSize = syncCanvasSize(canvas);
    setViewport({
      width: nextSize.width,
      height: nextSize.height
    });
    ctx.__camera = cameraRef.current;
    ctx.__dpr = nextSize.dpr;
    renderScene(
      ctx,
      sceneRef.current.strokes,
      sceneRef.current.texts,
      sceneRef.current.remoteDrafts,
      currentStrokeRef.current,
      activeTool,
      brushSize,
      cursorPos
    );
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    renderCurrentScene();

    const resizeObserver = new ResizeObserver(() => {
      renderCurrentScene();
    });

    resizeObserver.observe(canvas);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    sceneRef.current = {
      strokes,
      texts,
      remoteDrafts
    };
    renderCurrentScene();
  }, [strokes, texts, remoteDrafts, camera, activeTool, brushSize, cursorPos]);

  useEffect(() => {
    setClientId(getOrCreateClientId());
  }, []);

  useEffect(() => {
    if (pendingText && textInputRef.current) {
      const focusTimer = window.setTimeout(() => {
        textInputRef.current?.focus();
      }, 0);

      return () => {
        window.clearTimeout(focusTimer);
      };
    }
  }, [pendingText]);

  useEffect(() => {
    if (!clientId) {
      return undefined;
    }

    const socket = io(API_URL, {
      transports: ["websocket"]
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join-room", { roomId, userId: clientId });
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

    socket.on("history-state", (payload) => {
      setCanUndo(Boolean(payload?.canUndo));
      setCanRedo(Boolean(payload?.canRedo));
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

    socket.on("room-error", (payload) => {
      setRoomError(payload?.error || "Room not found.Nor muskoni first room create cheyyu ra barre.");
      setPendingText(null);
      setIsDrawing(false);
      currentStrokeRef.current = null;
      socket.disconnect();
    });

    return () => {
      socket.disconnect();
    };
  }, [clientId, roomId]);

  function handlePointerDown(event) {
    if (roomError) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    if (activeTool === TOOL_HAND) {
      panStateRef.current = {
        camera: cameraRef.current,
        pointerX: event.clientX,
        pointerY: event.clientY
      };
      setIsPanning(true);
      return;
    }

    const point = pointFromEvent(canvas, event, cameraRef.current);

    if (activeTool === TOOL_TEXT) {
      blurGuardUntilRef.current = Date.now() + 250;
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

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const point = pointFromEvent(canvas, event, cameraRef.current);
    setCursorPos(point);

    if (isPanning && panStateRef.current) {
      const deltaX = (event.clientX - panStateRef.current.pointerX) / cameraRef.current.zoom;
      const deltaY = (event.clientY - panStateRef.current.pointerY) / cameraRef.current.zoom;
      updateCamera({
        ...panStateRef.current.camera,
        x: panStateRef.current.camera.x - deltaX,
        y: panStateRef.current.camera.y - deltaY
      });
      renderCurrentScene();
      return;
    }

    if (activeTool === TOOL_ERASER) {
      renderCurrentScene();
    }

    if (!isDrawing || !currentStrokeRef.current) {
      return;
    }

    currentStrokeRef.current.points.push(point);
    renderCurrentScene();
    socketRef.current?.emit("stroke-progress", {
      roomId,
      point: currentStrokeRef.current.points[currentStrokeRef.current.points.length - 1]
    });
  }

  function finishStroke() {
    if (roomError) {
      return;
    }

    if (isPanning) {
      panStateRef.current = null;
      setIsPanning(false);
      return;
    }

    if (!isDrawing || !currentStrokeRef.current || !socketRef.current) {
      return;
    }

    const nextStroke = currentStrokeRef.current;
    // Optimistically add the stroke to local state to prevent blinking
    setStrokes((prev) => [...prev, nextStroke]);
    socketRef.current.emit("stroke-end", {
      roomId,
      stroke: nextStroke
    });

    currentStrokeRef.current = null;
    setIsDrawing(false);
  }

  function handleWheel(event) {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    event.preventDefault();
    const bounds = canvas.getBoundingClientRect();
    const screenPoint = {
      x: event.clientX - bounds.left - bounds.width / 2,
      y: event.clientY - bounds.top - bounds.height / 2
    };
    const zoomDelta = event.deltaY < 0 ? 1.1 : 0.9;
    const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, cameraRef.current.zoom * zoomDelta));

    if (nextZoom === cameraRef.current.zoom) {
      return;
    }

    updateCamera(zoomCameraAtPoint(cameraRef.current, nextZoom, screenPoint));
  }

  function resetView() {
    updateCamera(DEFAULT_CAMERA);
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

  function handleUndo() {
    if (roomError) {
      return;
    }

    socketRef.current?.emit("undo", { roomId });
  }

  function handleRedo() {
    if (roomError) {
      return;
    }

    socketRef.current?.emit("redo", { roomId });
  }

  function submitText() {
    if (roomError) {
      return;
    }

    if (!pendingText) {
      return;
    }

    if (Date.now() < blurGuardUntilRef.current) {
      window.setTimeout(() => {
        textInputRef.current?.focus();
      }, 0);
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

  useEffect(() => {
    function handleHistoryShortcuts(event) {
      const target = event.target;
      if (
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLInputElement ||
        target?.isContentEditable
      ) {
        return;
      }

      const hasHistoryModifier = event.metaKey || event.ctrlKey;
      const lowerKey = event.key.toLowerCase();
      const isUndoShortcut = hasHistoryModifier && lowerKey === "z" && !event.shiftKey;
      const isRedoShortcut =
        hasHistoryModifier && (lowerKey === "y" || (lowerKey === "z" && event.shiftKey));

      if (isUndoShortcut) {
        event.preventDefault();
        handleUndo();
      }

      if (isRedoShortcut) {
        event.preventDefault();
        handleRedo();
      }
    }

    window.addEventListener("keydown", handleHistoryShortcuts);
    return () => {
      window.removeEventListener("keydown", handleHistoryShortcuts);
    };
  }, [roomError]);

  return (
    <BoardShell>
      <BackFab href="/" aria-label="Back to lobby" title="Back to lobby">
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
        <BackFabText>Back to lobby</BackFabText>
      </BackFab>

      <CanvasStage>
        <CanvasStack>
          <CanvasSurface
            ref={canvasRef}
            $activeTool={activeTool}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishStroke}
            onPointerLeave={finishStroke}
            onPointerCancel={finishStroke}
            onWheel={handleWheel}
          />

          {roomError ? (
            <RoomErrorToast>
              <RoomErrorTitle>Room unavailable</RoomErrorTitle>
              <RoomErrorCopy>{roomError}</RoomErrorCopy>
            </RoomErrorToast>
          ) : null}

          <TextEditorOverlay
            camera={camera}
            pendingText={pendingText}
            textInputRef={textInputRef}
            viewport={viewport}
            onBlur={submitText}
            onChange={(event) =>
              setPendingText((currentValue) => ({
                ...currentValue,
                text: event.target.value
              }))
            }
            onKeyDown={handleTextKeyDown}
          />
        </CanvasStack>
      </CanvasStage>

      <RightDock>
        <RoomChip
          participantCount={participantCount}
          roomId={roomId}
          zoomLabel={`${Math.round(camera.zoom * 100)}% zoom`}
          onResetView={resetView}
          onShareCode={handleShareCode}
        />
      </RightDock>

      <LeftDock>
        <ToolboxPanel
          activeTool={activeTool}
          brushColor={brushColor}
          brushSize={brushSize}
          canRedo={canRedo}
          canUndo={canUndo}
          onBrushColorChange={(event) => setBrushColor(event.target.value)}
          onBrushSizeChange={(event) => setBrushSize(event.target.value)}
          onClearBoard={handleClearBoard}
          onRedo={handleRedo}
          onToolChange={setActiveTool}
          onUndo={handleUndo}
        />
      </LeftDock>
    </BoardShell>
  );
}
