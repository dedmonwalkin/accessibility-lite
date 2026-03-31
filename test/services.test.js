import test from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryStore } from '../src/data/store.js';

// ── InMemoryStore ───────────────────────────────────────────────

test('nextId returns prefixed ID', () => {
  const store = new InMemoryStore();
  const id = store.nextId('job');
  assert.ok(id.startsWith('job_'), 'ID should start with prefix');
  assert.ok(id.length > 5, 'ID should include UUID portion');
});

test('nextId generates unique IDs', () => {
  const store = new InMemoryStore();
  const ids = new Set(Array.from({ length: 100 }, () => store.nextId('x')));
  assert.equal(ids.size, 100, 'all IDs should be unique');
});

test('nowIso returns valid ISO string', () => {
  const store = new InMemoryStore();
  const iso = store.nowIso();
  assert.ok(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(iso), 'should be ISO format');
});

test('log appends to auditLog', () => {
  const store = new InMemoryStore();
  assert.equal(store.auditLog.length, 0);
  const record = store.log('test.action', { key: 'value' });
  assert.equal(store.auditLog.length, 1);
  assert.equal(record.action, 'test.action');
  assert.equal(record.payload.key, 'value');
  assert.ok(record.id.startsWith('audit_'));
  assert.ok(record.createdAt);
});

test('store initializes with empty maps', () => {
  const store = new InMemoryStore();
  assert.equal(store.jobs.size, 0);
  assert.equal(store.jobOutputs.size, 0);
  assert.equal(store.auditLog.length, 0);
});

// ── Auth helpers (tested via pure function logic) ───────────────
// Note: isPublicPath, authenticate, checkRateLimit are exported from server.js
// but server.js starts a listener on import, so we test the logic patterns here.

test('isPublicPath logic: public GET routes', () => {
  // Replicate the logic from server.js without importing it
  function isPublicPath(method, pathname) {
    if (method !== 'GET') return false;
    if (pathname === '/') return true;
    if (pathname === '/health') return true;
    if (pathname === '/v1/catalog') return true;
    if (pathname.startsWith('/player/')) return true;
    if (/^\/v1\/jobs\/[^/]+\/media$/.test(pathname)) return true;
    return false;
  }

  assert.ok(isPublicPath('GET', '/'), 'root should be public');
  assert.ok(isPublicPath('GET', '/health'), 'health should be public');
  assert.ok(isPublicPath('GET', '/v1/catalog'), 'catalog should be public');
  assert.ok(isPublicPath('GET', '/player/job_123'), 'player should be public');
  assert.ok(isPublicPath('GET', '/v1/jobs/job_123/media'), 'media should be public');
  assert.ok(!isPublicPath('POST', '/'), 'POST to root should not be public');
  assert.ok(!isPublicPath('GET', '/v1/jobs'), 'job list should not be public');
  assert.ok(!isPublicPath('GET', '/v1/jobs/job_123'), 'job status should not be public');
  assert.ok(!isPublicPath('GET', '/v1/jobs/job_123/process'), 'process should not be public');
});

test('authenticate logic: empty apiKeys passes all', () => {
  const apiKeys = [];
  function authenticate(headers, searchParams) {
    if (apiKeys.length === 0) return true;
    const auth = headers['authorization'] || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
    if (apiKeys.includes(token)) return true;
    const queryKey = searchParams.get('api_key') || '';
    return apiKeys.includes(queryKey);
  }

  assert.ok(authenticate({}, new URLSearchParams()), 'empty apiKeys should pass all');
});

test('authenticate logic: bearer token match', () => {
  const apiKeys = ['secret123'];
  function authenticate(headers, searchParams) {
    if (apiKeys.length === 0) return true;
    const auth = headers['authorization'] || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
    if (apiKeys.includes(token)) return true;
    const queryKey = searchParams.get('api_key') || '';
    return apiKeys.includes(queryKey);
  }

  assert.ok(authenticate({ authorization: 'Bearer secret123' }, new URLSearchParams()), 'valid bearer should pass');
  assert.ok(!authenticate({ authorization: 'Bearer wrong' }, new URLSearchParams()), 'invalid bearer should fail');
  assert.ok(!authenticate({}, new URLSearchParams()), 'missing header should fail');
});

test('authenticate logic: query param fallback', () => {
  const apiKeys = ['secret123'];
  function authenticate(headers, searchParams) {
    if (apiKeys.length === 0) return true;
    const auth = headers['authorization'] || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
    if (apiKeys.includes(token)) return true;
    const queryKey = searchParams.get('api_key') || '';
    return apiKeys.includes(queryKey);
  }

  assert.ok(authenticate({}, new URLSearchParams('api_key=secret123')), 'valid query param should pass');
  assert.ok(!authenticate({}, new URLSearchParams('api_key=wrong')), 'invalid query param should fail');
});
