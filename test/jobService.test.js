import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

let server;
let baseUrl;

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = { method, hostname: url.hostname, port: url.port, path: url.pathname + url.search };
    const headers = {};
    let bodyStr = null;

    if (body && typeof body === 'object' && !(body instanceof Buffer)) {
      bodyStr = JSON.stringify(body);
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    options.headers = headers;
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
    const body = Buffer.concat(bodyParts.map((p) => Buffer.from(p)));

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

describe('Working Access API', () => {
  let app;

  before(async () => {
    app = await import('../src/server.js');
    // Port 0 lets the OS pick a free one — this suite used to assume 3000 and
    // silently test whatever else happened to be bound there.
    const port = await app.start(0);
    baseUrl = `http://localhost:${port}`;
  });

  after(async () => {
    await app.stop();
  });

  it('GET /health returns ok', async () => {
    const res = await request('GET', '/health');
    assert.equal(res.status, 200);
    assert.equal(res.data.status, 'ok');
  });

  it('GET / returns service homepage HTML', async () => {
    const res = await request('GET', '/');
    assert.equal(res.status, 200);
    assert.ok(res.headers['content-type'].includes('text/html'));
    assert.ok(res.data.includes('id="home-title">Nobody gets'));
  });

  it('GET /v1/catalog returns accessibility catalog', async () => {
    const res = await request('GET', '/v1/catalog');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data.output_languages));
    assert.ok(res.data.output_languages.includes('en-US'));
    assert.ok(Array.isArray(res.data.sign_languages));
    assert.ok(res.data.sign_languages.includes('ASL'));
    assert.ok(Array.isArray(res.data.sign_overlay_themes));
    assert.equal(res.data.sign_overlay_themes.length, 6);
  });

  it('GET /v1/jobs/:id returns 404 for missing job', async () => {
    const res = await request('GET', '/v1/jobs/job_nonexistent');
    assert.equal(res.status, 404);
  });

  it('rejects unsupported file type', async () => {
    const res = await multipartUpload('/v1/jobs', 'test.txt', 'hello', 'text/plain');
    assert.equal(res.status, 400);
    assert.ok(res.data.error.includes('Unsupported file type'));
  });

  it('GET /v1/jobs/:id/captions.vtt returns 404 for missing job', async () => {
    const res = await request('GET', '/v1/jobs/job_nonexistent/captions.vtt');
    assert.equal(res.status, 404);
  });
});
