#!/usr/bin/env node
import process from 'node:process';

function arg(name, fallback = '') {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] || fallback;
}

function toNum(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

async function main() {
  const base = String(arg('base', process.env.FLIGHT_CHESS_BASE_URL || '')).replace(/\/$/, '');
  if (!base) {
    console.log('skip: missing --base or FLIGHT_CHESS_BASE_URL');
    return;
  }

  const maxErrorRate = toNum(arg('max-error-rate', process.env.MAX_ERROR_RATE || '0.03'), 0.03);
  const maxRateLimited = toNum(arg('max-rate-limited', process.env.MAX_RATE_LIMITED || '80'), 80);
  const maxClientErrors = toNum(arg('max-client-errors', process.env.MAX_CLIENT_ERRORS || '40'), 40);
  const maxWsDrop = toNum(arg('max-ws-drop', process.env.MAX_WS_DROP || '50'), 50);

  const [metricsRes, errorsRes] = await Promise.all([
    fetch(`${base}/api/metrics`),
    fetch(`${base}/api/errors`).catch(() => null),
  ]);

  if (!metricsRes.ok) {
    throw new Error(`metrics request failed: HTTP ${metricsRes.status}`);
  }

  const metrics = await metricsRes.json();
  const errors = errorsRes && errorsRes.ok ? await errorsRes.json().catch(() => ({})) : {};
  const requests = toNum(metrics.requests, 0);
  const errorsCount = toNum(metrics.errors, 0);
  const rateLimited = toNum(metrics.rateLimitedRequests, 0);
  const clientErrors = toNum(metrics.clientErrors, 0);
  const wsAccepted = toNum(metrics.wsConnectionsAccepted, 0);
  const wsActive = toNum(metrics.wsConnectionsActive, 0);
  const wsDrop = Math.max(0, wsAccepted - wsActive);
  const errorRate = requests > 0 ? errorsCount / requests : 0;

  const checks = [
    { key: 'errorRate', value: errorRate, max: maxErrorRate },
    { key: 'rateLimitedRequests', value: rateLimited, max: maxRateLimited },
    { key: 'clientErrors', value: clientErrors, max: maxClientErrors },
    { key: 'wsDrop', value: wsDrop, max: maxWsDrop },
  ];

  const failed = checks.filter((c) => c.value > c.max);

  const report = {
    base,
    at: new Date().toISOString(),
    thresholds: {
      maxErrorRate,
      maxRateLimited,
      maxClientErrors,
      maxWsDrop,
    },
    metrics: {
      requests,
      errors: errorsCount,
      errorRate,
      rateLimitedRequests: rateLimited,
      clientErrors,
      wsConnectionsAccepted: wsAccepted,
      wsConnectionsActive: wsActive,
      wsDrop,
    },
    recentErrorsCount: Array.isArray(errors.items) ? errors.items.length : 0,
    failedChecks: failed,
  };

  console.log(JSON.stringify(report, null, 2));

  if (failed.length) {
    process.exitCode = 2;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
