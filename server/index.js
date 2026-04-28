import express from "express";
import http from "http";
import cors from "cors";
import { randomUUID } from "node:crypto";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = Number(process.env.PORT || 4000);
const ROOM_LENGTH = 6;
const ROOM_SYMBOLS = "@#$&%+!";
const ROOM_CHARSET = `ABCDEFGHJKLMNPQRSTUVWXYZ23456789${ROOM_SYMBOLS}`;
const TEXT_LOCK_TIMEOUT_MS = 15000;
const rooms = new Map();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:3000"
  })
);
app.use(express.json());

function normalizeRoomId(value = "") {
  const safeSymbols = ROOM_SYMBOLS.replace(/[\\\]\-^]/g, "\\$&");
  const allowedPattern = new RegExp(`[^A-Z0-9${safeSymbols}]`, "g");
  return value.toUpperCase().replace(allowedPattern, "").slice(0, ROOM_LENGTH);
}

function randomRoomId() {
  let result = "";

  for (let index = 0; index < ROOM_LENGTH; index += 1) {
    const randomIndex = Math.floor(Math.random() * ROOM_CHARSET.length);
    result += ROOM_CHARSET[randomIndex];
  }

  return result;
}

function getOrCreateRoom(roomId) {
  const normalizedRoomId = normalizeRoomId(roomId);

  if (!rooms.has(normalizedRoomId)) {
    rooms.set(normalizedRoomId, {
      roomId: normalizedRoomId,
      operations: [],
      undoStacks: new Map(),
      redoStacks: new Map(),
      textLocks: new Map(),
      liveTexts: new Map(),
      strokes: [],
      texts: [],
      createdAt: Date.now()
    });
  }

  return rooms.get(normalizedRoomId);
}

function getRoom(roomId) {
  return rooms.get(normalizeRoomId(roomId)) || null;
}

function getParticipantCount(roomId) {
  return io.sockets.adapter.rooms.get(roomId)?.size || 0;
}

function buildRoomPayload(room) {
  const liveTexts = Array.from(room.liveTexts.values());
  const mergedTextsById = new Map(room.texts.map((textItem) => [textItem.id, textItem]));
  for (const textItem of liveTexts) {
    const hasVisibleText = typeof textItem.text === "string" && textItem.text.trim().length > 0;
    if (textItem.deleted) {
      mergedTextsById.delete(textItem.id);
    } else if (hasVisibleText || mergedTextsById.has(textItem.id)) {
      mergedTextsById.set(textItem.id, textItem);
    }
  }

  return {
    roomId: room.roomId,
    strokes: room.strokes,
    texts: Array.from(mergedTextsById.values()),
    textLocks: Object.fromEntries(
      Array.from(room.textLocks.entries()).map(([textId, lock]) => [
        textId,
        {
          userId: lock.userId,
          expiresAt: lock.expiresAt
        }
      ])
    ),
    createdAt: room.createdAt,
    participantCount: getParticipantCount(room.roomId)
  };
}

function getUserUndoStack(room, userId) {
  if (!room.undoStacks.has(userId)) {
    room.undoStacks.set(userId, []);
  }

  return room.undoStacks.get(userId);
}

function getUserRedoStack(room, userId) {
  if (!room.redoStacks.has(userId)) {
    room.redoStacks.set(userId, []);
  }

  return room.redoStacks.get(userId);
}

function rebuildRoomScene(room) {
  const nextStrokes = [];
  const nextTextsById = new Map();

  for (const operation of room.operations) {
    if (operation.type === "clear") {
      nextStrokes.length = 0;
      nextTextsById.clear();
      continue;
    }

    if (operation.type === "draw") {
      nextStrokes.push(operation.payload.stroke);
      continue;
    }

    if (operation.type === "text") {
      const textItem = operation.payload.textItem;
      if (textItem.deleted) {
        nextTextsById.delete(textItem.id);
      } else {
        nextTextsById.set(textItem.id, textItem);
      }
    }
  }

  room.strokes = nextStrokes;
  room.texts = Array.from(nextTextsById.values());
}

function broadcastRoomState(room) {
  io.to(room.roomId).emit("room-state", buildRoomPayload(room));
}

function emitHistoryState(socket, room, userId) {
  socket.emit("history-state", {
    canUndo: getUserUndoStack(room, userId).length > 0,
    canRedo: getUserRedoStack(room, userId).length > 0
  });
}

function appendOperation(room, operation) {
  room.operations.push(operation);
  getUserUndoStack(room, operation.userId).push(operation);
  room.redoStacks.set(operation.userId, []);
  rebuildRoomScene(room);
}

function removeOperation(room, operationId) {
  room.operations = room.operations.filter((operation) => operation.id !== operationId);
  rebuildRoomScene(room);
}

function clearTextLockTimer(lock) {
  if (lock?.timeoutId) {
    clearTimeout(lock.timeoutId);
  }
}

function releaseTextLock(room, textId, userId) {
  const currentLock = room.textLocks.get(textId);
  if (!currentLock) {
    return false;
  }

  if (userId && currentLock.userId !== userId) {
    return false;
  }

  clearTextLockTimer(currentLock);
  room.textLocks.delete(textId);
  return true;
}

function releaseUserTextLocks(room, userId) {
  let didReleaseAnyLock = false;

  for (const [textId, lock] of room.textLocks.entries()) {
    if (lock.userId === userId) {
      didReleaseAnyLock = true;
      releaseTextLock(room, textId, userId);
    }
  }

  return didReleaseAnyLock;
}

function lockText(room, roomId, textId, userId) {
  const existingLock = room.textLocks.get(textId);
  if (existingLock && existingLock.userId !== userId) {
    return false;
  }

  clearTextLockTimer(existingLock);
  const nextLock = {
    userId,
    expiresAt: Date.now() + TEXT_LOCK_TIMEOUT_MS,
    timeoutId: setTimeout(() => {
      if (releaseTextLock(room, textId)) {
        broadcastRoomState(room);
      }
    }, TEXT_LOCK_TIMEOUT_MS)
  };
  room.textLocks.set(textId, nextLock);
  return true;
}

app.get("/health", (_request, response) => {
  response.json({ ok: true });
});

app.post("/rooms", (_request, response) => {
  let roomId = randomRoomId();

  while (rooms.has(roomId)) {
    roomId = randomRoomId();
  }

  const room = getOrCreateRoom(roomId);
  response.status(201).json(buildRoomPayload(room));
});

app.get("/rooms/:roomId", (request, response) => {
  const roomId = normalizeRoomId(request.params.roomId);

  if (roomId.length !== ROOM_LENGTH) {
    response.status(400).json({ error: "Invalid room code." });
    return;
  }

  const room = getRoom(roomId);
  if (!room) {
    response.status(404).json({ error: "Room not found.Nor muskoni first room create cheyyu ra barre." });
    return;
  }

  response.json(buildRoomPayload(room));
});

io.on("connection", (socket) => {
  socket.on("join-room", ({ roomId, userId }) => {
    const room = getRoom(roomId);
    if (!room) {
      socket.emit("room-error", {
        error: "Room not found.Nor muskoni first room create cheyyu ra barre."
      });
      return;
    }

    if (!userId) {
      socket.emit("room-error", {
        error: "Unable to identify this collaborator."
      });
      return;
    }

    socket.join(room.roomId);
    socket.data.roomId = room.roomId;
    socket.data.userId = userId;
    socket.emit("room-state", buildRoomPayload(room));
    emitHistoryState(socket, room, userId);
    io.to(room.roomId).emit("participant-count", {
      roomId: room.roomId,
      participantCount: getParticipantCount(room.roomId)
    });
  });

  socket.on("stroke-start", ({ roomId, stroke }) => {
    const room = getRoom(roomId);
    if (!room) {
      return;
    }

    socket.to(room.roomId).emit("stroke-started", {
      senderId: socket.id,
      stroke
    });
  });

  socket.on("stroke-progress", ({ roomId, point }) => {
    const room = getRoom(roomId);
    if (!room) {
      return;
    }

    socket.to(room.roomId).emit("stroke-progress", {
      senderId: socket.id,
      point
    });
  });

  socket.on("stroke-end", ({ roomId, stroke }) => {
    const room = getRoom(roomId);
    const userId = socket.data.userId;
    if (!room || !userId) {
      return;
    }

    appendOperation(room, {
      id: randomUUID(),
      userId,
      type: "draw",
      payload: {
        stroke: {
          ...stroke,
          userId
        }
      },
      timestamp: Date.now()
    });
    broadcastRoomState(room);
    emitHistoryState(socket, room, userId);
  });

  socket.on("add-text", ({ roomId, textItem }) => {
    const room = getRoom(roomId);
    const userId = socket.data.userId;
    if (!room || !userId) {
      return;
    }

    appendOperation(room, {
      id: randomUUID(),
      userId,
      type: "text",
      payload: {
        textItem: {
          ...textItem,
          userId
        }
      },
      timestamp: Date.now()
    });
    broadcastRoomState(room);
    emitHistoryState(socket, room, userId);
  });

  socket.on("TEXT_START", ({ roomId, textId, textItem }) => {
    const room = getRoom(roomId);
    const userId = socket.data.userId;
    if (!room || !userId || !textId) {
      return;
    }

    if (!lockText(room, roomId, textId, userId)) {
      socket.emit("text-lock-denied", { textId });
      return;
    }

    if (textItem && typeof textItem.text === "string" && textItem.text.trim().length > 0) {
      room.liveTexts.set(textId, {
        ...textItem,
        userId
      });
    }

    broadcastRoomState(room);
  });

  socket.on("TEXT_UPDATE", ({ roomId, textItem }) => {
    const room = getRoom(roomId);
    const userId = socket.data.userId;
    if (!room || !userId || !textItem?.id) {
      return;
    }

    const currentLock = room.textLocks.get(textItem.id);
    if (!currentLock || currentLock.userId !== userId) {
      return;
    }

    lockText(room, roomId, textItem.id, userId);
    const nextLiveText = {
      ...textItem,
      userId
    };
    if (typeof nextLiveText.text === "string" && nextLiveText.text.trim().length > 0) {
      room.liveTexts.set(textItem.id, nextLiveText);
      io.to(room.roomId).emit("text-live-updated", {
        textItem: room.liveTexts.get(textItem.id)
      });
    } else {
      room.liveTexts.delete(textItem.id);
      io.to(room.roomId).emit("text-live-updated", {
        textItem: {
          ...nextLiveText,
          deleted: true
        }
      });
    }
    broadcastRoomState(room);
  });

  socket.on("TEXT_COMMIT", ({ roomId, textItem }) => {
    const room = getRoom(roomId);
    const userId = socket.data.userId;
    if (!room || !userId || !textItem?.id) {
      return;
    }

    const currentLock = room.textLocks.get(textItem.id);
    if (!currentLock || currentLock.userId !== userId) {
      return;
    }

    room.liveTexts.delete(textItem.id);
    const hasPersistedText = room.texts.some((item) => item.id === textItem.id);
    const isDeletedCommit = Boolean(textItem.deleted) || !String(textItem.text || "").trim();

    if (!(isDeletedCommit && !hasPersistedText)) {
      appendOperation(room, {
        id: randomUUID(),
        userId,
        type: "text",
        payload: {
          textItem: {
            ...textItem,
            userId,
            deleted: isDeletedCommit
          }
        },
        timestamp: Date.now()
      });
    }
    releaseTextLock(room, textItem.id, userId);
    broadcastRoomState(room);
    emitHistoryState(socket, room, userId);
  });

  socket.on("clear-board", ({ roomId }) => {
    const room = getRoom(roomId);
    const userId = socket.data.userId;
    if (!room || !userId) {
      return;
    }

    appendOperation(room, {
      id: randomUUID(),
      userId,
      type: "clear",
      payload: {},
      timestamp: Date.now()
    });
    broadcastRoomState(room);
    emitHistoryState(socket, room, userId);
  });

  socket.on("undo", ({ roomId }) => {
    const room = getRoom(roomId);
    const userId = socket.data.userId;
    if (!room || !userId) {
      return;
    }

    const undoStack = getUserUndoStack(room, userId);
    const operation = undoStack.pop();
    if (!operation) {
      emitHistoryState(socket, room, userId);
      return;
    }

    getUserRedoStack(room, userId).push(operation);
    removeOperation(room, operation.id);
    broadcastRoomState(room);
    emitHistoryState(socket, room, userId);
  });

  socket.on("redo", ({ roomId }) => {
    const room = getRoom(roomId);
    const userId = socket.data.userId;
    if (!room || !userId) {
      return;
    }

    const redoStack = getUserRedoStack(room, userId);
    const operation = redoStack.pop();
    if (!operation) {
      emitHistoryState(socket, room, userId);
      return;
    }

    room.operations.push({
      ...operation,
      timestamp: Date.now()
    });
    getUserUndoStack(room, userId).push(operation);
    rebuildRoomScene(room);
    broadcastRoomState(room);
    emitHistoryState(socket, room, userId);
  });

  socket.on("disconnect", () => {
    const roomId = socket.data.roomId;
    const userId = socket.data.userId;
    if (!roomId || !rooms.has(roomId)) {
      return;
    }

    const room = rooms.get(roomId);
    if (userId && room) {
      releaseUserTextLocks(room, userId);
      for (const [textId, textItem] of room.liveTexts.entries()) {
        if (textItem.userId === userId) {
          room.liveTexts.delete(textId);
        }
      }
      broadcastRoomState(room);
    }

    io.to(roomId).emit("participant-count", {
      roomId,
      participantCount: getParticipantCount(roomId)
    });
  });
});

server.listen(PORT, () => {
  console.log(`Whiteboard server running on http://localhost:${PORT}`);
});
