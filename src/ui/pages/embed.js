import { escapeHtml, safeMediaUrl } from '../escape.js';
import { page, SITE_URL } from '../layout.js';

const OPTIONS = [
  ['data-inclusy', 'required', 'The embed ID you get from publishing a result.'],
  ['data-target', 'first &lt;video&gt;', 'CSS selector for the video to attach to.'],
  ['data-lang', 'the job default', 'Caption language, e.g. <code>es-ES</code>. Must be one you generated.'],
  ['data-sign', '<code>on</code>', '<code>on</code> or <code>off</code>. Shows the sign gloss overlay.'],
  ['data-ad', '<code>panel</code>', '<code>panel</code> shows description text, <code>speak</code> reads it aloud and ducks the video, <code>off</code> disables it.'],
  ['data-position', '<code>top-right</code>', 'Overlay corner: <code>top-left</code>, <code>top-right</code>, <code>bottom-left</code>, <code>bottom-right</code>. The bottom of the frame is left to the caption line and the player controls, so the overlay starts at the top.']
];

export function buildEmbedDocsPage({ embedId = '' } = {}) {
  const id = embedId ? escapeHtml(embedId) : 'YOUR_EMBED_ID';

  const scriptSnippet = escapeHtml(
`<video src="my-talk.mp4" controls></video>

<script src="${SITE_URL}/embed.js"
        data-inclusy="${embedId || 'YOUR_EMBED_ID'}"
        data-lang="en-US"
        data-sign="on"
        data-ad="panel"></script>`);

  const iframeSnippet = escapeHtml(
`<iframe src="${SITE_URL}/embed/${embedId || 'YOUR_EMBED_ID'}?src=https://yoursite.com/my-talk.mp4"
        width="100%" height="480"
        allowfullscreen
        title="Accessible player"></iframe>`);

  return page({
    title: 'Add Inclusy to your site',
    description: 'One script tag adds captions, audio descriptions, and a sign language overlay to a video you already host.',
    path: '/embed',
    narrow: true,
    styles: `
    .snippet {
      font-family: var(--font-mono); font-size: var(--text-xs); line-height: 1.6;
      background: var(--surface); border: 1px solid var(--rule);
      border-radius: var(--radius); padding: var(--s4);
      overflow-x: auto; white-space: pre; margin: 0 0 var(--s4);
    }
    table { border-collapse: collapse; width: 100%; font-size: var(--text-sm); }
    th, td { text-align: left; padding: var(--s3) var(--s2); border-bottom: 1px solid var(--rule); vertical-align: top; }
    th { font-size: var(--text-xs); text-transform: uppercase; letter-spacing: 0.06em; color: var(--ink-muted); }
    td code, p code { font-family: var(--font-mono); font-size: 0.9em; background: var(--surface); border: 1px solid var(--rule); border-radius: 4px; padding: 1px 5px; }
    td:first-child, td:nth-child(2) { white-space: nowrap; }
    .table-scroll { overflow-x: auto; }
    ol { max-width: var(--measure); padding-left: 1.2em; }
    ol li { margin-bottom: var(--s2); }`,
    body: `
    <h1>Add Inclusy to your site</h1>
    <p class="subtitle">One script tag. Captions, audio description, and a sign overlay on a video you already host.</p>

    <section class="section">
      <h2>How it works</h2>
      <ol>
        <li>Upload and process a file, then press <strong>Publish and get embed code</strong> on the results page.</li>
        <li>Paste the snippet onto the page that has your video.</li>
        <li>The script finds the video, attaches a real caption track, and draws the sign and description overlay on top.</li>
      </ol>
      <p><strong>We never serve your video.</strong> Inclusy only sends the accessibility layer — a few kilobytes of caption, description, and sign data. Your media stays on your own host, so there is no bandwidth cost and nothing to migrate. Published embeds are not deleted after 24 hours.</p>
    </section>

    <section class="section">
      <h2>Script tag</h2>
      <pre class="snippet">${scriptSnippet}</pre>
      <p class="muted small">Works on any page you can add a script to. The overlay renders in a shadow root, so your site's CSS can't break it and it can't break your site's CSS.</p>
    </section>

    <section class="section">
      <h2>Options</h2>
      <div class="table-scroll">
        <table>
          <thead><tr><th scope="col">Attribute</th><th scope="col">Default</th><th scope="col">What it does</th></tr></thead>
          <tbody>
            ${OPTIONS.map(([attr, def, desc]) => `<tr><td><code>${attr}</code></td><td>${def}</td><td>${desc}</td></tr>`).join('\n            ')}
          </tbody>
        </table>
      </div>
    </section>

    <section class="section">
      <h2>iframe fallback</h2>
      <p>Some platforms strip <code>&lt;script&gt;</code> tags — Squarespace blocks, Notion, most newsletter tools. Use the iframe instead. Pass your video URL as <code>src</code>.</p>
      <pre class="snippet">${iframeSnippet}</pre>
    </section>

    <section class="section">
      <h2>Accessibility of the overlay itself</h2>
      <p>The captions become a native text track, so they work with the browser's own caption UI and with screen readers. The description panel is a polite live region. The sign and description toggles are real buttons, reachable by keyboard, with <code>aria-pressed</code> state. The overlay honours <code>prefers-reduced-motion</code>. If anything fails to load, the script warns to the console and leaves your page exactly as it was.</p>
    </section>

    <section class="section">
      <h2>Don't have an embed ID yet?</h2>
      <p>${embedId ? `You're using <code>${id}</code>.` : 'Process a file first, then publish the result.'}</p>
      <a href="/#upload" class="btn">Upload a file</a>
    </section>`
  });
}

/**
 * Chromeless player for the iframe fallback. The `src` comes from a query
 * param, so it goes through safeMediaUrl — http/https only — before it is ever
 * written into an attribute.
 */
export function buildEmbedFramePage({ embedId, src, lang = '', sign = 'on', ad = 'panel' }) {
  const mediaUrl = safeMediaUrl(src);
  const safeEmbedId = escapeHtml(embedId);

  const bodyContent = mediaUrl
    ? `<video id="inclusyVideo" src="${escapeHtml(mediaUrl)}" controls playsinline></video>
    <script src="/embed.js"
            data-inclusy="${safeEmbedId}"
            data-target="#inclusyVideo"
            data-lang="${escapeHtml(lang)}"
            data-sign="${escapeHtml(sign)}"
            data-ad="${escapeHtml(ad)}"></script>`
    : `<p class="error">Add a <code>src</code> parameter pointing at your video, for example
       <code>?src=https://yoursite.com/video.mp4</code>. Only http and https URLs are accepted.</p>`;

  return page({
    title: 'Accessible player',
    path: `/embed/${embedId}`,
    compact: true,
    styles: `
    body { background: #000; }
    .container { padding: 0; max-width: none; }
    .frame-wrap { position: relative; width: 100%; }
    video { border-radius: 0; display: block; }
    .error { color: #FF9B9B; padding: var(--s5); font-size: var(--text-sm); }
    .credit {
      position: absolute; right: 8px; top: 8px; z-index: 2147483001;
      font-size: 11px; color: #A7B0BD; text-decoration: none;
      background: rgba(14,17,22,0.75); padding: 3px 8px; border-radius: 999px;
    }`,
    body: `
    <div class="frame-wrap">
      ${bodyContent}
      <a class="credit" href="${SITE_URL}/embed" target="_blank" rel="noopener">Inclusy</a>
    </div>`
  });
}
