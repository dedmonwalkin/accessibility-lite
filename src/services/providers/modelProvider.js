import { mockModelProvider } from './mockModelProvider.js';
import { createHttpModelProvider } from './httpModelProvider.js';

export function createModelProvider(config = {}) {
  const provider = String(config.provider || process.env.MODEL_PROVIDER || 'mock').toLowerCase();
  if (provider === 'http') return createHttpModelProvider(config);
  return mockModelProvider;
}
