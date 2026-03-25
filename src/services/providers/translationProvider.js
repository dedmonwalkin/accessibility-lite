import { runtimeConfig } from '../../config/runtime.js';

const DEFAULT_TIMEOUT_MS = Number(process.env.TRANSLATION_HTTP_TIMEOUT_MS || 5000);

function withTimeout(timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

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

function createLibreTranslateProvider({ baseUrl, apiKey }) {
  const cache = createBoundedCache();
  const url = `${baseUrl.replace(/\/$/, '')}/translate`;

  return {
    name: 'libretranslate',
    async translate(text, targetLanguage, sourceLanguage = 'en') {
      const target = targetLanguage.split('-')[0];
      const source = sourceLanguage.split('-')[0];
      if (target === 'en') return text;

      const cacheKey = `${target}:${text}`;
      const cached = cache.get(cacheKey);
      if (cached !== undefined) return cached;

      const t = withTimeout(DEFAULT_TIMEOUT_MS);
      try {
        const body = { q: text, source, target, format: 'text' };
        if (apiKey) body.api_key = apiKey;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: t.signal
        });
        if (!res.ok) throw new Error(`LibreTranslate error: ${res.status}`);
        const data = await res.json();
        const result = data.translatedText || text;
        cache.set(cacheKey, result);
        return result;
      } catch { return `[${targetLanguage}] ${text}`; }
      finally { t.clear(); }
    }
  };
}

function createDeeplProvider({ apiKey, baseUrl }) {
  const cache = createBoundedCache();
  const apiUrl = `${(baseUrl || 'https://api-free.deepl.com').replace(/\/$/, '')}/v2/translate`;

  return {
    name: 'deepl',
    async translate(text, targetLanguage) {
      const target = targetLanguage.toUpperCase().replace('-', '_');
      if (target === 'EN' || target === 'EN_US') return text;

      const cacheKey = `${target}:${text}`;
      const cached = cache.get(cacheKey);
      if (cached !== undefined) return cached;

      const t = withTimeout(DEFAULT_TIMEOUT_MS);
      try {
        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `DeepL-Auth-Key ${apiKey}` },
          body: JSON.stringify({ text: [text], target_lang: target }),
          signal: t.signal
        });
        if (!res.ok) throw new Error(`DeepL error: ${res.status}`);
        const data = await res.json();
        const result = data.translations?.[0]?.text || text;
        cache.set(cacheKey, result);
        return result;
      } catch { return `[${targetLanguage}] ${text}`; }
      finally { t.clear(); }
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
