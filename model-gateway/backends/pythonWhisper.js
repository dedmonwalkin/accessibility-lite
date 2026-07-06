import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { normalizeLanguage } from '../config.js';

const exec = promisify(execFile);

// Backend for the reference Python CLI (`pip install openai-whisper`,
// also `brew install openai-whisper`). Slower to start than whisper.cpp but
// zero build step — handy on dev machines and small deployments.
function confidenceFromSegments(segments) {
  const lps = (segments || []).map((s) => s.avg_logprob).filter((v) => typeof v === 'number');
  if (!lps.length) return 0.85;
  const mean = lps.reduce((a, b) => a + b, 0) / lps.length;
  return Math.max(0, Math.min(1, Math.exp(mean)));
}

export function createPythonWhisperBackend(cfg) {
  return {
    name: 'python-whisper',

    async transcribe({ audio_base64, language = 'en', duration_ms = 2000 } = {}) {
      if (!audio_base64) throw new Error('audio_base64 is required');
      const lang = normalizeLanguage(language);

      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gw-pywhisper-'));
      const wavPath = path.join(tmpDir, 'audio.wav');

      try {
        await fs.writeFile(wavPath, Buffer.from(audio_base64, 'base64'));

        await exec(cfg.whisperPyBin, [
          wavPath,
          '--model', cfg.whisperPyModel,
          '--language', lang,
          '--output_format', 'json',
          '--output_dir', tmpDir,
          '--fp16', 'False',
          '--verbose', 'False'
        ], { timeout: cfg.transcribeTimeoutMs, maxBuffer: 16 * 1024 * 1024 });

        const raw = JSON.parse(await fs.readFile(path.join(tmpDir, 'audio.json'), 'utf8'));

        return {
          transcript: String(raw.text || '').trim(),
          scene: '',
          language: raw.language || lang,
          duration_ms,
          confidence: confidenceFromSegments(raw.segments),
          _backend: 'python-whisper'
        };
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
      }
    }
  };
}
