import fs from 'node:fs';
import path from 'node:path';
import { store } from '../data/store.js';
import { parseUpload } from '../utils/upload.js';
import { mediaService } from './mediaService.js';
import { runJobPipeline } from './pipelineService.js';
import {
  SUPPORTED_OUTPUT_LANGUAGES,
  SUPPORTED_SIGN_LANGUAGES,
  SUPPORTED_CAPTION_STYLES,
  SUPPORTED_AUDIO_DESCRIPTION_STYLES,
  SUPPORTED_SIGN_PRESENTATION_MODES,
  SUPPORTED_UI_MODES,
  SUPPORTED_SIGN_OVERLAY_THEME_IDS
} from '../config/accessibilityCatalog.js';

const UPLOADS_DIR = path.resolve('uploads');

function normalizeList(input, allowed, fallback) {
  const values = Array.isArray(input) ? input : (input ? [input] : []);
  const valid = values.filter((v) => allowed.includes(v));
  return valid.length ? [...new Set(valid)] : [fallback];
}

function normalizeChoice(input, allowed, fallback) {
  return allowed.includes(input) ? input : fallback;
}

export const jobService = {
  async createJob(req) {
    const jobId = store.nextId('job');
    const jobDir = path.join(UPLOADS_DIR, jobId);
    await fs.promises.mkdir(jobDir, { recursive: true });

    const { fileInfo, fields } = await parseUpload(req, jobDir);

    let probeResult = { duration_ms: 0, has_video: false, has_audio: false, format: 'unknown', codec: 'unknown' };
    try {
      probeResult = await mediaService.probe(fileInfo.file_path);
    } catch (err) {
      store.log('job.probe_warning', { jobId, error: err.message });
    }

    const job = {
      id: jobId,
      status: 'pending',
      progress: 0,
      error: null,
      original_filename: fileInfo.original_filename,
      mime_type: fileInfo.mime_type,
      file_path: fileInfo.file_path,
      file_size_bytes: fileInfo.file_size_bytes,
      duration_ms: probeResult.duration_ms,
      has_video: probeResult.has_video,
      has_audio: probeResult.has_audio,
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

    store.log('job.created', { jobId, filename: job.original_filename, mimeType: job.mime_type });
    return job;
  },

  getJob(jobId) {
    return store.jobs.get(jobId) || null;
  },

  getOutputs(jobId) {
    return store.jobOutputs.get(jobId) || null;
  },

  updatePreferences(jobId, prefs = {}) {
    const job = store.jobs.get(jobId);
    if (!job) throw new Error('Job not found');
    if (job.status !== 'pending') throw new Error('Cannot update preferences after processing started');

    if (prefs.output_languages) {
      job.preferences.output_languages = normalizeList(prefs.output_languages, SUPPORTED_OUTPUT_LANGUAGES, 'en-US');
    }
    if (prefs.caption_style) {
      job.preferences.caption_style = normalizeChoice(prefs.caption_style, SUPPORTED_CAPTION_STYLES, 'standard');
    }
    if (prefs.audio_description_style) {
      job.preferences.audio_description_style = normalizeChoice(prefs.audio_description_style, SUPPORTED_AUDIO_DESCRIPTION_STYLES, 'standard');
    }
    if (prefs.sign_language) {
      job.preferences.sign_language = normalizeChoice(prefs.sign_language.toUpperCase(), SUPPORTED_SIGN_LANGUAGES, 'ASL');
    }
    if (prefs.sign_presentation_mode) {
      job.preferences.sign_presentation_mode = normalizeChoice(prefs.sign_presentation_mode, SUPPORTED_SIGN_PRESENTATION_MODES, 'avatar_2d');
    }
    if (prefs.sign_overlay_theme) {
      job.preferences.sign_overlay_theme = normalizeChoice(prefs.sign_overlay_theme, SUPPORTED_SIGN_OVERLAY_THEME_IDS, 'standard');
    }
    if (prefs.ui_mode) {
      job.preferences.ui_mode = normalizeChoice(prefs.ui_mode, SUPPORTED_UI_MODES, 'default');
    }

    job.updatedAt = store.nowIso();
    return job;
  },

  async processJob(jobId) {
    const job = store.jobs.get(jobId);
    if (!job) throw new Error('Job not found');
    if (job.status !== 'pending') throw new Error('Job already processing or complete');

    runJobPipeline(jobId).catch((err) => {
      store.log('job.pipeline_error', { jobId, error: err.message });
    });

    return job;
  }
};
