import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { request } from 'node:http';
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
  assert.match(html, /mailto:bob@workingaccess\.org/);
  assert.doesNotMatch(html, /mailto:(?:hello|aoda|accessibility)@/);
  assert.match(html, /Working Access/);
  assert.match(html, /id="projectPlanner"/);
  assert.match(html, /Media accessibility planning/);
  assert.doesNotMatch(html, /href="\/media|href="\/embed|id="pipeline"|Media preview/);
  assert.match(html, /id="main" tabindex="-1"/);
});

test('configured old hosts redirect safely while health and write restrictions remain intact', async () => {
  const aliasServer = createServiceServer({
    redirectHosts: 'whakauru.com, www.whakauru.com, whakauru.fly.dev, www.workingaccess.org, workingaccess.org'
  });
  await new Promise(resolve => aliasServer.listen(0, '127.0.0.1', resolve));
  const aliasBase = `http://127.0.0.1:${aliasServer.address().port}`;
  // Node's fetch can ignore Host overrides; raw HTTP exercises actual ingress headers.
  const aliasFetch = (url, options = {}) => new Promise((resolve, reject) => {
    const req = request(url, options, res => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { body += chunk; });
      res.on('error', reject);
      res.on('end', () => resolve({
        status: res.statusCode,
        headers: new Headers(res.headers),
        text: async () => body
      }));
    });
    req.on('error', reject);
    req.end();
  });
  try {
    for (const host of ['whakauru.com', 'WWW.WHAKAURU.COM:443', 'whakauru.com.', 'whakauru.fly.dev', 'www.workingaccess.org']) {
      for (const method of ['GET', 'HEAD']) {
        const res = await aliasFetch(aliasBase + '/?source=old', { method, headers: { Host: host } });
        assert.equal(res.status, 308, host);
        assert.equal(res.headers.get('location'), 'https://workingaccess.org/?source=old');
        assert.equal(res.headers.get('cache-control'), 'no-store');
        const body = await res.text();
        assert.doesNotMatch(body, /<!doctype|Whakauru/);
        if (method === 'HEAD') assert.equal(body, '');
      }
    }
    for (const path of ['/static/fonts/OFL.txt', '//evil.example/path']) {
      const res = await aliasFetch(aliasBase + path, { headers: { Host: 'whakauru.com' } });
      assert.equal(res.status, 308);
      assert.equal(new URL(res.headers.get('location')).origin, 'https://workingaccess.org');
      await res.text();
    }
    for (const host of ['workingaccess.org', 'preview.example.org', 'whakauru.com.evil.example']) {
      const res = await aliasFetch(aliasBase, { headers: { Host: host, 'X-Forwarded-Host': 'whakauru.com' } });
      assert.equal(res.status, 200, host);
      assert.equal(res.headers.get('location'), null);
      await res.text();
    }
    const health = await aliasFetch(aliasBase + '/health', { headers: { Host: 'whakauru.com' } });
    assert.equal(health.status, 200);
    await health.text();
    for (const [path, status] of [['/', 405], ['/v1/jobs', 404]]) {
      const res = await aliasFetch(aliasBase + path, { method: 'POST', headers: { Host: 'whakauru.com' } });
      assert.equal(res.status, status);
      assert.equal(res.headers.get('location'), null);
      await res.text();
    }
  } finally {
    await new Promise(resolve => aliasServer.close(resolve));
  }
});

test('unknown service pages use the new identity without exposing media navigation', async () => {
  const res = await fetch(base + '/missing-page');
  assert.equal(res.status, 404);
  const html = await res.text();
  assert.match(html, /<title>Page not found.*Working Access<\/title>/);
  assert.match(html, /Return to Working Access/);
  assert.doesNotMatch(html, /Whakauru|whakauru\.com|href="\/media|href="\/embed/);
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
