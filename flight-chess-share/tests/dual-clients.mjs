import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import process from "node:process";
import { WebSocket } from "ws";

const cwd = "/Users/xiaoxuan/Documents/Playground/flight-chess-share";
const port = 39000 + Math.floor(Math.random() * 1000);
const base = `http://127.0.0.1:${port}`;

function serverStart() {
  const child = spawn("node", ["server.js"], {
    cwd,
    env: { ...process.env, PORT: String(port), APP_VERSION: "2.3.0-dual-test" },
    stdio: "ignore",
  });
  return child;
}

async function waitReady(timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${base}/api/healthz`);
      if (res.ok) return;
    } catch {
      // retry
    }
    await sleep(120);
  }
  throw new Error("server not ready");
}

async function req(path, init = {}, token = "") {
  const headers = { "content-type": "application/json", ...(init.headers || {}) };
  if (token) headers["x-room-token"] = token;
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
  return body;
}

function wsWaitFor(ws, matchFn, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("ws timeout")), timeoutMs);
    const onMessage = (raw) => {
      const data = JSON.parse(String(raw));
      if (matchFn(data)) {
        clearTimeout(timer);
        ws.off("message", onMessage);
        resolve(data);
      }
    };
    ws.on("message", onMessage);
    ws.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

function openWsWithWelcome(url, timeoutMs = 4000) {
  const ws = new WebSocket(url);
  const welcome = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("ws welcome timeout")), timeoutMs);
    const onMessage = (raw) => {
      const data = JSON.parse(String(raw));
      if (data?.type === "welcome") {
        clearTimeout(timer);
        ws.off("message", onMessage);
        resolve(data);
      }
    };
    ws.on("message", onMessage);
    ws.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
  return { ws, welcome };
}

async function main() {
  const server = serverStart();
  try {
    await waitReady();

    const created = await req("/api/rooms", {
      method: "POST",
      body: JSON.stringify({ packId: "classic" }),
    });
    const roomId = created.roomId;
    const redToken = created.token;

    const blue = await req(`/api/rooms/${roomId}/join`, {
      method: "POST",
      body: JSON.stringify({ mode: "player" }),
    });
    const blueToken = blue.token;

    const redConn = openWsWithWelcome(`ws://127.0.0.1:${port}/ws?room=${roomId}&token=${redToken}`);
    const blueConn = openWsWithWelcome(`ws://127.0.0.1:${port}/ws?room=${roomId}&token=${blueToken}`);
    const redWs = redConn.ws;
    const blueWs = blueConn.ws;

    await Promise.all([redConn.welcome, blueConn.welcome]);

    const blueUpdatePromise = wsWaitFor(blueWs, (d) => d.type === "room_update");
    const a1 = await req(
      `/api/rooms/${roomId}/action`,
      {
        method: "POST",
        body: JSON.stringify({
          role: "red",
          token: redToken,
          actionId: `roll-${Date.now()}`,
          actionType: "roll",
          baseVersion: 0,
        }),
      },
      redToken,
    );
    assert.equal(a1.ok, true);

    const blueUpdate = await blueUpdatePromise;
    assert.ok(typeof blueUpdate.version === "number");

    const chatPromise = wsWaitFor(blueWs, (d) => d.type === "chat_message");
    await req(
      `/api/rooms/${roomId}/chat`,
      {
        method: "POST",
        body: JSON.stringify({ token: redToken, text: "ping from red" }),
      },
      redToken,
    );
    const chatMsg = await chatPromise;
    assert.equal(chatMsg.message.text, "ping from red");

    const st = await req(`/api/rooms/${roomId}/state`, { method: "GET" }, redToken);
    const curRole = st.snapshot.game.current === 0 ? "red" : "blue";
    const curToken = curRole === "red" ? redToken : blueToken;

    const timeoutSkip = await req(
      `/api/rooms/${roomId}/action`,
      {
        method: "POST",
        body: JSON.stringify({
          role: curRole,
          token: curToken,
          actionId: `skip-${Date.now()}`,
          actionType: "timeout_skip",
          baseVersion: st.version,
        }),
      },
      curToken,
    );
    assert.equal(timeoutSkip.ok, true);
    assert.ok(String(timeoutSkip.summary || "").includes("超时"));

    redWs.close();
    blueWs.close();

    console.log("dual clients e2e ok");
  } finally {
    server.kill("SIGTERM");
    await sleep(120);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
