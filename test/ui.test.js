import test from 'node:test';
import assert from 'node:assert/strict';
import { uiService, escapeHtml } from '../src/services/uiService.js';

// ── escapeHtml ──────────────────────────────────────────────────

test('escapeHtml escapes all dangerous characters', () => {
  assert.equal(escapeHtml('<script>alert("xss")</script>'),
    '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  assert.equal(escapeHtml("it's & <done>"),
    "it&#39;s &amp; &lt;done&gt;");
  assert.equal(escapeHtml(''), '');
  assert.equal(escapeHtml(0), '0');
});

// ── Error page ──────────────────────────────────────────────────

test('error page has correct doctype, lang, and meta tags', () => {
  const html = uiService.buildErrorPage(404, 'Not Found', 'Page missing');
  assert.ok(html.startsWith('<!doctype html>'), 'should start with doctype');
  assert.ok(html.includes('<html lang="en">'), 'should have lang=en');
  assert.ok(html.includes('<meta charset="utf-8"'), 'should have charset');
  assert.ok(html.includes('viewport'), 'should have viewport meta');
});

test('error page uses semantic main element', () => {
  const html = uiService.buildErrorPage(404, 'Not Found', 'Page missing');
  assert.ok(html.includes('<main'), 'should use main element');
  assert.ok(html.includes('</main>'), 'should close main element');
});

test('error page escapes dynamic values', () => {
  const html = uiService.buildErrorPage(404, '<script>xss</script>', '<img onerror=x>');
  assert.ok(html.includes('&lt;script&gt;xss&lt;/script&gt;'), 'title should be escaped');
  assert.ok(html.includes('&lt;img onerror=x&gt;'), 'message should be escaped');
  assert.ok(!html.includes('<script>xss</script>'), 'raw script should not appear in HTML context');
});

test('error page has back to home link', () => {
  const html = uiService.buildErrorPage(500, 'Error', 'Something broke');
  assert.ok(html.includes('href="/"'), 'should link back to home');
});

test('error page has auto-refresh when specified', () => {
  const html = uiService.buildErrorPage(202, 'Processing', 'Wait', { autoRefresh: 3 });
  assert.ok(html.includes('http-equiv="refresh" content="3"'), 'should have refresh meta');
});

test('error page has no auto-refresh by default', () => {
  const html = uiService.buildErrorPage(404, 'Not Found', 'Gone');
  assert.ok(!html.includes('http-equiv="refresh"'), 'should not have refresh meta');
});

test('error page has aria-live on message', () => {
  const html = uiService.buildErrorPage(404, 'Not Found', 'Gone');
  assert.ok(html.includes('aria-live="polite"'), 'message should have aria-live');
});

// ── Upload page structure ───────────────────────────────────────

test('upload page has correct doctype, lang, and meta tags', () => {
  const html = uiService.buildUploadPage();
  assert.ok(html.startsWith('<!doctype html>'), 'should start with doctype');
  assert.ok(html.includes('<html lang="en">'), 'should have lang=en');
  assert.ok(html.includes('<meta charset="utf-8"'), 'should have charset');
  assert.ok(html.includes('viewport'), 'should have viewport meta');
});

test('upload page uses semantic main element', () => {
  const html = uiService.buildUploadPage();
  assert.ok(html.includes('<main'), 'should use main element');
  assert.ok(html.includes('</main>'), 'should close main element');
});

// ── Upload page ARIA + keyboard ─────────────────────────────────

test('upload page dropzone has role=button and tabindex', () => {
  const html = uiService.buildUploadPage();
  assert.ok(html.includes('role="button"'), 'dropzone should have role=button');
  assert.ok(html.includes('tabindex="0"'), 'dropzone should be keyboard focusable');
});

test('upload page dropzone has keyboard handler', () => {
  const html = uiService.buildUploadPage();
  assert.ok(html.includes("e.key === 'Enter'"), 'should handle Enter key');
  assert.ok(html.includes("e.key === ' '"), 'should handle Space key');
});

test('upload page has aria-required on file input', () => {
  const html = uiService.buildUploadPage();
  assert.ok(html.includes('aria-required="true"'), 'file input should have aria-required');
});

test('upload page has aria-live on file info and error', () => {
  const html = uiService.buildUploadPage();
  assert.ok(html.includes('id="fileInfo"'), 'should have fileInfo element');
  assert.ok(html.includes('id="error"'), 'should have error element');
  // Both should have aria-live
  assert.ok((html.match(/aria-live="polite"/g) || []).length >= 2, 'should have at least 2 aria-live regions');
});

test('upload page has screen reader upload status', () => {
  const html = uiService.buildUploadPage();
  assert.ok(html.includes('id="uploadStatus" aria-live="polite"'), 'should have sr-only upload status');
});

test('upload page error has role=alert', () => {
  const html = uiService.buildUploadPage();
  assert.ok(html.includes('role="alert"'), 'error should have role=alert');
});

// ── Upload page CSS ─────────────────────────────────────────────

test('upload page has focus-visible styles', () => {
  const html = uiService.buildUploadPage();
  assert.ok(html.includes(':focus-visible'), 'should have focus-visible styles');
});

test('upload page has responsive breakpoints', () => {
  const html = uiService.buildUploadPage();
  assert.ok(html.includes('@media (max-width: 768px)'), 'should have tablet breakpoint');
  assert.ok(html.includes('@media (max-width: 480px)'), 'should have mobile breakpoint');
});

test('upload page has prefers-reduced-motion', () => {
  const html = uiService.buildUploadPage();
  assert.ok(html.includes('@media (prefers-reduced-motion: reduce)'), 'should respect reduced motion');
});

test('upload page has spinner animation', () => {
  const html = uiService.buildUploadPage();
  assert.ok(html.includes('@keyframes spin'), 'should have spin animation');
});

test('upload page has disabled button style', () => {
  const html = uiService.buildUploadPage();
  assert.ok(html.includes('.btn:disabled'), 'should style disabled button');
});

// ── Options page ────────────────────────────────────────────────

const mockJob = {
  id: 'job_test123',
  original_filename: 'test.mp4',
  duration_ms: 5000,
  has_video: true,
  mime_type: 'video/mp4',
  preferences: {
    output_languages: ['en-US'],
    caption_style: 'standard',
    audio_description_style: 'standard',
    sign_language: 'ASL',
    sign_presentation_mode: 'overlay',
    sign_overlay_theme: 'dark-glass',
    ui_mode: 'full'
  }
};

test('options page has correct doctype and lang', () => {
  const html = uiService.buildOptionsPage(mockJob);
  assert.ok(html.startsWith('<!doctype html>'), 'should start with doctype');
  assert.ok(html.includes('<html lang="en">'), 'should have lang=en');
});

test('options page uses semantic main element', () => {
  const html = uiService.buildOptionsPage(mockJob);
  assert.ok(html.includes('<main'), 'should use main element');
  assert.ok(html.includes('</main>'), 'should close main element');
});

test('options page has radiogroup roles with labels', () => {
  const html = uiService.buildOptionsPage(mockJob);
  assert.ok(html.includes('role="radiogroup"'), 'should have radiogroup role');
  assert.ok(html.includes('aria-labelledby="caption-style-label"'), 'caption style should have aria-labelledby');
  assert.ok(html.includes('aria-labelledby="audio-desc-style-label"'), 'audio desc style should have aria-labelledby');
  assert.ok(html.includes('aria-labelledby="sign-mode-label"'), 'sign mode should have aria-labelledby');
  assert.ok(html.includes('aria-labelledby="ui-mode-label"'), 'ui mode should have aria-labelledby');
});

test('options page has spinner on submit', () => {
  const html = uiService.buildOptionsPage(mockJob);
  assert.ok(html.includes('spinner'), 'should show spinner during processing');
  assert.ok(html.includes('btn.disabled = true'), 'should disable button during processing');
});

test('options page has aria-live on progress and error', () => {
  const html = uiService.buildOptionsPage(mockJob);
  assert.ok(html.includes('id="error"'), 'should have error element');
  assert.ok(html.includes('id="progressSection"'), 'should have progress section');
});

test('options page re-enables button on error', () => {
  const html = uiService.buildOptionsPage(mockJob);
  assert.ok(html.includes('btn.disabled = false'), 'should re-enable button on error');
  assert.ok(html.includes("btn.textContent = 'Process Media'"), 'should reset button text on error');
});

test('options page escapes job filename', () => {
  const xssJob = { ...mockJob, original_filename: '<img onerror=x>.mp4' };
  const html = uiService.buildOptionsPage(xssJob);
  assert.ok(html.includes('&lt;img onerror=x&gt;'), 'filename should be escaped');
});

// ── Results page ────────────────────────────────────────────────

const mockOutputs = {
  captions: [{ start: 0, end: 1000, text: 'Hello world' }],
  captionTranslations: {},
  audioDescription: [{ start: 0, end: 1000, text: 'A person speaking' }],
  signScript: [{ start: 0, end: 1000, gloss_tokens: ['HELLO', 'WORLD'], facial_cues: ['neutral'] }],
  signCards: []
};

test('results page has correct doctype and lang', () => {
  const html = uiService.buildResultsPage(mockJob, mockOutputs);
  assert.ok(html.startsWith('<!doctype html>'), 'should start with doctype');
  assert.ok(html.includes('<html lang="en">'), 'should have lang=en');
});

test('results page uses semantic main element', () => {
  const html = uiService.buildResultsPage(mockJob, mockOutputs);
  assert.ok(html.includes('<main'), 'should use main element');
  assert.ok(html.includes('</main>'), 'should close main element');
});

test('results page has role=region on content panels', () => {
  const html = uiService.buildResultsPage(mockJob, mockOutputs);
  assert.ok(html.includes('role="region" aria-label="Summary statistics"'), 'stats panel should have role=region');
  assert.ok(html.includes('role="region" aria-label="Media player"'), 'player panel should have role=region');
  assert.ok(html.includes('role="region" aria-label="Caption preview"'), 'captions panel should have role=region');
  assert.ok(html.includes('role="region" aria-label="Sign language preview"'), 'sign panel should have role=region');
  assert.ok(html.includes('role="region" aria-label="Audio description preview"'), 'audio panel should have role=region');
  assert.ok(html.includes('role="region" aria-label="Download links"'), 'downloads panel should have role=region');
  assert.ok(html.includes('role="region" aria-label="Share link"'), 'share panel should have role=region');
});

test('results page has download attribute on links', () => {
  const html = uiService.buildResultsPage(mockJob, mockOutputs);
  const downloadCount = (html.match(/download>/g) || []).length + (html.match(/download\b/g) || []).length;
  assert.ok(downloadCount >= 4, 'download links should have download attribute');
});

test('results page escapes job filename', () => {
  const xssJob = { ...mockJob, original_filename: '<script>alert(1)</script>' };
  const html = uiService.buildResultsPage(xssJob, mockOutputs);
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'), 'filename should be escaped in subtitle');
});

test('results page has copy button with feedback', () => {
  const html = uiService.buildResultsPage(mockJob, mockOutputs);
  assert.ok(html.includes('Copied!'), 'should show Copied! feedback');
});

test('results page has share URL input with aria-label', () => {
  const html = uiService.buildResultsPage(mockJob, mockOutputs);
  assert.ok(html.includes('aria-label="Shareable player URL"'), 'share input should have aria-label');
});

// ── Player page ─────────────────────────────────────────────────

test('player page has correct doctype and lang', () => {
  const html = uiService.buildPlayerPage(mockJob, mockOutputs);
  assert.ok(html.startsWith('<!doctype html>'), 'should start with doctype');
  assert.ok(html.includes('<html lang="en">'), 'should have lang=en');
});

test('player page uses semantic main element', () => {
  const html = uiService.buildPlayerPage(mockJob, mockOutputs);
  assert.ok(html.includes('<main'), 'should use main element');
  assert.ok(html.includes('</main>'), 'should close main element');
});

test('player page has role=region on panels', () => {
  const html = uiService.buildPlayerPage(mockJob, mockOutputs);
  assert.ok(html.includes('role="region" aria-label="Media player"'), 'player panel should have role=region');
  assert.ok(html.includes('role="region" aria-label="Captions"'), 'captions panel should have role=region');
  assert.ok(html.includes('role="region" aria-label="Sign language overlay"'), 'sign panel should have role=region');
  assert.ok(html.includes('role="region" aria-label="Audio description"'), 'audio panel should have role=region');
  assert.ok(html.includes('role="region" aria-label="Download links"'), 'downloads panel should have role=region');
});

test('player page has aria-live on captions, audio, sign', () => {
  const html = uiService.buildPlayerPage(mockJob, mockOutputs);
  assert.ok(html.includes('id="captions" aria-live="polite"'), 'captions should have aria-live');
  assert.ok(html.includes('id="audio" aria-live="polite"'), 'audio should have aria-live');
  assert.ok(html.includes('id="signSegments" aria-live="polite"'), 'sign segments should have aria-live');
});

test('player page has download attributes on links', () => {
  const html = uiService.buildPlayerPage(mockJob, mockOutputs);
  assert.ok(html.includes('download>VTT'), 'VTT link should have download attribute');
  assert.ok(html.includes('download>TTML'), 'TTML link should have download attribute');
});

test('player page has theme selector with aria-label', () => {
  const html = uiService.buildPlayerPage(mockJob, mockOutputs);
  assert.ok(html.includes('id="themeSelect" aria-label="Sign overlay theme"'), 'theme select should have aria-label');
});

test('player page escapes filename in title', () => {
  const xssJob = { ...mockJob, original_filename: '<b>xss</b>' };
  const html = uiService.buildPlayerPage(xssJob, mockOutputs);
  assert.ok(html.includes('<title>&lt;b&gt;xss&lt;/b&gt;'), 'title should be escaped');
});

test('player page escapes sign gloss tokens', () => {
  const xssOutputs = {
    ...mockOutputs,
    signScript: [{ start: 0, end: 1000, gloss_tokens: ['<img onerror=x>'], facial_cues: [] }]
  };
  const html = uiService.buildPlayerPage(mockJob, xssOutputs);
  assert.ok(html.includes('&lt;img onerror=x&gt;'), 'gloss tokens should be escaped');
});
