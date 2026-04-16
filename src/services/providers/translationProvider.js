import { runtimeConfig } from '../../config/runtime.js';
import { safeFetchJson, SsrfError } from '../../utils/safeFetch.js';
import { store } from '../../data/store.js';

const DEFAULT_TIMEOUT_MS = Number(process.env.TRANSLATION_HTTP_TIMEOUT_MS || 5000);

function createBoundedCache() {
  const rt = runtimeConfig();
  const ttlMs = rt.translationCacheTtlMs;
  const maxSize = rt.translationCacheMaxSize;
  const entries = new Map();

  return {
    get(key) {
      const entry = entries.get(key);
      if (!entry) return undefined;
      if (Date.now() - entry.ts > ttlMs) { entries.delete(key); return undefined; }
      return entry.value;
    },
    set(key, value) {
      if (entries.size >= maxSize) {
        const oldest = entries.keys().next().value;
        entries.delete(oldest);
      }
      entries.set(key, { value, ts: Date.now() });
    }
  };
}

const mockTranslationProvider = {
  name: 'mock',
  async translate(text, targetLanguage) {
    if (targetLanguage === 'en' || targetLanguage === 'en-US') return text;
    return `[${targetLanguage}] ${text}`;
  }
};

function fallbackText(targetLanguage, text) { return `[${targetLanguage}] ${text}`; }

function isLocalhostHost(urlStr) {
  try { const u = new URL(urlStr); return u.hostname === 'localhost' || u.hostname === '127.0.0.1' || u.hostname === '::1'; }
  catch { return false; }
}

function createLibreTranslateProvider({ baseUrl, apiKey }) {
  const cache = createBoundedCache();
  const url = `${baseUrl.replace(/\/$/, '')}/translate`;
  const allowHttpLocalhost = isLocalhostHost(baseUrl);
  const runtime = runtimeConfig();
  const maxResponseBytes = runtime.httpProviderMaxResponseBytes;

  return {
    name: 'libretranslate',
    async translate(text, targetLanguage, sourceLanguage = 'en') {
      const target = targetLanguage.split('-')[0];
      const source = sourceLanguage.split('-')[0];
      if (target === 'en') return text;

      const cacheKey = `${target}:${text}`;
      const cached = cache.get(cacheKey);
      if (cached !== undefined) return cached;

      try {
        const body = { q: text, source, target, format: 'text' };
        if (apiKey) body.api_key = apiKey;
        const data = await safeFetchJson(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          timeoutMs: DEFAULT_TIMEOUT_MS,
          maxResponseBytes,
          allowHttpLocalhost
        });
        const result = data.translatedText || text;
        cache.set(cacheKey, result);
        return result;
      } catch (err) {
        if (err instanceof SsrfError) {
          store.log('provider.ssrf_blocked', { provider: 'libretranslate', error: err.message });
          throw err;
        }
        store.log('provider.error', { provider: 'libretranslate', error: err.message });
        if (runtime.modelFallbackOnError) {
          store.log('provider.fallback', { from: 'libretranslate', to: 'passthrough' });
          return fallbackText(targetLanguage, text);
        }
        throw err;
      }
    }
  };
}

function createDeeplProvider({ apiKey, baseUrl }) {
  const cache = createBoundedCache();
  const apiUrl = `${(baseUrl || 'https://api-free.deepl.com').replace(/\/$/, '')}/v2/translate`;
  const runtime = runtimeConfig();
  const maxResponseBytes = runtime.httpProviderMaxResponseBytes;

  return {
    name: 'deepl',
    async translate(text, targetLanguage) {
      const target = targetLanguage.toUpperCase().replace('-', '_');
      if (target === 'EN' || target === 'EN_US') return text;

      const cacheKey = `${target}:${text}`;
      const cached = cache.get(cacheKey);
      if (cached !== undefined) return cached;

      try {
        const data = await safeFetchJson(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `DeepL-Auth-Key ${apiKey}` },
          body: JSON.stringify({ text: [text], target_lang: target }),
          timeoutMs: DEFAULT_TIMEOUT_MS,
          maxResponseBytes
        });
        const result = data.translations?.[0]?.text || text;
        cache.set(cacheKey, result);
        return result;
      } catch (err) {
        if (err instanceof SsrfError) {
          store.log('provider.ssrf_blocked', { provider: 'deepl', error: err.message });
          throw err;
        }
        store.log('provider.error', { provider: 'deepl', error: err.message });
        if (runtime.modelFallbackOnError) {
          store.log('provider.fallback', { from: 'deepl', to: 'passthrough' });
          return fallbackText(targetLanguage, text);
        }
        throw err;
      }
    }
  };
}

export function createTranslationProvider(config = {}) {
  const provider = String(config.provider || process.env.TRANSLATION_PROVIDER || 'mock').toLowerCase();
  const baseUrl = config.baseUrl || process.env.TRANSLATION_HTTP_BASE_URL || '';
  const apiKey = config.apiKey || process.env.TRANSLATION_API_KEY || '';

  if (provider === 'libretranslate') {
    if (!baseUrl) return { ...mockTranslationProvider, name: 'mock(libretranslate_missing_base_url)' };
    return createLibreTranslateProvider({ baseUrl, apiKey });
  }
  if (provider === 'deepl') {
    if (!apiKey) return { ...mockTranslationProvider, name: 'mock(deepl_missing_api_key)' };
    return createDeeplProvider({ apiKey, baseUrl });
  }
  return mockTranslationProvider;
}
