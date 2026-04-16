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

    const orphans = this.sweepOrphanDirs(ttlMs);

    if (removed > 0 || orphans > 0) {
      store.log('cleanup.expired', { removed, orphans, ttlMs });
    }

    return { removed, orphans };
  },

  // Directories left behind by failed uploads (no matching job record) and older
  // than the TTL. Without this, a simple error loop can fill the disk.
  sweepOrphanDirs(ttlMs = DEFAULT_TTL_MS) {
    let swept = 0;
    let entries;
    try { entries = fs.readdirSync(UPLOADS_DIR, { withFileTypes: true }); }
    catch { return 0; }

    const now = Date.now();
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (store.jobs.has(entry.name)) continue;
      const p = path.join(UPLOADS_DIR, entry.name);
      let stat;
      try { stat = fs.statSync(p); } catch { continue; }
      if (now - stat.mtimeMs < ttlMs) continue;
      try { fs.rmSync(p, { recursive: true, force: true }); swept++; }
      catch { /* noop */ }
    }
    return swept;
  }
};
