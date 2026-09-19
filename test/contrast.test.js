import test from 'node:test';
import assert from 'node:assert/strict';
import { PALETTE } from '../src/ui/tokens.js';
import { SIGN_OVERLAY_THEMES } from '../src/config/accessibilityCatalog.js';

/**
 * The site failed WCAG on its own footer before the redesign — 3.37:1, from
 * text dimmed with `opacity`. These tests exist so that can't come back
 * silently: change a token and the suite tells you what it broke.
 */

function channels(hex) {
  return hex.replace('#', '').match(/../g).map((pair) => parseInt(pair, 16) / 255);
}

function relativeLuminance(hex) {
  const [r, g, b] = channels(hex).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a, b) {
  const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

const AA_TEXT = 4.5;
const AA_NON_TEXT = 3.0;

for (const scheme of ['light', 'dark']) {
  const p = PALETTE[scheme];

  test(`${scheme}: editorial colors and focus indicators clear contrast thresholds`, () => {
    for (const background of [p.bg, p.surface, p.wash]) {
      for (const foreground of [p.ink, p.inkMuted, p.accent, p.clay]) {
        assert.ok(contrastRatio(foreground, background) >= AA_TEXT,
          `${foreground} on ${background} is ${contrastRatio(foreground, background).toFixed(2)}:1`);
      }
      assert.ok(contrastRatio(p.border, background) >= AA_NON_TEXT,
        `border on ${background} is ${contrastRatio(p.border, background).toFixed(2)}:1`);
    }
  });

  test(`${scheme}: body text clears AA on both surfaces`, () => {
    for (const background of [p.bg, p.surface]) {
      assert.ok(contrastRatio(p.ink, background) >= AA_TEXT,
        `ink on ${background} is ${contrastRatio(p.ink, background).toFixed(2)}:1`);
    }
  });

  test(`${scheme}: muted text clears AA on both surfaces`, () => {
    for (const background of [p.bg, p.surface]) {
      assert.ok(contrastRatio(p.inkMuted, background) >= AA_TEXT,
        `ink-muted on ${background} is ${contrastRatio(p.inkMuted, background).toFixed(2)}:1`);
    }
  });

  test(`${scheme}: links and buttons clear AA`, () => {
    assert.ok(contrastRatio(p.accent, p.bg) >= AA_TEXT, 'accent on bg');
    assert.ok(contrastRatio(p.accent, p.surface) >= AA_TEXT, 'accent on surface');
    assert.ok(contrastRatio(p.onAccent, p.accent) >= AA_TEXT, 'button label on accent');
  });

  test(`${scheme}: status colors clear AA`, () => {
    assert.ok(contrastRatio(p.danger, p.bg) >= AA_TEXT, 'danger on bg');
    assert.ok(contrastRatio(p.danger, p.surface) >= AA_TEXT, 'danger on surface');
    assert.ok(contrastRatio(p.success, p.bg) >= AA_TEXT, 'success on bg');
    assert.ok(contrastRatio(p.success, p.surface) >= AA_TEXT, 'success on surface');
  });

  test(`${scheme}: interactive borders clear SC 1.4.11`, () => {
    assert.ok(contrastRatio(p.border, p.bg) >= AA_NON_TEXT,
      `border on bg is ${contrastRatio(p.border, p.bg).toFixed(2)}:1`);
    assert.ok(contrastRatio(p.border, p.surface) >= AA_NON_TEXT,
      `border on surface is ${contrastRatio(p.border, p.surface).toFixed(2)}:1`);
  });
}

test('sign overlay themes clear AA for text and gloss tokens', () => {
  for (const theme of SIGN_OVERLAY_THEMES) {
    const text = contrastRatio(theme.palette.text, theme.background.color);
    const token = contrastRatio(theme.palette.primary, theme.palette.token_bg);
    assert.ok(text >= AA_TEXT, `${theme.id} text is ${text.toFixed(2)}:1`);
    assert.ok(token >= AA_TEXT, `${theme.id} gloss token is ${token.toFixed(2)}:1`);
  }
});
