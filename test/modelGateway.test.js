import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createGatewayServer } from '../model-gateway/server.js';

const PORT = 4111;
const AUTH_PORT = 4112;

function request(port, method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request({
      method,
      hostname: 'localhost',
      port,
      path,
      headers: {
        ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
        ...headers
      }
    }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        let data = Buffer.concat(chunks).toString('utf8');
        try { data = JSON.parse(data); } catch {}
        resolve({ status: res.statusCode, data });
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

describe('Model gateway', () => {
  let server;
  let authServer;

  before(async () => {
    server = createGatewayServer({ backend: 'mock', apiKey: '' });
    authServer = createGatewayServer({ backend: 'mock', apiKey: 'secret-key' });
    await new Promise((r) => server.listen(PORT, r));
    await new Promise((r) => authServer.listen(AUTH_PORT, r));
  });

  after(async () => {
    await new Promise((r) => server.close(r));
    await new Promise((r) => authServer.close(r));
  });

  it('GET /health reports backend', async () => {
    const res = await request(PORT, 'GET', '/health');
    assert.equal(res.status, 200);
    assert.equal(res.data.service, 'model-gateway');
    assert.equal(res.data.backend, 'mock');
  });

  it('transcribe returns contract shape with mock label', async () => {
    const res = await request(PORT, 'POST', '/v1/models/transcribe', {
      audio_base64: Buffer.from('fake').toString('base64'),
      format: 'wav',
      language: 'en-US',
      duration_ms: 5000
    });
    assert.equal(res.status, 200);
    assert.equal(typeof res.data.transcript, 'string');
    assert.ok(res.data.transcript.startsWith('[mock]'));
    assert.equal(res.data._backend, 'mock');
    assert.equal(res.data.confidence, 0);
    assert.equal(res.data.duration_ms, 5000);
  });

  it('perception passes through caller data without fabrication', async () => {
    const timelineItem = {
      transcript: 'Motion carries five to two.',
      scene: '',
      speaker: 'council-president',
      entities: ['motion']
    };
    const res = await request(PORT, 'POST', '/v1/models/perception', { timelineItem });
    assert.equal(res.status, 200);
    assert.equal(res.data.transcript, timelineItem.transcript);
    assert.equal(res.data.scene, '');
    assert.equal(res.data.speaker, 'council-president');
    assert.ok(res.data.confidence >= 0 && res.data.confidence <= 1);
  });

  it('accessibility maps perception into caption segment shape', async () => {
    const timelineItem = { id: 'seg_1', ts_start: 0, ts_end: 5000 };
    const perception = { transcript: 'Roll call vote begins.', scene: '', speaker: 'clerk', entities: [], confidence: 0.9 };
    const res = await request(PORT, 'POST', '/v1/models/accessibility', { timelineItem, perception });
    assert.equal(res.status, 200);
    assert.equal(res.data.segment_id, 'seg_1');
    assert.equal(res.data.text, 'Roll call vote begins.');
    assert.equal(res.data.audio_description, '');
    assert.equal(res.data.confidence, 0.9);
  });

  it('translate returns 501 when no translator is configured', async () => {
    const res = await request(PORT, 'POST', '/v1/translate', { q: 'hello', target: 'es' });
    assert.equal(res.status, 501);
  });

  it('unknown route returns 404', async () => {
    const res = await request(PORT, 'POST', '/v1/models/nope', {});
    assert.equal(res.status, 404);
  });

  it('rejects requests without bearer token when GATEWAY_API_KEY is set', async () => {
    const res = await request(AUTH_PORT, 'POST', '/v1/models/transcribe', { audio_base64: 'aGk=' });
    assert.equal(res.status, 401);
  });

  it('accepts requests with correct bearer token', async () => {
    const res = await request(AUTH_PORT, 'POST', '/v1/models/transcribe',
      { audio_base64: 'aGk=' },
      { Authorization: 'Bearer secret-key' });
    assert.equal(res.status, 200);
    assert.equal(res.data._backend, 'mock');
  });

  it('health stays public even with auth enabled', async () => {
    const res = await request(AUTH_PORT, 'GET', '/health');
    assert.equal(res.status, 200);
  });
});
