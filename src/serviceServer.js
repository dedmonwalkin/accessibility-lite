import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { buildHomePage } from './ui/pages/home.js';
import { page } from './ui/layout.js';

// Deliberately independent of server.js: no jobs, providers, database or timers.
const ASSETS = new Map([
  ['fonts/OFL.txt', 'text/plain; charset=utf-8'],
  ...['400', '700'].flatMap(weight => ['latin', 'latin-ext'].map(subset =>
    [`fonts/atkinson-${weight}-${subset}.woff2`, 'font/woff2']))
]);

function securityHeaders(res, html = '') {
  const hashes = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
    .map(([, script]) => `'sha256-${createHash('sha256').update(script).digest('base64')}'`);
  res.setHeader('Content-Security-Policy', [
    "default-src 'none'", `script-src ${hashes.join(' ') || "'none'"}`,
    "style-src 'unsafe-inline'", "font-src 'self'", "img-src 'self' data:",
    "connect-src 'none'", "form-action 'none'", "base-uri 'none'",
    "frame-ancestors 'none'", "object-src 'none'"
  ].join('; '));
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
}

function respond(req, res, status, type, body, cache = 'no-cache') {
  res.writeHead(status, { 'Content-Type': type, 'Content-Length': Buffer.byteLength(body), 'Cache-Control': cache });
  res.end(req.method === 'HEAD' ? undefined : body);
}

export function createServiceServer({ contactEmail = process.env.CONTACT_EMAIL } = {}) {
  const home = buildHomePage({ contactEmail, mediaPreview: false });
  const missing = page({
    title: 'Page not found', mediaPreview: false, narrow: true,
    description: 'Whakauru accessibility consulting.',
    body: '<h1>Page not found</h1><p>This service website does not provide media uploads or player links.</p><p><a href="/">Return to Whakauru</a></p>'
  });
  const server = http.createServer(async (req, res) => {
    try {
      const pathname = new URL(req.url, 'http://localhost').pathname;
      const asset = pathname.startsWith('/static/') ? pathname.slice('/static/'.length) : '';
      const known = pathname === '/' || pathname === '/health' || ASSETS.has(asset);
      securityHeaders(res, pathname === '/' ? home : missing);
      if (!known) return respond(req, res, 404, 'text/html; charset=utf-8', missing, 'no-store');
      if (!['GET', 'HEAD'].includes(req.method)) {
        res.setHeader('Allow', 'GET, HEAD');
        return respond(req, res, 405, 'text/plain; charset=utf-8', 'Method not allowed', 'no-store');
      }
      if (pathname === '/') return respond(req, res, 200, 'text/html; charset=utf-8', home);
      if (pathname === '/health') return respond(req, res, 200, 'application/json', '{"status":"ok","mode":"service-only"}', 'no-store');
      const body = await readFile(new URL(`../public/${asset}`, import.meta.url));
      return respond(req, res, 200, ASSETS.get(asset), body, 'public, max-age=86400');
    } catch {
      securityHeaders(res);
      return respond(req, res, 500, 'text/plain; charset=utf-8', 'Unable to serve this request', 'no-store');
    }
  });
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = createServiceServer();
  const port = Number(process.env.PORT || 3000);
  server.on('error', err => { console.error('Service website could not start:', err.message); process.exitCode = 1; });
  server.listen(port, () => console.log(`Whakauru service website: http://localhost:${server.address().port}`));
  const shutdown = () => server.close();
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
