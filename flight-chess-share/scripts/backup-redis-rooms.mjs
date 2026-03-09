#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

function arg(name, fallback = "") {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] || fallback;
}

function nowStamp() {
  const d = new Date();
  const pad = (v) => String(v).padStart(2, "0");
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}-${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`;
}

async function main() {
  const url = arg("url", process.env.REDIS_URL || "").trim();
  const prefix = arg("prefix", process.env.REDIS_PREFIX || "flightchess").trim() || "flightchess";
  const outPath = arg("out", `backups/rooms-${nowStamp()}.json`);

  if (!url) {
    console.error("missing redis url: pass --url <redis://...> or set REDIS_URL");
    process.exit(1);
  }

  const { createClient } = await import("redis");

  const client = createClient({
    url,
    socket: { connectTimeout: 5000, reconnectStrategy: () => false },
  });

  client.on("error", (err) => {
    console.error("[redis]", err.message);
  });

  await Promise.race([
    client.connect(),
    new Promise((_, reject) => setTimeout(() => reject(new Error("redis connect timeout")), 7000)),
  ]);

  try {
    const keys = [];
    for await (const key of client.scanIterator({ MATCH: `${prefix}:room:*`, COUNT: 200 })) {
      keys.push(String(key));
    }

    keys.sort();

    const rawValues = keys.length > 0 ? await client.mGet(keys) : [];
    const rooms = [];

    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      const raw = rawValues[i];
      if (!raw) continue;
      let parsed = null;
      let parseError = null;
      try {
        parsed = JSON.parse(raw);
      } catch (err) {
        parseError = String(err.message || err);
      }

      const roomId = key.replace(`${prefix}:room:`, "");
      rooms.push({
        key,
        roomId,
        validJson: !!parsed,
        parseError,
        payload: parsed,
      });
    }

    const output = {
      exportedAt: new Date().toISOString(),
      redisPrefix: prefix,
      totalKeys: keys.length,
      validRooms: rooms.filter((r) => r.validJson).length,
      rooms,
    };

    const absPath = path.isAbsolute(outPath) ? outPath : path.join(process.cwd(), outPath);
    fs.mkdirSync(path.dirname(absPath), { recursive: true });
    fs.writeFileSync(absPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");

    console.log(JSON.stringify({ ok: true, out: absPath, totalKeys: output.totalKeys, validRooms: output.validRooms }, null, 2));
  } finally {
    await client.quit().catch(() => {});
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
