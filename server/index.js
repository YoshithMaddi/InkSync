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
  return {
    roomId: room.roomId,
    strokes: room.strokes,
    texts: room.texts,
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
  const nextTexts = [];

  for (const operation of room.operations) {
    if (operation.type === "clear") {
      nextStrokes.length = 0;
      nextTexts.length = 0;
      continue;
    }

    if (operation.type === "draw") {
      nextStrokes.push(operation.payload.stroke);
      continue;
    }

    if (operation.type === "text") {
      nextTexts.push(operation.payload.textItem);
    }
  }

  room.strokes = nextStrokes;
  room.texts = nextTexts;
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
    if (!roomId || !rooms.has(roomId)) {
      return;
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
