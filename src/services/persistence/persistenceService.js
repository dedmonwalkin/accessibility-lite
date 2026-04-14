import { store } from '../../data/store.js';
import { PostgresPersistence } from './postgresPersistence.js';

const SNAPSHOT_MAX_RETRIES = 3;

class NoopPersistence {
  async init() { return { enabled: false, reason: 'noop' }; }
  async loadLatest() { return { loaded: false, reason: 'noop' }; }
  async snapshot() { return { saved: false, reason: 'noop' }; }
  async ping() { throw new Error('noop'); }
  async close() {}
}

let active = new NoopPersistence();

export const persistenceService = {
  async configure(runtime) {
    if (runtime.enablePostgres) {
      const postgres = new PostgresPersistence({ databaseUrl: runtime.databaseUrl });
      const status = await postgres.init();
      if (status.enabled) {
        active = postgres;
      } else {
        store.log('persistence.postgres.disabled', { reason: status.reason });
      }
      return status;
    }

    store.log('persistence.disabled', { reason: 'ENABLE_POSTGRES=false' });
    active = new NoopPersistence();
    return active.init();
  },

  async loadLatest() { return active.loadLatest(); },

  async snapshot(reason) {
    for (let attempt = 1; attempt <= SNAPSHOT_MAX_RETRIES; attempt++) {
      try {
        return await active.snapshot(reason);
      } catch (error) {
        store.log('persistence.snapshot.retry', { attempt, maxRetries: SNAPSHOT_MAX_RETRIES, error: error.message });
        if (attempt === SNAPSHOT_MAX_RETRIES) {
          store.log('persistence.snapshot.failed', { reason, error: error.message });
          return { saved: false, reason: 'retries_exhausted', error: error.message };
        }
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
      }
    }
  },

  async ping() {
    if (!active.client) throw new Error('database not configured');
    await active.client.query('SELECT 1');
  },

  async close() { return active.close(); }
};
