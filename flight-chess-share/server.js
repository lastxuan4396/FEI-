const express = require("express");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = Number(process.env.PORT || 10000);
const APP_VERSION = process.env.APP_VERSION || "2.0.0";
const DEPLOYED_AT = new Date().toISOString();
const ROOM_TTL_MS = 12 * 60 * 60 * 1000;

app.use(express.json({ limit: "1mb" }));

const staticDir = __dirname;
const rooms = new Map();

function genId(len = 6) {
  return crypto
    .randomBytes(8)
    .toString("base64")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, len)
    .toUpperCase();
}

function defaultSnapshot() {
  return {
    players: [
      { step: -1, skip: 0 },
      { step: -1, skip: 0 },
    ],
    game: {
      current: 0,
      dice: null,
      lastRoll: null,
      gameOver: false,
      message: "点击掷骰子开始。",
      diceHistory: [],
      rollCount: 0,
      turnHistory: [],
      selectedCellIndex: null,
      lastTriggeredCell: null,
    },
  };
}

function toSeats(room) {
  return {
    red: !!room.players.red,
    blue: !!room.players.blue,
  };
}

function touchRoom(room) {
  room.updatedAt = Date.now();
}

function cleanupRooms() {
  const now = Date.now();
  for (const [id, room] of rooms.entries()) {
    if (now - room.updatedAt > ROOM_TTL_MS) {
      rooms.delete(id);
    }
  }
}

function findRoleByToken(room, token) {
  if (!token) return null;
  if (room.players.red && room.players.red.token === token) return "red";
  if (room.players.blue && room.players.blue.token === token) return "blue";
  return null;
}

function assertRoom(req, res) {
  const roomId = String(req.params.roomId || "").toUpperCase();
  const room = rooms.get(roomId);
  if (!room) {
    res.status(404).json({ error: "房间不存在" });
    return null;
  }
  return { roomId, room };
}

app.get("/api/version", (_req, res) => {
  res.json({ version: APP_VERSION, deployedAt: DEPLOYED_AT });
});

app.post("/api/rooms", (req, res) => {
  cleanupRooms();
  let roomId = genId(6);
  while (rooms.has(roomId)) roomId = genId(6);

  const redToken = genId(24);
  const now = Date.now();
  const snapshot = req.body && req.body.snapshot ? req.body.snapshot : defaultSnapshot();

  const room = {
    id: roomId,
    createdAt: now,
    updatedAt: now,
    version: 0,
    snapshot,
    players: {
      red: { token: redToken, joinedAt: now, lastSeenAt: now },
      blue: null,
    },
  };

  rooms.set(roomId, room);

  res.status(201).json({
    roomId,
    role: "red",
    token: redToken,
    version: room.version,
    snapshot: room.snapshot,
    seats: toSeats(room),
  });
});

app.post("/api/rooms/:roomId/join", (req, res) => {
  cleanupRooms();
  const data = assertRoom(req, res);
  if (!data) return;

  const { room } = data;
  const now = Date.now();
  const token = req.body && typeof req.body.token === "string" ? req.body.token : "";

  const existingRole = findRoleByToken(room, token);
  if (existingRole) {
    room.players[existingRole].lastSeenAt = now;
    touchRoom(room);
    res.json({
      role: existingRole,
      token,
      version: room.version,
      snapshot: room.snapshot,
      seats: toSeats(room),
    });
    return;
  }

  if (!room.players.red) {
    const newToken = genId(24);
    room.players.red = { token: newToken, joinedAt: now, lastSeenAt: now };
    touchRoom(room);
    res.json({
      role: "red",
      token: newToken,
      version: room.version,
      snapshot: room.snapshot,
      seats: toSeats(room),
    });
    return;
  }

  if (!room.players.blue) {
    const newToken = genId(24);
    room.players.blue = { token: newToken, joinedAt: now, lastSeenAt: now };
    touchRoom(room);
    res.json({
      role: "blue",
      token: newToken,
      version: room.version,
      snapshot: room.snapshot,
      seats: toSeats(room),
    });
    return;
  }

  res.status(409).json({ error: "房间已满" });
});

app.get("/api/rooms/:roomId/state", (req, res) => {
  const data = assertRoom(req, res);
  if (!data) return;

  const { room } = data;
  touchRoom(room);
  res.json({
    version: room.version,
    snapshot: room.snapshot,
    seats: toSeats(room),
    updatedAt: room.updatedAt,
  });
});

app.post("/api/rooms/:roomId/state", (req, res) => {
  const data = assertRoom(req, res);
  if (!data) return;

  const { room } = data;
  const { role, token, baseVersion, snapshot } = req.body || {};

  if (!role || !token || !snapshot) {
    res.status(400).json({ error: "缺少 role/token/snapshot" });
    return;
  }

  if (!["red", "blue"].includes(role)) {
    res.status(400).json({ error: "role 非法" });
    return;
  }

  const seat = room.players[role];
  if (!seat || seat.token !== token) {
    res.status(403).json({ error: "鉴权失败" });
    return;
  }

  if (!Number.isInteger(baseVersion) || baseVersion !== room.version) {
    res.status(409).json({
      error: "版本冲突",
      version: room.version,
      snapshot: room.snapshot,
      seats: toSeats(room),
    });
    return;
  }

  room.snapshot = snapshot;
  room.version += 1;
  seat.lastSeenAt = Date.now();
  touchRoom(room);

  res.json({
    ok: true,
    version: room.version,
    seats: toSeats(room),
  });
});

app.post("/api/rooms/:roomId/leave", (req, res) => {
  const data = assertRoom(req, res);
  if (!data) return;

  const { room } = data;
  const token = req.body && typeof req.body.token === "string" ? req.body.token : "";
  const role = findRoleByToken(room, token);

  if (role) {
    room.players[role] = null;
    touchRoom(room);
  }

  if (!room.players.red && !room.players.blue) {
    rooms.delete(room.id);
  }

  res.json({ ok: true, seats: role ? toSeats(room) : { red: false, blue: false } });
});

app.use(express.static(staticDir, { extensions: ["html"] }));

// SPA fallback for custom routes / refreshes.
app.get("*", (_req, res) => {
  res.sendFile(path.join(staticDir, "index.html"));
});

setInterval(cleanupRooms, 10 * 60 * 1000).unref();

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[flight-chess] http://localhost:${PORT} | v${APP_VERSION} | deployed=${DEPLOYED_AT}`);
});
