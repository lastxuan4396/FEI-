// Render terminates HTTPS before forwarding requests to this HTTP server.
export function requestOriginAllowed(req) {
  if (req.headers['sec-fetch-site'] === 'cross-site') return false;
  const origin = req.headers.origin;
  if (!origin) return true;
  const publicURL = process.env.PUBLIC_BASE_URL || process.env.RENDER_EXTERNAL_URL;
  const allowed = [`http://${req.headers.host}`];
  if (req.socket.encrypted || req.headers['x-forwarded-proto'] === 'https') allowed.push(`https://${req.headers.host}`);
  if (publicURL) { try { allowed.push(new URL(publicURL).origin); } catch { /* Invalid deployment configuration does not widen access. */ } }
  return allowed.includes(origin);
}
