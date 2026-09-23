import { escapeHtml } from './escape.js';
import { SIGN_OVERLAY_THEMES } from '../config/accessibilityCatalog.js';

/**
 * The sign overlay is the one component that appears on three surfaces —
 * results, player, and the third-party embed — so it lives here rather than
 * being copy-pasted between them (which is what it was before).
 *
 * Its palette comes from SIGN_OVERLAY_THEMES, not from the site tokens: the
 * themes are user-selectable content, and each carries its own verified
 * contrast (high_contrast is 21:1 text, 12.4:1 tokens).
 */

export function resolveSignTheme(id) {
  return SIGN_OVERLAY_THEMES.find((t) => t.id === id) || SIGN_OVERLAY_THEMES[0];
}

function themeVars(theme) {
  return [
    ['--sign-bg', theme.background.color],
    ['--sign-bg-opacity', theme.background.opacity],
    ['--sign-primary', theme.palette.primary],
    ['--sign-secondary', theme.palette.secondary],
    ['--sign-accent', theme.palette.accent],
    ['--sign-text', theme.palette.text],
    ['--sign-token-bg', theme.palette.token_bg],
    ['--sign-font', theme.font.family],
    ['--sign-font-weight', theme.font.weight],
    ['--sign-font-size', `${theme.font.size_scale}rem`]
  ].map(([k, v]) => `${k}: ${v};`).join(' ');
}

export function signOverlayStyles(theme) {
  return `
  .sign-overlay {
    ${themeVars(theme)}
    background: var(--sign-bg);
    border-radius: var(--radius, 10px);
    padding: 16px;
    margin-bottom: 16px;
    color: var(--sign-text);
    font-family: var(--sign-font);
    font-weight: var(--sign-font-weight);
    font-size: var(--sign-font-size);
  }
  .sign-overlay.bg-gradient {
    background: linear-gradient(135deg, var(--sign-bg), color-mix(in oklab, var(--sign-bg) 60%, black));
  }
  .sign-overlay.bg-textured {
    background: var(--sign-bg);
    background-image: repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(0,0,0,0.03) 8px, rgba(0,0,0,0.03) 16px);
  }
  .sign-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
  .sign-header .pill { color: var(--sign-text); border-color: var(--sign-accent); }
  .sign-overlay .muted { color: var(--sign-text); }
  .sign-overlay :focus-visible { outline-color: var(--sign-accent); }
  .theme-select {
    background: var(--sign-bg); color: var(--sign-text);
    border: 1px solid var(--sign-accent); border-radius: 8px;
    padding: 6px 10px; font: inherit; font-size: 0.9rem; cursor: pointer;
    width: auto; max-width: 100%; min-height: 44px;
  }
  .sign-segments { display: flex; flex-direction: column; gap: 8px; }
  .sign-segments.layout-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
  .sign-segments.layout-inline { flex-direction: row; flex-wrap: wrap; gap: 6px; }
  .sign-segment { display: flex; flex-wrap: wrap; gap: 6px; align-items: baseline; }
  .sign-segment.is-active { outline: 2px solid var(--sign-accent); outline-offset: 3px; border-radius: 6px; }
  .sign-token {
    display: inline-block; background: var(--sign-token-bg); color: var(--sign-primary);
    padding: 4px 9px; border-radius: 6px; letter-spacing: 0.04em;
    font-weight: var(--sign-font-weight);
  }
  .sign-facial-cue { font-size: max(0.875rem, 0.75em); color: var(--sign-text); margin-left: 4px; }`;
}

export function backgroundClass(theme) {
  if (theme.background.style === 'gradient') return ' bg-gradient';
  if (theme.background.style === 'textured') return ' bg-textured';
  return '';
}

function layoutClass(theme) {
  if (theme.layout === 'grid') return ' layout-grid';
  if (theme.layout === 'inline') return ' layout-inline';
  return '';
}

/**
 * Pipeline segments carry `start_ms`/`end_ms` numbers alongside `start`/`end`
 * ISO strings; older and mock segments only carry numeric `start`/`end`.
 * Everything that needs a playback offset goes through here.
 */
export function segmentMs(segment, edge) {
  const ms = segment[`${edge}_ms`];
  if (typeof ms === 'number') return ms;
  const raw = segment[edge];
  if (typeof raw === 'number') return raw;
  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function signSegmentsHtml(segments = []) {
  if (!segments.length) return '<span class="muted">No sign data</span>';
  return segments.map((s) => `
        <div class="sign-segment" data-start="${segmentMs(s, 'start')}" data-end="${segmentMs(s, 'end')}">
          ${(s.gloss_tokens || []).map((t) => `<span class="sign-token">${escapeHtml(t)}</span>`).join('')}
          ${s.facial_cues?.length ? `<span class="sign-facial-cue">${escapeHtml(s.facial_cues.join(' '))}</span>` : ''}
        </div>`).join('');
}

/**
 * @param {object} opts
 * @param {string} opts.ariaLabel   region label — differs per surface, and the
 *                                  test suite asserts the exact strings
 * @param {boolean} opts.themeSelect render the theme picker
 * @param {string} opts.segmentsId   id for the live region (player uses signSegments)
 */
export function signOverlayHtml({ theme, segments, signLanguage, ariaLabel, themeSelect = false, segmentsId = '', limit = 0 }) {
  const shown = limit > 0 ? segments.slice(0, limit) : segments;
  const select = themeSelect
    ? `<select class="theme-select" id="themeSelect" aria-label="Sign overlay theme">
          ${SIGN_OVERLAY_THEMES.map((t) => `<option value="${t.id}"${t.id === theme.id ? ' selected' : ''}>${escapeHtml(t.name)}</option>`).join('')}
        </select>`
    : '';

  return `<div class="sign-overlay${backgroundClass(theme)}" id="signOverlay" role="region" aria-label="${escapeHtml(ariaLabel)}">
      <div class="sign-header">
        <span class="pill">Experimental sign gloss: ${escapeHtml(signLanguage)}${themeSelect ? '' : ` / ${escapeHtml(theme.name)}`}</span>
        ${select}
      </div>
      <div class="sign-segments${layoutClass(theme)}"${segmentsId ? ` id="${segmentsId}" aria-live="polite"` : ''}>${signSegmentsHtml(shown)}
      </div>
    </div>`;
}

/** Client-side theme switching, shared by the player and the embed. */
export function signThemeScript() {
  return `
    var allThemes = ${JSON.stringify(SIGN_OVERLAY_THEMES)};

    function applySignTheme(theme, overlay, segments) {
      if (!overlay) return;
      var vars = {
        '--sign-bg': theme.background.color,
        '--sign-bg-opacity': theme.background.opacity,
        '--sign-primary': theme.palette.primary,
        '--sign-secondary': theme.palette.secondary,
        '--sign-accent': theme.palette.accent,
        '--sign-text': theme.palette.text,
        '--sign-token-bg': theme.palette.token_bg,
        '--sign-font': theme.font.family,
        '--sign-font-weight': theme.font.weight,
        '--sign-font-size': theme.font.size_scale + 'rem'
      };
      Object.keys(vars).forEach(function (k) { overlay.style.setProperty(k, vars[k]); });
      overlay.className = 'sign-overlay' + (theme.background.style === 'gradient' ? ' bg-gradient'
        : theme.background.style === 'textured' ? ' bg-textured' : '');
      if (segments) {
        segments.className = 'sign-segments' + (theme.layout === 'grid' ? ' layout-grid'
          : theme.layout === 'inline' ? ' layout-inline' : '');
      }
    }`;
}
