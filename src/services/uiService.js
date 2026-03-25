import {
  SUPPORTED_OUTPUT_LANGUAGES,
  SUPPORTED_SIGN_LANGUAGES,
  SUPPORTED_CAPTION_STYLES,
  SUPPORTED_AUDIO_DESCRIPTION_STYLES,
  SUPPORTED_SIGN_PRESENTATION_MODES,
  SUPPORTED_UI_MODES,
  SIGN_OVERLAY_THEMES
} from '../config/accessibilityCatalog.js';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function langName(code) {
  const map = {
    'en-US': 'English', 'es-ES': 'Spanish', 'fr-FR': 'French', 'de-DE': 'German',
    'pt-BR': 'Portuguese', 'hi-IN': 'Hindi', 'ja-JP': 'Japanese', 'ar-SA': 'Arabic',
    'zh-CN': 'Chinese (Simplified)', 'zh-TW': 'Chinese (Traditional)', 'ko-KR': 'Korean',
    'it-IT': 'Italian', 'nl-NL': 'Dutch', 'sv-SE': 'Swedish', 'pl-PL': 'Polish',
    'tr-TR': 'Turkish', 'he-IL': 'Hebrew', 'th-TH': 'Thai', 'vi-VN': 'Vietnamese',
    'id-ID': 'Indonesian', 'ru-RU': 'Russian'
  };
  return map[code] || code;
}

const SHARED_STYLES = `
  :root {
    --bg: #07111f;
    --card: #12243f;
    --accent: #5bd7ff;
    --accent-hover: #3bc4f0;
    --text: #f7fbff;
    --muted: #8ba4c4;
    --success: #74ffa8;
    --error: #ff9f9f;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: "IBM Plex Sans", "Avenir Next", system-ui, sans-serif;
    background: radial-gradient(circle at top, #16345c, var(--bg));
    color: var(--text);
    min-height: 100vh;
  }
  .container { max-width: 720px; margin: 0 auto; padding: 32px 24px; }
  h1 { margin: 0 0 8px; letter-spacing: 0.02em; }
  .subtitle { color: var(--muted); margin: 0 0 24px; }
  .panel {
    background: color-mix(in oklab, var(--card) 85%, black);
    border-radius: 14px;
    padding: 20px;
    margin-bottom: 16px;
  }
  label { display: block; margin: 14px 0 6px; color: var(--muted); font-size: 0.9rem; }
  select, input[type="file"] {
    width: 100%;
    border-radius: 8px;
    border: 1px solid #2f5379;
    background: #081628;
    color: var(--text);
    padding: 10px;
    font: inherit;
    font-size: 0.95rem;
  }
  select[multiple] { height: 120px; }
  .radio-group { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 4px; }
  .radio-group label {
    display: inline-flex; align-items: center; gap: 6px;
    margin: 0; color: var(--text); font-size: 0.95rem;
    cursor: pointer; padding: 6px 12px;
    border: 1px solid #2f5379; border-radius: 8px;
    transition: border-color 0.2s;
  }
  .radio-group label:has(input:checked) { border-color: var(--accent); }
  .radio-group input { accent-color: var(--accent); }
  .btn {
    display: inline-block;
    margin-top: 20px;
    padding: 12px 28px;
    background: var(--accent);
    color: #07111f;
    border: 0;
    border-radius: 10px;
    font: inherit;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: background 0.2s;
  }
  .btn:hover { background: var(--accent-hover); }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .muted { color: var(--muted); }
  .pill {
    display: inline-block;
    border: 1px solid #2f5379;
    border-radius: 999px;
    padding: 4px 10px;
    margin-right: 8px;
    font-size: 0.85rem;
  }
  a { color: var(--accent); }
  .progress-bar {
    width: 100%;
    height: 8px;
    background: #1a2d4a;
    border-radius: 4px;
    overflow: hidden;
    margin: 12px 0;
  }
  .progress-bar .fill {
    height: 100%;
    background: var(--accent);
    border-radius: 4px;
    transition: width 0.3s;
    width: 0%;
  }
`;

export const uiService = {
  buildUploadPage() {
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Accessibility Lite — Upload</title>
  <style>${SHARED_STYLES}
    .dropzone {
      border: 2px dashed #2f5379;
      border-radius: 14px;
      padding: 48px 24px;
      text-align: center;
      cursor: pointer;
      transition: border-color 0.2s, background 0.2s;
    }
    .dropzone:hover, .dropzone.dragover {
      border-color: var(--accent);
      background: rgba(91, 215, 255, 0.05);
    }
    .dropzone p { margin: 8px 0; }
    .dropzone .big { font-size: 1.2rem; font-weight: 600; }
    .file-info { margin-top: 12px; color: var(--success); }
    .error { color: var(--error); margin-top: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Accessibility Lite</h1>
    <p class="subtitle">Upload media. Get captions, sign language overlays, and audio descriptions.</p>

    <form id="uploadForm" enctype="multipart/form-data">
      <div class="panel">
        <div class="dropzone" id="dropzone">
          <p class="big">Drop your file here</p>
          <p class="muted">or click to browse</p>
          <p class="muted" style="font-size:0.8rem">Video: MP4, WebM, MOV &middot; Audio: MP3, WAV, OGG, M4A &middot; Max 500MB</p>
          <input type="file" name="file" id="fileInput" accept="video/mp4,video/webm,video/quicktime,audio/mpeg,audio/wav,audio/ogg,audio/mp4" style="display:none" required />
        </div>
        <div class="file-info" id="fileInfo" style="display:none"></div>
      </div>

      <button type="submit" class="btn" id="uploadBtn" disabled>Upload &amp; Continue</button>
      <p class="error" id="error" style="display:none"></p>

      <div class="progress-bar" id="uploadProgress" style="display:none">
        <div class="fill" id="uploadFill"></div>
      </div>
    </form>
  </div>

  <script>
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const fileInfo = document.getElementById('fileInfo');
    const uploadBtn = document.getElementById('uploadBtn');
    const errorEl = document.getElementById('error');

    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        fileInput.dispatchEvent(new Event('change'));
      }
    });

    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (!file) return;
      const sizeMb = (file.size / 1024 / 1024).toFixed(1);
      fileInfo.textContent = file.name + ' (' + sizeMb + ' MB)';
      fileInfo.style.display = 'block';
      uploadBtn.disabled = false;
      errorEl.style.display = 'none';
    });

    document.getElementById('uploadForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      uploadBtn.disabled = true;
      errorEl.style.display = 'none';
      const progress = document.getElementById('uploadProgress');
      const fill = document.getElementById('uploadFill');
      progress.style.display = 'block';

      const formData = new FormData();
      formData.append('file', fileInput.files[0]);

      try {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', (ev) => {
          if (ev.lengthComputable) fill.style.width = Math.round(ev.loaded / ev.total * 100) + '%';
        });
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const data = JSON.parse(xhr.responseText);
            window.location.href = '/jobs/' + data.id + '/options';
          } else {
            const data = JSON.parse(xhr.responseText);
            errorEl.textContent = data.error || 'Upload failed';
            errorEl.style.display = 'block';
            uploadBtn.disabled = false;
          }
        });
        xhr.addEventListener('error', () => {
          errorEl.textContent = 'Network error';
          errorEl.style.display = 'block';
          uploadBtn.disabled = false;
        });
        xhr.open('POST', '/v1/jobs');
        xhr.send(formData);
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.style.display = 'block';
        uploadBtn.disabled = false;
      }
    });
  </script>
</body>
</html>`;
  },

  buildOptionsPage(job) {
    const safeId = escapeHtml(job.id);
    const prefs = job.preferences;

    const langOptions = SUPPORTED_OUTPUT_LANGUAGES
      .map((code) => `<option value="${code}"${prefs.output_languages.includes(code) ? ' selected' : ''}>${langName(code)} (${code})</option>`)
      .join('');

    const signLangOptions = SUPPORTED_SIGN_LANGUAGES
      .map((code) => `<option value="${code}"${code === prefs.sign_language ? ' selected' : ''}>${code}</option>`)
      .join('');

    function radioGroup(name, options, selected) {
      return options.map((opt) =>
        `<label><input type="radio" name="${name}" value="${opt}"${opt === selected ? ' checked' : ''} /> ${opt.replace(/_/g, ' ')}</label>`
      ).join('');
    }

    const themeCards = SIGN_OVERLAY_THEMES.map((t) => {
      const checked = t.id === prefs.sign_overlay_theme ? ' checked' : '';
      return `<label style="flex-direction:column;align-items:flex-start;padding:12px;min-width:140px">
        <div style="display:flex;align-items:center;gap:6px">
          <input type="radio" name="sign_overlay_theme" value="${t.id}"${checked} />
          <strong>${escapeHtml(t.name)}</strong>
        </div>
        <span style="font-size:0.8rem;color:var(--muted);margin-top:4px">${escapeHtml(t.description)}</span>
        <div style="display:flex;gap:4px;margin-top:6px">
          <span style="width:16px;height:16px;border-radius:50%;background:${t.palette.primary}"></span>
          <span style="width:16px;height:16px;border-radius:50%;background:${t.palette.accent}"></span>
          <span style="width:16px;height:16px;border-radius:50%;background:${t.background.color};border:1px solid #555"></span>
        </div>
      </label>`;
    }).join('');

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Options — Accessibility Lite</title>
  <style>${SHARED_STYLES}</style>
</head>
<body>
  <div class="container">
    <h1>Accessibility Options</h1>
    <p class="subtitle">${escapeHtml(job.original_filename)} &middot; ${(job.duration_ms / 1000).toFixed(1)}s &middot; ${job.has_video ? 'Video' : 'Audio'}</p>

    <form id="optionsForm">
      <div class="panel">
        <span class="pill">Captions</span>
        <label for="output_languages">Output Languages</label>
        <select name="output_languages" id="output_languages" multiple>${langOptions}</select>

        <label>Caption Style</label>
        <div class="radio-group">${radioGroup('caption_style', SUPPORTED_CAPTION_STYLES, prefs.caption_style)}</div>
      </div>

      <div class="panel">
        <span class="pill">Audio Description</span>
        <label>Style</label>
        <div class="radio-group">${radioGroup('audio_description_style', SUPPORTED_AUDIO_DESCRIPTION_STYLES, prefs.audio_description_style)}</div>
      </div>

      <div class="panel">
        <span class="pill">Sign Language</span>
        <label for="sign_language">Language</label>
        <select name="sign_language" id="sign_language">${signLangOptions}</select>

        <label>Presentation Mode</label>
        <div class="radio-group">${radioGroup('sign_presentation_mode', SUPPORTED_SIGN_PRESENTATION_MODES, prefs.sign_presentation_mode)}</div>

        <label>Overlay Theme</label>
        <div class="radio-group" style="flex-direction:column">${themeCards}</div>
      </div>

      <div class="panel">
        <span class="pill">Display</span>
        <label>UI Mode</label>
        <div class="radio-group">${radioGroup('ui_mode', SUPPORTED_UI_MODES, prefs.ui_mode)}</div>
      </div>

      <button type="submit" class="btn" id="processBtn">Process Media</button>
      <p class="error" id="error" style="display:none"></p>

      <div id="progressSection" style="display:none">
        <div class="progress-bar"><div class="fill" id="progressFill"></div></div>
        <p class="muted" id="progressStep">Starting...</p>
      </div>
    </form>
  </div>

  <script>
    const jobId = ${JSON.stringify(job.id)};

    document.getElementById('optionsForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('processBtn');
      const errorEl = document.getElementById('error');
      btn.disabled = true;
      errorEl.style.display = 'none';

      const form = e.target;
      const langSelect = form.output_languages;
      const output_languages = Array.from(langSelect.selectedOptions).map(o => o.value);

      const prefs = {
        output_languages,
        caption_style: form.caption_style.value,
        audio_description_style: form.audio_description_style.value,
        sign_language: form.sign_language.value,
        sign_presentation_mode: form.sign_presentation_mode.value,
        sign_overlay_theme: form.sign_overlay_theme.value,
        ui_mode: form.ui_mode.value
      };

      try {
        const res = await fetch('/v1/jobs/' + jobId + '/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(prefs)
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to start processing');
        }

        document.getElementById('progressSection').style.display = 'block';
        const sse = new EventSource('/v1/jobs/' + jobId + '/progress');
        sse.onmessage = function (ev) {
          try {
            const data = JSON.parse(ev.data);
            if (data.type === 'progress') {
              document.getElementById('progressFill').style.width = Math.max(0, data.percent) + '%';
              document.getElementById('progressStep').textContent = data.step || 'Processing...';
            }
            if (data.type === 'complete' || data.percent === 100) {
              sse.close();
              window.location.href = '/jobs/' + jobId + '/results';
            }
            if (data.type === 'error') {
              sse.close();
              errorEl.textContent = data.message || 'Processing failed';
              errorEl.style.display = 'block';
              btn.disabled = false;
            }
          } catch (_) {}
        };
        sse.onerror = function () {
          sse.close();
          setTimeout(() => { window.location.href = '/jobs/' + jobId + '/results'; }, 2000);
        };
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.style.display = 'block';
        btn.disabled = false;
      }
    });
  </script>
</body>
</html>`;
  },

  buildResultsPage(job, outputs) {
    const safeId = escapeHtml(job.id);
    const prefs = job.preferences;
    const captions = outputs?.captions || [];
    const audioDesc = outputs?.audioDescription || [];
    const signScript = outputs?.signScript || [];
    const signCards = outputs?.signCards || [];
    const theme = SIGN_OVERLAY_THEMES.find((t) => t.id === prefs.sign_overlay_theme) || SIGN_OVERLAY_THEMES[0];

    const captionPreview = captions.slice(0, 10).map((c) => escapeHtml(c.text)).join('<br>');
    const audioPreview = audioDesc.slice(0, 5).map((a) => escapeHtml(a.text)).join('<br>');

    const langDownloads = (prefs.output_languages || ['en-US']).map((lang) =>
      `<a href="/v1/jobs/${safeId}/captions.vtt?language=${lang}" class="dl-link">WebVTT (${lang})</a>
       <a href="/v1/jobs/${safeId}/captions.ttml?language=${lang}" class="dl-link">TTML (${lang})</a>`
    ).join(' ');

    const mediaTag = job.has_video
      ? `<video controls style="width:100%;border-radius:8px;margin-bottom:12px">
           <source src="/v1/jobs/${safeId}/media" type="${escapeHtml(job.mime_type)}" />
           <track kind="subtitles" src="/v1/jobs/${safeId}/captions.vtt?language=${prefs.output_languages[0] || 'en-US'}" default label="${prefs.output_languages[0] || 'en-US'}" />
         </video>`
      : `<audio controls style="width:100%;margin-bottom:12px">
           <source src="/v1/jobs/${safeId}/media" type="${escapeHtml(job.mime_type)}" />
         </audio>`;

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Results — Accessibility Lite</title>
  <style>${SHARED_STYLES}
    .dl-link {
      display: inline-block;
      margin: 4px 8px 4px 0;
      padding: 6px 14px;
      background: #1a2d4a;
      border-radius: 8px;
      color: var(--accent);
      text-decoration: none;
      font-size: 0.9rem;
    }
    .dl-link:hover { background: #243a5a; }
    .stat { display: inline-block; margin-right: 16px; }
    .stat strong { color: var(--accent); }
    .sign-overlay {
      --sign-bg: ${theme.background.color};
      --sign-bg-opacity: ${theme.background.opacity};
      --sign-primary: ${theme.palette.primary};
      --sign-secondary: ${theme.palette.secondary};
      --sign-accent: ${theme.palette.accent};
      --sign-text: ${theme.palette.text};
      --sign-token-bg: ${theme.palette.token_bg};
      --sign-font: ${theme.font.family};
      --sign-font-weight: ${theme.font.weight};
      --sign-font-size: ${theme.font.size_scale}rem;
      background: var(--sign-bg);
      border-radius: 14px;
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
    .sign-segment { display: flex; flex-wrap: wrap; gap: 6px; align-items: baseline; margin-bottom: 8px; }
    .sign-token {
      display: inline-block; background: var(--sign-token-bg); color: var(--sign-primary);
      padding: 3px 8px; border-radius: 6px; font-weight: var(--sign-font-weight); letter-spacing: 0.04em;
    }
    .sign-facial-cue { font-size: 0.7em; color: var(--sign-accent); opacity: 0.8; margin-left: 4px; }
    .share-box {
      display: flex; align-items: center; gap: 8px; margin-top: 12px;
    }
    .share-box input {
      flex: 1; background: #081628; border: 1px solid #2f5379;
      border-radius: 8px; padding: 8px 12px; color: var(--text); font: inherit;
    }
    .copy-btn {
      padding: 8px 16px; background: var(--accent); color: #07111f;
      border: 0; border-radius: 8px; font-weight: 600; cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Results</h1>
    <p class="subtitle">${escapeHtml(job.original_filename)}</p>

    <div class="panel">
      <span class="stat"><strong>${captions.length}</strong> caption segments</span>
      <span class="stat"><strong>${audioDesc.length}</strong> audio descriptions</span>
      <span class="stat"><strong>${signScript.length}</strong> sign segments</span>
      <span class="stat"><strong>${(job.duration_ms / 1000).toFixed(1)}s</strong> duration</span>
    </div>

    <div class="panel">
      <span class="pill">Player</span>
      ${mediaTag}
    </div>

    <div class="panel">
      <span class="pill">Captions</span>
      <p style="margin:8px 0;font-size:0.9rem;line-height:1.6">${captionPreview || '<em class="muted">No captions generated</em>'}</p>
      ${captions.length > 10 ? '<p class="muted">...and ' + (captions.length - 10) + ' more</p>' : ''}
    </div>

    <div class="sign-overlay${theme.background.style === 'gradient' ? ' bg-gradient' : theme.background.style === 'textured' ? ' bg-textured' : ''}">
      <span class="pill" style="border-color:var(--sign-accent);margin-bottom:12px">Sign Language — ${escapeHtml(prefs.sign_language)} — ${escapeHtml(theme.name)}</span>
      ${signScript.slice(0, 8).map((s) => `
        <div class="sign-segment">
          ${s.gloss_tokens.map((t) => `<span class="sign-token">${escapeHtml(t)}</span>`).join('')}
          ${s.facial_cues?.length ? `<span class="sign-facial-cue">${escapeHtml(s.facial_cues.join(' '))}</span>` : ''}
        </div>
      `).join('') || '<em class="muted">No sign data</em>'}
    </div>

    <div class="panel">
      <span class="pill">Audio Description</span>
      <p style="margin:8px 0;font-size:0.9rem;line-height:1.6">${audioPreview || '<em class="muted">No audio descriptions</em>'}</p>
    </div>

    <div class="panel">
      <span class="pill">Downloads</span>
      <div style="margin-top:8px">
        ${langDownloads}
        <a href="/v1/jobs/${safeId}/audio-description.json" class="dl-link">Audio Description (JSON)</a>
        <a href="/v1/jobs/${safeId}/sign-data.json" class="dl-link">Sign Data (JSON)</a>
      </div>
    </div>

    <div class="panel">
      <span class="pill">Share</span>
      <p class="muted" style="margin:6px 0">Shareable player link:</p>
      <div class="share-box">
        <input type="text" id="shareUrl" readonly />
        <button class="copy-btn" onclick="navigator.clipboard.writeText(document.getElementById('shareUrl').value)">Copy</button>
      </div>
    </div>

    <p><a href="/">&larr; Process another file</a></p>
  </div>

  <script>
    document.getElementById('shareUrl').value = window.location.origin + '/player/${safeId}';
  </script>
</body>
</html>`;
  },

  buildPlayerPage(job, outputs) {
    const safeId = escapeHtml(job.id);
    const prefs = job.preferences;
    const captions = outputs?.captions || [];
    const audioDesc = outputs?.audioDescription || [];
    const signScript = outputs?.signScript || [];
    const theme = SIGN_OVERLAY_THEMES.find((t) => t.id === prefs.sign_overlay_theme) || SIGN_OVERLAY_THEMES[0];
    const allThemes = JSON.stringify(SIGN_OVERLAY_THEMES);

    const mediaTag = job.has_video
      ? `<video id="mediaPlayer" controls style="width:100%;border-radius:8px">
           <source src="/v1/jobs/${safeId}/media" type="${escapeHtml(job.mime_type)}" />
           <track kind="subtitles" src="/v1/jobs/${safeId}/captions.vtt?language=${prefs.output_languages[0] || 'en-US'}" default label="${prefs.output_languages[0] || 'en-US'}" />
         </video>`
      : `<audio id="mediaPlayer" controls style="width:100%">
           <source src="/v1/jobs/${safeId}/media" type="${escapeHtml(job.mime_type)}" />
         </audio>`;

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(job.original_filename)} — Accessibility Lite Player</title>
  <style>${SHARED_STYLES}
    .sign-overlay {
      --sign-bg: ${theme.background.color};
      --sign-primary: ${theme.palette.primary};
      --sign-accent: ${theme.palette.accent};
      --sign-text: ${theme.palette.text};
      --sign-token-bg: ${theme.palette.token_bg};
      --sign-font: ${theme.font.family};
      --sign-font-weight: ${theme.font.weight};
      --sign-font-size: ${theme.font.size_scale}rem;
      background: var(--sign-bg);
      border-radius: 14px;
      padding: 16px;
      margin-bottom: 16px;
      color: var(--sign-text);
      font-family: var(--sign-font);
      font-weight: var(--sign-font-weight);
      font-size: var(--sign-font-size);
    }
    .sign-overlay.bg-gradient { background: linear-gradient(135deg, var(--sign-bg), color-mix(in oklab, var(--sign-bg) 60%, black)); }
    .sign-overlay.bg-textured { background: var(--sign-bg); background-image: repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(0,0,0,0.03) 8px, rgba(0,0,0,0.03) 16px); }
    .sign-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; flex-wrap: wrap; gap: 8px; }
    .theme-select { background: rgba(0,0,0,0.3); color: inherit; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; padding: 4px 8px; font: inherit; font-size: 0.85rem; cursor: pointer; }
    .sign-segments { display: flex; flex-direction: column; gap: 8px; }
    .sign-segments.layout-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; }
    .sign-segments.layout-inline { flex-direction: row; flex-wrap: wrap; gap: 6px; }
    .sign-segment { display: flex; flex-wrap: wrap; gap: 6px; align-items: baseline; }
    .sign-token { display: inline-block; background: var(--sign-token-bg); color: var(--sign-primary); padding: 3px 8px; border-radius: 6px; letter-spacing: 0.04em; }
    .sign-facial-cue { font-size: 0.7em; color: var(--sign-accent); opacity: 0.8; margin-left: 4px; }
    pre { white-space: pre-wrap; margin: 0; color: #d7f4ff; }
    .dl-link { display: inline-block; margin: 4px 8px 4px 0; padding: 6px 14px; background: #1a2d4a; border-radius: 8px; color: var(--accent); text-decoration: none; font-size: 0.9rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${escapeHtml(job.original_filename)}</h1>
    <p class="subtitle">Accessibility Lite Player</p>

    <div class="panel">${mediaTag}</div>

    <div class="panel">
      <span class="pill">Live Captions</span>
      <pre id="captions">${captions.map((c) => escapeHtml(c.text)).join('\n') || 'No captions'}</pre>
    </div>

    <div class="sign-overlay${theme.background.style === 'gradient' ? ' bg-gradient' : theme.background.style === 'textured' ? ' bg-textured' : ''}" id="signOverlay">
      <div class="sign-header">
        <span class="pill" style="border-color:var(--sign-accent)">Sign Language — ${escapeHtml(prefs.sign_language)}</span>
        <select class="theme-select" id="themeSelect" aria-label="Sign overlay theme">
          ${SIGN_OVERLAY_THEMES.map((t) => `<option value="${t.id}"${t.id === theme.id ? ' selected' : ''}>${escapeHtml(t.name)}</option>`).join('')}
        </select>
      </div>
      <div class="sign-segments" id="signSegments">
        ${signScript.map((s) => `
          <div class="sign-segment">
            ${s.gloss_tokens.map((t) => `<span class="sign-token">${escapeHtml(t)}</span>`).join('')}
            ${s.facial_cues?.length ? `<span class="sign-facial-cue">${escapeHtml(s.facial_cues.join(' '))}</span>` : ''}
          </div>
        `).join('') || '<span class="muted">No sign data</span>'}
      </div>
    </div>

    <div class="panel">
      <span class="pill">Audio Description</span>
      <pre id="audio">${audioDesc.map((a) => escapeHtml(a.text)).join('\n') || 'No audio descriptions'}</pre>
    </div>

    <div class="panel">
      <span class="pill">Downloads</span>
      <div style="margin-top:8px">
        ${(prefs.output_languages || ['en-US']).map((lang) =>
          `<a href="/v1/jobs/${safeId}/captions.vtt?language=${lang}" class="dl-link">VTT (${lang})</a>
           <a href="/v1/jobs/${safeId}/captions.ttml?language=${lang}" class="dl-link">TTML (${lang})</a>`
        ).join('')}
        <a href="/v1/jobs/${safeId}/audio-description.json" class="dl-link">Audio Desc (JSON)</a>
        <a href="/v1/jobs/${safeId}/sign-data.json" class="dl-link">Sign Data (JSON)</a>
      </div>
    </div>
  </div>

  <script>
    const allThemes = ${allThemes};
    const sizeMap = { small: '280px', medium: '360px', large: '480px' };

    function applyTheme(theme) {
      const overlay = document.getElementById('signOverlay');
      const segments = document.getElementById('signSegments');
      overlay.style.setProperty('--sign-bg', theme.background.color);
      overlay.style.setProperty('--sign-primary', theme.palette.primary);
      overlay.style.setProperty('--sign-accent', theme.palette.accent);
      overlay.style.setProperty('--sign-text', theme.palette.text);
      overlay.style.setProperty('--sign-token-bg', theme.palette.token_bg);
      overlay.style.setProperty('--sign-font', theme.font.family);
      overlay.style.setProperty('--sign-font-weight', theme.font.weight);
      overlay.style.setProperty('--sign-font-size', theme.font.size_scale + 'rem');
      overlay.className = 'sign-overlay' + (theme.background.style === 'gradient' ? ' bg-gradient' : theme.background.style === 'textured' ? ' bg-textured' : '');
      segments.className = 'sign-segments' + (theme.layout === 'grid' ? ' layout-grid' : theme.layout === 'inline' ? ' layout-inline' : '');
    }

    document.getElementById('themeSelect').addEventListener('change', function () {
      const selected = allThemes.find(t => t.id === this.value);
      if (selected) applyTheme(selected);
    });
  </script>
</body>
</html>`;
  }
};
