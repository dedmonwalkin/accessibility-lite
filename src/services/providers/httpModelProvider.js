import { mockModelProvider } from './mockModelProvider.js';
import { runtimeConfig } from '../../config/runtime.js';
import { safeFetchJson, SsrfError } from '../../utils/safeFetch.js';
import { store } from '../../data/store.js';

function endpoint(baseUrl, path) {
  return `${String(baseUrl || '').replace(/\/$/, '')}${path}`;
}

// Silent fallback to mock data on provider failure is dangerous: it serves
// plausible-looking fabricated captions when the upstream is actually down.
// Must be explicitly opted into via MODEL_FALLBACK_ON_ERROR=true, and every
// fallback is logged + tagged on the output object.
function fallbackOrThrow(runtime, name, err) {
  store.log('provider.error', { provider: 'http', operation: name, error: err.message });
  if (runtime.modelFallbackOnError) {
    store.log('provider.fallback', { from: 'http', to: 'mock', operation: name });
    return true;
  }
  throw err;
}

function tagFallback(result, used) {
  if (used && result && typeof result === 'object') result._provider = 'mock-fallback';
  return result;
}

export function createHttpModelProvider(config = {}) {
  const runtime = runtimeConfig();
  const baseUrl = config.base_url || runtime.modelHttpBaseUrl;
  const apiKey = config.api_key || runtime.modelHttpApiKey;
  const timeoutMs = Number(config.timeout_ms || runtime.modelHttpTimeoutMs);
  const maxResponseBytes = runtime.httpProviderMaxResponseBytes;

  if (!baseUrl) {
    store.log('provider.config', { provider: 'http', warning: 'MODEL_HTTP_BASE_URL missing, using mock' });
    return { ...mockModelProvider, name: 'mock(http_missing_base_url)' };
  }

  // Allow plain http only if base URL hostname is localhost (common for whisper.cpp / Ollama setups).
  const allowHttpLocalhost = (() => {
    try {
      const u = new URL(baseUrl);
      return u.hostname === 'localhost' || u.hostname === '127.0.0.1' || u.hostname === '::1';
    } catch { return false; }
  })();

  const headers = { 'Content-Type': 'application/json', ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}) };

  async function call(path, payload, opName) {
    try {
      return await safeFetchJson(endpoint(baseUrl, path), {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        timeoutMs,
        maxResponseBytes,
        allowHttpLocalhost
      });
    } catch (err) {
      if (err instanceof SsrfError) {
        store.log('provider.ssrf_blocked', { provider: 'http', operation: opName, error: err.message });
        throw err;
      }
      const didFallback = fallbackOrThrow(runtime, opName, err);
      if (didFallback) return tagFallback(await mockModelProvider[opName](payload), true);
      throw err;
    }
  }

  return {
    name: 'http',
    async inferPerception(input)   { return call('/v1/models/perception', input, 'inferPerception'); },
    async inferAccessibility(input){ return call('/v1/models/accessibility', input, 'inferAccessibility'); },
    async inferSignScript(input)   { return call('/v1/models/sign-script', input, 'inferSignScript'); },
    async transcribe(input)        { return call('/v1/models/transcribe', input, 'transcribe'); }
  };
}
