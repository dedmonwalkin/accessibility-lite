import crypto from 'node:crypto';

export class InMemoryStore {
  constructor() {
    this.jobs = new Map();
    this.jobOutputs = new Map();
    this.auditLog = [];
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
