import { mockBackend } from './mock.js';
import { createWhisperCppBackend } from './whisperCpp.js';
import { createOpenAiBackend } from './openaiWhisper.js';
import { createPythonWhisperBackend } from './pythonWhisper.js';

export function createBackend(cfg) {
  switch (cfg.backend) {
    case 'whispercpp': return createWhisperCppBackend(cfg);
    case 'python-whisper': return createPythonWhisperBackend(cfg);
    case 'openai': return createOpenAiBackend(cfg);
    case 'mock': return mockBackend;
    default:
      throw new Error(`Unknown WHISPER_BACKEND: "${cfg.backend}" (expected whispercpp, python-whisper, openai, or mock)`);
  }
}
