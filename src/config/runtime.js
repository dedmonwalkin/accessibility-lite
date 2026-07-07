function parseNumber(name, raw, fallback, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  if (raw === undefined || raw === '') return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    throw new Error(`Invalid ${name}: "${raw}" is not a number`);
  }
  if (n < min || n > max) {
    throw new Error(`Invalid ${name}: ${n} out of range [${min}, ${max}]`);
  }
  return n;
}

function parseBool(raw, fallback) {
  if (raw === undefined) return fallback;
  const v = String(raw).toLowerCase();
  if (v === 'true' || v === '1' || v === 'yes') return true;
  if (v === 'false' || v === '0' || v === 'no' || v === '') return false;
  return fallback;
}

let cached = null;

export function runtimeConfig() {
  if (cached) return cached;
  const env = process.env;

  const apiKeys = env.API_KEYS
    ? env.API_KEYS.split(',').map(k => k.trim()).filter(Boolean)
    : [];
  const authDisabled = parseBool(env.AUTH_DISABLED, false);
  if (apiKeys.length === 0 && !authDisabled) {
    console.warn(
      '[accessibility-lite] WARNING: API_KEYS is empty and AUTH_DISABLED is not set. ' +
      'All non-public endpoints will reject requests. ' +
      'Set API_KEYS=key1,key2 for production or AUTH_DISABLED=true to run open (e.g. for local dev).'
    );
  }

  cached = {
    nodeEnv: env.NODE_ENV || 'development',
    port: parseNumber('PORT', env.PORT, 3000, { min: 1, max: 65535 }),
    maxUploadMb: parseNumber('MAX_UPLOAD_MB', env.MAX_UPLOAD_MB, 500, { min: 1, max: 10240 }),
    maxJsonBodyBytes: parseNumber('MAX_JSON_BODY_BYTES', env.MAX_JSON_BODY_BYTES, 1024 * 1024, { min: 1024, max: 100 * 1024 * 1024 }),
    chunkDurationMs: parseNumber('CHUNK_DURATION_MS', env.CHUNK_DURATION_MS, 5000, { min: 500, max: 600_000 }),
    modelProvider: env.MODEL_PROVIDER || 'mock',
    modelHttpBaseUrl: env.MODEL_HTTP_BASE_URL || '',
    modelHttpApiKey: env.MODEL_HTTP_API_KEY || '',
    modelHttpTimeoutMs: parseNumber('MODEL_HTTP_TIMEOUT_MS', env.MODEL_HTTP_TIMEOUT_MS, 4000, { min: 100, max: 600_000 }),
    // Lets the SSRF guard reach an operator-configured gateway on a private
    // network (e.g. http://model-gateway:4011 inside docker-compose). Applies
    // only to MODEL_HTTP_BASE_URL, never to user-supplied URLs.
    modelHttpAllowPrivate: parseBool(env.MODEL_HTTP_ALLOW_PRIVATE, false),
    modelFallbackOnError: parseBool(env.MODEL_FALLBACK_ON_ERROR, false),
    httpProviderMaxResponseBytes: parseNumber('HTTP_PROVIDER_MAX_RESPONSE_BYTES', env.HTTP_PROVIDER_MAX_RESPONSE_BYTES, 10 * 1024 * 1024, { min: 1024, max: 1024 * 1024 * 1024 }),
    translationProvider: env.TRANSLATION_PROVIDER || 'mock',
    translationHttpBaseUrl: env.TRANSLATION_HTTP_BASE_URL || '',
    translationApiKey: env.TRANSLATION_API_KEY || '',
    translationCacheTtlMs: parseNumber('TRANSLATION_CACHE_TTL_MS', env.TRANSLATION_CACHE_TTL_MS, 3_600_000, { min: 0 }),
    translationCacheMaxSize: parseNumber('TRANSLATION_CACHE_MAX_SIZE', env.TRANSLATION_CACHE_MAX_SIZE, 10_000, { min: 0 }),
    apiKeys,
    authDisabled,
    trustedProxy: parseBool(env.TRUSTED_PROXY, false),
    rateLimitRpm: parseNumber('RATE_LIMIT_RPM', env.RATE_LIMIT_RPM, 60, { min: 0 }),
    enablePostgres: parseBool(env.ENABLE_POSTGRES, false),
    databaseUrl: env.DATABASE_URL || '',
    snapshotIntervalMs: parseNumber('SNAPSHOT_INTERVAL_MS', env.SNAPSHOT_INTERVAL_MS, 300_000, { min: 0 }),
    snapshotRetention: parseNumber('SNAPSHOT_RETENTION', env.SNAPSHOT_RETENTION, 20, { min: 0, max: 10_000 })
  };
  return cached;
}

// Test hook — forces a fresh read of process.env. Not for production use.
export function _resetRuntimeConfigForTests() {
  cached = null;
}
