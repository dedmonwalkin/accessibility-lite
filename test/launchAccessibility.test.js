import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { scriptJson } from '../src/ui/scriptJson.js';
import { clipboardScript } from '../src/ui/clipboard.js';
import { uiService } from '../src/services/uiService.js';
import { signOverlayStyles, resolveSignTheme } from '../src/ui/signOverlay.js';

const job = {
  id: 'job_fixture', original_filename: 'sample.wav', duration_ms: 1000,
  has_video: false, mime_type: 'audio/wav',
  preferences: { output_languages: ['en-US'], sign_language: 'ASL', sign_overlay_theme: 'standard' }
};

test('inline script serialization preserves text without HTML parser escape sequences', () => {
  const input = { text: '</ScRiPt><script>alert(1)</script><!--\u2028\u2029' };
  const encoded = scriptJson(input);
  assert.ok(!encoded.includes('<'));
  assert.ok(!encoded.includes('\u2028'));
  assert.deepEqual(JSON.parse(encoded), input);
});

test('player caption and description text cannot escape its inline script', () => {
  const text = '</script><script>INJECTED()</script>';
  const segment = { start: 0, end: 1000, text };
  const baseline = uiService.buildPlayerPage(job, {});
  const html = uiService.buildPlayerPage(job, { captions: [segment], audioDescription: [segment] });
  assert.equal((html.match(/<script>/g) || []).length, (baseline.match(/<script>/g) || []).length);
  assert.ok(!html.includes(text));
  for (const [, script] of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
    assert.doesNotThrow(() => new vm.Script(script));
  }
});

test('job IDs are escaped in options and results scripts', () => {
  const hostile = { ...job, id: '</script><script>INJECTED()</script>' };
  for (const render of [uiService.buildOptionsPage, uiService.buildResultsPage]) {
    const html = render(hostile, {});
    assert.ok(!html.includes(hostile.id));
    for (const [, script] of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
      assert.doesNotThrow(() => new vm.Script(script));
    }
  }
});

for (const mode of ['success', 'rejected', 'missing']) {
  for (const type of ['share', 'snippet']) {
    test(`clipboard ${mode}, ${type}: truthful status and correct fallback target`, async () => {
      let click, copied, focused = false, selected = false;
      const status = { textContent: '' };
      const source = type === 'share'
        ? { value: 'https://example.test/player', focus() { focused = true; }, select() { selected = true; } }
        : { textContent: '<script src="example.js"></script>', focus() { focused = true; } };
      const context = {
        button: { addEventListener(name, fn) { assert.equal(name, 'click'); click = fn; } }, source, status,
        navigator: mode === 'missing' ? {} : { clipboard: { async writeText(text) {
          if (mode === 'rejected') throw new Error('Denied');
          copied = text;
        } } },
        document: { createRange: () => ({ selectNodeContents(target) { assert.equal(target, source); selected = true; } }) },
        window: { getSelection: () => ({ removeAllRanges() {}, addRange() {} }) }
      };
      vm.runInNewContext(`${clipboardScript()}; bindCopy(button, source, status);`, context);
      await click();
      if (mode === 'success') {
        assert.equal(copied, source.value || source.textContent);
        assert.equal(status.textContent, 'Copied!');
        assert.equal(focused, false);
      } else {
        assert.match(status.textContent, /Automatic copying is unavailable/);
        assert.equal(focused, true);
        assert.equal(selected, true);
        assert.equal(copied, undefined);
      }
    });
  }
}

test('development limitations follow media through options, results, player and embed', () => {
  const pages = [
    uiService.buildOptionsPage(job), uiService.buildResultsPage(job, {}),
    uiService.buildPlayerPage(job, {}), uiService.buildEmbedDocsPage(),
    uiService.buildEmbedFramePage({ embedId: 'example', src: 'https://example.test/video.mp4' })
  ];
  for (const html of pages) {
    assert.match(html, /Development preview\. Outputs are unverified/);
    assert.match(html, /not sign-language interpretation/);
    assert.ok(!html.includes('permanent embed ID'));
    assert.ok(!html.includes('We never serve your video'));
  }
});

test('form validation and horizontally scrollable media content support keyboard use', () => {
  assert.match(uiService.buildOptionsPage(job), /multiple required aria-required="true"/);
  const html = uiService.buildResultsPage(job, {});
  assert.match(html, /id="copyShareStatus" role="status"/);
  assert.match(html, /id="copyEmbedStatus" role="status"/);
  assert.match(html, /id="embedSnippet" tabindex="0"/);
  const docs = uiService.buildEmbedDocsPage();
  assert.match(docs, /href="\/media#upload"/);
  assert.match(docs, /class="table-scroll" tabindex="0"/);
  assert.equal((docs.match(/class="snippet" tabindex="0"/g) || []).length, 2);
});

test('sign controls, empty states, and cues use their own tested theme colors', () => {
  const css = signOverlayStyles(resolveSignTheme('hands_only'));
  assert.match(css, /background: var\(--sign-bg\); color: var\(--sign-text\)/);
  assert.match(css, /\.sign-overlay \.muted \{ color: var\(--sign-text\)/);
  assert.match(css, /\.sign-overlay :focus-visible \{ outline-color: var\(--sign-accent\)/);
  assert.match(css, /font-size: max\(0\.875rem, 0\.75em\)/);
});
