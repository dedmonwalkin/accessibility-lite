import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

// Static imports would run before any module code here, so env vars set at
// the top of this file wouldn't reach src/server.js. Dynamic import inside
// the `before` hook is the reliable way to parameterise the test server.
let baseUrl;
let server;
let start;

function request(method, path, body = null, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const headers = { ...extraHeaders };
    let bodyStr = null;

    if (body && typeof body === 'object' && !(body instanceof Buffer)) {
      bodyStr = JSON.stringify(body);
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const options = { method, hostname: url.hostname, port: url.port, path: url.pathname + url.search, headers };
    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        let data = raw;
        try { data = JSON.parse(raw); } catch {}
        resolve({ status: res.statusCode, headers: res.headers, data });
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

function multipartUpload(path, filename, content, mimeType) {
  return new Promise((resolve, reject) => {
    const boundary = '----TestBoundary' + Date.now();
    const url = new URL(path, baseUrl);

    const bodyParts = [
      `--${boundary}\r\n`,
      `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n`,
      `Content-Type: ${mimeType}\r\n\r\n`,
      content,
      `\r\n--${boundary}--\r\n`
    ];
    const body = Buffer.concat(bodyParts.map((p) => (Buffer.isBuffer(p) ? p : Buffer.from(p))));

    const options = {
      method: 'POST',
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length
      }
    };

    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        let data = raw;
        try { data = JSON.parse(raw); } catch {}
        resolve({ status: res.statusCode, data });
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

describe('Accessibility Lite API', () => {
  before(async () => {
    process.env.AUTH_DISABLED = 'true';
    process.env.PORT = process.env.PORT || '3100';
    const mod = await import('../src/server.js');
    start = mod.start;
    server = mod.server;
    await start();
    baseUrl = `http://localhost:${process.env.PORT}`;
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it('GET /health returns ok', async () => {
    const res = await request('GET', '/health');
    assert.equal(res.status, 200);
    assert.equal(res.data.status, 'ok');
  });

  it('GET / returns upload page HTML', async () => {
    const res = await request('GET', '/');
    assert.equal(res.status, 200);
    assert.ok(res.headers['content-type'].includes('text/html'));
    assert.ok(res.data.includes('Accessibility Lite'));
  });

  it('GET /cookies returns cookie policy', async () => {
    const res = await request('GET', '/cookies');
    assert.equal(res.status, 200);
    assert.ok(res.data.includes('Cookie policy'));
  });

  it('GET /privacy returns privacy notice', async () => {
    const res = await request('GET', '/privacy');
    assert.equal(res.status, 200);
    assert.ok(res.data.includes('Privacy notice'));
  });

  it('sets security headers on all responses', async () => {
    const res = await request('GET', '/');
    assert.equal(res.headers['x-content-type-options'], 'nosniff');
    assert.equal(res.headers['x-frame-options'], 'SAMEORIGIN');
    assert.ok(res.headers['content-security-policy']);
  });

  it('GET /v1/catalog returns accessibility catalog', async () => {
    const res = await request('GET', '/v1/catalog');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data.output_languages));
    assert.ok(res.data.output_languages.includes('en-US'));
    assert.ok(Array.isArray(res.data.sign_languages));
    assert.ok(res.data.sign_languages.includes('ASL'));
  });

  it('rejects malformed job id as 404 (no path traversal)', async () => {
    const res = await request('GET', '/v1/jobs/..%2Fetc%2Fpasswd');
    assert.equal(res.status, 404);
  });

  it('rejects job id that does not match pattern', async () => {
    const res = await request('GET', '/v1/jobs/job_nonexistent');
    assert.equal(res.status, 404);
  });

  it('rejects unsupported file type at upload', async () => {
    const res = await multipartUpload('/v1/jobs', 'test.txt', 'hello', 'text/plain');
    assert.equal(res.status, 400);
    assert.ok(res.data.error.includes('Unsupported file type'));
  });

  it('rejects mime/content mismatch (magic-byte sniff)', async () => {
    // Declared as audio/wav but bytes are not a RIFF WAVE header.
    const res = await multipartUpload('/v1/jobs', 'fake.wav', 'Not a real WAV file payload', 'audio/wav');
    assert.equal(res.status, 400);
    assert.ok(/do not match declared type|Unsupported|too short/.test(res.data.error));
  });

  it('GET /v1/jobs/:id/captions.vtt returns 404 for missing (valid-shape) job', async () => {
    const fakeId = 'job_00000000-0000-0000-0000-000000000000';
    const res = await request('GET', `/v1/jobs/${fakeId}/captions.vtt`);
    assert.equal(res.status, 404);
  });

  it('rejects oversize JSON bodies with 413', async () => {
    // Build a body > 1MB
    const big = { filler: 'x'.repeat(1024 * 1024 + 10) };
    const fakeId = 'job_00000000-0000-0000-0000-000000000000';
    const res = await request('POST', `/v1/jobs/${fakeId}/process`, big);
    assert.equal(res.status, 413);
  });
});
