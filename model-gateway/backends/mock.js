// Development/test backend. Output is clearly labelled as fake so it can
// never be mistaken for a real transcription in a demo or production log.
export const mockBackend = {
  name: 'mock',

  async transcribe({ language = 'en', duration_ms = 2000 } = {}) {
    return {
      transcript: '[mock] Placeholder transcript — set WHISPER_BACKEND=whispercpp or WHISPER_BACKEND=openai for real transcription.',
      scene: '',
      language,
      duration_ms,
      confidence: 0,
      _backend: 'mock'
    };
  }
};
