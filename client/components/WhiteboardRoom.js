"use client";

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { API_URL } from "../lib/api";
import { getOrCreateClientId } from "../lib/session";
import {
  createItemId,
  findTextAtPoint,
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
  const textDragRef = useRef(null);
  const textUpdateTimerRef = useRef(null);
  const editingTextRef = useRef(null);
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
  const [editingText, setEditingText] = useState(null);
  const [selectedTextId, setSelectedTextId] = useState(null);
  const [camera, setCamera] = useState(DEFAULT_CAMERA);
  const [clientId, setClientId] = useState("");
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [cursorPos, setCursorPos] = useState(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [textLocks, setTextLocks] = useState({});

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
      cursorPos,
      textLocks,
      clientId
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
    editingTextRef.current = editingText;
  }, [editingText]);

  const selectedText = editingText || texts.find((textItem) => textItem.id === selectedTextId) || null;
  const isLockedByCurrentUser = Boolean(editingText && textLocks[editingText.id]?.userId === clientId);

  function emitLiveTextUpdate(nextText) {
    socketRef.current?.emit("TEXT_UPDATE", {
      roomId,
      textItem: nextText
    });
  }

  function scheduleLiveTextUpdate(nextText) {
    if (textUpdateTimerRef.current) {
      window.clearTimeout(textUpdateTimerRef.current);
    }

    textUpdateTimerRef.current = window.setTimeout(() => {
      emitLiveTextUpdate(nextText);
      textUpdateTimerRef.current = null;
    }, 240);
  }

  function releasePendingTextUpdate() {
    if (textUpdateTimerRef.current) {
      window.clearTimeout(textUpdateTimerRef.current);
      textUpdateTimerRef.current = null;
    }
  }

  useEffect(() => {
    if (editingText && textInputRef.current) {
      const focusTimer = window.setTimeout(() => {
        textInputRef.current?.focus();
      }, 0);

      return () => {
        window.clearTimeout(focusTimer);
      };
    }
  }, [editingText]);

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
      setTextLocks(payload?.textLocks || {});
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

    socket.on("text-live-updated", ({ textItem }) => {
      if (!textItem?.id) {
        return;
      }

      const hasVisibleText = typeof textItem.text === "string" && textItem.text.trim().length > 0;

      if (textItem.deleted || !hasVisibleText) {
        setTexts((currentTexts) => currentTexts.filter((item) => item.id !== textItem.id));
        return;
      }

      setTexts((currentTexts) => {
        const existingIndex = currentTexts.findIndex((item) => item.id === textItem.id);
        if (existingIndex === -1) {
          return [...currentTexts, textItem];
        }

        return currentTexts.map((item) => (item.id === textItem.id ? { ...item, ...textItem } : item));
      });
    });

    socket.on("text-lock-denied", ({ textId }) => {
      if (editingText?.id === textId) {
        setEditingText(null);
      }
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
      setEditingText(null);
      setSelectedTextId(null);
      setTextLocks({});
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
    const hitText = findTextAtPoint(texts, point);

    if (activeTool === TOOL_TEXT) {
      const currentEditingText = editingTextRef.current;
      if (currentEditingText && currentEditingText.id !== hitText?.id) {
        submitText(currentEditingText);
      }

      if (hitText) {
        if (textLocks[hitText.id] && textLocks[hitText.id].userId !== clientId) {
          setSelectedTextId(hitText.id);
          return;
        }

        setSelectedTextId(hitText.id);
        setEditingText(hitText);
        socketRef.current?.emit("TEXT_START", {
          roomId,
          textId: hitText.id,
          textItem: hitText
        });
      } else {
        const nextText = {
          id: createItemId("text"),
          x: point.x,
          y: point.y,
          text: "",
          color: brushColor,
          size: Math.max(Number(brushSize) * 5, 18),
          fontWeight: 400
        };
        setSelectedTextId(nextText.id);
        setEditingText(nextText);
        socketRef.current?.emit("TEXT_START", {
          roomId,
          textId: nextText.id,
          textItem: nextText
        });
      }
      return;
    }

    if (activeTool === TOOL_HAND && hitText) {
      setSelectedTextId(hitText.id);
      textDragRef.current = {
        id: hitText.id,
        offsetX: point.x - hitText.x,
        offsetY: point.y - hitText.y
      };
      return;
    }

    setEditingText(null);
    setSelectedTextId(hitText?.id || null);
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

    if (textDragRef.current && !editingText) {
      setTexts((currentTexts) =>
        currentTexts.map((textItem) =>
          textItem.id === textDragRef.current.id
            ? {
                ...textItem,
                x: point.x - textDragRef.current.offsetX,
                y: point.y - textDragRef.current.offsetY
              }
            : textItem
        )
      );
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

    if (textDragRef.current) {
      const movedText = texts.find((textItem) => textItem.id === textDragRef.current.id);
      textDragRef.current = null;
      if (movedText) {
        socketRef.current?.emit("add-text", {
          roomId,
          textItem: movedText
        });
      }
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

  function submitText(targetText = editingTextRef.current) {
    if (roomError) {
      return;
    }

    if (!targetText) {
      return;
    }

    releasePendingTextUpdate();
    const text = (textInputRef.current?.innerText || targetText.text || "").trim();
    if (!text) {
      const existingText = texts.find((textItem) => textItem.id === targetText.id);
      socketRef.current?.emit("TEXT_COMMIT", {
        roomId,
        textItem: {
          ...(existingText || targetText),
          text: "",
          deleted: true
        }
      });

      if (existingText) {
        setTexts((currentTexts) => currentTexts.filter((textItem) => textItem.id !== targetText.id));
      }

      if (editingTextRef.current?.id === targetText.id) {
        setEditingText(null);
        setSelectedTextId(null);
      }
      return;
    }

    const nextText = {
      ...targetText,
      text
    };

    socketRef.current?.emit("TEXT_COMMIT", {
      roomId,
      textItem: nextText
    });
    setTexts((currentTexts) => {
      const existingTextIndex = currentTexts.findIndex((textItem) => textItem.id === nextText.id);
      if (existingTextIndex === -1) {
        return [...currentTexts, nextText];
      }

      return currentTexts.map((textItem) => (textItem.id === nextText.id ? nextText : textItem));
    });
    if (editingTextRef.current?.id === nextText.id) {
      setEditingText(null);
      setSelectedTextId(nextText.id);
    }
  }

  function handleTextKeyDown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      submitText();
    }
  }

  function handleTextInput(event) {
    const nextText = event.currentTarget.innerText.replace(/\r/g, "");
    setEditingText((currentText) => {
      if (!currentText) {
        return currentText;
      }

      const updatedText = { ...currentText, text: nextText };
      scheduleLiveTextUpdate(updatedText);
      setTexts((currentTexts) => {
        const existingIndex = currentTexts.findIndex((item) => item.id === updatedText.id);
        const hasVisibleText = updatedText.text.trim().length > 0;

        if (!hasVisibleText) {
          return currentTexts.filter((item) => item.id !== updatedText.id);
        }

        if (existingIndex === -1) {
          return [...currentTexts, updatedText];
        }

        return currentTexts.map((item) => (item.id === updatedText.id ? updatedText : item));
      });
      return updatedText;
    });
  }

  function handleToggleBold() {
    setEditingText((currentText) => {
      if (!currentText) {
        return currentText;
      }

      return {
        ...currentText,
        fontWeight: String(currentText.fontWeight || 400) === "400" ? 700 : 400
      };
    });

    setTexts((currentTexts) =>
      currentTexts.map((textItem) =>
        textItem.id === selectedTextId
          ? {
              ...textItem,
              fontWeight: String(textItem.fontWeight || 400) === "400" ? 700 : 400
            }
          : textItem
      )
    );
  }

  function handleFontSizeChange(delta) {
    function clampSize(size) {
      return Math.max(14, Math.min(72, (size || 28) + delta));
    }

    setEditingText((currentText) =>
      currentText
        ? {
            ...currentText,
            size: clampSize(currentText.size)
          }
        : currentText
    );

    setTexts((currentTexts) =>
      currentTexts.map((textItem) =>
        textItem.id === selectedTextId
          ? {
              ...textItem,
              size: clampSize(textItem.size)
            }
          : textItem
      )
    );
  }

  useEffect(() => {
    if (editingText && textLocks[editingText.id] && textLocks[editingText.id].userId !== clientId) {
      setEditingText(null);
    }
  }, [clientId, editingText, textLocks]);

  useEffect(() => {
    if (!editingText) {
      return undefined;
    }

    return () => {
      releasePendingTextUpdate();
    };
  }, [editingText]);

  useEffect(() => {
    if (editingText && activeTool !== TOOL_TEXT) {
      submitText();
    }
  }, [activeTool]);

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
            editingText={editingText}
            isLockedByCurrentUser={isLockedByCurrentUser}
            selectedText={selectedText}
            textInputRef={textInputRef}
            viewport={viewport}
            onBlur={submitText}
            onInput={handleTextInput}
            onKeyDown={handleTextKeyDown}
            onToggleBold={handleToggleBold}
            onFontSizeChange={handleFontSizeChange}
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
          isDrawing={isDrawing}
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
