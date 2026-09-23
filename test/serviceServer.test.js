import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServiceServer } from '../src/serviceServer.js';

let server, base;
before(async () => {
  server = createServiceServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { await new Promise(resolve => server.close(resolve)); });

test('service-only homepage retains enquiries and guide, without media navigation', async () => {
  const res = await fetch(base);
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.match(html, /mailto:bob@whakauru\.com/);
  assert.doesNotMatch(html, /mailto:(?:hello|aoda|accessibility)@/);
  assert.match(html, /Whakauru/);
  assert.match(html, /id="projectPlanner"/);
  assert.match(html, /Media accessibility planning/);
  assert.doesNotMatch(html, /href="\/media|href="\/embed|id="pipeline"|Media preview/);
  assert.match(html, /id="main" tabindex="-1"/);
});

test('service health does not require persistence or provider setup', async () => {
  const res = await fetch(base + '/health');
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { status: 'ok', mode: 'service-only' });
});

test('service-only boundary denies every media surface regardless of method or bearer key', async () => {
  const paths = ['/media', '/embed', '/embed.js', '/embed/fixture', '/player/fixture',
    '/v1/catalog', '/v1/jobs', '/v1/jobs/sample', '/v1/jobs/fixture/media',
    '/v1/jobs/fixture/process', '/v1/jobs/fixture/publish', '/v1/jobs/fixture/progress',
    '/v1/jobs/fixture/captions.vtt', '/v1/embed/fixture/manifest.json',
    '/jobs/fixture/options', '/jobs/fixture/results'];
  for (const method of ['GET', 'HEAD', 'POST', 'OPTIONS']) {
    for (const path of paths) {
      const res = await fetch(base + path + '?api_key=test-only', {
        method, headers: { Authorization: 'Bearer test-only' }
      });
      assert.equal(res.status, 404, `${method} ${path}`);
      assert.equal(res.headers.get('access-control-allow-origin'), null);
      const body = await res.text();
      assert.doesNotMatch(body, /href="\/media|href="\/embed/);
      if (method === 'HEAD') assert.equal(body, '');
    }
  }
});

test('service static routes use an explicit asset allowlist', async () => {
  for (const file of ['fonts/OFL.txt', 'fonts/atkinson-400-latin.woff2',
    'fonts/atkinson-700-latin.woff2', 'fonts/atkinson-400-latin-ext.woff2', 'fonts/atkinson-700-latin-ext.woff2']) {
    const res = await fetch(base + '/static/' + file);
    assert.equal(res.status, 200, file);
    assert.ok((await res.arrayBuffer()).byteLength > 0);
  }
  for (const path of ['/static/../package.json', '/static/%2e%2e%2fpackage.json',
    '/static/%2e%2e%2fuploads/test.wav', '/static/unknown.js', '/static/og.png', '/uploads/test.wav', '/src/server.js']) {
    const res = await fetch(base + path);
    assert.equal(res.status, 404, path);
    await res.text();
  }
});

test('service responds correctly to HEAD and disallows writes to allowed resources', async () => {
  const get = await fetch(base);
  const head = await fetch(base, { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(head.headers.get('content-length'), get.headers.get('content-length'));
  assert.equal(await head.text(), '');
  await get.text();
  for (const path of ['/', '/health', '/static/fonts/OFL.txt']) {
    const res = await fetch(base + path, { method: 'POST', body: 'not stored' });
    assert.equal(res.status, 405);
    assert.equal(res.headers.get('allow'), 'GET, HEAD');
    await res.text();
  }
});

test('service CSP permits only its exact inline scripts and blocks network/form submission', async () => {
  const res = await fetch(base);
  const csp = res.headers.get('content-security-policy');
  const html = await res.text();
  assert.match(csp, /connect-src 'none'/);
  assert.match(csp, /form-action 'none'/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.doesNotMatch(csp, /script-src[^;]*'unsafe-inline'/);
  for (const [, script] of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
    assert.ok(csp.includes(`'sha256-${createHash('sha256').update(script).digest('base64')}'`));
  }
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(res.headers.get('referrer-policy'), 'no-referrer');
});
