import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { runtimeConfig } from './config/runtime.js';
import { sendJson, sendHtml, parseJsonBody, parseUrl, notFound, methodNotAllowed } from './utils/http.js';
import { formatVtt, formatTtml } from './utils/vtt.js';
import { jobService } from './services/jobService.js';
import { jobEmitter } from './services/pipelineService.js';
import { uiService } from './services/uiService.js';
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

function extractParams(pathname, pattern) {
  const patternParts = pattern.split('/');
  const pathParts = pathname.split('/');
  if (patternParts.length !== pathParts.length) return null;
  const params = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = decodeURIComponent(pathParts[i]);
    } else if (patternParts[i] !== pathParts[i]) {
      return null;
    }
  }
  return params;
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

  try {
    // Health
    if (pathname === '/health' && method === 'GET') {
      return sendJson(res, 200, { status: 'ok', jobs: jobService.getJob ? 'in_memory' : 'none' });
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

    // Create job (multipart upload)
    if (pathname === '/v1/jobs' && method === 'POST') {
      const job = await jobService.createJob(req);
      return sendJson(res, 201, job);
    }

    // Job status
    let params = extractParams(pathname, '/v1/jobs/:id');
    if (params && method === 'GET') {
      const job = jobService.getJob(params.id);
      if (!job) return sendJson(res, 404, { error: 'Job not found' });
      return sendJson(res, 200, job);
    }

    // Options page (HTML)
    params = extractParams(pathname, '/jobs/:id/options');
    if (params && method === 'GET') {
      const job = jobService.getJob(params.id);
      if (!job) return sendHtml(res, 404, '<h1>Job not found</h1>');
      return sendHtml(res, 200, uiService.buildOptionsPage(job));
    }

    // Start processing
    params = extractParams(pathname, '/v1/jobs/:id/process');
    if (params && method === 'POST') {
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
      const job = jobService.getJob(params.id);
      if (!job) return sendJson(res, 404, { error: 'Job not found' });

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive'
      });

      if (job.status === 'complete') {
        res.write(`data: ${JSON.stringify({ type: 'complete', job_id: params.id })}\n\n`);
        res.end();
        return;
      }
      if (job.status === 'error') {
        res.write(`data: ${JSON.stringify({ type: 'error', job_id: params.id, message: job.error })}\n\n`);
        res.end();
        return;
      }

      const listener = (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
        if (data.type === 'complete' || data.type === 'error') {
          jobEmitter.removeListener(`job:${params.id}`, listener);
          res.end();
        }
      };
      jobEmitter.on(`job:${params.id}`, listener);

      req.on('close', () => {
        jobEmitter.removeListener(`job:${params.id}`, listener);
      });
      return;
    }

    // Results page (HTML)
    params = extractParams(pathname, '/jobs/:id/results');
    if (params && method === 'GET') {
      const job = jobService.getJob(params.id);
      if (!job) return sendHtml(res, 404, '<h1>Job not found</h1>');
      if (job.status !== 'complete') {
        return sendHtml(res, 200, `<!doctype html><html><head><meta charset="utf-8"><title>Processing...</title><meta http-equiv="refresh" content="3"></head><body style="background:#07111f;color:#f7fbff;font-family:sans-serif;text-align:center;padding:60px"><h1>Processing...</h1><p>Progress: ${job.progress}%</p><p>This page will refresh automatically.</p></body></html>`);
      }
      const outputs = jobService.getOutputs(params.id);
      return sendHtml(res, 200, uiService.buildResultsPage(job, outputs));
    }

    // Player page
    params = extractParams(pathname, '/player/:id');
    if (params && method === 'GET') {
      const job = jobService.getJob(params.id);
      if (!job) return sendHtml(res, 404, '<h1>Job not found</h1>');
      if (job.status !== 'complete') return sendHtml(res, 200, '<h1>Processing not complete</h1>');
      const outputs = jobService.getOutputs(params.id);
      return sendHtml(res, 200, uiService.buildPlayerPage(job, outputs));
    }

    // Download: captions VTT
    params = extractParams(pathname, '/v1/jobs/:id/captions.vtt');
    if (params && method === 'GET') {
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
      const job = jobService.getJob(params.id);
      if (!job) return sendJson(res, 404, { error: 'Job not found' });
      const outputs = jobService.getOutputs(params.id);
      if (!outputs) return sendJson(res, 404, { error: 'No outputs yet' });

      const styled = personalizeAudioDesc(outputs.audioDescription, job.preferences.audio_description_style);
      return sendJson(res, 200, { job_id: params.id, segments: styled });
    }

    // Download: sign data
    params = extractParams(pathname, '/v1/jobs/:id/sign-data.json');
    if (params && method === 'GET') {
      const job = jobService.getJob(params.id);
      if (!job) return sendJson(res, 404, { error: 'Job not found' });
      const outputs = jobService.getOutputs(params.id);
      if (!outputs) return sendJson(res, 404, { error: 'No outputs yet' });

      return sendJson(res, 200, {
        job_id: params.id,
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
      const job = jobService.getJob(params.id);
      if (!job) return sendJson(res, 404, { error: 'Job not found' });

      const filePath = job.file_path;
      const ext = path.extname(filePath);
      const mimeType = MIME_TYPES[ext] || job.mime_type || 'application/octet-stream';

      let stat;
      try { stat = await fs.promises.stat(filePath); }
      catch { return sendJson(res, 404, { error: 'Media file not found' }); }

      const range = req.headers.range;
      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
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

    return notFound(res);
  } catch (err) {
    console.error('Request error:', err);
    if (!res.headersSent) {
      sendJson(res, err.message.includes('Missing required') || err.message.includes('Unsupported file') ? 400 : 500, {
        error: err.message
      });
    }
  }
}

const server = http.createServer(handleRequest);

server.listen(config.port, () => {
  console.log(`Accessibility Lite running on http://localhost:${config.port}`);
  console.log(`Model provider: ${config.modelProvider}`);
});
