import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { normalizeLanguage } from '../config.js';

const exec = promisify(execFile);

// Mean token probability from whisper.cpp --output-json-full, skipping
// special tokens like [_BEG_]. Returns null when no usable tokens exist.
function meanTokenProbability(transcription) {
  const ps = [];
  for (const segment of transcription) {
    for (const token of segment.tokens || []) {
      if (typeof token.p !== 'number') continue;
      if (String(token.text || '').startsWith('[_')) continue;
      ps.push(token.p);
    }
  }
  if (!ps.length) return null;
  return ps.reduce((a, b) => a + b, 0) / ps.length;
}

export function createWhisperCppBackend(cfg) {
  if (!cfg.whisperCppModel) {
    throw new Error('WHISPER_CPP_MODEL is required for WHISPER_BACKEND=whispercpp (path to a ggml .bin model)');
  }

  return {
    name: 'whispercpp',

    async transcribe({ audio_base64, language = 'en', duration_ms = 2000 } = {}) {
      if (!audio_base64) throw new Error('audio_base64 is required');
      const lang = normalizeLanguage(language);

      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gw-whisper-'));
      const wavPath = path.join(tmpDir, 'audio.wav');
      const outPrefix = path.join(tmpDir, 'out');

      try {
        await fs.writeFile(wavPath, Buffer.from(audio_base64, 'base64'));

        await exec(cfg.whisperCppBin, [
          '-m', cfg.whisperCppModel,
          '-f', wavPath,
          '-l', lang,
          '--output-json-full',
          '--output-file', outPrefix,
          '--no-prints'
        ], { timeout: cfg.transcribeTimeoutMs, maxBuffer: 16 * 1024 * 1024 });

        const raw = JSON.parse(await fs.readFile(`${outPrefix}.json`, 'utf8'));
        const segments = raw.transcription || [];
        const transcript = segments.map((s) => String(s.text || '').trim()).filter(Boolean).join(' ');
        const p = meanTokenProbability(segments);

        return {
          transcript,
          // No visual model in this backend — never invent scene descriptions.
          scene: '',
          language: raw.result?.language || lang,
          duration_ms,
          confidence: p === null ? 0.85 : Math.max(0, Math.min(1, p)),
          _backend: 'whispercpp'
        };
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
      }
    }
  };
}
