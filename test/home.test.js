import test from 'node:test';
import assert from 'node:assert/strict';
import { uiService } from '../src/services/uiService.js';
import { isPublicPath } from '../src/server.js';

test('service homepage separates proposed engagements from media experiments', () => {
  const html = uiService.buildHomePage();
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  for (const id of ['main', 'services', 'approach', 'project-plan', 'accessibility', 'contact']) {
    assert.ok(html.includes(`id="${id}"`));
  }
  assert.ok(html.includes('href="/media"'));
  assert.ok(html.includes('href="mailto:bob@inclusy.org"'));
  assert.ok(html.includes('href="mailto:accessibility@inclusy.org"'));
  assert.ok(html.includes('not legal advice, government certification'));
  assert.ok(html.includes('A format example, not a client finding'));
  assert.ok(!html.includes('id="uploadForm"'));
});

test('only a valid configured mailbox enables contact', () => {
  const html = uiService.buildHomePage({ contactEmail: ' hello@inclusy.org ' });
  assert.ok(html.includes('href="mailto:hello@inclusy.org"'));
  assert.ok(!html.includes('Client enquiries are not open yet'));
  for (const contactEmail of [null, 42, '', 'hello', 'a@b.org?bcc=x@y.org', 'a@b.org\r\nBcc:x@y.org', '\"><script>alert(1)</script>@b.org']) {
    const invalid = uiService.buildHomePage({ contactEmail });
    assert.ok(!invalid.includes('class="contact-address"'));
    assert.ok(invalid.includes('Client enquiries are not open yet'));
  }
});

test('homepage has progressive enhancement and accessible navigation targets', () => {
  const html = uiService.buildHomePage();
  assert.ok(html.includes('id="main" tabindex="-1"'));
  assert.ok(html.includes('id="projectPlanner" hidden'));
  assert.ok(html.includes('<noscript>'));
  assert.ok(html.includes('role="status" aria-live="polite" aria-atomic="true"'));
  assert.ok(html.includes('for="projectFocus"'));
  assert.ok(!html.includes('fonts.googleapis.com'));
  assert.ok(!html.includes('«'));
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  for (const [, anchor] of html.matchAll(/href="\/?#([^"]+)"/g)) {
    assert.ok(ids.includes(anchor), `missing anchor ${anchor}`);
  }
});

test('media page retains upload workflow with distinct canonical URL and limits', () => {
  const html = uiService.buildUploadPage();
  assert.ok(html.includes('/media" />'));
  assert.ok(html.includes('id="uploadForm"'));
  assert.ok(html.includes('Mock providers are enabled by default'));
  assert.ok(html.includes('Sign gloss is not sign-language interpretation'));
  assert.ok(!html.includes('nothing leaves your machine'));
});

test('new media page is public for reads without opening write APIs', () => {
  assert.equal(isPublicPath('GET', '/'), true);
  assert.equal(isPublicPath('GET', '/media'), true);
  assert.equal(isPublicPath('POST', '/media'), false);
  assert.equal(isPublicPath('POST', '/v1/jobs'), false);
});
