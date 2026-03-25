import { EventEmitter } from 'node:events';
import { store } from '../data/store.js';
import { createModelProvider } from './providers/modelProvider.js';
import { createTranslationProvider } from './providers/translationProvider.js';
import { mediaService } from './mediaService.js';
import { runtimeConfig } from '../config/runtime.js';

export const jobEmitter = new EventEmitter();
jobEmitter.setMaxListeners(100);

const translationProvider = createTranslationProvider();

function toCaptionSegment(event) {
  return {
    id: event.segment_id,
    start: event.ts_start,
    end: event.ts_end,
    start_ms: event.start_ms,
    end_ms: event.end_ms,
    text: event.text,
    speaker: event.speaker,
    confidence: event.confidence
  };
}

function toAudioDescriptionSegment(event) {
  return {
    id: event.segment_id,
    start: event.ts_start,
    end: event.ts_end,
    start_ms: event.start_ms,
    end_ms: event.end_ms,
    text: `Audio description: ${event.audio_description}`,
    confidence: event.confidence
  };
}

function buildSignCards(signScript = []) {
  return signScript.map((segment) => ({
    id: segment.id,
    start: segment.start,
    end: segment.end,
    start_ms: segment.start_ms,
    end_ms: segment.end_ms,
    signs: segment.gloss_tokens.map((token) => ({
      token,
      visual_hint: `BOOK_SIGN:${token}`
    })),
    confidence: segment.confidence,
    fallback_text: segment.fallback_text
  }));
}

async function buildCaptionTranslations(captions, outputLanguages) {
  const map = {};
  await Promise.all(
    outputLanguages.map(async (language) => {
      map[language] = await Promise.all(
        captions.map(async (segment) => ({
          ...segment,
          text: await translationProvider.translate(segment.text, language)
        }))
      );
    })
  );
  return map;
}

export async function runJobPipeline(jobId) {
  const job = store.jobs.get(jobId);
  const outputs = store.jobOutputs.get(jobId);
  if (!job || !outputs) throw new Error('Job not found');

  const config = runtimeConfig();
  const provider = createModelProvider({ provider: config.modelProvider });

  try {
    job.status = 'processing';
    job.progress = 0;
    job.updatedAt = store.nowIso();

    emitProgress(jobId, 0, 'Extracting audio...');

    const audioPath = job.file_path.replace(/\.[^.]+$/, '.wav');
    if (job.has_audio) {
      await mediaService.extractAudio(job.file_path, audioPath);
    } else {
      throw new Error('Uploaded file has no audio track');
    }

    emitProgress(jobId, 5, 'Splitting audio into chunks...');

    const chunks = await mediaService.chunkAudio(audioPath, config.chunkDurationMs);
    const totalChunks = chunks.length;
    outputs.chunks_total = totalChunks;

    const events = [];
    const signScript = [];

    for (let i = 0; i < totalChunks; i++) {
      const chunk = chunks[i];
      const audio_base64 = await mediaService.readAsBase64(chunk.path);

      const transcription = await provider.transcribe({
        audio_base64,
        format: 'wav',
        language: job.preferences.output_languages?.[0]?.split('-')[0] || 'en',
        duration_ms: chunk.duration_ms
      });

      const timelineItem = {
        id: `seg_${i + 1}`,
        ts_start: new Date(chunk.offset_ms).toISOString(),
        ts_end: new Date(chunk.offset_ms + chunk.duration_ms).toISOString(),
        start_ms: chunk.offset_ms,
        end_ms: chunk.offset_ms + chunk.duration_ms,
        transcript: transcription.transcript,
        scene: transcription.scene || '',
        speaker: 'unknown',
        entities: []
      };

      const perception = await provider.inferPerception({ timelineItem });
      const accessibility = await provider.inferAccessibility({ timelineItem, perception });
      accessibility.start_ms = chunk.offset_ms;
      accessibility.end_ms = chunk.offset_ms + chunk.duration_ms;

      const sign = await provider.inferSignScript({ accessibility, timelineItem });
      sign.start_ms = chunk.offset_ms;
      sign.end_ms = chunk.offset_ms + chunk.duration_ms;

      events.push(accessibility);
      signScript.push(sign);
      outputs.chunks_processed = i + 1;

      const percent = Math.round(10 + ((i + 1) / totalChunks) * 80);
      emitProgress(jobId, percent, `Processing chunk ${i + 1}/${totalChunks}`);
    }

    emitProgress(jobId, 92, 'Building translations...');

    const captions = events.map(toCaptionSegment);
    const audioDescription = events.map(toAudioDescriptionSegment);
    const captionTranslations = await buildCaptionTranslations(
      captions,
      job.preferences.output_languages || ['en-US']
    );
    const signCards = buildSignCards(signScript);

    outputs.events = events;
    outputs.captions = captions;
    outputs.captionTranslations = captionTranslations;
    outputs.audioDescription = audioDescription;
    outputs.signScript = signScript;
    outputs.signCards = signCards;

    job.status = 'complete';
    job.progress = 100;
    job.completedAt = store.nowIso();
    job.updatedAt = store.nowIso();

    emitProgress(jobId, 100, 'Complete');
    jobEmitter.emit(`job:${jobId}`, { type: 'complete', job_id: jobId });

    store.log('job.completed', { jobId, segments: captions.length });
  } catch (err) {
    job.status = 'error';
    job.error = err.message;
    job.updatedAt = store.nowIso();

    emitProgress(jobId, -1, err.message);
    jobEmitter.emit(`job:${jobId}`, { type: 'error', job_id: jobId, message: err.message });

    store.log('job.error', { jobId, error: err.message });
  }
}

function emitProgress(jobId, percent, step) {
  const job = store.jobs.get(jobId);
  if (job && percent >= 0) job.progress = percent;
  jobEmitter.emit(`job:${jobId}`, { type: 'progress', job_id: jobId, percent, step });
}
