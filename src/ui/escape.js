export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * Only http/https URLs survive. Anything else — javascript:, data:, a relative
 * path, garbage — returns ''. Used for the `src` the iframe embed accepts from
 * a query param, which is otherwise an XSS and open-redirect vector.
 */
export function safeMediaUrl(value) {
  if (!value) return '';
  let parsed;
  try {
    parsed = new URL(String(value));
  } catch {
    return '';
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
  return parsed.href;
}
