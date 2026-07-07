import { normalizeLanguage } from '../config.js';

// exp(mean avg_logprob) is the standard rough confidence for the OpenAI
// transcription API's verbose_json segments; clamp to [0, 1].
function confidenceFromSegments(segments) {
  const lps = (segments || []).map((s) => s.avg_logprob).filter((v) => typeof v === 'number');
  if (!lps.length) return 0.85;
  const mean = lps.reduce((a, b) => a + b, 0) / lps.length;
  return Math.max(0, Math.min(1, Math.exp(mean)));
}

export function createOpenAiBackend(cfg) {
  if (!cfg.openaiApiKey) {
    throw new Error('OPENAI_API_KEY is required for WHISPER_BACKEND=openai');
  }

  return {
    name: 'openai',

    async transcribe({ audio_base64, format = 'wav', language = 'en', duration_ms = 2000 } = {}) {
      if (!audio_base64) throw new Error('audio_base64 is required');
      const lang = normalizeLanguage(language);

      const buf = Buffer.from(audio_base64, 'base64');
      const form = new FormData();
      form.append('file', new Blob([buf], { type: `audio/${format}` }), `audio.${format}`);
      form.append('model', cfg.openaiModel);
      form.append('language', lang);
      form.append('response_format', 'verbose_json');
      form.append('temperature', '0');

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), cfg.transcribeTimeoutMs);
      try {
        const res = await fetch(`${cfg.openaiBaseUrl}/v1/audio/transcriptions`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${cfg.openaiApiKey}` },
          body: form,
          signal: controller.signal
        });
        if (!res.ok) {
          const snippet = (await res.text().catch(() => '')).slice(0, 300);
          throw new Error(`OpenAI transcription failed: HTTP ${res.status} ${snippet}`);
        }
        const data = await res.json();

        return {
          transcript: String(data.text || '').trim(),
          scene: '',
          language: data.language || lang,
          duration_ms,
          confidence: confidenceFromSegments(data.segments),
          _backend: 'openai'
        };
      } finally {
        clearTimeout(timer);
      }
    }
  };
}
