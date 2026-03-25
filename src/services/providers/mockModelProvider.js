import { normalizeConfidence } from '../../utils/validation.js';

const MOCK_TRANSCRIPTS = [
  { transcript: 'The home team advances quickly through the midfield.', scene: 'Wide tracking shot following the ball' },
  { transcript: 'A strong tackle forces a turnover near the penalty area.', scene: 'Close-up of players contesting possession' },
  { transcript: 'The goalkeeper makes a spectacular diving save.', scene: 'Goalkeeper diving to the right corner' },
  { transcript: 'Corner kick awarded to the visiting side.', scene: 'Referee signals corner flag' },
  { transcript: 'Goal! The crowd erupts as the ball hits the back of the net.', scene: 'Ball crosses goal line as fans leap to their feet' },
  { transcript: 'Substitution being made — number seven coming off.', scene: 'Player jogging toward the sideline' },
  { transcript: 'Free kick from thirty metres out — this could be dangerous.', scene: 'Players forming a wall' },
  { transcript: 'The final whistle has blown — full time.', scene: 'Referee raises whistle to mouth' }
];

let mockTranscriptIndex = 0;

function confidenceFromText(timelineItem) {
  const transcriptScore = Math.min(String(timelineItem.transcript || '').length / 120, 1);
  const sceneScore = Math.min(String(timelineItem.scene || '').length / 100, 1);
  return normalizeConfidence(0.55 + transcriptScore * 0.2 + sceneScore * 0.2);
}

function normalizeWords(text) {
  return String(text || '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);
}

function asEventType(scene) {
  const normalized = String(scene || '').toLowerCase();
  if (normalized.includes('sprint') || normalized.includes('goal') || normalized.includes('shot')) return 'action';
  return 'commentary';
}

export const mockModelProvider = {
  name: 'mock',

  async inferPerception({ timelineItem }) {
    return {
      transcript: timelineItem.transcript,
      scene: timelineItem.scene,
      speaker: timelineItem.speaker,
      entities: timelineItem.entities,
      confidence: confidenceFromText(timelineItem)
    };
  },

  async inferAccessibility({ timelineItem, perception }) {
    return {
      segment_id: timelineItem.id,
      ts_start: timelineItem.ts_start,
      ts_end: timelineItem.ts_end,
      type: asEventType(perception.scene),
      text: perception.transcript,
      speaker: perception.speaker,
      entities: perception.entities,
      confidence: perception.confidence,
      audio_description: perception.scene
    };
  },

  async transcribe({ language = 'en', duration_ms = 2000 } = {}) {
    const entry = MOCK_TRANSCRIPTS[mockTranscriptIndex % MOCK_TRANSCRIPTS.length];
    mockTranscriptIndex += 1;
    const transcriptScore = Math.min(entry.transcript.length / 120, 1);
    return {
      transcript: entry.transcript,
      scene: entry.scene,
      language,
      duration_ms,
      confidence: normalizeConfidence(0.78 + transcriptScore * 0.18)
    };
  },

  async inferSignScript({ accessibility }) {
    const glossTokens = normalizeWords(accessibility.text).slice(0, 12);
    return {
      id: accessibility.segment_id,
      start: accessibility.ts_start,
      end: accessibility.ts_end,
      gloss_tokens: glossTokens,
      facial_cues: accessibility.type === 'action' ? ['INTENSE-FOCUS'] : ['NEUTRAL'],
      confidence: accessibility.confidence,
      fallback_text: accessibility.text
    };
  }
};
