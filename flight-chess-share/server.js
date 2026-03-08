const express = require("express");
const path = require("path");
const crypto = require("crypto");
const fs = require("fs");

let redisFactory = null;
try {
  // Optional dependency; service works without Redis.
  // eslint-disable-next-line global-require
  redisFactory = require("redis");
} catch (_err) {
  redisFactory = null;
}

const app = express();
const PORT = Number(process.env.PORT || 10000);
const APP_VERSION = process.env.APP_VERSION || "2.1.0";
const DEPLOYED_AT = new Date().toISOString();
const ROOM_TTL_MS = 12 * 60 * 60 * 1000;
const ACTION_SPAM_MS = 350;
const LOG_SECRET = process.env.LOG_SIGNING_SECRET || crypto.randomBytes(24).toString("hex");
const REDIS_URL = process.env.REDIS_URL || "";
const REDIS_PREFIX = process.env.REDIS_PREFIX || "flightchess";

const staticDir = __dirname;
const rulesPath = path.join(__dirname, "rules.json");
const rulesConfig = JSON.parse(fs.readFileSync(rulesPath, "utf8"));

app.use(express.json({ limit: "1mb" }));
app.set("trust proxy", 1);

function genId(len = 6) {
  return crypto
    .randomBytes(12)
    .toString("base64")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, len)
    .toUpperCase();
}

function sanitizeRoomId(raw) {
  return String(raw || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
}

function hashPassword(roomId, password) {
  return crypto.createHash("sha256").update(`${roomId}::${password}`).digest("hex");
}

function signLogPayload(payload, prevDigest) {
  return crypto
    .createHmac("sha256", LOG_SECRET)
    .update(`${prevDigest}|${JSON.stringify(payload)}`)
    .digest("hex");
}

function defaultSnapshot() {
  return {
    players: [
      { step: -1, skip: 0 },
      { step: -1, skip: 0 }
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
      lastTriggeredCell: null
    }
  };
}

class MemoryStore {
  constructor() {
    this.rooms = new Map();
  }

  async getRoom(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    if (Date.now() - room.updatedAt > ROOM_TTL_MS) {
      this.rooms.delete(roomId);
      return null;
    }
    return room;
  }

  async setRoom(room) {
    this.rooms.set(room.id, room);
  }

  async deleteRoom(roomId) {
    this.rooms.delete(roomId);
  }

  async hasRoom(roomId) {
    return !!(await this.getRoom(roomId));
  }

  cleanup() {
    const now = Date.now();
    for (const [id, room] of this.rooms.entries()) {
      if (now - room.updatedAt > ROOM_TTL_MS) {
        this.rooms.delete(id);
      }
    }
  }
}

class RedisStore {
  constructor(client) {
    this.client = client;
  }

  key(roomId) {
    return `${REDIS_PREFIX}:room:${roomId}`;
  }

  async getRoom(roomId) {
    const raw = await this.client.get(this.key(roomId));
    if (!raw) return null;
    return JSON.parse(raw);
  }

  async setRoom(room) {
    const ttl = Math.max(60, Math.floor(ROOM_TTL_MS / 1000));
    await this.client.set(this.key(room.id), JSON.stringify(room), { EX: ttl });
  }

  async deleteRoom(roomId) {
    await this.client.del(this.key(roomId));
  }

  async hasRoom(roomId) {
    return (await this.client.exists(this.key(roomId))) > 0;
  }

  cleanup() {}
}

async function createStore() {
  if (!REDIS_URL || !redisFactory) {
    return { store: new MemoryStore(), mode: "memory" };
  }

  try {
    const client = redisFactory.createClient({ url: REDIS_URL, socket: { reconnectStrategy: () => 1000 } });
    client.on("error", (err) => {
      // eslint-disable-next-line no-console
      console.error("[redis]", err.message);
    });
    await client.connect();
    return { store: new RedisStore(client), mode: "redis" };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[store] redis unavailable, fallback memory:", err.message);
    return { store: new MemoryStore(), mode: "memory" };
  }
}

function toSeats(room) {
  return {
    red: !!room.players.red,
    blue: !!room.players.blue,
    spectators: Array.isArray(room.spectators) ? room.spectators.length : 0
  };
}

function makeRateLimiter({ max, windowMs, keyPrefix }) {
  const buckets = new Map();
  return (req, res, next) => {
    const ip = (req.headers["x-forwarded-for"] || req.ip || "unknown").toString().split(",")[0].trim();
    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();

    const bucket = buckets.get(key) || { start: now, count: 0 };
    if (now - bucket.start >= windowMs) {
      bucket.start = now;
      bucket.count = 0;
    }

    bucket.count += 1;
    buckets.set(key, bucket);

    if (bucket.count > max) {
      res.status(429).json({ error: "请求过于频繁，请稍后再试" });
      return;
    }

    next();
  };
}

const limitCreateJoin = makeRateLimiter({ max: 40, windowMs: 60 * 1000, keyPrefix: "create-join" });
const limitStateRead = makeRateLimiter({ max: 360, windowMs: 60 * 1000, keyPrefix: "state-read" });
const limitStateWrite = makeRateLimiter({ max: 120, windowMs: 60 * 1000, keyPrefix: "state-write" });

function makeRoomLog(room, { role, actionId, summary, snapshot }) {
  const previous = room.logs.length > 0 ? room.logs[room.logs.length - 1].digest : "GENESIS";
  const payload = {
    roomId: room.id,
    version: room.version,
    role,
    actionId,
    summary,
    at: Date.now(),
    current: snapshot?.game?.current,
    rollCount: snapshot?.game?.rollCount
  };
  const digest = signLogPayload(payload, previous);
  return {
    id: `${room.version}-${actionId}`,
    idx: room.version,
    at: payload.at,
    role,
    summary,
    actionId,
    digest,
    prevDigest: previous,
    snapshot
  };
}

function verifyLogs(logs) {
  if (!Array.isArray(logs) || logs.length === 0) return true;
  let prev = logs[0].prevDigest || "GENESIS";
  for (const log of logs) {
    const payload = {
      roomId: log.roomId || "",
      version: log.idx,
      role: log.role,
      actionId: log.actionId,
      summary: log.summary,
      at: log.at,
      current: log.snapshot?.game?.current,
      rollCount: log.snapshot?.game?.rollCount
    };
    const expected = signLogPayload(payload, prev);
    if (expected !== log.digest || log.prevDigest !== prev) {
      return false;
    }
    prev = log.digest;
  }
  return true;
}

function findRoleByToken(room, token) {
  if (!token) return null;
  if (room.players.red && room.players.red.token === token) return "red";
  if (room.players.blue && room.players.blue.token === token) return "blue";
  const spectator = (room.spectators || []).find((s) => s.token === token);
  if (spectator) return "spectator";
  return null;
}

(async () => {
  const { store, mode } = await createStore();

  async function assertRoom(req, res) {
    const roomId = sanitizeRoomId(req.params.roomId);
    if (!roomId) {
      res.status(400).json({ error: "房间号非法" });
      return null;
    }

    const room = await store.getRoom(roomId);
    if (!room) {
      res.status(404).json({ error: "房间不存在" });
      return null;
    }

    return { roomId, room };
  }

  app.get("/api/version", (_req, res) => {
    res.json({ version: APP_VERSION, deployedAt: DEPLOYED_AT, storeMode: mode });
  });

  app.get("/api/rules", (_req, res) => {
    res.json(rulesConfig);
  });

  app.post("/api/rooms", limitCreateJoin, async (req, res) => {
    const snapshot = req.body && req.body.snapshot ? req.body.snapshot : defaultSnapshot();
    const password = typeof req.body?.password === "string" ? req.body.password.trim() : "";

    let roomId = genId(6);
    while (await store.hasRoom(roomId)) roomId = genId(6);

    const now = Date.now();
    const redToken = genId(24);

    const room = {
      id: roomId,
      roomId,
      createdAt: now,
      updatedAt: now,
      version: 0,
      snapshot,
      passwordHash: password ? hashPassword(roomId, password) : null,
      players: {
        red: { token: redToken, joinedAt: now, lastSeenAt: now },
        blue: null
      },
      spectators: [],
      processedActions: {},
      processedOrder: [],
      actionMeta: {
        red: { lastAt: 0 },
        blue: { lastAt: 0 }
      },
      logs: []
    };

    await store.setRoom(room);

    res.status(201).json({
      roomId,
      role: "red",
      mode: "player",
      token: redToken,
      version: room.version,
      snapshot: room.snapshot,
      seats: toSeats(room)
    });
  });

  app.post("/api/rooms/:roomId/join", limitCreateJoin, async (req, res) => {
    const data = await assertRoom(req, res);
    if (!data) return;

    const { room, roomId } = data;
    const now = Date.now();
    const token = typeof req.body?.token === "string" ? req.body.token : "";
    const modeReq = req.body?.mode === "spectator" ? "spectator" : "player";
    const password = typeof req.body?.password === "string" ? req.body.password.trim() : "";

    const existingRole = findRoleByToken(room, token);
    if (existingRole) {
      if (existingRole === "red" || existingRole === "blue") {
        room.players[existingRole].lastSeenAt = now;
      } else {
        const item = room.spectators.find((s) => s.token === token);
        if (item) item.lastSeenAt = now;
      }
      room.updatedAt = now;
      await store.setRoom(room);
      res.json({
        roomId,
        role: existingRole,
        mode: existingRole === "spectator" ? "spectator" : "player",
        token,
        version: room.version,
        snapshot: room.snapshot,
        seats: toSeats(room)
      });
      return;
    }

    if (room.passwordHash && hashPassword(roomId, password) !== room.passwordHash) {
      res.status(401).json({ error: "房间密码错误" });
      return;
    }

    if (modeReq === "player") {
      if (!room.players.red) {
        const newToken = genId(24);
        room.players.red = { token: newToken, joinedAt: now, lastSeenAt: now };
        room.updatedAt = now;
        await store.setRoom(room);
        res.json({
          roomId,
          role: "red",
          mode: "player",
          token: newToken,
          version: room.version,
          snapshot: room.snapshot,
          seats: toSeats(room)
        });
        return;
      }

      if (!room.players.blue) {
        const newToken = genId(24);
        room.players.blue = { token: newToken, joinedAt: now, lastSeenAt: now };
        room.updatedAt = now;
        await store.setRoom(room);
        res.json({
          roomId,
          role: "blue",
          mode: "player",
          token: newToken,
          version: room.version,
          snapshot: room.snapshot,
          seats: toSeats(room)
        });
        return;
      }
    }

    const spectatorToken = genId(24);
    room.spectators = room.spectators || [];
    room.spectators.push({ token: spectatorToken, joinedAt: now, lastSeenAt: now });
    room.updatedAt = now;
    await store.setRoom(room);

    res.json({
      roomId,
      role: "spectator",
      mode: "spectator",
      token: spectatorToken,
      version: room.version,
      snapshot: room.snapshot,
      seats: toSeats(room)
    });
  });

  app.get("/api/rooms/:roomId/state", limitStateRead, async (req, res) => {
    const data = await assertRoom(req, res);
    if (!data) return;

    const { room } = data;
    room.updatedAt = Date.now();
    await store.setRoom(room);

    res.json({
      version: room.version,
      snapshot: room.snapshot,
      seats: toSeats(room),
      updatedAt: room.updatedAt,
      actionQueueDepth: Object.keys(room.processedActions || {}).length
    });
  });

  app.post("/api/rooms/:roomId/state", limitStateWrite, async (req, res) => {
    const data = await assertRoom(req, res);
    if (!data) return;

    const { room } = data;
    const { role, token, baseVersion, snapshot, actionId, summary } = req.body || {};

    if (!role || !token || !snapshot || !actionId) {
      res.status(400).json({ error: "缺少 role/token/snapshot/actionId" });
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

    if (room.processedActions[actionId]) {
      res.json({
        ok: true,
        dedup: true,
        version: room.processedActions[actionId].version,
        seats: toSeats(room)
      });
      return;
    }

    const now = Date.now();
    const lastAt = room.actionMeta?.[role]?.lastAt || 0;
    if (now - lastAt < ACTION_SPAM_MS) {
      res.status(429).json({ error: "操作过快，请稍后重试" });
      return;
    }

    if (!Number.isInteger(baseVersion) || baseVersion !== room.version) {
      res.status(409).json({
        error: "版本冲突",
        version: room.version,
        snapshot: room.snapshot,
        seats: toSeats(room)
      });
      return;
    }

    room.snapshot = snapshot;
    room.version += 1;
    room.updatedAt = now;
    room.players[role].lastSeenAt = now;
    room.actionMeta[role].lastAt = now;

    const log = makeRoomLog(room, {
      role,
      actionId,
      summary: typeof summary === "string" ? summary.slice(0, 200) : "state_update",
      snapshot
    });
    log.roomId = room.id;

    room.logs.push(log);
    if (room.logs.length > 240) {
      room.logs = room.logs.slice(room.logs.length - 240);
    }

    room.processedActions[actionId] = { version: room.version, at: now };
    room.processedOrder.push(actionId);
    if (room.processedOrder.length > 300) {
      const remove = room.processedOrder.splice(0, room.processedOrder.length - 300);
      remove.forEach((id) => delete room.processedActions[id]);
    }

    await store.setRoom(room);

    res.json({
      ok: true,
      version: room.version,
      seats: toSeats(room),
      integrity: verifyLogs(room.logs)
    });
  });

  app.get("/api/rooms/:roomId/logs", limitStateRead, async (req, res) => {
    const data = await assertRoom(req, res);
    if (!data) return;
    const { room } = data;
    const limit = Math.max(1, Math.min(240, Number(req.query.limit || 100)));
    const logs = room.logs.slice(-limit);
    res.json({
      logs,
      integrity: verifyLogs(logs),
      total: room.logs.length
    });
  });

  app.post("/api/rooms/:roomId/leave", limitCreateJoin, async (req, res) => {
    const data = await assertRoom(req, res);
    if (!data) return;

    const { room } = data;
    const token = typeof req.body?.token === "string" ? req.body.token : "";
    const role = findRoleByToken(room, token);

    if (role === "red" || role === "blue") {
      room.players[role] = null;
    } else if (role === "spectator") {
      room.spectators = (room.spectators || []).filter((s) => s.token !== token);
    }

    room.updatedAt = Date.now();

    if (!room.players.red && !room.players.blue && (!room.spectators || room.spectators.length === 0)) {
      await store.deleteRoom(room.id);
    } else {
      await store.setRoom(room);
    }

    res.json({ ok: true, seats: toSeats(room) });
  });

  app.use(express.static(staticDir, { extensions: ["html"] }));

  // Keep direct refresh paths working.
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticDir, "index.html"));
  });

  setInterval(() => {
    if (typeof store.cleanup === "function") {
      store.cleanup();
    }
  }, 10 * 60 * 1000).unref();

  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`[flight-chess] http://localhost:${PORT} | v${APP_VERSION} | store=${mode}`);
  });
})();
