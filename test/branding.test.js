import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { uiService } from '../src/services/uiService.js';

test('Working Access identity and practical purpose replace the former name story', () => {
  const html = uiService.buildHomePage({ mediaPreview: false });
  assert.match(html, /<title>Nobody gets left off the map.*Working Access<\/title>/);
  assert.match(html, /og:site_name" content="Working Access"/);
  assert.match(html, /Why Working Access\?/);
  assert.match(html, /Not just a higher score/);
  assert.match(html, /href="\/#name">Our purpose/);
  assert.doesNotMatch(html, /lang="mi"|maoridictionary|New Zealand|te reo|Whakauru/);
  assert.match(html, /Nobody gets left off the map/);
  assert.match(html, /<svg[^>]*aria-hidden="true"[^>]*focusable="false"/);
  // Stored preference keys are intentionally retained across the rebrand.
  const publicHtml = html.replace(/<script>[\s\S]*?<\/script>/g, '');
  assert.doesNotMatch(publicHtml, /inclusy/i);
  assert.doesNotMatch(html, /og:image|twitter:image|static\/og.png/);
  assert.doesNotMatch(html, /mailto:(?:hello|accessibility|aoda)@|fah-kah|s-where|s-result|31 Dec/);
  assert.match(html, /target, not a conformance claim/);
  assert.match(html, /does not determine legal obligations/);
});

test('origin defaults to the new domain while self-hosted overrides remain supported', () => {
  for (const origin of ['', 'https://preview.example.org/']) {
    const html = execFileSync(process.execPath, ['--input-type=module', '-e',
      "import { buildHomePage } from './src/ui/pages/home.js'; process.stdout.write(buildHomePage());"], {
      cwd: new URL('../', import.meta.url),
      env: { ...process.env, SITE_URL: origin }, encoding: 'utf8'
    });
    const expected = origin || 'https://workingaccess.org/';
    assert.ok(html.includes(`rel="canonical" href="${expected}"`));
    assert.ok(html.includes(`property="og:url" content="${expected}"`));
  }
});

test('media presentation is rebranded without breaking legacy embed attributes', () => {
  for (const html of [uiService.buildUploadPage(), uiService.buildEmbedDocsPage()]) {
    assert.match(html, /Working Access/);
    assert.doesNotMatch(html, /inclusy\.org|whakauru\.com|>Inclusy<|Whakauru/);
    assert.match(html, /data-inclusy=/);
  }
});

test('the rebrand uses the verified new email and retains legacy appearance preferences', () => {
  const html = uiService.buildHomePage({ mediaPreview: false });
  assert.equal((html.match(/mailto:bob@workingaccess\.org/g) || []).length, 2);
  assert.doesNotMatch(html, /whakauru/i);
  assert.match(html, /inclusy-theme/);
  assert.match(html, /inclusy-text-size/);
  const custom = uiService.buildHomePage({ contactEmail: 'contact@example.org', mediaPreview: false });
  assert.equal((custom.match(/mailto:contact@example\.org/g) || []).length, 2);
});

test('shared headers and browser icons use the supplied mark without repeating the link name', () => {
  for (const html of [uiService.buildHomePage({ mediaPreview: false }),
    uiService.buildUploadPage(), uiService.buildErrorPage(404, 'Not found', 'Page missing')]) {
    const wordmark = html.match(/<a class="wordmark" href="\/">([\s\S]*?)<\/a>/)?.[1];
    assert.ok(wordmark);
    assert.match(wordmark, /<img class="brand-mark" src="\/static\/brand\/working-access-mark\.png" alt="" width="800" height="800"/);
    assert.match(wordmark, /<span>Working Access<\/span>/);
    assert.doesNotMatch(wordmark, /<svg|tabindex|aria-label/);
    assert.match(html, /rel="icon" type="image\/png" sizes="800x800" href="\/static\/brand\/working-access-mark\.png"/);
    assert.match(html, /rel="apple-touch-icon" href="\/static\/brand\/working-access-mark\.png"/);
    assert.doesNotMatch(html, /data:image\/svg\+xml/);
  }
});

test('the brand asset retains the supplied square PNG dimensions and RGBA format', async () => {
  const png = await readFile(new URL('../public/brand/working-access-mark.png', import.meta.url));
  assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(png.toString('ascii', 12, 16), 'IHDR');
  assert.equal(png.readUInt32BE(16), 800);
  assert.equal(png.readUInt32BE(20), 800);
  assert.equal(png[25], 6);
});
