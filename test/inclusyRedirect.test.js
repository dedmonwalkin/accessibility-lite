import { test } from 'node:test';
import assert from 'node:assert/strict';
import { request } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createServiceServer } from '../src/serviceServer.js';

// Reads the values the redirect-only release actually ships, so the config
// and the behaviour it is meant to produce cannot drift apart.
const config = await readFile(new URL('../fly.inclusy-redirect.toml', import.meta.url), 'utf8');
const setting = name => config.match(new RegExp(`^\\s*${name}\\s*=\\s*"([^"]*)"`, 'm'))?.[1];

// Node's fetch can ignore Host overrides; raw HTTP exercises actual ingress headers.
const rawRequest = (url, options = {}) => new Promise((resolve, reject) => {
  const req = request(url, options, res => {
    let body = '';
    res.setEncoding('utf8');
    res.on('data', chunk => { body += chunk; });
    res.on('error', reject);
    res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
  });
  req.on('error', reject);
  req.end();
});

test('inclusy redirect config targets the retired app, the service image and the canonical site', () => {
  assert.equal(setting('app'), 'inclusy');
  assert.equal(setting('image'), 'registry.fly.io/whakauru:a47097c');
  assert.equal(setting('SITE_URL'), 'https://workingaccess.org');
  assert.deepEqual(setting('REDIRECT_HOSTS').split(','), ['inclusy.org', 'www.inclusy.org', 'inclusy.fly.dev']);
  assert.doesNotMatch(config, /MODEL_PROVIDER|TRANSLATION_PROVIDER|ENABLE_POSTGRES|MAX_UPLOAD_MB/);
  assert.doesNotMatch(config, /dockerfile\s*=/);
});

test('retired Inclusy hosts redirect to Working Access and no longer accept media requests', async () => {
  const server = createServiceServer({ redirectHosts: setting('REDIRECT_HOSTS') });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const host of setting('REDIRECT_HOSTS').split(',')) {
      for (const path of ['/', '/player/abc?lang=fr', '/jobs/abc/options', '/v1/jobs/abc/media']) {
        for (const method of ['GET', 'HEAD']) {
          const res = await rawRequest(base + path, { method, headers: { Host: host } });
          assert.equal(res.status, 308, `${method} ${host}${path}`);
          assert.equal(res.headers.location, `https://workingaccess.org${path}`);
          assert.equal(res.headers['cache-control'], 'no-store');
          assert.doesNotMatch(res.body, /Inclusy|<!doctype/i);
        }
      }
      for (const path of ['/v1/jobs', '/v1/jobs/sample']) {
        const res = await rawRequest(base + path, { method: 'POST', headers: { Host: host } });
        assert.equal(res.status, 404, `POST ${host}${path}`);
        assert.equal(res.headers.location, undefined);
      }
      const health = await rawRequest(base + '/health', { headers: { Host: host } });
      assert.equal(health.status, 200);
      assert.equal(health.body, '{"status":"ok","mode":"service-only"}');
    }
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
