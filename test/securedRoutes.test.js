import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';

let app, base;
const env = { API_KEYS: 'test-only-launch-key', RATE_LIMIT_RPM: '0', ENABLE_POSTGRES: 'false', MODEL_PROVIDER: 'mock', TRANSLATION_PROVIDER: 'mock' };
const original = Object.fromEntries(Object.keys(env).map((key) => [key, process.env[key]]));

before(async () => {
  Object.assign(process.env, env);
  app = await import('../src/server.js');
  base = `http://127.0.0.1:${await app.start(0)}`;
});

after(async () => {
  if (app?.server.listening) await app.stop();
  for (const [key, value] of Object.entries(original)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

test('secured deployment keeps the service homepage and fonts public without exposing the key', async () => {
  for (const path of ['/', '/media', '/health', '/static/fonts/atkinson-400-latin.woff2']) {
    const res = await fetch(base + path);
    assert.equal(res.status, 200, path);
    assert.ok(!(await res.text()).includes(env.API_KEYS));
  }
});

test('secured deployment rejects unauthenticated browser API and job requests', async () => {
  // A launch constraint, not a public-access fix: the browser still needs an
  // approved session design. Do not make these routes public to avoid a 401.
  for (const [method, path] of [
    ['POST', '/v1/jobs'], ['POST', '/v1/jobs/sample'],
    ['POST', '/v1/jobs/fixture/process'], ['POST', '/v1/jobs/fixture/publish'],
    ['GET', '/jobs/fixture/options'], ['GET', '/jobs/fixture/results'],
    ['GET', '/v1/jobs/fixture/progress'], ['GET', '/v1/jobs/fixture/captions.vtt'],
    ['GET', '/v1/jobs/fixture/audio-description.json'], ['GET', '/v1/jobs/fixture/sign-data.json']
  ]) {
    const res = await fetch(base + path, { method });
    assert.equal(res.status, 401, `${method} ${path}`);
    assert.equal((await res.json()).error, 'Missing or invalid API key');
  }
});

test('a valid bearer key passes auth without broadening CORS or publishing anything', async () => {
  const res = await fetch(base + '/v1/jobs/nonexistent-launch-fixture', {
    headers: { Authorization: `Bearer ${env.API_KEYS}` }
  });
  assert.equal(res.status, 404);
  assert.equal(res.headers.get('access-control-allow-origin'), null);
  await res.text();
});
