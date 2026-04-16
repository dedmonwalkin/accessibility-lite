import { URL } from 'node:url';
import { runtimeConfig } from '../config/runtime.js';

export function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

export function sendHtml(res, statusCode, html) {
  const body = Buffer.from(html, 'utf8');
  res.writeHead(statusCode, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': body.length
  });
  res.end(body);
}

export class PayloadTooLargeError extends Error {
  constructor(limit) {
    super(`Request body exceeds ${limit} bytes`);
    this.statusCode = 413;
    this.limit = limit;
  }
}

export async function parseJsonBody(req, { maxBytes } = {}) {
  const limit = maxBytes ?? runtimeConfig().maxJsonBodyBytes;
  const chunks = [];
  let total = 0;
  let overflowed = false;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > limit) {
      overflowed = true;
      // Drain the rest silently rather than destroy the socket — destroying
      // here would prevent the handler from sending a 413 response cleanly.
    } else if (!overflowed) {
      chunks.push(chunk);
    }
  }
  if (overflowed) throw new PayloadTooLargeError(limit);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('Invalid JSON body');
  }
}

export function parseUrl(req) {
  return new URL(req.url, `http://${req.headers.host || 'localhost'}`);
}

export function notFound(res) {
  sendJson(res, 404, { error: 'Not found' });
}

export function methodNotAllowed(res) {
  sendJson(res, 405, { error: 'Method not allowed' });
}
