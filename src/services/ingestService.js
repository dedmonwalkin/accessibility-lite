import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { store } from '../data/store.js';
import { runtimeConfig } from '../config/runtime.js';
import { assertSafeUrl, SsrfError } from '../utils/safeFetch.js';
import { magicBytesMatch } from '../utils/upload.js';
import { mediaService } from './mediaService.js';
import { getUploadsDir } from './jobService.js';

const exec = promisify(execFile);

// URL ingestion: direct media links download natively (streamed, size-capped,
// magic-byte checked). Anything else (YouTube, Granicus, CivicPlus, ...) is
// handed to yt-dlp when installed. User-supplied URLs get the full SSRF
// treatment — no private hosts, ever (unlike the operator-configured gateway).

const MIME_BY_EXT = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4'
};

export class IngestError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

function directMediaExt(parsedUrl) {
  const ext = path.extname(parsedUrl.pathname).toLowerCase();
  return MIME_BY_EXT[ext] ? ext : null;
}

let ytDlpAvailable = null;
async function hasYtDlp(bin) {
  if (ytDlpAvailable !== null) return ytDlpAvailable;
  try {
    await exec(bin, ['--version'], { timeout: 10_000 });
    ytDlpAvailable = true;
  } catch {
    ytDlpAvailable = false;
  }
  return ytDlpAvailable;
}

async function downloadDirect(url, jobDir, config) {
  const parsed = new URL(url);
  const ext = directMediaExt(parsed);
  const mimeType = MIME_BY_EXT[ext];
  const maxBytes = config.maxUploadMb * 1024 * 1024;
  const destPath = path.join(jobDir, `original${ext}`);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.ingestTimeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, redirect: 'follow' });
    if (!res.ok) throw new IngestError(`Download failed: HTTP ${res.status}`, 502);
    // Redirects may land anywhere — re-validate the final URL before reading
    // the body, so a public link can't bounce us into a private network.
    await assertSafeUrl(res.url);

    const declared = Number(res.headers.get('content-length') || 0);
    if (declared > maxBytes) throw new IngestError(`File exceeds ${config.maxUploadMb}MB limit`, 413);

    const reader = res.body?.getReader();
    if (!reader) throw new IngestError('Empty response body', 502);

    const out = fs.createWriteStream(destPath);
    let total = 0;
    let head = Buffer.alloc(0);
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        total += value.length;
        if (total > maxBytes) {
          try { reader.cancel(); } catch { /* noop */ }
          throw new IngestError(`File exceeds ${config.maxUploadMb}MB limit`, 413);
        }
        if (head.length < 12) head = Buffer.concat([head, Buffer.from(value)]).subarray(0, 12);
        if (!out.write(Buffer.from(value))) {
          await new Promise((r) => out.once('drain', r));
        }
      }
      await new Promise((resolve, reject) => out.end((err) => (err ? reject(err) : resolve())));
    } catch (err) {
      out.destroy();
      throw err;
    }

    if (!magicBytesMatch(head, mimeType)) {
      throw new IngestError(`Downloaded content does not match declared type ${mimeType}`);
    }

    const filename = path.basename(parsed.pathname) || `original${ext}`;
    return { file_path: destPath, mime_type: mimeType, file_size_bytes: total, original_filename: filename };
  } finally {
    clearTimeout(timer);
  }
}

async function downloadViaYtDlp(url, jobDir, config) {
  if (!(await hasYtDlp(config.ytDlpBin))) {
    throw new IngestError(
      'This URL is not a direct media link, and yt-dlp is not installed on the server. ' +
      'Install yt-dlp to ingest from platforms like YouTube.',
      501
    );
  }

  await exec(config.ytDlpBin, [
    '--no-playlist',
    '--no-progress',
    '--socket-timeout', '30',
    '--max-filesize', `${config.maxUploadMb}M`,
    '-S', 'res:720,ext',
    '--remux-video', 'mp4',
    '--write-info-json',
    '-o', path.join(jobDir, 'original.%(ext)s'),
    '--', url
  ], { timeout: config.ingestTimeoutMs, maxBuffer: 16 * 1024 * 1024 });

  const files = await fs.promises.readdir(jobDir);
  const mediaFile = files.find((f) => f.startsWith('original.') && MIME_BY_EXT[path.extname(f).toLowerCase()]);
  if (!mediaFile) {
    throw new IngestError('yt-dlp produced no supported media file (mp4/webm/mov/mp3/wav/ogg/m4a)', 502);
  }

  const filePath = path.join(jobDir, mediaFile);
  const mimeType = MIME_BY_EXT[path.extname(mediaFile).toLowerCase()];
  const stat = await fs.promises.stat(filePath);

  let title = mediaFile;
  try {
    const info = JSON.parse(await fs.promises.readFile(path.join(jobDir, 'original.info.json'), 'utf8'));
    if (info.title) title = String(info.title).slice(0, 200);
  } catch { /* info json is best-effort */ }

  return { file_path: filePath, mime_type: mimeType, file_size_bytes: stat.size, original_filename: title };
}

async function runDownload(job, url) {
  const config = runtimeConfig();
  const jobDir = path.join(getUploadsDir(), job.id);

  try {
    const parsed = new URL(url);
    const fileInfo = directMediaExt(parsed)
      ? await downloadDirect(url, jobDir, config)
      : await downloadViaYtDlp(url, jobDir, config);

    let probeResult = { duration_ms: 0, has_video: false, has_audio: false };
    try {
      probeResult = await mediaService.probe(fileInfo.file_path);
    } catch (err) {
      store.log('job.probe_warning', { jobId: job.id, error: err.message });
    }

    Object.assign(job, {
      status: 'pending',
      original_filename: fileInfo.original_filename,
      mime_type: fileInfo.mime_type,
      file_path: fileInfo.file_path,
      file_size_bytes: fileInfo.file_size_bytes,
      duration_ms: probeResult.duration_ms,
      has_video: probeResult.has_video,
      has_audio: probeResult.has_audio,
      updatedAt: store.nowIso()
    });
    store.log('job.ingest_complete', { jobId: job.id, source: job.source_url, bytes: fileInfo.file_size_bytes });
  } catch (err) {
    job.status = 'error';
    job.error = err.message;
    job.updatedAt = store.nowIso();
    await fs.promises.rm(jobDir, { recursive: true, force: true }).catch(() => {});
    store.log('job.ingest_failed', { jobId: job.id, source: job.source_url, error: err.message });
  }
}

export const ingestService = {
  // Validates synchronously (URL shape + SSRF), then downloads in the
  // background. Caller gets the job in status "downloading" immediately and
  // polls GET /v1/jobs/:id until it reaches "pending" (or "error").
  async createUrlJob(rawUrl) {
    if (typeof rawUrl !== 'string' || !rawUrl.trim()) {
      throw new IngestError('url is required');
    }

    try {
      await assertSafeUrl(rawUrl.trim());
    } catch (err) {
      if (err instanceof SsrfError) throw new IngestError(`Refusing to fetch this URL: ${err.message}`);
      throw new IngestError(`Could not resolve URL: ${err.message}`);
    }

    const url = rawUrl.trim();
    const jobId = store.nextId('job');
    const jobDir = path.join(getUploadsDir(), jobId);
    await fs.promises.mkdir(jobDir, { recursive: true });

    const job = {
      id: jobId,
      status: 'downloading',
      progress: 0,
      error: null,
      source_url: url,
      original_filename: null,
      mime_type: null,
      file_path: null,
      file_size_bytes: 0,
      duration_ms: 0,
      has_video: false,
      has_audio: false,
      preferences: {
        output_languages: ['en-US'],
        caption_style: 'standard',
        audio_description_style: 'standard',
        sign_language: 'ASL',
        sign_presentation_mode: 'avatar_2d',
        sign_overlay_theme: 'standard',
        ui_mode: 'default'
      },
      createdAt: store.nowIso(),
      updatedAt: store.nowIso(),
      completedAt: null
    };

    store.jobs.set(jobId, job);
    store.jobOutputs.set(jobId, {
      events: [],
      captions: [],
      captionTranslations: {},
      audioDescription: [],
      signScript: [],
      signCards: [],
      chunks_processed: 0,
      chunks_total: 0
    });
    store.log('job.ingest_started', { jobId, source: url });

    runDownload(job, url).catch((err) => {
      store.log('job.ingest_failed', { jobId, error: err.message });
    });

    return job;
  },

  // Test hook
  _resetYtDlpCacheForTests() { ytDlpAvailable = null; }
};
