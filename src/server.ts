import dotenv from "dotenv";
dotenv.config();

import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import { v4 as uuid } from "uuid";
import type { Room, Message, Role } from "./types";

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());

// In‑memory store (MVP) – cseréljük Postgres + Redis‑re később
const rooms: Record<string, Room> = {};
const messages: Message[] = [];

// ------ REST endpoints ------
app.get("/api/rooms", (_, res) => {
  res.json(Object.values(rooms));
});

app.post("/api/rooms", (req, res) => {
  const { name, isPublic = true } = req.body;
  if (!name) return res.status(400).json({ error: "Name required" });
  const roomId = uuid();
  const ownerId = "demo-user"; // TODO: replace with auth user id
  rooms[roomId] = {
    id: roomId,
    name,
    isPublic,
    ownerId,
    members: { [ownerId]: "owner" satisfies Role }
  };
  return res.status(201).json(rooms[roomId]);
});

app.get("/api/rooms/:roomId", (req, res) => {
  const room = rooms[req.params.roomId];
  if (!room) return res.status(404).json({ error: "Room not found" });
  res.json(room);
});

// ------ HTTP server + WebSocket ------
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

interface ClientData {
  userId: string;
  roomId: string | null;
}

wss.on("connection", (ws) => {
  // attach session
  const data: ClientData = { userId: uuid(), roomId: null };
  // You can parse a token here to get real userId
  
  ws.on("message", (raw) => {
    try {
      const parsed = JSON.parse(raw.toString());
      handleWsMessage(ws, data, parsed);
    } catch (err) {
      ws.send(JSON.stringify({ type: "error", message: "Bad JSON" }));
    }
  });
});

function handleWsMessage(ws: WebSocket, data: ClientData, msg: any) {
  switch (msg.type) {
    case "join": {
      const room = rooms[msg.roomId];
      if (!room) return ws.send(JSON.stringify({ type: "error", message: "room not found" }));
      room.members[data.userId] = "member";
      data.roomId = room.id;
      broadcast(room.id, { type: "room.join", roomId: room.id, userId: data.userId });
      break;
    }
    case "leave": {
      if (!data.roomId) return;
      const room = rooms[data.roomId];
      delete room.members[data.userId];
      broadcast(room.id, { type: "room.leave", roomId: room.id, userId: data.userId });
      data.roomId = null;
      break;
    }
    case "message": {
      if (!data.roomId) return;
      const message: Message = {
        id: uuid(),
        roomId: data.roomId,
        authorId: data.userId,
        content: msg.content,
        sentAt: new Date().toISOString()
      };
      messages.push(message);
      broadcast(data.roomId, { type: "room.message", ...message });
      break;
    }
  }
}

function broadcast(roomId: string, payload: any) {
  const message = JSON.stringify(payload);
  wss.clients.forEach((client: any) => {
    const cd: ClientData | undefined = (client as any)._data;
    if (client.readyState === 1 && cd?.roomId === roomId) {
      client.send(message);
    }
  });
}

server.listen(PORT, () => {
  console.log(`🚀 Server listening on :${PORT}`);
});

// Attach client data helper
declare module "ws" {
  interface WebSocket {
    _data?: ClientData;
  }
}

// ============================
// File: Dockerfile
// ============================
FROM node:18-bullseye
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm","start"]
