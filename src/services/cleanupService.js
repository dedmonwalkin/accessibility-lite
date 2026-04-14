import fs from 'node:fs';
import path from 'node:path';
import { store } from '../data/store.js';

const UPLOADS_DIR = path.resolve('uploads');
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export const cleanupService = {
  run(ttlMs = DEFAULT_TTL_MS) {
    const now = Date.now();
    let removed = 0;

    for (const [jobId, job] of store.jobs) {
      const createdAt = new Date(job.createdAt).getTime();
      if (now - createdAt < ttlMs) continue;

      // Remove upload files
      const jobDir = path.join(UPLOADS_DIR, jobId);
      try {
        fs.rmSync(jobDir, { recursive: true, force: true });
      } catch {
        // Directory may already be gone
      }

      store.jobs.delete(jobId);
      store.jobOutputs.delete(jobId);
      removed++;
    }

    if (removed > 0) {
      store.log('cleanup.expired', { removed, ttlMs });
    }

    return { removed };
  }
};
