import { escapeHtml } from './escape.js';
import { BASE_STYLES } from './tokens.js';

export const SITE_URL = (process.env.SITE_URL || 'https://workingaccess.org').replace(/\/$/, '');

const FAVICON_SVG = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">' +
  '<rect width="32" height="32" rx="4" fill="#0B5D51"/>' +
  '<path d="M7 23L13 9l6 14 6-14M7 16h18" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>' +
  '</svg>'
)}`;

/**
 * Runs before first paint so the stored theme and text size apply without a
 * flash. Deliberately tiny and inline — a separate request would defeat it.
 */
const PREFERENCE_BOOT = `
  (function () {
    try {
      var t = localStorage.getItem('inclusy-theme');
      if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
      var s = localStorage.getItem('inclusy-text-size');
      if (['normal', 'large', 'xlarge'].includes(s)) document.documentElement.setAttribute('data-text-size', s);
    } catch (e) {}
  })();`;

const PREFERENCE_CONTROLS_SCRIPT = `
  (function () {
    var root = document.documentElement;
    var sizes = ['normal', 'large', 'xlarge'];
    var sizeLabels = { normal: 'A', large: 'A+', xlarge: 'A++' };

    function currentSize() {
      return root.getAttribute('data-text-size') || 'normal';
    }
    function currentTheme() {
      if (root.getAttribute('data-theme')) return root.getAttribute('data-theme');
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    var sizeBtn = document.getElementById('textSizeToggle');
    var themeBtn = document.getElementById('themeToggle');
    if (!sizeBtn || !themeBtn) return;

    function paintSize() {
      var s = currentSize();
      sizeBtn.textContent = sizeLabels[s];
      sizeBtn.setAttribute('aria-label', 'Text size: ' + s + '. Activate to change.');
    }
    function paintTheme() {
      var t = currentTheme();
      themeBtn.textContent = t === 'dark' ? 'Light' : 'Dark';
      themeBtn.setAttribute('aria-label', 'Switch to ' + (t === 'dark' ? 'light' : 'dark') + ' theme');
    }

    sizeBtn.addEventListener('click', function () {
      var next = sizes[(sizes.indexOf(currentSize()) + 1) % sizes.length];
      root.setAttribute('data-text-size', next);
      try { localStorage.setItem('inclusy-text-size', next); } catch (e) {}
      paintSize();
    });

    themeBtn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('inclusy-theme', next); } catch (e) {}
      paintTheme();
    });

    paintSize();
    paintTheme();
  })();`;

const CHROME_STYLES = `
  .skip-link {
    position: absolute; left: var(--s4); top: -100px;
    background: var(--accent); color: var(--on-accent);
    padding: var(--s3) var(--s4); border-radius: var(--radius);
    font-weight: 700; text-decoration: none; z-index: 10;
  }
  .skip-link:focus { top: var(--s4); }

  .site-header {
    border-bottom: 1px solid var(--rule);
    background: var(--bg);
  }
  .site-header .inner {
    max-width: var(--page); margin: 0 auto;
    padding: var(--s4) var(--s5);
    display: flex; align-items: center; gap: var(--s5);
    flex-wrap: wrap;
  }
  .wordmark {
    display: inline-flex; align-items: center; gap: var(--s2);
    font-weight: 700; font-size: var(--text-lg);
    color: var(--ink); text-decoration: none; letter-spacing: -0.01em;
  }
  .wordmark svg { width: 1.35em; height: 1.35em; }
  .site-nav { display: flex; gap: var(--s4); margin-left: auto; align-items: center; flex-wrap: wrap; }
  .site-nav a { display: inline-flex; align-items: center; min-height: 44px; color: var(--ink-muted); text-decoration: none; font-size: var(--text-sm); font-weight: 700; }
  .site-nav a:hover { color: var(--ink); text-decoration: underline; }

  .pref-controls { display: flex; gap: var(--s2); }
  .pref-btn {
    min-width: 3.25rem; min-height: 44px; padding: var(--s1) var(--s2);
    border: 1px solid var(--border); border-radius: var(--radius);
    background: var(--surface); color: var(--ink);
    font: inherit; font-size: var(--text-xs); font-weight: 700;
    cursor: pointer;
  }
  .pref-btn:hover { border-color: var(--accent); color: var(--accent); }

  .site-footer {
    border-top: 1px solid var(--rule);
    padding: var(--s6) var(--s5);
    font-size: var(--text-sm);
    color: var(--ink-muted);
  }
  .site-footer .inner {
    max-width: var(--page); margin: 0 auto;
    display: flex; gap: var(--s4); justify-content: space-between; flex-wrap: wrap;
  }
  .site-footer nav { display: flex; gap: var(--s4); flex-wrap: wrap; }

  @media (max-width: 768px) {
    .site-header .inner { gap: var(--s3); }
    .site-nav { gap: var(--s3); width: 100%; margin-left: 0; }
  }
`;

function markSvg() {
  return '<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">' +
    '<rect width="32" height="32" rx="4" fill="var(--accent)"/>' +
    '<path d="M7 23L13 9l6 14 6-14M7 16h18" fill="none" stroke="var(--on-accent)" stroke-width="2" stroke-linejoin="round"/>' +
    '</svg>';
}

function header({ compact = false, mediaPreview = true } = {}) {
  if (compact) return '';
  return `
  <header class="site-header">
    <div class="inner">
      <a class="wordmark" href="/">${markSvg()} Working Access</a>
      <nav class="site-nav" aria-label="Main">
        <a href="/#services">Services</a>
        <a href="/#approach">Approach</a>
        <a href="/#name">Our purpose</a>
        ${mediaPreview ? '<a href="/media">Media preview</a>' : '<a href="/#accessibility">Accessibility</a>'}
        <a href="/#contact">Contact</a>
        <div class="pref-controls">
          <button type="button" class="pref-btn" id="textSizeToggle" aria-label="Change text size">A</button>
          <button type="button" class="pref-btn" id="themeToggle" aria-label="Switch theme">Dark</button>
        </div>
      </nav>
    </div>
  </header>`;
}

function footer({ compact = false, mediaPreview = true } = {}) {
  if (compact) return '';
  return `
  <footer class="site-footer">
    <div class="inner">
      <span>Working Access. Nobody gets left off the map.<br>Built by <a href="https://github.com/dedmonwalkin">Isabella &amp; Tan</a>.</span>
      <nav aria-label="Footer">
        <a href="/#accessibility">Accessibility</a>
        ${mediaPreview ? '<a href="/embed">Media embed guide</a><a href="https://github.com/dedmonwalkin/accessibility-lite">Media source (MIT)</a>' : '<a href="/#contact">Contact</a>'}
      </nav>
    </div>
  </footer>`;
}

/**
 * The single HTML shell. Every page goes through here, which is what keeps the
 * head tags, theme boot, and chrome from drifting apart across pages.
 */
export function page({
  title,
  description = 'Working Access accessibility services in development and open-source media tools. Outputs require human review.',
  path = '/',
  styles = '',
  body,
  scripts = '',
  narrow = false,
  compact = false,
  mediaPreview = true,
  head = ''
}) {
  const fullTitle = title === 'Working Access' ? 'Working Access' : `${title} — Working Access`;
  const canonical = `${SITE_URL}${path}`;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(fullTitle)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${escapeHtml(canonical)}" />
  <meta name="theme-color" content="#FCFBF8" media="(prefers-color-scheme: light)" />
  <meta name="theme-color" content="#121713" media="(prefers-color-scheme: dark)" />
  <meta property="og:site_name" content="Working Access" />
  <meta property="og:title" content="${escapeHtml(fullTitle)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${escapeHtml(canonical)}" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="${escapeHtml(fullTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <link rel="icon" type="image/svg+xml" href="${FAVICON_SVG}" />
  <link rel="preload" href="/static/fonts/atkinson-400-latin.woff2" as="font" type="font/woff2" crossorigin />
${head}
  <script>${PREFERENCE_BOOT}</script>
  <style>${BASE_STYLES}${CHROME_STYLES}${styles}</style>
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
${header({ compact, mediaPreview })}
  <main class="container${narrow ? ' container--narrow' : ''}" id="main" tabindex="-1">
${body}
  </main>
${footer({ compact, mediaPreview })}
  <script>${PREFERENCE_CONTROLS_SCRIPT}</script>
${scripts ? `  <script>${scripts}</script>` : ''}
</body>
</html>`;
}
