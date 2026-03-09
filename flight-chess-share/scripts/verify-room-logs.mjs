#!/usr/bin/env node
import process from "node:process";

function arg(name, fallback = "") {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] || fallback;
}

const base = arg("base", "http://127.0.0.1:10000").replace(/\/$/, "");
const room = arg("room", "").toUpperCase();
const token = arg("token", "");
const limit = Number(arg("limit", "240"));

if (!room) {
  console.error("usage: node scripts/verify-room-logs.mjs --base <url> --room <ROOM_ID> [--token <token>] [--limit 240]");
  process.exit(1);
}

const qs = new URLSearchParams();
qs.set("limit", String(Math.max(1, Math.min(240, limit))));
if (token) qs.set("token", token);
const url = `${base}/api/rooms/${room}/logs?${qs.toString()}`;

const res = await fetch(url, {
  headers: token ? { "x-room-token": token } : {},
});
const body = await res.json().catch(() => ({}));
if (!res.ok) {
  console.error("request failed:", res.status, body);
  process.exit(1);
}

const logs = Array.isArray(body.logs) ? body.logs : [];
let chainOk = true;
for (let i = 1; i < logs.length; i += 1) {
  if (logs[i].prevDigest !== logs[i - 1].digest) {
    chainOk = false;
    break;
  }
}

console.log(JSON.stringify({
  room,
  total: body.total,
  fetched: logs.length,
  endpointIntegrity: !!body.integrity,
  chainLinkIntegrity: chainOk,
  latestDigest: logs[logs.length - 1]?.digest || null,
}, null, 2));

if (!body.integrity || !chainOk) {
  process.exit(2);
}
