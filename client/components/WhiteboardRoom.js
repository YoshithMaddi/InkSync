"use client";

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { API_URL } from "../lib/api";
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
    ctx.__camera = cameraRef.current;
    ctx.__dpr = nextSize.dpr;
    renderScene(
      ctx,
      sceneRef.current.strokes,
      sceneRef.current.texts,
      sceneRef.current.remoteDrafts,
      currentStrokeRef.current
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
  }, [strokes, texts, remoteDrafts, camera]);

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

    if (isPanning && panStateRef.current) {
      const deltaX = (event.clientX - panStateRef.current.pointerX) / cameraRef.current.zoom;
      const deltaY = (event.clientY - panStateRef.current.pointerY) / cameraRef.current.zoom;
      updateCamera({
        ...panStateRef.current.camera,
        x: panStateRef.current.camera.x - deltaX,
        y: panStateRef.current.camera.y - deltaY
      });
      return;
    }

    if (!isDrawing || !currentStrokeRef.current) {
      return;
    }

    currentStrokeRef.current.points.push(pointFromEvent(canvas, event, cameraRef.current));
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

        <ToolboxPanel
          activeTool={activeTool}
          brushColor={brushColor}
          brushSize={brushSize}
          onBrushColorChange={(event) => setBrushColor(event.target.value)}
          onBrushSizeChange={(event) => setBrushSize(event.target.value)}
          onClearBoard={handleClearBoard}
          onToolChange={setActiveTool}
        />
      </RightDock>
    </BoardShell>
  );
}
