import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { resolveStaticPath } from '../src/server.js';
import { safeMediaUrl } from '../src/ui/escape.js';
import { uiService } from '../src/services/uiService.js';

let app;
let baseUrl;

async function get(path, options = {}) {
  const res = await fetch(new URL(path, baseUrl), options);
  const text = await res.text();
  let data = text;
  try { data = JSON.parse(text); } catch { /* keep as text */ }
  return { status: res.status, headers: res.headers, data };
}

describe('embed surface', () => {
  let jobId;
  let embedId;

  before(async () => {
    app = await import('../src/server.js');
    const port = await app.start(0);
    baseUrl = `http://localhost:${port}`;

    // A sample job is the cheapest way to get a finished job with real outputs.
    const created = await fetch(new URL('/v1/jobs/sample', baseUrl), { method: 'POST' });
    jobId = (await created.json()).id;

    await fetch(new URL(`/v1/jobs/${jobId}/process`, baseUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ output_languages: ['en-US', 'es-ES'] })
    });

    // Poll until the pipeline finishes rather than sleeping a fixed amount.
    for (let i = 0; i < 100; i++) {
      const status = await get(`/v1/jobs/${jobId}`);
      if (status.data.status === 'complete') break;
      if (status.data.status === 'error') throw new Error(`Job failed: ${status.data.error}`);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  });

  after(async () => {
    await app.stop();
  });

  it('serves the service homepage separately from the media upload flow', async () => {
    const home = await get('/');
    const media = await get('/media');
    assert.equal(home.status, 200);
    assert.equal(media.status, 200);
    assert.ok(home.data.includes('id="home-title">Public services.'));
    assert.ok(!home.data.includes('id="uploadForm"'));
    assert.ok(media.data.includes('id="uploadForm"'));
    assert.ok(media.data.includes('Media tools, in development.'));
  });

  it('publishes a finished job and returns a usable snippet', async () => {
    const res = await fetch(new URL(`/v1/jobs/${jobId}/publish`, baseUrl), { method: 'POST' });
    const data = await res.json();

    assert.equal(res.status, 201);
    assert.ok(data.embed_id, 'should return an embed id');
    assert.ok(data.embed_id.length >= 20, 'embed id should be unguessable');
    assert.ok(data.snippet.includes('/embed.js'), 'snippet should load the script');
    assert.ok(data.snippet.includes(data.embed_id), 'snippet should carry the embed id');
    assert.ok(data.iframe.includes('<iframe'), 'should also offer an iframe fallback');
    embedId = data.embed_id;
  });

  it('is idempotent — publishing twice keeps the same embed id', async () => {
    const res = await fetch(new URL(`/v1/jobs/${jobId}/publish`, baseUrl), { method: 'POST' });
    const data = await res.json();
    assert.equal(data.embed_id, embedId);
  });

  it('refuses to publish a job that does not exist', async () => {
    const res = await fetch(new URL('/v1/jobs/job_nope/publish', baseUrl), { method: 'POST' });
    assert.equal(res.status, 404);
  });

  it('serves a manifest describing the available layers', async () => {
    const res = await get(`/v1/embed/${embedId}/manifest.json`);
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data.languages));
    assert.ok(res.data.languages.includes('en-US'));
    assert.equal(typeof res.data.has_sign, 'boolean');
    assert.equal(typeof res.data.has_audio_description, 'boolean');
    assert.ok(res.data.caption_segments > 0, 'sample job should produce captions');
  });

  it('serves captions as valid WebVTT', async () => {
    const res = await get(`/v1/embed/${embedId}/captions.vtt?language=en-US`);
    assert.equal(res.status, 200);
    assert.ok(res.headers.get('content-type').includes('text/vtt'));
    assert.ok(res.data.startsWith('WEBVTT'), 'should be a WebVTT file');
    assert.ok(res.data.includes('-->'), 'should contain cue timings');
  });

  it('serves audio description and sign data', async () => {
    const ad = await get(`/v1/embed/${embedId}/audio-description.json`);
    assert.equal(ad.status, 200);
    assert.ok(Array.isArray(ad.data.segments));

    const sign = await get(`/v1/embed/${embedId}/sign-data.json`);
    assert.equal(sign.status, 200);
    assert.ok(Array.isArray(sign.data.sign_script));
  });

  it('404s an unknown embed id instead of leaking anything', async () => {
    const res = await get('/v1/embed/not-a-real-id/manifest.json');
    assert.equal(res.status, 404);
  });

  // ── CORS ──────────────────────────────────────────────────────
  // The whole point of the embed is that it runs on someone else's origin.

  it('sends CORS headers on every embed endpoint', async () => {
    for (const path of [
      `/v1/embed/${embedId}/manifest.json`,
      `/v1/embed/${embedId}/captions.vtt`,
      `/v1/embed/${embedId}/audio-description.json`,
      `/v1/embed/${embedId}/sign-data.json`,
      '/embed.js'
    ]) {
      const res = await get(path);
      assert.equal(res.headers.get('access-control-allow-origin'), '*', `${path} should allow cross-origin reads`);
    }
  });

  it('answers CORS preflight for embed endpoints', async () => {
    const res = await fetch(new URL(`/v1/embed/${embedId}/manifest.json`, baseUrl), { method: 'OPTIONS' });
    assert.equal(res.status, 204);
    assert.equal(res.headers.get('access-control-allow-origin'), '*');
  });

  it('does NOT send CORS headers on job creation', async () => {
    const res = await get('/v1/catalog');
    assert.equal(res.headers.get('access-control-allow-origin'), null,
      'only the read-only embed surface should be cross-origin readable');
  });

  // ── The script itself ─────────────────────────────────────────

  it('serves embed.js as javascript with the right mechanics', async () => {
    const res = await get('/embed.js');
    assert.equal(res.status, 200);
    assert.ok(res.headers.get('content-type').includes('javascript'));
    assert.ok(res.data.includes('addTextTrack'), 'should inject cues programmatically');
    assert.ok(res.data.includes('attachShadow'), 'overlay should be isolated in a shadow root');
    assert.ok(!res.data.includes('crossorigin'), 'must not require crossorigin on the host video');
  });

  it('derives its API base from its own script src, not a baked-in URL', async () => {
    const res = await get('/embed.js');
    // A self-hosted instance serves this script from its own origin and must
    // talk to itself. Baking in SITE_URL made every self-hoster silently fetch
    // from inclusy.org.
    assert.ok(res.data.includes('new URL(script.src).origin'),
      'embed.js must resolve its base from the script tag it was loaded with');
  });

  it('gzips embed.js, since third-party pages pay for it on every load', async () => {
    const res = await fetch(new URL('/embed.js', baseUrl), {
      headers: { 'Accept-Encoding': 'gzip' }
    });
    assert.equal(res.headers.get('content-encoding'), 'gzip');
    assert.equal(res.headers.get('vary'), 'Accept-Encoding');

    const transferred = Number(res.headers.get('content-length'));
    assert.ok(transferred < 5000, `embed.js transfers ${transferred} bytes gzipped, budget is 5000`);
  });

  it('renders the iframe player when given a valid src', async () => {
    const res = await get(`/embed/${embedId}?src=https://example.com/video.mp4`);
    assert.equal(res.status, 200);
    assert.ok(res.data.includes('https://example.com/video.mp4'));
    assert.ok(res.data.includes('/embed.js'));
  });

  it('404s the iframe player for an unknown embed id', async () => {
    const res = await get('/embed/not-a-real-id?src=https://example.com/v.mp4');
    assert.equal(res.status, 404);
  });
});

// ── Input validation, no server needed ──────────────────────────

describe('embed input validation', () => {
  it('safeMediaUrl accepts only http and https', () => {
    assert.equal(safeMediaUrl('https://example.com/v.mp4'), 'https://example.com/v.mp4');
    assert.equal(safeMediaUrl('http://example.com/v.mp4'), 'http://example.com/v.mp4');
    assert.equal(safeMediaUrl('javascript:alert(1)'), '');
    assert.equal(safeMediaUrl('data:text/html,<script>alert(1)</script>'), '');
    assert.equal(safeMediaUrl('/relative/path.mp4'), '');
    assert.equal(safeMediaUrl(''), '');
    assert.equal(safeMediaUrl(null), '');
  });

  it('iframe page never emits an unescaped src', () => {
    const html = uiService.buildEmbedFramePage({
      embedId: 'abc',
      src: '" onerror="alert(1)'
    });
    assert.ok(!html.includes('onerror="alert(1)"'), 'must not break out of the attribute');
    assert.ok(html.includes('Add a <code>src</code> parameter'), 'should explain what went wrong');
  });

  it('iframe page escapes a hostile embed id', () => {
    const html = uiService.buildEmbedFramePage({
      embedId: '"><script>alert(1)</script>',
      src: 'https://example.com/v.mp4'
    });
    assert.ok(!html.includes('<script>alert(1)</script>'), 'embed id must be escaped');
  });
});

describe('static asset serving', () => {
  it('refuses to escape the public directory', () => {
    assert.equal(resolveStaticPath('/static/../../../etc/passwd'), null);
    assert.equal(resolveStaticPath('/static/..%2f..%2fetc%2fpasswd'), null);
    assert.ok(resolveStaticPath('/static/fonts/atkinson-400-latin.woff2').endsWith('public/fonts/atkinson-400-latin.woff2'));
  });
});
