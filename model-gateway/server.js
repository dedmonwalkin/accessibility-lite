import http from 'node:http';
import crypto from 'node:crypto';
import { gatewayConfig } from './config.js';
import { createBackend } from './backends/index.js';

// ---------------------------------------------------------------------------
// Model gateway: the one process in the stack that runs real inference.
// Implements the HTTP contract both accessibility-lite and
// accessibility-broadcast already speak (MODEL_HTTP_BASE_URL):
//
//   POST /v1/models/transcribe     { audio_base64, format, language, duration_ms }
//   POST /v1/models/perception     { timelineItem }
//   POST /v1/models/accessibility  { timelineItem, perception }
//   POST /v1/models/sign-script    { accessibility }
//   POST /v1/translate             { q, source, target }
//   GET  /health
//
// Only transcription runs a model. Perception/accessibility are structural
// transforms of caller-provided data, and scene stays empty unless a visual
// model is added — this gateway never fabricates content.
// ---------------------------------------------------------------------------

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a), 'utf8');
  const bufB = Buffer.from(String(b), 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function authenticate(req, cfg) {
  if (!cfg.apiKey) return true; // no key configured — internal-network deployment
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  return safeEqual(token, cfg.apiKey);
}

async function readJsonBody(req, maxBytes) {
  const chunks = [];
  let total = 0;
  let overflowed = false;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > maxBytes) overflowed = true;
    else if (!overflowed) chunks.push(chunk);
  }
  if (overflowed) {
    const err = new Error(`Request body exceeds ${maxBytes} bytes`);
    err.statusCode = 413;
    throw err;
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  return JSON.parse(raw);
}

function normalizeWords(text) {
  return String(text || '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);
}

function heuristicConfidence(timelineItem = {}) {
  const transcriptScore = Math.min(String(timelineItem.transcript || '').length / 120, 1);
  const sceneScore = Math.min(String(timelineItem.scene || '').length / 100, 1);
  return Number((0.55 + transcriptScore * 0.2 + sceneScore * 0.2).toFixed(2));
}

function asEventType(scene) {
  const normalized = String(scene || '').toLowerCase();
  if (normalized.includes('sprint') || normalized.includes('goal') || normalized.includes('shot')) return 'action';
  return 'commentary';
}

function perception({ timelineItem = {} }) {
  return {
    transcript: timelineItem.transcript || '',
    scene: timelineItem.scene || '',
    speaker: timelineItem.speaker || 'unknown',
    entities: timelineItem.entities || [],
    confidence: heuristicConfidence(timelineItem)
  };
}

function accessibility({ timelineItem = {}, perception: p = {} }) {
  return {
    segment_id: timelineItem.id,
    ts_start: timelineItem.ts_start,
    ts_end: timelineItem.ts_end,
    type: asEventType(p.scene),
    text: p.transcript || '',
    speaker: p.speaker || 'unknown',
    entities: p.entities || [],
    confidence: typeof p.confidence === 'number' ? p.confidence : heuristicConfidence(timelineItem),
    audio_description: p.scene || ''
  };
}

function signScript({ accessibility: acc = {} }) {
  return {
    id: acc.segment_id,
    start: acc.ts_start,
    end: acc.ts_end,
    gloss_tokens: normalizeWords(acc.text).slice(0, 12),
    facial_cues: acc.type === 'action' ? ['INTENSE-FOCUS'] : ['NEUTRAL'],
    confidence: typeof acc.confidence === 'number' ? acc.confidence : 0.5,
    fallback_text: acc.text || ''
  };
}

async function translate(body, cfg) {
  const text = body.q || body.text || '';
  const source = body.source || 'auto';
  const target = body.target || 'en';

  if (!cfg.libretranslateUrl) {
    const err = new Error('No translation backend configured (set LIBRETRANSLATE_URL)');
    err.statusCode = 501;
    throw err;
  }

  const res = await fetch(`${cfg.libretranslateUrl.replace(/\/$/, '')}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: text, source, target, format: 'text' })
  });
  if (!res.ok) throw new Error(`LibreTranslate failed: HTTP ${res.status}`);
  return res.json();
}

export function createGatewayServer(overrides = {}) {
  const cfg = gatewayConfig(overrides);
  const backend = createBackend(cfg);

  return http.createServer(async (req, res) => {
    try {
      if (req.method === 'GET' && req.url === '/health') {
        return sendJson(res, 200, { ok: true, service: 'model-gateway', backend: backend.name });
      }

      if (!authenticate(req, cfg)) {
        return sendJson(res, 401, { error: 'Unauthorized' });
      }

      if (req.method !== 'POST') {
        return sendJson(res, 405, { error: 'Method not allowed' });
      }

      const body = await readJsonBody(req, cfg.maxBodyBytes);

      switch (req.url) {
        case '/v1/models/transcribe':
          return sendJson(res, 200, await backend.transcribe(body));
        case '/v1/models/perception':
          return sendJson(res, 200, perception(body));
        case '/v1/models/accessibility':
          return sendJson(res, 200, accessibility(body));
        case '/v1/models/sign-script':
          return sendJson(res, 200, signScript(body));
        case '/v1/translate':
          return sendJson(res, 200, await translate(body, cfg));
        default:
          return sendJson(res, 404, { error: 'Not found' });
      }
    } catch (err) {
      const status = err.statusCode || (err instanceof SyntaxError ? 400 : 500);
      console.error(JSON.stringify({
        ts: new Date().toISOString(),
        action: 'gateway.error',
        url: req.url,
        status,
        error: err.message
      }));
      return sendJson(res, status, { error: err.message });
    }
  });
}

export function startGateway(overrides = {}) {
  const cfg = gatewayConfig(overrides);
  const server = createGatewayServer(overrides);
  return new Promise((resolve) => {
    server.listen(cfg.port, () => {
      console.log(`Model gateway (${cfg.backend}) listening on http://localhost:${cfg.port}`);
      resolve(server);
    });
  });
}

const entry = process.argv[1] || '';
const invokedDirectly = import.meta.url === `file://${entry}` || entry.endsWith('model-gateway/server.js');
if (invokedDirectly) {
  startGateway().catch((err) => {
    console.error('Failed to start model gateway:', err.message);
    process.exit(1);
  });
}
