import { escapeHtml } from '../escape.js';
import { page } from '../layout.js';
import {
  SUPPORTED_OUTPUT_LANGUAGES,
  SUPPORTED_SIGN_LANGUAGES,
  SUPPORTED_CAPTION_STYLES,
  SUPPORTED_AUDIO_DESCRIPTION_STYLES,
  SUPPORTED_SIGN_PRESENTATION_MODES,
  SUPPORTED_UI_MODES,
  SIGN_OVERLAY_THEMES
} from '../../config/accessibilityCatalog.js';

const LANGUAGE_NAMES = {
  'en-US': 'English', 'es-ES': 'Spanish', 'fr-FR': 'French', 'de-DE': 'German',
  'pt-BR': 'Portuguese', 'hi-IN': 'Hindi', 'ja-JP': 'Japanese', 'ar-SA': 'Arabic',
  'zh-CN': 'Chinese (Simplified)', 'zh-TW': 'Chinese (Traditional)', 'ko-KR': 'Korean',
  'it-IT': 'Italian', 'nl-NL': 'Dutch', 'sv-SE': 'Swedish', 'pl-PL': 'Polish',
  'tr-TR': 'Turkish', 'he-IL': 'Hebrew', 'th-TH': 'Thai', 'vi-VN': 'Vietnamese',
  'id-ID': 'Indonesian', 'ru-RU': 'Russian'
};

export function langName(code) {
  return LANGUAGE_NAMES[code] || code;
}

function radioGroup(name, options, selected) {
  return options.map((opt) =>
    `<label><input type="radio" name="${name}" value="${opt}"${opt === selected ? ' checked' : ''} /> ${escapeHtml(opt.replace(/_/g, ' '))}</label>`
  ).join('');
}

export function buildOptionsPage(job) {
  const prefs = job.preferences;

  const langOptions = SUPPORTED_OUTPUT_LANGUAGES
    .map((code) => `<option value="${code}"${prefs.output_languages.includes(code) ? ' selected' : ''}>${escapeHtml(langName(code))} (${code})</option>`)
    .join('');

  const signLangOptions = SUPPORTED_SIGN_LANGUAGES
    .map((code) => `<option value="${code}"${code === prefs.sign_language ? ' selected' : ''}>${code}</option>`)
    .join('');

  const themeCards = SIGN_OVERLAY_THEMES.map((t) => `
        <label class="theme-card">
          <span class="theme-card-head">
            <input type="radio" name="sign_overlay_theme" value="${t.id}"${t.id === prefs.sign_overlay_theme ? ' checked' : ''} />
            <strong>${escapeHtml(t.name)}</strong>
          </span>
          <span class="theme-card-desc">${escapeHtml(t.description)}</span>
          <span class="swatches" aria-hidden="true">
            <span style="background:${t.palette.primary}"></span>
            <span style="background:${t.palette.accent}"></span>
            <span style="background:${t.background.color}"></span>
          </span>
        </label>`).join('');

  const seconds = (job.duration_ms / 1000).toFixed(1);
  const estimate = Math.max(5, Math.round(job.duration_ms / 1000 * 0.6));

  return page({
    title: 'Options',
    path: '/jobs/options',
    narrow: true,
    styles: `
    .theme-card {
      display: flex; flex-direction: column; gap: var(--s2);
      align-items: flex-start; padding: var(--s3);
      border: 1px solid var(--border); border-radius: var(--radius);
      cursor: pointer; font-weight: 400; margin: 0;
    }
    .theme-card:has(input:checked) { border-color: var(--accent); box-shadow: inset 0 0 0 1px var(--accent); }
    .theme-card-head { display: flex; align-items: center; gap: var(--s2); }
    .theme-card-desc { font-size: var(--text-xs); color: var(--ink-muted); }
    .swatches { display: flex; gap: var(--s1); }
    .swatches span { width: 18px; height: 18px; border-radius: 50%; border: 1px solid var(--border); }
    .theme-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--s3); margin-top: var(--s2); }
    .panel > .pill { margin-bottom: var(--s2); }
    @media (max-width: 600px) { .theme-grid { grid-template-columns: 1fr; } }`,
    body: `
    <h1>Accessibility options</h1>
    <p class="subtitle">${escapeHtml(job.original_filename)} · ${seconds}s · ${job.has_video ? 'Video' : 'Audio'}</p>

    <form id="optionsForm">
      <div class="panel">
        <span class="pill">Captions</span>
        <label for="output_languages">Output languages</label>
        <select name="output_languages" id="output_languages" multiple aria-required="true" aria-describedby="lang-hint">${langOptions}</select>
        <p id="lang-hint" class="muted small">Hold Command or Control to select more than one.</p>

        <label id="caption-style-label">Caption style</label>
        <div class="radio-group" role="radiogroup" aria-labelledby="caption-style-label">${radioGroup('caption_style', SUPPORTED_CAPTION_STYLES, prefs.caption_style)}</div>
      </div>

      <div class="panel">
        <span class="pill">Audio description</span>
        <label id="audio-desc-style-label">Style</label>
        <div class="radio-group" role="radiogroup" aria-labelledby="audio-desc-style-label">${radioGroup('audio_description_style', SUPPORTED_AUDIO_DESCRIPTION_STYLES, prefs.audio_description_style)}</div>
      </div>

      <div class="panel">
        <span class="pill">Sign language</span>
        <label for="sign_language">Language</label>
        <select name="sign_language" id="sign_language">${signLangOptions}</select>

        <label id="sign-mode-label">Presentation mode</label>
        <div class="radio-group" role="radiogroup" aria-labelledby="sign-mode-label">${radioGroup('sign_presentation_mode', SUPPORTED_SIGN_PRESENTATION_MODES, prefs.sign_presentation_mode)}</div>

        <label id="sign-theme-label">Overlay theme</label>
        <div class="theme-grid" role="radiogroup" aria-labelledby="sign-theme-label">${themeCards}
        </div>
      </div>

      <div class="panel">
        <span class="pill">Display</span>
        <label id="ui-mode-label">UI mode</label>
        <div class="radio-group" role="radiogroup" aria-labelledby="ui-mode-label">${radioGroup('ui_mode', SUPPORTED_UI_MODES, prefs.ui_mode)}</div>
      </div>

      <button type="submit" class="btn" id="processBtn">Process Media</button>
      <p class="muted small">Estimated processing time: about ${estimate} seconds.</p>
      <p class="error" id="error" style="display:none" aria-live="polite" role="alert"></p>

      <div id="progressSection" style="display:none" aria-live="polite">
        <div class="progress-bar" aria-hidden="true"><div class="fill" id="progressFill"></div></div>
        <p class="muted" id="progressStep">Starting…</p>
      </div>
    </form>`,
    scripts: `
    var jobId = ${JSON.stringify(job.id)};

    document.getElementById('optionsForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      var btn = document.getElementById('processBtn');
      var errorEl = document.getElementById('error');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Processing\\u2026';
      errorEl.style.display = 'none';

      var form = e.target;
      var output_languages = Array.from(form.output_languages.selectedOptions).map(function (o) { return o.value; });

      var prefs = {
        output_languages: output_languages,
        caption_style: form.caption_style.value,
        audio_description_style: form.audio_description_style.value,
        sign_language: form.sign_language.value,
        sign_presentation_mode: form.sign_presentation_mode.value,
        sign_overlay_theme: form.sign_overlay_theme.value,
        ui_mode: form.ui_mode.value
      };

      try {
        var res = await fetch('/v1/jobs/' + jobId + '/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(prefs)
        });
        if (!res.ok) {
          var data = await res.json();
          throw new Error(data.error || 'Failed to start processing');
        }

        document.getElementById('progressSection').style.display = 'block';
        var sse = new EventSource('/v1/jobs/' + jobId + '/progress');
        sse.onmessage = function (ev) {
          try {
            var data = JSON.parse(ev.data);
            if (data.type === 'progress') {
              document.getElementById('progressFill').style.width = Math.max(0, data.percent) + '%';
              document.getElementById('progressStep').textContent = data.step || 'Processing…';
            }
            if (data.type === 'complete' || data.percent === 100) {
              sse.close();
              window.location.href = '/jobs/' + jobId + '/results';
            }
            if (data.type === 'error') {
              sse.close();
              errorEl.textContent = (data.message || 'Processing failed') + ' ';
              var retry = document.createElement('button');
              retry.type = 'button';
              retry.className = 'btn-outline';
              retry.textContent = 'Retry';
              retry.addEventListener('click', function () { window.location.reload(); });
              errorEl.appendChild(retry);
              errorEl.style.display = 'block';
              btn.disabled = false;
              btn.textContent = 'Process Media';
            }
          } catch (_) {}
        };
        sse.onerror = function () {
          sse.close();
          setTimeout(function () { window.location.href = '/jobs/' + jobId + '/results'; }, 2000);
        };
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Process Media';
      }
    });`
  });
}
