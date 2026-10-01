import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { READING_BAR_SCRIPT, speechChunks } from '../src/ui/readingBar.js';
import { buildHomePage } from '../src/ui/pages/home.js';

function harness(available = true, { device = {}, stored = {} } = {}) {
  const elements = new Map();
  const documentEvents = {};
  const queries = new Map();
  const storage = new Map(Object.entries(stored));
  const rootAttributes = {};
  if (stored['inclusy-theme']) rootAttributes['data-theme'] = stored['inclusy-theme'];
  if (stored['inclusy-text-size']) rootAttributes['data-text-size'] = stored['inclusy-text-size'];
  function element(id) {
    if (!elements.has(id)) elements.set(id, {
      value: id === 'readingSpeed' ? '1' : '0', dataset: {}, hidden: true,
      children: [], events: {}, attributes: {}, disabled: false,
      addEventListener(type, callback) { this.events[type] = callback; },
      setAttribute(key, value) { this.attributes[key] = value; },
      add(option) { this.children.push(option); this.value = this.children[0].value; },
      replaceChildren() { this.children = []; },
      get selectedOptions() { return this.children.filter(child => child.value === this.value); },
      focus() { this.focused = true; context.document.activeElement = this; },
      querySelector() { return element(id + '-span'); },
      contains(node) {
        const controls = ['textNormal', 'textLarge', 'textLarger', 'themeDevice', 'themeDark', 'themeLight', 'solidToggle', 'listenToggle', 'readingReset', 'readingPlay', 'readingPause', 'readingStop', 'readingSection', 'readingVoice', 'readingSpeed'];
        return this === node || (id === 'readingControls' && controls.some(key => elements.get(key) === node));
      }
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
    document: {
      getElementById: element, querySelectorAll: () => [section],
      addEventListener(type, fn) { documentEvents[type] = fn; },
      documentElement: {
        getAttribute(key) { return rootAttributes[key] || null; },
        setAttribute(key, value) { rootAttributes[key] = value; },
        removeAttribute(key) { delete rootAttributes[key]; }
      }
    },
    window: {
      speechSynthesis: available ? synth : undefined, addEventListener() {}, dispatchEvent() {},
      matchMedia(query) {
        if (!queries.has(query)) queries.set(query, {
          matches: Boolean(device[query]), listeners: [],
          addEventListener(type, fn) { this.listeners.push(fn); }
        });
        return queries.get(query);
      }
    },
    localStorage: { getItem(key) { return storage.get(key) || null; }, setItem(key, value) { storage.set(key, value); }, removeItem(key) { storage.delete(key); } },
    Option: function(text, value) { this.textContent = text; this.value = value; },
    Event: function() {}, SpeechSynthesisUtterance: function(text) { this.text = text; }
  };
  vm.runInNewContext(READING_BAR_SCRIPT, context);
  return {
    element, spoken, storage, get cancelled() { return cancelled; }, get resumed() { return resumed; }, section, document: context.document,
    escape() { documentEvents.keydown({ key: 'Escape', preventDefault() { this.defaultPrevented = true; } }); },
    deviceChange(query, matches) { const media = queries.get(query); media.matches = matches; media.listeners.forEach(fn => fn()); }
  };
}

test('service page includes one reading bar, explicit preferences, and opted-in sections', () => {
  const html = buildHomePage({ mediaPreview: false });
  for (const id of ['readingBar', 'themeDevice', 'textNormal', 'listenPanel', 'preferencesToggle', 'menuToggle']) {
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
  h.document.activeElement = h.element('readingSection');
  h.escape();
  assert.equal(h.element('listenPanel').hidden, true);
  assert.equal(h.element('listenToggle').attributes['aria-expanded'], 'false');
  assert.equal(h.element('listenToggle').focused, true);
});

test('solid treatment can be toggled and reset', () => {
  const h = harness();
  h.element('solidToggle').checked = true;
  h.element('solidToggle').events.change();
  assert.equal(h.element('readingBar').dataset.solid, 'true');
  h.element('readingReset').events.click();
  assert.equal(h.element('readingBar').dataset.solid, 'false');
});

test('saved choices survive device changes and Device restores automatic theme following', () => {
  const h = harness(true, { stored: { 'inclusy-theme': 'light', 'inclusy-text-size': 'large' }, device: { '(prefers-color-scheme: dark)': true } });
  assert.equal(h.element('themeLight').checked, true);
  assert.equal(h.element('textLarge').checked, true);
  assert.match(h.element('readingSummary').textContent, /Large.*Light \(your choice\)/);
  assert.equal(h.element('devicePreferences').textContent, 'Theme: Light, your choice.');
  h.deviceChange('(prefers-color-scheme: dark)', false);
  assert.equal(h.document.documentElement.getAttribute('data-theme'), 'light');
  h.element('themeDevice').checked = true;
  h.element('themeDevice').events.change();
  assert.equal(h.storage.has('inclusy-theme'), false);
  assert.equal(h.document.documentElement.getAttribute('data-theme'), null);
  h.deviceChange('(prefers-color-scheme: dark)', true);
  assert.match(h.element('readingSummary').textContent, /Device \(dark\)/);
  assert.match(h.element('devicePreferences').textContent, /Following your device: dark theme/);
});

test('explicit text size is saved and reset restores device theme and normal text', () => {
  const h = harness();
  h.element('textLarger').checked = true;
  h.element('textLarger').events.change();
  h.element('themeDark').checked = true;
  h.element('themeDark').events.change();
  assert.equal(h.storage.get('inclusy-text-size'), 'xlarge');
  assert.equal(h.storage.get('inclusy-theme'), 'dark');
  h.element('readingReset').events.click();
  assert.equal(h.element('textNormal').checked, true);
  assert.equal(h.element('themeDevice').checked, true);
  assert.equal(h.storage.size, 0);
});

test('device solid-surface requirements remain effective after reset and preserve manual choice', () => {
  const h = harness(true, { stored: { 'workingaccess-solid': 'true' } });
  h.deviceChange('(prefers-reduced-transparency: reduce)', true);
  assert.equal(h.element('solidToggle').checked, true);
  assert.equal(h.element('solidToggle').disabled, true);
  assert.match(h.element('surfaceNote').textContent, /already applied/);
  h.deviceChange('(prefers-reduced-transparency: reduce)', false);
  assert.equal(h.element('solidToggle').checked, true);
  assert.equal(h.element('solidToggle').disabled, false);
  h.deviceChange('(prefers-contrast: more)', true);
  h.element('readingReset').events.click();
  assert.equal(h.element('readingBar').dataset.solid, 'true');
  h.deviceChange('(prefers-contrast: more)', false);
  assert.equal(h.element('solidToggle').checked, false);
});

test('mobile controls collapse, restore focus with Escape, and stay usable across resizing', () => {
  const h = harness(true, { device: { '(max-width: 768px)': true } });
  assert.equal(h.element('readingControls').hidden, true);
  h.element('preferencesToggle').events.click();
  assert.equal(h.element('readingControls').hidden, false);
  h.element('themeDark').focus();
  h.escape();
  assert.equal(h.document.activeElement, h.element('preferencesToggle'));
  assert.equal(h.element('readingControls').hidden, true);
  h.deviceChange('(max-width: 768px)', false);
  assert.equal(h.element('readingControls').hidden, false);
  assert.equal(h.document.activeElement, h.element('textNormal'));
  h.deviceChange('(max-width: 768px)', true);
  assert.equal(h.element('readingControls').hidden, false);
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

test('Escape stops playback from page content without moving focus into the toolbar', () => {
  const h = readyPlayback();
  const pageLink = h.element('pageLink');
  pageLink.focus();
  h.escape();
  assert.equal(h.cancelled, 1);
  assert.equal(h.element('readingPassage').hidden, true);
  assert.equal(h.document.activeElement, pageLink);
  h.spoken[0].onend();
  assert.equal(h.spoken.length, 1);
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
