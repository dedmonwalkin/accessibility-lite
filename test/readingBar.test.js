import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { READING_BAR_SCRIPT, speechChunks } from '../src/ui/readingBar.js';
import { buildHomePage } from '../src/ui/pages/home.js';

function harness(available = true) {
  const elements = new Map();
  function element(id) {
    if (!elements.has(id)) elements.set(id, {
      value: id === 'readingSpeed' ? '1' : '0', dataset: {}, hidden: true,
      children: [], events: {}, attributes: {}, disabled: false,
      addEventListener(type, callback) { this.events[type] = callback; },
      setAttribute(key, value) { this.attributes[key] = value; },
      add(option) { this.children.push(option); this.value = this.children[0].value; },
      replaceChildren() { this.children = []; },
      get selectedOptions() { return this.children.filter(child => child.value === this.value); },
      focus() { this.focused = true; }
    });
    return elements.get(id);
  }
  let spoken = [];
  let cancelled = 0;
  let resumed = 0;
  const synth = { getVoices: () => [
    { name: 'Remote', voiceURI: 'remote', lang: 'en-US', localService: false },
    { name: 'Local', voiceURI: 'local', lang: 'en-US', localService: true }
  ], addEventListener() {}, speak(item) { spoken.push(item); }, cancel() { cancelled++; }, pause() {}, resume() { resumed++; } };
  const section = { querySelector: () => ({ innerText: 'Public section' }), querySelectorAll: () => [] };
  const context = {
    document: { getElementById: element, querySelectorAll: () => [section], documentElement: { removeAttribute() {} } },
    window: { speechSynthesis: available ? synth : undefined, addEventListener() {}, dispatchEvent() {} },
    localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
    Option: function(text, value) { this.textContent = text; this.value = value; },
    Event: function() {}, SpeechSynthesisUtterance: function(text) { this.text = text; }
  };
  vm.runInNewContext(READING_BAR_SCRIPT, context);
  return { element, spoken, get cancelled() { return cancelled; }, get resumed() { return resumed; }, section, document: context.document };
}

test('service page includes one reading bar, legacy preference IDs, and opted-in sections', () => {
  const html = buildHomePage({ mediaPreview: false });
  for (const id of ['readingBar', 'themeToggle', 'textSizeToggle', 'listenPanel']) {
    assert.equal(html.split(`id="${id}"`).length - 1, 1);
  }
  assert.equal((html.match(/data-reading-section>/g) || []).length, 6);
  for (const [, script] of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) new vm.Script(script);
  assert.ok(!buildHomePage().includes('id="readingBar"'));
});

test('local English voices only, with no automatic speech', () => {
  const h = harness();
  assert.deepEqual(h.element('readingVoice').children.map(item => item.value), ['local']);
  assert.equal(h.spoken.length, 0);
  assert.equal(h.element('readingPlay').disabled, false);
});

test('unsupported speech disables playback with an explanation', () => {
  const h = harness(false);
  assert.equal(h.element('readingPlay').disabled, true);
  assert.match(h.element('readingStatus').textContent, /not supported/);
});

test('Escape collapses listening and returns focus to its trigger', () => {
  const h = harness();
  h.element('listenToggle').events.click();
  assert.equal(h.element('listenPanel').hidden, false);
  h.element('listenPanel').events.keydown({ key: 'Escape' });
  assert.equal(h.element('listenPanel').hidden, true);
  assert.equal(h.element('listenToggle').attributes['aria-expanded'], 'false');
  assert.equal(h.element('listenToggle').focused, true);
});

test('solid treatment can be toggled and reset', () => {
  const h = harness();
  h.element('solidToggle').events.click();
  assert.equal(h.element('readingBar').dataset.solid, 'true');
  h.element('readingReset').events.click();
  assert.equal(h.element('readingBar').dataset.solid, 'false');
});

test('playback uses the chosen local voice and ignores stale completion after stopping', () => {
  const h = harness();
  h.section.querySelectorAll = () => [{
    closest: () => null, parentElement: { closest: () => null }, getClientRects: () => [1],
    cloneNode: () => ({ textContent: 'Public paragraph. '.repeat(40), querySelectorAll: () => [] })
  }];
  h.element('readingPlay').events.click();
  assert.equal(h.spoken.length, 1);
  assert.equal(h.spoken[0].voice.voiceURI, 'local');
  h.element('readingPause').events.click();
  assert.equal(h.element('readingPause').textContent, 'Resume');
  h.element('readingStop').events.click();
  h.spoken[0].onend();
  assert.equal(h.spoken.length, 1);
  assert.equal(h.cancelled, 1);
  assert.equal(h.resumed, 1);
});

test('speech chunks retain every word and prefer sentence boundaries', () => {
  const text = 'First sentence. Second sentence! A final question?';
  assert.deepEqual(speechChunks(text), ['First sentence.', 'Second sentence!', 'A final question?']);
  const long = 'word '.repeat(250).trim();
  assert.equal(speechChunks(long).join(' '), long);
  assert.ok(speechChunks(long).every(chunk => chunk.length <= 220));
  assert.deepEqual(speechChunks('  '), []);
});

function readyPlayback() {
  const h = harness();
  h.section.querySelectorAll = () => [{
    closest: () => null, parentElement: { closest: () => null }, getClientRects: () => [1],
    cloneNode: () => ({ textContent: 'First sentence. Second sentence.', querySelectorAll: () => [] })
  }];
  h.element('readingPlay').events.click();
  return h;
}

test('visible passage follows speech and clears when stopped', () => {
  const h = readyPlayback();
  assert.equal(h.element('readingPassageText').textContent, 'First sentence.');
  assert.equal(h.element('readingPlay').textContent, 'Restart section');
  h.spoken[0].onend();
  assert.equal(h.element('readingPassageText').textContent, 'Second sentence.');
  h.element('readingStop').events.click();
  assert.equal(h.element('readingPassage').hidden, true);
  assert.equal(h.element('readingPassageText').textContent, '');
});

test('a chunk completing while paused waits until resume', () => {
  const h = readyPlayback();
  h.element('readingPause').events.click();
  h.spoken[0].onend();
  assert.equal(h.spoken.length, 1);
  h.element('readingPause').events.click();
  assert.equal(h.spoken.length, 2);
});

test('stopping and natural completion move focus off a newly disabled control', () => {
  const h = readyPlayback();
  h.document.activeElement = h.element('readingStop');
  h.element('readingStop').events.click();
  assert.equal(h.element('readingPlay').focused, true);
  const finished = readyPlayback();
  finished.document.activeElement = finished.element('readingPause');
  finished.spoken[0].onend();
  finished.spoken[1].onend();
  assert.equal(finished.element('readingPlay').focused, true);
  assert.equal(finished.element('readingStatus').textContent, 'Section finished.');
});
