import fs from 'node:fs';
import path from 'node:path';
import { store } from '../data/store.js';

const UPLOADS_DIR = path.resolve('uploads');
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export const cleanupService = {
  /**
   * Expiry has two tiers.
   *
   * Unpublished jobs are removed whole at 24h, as before. Published jobs lose
   * their uploaded media on the same schedule — that's the expensive part, and
   * embeds never serve it — but keep their job record and outputs, because
   * someone's website is loading those captions.
   */
  run(ttlMs = DEFAULT_TTL_MS) {
    const now = Date.now();
    const publishedJobIds = new Set([...store.published.values()].map((p) => p.job_id));
    let removed = 0;
    let mediaReclaimed = 0;

    for (const [jobId, job] of store.jobs) {
      const createdAt = new Date(job.createdAt).getTime();
      if (now - createdAt < ttlMs) continue;

      const jobDir = path.join(UPLOADS_DIR, jobId);
      try {
        fs.rmSync(jobDir, { recursive: true, force: true });
      } catch {
        // Directory may already be gone
      }

      if (publishedJobIds.has(jobId)) {
        if (!job.media_expired) {
          job.media_expired = true;
          mediaReclaimed++;
        }
        continue;
      }

      store.jobs.delete(jobId);
      store.jobOutputs.delete(jobId);
      removed++;
    }

    if (removed > 0 || mediaReclaimed > 0) {
      store.log('cleanup.expired', { removed, mediaReclaimed, ttlMs });
    }

    return { removed, mediaReclaimed };
  }
};
