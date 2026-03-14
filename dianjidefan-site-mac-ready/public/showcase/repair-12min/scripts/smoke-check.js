#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const htmlPath = path.join(root, 'index.html');

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

if (!fs.existsSync(htmlPath)) fail('index.html not found');

const html = fs.readFileSync(htmlPath, 'utf8');

const requiredIds = [
  'conflictType',
  'conflictIntensity',
  'collabRoom',
  'collabStatus',
  'joinRoomBtn',
  'createRoomBtn',
  'copyRoomLinkBtn',
  'privacyModeToggle',
  'autoClearDraftToggle',
  'autoClearHistoryToggle',
  'archivePassphrase',
  'alertWebhook',
  'importBtn',
  'importFileInput',
  'resultRewriteList',
  'copyShareBtn',
  'downloadImageBtn',
  'downloadPdfBtn',
  'downloadIcsBtn',
  'notifyBtn',
  'safetyPanel',
  'analyticsBox',
  'monitorBox'
];

requiredIds.forEach((id) => {
  if (!new RegExp(`id=["']${id}["']`).test(html)) {
    fail(`missing required element id: ${id}`);
  }
});

const requiredSnippets = [
  'function buildRewriteSuggestions',
  'function buildRiskRewriteSuggestions',
  'function joinCollabRoom',
  'function downloadShareImage',
  'function downloadSharePdf',
  'function downloadReminderIcs',
  'function importHistoryFromFile',
  'async function exportHistory',
  "window.addEventListener('beforeunload'",
  'function computeAnalytics',
  'function encryptArchivePayload',
  'function decryptArchivePayload',
  "window.addEventListener('error'"
];

requiredSnippets.forEach((snippet) => {
  if (!html.includes(snippet)) fail(`missing script snippet: ${snippet}`);
});

const scriptMatch = html.match(/<script>([\s\S]*)<\/script>/);
if (!scriptMatch) fail('inline script block not found');

try {
  // Compile only; do not execute DOM code.
  // eslint-disable-next-line no-new-func
  new Function(scriptMatch[1]);
} catch (err) {
  fail(`script parse error: ${err.message}`);
}

console.log('PASS: smoke checks completed');
