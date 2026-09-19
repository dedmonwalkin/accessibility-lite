import test from 'node:test';
import assert from 'node:assert/strict';
import { uiService } from '../src/services/uiService.js';
import { isPublicPath } from '../src/server.js';

test('service homepage separates proposed engagements from media experiments', () => {
  const html = uiService.buildHomePage();
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  for (const id of ['main', 'services', 'approach', 'contact']) {
    assert.ok(html.includes(`id="${id}"`));
  }
  assert.ok(html.includes('href="/media"'));
  assert.ok(html.includes('Client enquiries are not open yet'));
  assert.ok(html.includes('not legal advice, government certification'));
  assert.ok(!html.includes('mailto:'));
  assert.ok(!html.includes('id="uploadForm"'));
});

test('only a valid configured mailbox enables contact', () => {
  const html = uiService.buildHomePage({ contactEmail: ' hello@inclusy.org ' });
  assert.ok(html.includes('href="mailto:hello@inclusy.org"'));
  assert.ok(!html.includes('Client enquiries are not open yet'));
  for (const contactEmail of [null, 42, '', 'hello', 'a@b.org?bcc=x@y.org', 'a@b.org\r\nBcc:x@y.org', '\"><script>alert(1)</script>@b.org']) {
    assert.ok(!uiService.buildHomePage({ contactEmail }).includes('mailto:'));
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
