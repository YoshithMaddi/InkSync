import express from "express";
import http from "http";
import cors from "cors";
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
const ROOM_LENGTH = 7;
const ROOM_SYMBOLS = "@#$&%!";
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
    ...room,
    participantCount: getParticipantCount(room.roomId)
  };
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
  socket.on("join-room", ({ roomId }) => {
    const room = getRoom(roomId);
    if (!room) {
      socket.emit("room-error", {
        error: "Room not found.Nor muskoni first room create cheyyu ra barre."
      });
      return;
    }

    socket.join(room.roomId);
    socket.data.roomId = room.roomId;
    socket.emit("room-state", buildRoomPayload(room));
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
    if (!room) {
      return;
    }

    room.strokes.push(stroke);
    io.to(room.roomId).emit("stroke-added", {
      roomId: room.roomId,
      strokes: room.strokes,
      senderId: socket.id
    });
  });

  socket.on("add-text", ({ roomId, textItem }) => {
    const room = getRoom(roomId);
    if (!room) {
      return;
    }

    room.texts.push(textItem);
    io.to(room.roomId).emit("text-added", {
      roomId: room.roomId,
      texts: room.texts
    });
  });

  socket.on("clear-board", ({ roomId }) => {
    const room = getRoom(roomId);
    if (!room) {
      return;
    }

    room.strokes = [];
    room.texts = [];
    io.to(room.roomId).emit("board-cleared", {
      roomId: room.roomId
    });
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
