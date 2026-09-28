import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {normalizePreferences, groupBlocks, extractSections} from '../extension/core.js';

test('extension permissions are click-to-run, not ongoing all-site access', async () => {
  const manifest = JSON.parse(await readFile(new URL('../extension/manifest.json', import.meta.url)));
  assert.equal(manifest.manifest_version, 3);
  assert.deepEqual(manifest.permissions, ['activeTab', 'scripting', 'storage']);
  assert.equal(manifest.host_permissions, undefined);
  assert.equal(manifest.content_scripts, undefined);
  assert.equal(manifest.externally_connectable, undefined);
  assert.match(manifest.content_security_policy.extension_pages, /connect-src 'none'/);
});

test('only allowlisted reading preferences survive normalization', () => {
  assert.deepEqual(normalizePreferences({theme: 'dark', size: 26, font: 'sans', spacing: 'wide', solid: true, rate: 1.2, text: 'private', url: 'secret'}),
    {theme: 'dark', size: 26, font: 'sans', spacing: 'wide', solid: true, rate: 1.2});
  assert.deepEqual(normalizePreferences({size: -20, theme: 'script', rate: 100}), normalizePreferences(null));
});

test('section grouping preserves reading order and drops empty headings', () => {
  assert.deepEqual(groupBlocks([
    {text: 'Introduction'}, {heading: true, text: 'Empty'},
    {heading: true, text: 'Details'}, {text: ' First paragraph '}, {text: 'Second paragraph'}
  ], 'Page').sections, [
    {title: 'Page', paragraphs: ['Introduction']},
    {title: 'Details', paragraphs: ['First paragraph', 'Second paragraph']}
  ]);
});

test('extraction budget is explicit and never silently invents content', () => {
  const result = groupBlocks([{text: '12345'}, {text: '67890'}], 'Page', 7);
  assert.equal(result.truncated, true);
  assert.deepEqual(result.sections, [{title: 'Page', paragraphs: ['12345']}]);
  assert.deepEqual(groupBlocks([], 'Page'), {sections: [], truncated: false});
});

function extractionFixture({selected = false, selectionIndices = []} = {}) {
  const root = {closest: () => null, getClientRects: () => [1]};
  const nodes = [
    ['H1', 'Public heading'], ['P', 'Visible article text'], ['P', 'FORM_SECRET', true],
    ['P', 'HIDDEN_SECRET', false, true], ['P', 'Second visible paragraph']
  ].map(([tagName, text, excluded, hidden]) => {
    const node = {tagName, parentElement: root, excluded, hidden, getClientRects: () => [1]};
    node.closest = selector => selector.startsWith('h1') ? node : excluded ? node : null;
    node.textNodes = [{textContent: text, parentElement: node}];
    return node;
  });
  root.querySelectorAll = () => nodes;
  const doc = {
    title: 'Fallback', body: root, documentElement: {lang: 'en-GB'}, querySelectorAll: () => [root],
    defaultView: {getComputedStyle: node => ({display: 'block', visibility: node.hidden ? 'hidden' : 'visible', opacity: '1'}),
      getSelection: () => ({isCollapsed: !selected, rangeCount: selected ? 1 : 0, getRangeAt: () => ({intersectsNode: node => selectionIndices.includes(nodes.indexOf(node))})})},
    createTreeWalker: node => { let index = 0; return {nextNode() { this.currentNode = node.textNodes[index++]; return Boolean(this.currentNode); }}; }
  };
  return doc;
}

test('DOM extraction excludes form and CSS-hidden blocks', () => {
  const result = extractSections(extractionFixture(), groupBlocks);
  assert.deepEqual(result.sections, [{title: 'Public heading', paragraphs: ['Visible article text', 'Second visible paragraph']}]);
  assert.equal(result.title, 'Public heading');
  assert.equal(result.language, 'en-GB');
});

test('selected passages do not pull in unrelated paragraphs', () => {
  const result = extractSections(extractionFixture({selected: true, selectionIndices: [4]}), groupBlocks);
  assert.equal(result.selection, true);
  assert.deepEqual(result.sections, [{title: 'Selected passages', paragraphs: ['Second visible paragraph']}]);
});

test('a selection containing only excluded content does not silently read the whole page', () => {
  const result = extractSections(extractionFixture({selected: true, selectionIndices: [2, 3]}), groupBlocks);
  assert.equal(result.selection, true);
  assert.deepEqual(result.sections, []);
});

test('background injects only into the clicked HTTP tab and reports restricted pages', async () => {
  let clicked;
  const injections = [];
  const badges = [];
  const context = {chrome: {
    action: {onClicked: {addListener(fn) { clicked = fn; }}, setBadgeText: async value => badges.push(value), setTitle: async () => {}},
    scripting: {executeScript: async value => injections.push(value)}
  }};
  vm.runInNewContext(await readFile(new URL('../extension/background.js', import.meta.url), 'utf8'), context);
  await clicked({id: 7, url: 'https://example.com/article'});
  assert.equal(injections[0].target.tabId, 7);
  assert.deepEqual(Array.from(injections[0].files), ['reader.bundle.js']);
  assert.equal(injections[0].target.allFrames, undefined);
  await clicked({id: 8, url: 'chrome://settings'});
  assert.equal(injections.length, 1);
  assert.equal(badges.at(-1).text, '!');
});

test('injection failures report unavailable without fetching or requesting broader access', async () => {
  let clicked;
  let badge;
  const context = {chrome: {
    action: {onClicked: {addListener(fn) { clicked = fn; }}, setBadgeText: async value => { badge = value.text; }, setTitle: async () => {}},
    scripting: {executeScript: async () => { throw new Error('Denied'); }}
  }};
  vm.runInNewContext(await readFile(new URL('../extension/background.js', import.meta.url), 'utf8'), context);
  await clicked({id: 7, url: 'https://example.com'});
  assert.equal(badge, '!');
});

test('reader text, primary controls and borders clear contrast thresholds in both palettes', async () => {
  const css = await readFile(new URL('../extension/reader.css', import.meta.url), 'utf8');
  const luminance = hex => {
    const channels = hex.slice(1).match(/../g).map(pair => parseInt(pair, 16) / 255)
      .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  const ratio = (a, b) => { const values = [luminance(a), luminance(b)].sort((x, y) => y - x); return (values[0] + 0.05) / (values[1] + 0.05); };
  for (const pattern of [/dialog \{([\s\S]*?)\}/, /dialog\[data-dark="true"\] \{([\s\S]*?)\}/]) {
    const palette = Object.fromEntries([...css.match(pattern)[1].matchAll(/--([a-z]+): (#[a-f0-9]{6})/g)].map(match => [match[1], match[2]]));
    for (const background of [palette.paper, palette.panel]) {
      for (const foreground of [palette.ink, palette.muted]) assert.ok(ratio(foreground, background) >= 4.5);
      assert.ok(ratio(palette.line, background) >= 3);
      assert.ok(ratio(palette.accent, background) >= 3);
    }
    assert.ok(ratio(palette.on, palette.accent) >= 4.5);
  }
});
