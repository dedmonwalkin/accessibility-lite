import crypto from 'node:crypto';

export class InMemoryStore {
  constructor() {
    this.jobs = new Map();
    this.jobOutputs = new Map();
    /** embed_id -> { id, job_id, createdAt }. Published results outlive the
     *  24h job TTL, because someone's site depends on them. */
    this.published = new Map();
    this.auditLog = [];
  }

  /** Unguessable, URL-safe, and short enough to paste into a script tag. */
  embedToken() {
    return crypto.randomBytes(16).toString('base64url');
  }

  nextId(prefix) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  nowIso() {
    return new Date().toISOString();
  }

  log(action, payload = {}) {
    const record = {
      id: this.nextId('audit'),
      action,
      payload,
      createdAt: this.nowIso()
    };
    this.auditLog.push(record);
    console.log(JSON.stringify({ ts: record.createdAt, action, ...payload }));
    return record;
  }
}

export const store = new InMemoryStore();
