import { escapeHtml } from '../escape.js';
import { page } from '../layout.js';

export function buildErrorPage(statusCode, title, message, { autoRefresh = 0 } = {}) {
  const head = autoRefresh > 0
    ? `  <meta http-equiv="refresh" content="${autoRefresh}">\n`
    : '';

  return page({
    title,
    path: '/',
    narrow: true,
    head,
    styles: `
    .error-page { padding: var(--s8) 0; }
    .error-code { font-size: var(--text-sm); font-weight: 700; color: var(--ink-muted); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: var(--s3); }
    .error-page h1 { margin-bottom: var(--s4); }
    .error-page p { font-size: var(--text-lg); color: var(--ink-muted); margin-bottom: var(--s6); }`,
    body: `
    <div class="error-page">
      <p class="error-code">${escapeHtml(String(statusCode))}</p>
      <h1>${escapeHtml(title)}</h1>
      <p aria-live="polite">${escapeHtml(message)}</p>
      <a href="/" class="btn">Back to home</a>
    </div>`
  });
}
