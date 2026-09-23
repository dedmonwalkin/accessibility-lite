import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { uiService } from '../src/services/uiService.js';

test('Whakauru identity and sourced name story replace the old public brand', () => {
  const html = uiService.buildHomePage({ mediaPreview: false });
  assert.match(html, /<title>Nobody gets left off the map.*Whakauru<\/title>/);
  assert.match(html, /og:site_name" content="Whakauru"/);
  assert.match(html, /lang="mi">Whakauru/);
  assert.match(html, /href="https:\/\/maoridictionary.co.nz\/search\?keywords=whakauru"/);
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
    const expected = origin || 'https://whakauru.com/';
    assert.ok(html.includes(`rel="canonical" href="${expected}"`));
    assert.ok(html.includes(`property="og:url" content="${expected}"`));
  }
});

test('media presentation is rebranded without breaking legacy embed attributes', () => {
  for (const html of [uiService.buildUploadPage(), uiService.buildEmbedDocsPage()]) {
    assert.match(html, /Whakauru/);
    assert.doesNotMatch(html, /inclusy\.org|>Inclusy</);
    assert.match(html, /data-inclusy=/);
  }
});
