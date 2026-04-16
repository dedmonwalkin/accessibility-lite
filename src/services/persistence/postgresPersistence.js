import { store } from '../../data/store.js';
import { exportState, importState } from './stateSerializer.js';
import { runtimeConfig } from '../../config/runtime.js';

export class PostgresPersistence {
  constructor({ databaseUrl }) {
    this.databaseUrl = databaseUrl;
    this.client = null;
    this.enabled = false;
  }

  async init() {
    if (!this.databaseUrl) {
      return { enabled: false, reason: 'DATABASE_URL missing' };
    }

    let pg;
    try {
      pg = await import('pg');
    } catch {
      return { enabled: false, reason: 'pg package not installed' };
    }

    const { Client } = pg;
    this.client = new Client({ connectionString: this.databaseUrl });
    await this.client.connect();

    await this.client.query(`
      CREATE TABLE IF NOT EXISTS app_state_snapshots (
        id BIGSERIAL PRIMARY KEY,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        reason TEXT NOT NULL,
        state JSONB NOT NULL
      );
    `);

    this.enabled = true;
    store.log('persistence.postgres.ready', {});
    return { enabled: true, reason: 'connected' };
  }

  async loadLatest() {
    if (!this.enabled) return { loaded: false, reason: 'disabled' };

    const result = await this.client.query(
      'SELECT id, created_at, state FROM app_state_snapshots ORDER BY id DESC LIMIT 1'
    );

    if (!result.rows.length) {
      return { loaded: false, reason: 'no_snapshots' };
    }

    const row = result.rows[0];
    importState(row.state);
    store.log('persistence.postgres.loaded', { snapshotId: row.id, createdAt: row.created_at });
    return { loaded: true, snapshotId: row.id, createdAt: row.created_at };
  }

  async snapshot(reason = 'manual') {
    if (!this.enabled) return { saved: false, reason: 'disabled' };

    const state = exportState();
    const result = await this.client.query(
      'INSERT INTO app_state_snapshots (reason, state) VALUES ($1, $2) RETURNING id, created_at',
      [reason, state]
    );

    const row = result.rows[0];
    store.log('persistence.postgres.snapshot', { snapshotId: row.id, reason });

    // Prune old snapshots so the JSONB table doesn't grow forever. Default
    // is keep last 20; configurable via SNAPSHOT_RETENTION. 0 disables prune.
    const retention = runtimeConfig().snapshotRetention;
    if (retention > 0) {
      try {
        const pruned = await this.client.query(
          'DELETE FROM app_state_snapshots WHERE id NOT IN (SELECT id FROM app_state_snapshots ORDER BY id DESC LIMIT $1)',
          [retention]
        );
        if (pruned.rowCount > 0) {
          store.log('persistence.postgres.pruned', { deleted: pruned.rowCount, retention });
        }
      } catch (err) {
        // Prune failures are non-fatal — snapshot already saved.
        store.log('persistence.postgres.prune_failed', { error: err.message });
      }
    }

    return { saved: true, snapshotId: row.id, createdAt: row.created_at, reason };
  }

  async close() {
    if (!this.client) return;
    await this.client.end();
  }
}
