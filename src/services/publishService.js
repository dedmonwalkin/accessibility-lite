import { store } from '../data/store.js';
import { SITE_URL } from '../ui/layout.js';

/**
 * Publishing turns a job into a permanent embed.
 *
 * Two things make this cheap enough to keep forever: the embed serves only
 * caption/description/sign artifacts (kilobytes of text, never the media file),
 * and the uploaded media is still deleted on the normal 24h schedule. See
 * cleanupService.
 */
export const publishService = {
  publish(jobId) {
    const job = store.jobs.get(jobId);
    if (!job) throw new Error('Job not found');
    if (job.status !== 'complete') throw new Error('Job is not finished processing');

    const existing = [...store.published.values()].find((p) => p.job_id === jobId);
    if (existing) return this.describe(existing);

    const record = {
      id: store.embedToken(),
      job_id: jobId,
      createdAt: store.nowIso()
    };
    store.published.set(record.id, record);
    job.published_embed_id = record.id;

    store.log('embed.published', { jobId, embedId: record.id });
    return this.describe(record);
  },

  describe(record) {
    const job = store.jobs.get(record.job_id);
    const language = job?.preferences?.output_languages?.[0] || 'en-US';
    const signLanguage = job?.preferences?.sign_language || 'ASL';

    return {
      embed_id: record.id,
      created_at: record.createdAt,
      snippet: [
        '<video src="YOUR-VIDEO.mp4" controls></video>',
        `<script src="${SITE_URL}/embed.js"`,
        `        data-inclusy="${record.id}"`,
        `        data-lang="${language}"`,
        `        data-sign="${signLanguage}"></script>`
      ].join('\n'),
      iframe: `<iframe src="${SITE_URL}/embed/${record.id}?src=YOUR-VIDEO-URL" width="100%" height="480" allowfullscreen title="Accessible player"></iframe>`
    };
  },

  resolve(embedId) {
    const record = store.published.get(embedId);
    if (!record) return null;
    const job = store.jobs.get(record.job_id);
    const outputs = store.jobOutputs.get(record.job_id);
    if (!job || !outputs) return null;
    return { record, job, outputs };
  },

  isPublished(jobId) {
    return [...store.published.values()].some((p) => p.job_id === jobId);
  }
};
