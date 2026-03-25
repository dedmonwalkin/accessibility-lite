import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mockModelProvider } from '../src/services/providers/mockModelProvider.js';
import { createModelProvider } from '../src/services/providers/modelProvider.js';
import { createTranslationProvider } from '../src/services/providers/translationProvider.js';
import { formatVtt, formatTtml } from '../src/utils/vtt.js';
import { normalizeConfidence } from '../src/utils/validation.js';

describe('Mock Model Provider', () => {
  it('transcribes and returns mock transcript', async () => {
    const result = await mockModelProvider.transcribe({ language: 'en', duration_ms: 3000 });
    assert.ok(result.transcript);
    assert.equal(result.language, 'en');
    assert.equal(result.duration_ms, 3000);
    assert.ok(result.confidence > 0);
    assert.ok(result.confidence <= 1);
  });

  it('infers perception from timeline item', async () => {
    const timelineItem = {
      id: 'seg_1',
      ts_start: new Date(0).toISOString(),
      ts_end: new Date(2000).toISOString(),
      transcript: 'Goal scored by the home team',
      scene: 'Ball enters the net',
      speaker: 'commentator',
      entities: []
    };
    const perception = await mockModelProvider.inferPerception({ timelineItem });
    assert.equal(perception.transcript, timelineItem.transcript);
    assert.ok(perception.confidence > 0);
  });

  it('infers accessibility from timeline + perception', async () => {
    const timelineItem = {
      id: 'seg_1',
      ts_start: new Date(0).toISOString(),
      ts_end: new Date(2000).toISOString(),
      transcript: 'Free kick from distance',
      scene: 'Players line up',
      speaker: 'commentator',
      entities: []
    };
    const perception = await mockModelProvider.inferPerception({ timelineItem });
    const accessibility = await mockModelProvider.inferAccessibility({ timelineItem, perception });
    assert.equal(accessibility.segment_id, 'seg_1');
    assert.equal(accessibility.text, timelineItem.transcript);
    assert.ok(accessibility.audio_description);
  });

  it('infers sign script with gloss tokens', async () => {
    const accessibility = {
      segment_id: 'seg_1',
      ts_start: new Date(0).toISOString(),
      ts_end: new Date(2000).toISOString(),
      type: 'commentary',
      text: 'The goalkeeper makes a save',
      confidence: 0.85
    };
    const sign = await mockModelProvider.inferSignScript({ accessibility, timelineItem: {} });
    assert.equal(sign.id, 'seg_1');
    assert.ok(Array.isArray(sign.gloss_tokens));
    assert.ok(sign.gloss_tokens.length > 0);
    assert.ok(sign.gloss_tokens.length <= 12);
    assert.ok(Array.isArray(sign.facial_cues));
    assert.equal(sign.fallback_text, accessibility.text);
  });
});

describe('Model Provider Factory', () => {
  it('returns mock provider by default', () => {
    const provider = createModelProvider();
    assert.equal(provider.name, 'mock');
  });

  it('returns mock when http base url is missing', () => {
    const provider = createModelProvider({ provider: 'http' });
    assert.ok(provider.name.includes('mock'));
  });
});

describe('Translation Provider', () => {
  it('mock returns original text for English', async () => {
    const provider = createTranslationProvider();
    const result = await provider.translate('Hello world', 'en-US');
    assert.equal(result, 'Hello world');
  });

  it('mock prefixes language tag for non-English', async () => {
    const provider = createTranslationProvider();
    const result = await provider.translate('Hello world', 'es-ES');
    assert.equal(result, '[es-ES] Hello world');
  });
});

describe('VTT Formatter', () => {
  it('formats captions as valid WebVTT', () => {
    const captions = [
      { start_ms: 0, end_ms: 2000, text: 'First caption' },
      { start_ms: 2000, end_ms: 4000, text: 'Second caption' }
    ];
    const vtt = formatVtt(captions);
    assert.ok(vtt.startsWith('WEBVTT'));
    assert.ok(vtt.includes('00:00:00.000 --> 00:00:02.000'));
    assert.ok(vtt.includes('First caption'));
    assert.ok(vtt.includes('00:00:02.000 --> 00:00:04.000'));
    assert.ok(vtt.includes('Second caption'));
  });

  it('formats captions as TTML', () => {
    const captions = [
      { start_ms: 0, end_ms: 2000, text: 'Test caption' }
    ];
    const ttml = formatTtml(captions);
    assert.ok(ttml.includes('<?xml'));
    assert.ok(ttml.includes('ttml'));
    assert.ok(ttml.includes('Test caption'));
  });
});

describe('Validation', () => {
  it('normalizes confidence to 0-1 range', () => {
    assert.equal(normalizeConfidence(0.5), 0.5);
    assert.equal(normalizeConfidence(-1), 0);
    assert.equal(normalizeConfidence(2), 1);
    assert.equal(normalizeConfidence(NaN), 0);
    assert.equal(normalizeConfidence('abc'), 0);
  });
});
