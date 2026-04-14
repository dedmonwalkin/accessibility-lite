import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { store } from '../data/store.js';
import { mediaService } from './mediaService.js';

const execFileAsync = promisify(execFile);
const UPLOADS_DIR = path.resolve('uploads');
const SAMPLE_DURATION_S = 10;

export const sampleService = {
  async createSampleJob() {
    const jobId = store.nextId('job');
    const jobDir = path.join(UPLOADS_DIR, jobId);
    await fs.promises.mkdir(jobDir, { recursive: true });

    const filePath = path.join(jobDir, 'sample.wav');

    // Generate a short WAV with ffmpeg: 10 seconds of gentle sine wave tones
    // simulating speech-like audio for demo purposes
    await execFileAsync('ffmpeg', [
      '-f', 'lavfi',
      '-i', `sine=frequency=220:duration=${SAMPLE_DURATION_S}`,
      '-af', 'volume=0.3,afade=t=in:d=1,afade=t=out:st=8:d=2',
      '-ar', '16000',
      '-ac', '1',
      '-y',
      filePath
    ]);

    const stat = await fs.promises.stat(filePath);

    let probeResult = { duration_ms: SAMPLE_DURATION_S * 1000, has_video: false, has_audio: true, format: 'wav', codec: 'pcm_s16le' };
    try {
      probeResult = await mediaService.probe(filePath);
    } catch {
      // Use defaults above
    }

    const job = {
      id: jobId,
      status: 'pending',
      progress: 0,
      error: null,
      original_filename: 'sample-audio.wav',
      mime_type: 'audio/wav',
      file_path: filePath,
      file_size_bytes: stat.size,
      duration_ms: probeResult.duration_ms || SAMPLE_DURATION_S * 1000,
      has_video: false,
      has_audio: true,
      preferences: {
        output_languages: ['en-US'],
        caption_style: 'standard',
        audio_description_style: 'standard',
        sign_language: 'ASL',
        sign_presentation_mode: 'avatar_2d',
        sign_overlay_theme: 'standard',
        ui_mode: 'default'
      },
      createdAt: store.nowIso(),
      updatedAt: store.nowIso(),
      completedAt: null
    };

    store.jobs.set(jobId, job);
    store.jobOutputs.set(jobId, {
      events: [],
      captions: [],
      captionTranslations: {},
      audioDescription: [],
      signScript: [],
      signCards: [],
      chunks_processed: 0,
      chunks_total: 0
    });

    store.log('job.sample_created', { jobId });
    return job;
  }
};
