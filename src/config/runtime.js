export function runtimeConfig() {
  const env = process.env;
  return {
    nodeEnv: env.NODE_ENV || 'development',
    port: Number(env.PORT || 3000),
    maxUploadMb: Number(env.MAX_UPLOAD_MB || 500),
    chunkDurationMs: Number(env.CHUNK_DURATION_MS || 5000),
    modelProvider: env.MODEL_PROVIDER || 'mock',
    modelHttpBaseUrl: env.MODEL_HTTP_BASE_URL || '',
    modelHttpApiKey: env.MODEL_HTTP_API_KEY || '',
    modelHttpTimeoutMs: Number(env.MODEL_HTTP_TIMEOUT_MS || 4000),
    translationProvider: env.TRANSLATION_PROVIDER || 'mock',
    translationHttpBaseUrl: env.TRANSLATION_HTTP_BASE_URL || '',
    translationApiKey: env.TRANSLATION_API_KEY || '',
    translationCacheTtlMs: Number(env.TRANSLATION_CACHE_TTL_MS || 3600000),
    translationCacheMaxSize: Number(env.TRANSLATION_CACHE_MAX_SIZE || 10000)
  };
}
