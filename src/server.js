import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { runtimeConfig } from './config/runtime.js';
import { sendJson, sendHtml, parseJsonBody, parseUrl, PayloadTooLargeError } from './utils/http.js';
import { formatVtt, formatTtml } from './utils/vtt.js';
import { jobService, isValidJobId, getUploadsDir } from './services/jobService.js';
import { jobEmitter } from './services/pipelineService.js';
import { uiService } from './services/uiService.js';
import { persistenceService } from './services/persistence/persistenceService.js';
import { cleanupService } from './services/cleanupService.js';
import { sampleService } from './services/sampleService.js';
import { ingestService, IngestError } from './services/ingestService.js';
import {
  SUPPORTED_OUTPUT_LANGUAGES,
  SUPPORTED_SIGN_LANGUAGES,
  SUPPORTED_CAPTION_STYLES,
  SUPPORTED_AUDIO_DESCRIPTION_STYLES,
  SUPPORTED_SIGN_PRESENTATION_MODES,
  SUPPORTED_UI_MODES,
  SIGN_OVERLAY_THEMES
} from './config/accessibilityCatalog.js';

const config = runtimeConfig();
const UPLOADS_DIR = getUploadsDir();

const COOKIE_POLICY_HTML = buildStaticMarkdownPage('Cookie policy', 'COOKIES.md');
const PRIVACY_POLICY_HTML = buildStaticMarkdownPage('Privacy notice', 'PRIVACY.md');

function buildStaticMarkdownPage(title, filename) {
  try {
    const raw = fs.readFileSync(path.resolve(filename), 'utf8');
    return uiService.buildDocPage(title, raw);
  } catch {
    return uiService.buildErrorPage(404, title, `${filename} not found in this deployment.`);
  }
}

// ── Auth ────────────────────────────────────────────────────────

export function isPublicPath(method, pathname) {
  if (method !== 'GET') return false;
  if (pathname === '/') return true;
  if (pathname === '/health') return true;
  if (pathname === '/cookies') return true;
  if (pathname === '/privacy') return true;
  if (pathname === '/v1/catalog') return true;
  if (pathname.startsWith('/player/')) return true;
  if (/^\/v1\/jobs\/[^/]+\/media$/.test(pathname)) return true;
  return false;
}

function safeEqualString(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function authenticate(req) {
  if (config.authDisabled) return true;
  if (config.apiKeys.length === 0) return false; // fail closed when unconfigured
  const auth = req.headers['authorization'] || '';
  if (!auth.startsWith('Bearer ')) return false;
  const token = auth.slice(7).trim();
  if (!token) return false;
  // Compare against every configured key in constant time; the any-match
  // result is the OR of per-key constant-time compares, so total runtime
  // does not leak which key (if any) was a prefix match.
  let match = false;
  for (const key of config.apiKeys) {
    if (safeEqualString(token, key)) match = true;
  }
  return match;
}

// ── Client IP resolution ────────────────────────────────────────

function clientIp(req) {
  if (config.trustedProxy) {
    const xff = req.headers['x-forwarded-for'];
    if (typeof xff === 'string' && xff.length > 0) {
      const first = xff.split(',')[0].trim();
      if (first) return first;
    }
  }
  return req.socket.remoteAddress || 'unknown';
}

// ── Rate Limiting ───────────────────────────────────────────────

const rateLimitWindows = new Map();
const MAX_RATE_LIMIT_ENTRIES = 10000;
let lastRateLimitCleanup = Date.now();

function cleanupRateLimitWindows() {
  const now = Date.now();
  if (now - lastRateLimitCleanup < 60_000) return;
  lastRateLimitCleanup = now;
  const windowMs = 60 * 1000;
  for (const [ip, hits] of rateLimitWindows) {
    const valid = hits.filter((t) => now - t < windowMs);
    if (valid.length === 0) {
      rateLimitWindows.delete(ip);
    } else {
      rateLimitWindows.set(ip, valid);
    }
  }
  if (rateLimitWindows.size > MAX_RATE_LIMIT_ENTRIES) {
    const toRemove = rateLimitWindows.size - MAX_RATE_LIMIT_ENTRIES;
    const keys = rateLimitWindows.keys();
    for (let i = 0; i < toRemove; i++) {
      rateLimitWindows.delete(keys.next().value);
    }
  }
}

export function checkRateLimit(req) {
  if (config.rateLimitRpm <= 0) return null;
  cleanupRateLimitWindows();
  const ip = clientIp(req);
  const now = Date.now();
  const windowMs = 60 * 1000;
  const hits = (rateLimitWindows.get(ip) || []).filter((t) => now - t < windowMs);
  hits.push(now);
  rateLimitWindows.set(ip, hits);
  if (hits.length > config.rateLimitRpm) {
    const retryAfter = Math.ceil((hits[0] + windowMs - now) / 1000);
    return retryAfter;
  }
  return null;
}

// ── Security headers ────────────────────────────────────────────

function setSecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
  // CSP: inline scripts/styles are used by uiService; restrict to self otherwise.
  res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data:; media-src 'self' blob:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'");
}

// ── Routing helpers ─────────────────────────────────────────────

function extractParams(pathname, pattern) {
  const patternParts = pattern.split('/');
  const pathParts = pathname.split('/');
  if (patternParts.length !== pathParts.length) return null;
  const params = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      try { params[patternParts[i].slice(1)] = decodeURIComponent(pathParts[i]); }
      catch { return null; }
    } else if (patternParts[i] !== pathParts[i]) {
      return null;
    }
  }
  return params;
}

function requireValidJobId(id, res) {
  if (!isValidJobId(id)) {
    sendJson(res, 404, { error: 'Job not found' });
    return false;
  }
  return true;
}

function resolveJobFilePath(filePath) {
  const resolved = path.resolve(filePath);
  const rootWithSep = UPLOADS_DIR + path.sep;
  if (resolved !== UPLOADS_DIR && !resolved.startsWith(rootWithSep)) return null;
  return resolved;
}

function simplifyText(text, maxWords = 12) {
  const cleaned = String(text || '').replace(/\[[A-Za-z-]{2,10}\]\s*/g, '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  const firstSentence = cleaned.split(/[.!?]/).map((s) => s.trim()).find(Boolean) || cleaned;
  const words = firstSentence.split(/\s+/);
  if (words.length <= maxWords) return firstSentence;
  return `${words.slice(0, maxWords).join(' ')}...`;
}

function personalizeCaptions(captions, style = 'standard') {
  if (style === 'verbatim' || style === 'standard') return captions.map((c) => ({ ...c }));
  return captions.map((c) => ({ ...c, text: simplifyText(c.text, 10) }));
}

function personalizeAudioDesc(segments, style = 'standard') {
  if (style === 'detailed') return segments.map((s) => ({ ...s, text: `${s.text} Context emphasis enabled.` }));
  if (style === 'concise') return segments.map((s) => ({ ...s, text: `Audio description: ${simplifyText(s.text, 8)}` }));
  return segments.map((s) => ({ ...s }));
}

const MIME_TYPES = {
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4'
};

async function handleRequest(req, res) {
  const url = parseUrl(req);
  const pathname = url.pathname;
  const method = req.method;

  setSecurityHeaders(res);

  try {
    // Rate limiting
    const retryAfter = checkRateLimit(req);
    if (retryAfter !== null) {
      res.setHeader('Retry-After', String(retryAfter));
      return sendJson(res, 429, { error: 'Rate limit exceeded', retry_after_seconds: retryAfter });
    }

    // Auth
    if (!isPublicPath(method, pathname) && !authenticate(req)) {
      return sendJson(res, 401, { error: 'Missing or invalid API key' });
    }

    // Health
    if (pathname === '/health' && method === 'GET') {
      let db = 'disabled';
      try { await persistenceService.ping(); db = 'connected'; } catch { db = 'unavailable'; }
      return sendJson(res, 200, { status: 'ok', persistence: db });
    }

    if (pathname === '/cookies' && method === 'GET') {
      return sendHtml(res, 200, COOKIE_POLICY_HTML);
    }
    if (pathname === '/privacy' && method === 'GET') {
      return sendHtml(res, 200, PRIVACY_POLICY_HTML);
    }

    // Upload page
    if (pathname === '/' && method === 'GET') {
      return sendHtml(res, 200, uiService.buildUploadPage());
    }

    // Catalog
    if (pathname === '/v1/catalog' && method === 'GET') {
      return sendJson(res, 200, {
        output_languages: SUPPORTED_OUTPUT_LANGUAGES,
        sign_languages: SUPPORTED_SIGN_LANGUAGES,
        caption_styles: SUPPORTED_CAPTION_STYLES,
        audio_description_styles: SUPPORTED_AUDIO_DESCRIPTION_STYLES,
        sign_presentation_modes: SUPPORTED_SIGN_PRESENTATION_MODES,
        ui_modes: SUPPORTED_UI_MODES,
        sign_overlay_themes: SIGN_OVERLAY_THEMES
      });
    }

    // Create sample job
    if (pathname === '/v1/jobs/sample' && method === 'POST') {
      const job = await sampleService.createSampleJob();
      return sendJson(res, 201, job);
    }

    // Create job (multipart upload)
    if (pathname === '/v1/jobs' && method === 'POST') {
      const job = await jobService.createJob(req);
      return sendJson(res, 201, job);
    }

    // Create job from URL (direct media link, or yt-dlp platform URL).
    // Returns 202 with status "downloading"; poll GET /v1/jobs/:id.
    if (pathname === '/v1/jobs/from-url' && method === 'POST') {
      const body = await parseJsonBody(req);
      try {
        const job = await ingestService.createUrlJob(body.url);
        return sendJson(res, 202, job);
      } catch (err) {
        if (err instanceof IngestError) return sendJson(res, err.statusCode, { error: err.message });
        throw err;
      }
    }

    // Job status
    let params = extractParams(pathname, '/v1/jobs/:id');
    if (params && method === 'GET') {
      if (!requireValidJobId(params.id, res)) return;
      const job = jobService.getJob(params.id);
      if (!job) return sendJson(res, 404, { error: 'Job not found' });
      return sendJson(res, 200, job);
    }

    // Options page (HTML)
    params = extractParams(pathname, '/jobs/:id/options');
    if (params && method === 'GET') {
      if (!isValidJobId(params.id)) return sendHtml(res, 404, uiService.buildErrorPage(404, 'Job not found', 'The job you requested does not exist or has expired.'));
      const job = jobService.getJob(params.id);
      if (!job) return sendHtml(res, 404, uiService.buildErrorPage(404, 'Job not found', 'The job you requested does not exist or has expired.'));
      return sendHtml(res, 200, uiService.buildOptionsPage(job));
    }

    // Snapshot trigger (admin-scoped — rely on API key)
    if (pathname === '/v1/persistence/snapshot' && method === 'POST') {
      const body = await parseJsonBody(req);
      return sendJson(res, 200, await persistenceService.snapshot(body.reason || 'manual_api'));
    }

    // Start processing
    params = extractParams(pathname, '/v1/jobs/:id/process');
    if (params && method === 'POST') {
      if (!requireValidJobId(params.id, res)) return;
      const body = await parseJsonBody(req);
      const job = jobService.getJob(params.id);
      if (!job) return sendJson(res, 404, { error: 'Job not found' });
      jobService.updatePreferences(params.id, body);
      await jobService.processJob(params.id);
      return sendJson(res, 202, { status: 'processing', job_id: params.id });
    }

    // SSE progress
    params = extractParams(pathname, '/v1/jobs/:id/progress');
    if (params && method === 'GET') {
      if (!requireValidJobId(params.id, res)) return;
      const job = jobService.getJob(params.id);
      if (!job) return sendJson(res, 404, { error: 'Job not found' });

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no'
      });

      // Replay current progress so late attachers don't hang waiting for a
      // fresh event after a fast completion.
      res.write(`data: ${JSON.stringify({ type: 'progress', job_id: params.id, percent: job.progress, step: job.status })}\n\n`);

      if (job.status === 'complete') {
        res.write(`data: ${JSON.stringify({ type: 'complete', job_id: params.id })}\n\n`);
        return res.end();
      }
      if (job.status === 'error') {
        res.write(`data: ${JSON.stringify({ type: 'error', job_id: params.id, message: job.error })}\n\n`);
        return res.end();
      }

      const heartbeat = setInterval(() => {
        try { res.write(': keepalive\n\n'); }
        catch { /* noop */ }
      }, 15_000);

      const listener = (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
        if (data.type === 'complete' || data.type === 'error') {
          cleanup();
        }
      };
      const cleanup = () => {
        clearInterval(heartbeat);
        jobEmitter.removeListener(`job:${params.id}`, listener);
        try { res.end(); } catch { /* noop */ }
      };
      jobEmitter.on(`job:${params.id}`, listener);
      req.on('close', cleanup);
      return;
    }

    // Results page (HTML)
    params = extractParams(pathname, '/jobs/:id/results');
    if (params && method === 'GET') {
      if (!isValidJobId(params.id)) return sendHtml(res, 404, uiService.buildErrorPage(404, 'Job not found', 'The job you requested does not exist or has expired.'));
      const job = jobService.getJob(params.id);
      if (!job) return sendHtml(res, 404, uiService.buildErrorPage(404, 'Job not found', 'The job you requested does not exist or has expired.'));
      if (job.status !== 'complete') {
        return sendHtml(res, 200, uiService.buildErrorPage(202, 'Processing...', `Progress: ${job.progress}%. This page will refresh automatically.`, { autoRefresh: 3 }));
      }
      const outputs = jobService.getOutputs(params.id);
      return sendHtml(res, 200, uiService.buildResultsPage(job, outputs));
    }

    // Player page
    params = extractParams(pathname, '/player/:id');
    if (params && method === 'GET') {
      if (!isValidJobId(params.id)) return sendHtml(res, 404, uiService.buildErrorPage(404, 'Job not found', 'The job you requested does not exist or has expired.'));
      const job = jobService.getJob(params.id);
      if (!job) return sendHtml(res, 404, uiService.buildErrorPage(404, 'Job not found', 'The job you requested does not exist or has expired.'));
      if (job.status !== 'complete') return sendHtml(res, 200, uiService.buildErrorPage(202, 'Processing not complete', 'Your media is still being processed. Please check back shortly.', { autoRefresh: 5 }));
      const outputs = jobService.getOutputs(params.id);
      return sendHtml(res, 200, uiService.buildPlayerPage(job, outputs));
    }

    // Download: captions VTT
    params = extractParams(pathname, '/v1/jobs/:id/captions.vtt');
    if (params && method === 'GET') {
      if (!requireValidJobId(params.id, res)) return;
      const job = jobService.getJob(params.id);
      if (!job) return sendJson(res, 404, { error: 'Job not found' });
      const outputs = jobService.getOutputs(params.id);
      if (!outputs) return sendJson(res, 404, { error: 'No outputs yet' });

      const language = url.searchParams.get('language') || job.preferences.output_languages[0] || 'en-US';
      const captions = outputs.captionTranslations[language] || outputs.captions;
      const styled = personalizeCaptions(captions, job.preferences.caption_style);
      const vtt = formatVtt(styled);

      res.writeHead(200, {
        'Content-Type': 'text/vtt; charset=utf-8',
        'Content-Disposition': `attachment; filename="captions-${language}.vtt"`
      });
      return res.end(vtt);
    }

    // Download: captions TTML
    params = extractParams(pathname, '/v1/jobs/:id/captions.ttml');
    if (params && method === 'GET') {
      if (!requireValidJobId(params.id, res)) return;
      const job = jobService.getJob(params.id);
      if (!job) return sendJson(res, 404, { error: 'Job not found' });
      const outputs = jobService.getOutputs(params.id);
      if (!outputs) return sendJson(res, 404, { error: 'No outputs yet' });

      const language = url.searchParams.get('language') || job.preferences.output_languages[0] || 'en-US';
      const captions = outputs.captionTranslations[language] || outputs.captions;
      const styled = personalizeCaptions(captions, job.preferences.caption_style);
      const ttml = formatTtml(styled);

      res.writeHead(200, {
        'Content-Type': 'application/ttml+xml; charset=utf-8',
        'Content-Disposition': `attachment; filename="captions-${language}.ttml"`
      });
      return res.end(ttml);
    }

    // Download: audio description
    params = extractParams(pathname, '/v1/jobs/:id/audio-description.json');
    if (params && method === 'GET') {
      if (!requireValidJobId(params.id, res)) return;
      const job = jobService.getJob(params.id);
      if (!job) return sendJson(res, 404, { error: 'Job not found' });
      const outputs = jobService.getOutputs(params.id);
      if (!outputs) return sendJson(res, 404, { error: 'No outputs yet' });

      const styled = personalizeAudioDesc(outputs.audioDescription, job.preferences.audio_description_style);
      return sendJson(res, 200, {
        job_id: params.id,
        requires_human_review: true,
        notice: 'AI-drafted audio description. Review before publishing — see LIMITATIONS.md.',
        segments: styled
      });
    }

    // Download: sign data
    params = extractParams(pathname, '/v1/jobs/:id/sign-data.json');
    if (params && method === 'GET') {
      if (!requireValidJobId(params.id, res)) return;
      const job = jobService.getJob(params.id);
      if (!job) return sendJson(res, 404, { error: 'Job not found' });
      const outputs = jobService.getOutputs(params.id);
      if (!outputs) return sendJson(res, 404, { error: 'No outputs yet' });

      return sendJson(res, 200, {
        job_id: params.id,
        notice: 'Experimental. Not intended as a standalone sign-language product — see LIMITATIONS.md.',
        sign_language: job.preferences.sign_language,
        sign_presentation_mode: job.preferences.sign_presentation_mode,
        sign_overlay_theme: job.preferences.sign_overlay_theme,
        sign_script: outputs.signScript,
        sign_cards: outputs.signCards
      });
    }

    // Serve original media
    params = extractParams(pathname, '/v1/jobs/:id/media');
    if (params && method === 'GET') {
      if (!requireValidJobId(params.id, res)) return;
      const job = jobService.getJob(params.id);
      if (!job) return sendJson(res, 404, { error: 'Job not found' });

      const filePath = resolveJobFilePath(job.file_path);
      if (!filePath) {
        console.error('media.path_traversal_blocked', { jobId: params.id, filePath: job.file_path });
        return sendJson(res, 404, { error: 'Media file not found' });
      }
      const ext = path.extname(filePath);
      const mimeType = MIME_TYPES[ext] || job.mime_type || 'application/octet-stream';

      let stat;
      try { stat = await fs.promises.stat(filePath); }
      catch { return sendJson(res, 404, { error: 'Media file not found' }); }

      const range = req.headers.range;
      if (range) {
        const m = range.match(/^bytes=(\d*)-(\d*)$/);
        if (!m) {
          res.setHeader('Content-Range', `bytes */${stat.size}`);
          return sendJson(res, 416, { error: 'Invalid Range' });
        }
        let start = m[1] === '' ? null : Number(m[1]);
        let end = m[2] === '' ? null : Number(m[2]);
        if (start === null && end === null) {
          res.setHeader('Content-Range', `bytes */${stat.size}`);
          return sendJson(res, 416, { error: 'Invalid Range' });
        }
        if (start === null) { start = stat.size - end; end = stat.size - 1; }
        if (end === null) end = stat.size - 1;
        if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end >= stat.size || start > end) {
          res.setHeader('Content-Range', `bytes */${stat.size}`);
          return sendJson(res, 416, { error: 'Invalid Range' });
        }
        const chunkSize = end - start + 1;
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${stat.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': mimeType
        });
        fs.createReadStream(filePath, { start, end }).pipe(res);
      } else {
        res.writeHead(200, {
          'Content-Length': stat.size,
          'Content-Type': mimeType,
          'Accept-Ranges': 'bytes'
        });
        fs.createReadStream(filePath).pipe(res);
      }
      return;
    }

    return sendHtml(res, 404, uiService.buildErrorPage(404, 'Page not found', 'The page you requested does not exist.'));
  } catch (err) {
    console.error('Request error:', err);
    if (!res.headersSent) {
      if (err instanceof PayloadTooLargeError) {
        return sendJson(res, 413, { error: 'Request body too large', limit_bytes: err.limit });
      }
      const status = err.message.includes('Missing required') || err.message.includes('Unsupported file') || err.message.includes('do not match declared type') ? 400 : 500;
      sendJson(res, status, { error: err.message });
    }
  }
}

const server = http.createServer(handleRequest);

// Snapshot when any job finishes — listen for progress events and trigger on complete/error
const originalEmit = jobEmitter.emit.bind(jobEmitter);
jobEmitter.emit = function (event, data) {
  originalEmit(event, data);
  if (data && (data.type === 'complete' || data.type === 'error') && event.startsWith('job:')) {
    persistenceService.snapshot(`job.${data.type}`).catch((err) => {
      console.error('snapshot.failed', { reason: `job.${data.type}`, error: err.message });
    });
  }
};

export async function start() {
  await persistenceService.configure(config);
  await persistenceService.loadLatest();

  server.listen(config.port, () => {
    console.log(`Accessibility Lite running on http://localhost:${config.port}`);
    console.log(`Model provider: ${config.modelProvider}`);
    console.log(`Persistence: ${config.enablePostgres ? 'postgres' : 'in-memory only'}`);
    if (config.authDisabled) {
      console.warn('AUTH_DISABLED=true — all endpoints are open. Do NOT run in production this way.');
    }
    if (!config.trustedProxy) {
      console.log('TRUSTED_PROXY=false — X-Forwarded-For header is ignored.');
    }
  });

  // Periodic snapshots. .unref() so the interval does not hold the event loop
  // open — tests (and SIGTERM) can exit cleanly without clearing it.
  if (config.snapshotIntervalMs > 0) {
    setInterval(() => {
      persistenceService.snapshot('interval').catch((err) => {
        console.error('snapshot.failed', { reason: 'interval', error: err.message });
      });
    }, config.snapshotIntervalMs).unref();
  }

  // Job cleanup every hour (24h TTL)
  setInterval(() => {
    cleanupService.run();
  }, 60 * 60 * 1000).unref();
  cleanupService.run();

  // Graceful shutdown
  async function shutdown() {
    console.log('Shutting down...');
    await persistenceService.snapshot('shutdown').catch(() => {});
    await persistenceService.close();
    server.close();
    process.exit(0);
  }
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

// Only auto-start when this file is the script entry point. Importing the
// module from tests (or any other code) does not open a port — the test
// harness calls start() explicitly so it can control lifecycle and port.
const entry = process.argv[1] || '';
const invokedDirectly = import.meta.url === `file://${entry}` || entry.endsWith('src/server.js');
if (invokedDirectly) {
  start().catch((err) => {
    console.error('Failed to start:', err);
    process.exit(1);
  });
}

export { server };
