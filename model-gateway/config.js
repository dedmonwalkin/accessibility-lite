// Gateway config is read per createGatewayServer() call (not module-cached)
// so tests can construct servers with different settings in one process.
export function gatewayConfig(overrides = {}) {
  const env = process.env;
  return {
    port: Number(env.MODEL_GATEWAY_PORT || 4011),
    backend: env.WHISPER_BACKEND || 'mock',
    apiKey: env.GATEWAY_API_KEY || '',
    maxBodyBytes: Number(env.GATEWAY_MAX_BODY_BYTES || 32 * 1024 * 1024),
    transcribeTimeoutMs: Number(env.TRANSCRIBE_TIMEOUT_MS || 120_000),

    // whispercpp backend
    whisperCppBin: env.WHISPER_CPP_BIN || 'whisper-cli',
    whisperCppModel: env.WHISPER_CPP_MODEL || '',

    // python-whisper backend (pip/brew install openai-whisper)
    whisperPyBin: env.WHISPER_PY_BIN || 'whisper',
    whisperPyModel: env.WHISPER_PY_MODEL || 'base.en',

    // openai backend
    openaiApiKey: env.OPENAI_API_KEY || '',
    openaiModel: env.WHISPER_OPENAI_MODEL || 'whisper-1',
    openaiBaseUrl: (env.OPENAI_BASE_URL || 'https://api.openai.com').replace(/\/$/, ''),

    // optional translation proxy
    libretranslateUrl: env.LIBRETRANSLATE_URL || '',

    ...overrides
  };
}

// Whisper wants ISO-639-1 ("en"); callers send BCP-47 ("en-US").
export function normalizeLanguage(lang) {
  return String(lang || 'en').split('-')[0].toLowerCase() || 'en';
}
