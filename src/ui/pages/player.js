import { escapeHtml } from '../escape.js';
import { page } from '../layout.js';
import { resolveSignTheme, signOverlayStyles, signOverlayHtml, signThemeScript, segmentMs } from '../signOverlay.js';

function cueData(segments) {
  return segments.map((s) => ({
    start: segmentMs(s, 'start'),
    end: segmentMs(s, 'end'),
    text: String(s.text || '')
  }));
}

function transcriptRows(segments) {
  if (!segments.length) return '<p class="muted">No captions</p>';
  return segments.map((s) => {
    const start = segmentMs(s, 'start');
    const mm = String(Math.floor(start / 60000)).padStart(2, '0');
    const ss = String(Math.floor((start % 60000) / 1000)).padStart(2, '0');
    return `<button type="button" class="transcript-row" data-seek="${start}">
          <span class="transcript-time">${mm}:${ss}</span>
          <span>${escapeHtml(s.text)}</span>
        </button>`;
  }).join('');
}

export function buildPlayerPage(job, outputs) {
  const safeId = escapeHtml(job.id);
  const prefs = job.preferences;
  const captions = outputs?.captions || [];
  const audioDesc = outputs?.audioDescription || [];
  const signScript = outputs?.signScript || [];
  const theme = resolveSignTheme(prefs.sign_overlay_theme);
  const languages = prefs.output_languages?.length ? prefs.output_languages : ['en-US'];

  const mediaTag = job.has_video
    ? `<video id="mediaPlayer" controls>
           <source src="/v1/jobs/${safeId}/media" type="${escapeHtml(job.mime_type)}" />
           <track kind="subtitles" src="/v1/jobs/${safeId}/captions.vtt?language=${encodeURIComponent(languages[0])}" default label="${escapeHtml(languages[0])}" srclang="${escapeHtml(languages[0].split('-')[0])}" />
         </video>`
    : `<audio id="mediaPlayer" controls>
           <source src="/v1/jobs/${safeId}/media" type="${escapeHtml(job.mime_type)}" />
         </audio>`;

  const downloads = languages.map((lang) => {
    const q = encodeURIComponent(lang);
    return `<a href="/v1/jobs/${safeId}/captions.vtt?language=${q}" class="btn-outline" download>VTT (${escapeHtml(lang)})</a>
        <a href="/v1/jobs/${safeId}/captions.ttml?language=${q}" class="btn-outline" download>TTML (${escapeHtml(lang)})</a>`;
  }).join('\n        ');

  return page({
    title: job.original_filename,
    description: `Accessible player for ${job.original_filename} — captions, audio description, and sign language.`,
    path: `/player/${job.id}`,
    narrow: true,
    styles: `
${signOverlayStyles(theme)}

    .cue-now {
      font-size: var(--text-lg); line-height: 1.5; min-height: 3em;
      margin: var(--s2) 0 0; max-width: none;
    }
    .cue-now.is-idle { color: var(--ink-muted); font-size: var(--text-sm); }
    details { margin-top: var(--s3); }
    summary { cursor: pointer; font-weight: 700; font-size: var(--text-sm); padding: var(--s2) 0; }
    .transcript { max-height: 320px; overflow-y: auto; margin-top: var(--s2); }
    .transcript-row {
      display: flex; gap: var(--s3); width: 100%; text-align: left;
      background: transparent; border: 0; border-top: 1px solid var(--rule);
      padding: var(--s2) var(--s1); font: inherit; font-size: var(--text-sm);
      color: var(--ink); cursor: pointer;
    }
    .transcript-row:hover { background: color-mix(in oklab, var(--accent) 8%, transparent); }
    .transcript-row.is-active { background: color-mix(in oklab, var(--accent) 14%, transparent); font-weight: 700; }
    .transcript-time { font-family: var(--font-mono); color: var(--ink-muted); flex: 0 0 3.5em; }
    .dl-grid { display: flex; gap: var(--s2); flex-wrap: wrap; margin-top: var(--s2); }
    .dl-grid .btn-outline { font-size: var(--text-xs); padding: var(--s2) var(--s3); }`,
    body: `
    <h1>${escapeHtml(job.original_filename)}</h1>
    <p class="subtitle">Accessible player · captions, audio description, and sign language</p>

    <div class="panel" role="region" aria-label="Media player">${mediaTag}</div>

    <div class="panel" role="region" aria-label="Captions">
      <span class="pill">Live captions</span>
      <p class="cue-now is-idle" id="captions" aria-live="polite">Captions appear here as the media plays.</p>
      <details>
        <summary>Full transcript (${captions.length} segments)</summary>
        <div class="transcript" id="transcript">${transcriptRows(captions)}</div>
      </details>
    </div>

    ${signOverlayHtml({
      theme,
      segments: signScript,
      signLanguage: prefs.sign_language,
      ariaLabel: 'Sign language overlay',
      themeSelect: true,
      segmentsId: 'signSegments'
    })}

    <div class="panel" role="region" aria-label="Audio description">
      <span class="pill">Audio description</span>
      <p class="cue-now is-idle" id="audio" aria-live="polite">Descriptions appear here during gaps in dialogue.</p>
    </div>

    <div class="panel" role="region" aria-label="Download links">
      <span class="pill">Downloads</span>
      <div class="dl-grid">
        ${downloads}
        <a href="/v1/jobs/${safeId}/audio-description.json" class="btn-outline" download>Audio description (JSON)</a>
        <a href="/v1/jobs/${safeId}/sign-data.json" class="btn-outline" download>Sign data (JSON)</a>
      </div>
    </div>`,
    scripts: `
${signThemeScript()}

    var overlay = document.getElementById('signOverlay');
    var segmentsEl = document.getElementById('signSegments');
    var themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
      themeSelect.addEventListener('change', function () {
        var selected = allThemes.filter(function (t) { return t.id === themeSelect.value; })[0];
        if (selected) applySignTheme(selected, overlay, segmentsEl);
      });
    }

    /* Captions are labelled "live", so they track playback rather than
       dumping the whole transcript at once. */
    var captionCues = ${JSON.stringify(cueData(captions))};
    var audioCues = ${JSON.stringify(cueData(audioDesc))};
    var media = document.getElementById('mediaPlayer');
    var captionEl = document.getElementById('captions');
    var audioEl = document.getElementById('audio');
    var transcriptRows = Array.prototype.slice.call(document.querySelectorAll('.transcript-row'));
    var signSegments = Array.prototype.slice.call(document.querySelectorAll('.sign-segment'));

    function cueAt(cues, ms) {
      for (var i = 0; i < cues.length; i++) {
        if (ms >= cues[i].start && ms < cues[i].end) return i;
      }
      return -1;
    }

    function setCue(el, cues, index, idleText) {
      var next = index >= 0 ? cues[index].text : idleText;
      if (el.textContent === next) return;
      el.textContent = next;
      el.classList.toggle('is-idle', index < 0);
    }

    function markActive(nodes, ms) {
      nodes.forEach(function (node) {
        var start = Number(node.getAttribute('data-start') || node.getAttribute('data-seek') || 0);
        var end = Number(node.getAttribute('data-end') || 0);
        var active = end > 0 ? (ms >= start && ms < end) : false;
        node.classList.toggle('is-active', active);
      });
    }

    if (media) {
      media.addEventListener('timeupdate', function () {
        var ms = media.currentTime * 1000;
        setCue(captionEl, captionCues, cueAt(captionCues, ms), 'Captions appear here as the media plays.');
        setCue(audioEl, audioCues, cueAt(audioCues, ms), 'Descriptions appear here during gaps in dialogue.');
        markActive(signSegments, ms);

        var activeIndex = cueAt(captionCues, ms);
        transcriptRows.forEach(function (row, i) { row.classList.toggle('is-active', i === activeIndex); });
      });

      transcriptRows.forEach(function (row) {
        row.addEventListener('click', function () {
          media.currentTime = Number(row.getAttribute('data-seek') || 0) / 1000;
          media.play().catch(function () {});
        });
      });
    }`
  });
}
