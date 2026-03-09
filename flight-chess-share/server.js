const path = require("path");
const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const { WebSocketServer } = require("ws");

let redisFactory = null;

const PORT = Number(process.env.PORT || 10000);
const APP_VERSION = process.env.APP_VERSION || "2.3.0";
const DEPLOYED_AT = new Date().toISOString();
const ROOM_TTL_MS = 12 * 60 * 60 * 1000;
const ACTION_SPAM_MS = 260;
const PATH_LEN = 44;
const HOME_LEN = 3;
const GOAL_STEP = PATH_LEN + HOME_LEN;
const PLAYER_START_INDEX = [0, 22];
const DEFAULT_PACK_ID = process.env.DEFAULT_RULE_PACK || "classic";
const SESSION_TTL_MS = Number(process.env.SESSION_TTL_MS || 30 * 60 * 1000);
const LOG_SECRET = process.env.LOG_SIGNING_SECRET || crypto.randomBytes(24).toString("hex");
const REDIS_URL = process.env.REDIS_URL || "";
const REDIS_PREFIX = process.env.REDIS_PREFIX || "flightchess";
const MAX_BODY_BYTES = 1024 * 1024;
const CORS_ALLOW_ALL = String(process.env.CORS_ALLOW_ALL || "0") === "1";
const CORS_ALLOW_ORIGINS = new Set(
  String(process.env.CORS_ALLOW_ORIGINS || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean),
);

const staticDir = __dirname;

const metrics = {
  startedAt: Date.now(),
  requests: 0,
  errors: 0,
  roomsCreated: 0,
  actionsHandled: 0,
  timeoutSkips: 0,
  snapshotWrites: 0,
  joins: 0,
  leaves: 0,
  chatMessages: 0,
  clientErrors: 0,
  wsConnectionsAccepted: 0,
  wsConnectionsActive: 0,
  wsConnectionsPeak: 0,
  broadcasts: 0,
};

const recentErrors = [];

const defaultCorsAllowOrigins = new Set([
  "https://flight-chess-room-v2.onrender.com",
  "https://flight-chess-share-fei.onrender.com",
  "http://localhost:10000",
  "http://127.0.0.1:10000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

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

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function loadRulesPack(fileName, meta) {
  const fullPath = path.join(__dirname, fileName);
  const cfg = JSON.parse(fs.readFileSync(fullPath, "utf8"));
  if (!Array.isArray(cfg.cells) || cfg.cells.length !== PATH_LEN) {
    throw new Error(`规则包 ${fileName} 的格子数量必须为 ${PATH_LEN}`);
  }
  return {
    id: meta.id,
    name: meta.name,
    description: meta.description,
    fileName,
    config: cfg,
  };
}

const contentPackList = [
  {
    id: "classic",
    name: "情侣飞行棋（原版）",
    description: "使用你当前这套完整文案",
    fileName: "rules.json",
  },
  {
    id: "lite",
    name: "情侣飞行棋（轻量版）",
    description: "更轻松的互动任务，适合公开演示",
    fileName: "rules-lite.json",
  },
].map((item) => loadRulesPack(item.fileName, item));

const contentPacks = new Map(contentPackList.map((item) => [item.id, item]));

function getPack(packId) {
  const resolved = String(packId || "").trim();
  return contentPacks.get(resolved) || contentPacks.get(DEFAULT_PACK_ID) || contentPackList[0];
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

function normalizeSnapshot(snapshot) {
  const safe = snapshot && typeof snapshot === "object" ? snapshot : {};
  const players = Array.isArray(safe.players) ? safe.players : [];
  const game = safe.game && typeof safe.game === "object" ? safe.game : {};

  return {
    players: [0, 1].map((idx) => {
      const p = players[idx] || {};
      return {
        step: Number.isInteger(p.step) ? p.step : -1,
        skip: Number.isInteger(p.skip) ? p.skip : 0,
      };
    }),
    game: {
      current: game.current === 1 ? 1 : 0,
      dice: Number.isInteger(game.dice) ? game.dice : null,
      lastRoll: game.lastRoll && typeof game.lastRoll === "object" ? game.lastRoll : null,
      gameOver: !!game.gameOver,
      message: typeof game.message === "string" ? game.message : "点击掷骰子开始。",
      diceHistory: Array.isArray(game.diceHistory) ? game.diceHistory.slice(0, 80) : [],
      rollCount: Number.isInteger(game.rollCount) ? game.rollCount : 0,
      turnHistory: Array.isArray(game.turnHistory) ? game.turnHistory.slice(0, 120) : [],
      selectedCellIndex: Number.isInteger(game.selectedCellIndex) ? game.selectedCellIndex : null,
      lastTriggeredCell:
        game.lastTriggeredCell && typeof game.lastTriggeredCell === "object" ? game.lastTriggeredCell : null,
    },
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

  async countRooms() {
    return this.rooms.size;
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

  async countRooms() {
    const keys = await this.client.keys(`${REDIS_PREFIX}:room:*`);
    return keys.length;
  }

  cleanup() {}
}

async function createStore() {
  if (!REDIS_URL) {
    return { store: new MemoryStore(), mode: "memory" };
  }

  if (!redisFactory) {
    try {
      // Lazy load only when REDIS_URL configured.
      // eslint-disable-next-line global-require
      redisFactory = require("redis");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[store] redis package unavailable, fallback memory:", err.message);
      return { store: new MemoryStore(), mode: "memory" };
    }
  }

  try {
    const client = redisFactory.createClient({
      url: REDIS_URL,
      socket: { reconnectStrategy: () => 1000, connectTimeout: 1500 },
    });
    client.on("error", (err) => {
      // eslint-disable-next-line no-console
      console.error("[redis]", err.message);
    });
    await Promise.race([
      client.connect(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("redis connect timeout")), 2500)),
    ]);
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
    spectators: Array.isArray(room.spectators) ? room.spectators.length : 0,
  };
}

function makeRateLimiter({ max, windowMs, keyPrefix }) {
  const buckets = new Map();
  return (req) => {
    const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown")
      .toString()
      .split(",")[0]
      .trim();
    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();

    const bucket = buckets.get(key) || { start: now, count: 0 };
    if (now - bucket.start >= windowMs) {
      bucket.start = now;
      bucket.count = 0;
    }

    bucket.count += 1;
    buckets.set(key, bucket);

    return bucket.count <= max;
  };
}

const limitCreateJoin = makeRateLimiter({ max: 40, windowMs: 60 * 1000, keyPrefix: "create-join" });
const limitStateRead = makeRateLimiter({ max: 500, windowMs: 60 * 1000, keyPrefix: "state-read" });
const limitStateWrite = makeRateLimiter({ max: 220, windowMs: 60 * 1000, keyPrefix: "state-write" });

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
    rollCount: snapshot?.game?.rollCount,
    packId: room.packId,
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
    roomId: room.id,
    packId: room.packId,
    snapshot,
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
      rollCount: log.snapshot?.game?.rollCount,
      packId: log.packId || "",
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

function getSessionExpiry() {
  return Date.now() + SESSION_TTL_MS;
}

function isSeatExpired(seat) {
  return !!(seat && seat.sessionExpiresAt && Date.now() > seat.sessionExpiresAt);
}

function touchSeatSession(seat) {
  if (!seat) return;
  seat.lastSeenAt = Date.now();
  seat.sessionExpiresAt = getSessionExpiry();
}

function activePackConfig(room) {
  if (room.packId === "custom" && room.customPack) {
    return room.customPack;
  }
  return getPack(room.packId).config;
}

function purgeExpiredParticipants(room) {
  if (isSeatExpired(room.players.red)) {
    room.players.red = null;
  }
  if (isSeatExpired(room.players.blue)) {
    room.players.blue = null;
  }
  room.spectators = (room.spectators || []).filter((s) => !isSeatExpired(s));
}

function toGlobalIndex(playerIdx, step) {
  return (PLAYER_START_INDEX[playerIdx] + step) % PATH_LEN;
}

function describeStep(step) {
  if (step === -1) return "基地";
  if (step === GOAL_STEP) return "终点";
  if (step < PATH_LEN) return `环道${step + 1}`;
  return `冲刺${step - PATH_LEN + 1}`;
}

function canMove(player, dice) {
  if (player.step === -1) return dice === 6;
  return player.step + dice <= GOAL_STEP;
}

function handleCapture(snapshot, playerIdx) {
  const me = snapshot.players[playerIdx];
  const enemyIdx = playerIdx === 0 ? 1 : 0;
  const enemy = snapshot.players[enemyIdx];

  if (me.step < 0 || me.step >= PATH_LEN || enemy.step < 0 || enemy.step >= PATH_LEN) {
    return "";
  }

  const meGlobal = toGlobalIndex(playerIdx, me.step);
  const enemyGlobal = toGlobalIndex(enemyIdx, enemy.step);
  if (meGlobal === enemyGlobal) {
    enemy.step = -1;
    return "撞机成功，对方回基地";
  }

  return "";
}

function applyCellEffect(snapshot, playerIdx, text) {
  const me = snapshot.players[playerIdx];
  const enemy = snapshot.players[playerIdx === 0 ? 1 : 0];
  let extraTurn = false;
  let effect = `触发：${text}`;

  const moveMatch = text.match(/(前进|后退)(\d+)格/);
  if (moveMatch && me.step !== -1) {
    const sign = moveMatch[1] === "前进" ? 1 : -1;
    const n = Number(moveMatch[2]);
    const next = me.step + sign * n;
    if (next >= 0 && next <= GOAL_STEP) {
      me.step = next;
      effect += `，位置变为${describeStep(me.step)}`;
    }
  }

  if (text.includes("再掷一次") || text.includes("掷骰子")) {
    extraTurn = true;
    effect += "，获得额外回合";
  }

  if (text.includes("返回起点")) {
    me.step = -1;
    effect += "，回到基地";
  }

  if (text.includes("下一轮休息")) {
    me.skip += 1;
    effect += "，下回合休息";
  }

  if (text.includes("交换位置") && enemy.step >= 0) {
    const t = me.step;
    me.step = enemy.step;
    enemy.step = t;
    effect += "，与对方交换位置";
  }

  return { extraTurn, effect };
}

function recordDiceHistory(snapshot, playerIdx, dice, fromStep, toStep) {
  snapshot.game.rollCount += 1;
  snapshot.game.lastRoll = { playerIdx, dice };
  snapshot.game.diceHistory.unshift({
    id: snapshot.game.rollCount,
    playerIdx,
    dice,
    fromStep,
    toStep,
  });
  snapshot.game.diceHistory = snapshot.game.diceHistory.slice(0, 80);
}

function recordTurn(snapshot, entry) {
  snapshot.game.turnHistory.unshift(entry);
  snapshot.game.turnHistory = snapshot.game.turnHistory.slice(0, 120);
}

function applyServerAction(room, role, actionType) {
  const snapshot = normalizeSnapshot(room.snapshot);
  const cells = activePackConfig(room).cells;

  if (actionType === "restart") {
    room.snapshot = defaultSnapshot();
    return {
      summary: `${role === "red" ? "男方" : "女方"} 发起重开对局`,
      snapshot: room.snapshot,
    };
  }

  if (actionType === "timeout_skip") {
    if (snapshot.game.gameOver) {
      throw new Error("对局已结束，请重开");
    }
    const playerIdx = snapshot.game.current;
    const expectedRole = playerIdx === 0 ? "red" : "blue";
    if (role !== expectedRole) {
      throw new Error("当前不是你的回合");
    }
    const playerName = playerIdx === 0 ? "男方" : "女方";
    snapshot.game.message = `${playerName} 超时，系统自动跳过本回合。`;
    recordTurn(snapshot, {
      id: snapshot.game.rollCount + 1,
      at: Date.now(),
      player: playerName,
      dice: 0,
      from: describeStep(snapshot.players[playerIdx].step),
      to: describeStep(snapshot.players[playerIdx].step),
      event: "超时跳过",
      signature: "",
    });
    snapshot.game.current = snapshot.game.current === 0 ? 1 : 0;
    snapshot.game.dice = null;
    room.snapshot = snapshot;
    return { summary: snapshot.game.message, snapshot };
  }

  if (actionType !== "roll") {
    throw new Error("不支持的动作类型");
  }

  if (snapshot.game.gameOver) {
    throw new Error("对局已结束，请重开");
  }

  const playerIdx = snapshot.game.current;
  const expectedRole = playerIdx === 0 ? "red" : "blue";
  if (role !== expectedRole) {
    throw new Error("当前不是你的回合");
  }

  const player = snapshot.players[playerIdx];
  const playerName = playerIdx === 0 ? "男方" : "女方";

  if (player.skip > 0) {
    player.skip -= 1;
    const msg = `${playerName} 本回合休息。`;
    snapshot.game.message = msg;
    recordTurn(snapshot, {
      id: snapshot.game.rollCount + 1,
      at: Date.now(),
      player: playerName,
      dice: 0,
      from: describeStep(player.step),
      to: describeStep(player.step),
      event: "休息回合",
      signature: "",
    });
    snapshot.game.dice = null;
    snapshot.game.current = snapshot.game.current === 0 ? 1 : 0;
    room.snapshot = snapshot;
    return { summary: msg, snapshot };
  }

  const dice = crypto.randomInt(1, 7);
  snapshot.game.dice = dice;
  const fromStep = player.step;

  if (!canMove(player, dice)) {
    recordDiceHistory(snapshot, playerIdx, dice, fromStep, fromStep);
    const msg = `${playerName} 掷出 ${dice}，点数无效，回合结束。`;
    snapshot.game.message = msg;
    recordTurn(snapshot, {
      id: snapshot.game.rollCount,
      at: Date.now(),
      player: playerName,
      dice,
      from: describeStep(fromStep),
      to: describeStep(fromStep),
      event: "点数无效",
      signature: "",
    });
    snapshot.game.current = snapshot.game.current === 0 ? 1 : 0;
    snapshot.game.dice = null;
    room.snapshot = snapshot;
    return { summary: msg, snapshot };
  }

  player.step = player.step === -1 ? 0 : player.step + dice;
  let message = `${playerName} 掷出 ${dice}，移动到 ${describeStep(player.step)}。`;

  const cap1 = handleCapture(snapshot, playerIdx);
  if (cap1) message += ` ${cap1}。`;

  if (player.step === GOAL_STEP) {
    recordDiceHistory(snapshot, playerIdx, dice, fromStep, player.step);
    snapshot.game.gameOver = true;
    message += ` ${playerName} 率先抵达终点，获胜！`;
    snapshot.game.message = message;
    recordTurn(snapshot, {
      id: snapshot.game.rollCount,
      at: Date.now(),
      player: playerName,
      dice,
      from: describeStep(fromStep),
      to: describeStep(player.step),
      event: "到达终点并获胜",
      signature: "",
    });
    snapshot.game.dice = null;
    room.snapshot = snapshot;
    return { summary: message, snapshot };
  }

  let extraTurn = dice === 6;
  let effectText = "";

  if (player.step >= 0 && player.step < PATH_LEN) {
    const cellIdx = toGlobalIndex(playerIdx, player.step);
    const cellText = cells[cellIdx];
    const effect = applyCellEffect(snapshot, playerIdx, cellText);
    effectText = effect.effect;
    snapshot.game.lastTriggeredCell = {
      player: playerName,
      index: cellIdx,
      text: cellText,
      at: Date.now(),
    };
    message += ` ${effectText}。`;
    extraTurn = extraTurn || effect.extraTurn;

    const cap2 = handleCapture(snapshot, playerIdx);
    if (cap2) message += ` ${cap2}。`;
  }

  recordDiceHistory(snapshot, playerIdx, dice, fromStep, player.step);

  if (player.step === GOAL_STEP) {
    snapshot.game.gameOver = true;
    message += ` ${playerName} 率先抵达终点，获胜！`;
  }

  snapshot.game.message = message;

  recordTurn(snapshot, {
    id: snapshot.game.rollCount,
    at: Date.now(),
    player: playerName,
    dice,
    from: describeStep(fromStep),
    to: describeStep(player.step),
    event: effectText || (extraTurn ? "额外回合" : "正常移动"),
    signature: "",
  });

  if (!snapshot.game.gameOver) {
    snapshot.game.current = extraTurn ? snapshot.game.current : snapshot.game.current === 0 ? 1 : 0;
  }

  snapshot.game.dice = null;
  room.snapshot = snapshot;

  return { summary: message, snapshot };
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(body);
}

function sendText(res, status, text, contentType = "text/plain; charset=utf-8") {
  res.writeHead(status, {
    "content-type": contentType,
    "cache-control": "no-store",
  });
  res.end(text);
}

function fileContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".html":
      return "text/html; charset=utf-8";
    case ".js":
      return "application/javascript; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".webmanifest":
      return "application/manifest+json; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}

function resolveCorsOrigin(req) {
  const origin = String(req.headers.origin || "").trim();
  if (!origin) return "";
  if (CORS_ALLOW_ALL) return "*";
  if (CORS_ALLOW_ORIGINS.has(origin) || defaultCorsAllowOrigins.has(origin)) {
    return origin;
  }
  return "";
}

function isPathSafe(filePath) {
  const normalizedBase = path.resolve(staticDir);
  const normalizedFile = path.resolve(filePath);
  return normalizedFile.startsWith(normalizedBase);
}

async function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    let size = 0;

    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("请求体过大"));
        req.destroy();
        return;
      }
      raw += chunk.toString("utf8");
    });

    req.on("end", () => {
      if (!raw.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (_err) {
        reject(new Error("JSON 格式错误"));
      }
    });

    req.on("error", (err) => reject(err));
  });
}

(async () => {
  const { store, mode } = await createStore();
  const wsRoomMap = new Map();

  function getWsSet(roomId) {
    let set = wsRoomMap.get(roomId);
    if (!set) {
      set = new Set();
      wsRoomMap.set(roomId, set);
    }
    return set;
  }

  function wsSend(ws, payload) {
    if (ws.readyState !== ws.OPEN) return;
    ws.send(JSON.stringify(payload));
  }

  function wsBroadcast(roomId, payload) {
    const set = wsRoomMap.get(roomId);
    if (!set || set.size === 0) return;
    const body = JSON.stringify(payload);
    for (const ws of set) {
      if (ws.readyState === ws.OPEN) {
        ws.send(body);
      }
    }
    metrics.broadcasts += 1;
  }

  function wsDetach(ws) {
    if (!ws.__roomId) return;
    const roomSet = wsRoomMap.get(ws.__roomId);
    if (roomSet) {
      roomSet.delete(ws);
      if (roomSet.size === 0) {
        wsRoomMap.delete(ws.__roomId);
      }
    }
    metrics.wsConnectionsActive = Math.max(0, metrics.wsConnectionsActive - 1);
  }

  function broadcastPresence(room) {
    wsBroadcast(room.id, {
      type: "presence",
      roomId: room.id,
      seats: toSeats(room),
      version: room.version,
      packId: room.packId,
      at: Date.now(),
    });
  }

  function broadcastState(room, reason = "sync") {
    wsBroadcast(room.id, {
      type: "room_update",
      roomId: room.id,
      version: room.version,
      seats: toSeats(room),
      snapshot: room.snapshot,
      packId: room.packId,
      integrity: verifyLogs(room.logs),
      reason,
      at: Date.now(),
    });
  }

  function broadcastChat(room, message) {
    wsBroadcast(room.id, {
      type: "chat_message",
      roomId: room.id,
      message,
      at: Date.now(),
    });
  }

  async function assertRoom(roomIdRaw) {
    const roomId = sanitizeRoomId(roomIdRaw);
    if (!roomId) {
      return { error: { status: 400, body: { error: "房间号非法" } } };
    }
    const room = await store.getRoom(roomId);
    if (!room) {
      return { error: { status: 404, body: { error: "房间不存在" } } };
    }
    purgeExpiredParticipants(room);
    return { roomId, room };
  }

  function extractAuthToken(req, url) {
    const q = String(url.searchParams.get("token") || "").trim();
    if (q) return q;
    const headerToken = req.headers["x-room-token"];
    if (Array.isArray(headerToken)) return String(headerToken[0] || "").trim();
    return String(headerToken || "").trim();
  }

  function authorizeRoomRead(room, token) {
    const role = findRoleByToken(room, token);
    if (!role) return null;
    if (role === "red" || role === "blue") {
      touchSeatSession(room.players[role]);
    } else {
      const spectator = (room.spectators || []).find((s) => s.token === token);
      if (spectator) {
        spectator.lastSeenAt = Date.now();
        spectator.sessionExpiresAt = getSessionExpiry();
      }
    }
    return role;
  }

  async function touchSessionByToken(roomId, token) {
    const room = await store.getRoom(roomId);
    if (!room) return null;
    const role = findRoleByToken(room, token);
    if (!role) return null;
    const now = Date.now();
    if (role === "red" || role === "blue") {
      touchSeatSession(room.players[role]);
    } else {
      const spectator = (room.spectators || []).find((s) => s.token === token);
      if (spectator) {
        spectator.lastSeenAt = now;
        spectator.sessionExpiresAt = getSessionExpiry();
      }
    }
    room.updatedAt = now;
    await store.setRoom(room);
    return role;
  }

  const server = http.createServer(async (req, res) => {
    metrics.requests += 1;

    try {
      const base = `http://${req.headers.host || "localhost"}`;
      const url = new URL(req.url || "/", base);
      const pathname = decodeURIComponent(url.pathname || "/");
      const method = req.method || "GET";
      const corsOrigin = resolveCorsOrigin(req);

      if (pathname.startsWith("/api/")) {
        if (corsOrigin) {
          res.setHeader("access-control-allow-origin", corsOrigin);
          res.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
          res.setHeader("access-control-allow-headers", "content-type,x-room-token");
          res.setHeader("access-control-max-age", "86400");
          if (corsOrigin !== "*") {
            res.setHeader("vary", "Origin");
          }
        }

        if (method === "OPTIONS") {
          res.writeHead(204, { "cache-control": "no-store" });
          res.end();
          return;
        }

        if (method !== "GET" && method !== "POST") {
          sendJson(res, 405, { error: "Method Not Allowed" });
          return;
        }

        if (["/api/rooms", "/api/rooms/"].includes(pathname) || pathname.includes("/join") || pathname.includes("/leave")) {
          if (!limitCreateJoin(req)) {
            sendJson(res, 429, { error: "请求过于频繁，请稍后再试" });
            return;
          }
        }

        if (
          pathname.endsWith("/state") ||
          pathname.endsWith("/logs") ||
          pathname.endsWith("/chat") ||
          pathname.endsWith("/rules") ||
          pathname === "/api/rules"
        ) {
          if (!limitStateRead(req)) {
            sendJson(res, 429, { error: "请求过于频繁，请稍后再试" });
            return;
          }
        }

        if (
          pathname.endsWith("/action") ||
          pathname.endsWith("/state") ||
          pathname.endsWith("/content-pack") ||
          pathname.endsWith("/custom-pack") ||
          pathname.endsWith("/chat")
        ) {
          if (method === "POST" && !limitStateWrite(req)) {
            sendJson(res, 429, { error: "请求过于频繁，请稍后再试" });
            return;
          }
        }

        if (method === "GET" && pathname === "/api/version") {
          sendJson(res, 200, { version: APP_VERSION, deployedAt: DEPLOYED_AT, storeMode: mode });
          return;
        }

        if (method === "GET" && pathname === "/api/healthz") {
          let activeRooms = 0;
          try {
            activeRooms = await store.countRooms();
          } catch (_err) {
            activeRooms = -1;
          }
          sendJson(res, 200, {
            ok: true,
            version: APP_VERSION,
            storeMode: mode,
            activeRooms,
            uptimeSec: Math.floor((Date.now() - metrics.startedAt) / 1000),
          });
          return;
        }

        if (method === "GET" && pathname === "/api/metrics") {
          let activeRooms = 0;
          try {
            activeRooms = await store.countRooms();
          } catch (_err) {
            activeRooms = -1;
          }
          sendJson(res, 200, {
            ...metrics,
            activeRooms,
            wsRooms: wsRoomMap.size,
            uptimeSec: Math.floor((Date.now() - metrics.startedAt) / 1000),
          });
          return;
        }

        if (method === "GET" && pathname === "/api/errors") {
          sendJson(res, 200, {
            recent: recentErrors.slice(-40),
          });
          return;
        }

        if (method === "POST" && pathname === "/api/client-error") {
          let body;
          try {
            body = await readJsonBody(req);
          } catch (err) {
            sendJson(res, 400, { error: err.message || "请求体错误" });
            return;
          }
          metrics.clientErrors += 1;
          const item = {
            at: Date.now(),
            name: String(body?.name || "ClientError").slice(0, 120),
            message: String(body?.message || "").slice(0, 500),
            stack: String(body?.stack || "").slice(0, 1200),
            roomId: String(body?.roomId || "").slice(0, 32),
            ua: String(req.headers["user-agent"] || "").slice(0, 200),
          };
          recentErrors.push(item);
          if (recentErrors.length > 200) {
            recentErrors.splice(0, recentErrors.length - 200);
          }
          sendJson(res, 200, { ok: true });
          return;
        }

        if (method === "GET" && pathname === "/api/content-packs") {
          sendJson(res, 200, {
            defaultPackId: getPack(DEFAULT_PACK_ID).id,
            packs: contentPackList.map((item) => ({
              id: item.id,
              name: item.name,
              description: item.description,
              version: item.config.version,
            })),
          });
          return;
        }

        if (method === "GET" && pathname === "/api/rules") {
          const pack = getPack(url.searchParams.get("pack") || DEFAULT_PACK_ID);
          sendJson(res, 200, { ...clone(pack.config), packId: pack.id, packName: pack.name });
          return;
        }

        if (method === "POST" && pathname === "/api/rooms") {
          let body;
          try {
            body = await readJsonBody(req);
          } catch (err) {
            sendJson(res, 400, { error: err.message || "请求体错误" });
            return;
          }

          const snapshot = normalizeSnapshot(body && body.snapshot ? body.snapshot : defaultSnapshot());
          const password = typeof body?.password === "string" ? body.password.trim() : "";
          const pack = getPack(body?.packId || DEFAULT_PACK_ID);

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
            packId: pack.id,
            customPack: null,
            snapshot,
            passwordHash: password ? hashPassword(roomId, password) : null,
            players: {
              red: { token: redToken, joinedAt: now, lastSeenAt: now, sessionExpiresAt: getSessionExpiry() },
              blue: null,
            },
            spectators: [],
            chat: [],
            processedActions: {},
            processedOrder: [],
            actionMeta: {
              red: { lastAt: 0 },
              blue: { lastAt: 0 },
            },
            logs: [],
          };

          await store.setRoom(room);
          metrics.roomsCreated += 1;

          sendJson(res, 201, {
            roomId,
            role: "red",
            mode: "player",
            token: redToken,
            version: room.version,
            snapshot: room.snapshot,
            seats: toSeats(room),
            packId: room.packId,
          });
          return;
        }

        const roomJoinMatch = pathname.match(/^\/api\/rooms\/([A-Za-z0-9]+)\/join$/);
        if (method === "POST" && roomJoinMatch) {
          const roomRes = await assertRoom(roomJoinMatch[1]);
          if (roomRes.error) {
            sendJson(res, roomRes.error.status, roomRes.error.body);
            return;
          }

          let body;
          try {
            body = await readJsonBody(req);
          } catch (err) {
            sendJson(res, 400, { error: err.message || "请求体错误" });
            return;
          }

          const { room, roomId } = roomRes;
          const now = Date.now();
          const token = typeof body?.token === "string" ? body.token : "";
          const modeReq = body?.mode === "spectator" ? "spectator" : "player";
          const password = typeof body?.password === "string" ? body.password.trim() : "";

          const existingRole = findRoleByToken(room, token);
          if (existingRole) {
            if (existingRole === "red" || existingRole === "blue") {
              touchSeatSession(room.players[existingRole]);
            } else {
              const item = room.spectators.find((s) => s.token === token);
              if (item) {
                item.lastSeenAt = now;
                item.sessionExpiresAt = getSessionExpiry();
              }
            }
            room.updatedAt = now;
            await store.setRoom(room);
            sendJson(res, 200, {
              roomId,
              role: existingRole,
              mode: existingRole === "spectator" ? "spectator" : "player",
              token,
              version: room.version,
              snapshot: room.snapshot,
              seats: toSeats(room),
              packId: room.packId,
            });
            return;
          }

          if (room.passwordHash && hashPassword(roomId, password) !== room.passwordHash) {
            sendJson(res, 401, { error: "房间密码错误" });
            return;
          }

          if (isSeatExpired(room.players.red)) {
            room.players.red = null;
          }
          if (isSeatExpired(room.players.blue)) {
            room.players.blue = null;
          }

          if (modeReq === "player") {
            if (!room.players.red) {
              const newToken = genId(24);
              room.players.red = {
                token: newToken,
                joinedAt: now,
                lastSeenAt: now,
                sessionExpiresAt: getSessionExpiry(),
              };
              room.updatedAt = now;
              await store.setRoom(room);
              metrics.joins += 1;
              broadcastPresence(room);
              sendJson(res, 200, {
                roomId,
                role: "red",
                mode: "player",
                token: newToken,
                version: room.version,
                snapshot: room.snapshot,
                seats: toSeats(room),
                packId: room.packId,
              });
              return;
            }

            if (!room.players.blue) {
              const newToken = genId(24);
              room.players.blue = {
                token: newToken,
                joinedAt: now,
                lastSeenAt: now,
                sessionExpiresAt: getSessionExpiry(),
              };
              room.updatedAt = now;
              await store.setRoom(room);
              metrics.joins += 1;
              broadcastPresence(room);
              sendJson(res, 200, {
                roomId,
                role: "blue",
                mode: "player",
                token: newToken,
                version: room.version,
                snapshot: room.snapshot,
                seats: toSeats(room),
                packId: room.packId,
              });
              return;
            }
          }

          const spectatorToken = genId(24);
          room.spectators = room.spectators || [];
          room.spectators.push({
            token: spectatorToken,
            joinedAt: now,
            lastSeenAt: now,
            sessionExpiresAt: getSessionExpiry(),
          });
          room.updatedAt = now;
          await store.setRoom(room);
          metrics.joins += 1;
          broadcastPresence(room);

          sendJson(res, 200, {
            roomId,
            role: "spectator",
            mode: "spectator",
            token: spectatorToken,
            version: room.version,
            snapshot: room.snapshot,
            seats: toSeats(room),
            packId: room.packId,
          });
          return;
        }

        const roomStateMatch = pathname.match(/^\/api\/rooms\/([A-Za-z0-9]+)\/state$/);
        const roomRulesMatch = pathname.match(/^\/api\/rooms\/([A-Za-z0-9]+)\/rules$/);
        if (roomRulesMatch && method === "GET") {
          const roomRes = await assertRoom(roomRulesMatch[1]);
          if (roomRes.error) {
            sendJson(res, roomRes.error.status, roomRes.error.body);
            return;
          }
          const { room } = roomRes;
          const token = extractAuthToken(req, url);
          const role = authorizeRoomRead(room, token);
          if (!role) {
            sendJson(res, 403, { error: "鉴权失败" });
            return;
          }
          room.updatedAt = Date.now();
          await store.setRoom(room);
          const cfg = activePackConfig(room);
          sendJson(res, 200, {
            ...clone(cfg),
            packId: room.packId,
            packName: room.packId === "custom" ? "自定义文案包" : getPack(room.packId).name,
          });
          return;
        }

        if (roomStateMatch && method === "GET") {
          const roomRes = await assertRoom(roomStateMatch[1]);
          if (roomRes.error) {
            sendJson(res, roomRes.error.status, roomRes.error.body);
            return;
          }

          const { room } = roomRes;
          const token = extractAuthToken(req, url);
          const role = authorizeRoomRead(room, token);
          if (!role) {
            sendJson(res, 403, { error: "鉴权失败" });
            return;
          }
          room.updatedAt = Date.now();
          await store.setRoom(room);

          sendJson(res, 200, {
            version: room.version,
            snapshot: room.snapshot,
            seats: toSeats(room),
            updatedAt: room.updatedAt,
            actionQueueDepth: Object.keys(room.processedActions || {}).length,
            packId: room.packId,
          });
          return;
        }

        if (roomStateMatch && method === "POST") {
          const roomRes = await assertRoom(roomStateMatch[1]);
          if (roomRes.error) {
            sendJson(res, roomRes.error.status, roomRes.error.body);
            return;
          }

          let body;
          try {
            body = await readJsonBody(req);
          } catch (err) {
            sendJson(res, 400, { error: err.message || "请求体错误" });
            return;
          }

          const { room } = roomRes;
          const { role, token, baseVersion, snapshot, actionId, summary } = body || {};

          if (!role || !token || !snapshot || !actionId) {
            sendJson(res, 400, { error: "缺少 role/token/snapshot/actionId" });
            return;
          }

          if (!["red", "blue"].includes(role)) {
            sendJson(res, 400, { error: "role 非法" });
            return;
          }

          const seat = room.players[role];
          if (!seat || seat.token !== token) {
            sendJson(res, 403, { error: "鉴权失败" });
            return;
          }

          if (room.processedActions[actionId]) {
            sendJson(res, 200, {
              ok: true,
              dedup: true,
              version: room.processedActions[actionId].version,
              seats: toSeats(room),
            });
            return;
          }

          const now = Date.now();
          const lastAt = room.actionMeta?.[role]?.lastAt || 0;
          if (now - lastAt < ACTION_SPAM_MS) {
            sendJson(res, 429, { error: "操作过快，请稍后重试" });
            return;
          }

          if (!Number.isInteger(baseVersion) || baseVersion !== room.version) {
            sendJson(res, 409, {
              error: "版本冲突",
              version: room.version,
              snapshot: room.snapshot,
              seats: toSeats(room),
              packId: room.packId,
            });
            return;
          }

          room.snapshot = normalizeSnapshot(snapshot);
          room.version += 1;
          room.updatedAt = now;
          touchSeatSession(room.players[role]);
          room.actionMeta[role].lastAt = now;

          const log = makeRoomLog(room, {
            role,
            actionId,
            summary: typeof summary === "string" ? summary.slice(0, 200) : "state_update",
            snapshot: room.snapshot,
          });

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
          metrics.snapshotWrites += 1;
          broadcastState(room, "snapshot_sync");

          sendJson(res, 200, {
            ok: true,
            version: room.version,
            seats: toSeats(room),
            integrity: verifyLogs(room.logs),
            packId: room.packId,
            snapshot: room.snapshot,
          });
          return;
        }

        const roomActionMatch = pathname.match(/^\/api\/rooms\/([A-Za-z0-9]+)\/action$/);
        if (roomActionMatch && method === "POST") {
          const roomRes = await assertRoom(roomActionMatch[1]);
          if (roomRes.error) {
            sendJson(res, roomRes.error.status, roomRes.error.body);
            return;
          }

          let body;
          try {
            body = await readJsonBody(req);
          } catch (err) {
            sendJson(res, 400, { error: err.message || "请求体错误" });
            return;
          }

          const { room } = roomRes;
          const { role, token, baseVersion, actionId, actionType } = body || {};

          if (!role || !token || !actionId || !actionType) {
            sendJson(res, 400, { error: "缺少 role/token/actionId/actionType" });
            return;
          }

          if (!["red", "blue"].includes(role)) {
            sendJson(res, 400, { error: "role 非法" });
            return;
          }

          const seat = room.players[role];
          if (!seat || seat.token !== token) {
            sendJson(res, 403, { error: "鉴权失败" });
            return;
          }

          if (room.processedActions[actionId]) {
            sendJson(res, 200, {
              ok: true,
              dedup: true,
              version: room.processedActions[actionId].version,
              seats: toSeats(room),
              packId: room.packId,
            });
            return;
          }

          const now = Date.now();
          const lastAt = room.actionMeta?.[role]?.lastAt || 0;
          if (now - lastAt < ACTION_SPAM_MS) {
            sendJson(res, 429, { error: "操作过快，请稍后重试" });
            return;
          }

          if (!Number.isInteger(baseVersion) || baseVersion !== room.version) {
            sendJson(res, 409, {
              error: "版本冲突",
              version: room.version,
              snapshot: room.snapshot,
              seats: toSeats(room),
              packId: room.packId,
            });
            return;
          }

          let applied;
          try {
            applied = applyServerAction(room, role, actionType);
          } catch (err) {
            sendJson(res, 422, { error: err.message || "动作执行失败" });
            return;
          }

          room.version += 1;
          room.updatedAt = now;
          touchSeatSession(room.players[role]);
          room.actionMeta[role].lastAt = now;

          const log = makeRoomLog(room, {
            role,
            actionId,
            summary: applied.summary,
            snapshot: applied.snapshot,
          });

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
          metrics.actionsHandled += 1;
          if (actionType === "timeout_skip") {
            metrics.timeoutSkips += 1;
          }
          broadcastState(room, actionType);

          sendJson(res, 200, {
            ok: true,
            version: room.version,
            seats: toSeats(room),
            integrity: verifyLogs(room.logs),
            packId: room.packId,
            snapshot: room.snapshot,
            summary: applied.summary,
            actionType,
          });
          return;
        }

        const roomPackMatch = pathname.match(/^\/api\/rooms\/([A-Za-z0-9]+)\/content-pack$/);
        if (roomPackMatch && method === "POST") {
          const roomRes = await assertRoom(roomPackMatch[1]);
          if (roomRes.error) {
            sendJson(res, roomRes.error.status, roomRes.error.body);
            return;
          }

          let body;
          try {
            body = await readJsonBody(req);
          } catch (err) {
            sendJson(res, 400, { error: err.message || "请求体错误" });
            return;
          }

          const { room } = roomRes;
          const token = typeof body?.token === "string" ? body.token : "";
          const role = findRoleByToken(room, token);
          if (!role || role === "spectator") {
            sendJson(res, 403, { error: "仅玩家可切换文案包" });
            return;
          }

          const pack = getPack(body?.packId || room.packId);
          if (pack.id === room.packId) {
            sendJson(res, 200, {
              ok: true,
              unchanged: true,
              packId: room.packId,
              version: room.version,
              seats: toSeats(room),
              snapshot: room.snapshot,
            });
            return;
          }

          room.packId = pack.id;
          room.customPack = null;
          room.snapshot = defaultSnapshot();
          room.version += 1;
          room.updatedAt = Date.now();
          touchSeatSession(room.players[role]);

          const actionId = `pack-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          const summary = `${role === "red" ? "男方" : "女方"} 切换文案包为「${pack.name}」并重开`;

          const log = makeRoomLog(room, {
            role,
            actionId,
            summary,
            snapshot: room.snapshot,
          });
          room.logs.push(log);
          if (room.logs.length > 240) {
            room.logs = room.logs.slice(room.logs.length - 240);
          }

          await store.setRoom(room);
          broadcastState(room, "pack_change");

          sendJson(res, 200, {
            ok: true,
            packId: room.packId,
            version: room.version,
            seats: toSeats(room),
            snapshot: room.snapshot,
            integrity: verifyLogs(room.logs),
            summary,
          });
          return;
        }

        const roomCustomPackMatch = pathname.match(/^\/api\/rooms\/([A-Za-z0-9]+)\/custom-pack$/);
        if (roomCustomPackMatch && method === "POST") {
          const roomRes = await assertRoom(roomCustomPackMatch[1]);
          if (roomRes.error) {
            sendJson(res, roomRes.error.status, roomRes.error.body);
            return;
          }

          let body;
          try {
            body = await readJsonBody(req);
          } catch (err) {
            sendJson(res, 400, { error: err.message || "请求体错误" });
            return;
          }

          const { room } = roomRes;
          const token = typeof body?.token === "string" ? body.token : "";
          const role = findRoleByToken(room, token);
          if (!role || role === "spectator") {
            sendJson(res, 403, { error: "仅玩家可设置自定义文案包" });
            return;
          }

          const config = body?.config && typeof body.config === "object" ? body.config : null;
          if (!config || !Array.isArray(config.cells) || config.cells.length !== PATH_LEN) {
            sendJson(res, 400, { error: `自定义文案需要 ${PATH_LEN} 个格子` });
            return;
          }

          const safeConfig = {
            version: String(config.version || `custom-${Date.now()}`).slice(0, 80),
            title: String(config.title || "情侣飞行棋 自定义版").slice(0, 40),
            subtitle: String(config.subtitle || "联机双人版").slice(0, 40),
            boardRules: Array.isArray(config.boardRules) ? config.boardRules.map((v) => String(v).slice(0, 80)).slice(0, 8) : [],
            wheelLabels: Array.isArray(config.wheelLabels)
              ? config.wheelLabels.map((v) => String(v).slice(0, 24)).slice(0, 6)
              : [],
            cells: config.cells.map((v) => String(v).slice(0, 120)),
          };

          room.packId = "custom";
          room.customPack = safeConfig;
          room.snapshot = defaultSnapshot();
          room.version += 1;
          room.updatedAt = Date.now();
          touchSeatSession(room.players[role]);

          const actionId = `custom-pack-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          const summary = `${role === "red" ? "男方" : "女方"} 上传了自定义文案包并重开`;
          const log = makeRoomLog(room, {
            role,
            actionId,
            summary,
            snapshot: room.snapshot,
          });
          room.logs.push(log);
          if (room.logs.length > 240) {
            room.logs = room.logs.slice(room.logs.length - 240);
          }

          await store.setRoom(room);
          broadcastState(room, "custom_pack");

          sendJson(res, 200, {
            ok: true,
            packId: room.packId,
            version: room.version,
            seats: toSeats(room),
            snapshot: room.snapshot,
            integrity: verifyLogs(room.logs),
            summary,
          });
          return;
        }

        const roomChatMatch = pathname.match(/^\/api\/rooms\/([A-Za-z0-9]+)\/chat$/);
        if (roomChatMatch && method === "GET") {
          const roomRes = await assertRoom(roomChatMatch[1]);
          if (roomRes.error) {
            sendJson(res, roomRes.error.status, roomRes.error.body);
            return;
          }
          const { room } = roomRes;
          const token = extractAuthToken(req, url);
          const role = authorizeRoomRead(room, token);
          if (!role) {
            sendJson(res, 403, { error: "鉴权失败" });
            return;
          }
          const limit = Math.max(1, Math.min(200, Number(url.searchParams.get("limit") || 80)));
          const messages = (room.chat || []).slice(-limit);
          await store.setRoom(room);
          sendJson(res, 200, {
            messages,
            total: (room.chat || []).length,
          });
          return;
        }

        if (roomChatMatch && method === "POST") {
          const roomRes = await assertRoom(roomChatMatch[1]);
          if (roomRes.error) {
            sendJson(res, roomRes.error.status, roomRes.error.body);
            return;
          }
          let body;
          try {
            body = await readJsonBody(req);
          } catch (err) {
            sendJson(res, 400, { error: err.message || "请求体错误" });
            return;
          }
          const { room } = roomRes;
          const token = typeof body?.token === "string" ? body.token : "";
          const role = findRoleByToken(room, token);
          if (!role) {
            sendJson(res, 403, { error: "鉴权失败" });
            return;
          }
          const rawText = String(body?.text || "").trim();
          if (!rawText) {
            sendJson(res, 400, { error: "消息不能为空" });
            return;
          }
          const chatItem = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            at: Date.now(),
            role,
            text: rawText.slice(0, 200),
          };
          room.chat = room.chat || [];
          room.chat.push(chatItem);
          if (room.chat.length > 200) {
            room.chat = room.chat.slice(room.chat.length - 200);
          }
          room.updatedAt = Date.now();
          if (role === "red" || role === "blue") {
            touchSeatSession(room.players[role]);
          } else {
            const spectator = (room.spectators || []).find((s) => s.token === token);
            if (spectator) {
              spectator.lastSeenAt = room.updatedAt;
              spectator.sessionExpiresAt = getSessionExpiry();
            }
          }
          await store.setRoom(room);
          metrics.chatMessages += 1;
          broadcastChat(room, chatItem);
          sendJson(res, 200, { ok: true, message: chatItem, total: room.chat.length });
          return;
        }

        const roomLogsMatch = pathname.match(/^\/api\/rooms\/([A-Za-z0-9]+)\/logs$/);
        if (roomLogsMatch && method === "GET") {
          const roomRes = await assertRoom(roomLogsMatch[1]);
          if (roomRes.error) {
            sendJson(res, roomRes.error.status, roomRes.error.body);
            return;
          }
          const { room } = roomRes;
          const token = extractAuthToken(req, url);
          const role = authorizeRoomRead(room, token);
          if (!role) {
            sendJson(res, 403, { error: "鉴权失败" });
            return;
          }
          const limit = Math.max(1, Math.min(240, Number(url.searchParams.get("limit") || 100)));
          const logs = room.logs.slice(-limit);
          await store.setRoom(room);
          sendJson(res, 200, {
            logs,
            integrity: verifyLogs(logs),
            total: room.logs.length,
            packId: room.packId,
          });
          return;
        }

        const roomLeaveMatch = pathname.match(/^\/api\/rooms\/([A-Za-z0-9]+)\/leave$/);
        if (roomLeaveMatch && method === "POST") {
          const roomRes = await assertRoom(roomLeaveMatch[1]);
          if (roomRes.error) {
            sendJson(res, roomRes.error.status, roomRes.error.body);
            return;
          }

          let body;
          try {
            body = await readJsonBody(req);
          } catch (err) {
            sendJson(res, 400, { error: err.message || "请求体错误" });
            return;
          }

          const { room } = roomRes;
          const token = typeof body?.token === "string" ? body.token : "";
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
            broadcastPresence(room);
          }

          metrics.leaves += 1;
          sendJson(res, 200, { ok: true, seats: toSeats(room) });
          return;
        }

        sendJson(res, 404, { error: "Not Found" });
        return;
      }

      const inviteMatch = pathname.match(/^\/i\/([A-Za-z0-9]{4,8})$/);
      if (inviteMatch) {
        const roomId = sanitizeRoomId(inviteMatch[1]);
        const mode = url.searchParams.get("mode") === "spectator" ? "spectator" : "player";
        const target = `/?room=${encodeURIComponent(roomId)}${mode === "spectator" ? "&mode=spectator" : ""}`;
        res.writeHead(302, { location: target, "cache-control": "no-store" });
        res.end();
        return;
      }

      if (method !== "GET" && method !== "HEAD") {
        sendText(res, 405, "Method Not Allowed");
        return;
      }

      const cleanPath = pathname === "/" ? "/index.html" : pathname;
      const filePath = path.join(staticDir, cleanPath);

      let finalPath = filePath;
      if (!isPathSafe(finalPath) || !fs.existsSync(finalPath) || !fs.statSync(finalPath).isFile()) {
        finalPath = path.join(staticDir, "index.html");
      }

      const body = fs.readFileSync(finalPath);
      res.writeHead(200, {
        "content-type": fileContentType(finalPath),
        "cache-control": finalPath.endsWith("service-worker.js") ? "no-store" : "public, max-age=60",
      });
      if (method === "HEAD") {
        res.end();
      } else {
        res.end(body);
      }
    } catch (err) {
      metrics.errors += 1;
      recentErrors.push({
        at: Date.now(),
        name: "ServerError",
        message: String(err?.message || "unknown").slice(0, 500),
        stack: String(err?.stack || "").slice(0, 1500),
      });
      if (recentErrors.length > 200) {
        recentErrors.splice(0, recentErrors.length - 200);
      }
      sendJson(res, 500, { error: "服务器内部错误", detail: process.env.NODE_ENV === "development" ? err.message : undefined });
    }
  });

  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", async (ws, req) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
      const roomId = sanitizeRoomId(url.searchParams.get("room"));
      const token = String(url.searchParams.get("token") || "").trim();

      if (!roomId || !token) {
        wsSend(ws, { type: "error", message: "缺少 room/token" });
        ws.close(1008, "invalid params");
        return;
      }

      const room = await store.getRoom(roomId);
      if (!room) {
        wsSend(ws, { type: "error", message: "房间不存在" });
        ws.close(1008, "room not found");
        return;
      }

      purgeExpiredParticipants(room);

      const role = findRoleByToken(room, token);
      if (!role) {
        wsSend(ws, { type: "error", message: "鉴权失败" });
        ws.close(1008, "unauthorized");
        return;
      }

      if (role === "red" || role === "blue") {
        touchSeatSession(room.players[role]);
      } else {
        const spectator = (room.spectators || []).find((s) => s.token === token);
        if (spectator) {
          spectator.lastSeenAt = Date.now();
          spectator.sessionExpiresAt = getSessionExpiry();
        }
      }
      room.updatedAt = Date.now();
      await store.setRoom(room);

      ws.__roomId = roomId;
      ws.__role = role;
      ws.__token = token;
      ws.__lastSessionTouchAt = 0;
      getWsSet(roomId).add(ws);

      metrics.wsConnectionsAccepted += 1;
      metrics.wsConnectionsActive += 1;
      metrics.wsConnectionsPeak = Math.max(metrics.wsConnectionsPeak, metrics.wsConnectionsActive);

      wsSend(ws, {
        type: "welcome",
        roomId,
        role,
        version: room.version,
        seats: toSeats(room),
        packId: room.packId,
        snapshot: room.snapshot,
        at: Date.now(),
      });

      broadcastPresence(room);

      ws.on("message", (raw) => {
        try {
          const data = JSON.parse(String(raw));
          if (data?.type === "ping") {
            wsSend(ws, { type: "pong", at: Date.now() });
            if (Date.now() - (ws.__lastSessionTouchAt || 0) > 60 * 1000) {
              ws.__lastSessionTouchAt = Date.now();
              touchSessionByToken(roomId, ws.__token).catch(() => {});
            }
          }
        } catch (_err) {
          // ignore malformed frames
        }
      });

      ws.on("close", () => {
        wsDetach(ws);
      });

      ws.on("error", () => {
        wsDetach(ws);
      });
    } catch (_err) {
      try {
        ws.close(1011, "internal error");
      } catch (_e) {
        // ignore
      }
    }
  });

  setInterval(() => {
    if (typeof store.cleanup === "function") {
      store.cleanup();
    }
  }, 10 * 60 * 1000).unref();

  server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`[flight-chess] http://localhost:${PORT} | v${APP_VERSION} | store=${mode}`);
  });
})();
