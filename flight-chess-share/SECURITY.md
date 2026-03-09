# Security Guide

## Immediate Secret Hygiene

If any access token was ever pasted in chat, terminal output, or committed by mistake:

1. Revoke the token immediately in the provider dashboard.
2. Create a new token with minimum scope and short expiry.
3. Replace token values in deployment secrets only (never hardcode).
4. Rotate dependent secrets (`LOG_SIGNING_SECRET`, Redis password) if shared in the same context.

## Runtime Hardening

- Always set `LOG_SIGNING_SECRET` explicitly in production.
- Prefer Redis for room persistence (`REDIS_URL`) and keep Redis private.
- Restrict CORS via `CORS_ALLOW_ORIGINS`; do not set `CORS_ALLOW_ALL=1` unless debugging.

## Repo Guardrails

- Run `npm run security:scan` before push.
- CI includes tracked-file token scanning.
- `.env*` is ignored by git; keep local secrets there only.
