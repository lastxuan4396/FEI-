import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import process from "node:process";
import { WebSocket } from "ws";

const cwd = "/Users/xiaoxuan/Documents/Playground/flight-chess-share";
const port = 38000 + Math.floor(Math.random() * 1000);
const base = `http://127.0.0.1:${port}`;

function serverStart() {
  const logs = { out: "", err: "", exited: null };
  const child = spawn("node", ["server.js"], {
    cwd,
    env: {
      ...process.env,
      PORT: String(port),
      APP_VERSION: "2.3.0-test",
    },
    stdio: "ignore",
  });
  child.on("exit", (code, signal) => {
    logs.exited = { code, signal };
  });

  return { child, logs };
}

async function waitUntilReady(serverCtx, timeoutMs = 180000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (serverCtx.logs.exited) {
      throw new Error(
        `server exited early: ${JSON.stringify(serverCtx.logs.exited)}\\nstdout:\\n${serverCtx.logs.out}\\nstderr:\\n${serverCtx.logs.err}`,
      );
    }
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 250);
      const res = await fetch(`${base}/api/healthz`, { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) return;
    } catch (_err) {
      // retry
    }
    await sleep(120);
  }
  throw new Error(
    `server start timeout after ${Date.now() - start}ms\\nstdout:\\n${serverCtx.logs.out}\\nstderr:\\n${serverCtx.logs.err}`,
  );
}

async function req(path, init) {
  const res = await fetch(`${base}${path}`, {
    headers: { "content-type": "application/json" },
    ...init,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.payload = body;
    throw err;
  }
  return body;
}

function withToken(path, token) {
  if (!token) return path;
  const hasQuery = path.includes("?");
  return `${path}${hasQuery ? "&" : "?"}token=${encodeURIComponent(token)}`;
}

async function expectStatus(path, init, status) {
  const res = await fetch(`${base}${path}`, {
    headers: { "content-type": "application/json" },
    ...init,
  });
  const body = await res.json().catch(() => ({}));
  assert.equal(res.status, status);
  return body;
}

async function main() {
  const server = serverStart();
  try {
    await waitUntilReady(server);

    const packs = await req("/api/content-packs");
    assert.ok(Array.isArray(packs.packs));
    assert.ok(packs.packs.find((p) => p.id === "classic"));
    assert.ok(packs.packs.find((p) => p.id === "lite"));

    const created = await req("/api/rooms", {
      method: "POST",
      body: JSON.stringify({ packId: "lite", password: "1234" }),
    });

    assert.equal(created.role, "red");
    assert.equal(created.packId, "lite");

    const joinBlue = await req(`/api/rooms/${created.roomId}/join`, {
      method: "POST",
      body: JSON.stringify({ mode: "player", password: "1234" }),
    });
    assert.equal(joinBlue.role, "blue");

    const wsWelcome = await new Promise((resolve, reject) => {
      const ws = new WebSocket(`ws://127.0.0.1:${port}/ws?room=${created.roomId}&token=${created.token}`);
      const timer = setTimeout(() => {
        ws.close();
        reject(new Error("ws timeout"));
      }, 2000);

      ws.on("message", (raw) => {
        const data = JSON.parse(String(raw));
        if (data.type === "welcome") {
          clearTimeout(timer);
          ws.close();
          resolve(data);
        }
      });
      ws.on("error", (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
    assert.equal(wsWelcome.roomId, created.roomId);

    const r1 = await req(`/api/rooms/${created.roomId}/action`, {
      method: "POST",
      body: JSON.stringify({
        role: "red",
        token: created.token,
        actionId: `a-${Date.now()}`,
        actionType: "roll",
        baseVersion: 0,
      }),
    });
    assert.equal(r1.ok, true);
    assert.equal(r1.version, 1);

    await expectStatus(
      `/api/rooms/${created.roomId}/action`,
      {
        method: "POST",
        body: JSON.stringify({
          role: "blue",
          token: joinBlue.token,
          actionId: `b-${Date.now()}`,
          actionType: "roll",
          baseVersion: 0,
        }),
      },
      409,
    );

    const logs = await req(withToken(`/api/rooms/${created.roomId}/logs?limit=10`, created.token));
    assert.equal(logs.integrity, true);
    assert.ok(Array.isArray(logs.logs) && logs.logs.length >= 1);

    const chatResp = await req(`/api/rooms/${created.roomId}/chat`, {
      method: "POST",
      body: JSON.stringify({ token: created.token, text: "hello" }),
    });
    assert.equal(chatResp.ok, true);
    const chatList = await req(withToken(`/api/rooms/${created.roomId}/chat?limit=10`, created.token));
    assert.ok(Array.isArray(chatList.messages) && chatList.messages.length >= 1);

    const custom = await req(`/api/rooms/${created.roomId}/custom-pack`, {
      method: "POST",
      body: JSON.stringify({
        token: created.token,
        config: {
          version: "test-custom",
          title: "自定义测试",
          subtitle: "联机双人版",
          boardRules: ["1", "2", "3", "4"],
          wheelLabels: ["1", "2", "3", "4", "5", "6"],
          cells: Array.from({ length: 44 }, (_, i) => `格子${i + 1}`),
        },
      }),
    });
    assert.equal(custom.packId, "custom");

    const switched = await req(`/api/rooms/${created.roomId}/content-pack`, {
      method: "POST",
      body: JSON.stringify({ token: created.token, packId: "classic" }),
    });
    assert.equal(switched.packId, "classic");

    const health = await req("/api/healthz");
    assert.equal(health.ok, true);

    const metrics = await req("/api/metrics");
    assert.ok(typeof metrics.requests === "number");
    assert.ok(typeof metrics.chatMessages === "number");

    console.log("smoke ok");
  } finally {
    server.child.kill("SIGTERM");
    await sleep(120);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
