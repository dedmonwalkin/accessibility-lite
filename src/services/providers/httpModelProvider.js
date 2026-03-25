import { mockModelProvider } from './mockModelProvider.js';

const DEFAULT_TIMEOUT_MS = Number(process.env.MODEL_HTTP_TIMEOUT_MS || 4000);

function withTimeout(timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

async function postJson({ endpoint, payload, timeoutMs, headers = {} }) {
  const timeout = withTimeout(timeoutMs);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(payload),
      signal: timeout.signal
    });
    if (!response.ok) throw new Error(`HTTP model provider failed: ${response.status}`);
    return response.json();
  } finally {
    timeout.clear();
  }
}

function endpoint(baseUrl, path) {
  return `${String(baseUrl || '').replace(/\/$/, '')}${path}`;
}

export function createHttpModelProvider(config = {}) {
  const baseUrl = config.base_url || process.env.MODEL_HTTP_BASE_URL;
  const apiKey = config.api_key || process.env.MODEL_HTTP_API_KEY;
  const timeoutMs = Number(config.timeout_ms || DEFAULT_TIMEOUT_MS);

  if (!baseUrl) {
    return { ...mockModelProvider, name: 'mock(http_missing_base_url)' };
  }

  const headers = apiKey ? { Authorization: `Bearer ${apiKey}` } : {};

  return {
    name: 'http',

    async inferPerception(input) {
      try { return await postJson({ endpoint: endpoint(baseUrl, '/v1/models/perception'), payload: input, timeoutMs, headers }); }
      catch { return mockModelProvider.inferPerception(input); }
    },

    async inferAccessibility(input) {
      try { return await postJson({ endpoint: endpoint(baseUrl, '/v1/models/accessibility'), payload: input, timeoutMs, headers }); }
      catch { return mockModelProvider.inferAccessibility(input); }
    },

    async inferSignScript(input) {
      try { return await postJson({ endpoint: endpoint(baseUrl, '/v1/models/sign-script'), payload: input, timeoutMs, headers }); }
      catch { return mockModelProvider.inferSignScript(input); }
    },

    async transcribe(input) {
      try { return await postJson({ endpoint: endpoint(baseUrl, '/v1/models/transcribe'), payload: input, timeoutMs, headers }); }
      catch { return mockModelProvider.transcribe(input); }
    }
  };
}
