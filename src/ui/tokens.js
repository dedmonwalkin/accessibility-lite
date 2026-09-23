/**
 * Design tokens for Whakauru.
 *
 * Two rules govern everything here, and both exist because this is an
 * accessibility product where the site itself is the first demo:
 *
 *   1. No text below 14px. Body is 18px.
 *   2. No opacity-dimmed text. Every muted value is a token whose contrast
 *      ratio against its own background has been measured.
 *
 * `npm test` checks text and control contrast in both themes. Run it whenever
 * a color changes; decorative rules are not control boundaries.
 */

export const PALETTE = {
  light: {
    bg: '#FCFBF8',
    surface: '#FFFFFF',
    ink: '#16130F',
    inkMuted: '#514A40',
    accent: '#0B5D51',
    onAccent: '#FFFFFF',
    border: '#82786B',
    rule: '#DED8CE',
    clay: '#98431E',
    wash: '#EEF2EB',
    danger: '#A81E1E',
    success: '#0F6B3F'
  },
  dark: {
    bg: '#121713',
    surface: '#19211C',
    ink: '#F2F1E9',
    inkMuted: '#BDC8BC',
    accent: '#9BD7BE',
    onAccent: '#10251B',
    border: '#8D9B8E',
    rule: '#354337',
    clay: '#F0B18B',
    wash: '#24372D',
    danger: '#FF9B9B',
    success: '#7EE2A8'
  }
};

function vars(scheme) {
  const p = PALETTE[scheme];
  return `
    --bg: ${p.bg};
    --surface: ${p.surface};
    --ink: ${p.ink};
    --ink-muted: ${p.inkMuted};
    --accent: ${p.accent};
    --on-accent: ${p.onAccent};
    --border: ${p.border};
    --rule: ${p.rule};
    --clay: ${p.clay};
    --wash: ${p.wash};
    --danger: ${p.danger};
    --success: ${p.success};`;
}

/** Font face declarations. Self-hosted — no third-party request, no CDN. */
const FONT_FACES = ['400', '700']
  .flatMap((weight) => [
    { weight, subset: 'latin', range: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD' },
    { weight, subset: 'latin-ext', range: 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF' }
  ])
  .map(({ weight, subset, range }) => `
  @font-face {
    font-family: "Atkinson Hyperlegible";
    font-style: normal;
    font-weight: ${weight};
    font-display: swap;
    src: url("/static/fonts/atkinson-${weight}-${subset}.woff2") format("woff2");
    unicode-range: ${range};
  }`)
  .join('');

/**
 * Base stylesheet shared by every page. Page-specific CSS is appended by the
 * page module rather than accumulating here.
 */
export const BASE_STYLES = `${FONT_FACES}

  :root {
    color-scheme: light;
${vars('light')}

    /* Type scale — 18px base, 1.25 ratio. Nothing below 0.875rem (14px). */
    --font-sans: "Atkinson Hyperlegible", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
    --font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
    --text-xs: 0.875rem;
    --text-sm: 1rem;
    --text-base: 1.125rem;
    --text-lg: 1.375rem;
    --text-xl: 1.75rem;
    --text-2xl: 2.25rem;
    --text-3xl: 3rem;

    /* 4px spacing scale. */
    --s1: 4px;  --s2: 8px;  --s3: 12px; --s4: 16px;
    --s5: 24px; --s6: 32px; --s7: 48px; --s8: 64px; --s9: 96px;

    --radius: 4px;
    --measure: 68ch;
    --page: 1120px;
  }

  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {${vars('dark')}
      color-scheme: dark;
    }
  }
  :root[data-theme="dark"] {${vars('dark')}
    color-scheme: dark;
  }

  /* Text-size control. Scales the whole type system, not just body copy. */
  :root[data-text-size="large"] { font-size: 125%; }
  :root[data-text-size="xlarge"] { font-size: 150%; }

  @media (prefers-contrast: more) {
    :root {
      --ink-muted: var(--ink);
      --border: var(--ink);
      --rule: var(--ink-muted);
    }
  }

  * { box-sizing: border-box; }

  html { -webkit-text-size-adjust: 100%; }

  body {
    margin: 0;
    background: var(--bg);
    color: var(--ink);
    font-family: var(--font-sans);
    font-size: var(--text-base);
    line-height: 1.6;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .container {
    width: 100%;
    max-width: var(--page);
    margin: 0 auto;
    padding: var(--s6) var(--s5);
    flex: 1;
  }
  .container--narrow { max-width: 760px; }

  h1, h2, h3 { line-height: 1.2; text-wrap: balance; margin: 0; font-weight: 700; }
  h1 { font-size: var(--text-2xl); }
  h2 { font-size: var(--text-xl); }
  h3 { font-size: var(--text-lg); }
  p { margin: 0 0 var(--s4); max-width: var(--measure); }
  .subtitle { color: var(--ink-muted); margin: var(--s2) 0 var(--s6); font-size: var(--text-sm); }
  .muted { color: var(--ink-muted); }
  .small { font-size: var(--text-xs); }

  a { color: var(--accent); text-underline-offset: 3px; }
  a:hover { text-decoration-thickness: 2px; }

  /* Focus is never removed, only made obvious. */
  :focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 2px;
    border-radius: 3px;
  }

  /* ── Surfaces ──────────────────────────────────────────────────
     Cards are for genuine grouping only. Most sections are separated
     by a rule and space, not a box. */
  .panel {
    background: var(--surface);
    border: 1px solid var(--rule);
    border-radius: var(--radius);
    padding: var(--s5);
    margin-bottom: var(--s4);
  }
  .section { padding: var(--s7) 0; border-top: 1px solid var(--rule); }
  .section:first-of-type { border-top: 0; padding-top: 0; }
  .section > h2 { margin-bottom: var(--s5); }

  /* ── Controls ──────────────────────────────────────────────────*/
  label { display: block; margin: var(--s4) 0 var(--s2); font-size: var(--text-sm); font-weight: 700; }

  select, input[type="text"], input[type="file"] {
    width: 100%;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--ink);
    padding: var(--s3);
    font: inherit;
    font-size: var(--text-sm);
  }
  select[multiple] { height: 180px; }

  .radio-group { display: flex; gap: var(--s2); flex-wrap: wrap; margin-top: var(--s2); }
  .radio-group label {
    display: inline-flex; align-items: center; gap: var(--s2);
    margin: 0; font-weight: 400; font-size: var(--text-sm);
    cursor: pointer; padding: var(--s2) var(--s3);
    border: 1px solid var(--border); border-radius: var(--radius);
    background: var(--surface);
  }
  .radio-group label:has(input:checked) {
    border-color: var(--accent);
    box-shadow: inset 0 0 0 1px var(--accent);
  }
  .radio-group input { accent-color: var(--accent); width: 1.1em; height: 1.1em; }

  .btn, .btn-outline {
    display: inline-flex; align-items: center; justify-content: center; gap: var(--s2);
    padding: var(--s3) var(--s5);
    border-radius: var(--radius);
    font: inherit; font-size: var(--text-sm); font-weight: 700;
    cursor: pointer; text-decoration: none;
    border: 2px solid transparent;
  }
  .btn { background: var(--accent); color: var(--on-accent); border-color: var(--accent); }
  .btn:hover { filter: brightness(1.08); }
  .btn:disabled { opacity: 0.55; cursor: not-allowed; filter: none; }
  .btn-outline { background: transparent; color: var(--accent); border-color: var(--accent); }
  .btn-outline:hover { background: color-mix(in oklab, var(--accent) 12%, transparent); }
  .btn-outline:disabled { opacity: 0.55; cursor: not-allowed; }

  .pill {
    display: inline-block;
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: var(--s1) var(--s3);
    font-size: var(--text-xs);
    font-weight: 700;
    color: var(--ink-muted);
  }

  .error { color: var(--danger); font-weight: 700; margin-top: var(--s3); }
  .file-info { color: var(--success); font-weight: 700; margin-top: var(--s3); }

  /* ── Feedback ──────────────────────────────────────────────────*/
  .spinner {
    display: inline-block; width: 1em; height: 1em;
    border: 2px solid color-mix(in oklab, currentColor 30%, transparent);
    border-top-color: currentColor; border-radius: 50%;
    animation: spin .6s linear infinite; vertical-align: -0.15em;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .progress-bar {
    width: 100%; height: 10px;
    background: var(--rule);
    border: 1px solid var(--border);
    border-radius: 999px;
    overflow: hidden;
    margin: var(--s3) 0;
  }
  .progress-bar .fill {
    height: 100%; width: 0%;
    background: var(--accent);
    transition: width 0.3s;
  }

  .visually-hidden {
    position: absolute; width: 1px; height: 1px;
    padding: 0; margin: -1px; overflow: hidden;
    clip: rect(0 0 0 0); white-space: nowrap; border: 0;
  }

  video, audio { width: 100%; border-radius: var(--radius); background: #000; }
  audio { border-radius: 999px; }

  @media (max-width: 768px) {
    .container { padding: var(--s5) var(--s4); }
    h1 { font-size: var(--text-xl); }
    .radio-group { flex-direction: column; align-items: stretch; }
  }
  @media (max-width: 480px) {
    .container { padding: var(--s4) var(--s3); }
    .btn, .btn-outline { width: 100%; }
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
`;
