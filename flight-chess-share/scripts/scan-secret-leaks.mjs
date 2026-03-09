#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const patterns = [
  /github_pat_[A-Za-z0-9_]{20,}/g,
  /ghp_[A-Za-z0-9]{20,}/g,
  /rnd_[A-Za-z0-9]{16,}/g,
  /sk-[A-Za-z0-9]{16,}/g,
];

function listFiles() {
  const out = execSync('git ls-files', { encoding: 'utf8' });
  return out.split('\n').map((v) => v.trim()).filter(Boolean);
}

function isLikelyText(file) {
  const ext = path.extname(file).toLowerCase();
  if (!ext) return true;
  if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.pdf', '.zip', '.mp4', '.mp3'].includes(ext)) return false;
  return true;
}

function scanFile(file) {
  if (!isLikelyText(file)) return [];
  const raw = fs.readFileSync(file, 'utf8');
  const lines = raw.split(/\r?\n/);
  const hits = [];
  for (let i = 0; i < lines.length; i += 1) {
    for (const pattern of patterns) {
      if (pattern.test(lines[i])) {
        hits.push({ file, line: i + 1, text: lines[i].trim().slice(0, 200) });
      }
      pattern.lastIndex = 0;
    }
  }
  return hits;
}

function main() {
  const files = listFiles();
  const hits = files.flatMap(scanFile);
  if (!hits.length) {
    console.log('ok: no token-like strings found in tracked files');
    return;
  }

  console.error('potential token leaks found:');
  for (const hit of hits) {
    console.error(`- ${hit.file}:${hit.line} ${hit.text}`);
  }
  process.exitCode = 2;
}

main();
