import { escapeHtml } from '../escape.js';
import { page } from '../layout.js';
import { langName } from './options.js';
import { resolveSignTheme, signOverlayStyles, signOverlayHtml } from '../signOverlay.js';

export function buildResultsPage(job, outputs) {
  const safeId = escapeHtml(job.id);
  const prefs = job.preferences;
  const captions = outputs?.captions || [];
  const audioDesc = outputs?.audioDescription || [];
  const signScript = outputs?.signScript || [];
  const theme = resolveSignTheme(prefs.sign_overlay_theme);
  const languages = prefs.output_languages?.length ? prefs.output_languages : ['en-US'];

  const captionPreview = captions.slice(0, 10).map((c) => escapeHtml(c.text)).join('<br>');
  const audioPreview = audioDesc.slice(0, 5).map((a) => escapeHtml(a.text)).join('<br>');

  const mediaTag = job.has_video
    ? `<video controls>
           <source src="/v1/jobs/${safeId}/media" type="${escapeHtml(job.mime_type)}" />
           <track kind="subtitles" src="/v1/jobs/${safeId}/captions.vtt?language=${encodeURIComponent(languages[0])}" default label="${escapeHtml(languages[0])}" srclang="${escapeHtml(languages[0].split('-')[0])}" />
         </video>`
    : `<audio controls>
           <source src="/v1/jobs/${safeId}/media" type="${escapeHtml(job.mime_type)}" />
         </audio>`;

  return page({
    title: 'Results',
    path: '/jobs/results',
    narrow: true,
    styles: `
${signOverlayStyles(theme)}

    .stats { display: flex; gap: var(--s6); flex-wrap: wrap; }
    .stat strong { display: block; font-size: var(--text-xl); color: var(--ink); }
    .stat { font-size: var(--text-xs); color: var(--ink-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .dl-row { display: flex; gap: var(--s3); flex-wrap: wrap; align-items: flex-end; }
    .dl-row .field { flex: 1 1 220px; }
    .dl-row .field label { margin-top: 0; }
    .dl-extra { margin-top: var(--s4); padding-top: var(--s4); border-top: 1px solid var(--rule); display: flex; gap: var(--s3); flex-wrap: wrap; }
    .preview-text { font-size: var(--text-sm); line-height: 1.7; margin: var(--s2) 0 0; max-width: none; }
    .share-box { display: flex; gap: var(--s2); margin-top: var(--s2); flex-wrap: wrap; }
    .share-box input { flex: 1 1 260px; font-family: var(--font-mono); font-size: var(--text-xs); }
    .snippet {
      font-family: var(--font-mono); font-size: var(--text-xs);
      background: var(--bg); border: 1px solid var(--rule); border-radius: var(--radius);
      padding: var(--s3); overflow-x: auto; white-space: pre; margin: var(--s3) 0;
    }`,
    body: `
    <h1>Results</h1>
    <p class="subtitle">${escapeHtml(job.original_filename)}</p>

    <div class="panel stats" role="region" aria-label="Summary statistics">
      <span class="stat"><strong>${captions.length}</strong> caption segments</span>
      <span class="stat"><strong>${audioDesc.length}</strong> audio descriptions</span>
      <span class="stat"><strong>${signScript.length}</strong> sign segments</span>
      <span class="stat"><strong>${(job.duration_ms / 1000).toFixed(1)}s</strong> duration</span>
    </div>

    <div class="panel" role="region" aria-label="Media player">
      ${mediaTag}
    </div>

    <div class="panel" role="region" aria-label="Caption preview">
      <span class="pill">Captions</span>
      <p class="preview-text">${captionPreview || '<em class="muted">No captions generated</em>'}</p>
      ${captions.length > 10 ? `<p class="muted small">…and ${captions.length - 10} more</p>` : ''}
    </div>

    ${signOverlayHtml({
      theme,
      segments: signScript,
      signLanguage: prefs.sign_language,
      ariaLabel: 'Sign language preview',
      limit: 8
    })}

    <div class="panel" role="region" aria-label="Audio description preview">
      <span class="pill">Audio description</span>
      <p class="preview-text">${audioPreview || '<em class="muted">No audio descriptions</em>'}</p>
    </div>

    <div class="panel" role="region" aria-label="Download links">
      <span class="pill">Downloads</span>
      <div class="dl-row">
        <div class="field">
          <label for="dlLanguage">Language</label>
          <select id="dlLanguage">${languages.map((l) => `<option value="${escapeHtml(l)}">${escapeHtml(langName(l))} (${escapeHtml(l)})</option>`).join('')}</select>
        </div>
        <a class="btn-outline" id="dlVtt" href="/v1/jobs/${safeId}/captions.vtt?language=${encodeURIComponent(languages[0])}" download>WebVTT</a>
        <a class="btn-outline" id="dlTtml" href="/v1/jobs/${safeId}/captions.ttml?language=${encodeURIComponent(languages[0])}" download>TTML</a>
      </div>
      <div class="dl-extra">
        <a class="btn-outline" href="/v1/jobs/${safeId}/audio-description.json" download>Audio description (JSON)</a>
        <a class="btn-outline" href="/v1/jobs/${safeId}/sign-data.json" download>Sign data (JSON)</a>
      </div>
    </div>

    <div class="panel" role="region" aria-label="Share link">
      <span class="pill">Share</span>
      <p class="muted small">A player page anyone can open — no account needed.</p>
      <div class="share-box">
        <input type="text" id="shareUrl" readonly aria-label="Shareable player URL" />
        <button type="button" class="btn" id="copyShare">Copy</button>
      </div>
    </div>

    <div class="panel" role="region" aria-label="Embed on your site">
      <span class="pill">Embed</span>
      <p class="muted small">Publish this result to get a permanent embed ID. Captions, audio description, and the sign overlay attach to a video you host yourself — we never serve your media, and published results are not deleted after 24 hours.</p>
      <button type="button" class="btn" id="publishBtn">Publish and get embed code</button>
      <p class="error" id="publishError" style="display:none" aria-live="polite" role="alert"></p>
      <div id="embedResult" style="display:none" aria-live="polite">
        <pre class="snippet" id="embedSnippet"></pre>
        <div class="share-box">
          <button type="button" class="btn" id="copyEmbed">Copy snippet</button>
          <a class="btn-outline" href="/embed" id="embedDocs">Embed docs</a>
        </div>
      </div>
    </div>

    <p><a href="/">← Process another file</a></p>`,
    scripts: `
    var jobId = ${JSON.stringify(job.id)};
    var shareInput = document.getElementById('shareUrl');
    shareInput.value = window.location.origin + '/player/' + jobId;

    function copyFrom(button, getText, label) {
      button.addEventListener('click', function () {
        var text = getText();
        var done = function () {
          button.textContent = 'Copied!';
          setTimeout(function () { button.textContent = label; }, 2000);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, function () { done(); });
        } else {
          shareInput.select();
          done();
        }
      });
    }

    copyFrom(document.getElementById('copyShare'), function () { return shareInput.value; }, 'Copy');

    var dlLanguage = document.getElementById('dlLanguage');
    dlLanguage.addEventListener('change', function () {
      var lang = encodeURIComponent(this.value);
      document.getElementById('dlVtt').href = '/v1/jobs/' + jobId + '/captions.vtt?language=' + lang;
      document.getElementById('dlTtml').href = '/v1/jobs/' + jobId + '/captions.ttml?language=' + lang;
    });

    var publishBtn = document.getElementById('publishBtn');
    var publishError = document.getElementById('publishError');
    publishBtn.addEventListener('click', async function () {
      publishBtn.disabled = true;
      publishBtn.innerHTML = '<span class="spinner"></span> Publishing\\u2026';
      publishError.style.display = 'none';
      try {
        var res = await fetch('/v1/jobs/' + jobId + '/publish', { method: 'POST' });
        var data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to publish');
        document.getElementById('embedSnippet').textContent = data.snippet;
        document.getElementById('embedResult').style.display = 'block';
        document.getElementById('embedDocs').href = '/embed?id=' + encodeURIComponent(data.embed_id);
        publishBtn.textContent = 'Published';
        copyFrom(document.getElementById('copyEmbed'), function () {
          return document.getElementById('embedSnippet').textContent;
        }, 'Copy snippet');
      } catch (err) {
        publishError.textContent = err.message;
        publishError.style.display = 'block';
        publishBtn.disabled = false;
        publishBtn.textContent = 'Publish and get embed code';
      }
    });`
  });
}
