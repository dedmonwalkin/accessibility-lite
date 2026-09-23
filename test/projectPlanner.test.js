import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { PROJECT_OPTIONS, projectOutline, plannerScript } from '../src/ui/projectPlanner.js';
import { uiService } from '../src/services/uiService.js';

test('each scoping choice has a distinct outline and unknown values fall back safely', () => {
  assert.equal(new Set(PROJECT_OPTIONS.map(({ value }) => projectOutline(value).title)).size, PROJECT_OPTIONS.length);
  for (const value of [undefined, null, '', '__proto__', 'constructor', '<script>']) {
    assert.deepEqual(projectOutline(value), projectOutline('unsure'));
  }
  assert.match(projectOutline('reporting').text, /separate confirmation/);
});

test('planner reveals only after initialization and updates plain text without network or storage', () => {
  let click;
  const elements = {
    projectPlanner: { hidden: true },
    projectFocus: { value: 'unsure' },
    outlineButton: { addEventListener: (name, fn) => { assert.equal(name, 'click'); click = fn; } },
    outlineTitle: {},
    outlineText: {}
  };
  // No fetch, localStorage, or HTML setters are provided to the script.
  vm.runInNewContext(plannerScript(), { document: { getElementById: (id) => elements[id] } });
  assert.equal(elements.projectPlanner.hidden, false);
  for (const { value } of PROJECT_OPTIONS) {
    elements.projectFocus.value = value;
    click();
    assert.equal(elements.outlineTitle.textContent, projectOutline(value).title);
    assert.equal(elements.outlineText.textContent, projectOutline(value).text);
  }
  assert.doesNotThrow(() => vm.runInNewContext(plannerScript(), { document: { getElementById: () => null } }));
});

test('preference boot accepts known values and ignores invalid or unavailable storage', () => {
  const boot = uiService.buildHomePage().match(/<script>([\s\S]*?)<\/script>/)[1];
  for (const [theme, size, expected] of [
    ['dark', 'xlarge', { 'data-theme': 'dark', 'data-text-size': 'xlarge' }],
    ['light', 'normal', { 'data-theme': 'light', 'data-text-size': 'normal' }],
    ['invalid', 'huge', {}]
  ]) {
    const attrs = {};
    vm.runInNewContext(boot, {
      localStorage: { getItem: (key) => key === 'inclusy-theme' ? theme : size },
      document: { documentElement: { setAttribute: (key, value) => { attrs[key] = value; } } }
    });
    assert.deepEqual(attrs, expected);
  }
  assert.doesNotThrow(() => vm.runInNewContext(boot, {}));
});
