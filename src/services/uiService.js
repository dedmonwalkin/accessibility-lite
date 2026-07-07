import {
  SUPPORTED_OUTPUT_LANGUAGES,
  SUPPORTED_SIGN_LANGUAGES,
  SUPPORTED_CAPTION_STYLES,
  SUPPORTED_AUDIO_DESCRIPTION_STYLES,
  SUPPORTED_SIGN_PRESENTATION_MODES,
  SUPPORTED_UI_MODES,
  SIGN_OVERLAY_THEMES
} from '../config/accessibilityCatalog.js';

export function escapeHtml(value) {
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

const FAVICON_SVG = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#07111f"/><circle cx="16" cy="14" r="7" fill="none" stroke="#5bd7ff" stroke-width="2"/><path d="M10 22c0-3.3 2.7-6 6-6s6 2.7 6 6" fill="none" stroke="#74ffa8" stroke-width="2" stroke-linecap="round"/><rect x="6" y="26" width="20" height="2" rx="1" fill="#5bd7ff" opacity="0.5"/></svg>')}`;

const OG_META = `
    <meta property="og:title" content="Accessibility Lite — Captions, Audio Descriptions & Sign Language" />
    <meta property="og:description" content="Open source accessibility pipeline. Upload any video or audio and get captions, AI audio descriptions, and sign language overlays. Free, private, self-hostable." />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="Accessibility Lite" />
    <meta name="twitter:description" content="Open source pipeline for captions, audio descriptions, and sign language. Upload media, get accessibility." />
    <meta name="description" content="Open source accessibility pipeline. Upload any video or audio and get captions, AI audio descriptions, and sign language overlays." />
    <link rel="icon" type="image/svg+xml" href="${FAVICON_SVG}" />`;

const FOOTER_HTML = `
  <footer style="border-top:1px solid #1a2d4a;margin-top:48px;padding:24px;text-align:center;color:var(--muted);font-size:0.85rem">
    <p style="margin:0 0 8px">Built with purpose by <a href="https://github.com/dedmonwalkin" style="color:var(--accent);text-decoration:none">Isabella &amp; Tan</a></p>
    <p style="margin:0 0 8px">
      <a href="https://github.com/dedmonwalkin/accessibility-lite" style="color:var(--accent);text-decoration:none;margin-right:16px">GitHub</a>
      <span style="opacity:0.5">Open Source &middot; MIT License</span>
    </p>
    <p style="margin:0;font-size:0.8rem;opacity:0.6">Making media accessible for everyone.</p>
  </footer>`;

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
  .btn-outline {
    display: inline-block;
    margin-top: 20px;
    padding: 12px 28px;
    background: transparent;
    color: var(--accent);
    border: 2px solid var(--accent);
    border-radius: 10px;
    font: inherit;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: background 0.2s, color 0.2s;
  }
  .btn-outline:hover { background: rgba(91, 215, 255, 0.1); }
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
  :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  .spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.2);
    border-top-color: var(--accent); border-radius: 50%; animation: spin .6s linear infinite; vertical-align: middle; margin-right: 6px; }
  @keyframes spin { to { transform: rotate(360deg); } }
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

  @media (max-width: 768px) {
    .container { padding: 24px 16px; }
    .radio-group { flex-direction: column; }
    .panel { padding: 16px; }
  }
  @media (max-width: 480px) {
    .container { padding: 16px 12px; }
    h1 { font-size: 1.3rem; }
    .btn { width: 100%; text-align: center; }
    .btn-outline { width: 100%; text-align: center; }
    .dl-link { display: block; text-align: center; margin: 4px 0; }
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

// Minimal, dependency-free markdown subset: headings, paragraphs, code spans,
// and links. Anything a policy page needs. Everything is escaped first, so
// rendered output cannot introduce script vectors.
function renderMarkdownLite(raw) {
  const escaped = escapeHtml(raw);
  const lines = escaped.split(/\r?\n/);
  const out = [];
  let inPara = false;
  const close = () => { if (inPara) { out.push('</p>'); inPara = false; } };
  for (const line of lines) {
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      close();
      const lvl = h[1].length;
      out.push(`<h${lvl}>${h[2]}</h${lvl}>`);
      continue;
    }
    if (!line.trim()) { close(); continue; }
    if (!inPara) { out.push('<p>'); inPara = true; } else { out.push(' '); }
    const withInline = line
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\(([^\s)]+)\)/g, '<a href="$2" rel="noopener">$1</a>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    out.push(withInline);
  }
  close();
  return out.join('');
}

export const uiService = {
  escapeHtml,

  buildDocPage(title, markdown) {
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)} — Accessibility Lite</title>
  ${OG_META}
  <style>${SHARED_STYLES}
    article { max-width: 720px; }
    article h1, article h2, article h3 { margin-top: 24px; }
    article p { line-height: 1.6; color: var(--text); }
    article a { color: var(--accent); }
    article code { background: #0b1b30; padding: 1px 6px; border-radius: 4px; }
  </style>
</head>
<body>
  <main class="container">
    <p><a href="/" style="color:var(--accent);text-decoration:none">&larr; Home</a></p>
    <article>${renderMarkdownLite(markdown)}</article>
  </main>
  ${FOOTER_HTML}
</body>
</html>`;
  },

  buildErrorPage(statusCode, title, message, { autoRefresh = 0 } = {}) {
    const refreshTag = autoRefresh > 0 ? `<meta http-equiv="refresh" content="${autoRefresh}">` : '';
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  ${refreshTag}
  <title>${escapeHtml(title)} — Accessibility Lite</title>
  ${OG_META}
  <style>${SHARED_STYLES}</style>
</head>
<body>
  <main class="container" style="text-align:center;padding-top:80px">
    <p style="font-size:3rem;margin:0;opacity:0.3">${escapeHtml(String(statusCode))}</p>
    <h1>${escapeHtml(title)}</h1>
    <p class="muted" style="margin:12px 0 24px" aria-live="polite">${escapeHtml(message)}</p>
    <a href="/" class="btn" style="text-decoration:none">Back to home</a>
  </main>
  ${FOOTER_HTML}
</body>
</html>`;
  },

  buildUploadPage() {
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Accessibility Lite — Captions, Audio Descriptions &amp; Sign Language</title>
  ${OG_META}
  <style>${SHARED_STYLES}
    .hero { text-align: center; padding: 48px 0 32px; }
    .hero h1 { font-size: 2.2rem; margin: 0 0 12px; line-height: 1.2; }
    .hero .tagline { font-size: 1.15rem; color: var(--muted); margin: 0 0 32px; max-width: 520px; margin-left: auto; margin-right: auto; line-height: 1.5; }
    .hero-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
    .badges { display: flex; gap: 12px; justify-content: center; margin-top: 16px; flex-wrap: wrap; }
    .badge { display: inline-flex; align-items: center; gap: 6px; font-size: 0.8rem; color: var(--muted); border: 1px solid #1a2d4a; border-radius: 999px; padding: 4px 12px; }
    .badge svg { width: 14px; height: 14px; fill: currentColor; }

    .story-section { margin: 40px 0; }
    .story-section blockquote {
      border-left: 3px solid var(--accent);
      margin: 0; padding: 16px 20px;
      background: rgba(91, 215, 255, 0.04);
      border-radius: 0 12px 12px 0;
      font-style: italic; color: var(--muted); line-height: 1.6;
    }
    .story-section p { margin: 12px 0; line-height: 1.6; }

    .how-it-works { margin: 48px 0; }
    .how-it-works h2 { text-align: center; margin: 0 0 24px; font-size: 1.4rem; }
    .steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .step {
      background: color-mix(in oklab, var(--card) 85%, black);
      border-radius: 14px; padding: 24px 20px; text-align: center;
    }
    .step-number {
      display: inline-flex; align-items: center; justify-content: center;
      width: 36px; height: 36px; border-radius: 50%;
      background: var(--accent); color: #07111f; font-weight: 700; font-size: 1.1rem;
      margin-bottom: 12px;
    }
    .step h3 { margin: 0 0 8px; font-size: 1rem; }
    .step p { margin: 0; font-size: 0.9rem; color: var(--muted); line-height: 1.4; }

    .features { margin: 48px 0; }
    .features h2 { text-align: center; margin: 0 0 24px; font-size: 1.4rem; }
    .feature-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .feature {
      background: color-mix(in oklab, var(--card) 85%, black);
      border-radius: 14px; padding: 20px;
    }
    .feature h3 { margin: 0 0 6px; font-size: 0.95rem; color: var(--accent); }
    .feature p { margin: 0; font-size: 0.88rem; color: var(--muted); line-height: 1.4; }

    .upload-section { margin: 48px 0 0; }
    .upload-section h2 { text-align: center; margin: 0 0 24px; font-size: 1.4rem; }

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
    .upload-actions { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }

    @media (max-width: 768px) {
      .hero h1 { font-size: 1.7rem; }
      .steps { grid-template-columns: 1fr; }
      .feature-grid { grid-template-columns: 1fr; }
      .upload-actions { flex-direction: column; }
    }
  </style>
</head>
<body>
  <main class="container">
    <!-- Hero -->
    <section class="hero">
      <h1>Make any media accessible.</h1>
      <p class="tagline">Upload a video or audio file and get captions, AI-powered audio descriptions, and sign language overlays — all in one pipeline.</p>
      <div class="hero-actions">
        <a href="#upload" class="btn" style="text-decoration:none">Try it now</a>
        <a href="https://github.com/dedmonwalkin/accessibility-lite" class="btn-outline" style="text-decoration:none" target="_blank" rel="noopener">View on GitHub</a>
      </div>
      <div class="badges">
        <span class="badge"><svg viewBox="0 0 16 16"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg> Open Source</span>
        <span class="badge">21 Languages</span>
        <span class="badge">10 Sign Languages</span>
        <span class="badge">Self-Hostable</span>
      </div>
    </section>

    <!-- Why this exists -->
    <section class="story-section">
      <div class="panel">
        <blockquote>She had nothing she could do anymore. She couldn't drive, she couldn't read. But she would still try to watch as much TV as she could, because that was her habit.</blockquote>
        <p>This project was built because someone we loved was losing her connection to the world. Audio descriptions could have narrated what she couldn't see anymore. Captions exist in some tools, but nobody bundles all three accessibility modalities — captions, audio descriptions, and sign language — in a single open source pipeline.</p>
        <p><strong style="color:var(--accent)">Until now.</strong></p>
      </div>
    </section>

    <!-- How it works -->
    <section class="how-it-works">
      <h2>How it works</h2>
      <div class="steps">
        <div class="step">
          <div class="step-number">1</div>
          <h3>Upload</h3>
          <p>Drop any video or audio file. MP4, WebM, MOV, MP3, WAV — we handle it.</p>
        </div>
        <div class="step">
          <div class="step-number">2</div>
          <h3>Process</h3>
          <p>AI transcribes speech, generates scene descriptions, and creates sign language gloss tokens.</p>
        </div>
        <div class="step">
          <div class="step-number">3</div>
          <h3>Download</h3>
          <p>Get WebVTT/TTML captions, audio descriptions, and sign overlays. Share via a player link.</p>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="features">
      <h2>What you get</h2>
      <div class="feature-grid">
        <div class="feature">
          <h3>Captions</h3>
          <p>AI-powered transcription in WebVTT and TTML formats. Standard, simplified, or verbatim styles. Translatable to 21 languages.</p>
        </div>
        <div class="feature">
          <h3>Audio Descriptions</h3>
          <p>AI-generated narration of visual content during dialogue gaps — so people who can't see the screen still know what's happening.</p>
        </div>
        <div class="feature">
          <h3>Sign Language</h3>
          <p>Gloss tokens and sign cards for 10 sign languages. 6 overlay themes including high contrast and kid-friendly modes.</p>
        </div>
        <div class="feature">
          <h3>Self-Hostable</h3>
          <p>Run it on your own hardware with local models — whisper.cpp, Ollama, Piper TTS. Zero API costs. Full privacy. Docker ready.</p>
        </div>
      </div>
    </section>

    <!-- Upload form -->
    <section class="upload-section" id="upload">
      <h2>Try it</h2>
      <form id="uploadForm" enctype="multipart/form-data">
        <div class="panel">
          <div class="dropzone" id="dropzone" role="button" tabindex="0" aria-label="File upload area. Press Enter or Space to browse files.">
            <p class="big">Drop your file here</p>
            <p class="muted">or click to browse</p>
            <p class="muted" style="font-size:0.8rem">Video: MP4, WebM, MOV &middot; Audio: MP3, WAV, OGG, M4A &middot; Max 500MB</p>
            <input type="file" name="file" id="fileInput" accept="video/mp4,video/webm,video/quicktime,audio/mpeg,audio/wav,audio/ogg,audio/mp4" style="display:none" required aria-required="true" />
          </div>
          <div class="file-info" id="fileInfo" style="display:none" aria-live="polite"></div>
        </div>

        <div class="upload-actions">
          <button type="submit" class="btn" id="uploadBtn" disabled style="margin-top:0">Upload &amp; Continue</button>
          <button type="button" class="btn-outline" id="sampleBtn" style="margin-top:0">Try with a sample</button>
        </div>
        <p class="error" id="error" style="display:none" aria-live="polite" role="alert"></p>
        <span id="uploadStatus" aria-live="polite" style="position:absolute;left:-9999px"></span>

        <div class="progress-bar" id="uploadProgress" style="display:none" aria-hidden="true">
          <div class="fill" id="uploadFill"></div>
        </div>
        <p class="muted" style="font-size:0.8rem;margin-top:8px">Results are available for 24 hours, then automatically removed.</p>
      </form>

      <form id="urlForm" style="margin-top:24px" aria-label="Ingest from URL">
        <label for="urlInput" style="display:block;margin-bottom:8px;font-weight:600">Or paste a video URL</label>
        <p class="muted" style="font-size:0.85rem;margin-top:0">Direct media links (.mp4, .mp3, .wav, ...) or a public video page (YouTube and similar, when the server has yt-dlp installed).</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <input type="url" id="urlInput" name="url" placeholder="https://example.gov/meetings/2026-06-02.mp4"
                 style="flex:1;min-width:240px;padding:10px;border:1px solid var(--border, #ccc);border-radius:6px"
                 aria-describedby="urlStatus" />
          <button type="submit" class="btn" id="urlBtn" disabled>Fetch</button>
        </div>
        <span id="urlStatus" role="status" aria-live="polite" class="muted" style="display:block;margin-top:8px;font-size:0.85rem"></span>
      </form>
    </section>
  </main>

  ${FOOTER_HTML}

  <script>
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const fileInfo = document.getElementById('fileInfo');
    const uploadBtn = document.getElementById('uploadBtn');
    const errorEl = document.getElementById('error');

    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } });
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

    document.getElementById('sampleBtn').addEventListener('click', async () => {
      const btn = document.getElementById('sampleBtn');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Loading sample\u2026';
      errorEl.style.display = 'none';
      try {
        const res = await fetch('/v1/jobs/sample', { method: 'POST' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create sample job');
        window.location.href = '/jobs/' + data.id + '/options';
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Try with a sample';
      }
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
          if (ev.lengthComputable) {
            var pct = Math.round(ev.loaded / ev.total * 100);
            fill.style.width = pct + '%';
            document.getElementById('uploadStatus').textContent = 'Uploading: ' + pct + '%';
          }
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

    const urlForm = document.getElementById('urlForm');
    const urlInput = document.getElementById('urlInput');
    const urlBtn = document.getElementById('urlBtn');
    const urlStatus = document.getElementById('urlStatus');

    urlInput.addEventListener('input', () => { urlBtn.disabled = !urlInput.value.trim(); });

    async function pollUntilReady(jobId) {
      for (;;) {
        const res = await fetch('/v1/jobs/' + jobId);
        const job = await res.json();
        if (!res.ok) throw new Error(job.error || 'Job lookup failed');
        if (job.status === 'error') throw new Error(job.error || 'Download failed');
        if (job.status !== 'downloading') return job;
        urlStatus.textContent = 'Downloading…';
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    urlForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      urlBtn.disabled = true;
      urlBtn.innerHTML = '<span class="spinner"></span> Fetching…';
      errorEl.style.display = 'none';
      urlStatus.textContent = 'Requesting…';
      try {
        const res = await fetch('/v1/jobs/from-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: urlInput.value.trim() })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Ingest failed');
        const job = await pollUntilReady(data.id);
        window.location.href = '/jobs/' + job.id + '/options';
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.style.display = 'block';
        urlStatus.textContent = '';
        urlBtn.disabled = false;
        urlBtn.textContent = 'Fetch';
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
  ${OG_META}
  <style>${SHARED_STYLES}</style>
</head>
<body>
  <main class="container">
    <h1>Accessibility Options</h1>
    <p class="subtitle">${escapeHtml(job.original_filename)} &middot; ${(job.duration_ms / 1000).toFixed(1)}s &middot; ${job.has_video ? 'Video' : 'Audio'}</p>

    <form id="optionsForm">
      <div class="panel">
        <span class="pill">Captions</span>
        <label for="output_languages">Output Languages</label>
        <select name="output_languages" id="output_languages" multiple aria-required="true">${langOptions}</select>

        <label id="caption-style-label">Caption Style</label>
        <div class="radio-group" role="radiogroup" aria-labelledby="caption-style-label">${radioGroup('caption_style', SUPPORTED_CAPTION_STYLES, prefs.caption_style)}</div>
      </div>

      <div class="panel">
        <span class="pill">Audio Description</span>
        <label id="audio-desc-style-label">Style</label>
        <div class="radio-group" role="radiogroup" aria-labelledby="audio-desc-style-label">${radioGroup('audio_description_style', SUPPORTED_AUDIO_DESCRIPTION_STYLES, prefs.audio_description_style)}</div>
      </div>

      <div class="panel">
        <span class="pill">Sign Language</span>
        <label for="sign_language">Language</label>
        <select name="sign_language" id="sign_language">${signLangOptions}</select>

        <label id="sign-mode-label">Presentation Mode</label>
        <div class="radio-group" role="radiogroup" aria-labelledby="sign-mode-label">${radioGroup('sign_presentation_mode', SUPPORTED_SIGN_PRESENTATION_MODES, prefs.sign_presentation_mode)}</div>

        <label id="sign-theme-label">Overlay Theme</label>
        <div class="radio-group" role="radiogroup" aria-labelledby="sign-theme-label" style="flex-direction:column">${themeCards}</div>
      </div>

      <div class="panel">
        <span class="pill">Display</span>
        <label id="ui-mode-label">UI Mode</label>
        <div class="radio-group" role="radiogroup" aria-labelledby="ui-mode-label">${radioGroup('ui_mode', SUPPORTED_UI_MODES, prefs.ui_mode)}</div>
      </div>

      <button type="submit" class="btn" id="processBtn">Process Media</button>
      <p class="muted" style="font-size:0.85rem;margin-top:8px">Estimated processing time: ~${Math.max(5, Math.round(job.duration_ms / 1000 * 0.6))} seconds</p>
      <p class="error" id="error" style="display:none" aria-live="polite" role="alert"></p>

      <div id="progressSection" style="display:none" aria-live="polite">
        <div class="progress-bar" aria-hidden="true"><div class="fill" id="progressFill"></div></div>
        <p class="muted" id="progressStep">Starting...</p>
      </div>
    </form>
  </main>
  ${FOOTER_HTML}

  <script>
    const jobId = ${JSON.stringify(job.id)};

    document.getElementById('optionsForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      var btn = document.getElementById('processBtn');
      var errorEl = document.getElementById('error');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Processing\u2026';
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
              errorEl.innerHTML = (data.message || 'Processing failed') + ' <button onclick="window.location.reload()" style="margin-left:8px;padding:4px 12px;background:var(--accent);color:#07111f;border:0;border-radius:6px;cursor:pointer;font-weight:600">Retry</button>';
              errorEl.style.display = 'block';
              btn.disabled = false;
              btn.textContent = 'Process Media';
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
        btn.textContent = 'Process Media';
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
      `<a href="/v1/jobs/${safeId}/captions.vtt?language=${lang}" class="dl-link" download>WebVTT (${lang})</a>
       <a href="/v1/jobs/${safeId}/captions.ttml?language=${lang}" class="dl-link" download>TTML (${lang})</a>`
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
  ${OG_META}
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
  <main class="container">
    <h1>Results</h1>
    <p class="subtitle">${escapeHtml(job.original_filename)}</p>

    <div class="panel" role="region" aria-label="Summary statistics">
      <span class="stat"><strong>${captions.length}</strong> caption segments</span>
      <span class="stat"><strong>${audioDesc.length}</strong> audio descriptions</span>
      <span class="stat"><strong>${signScript.length}</strong> sign segments</span>
      <span class="stat"><strong>${(job.duration_ms / 1000).toFixed(1)}s</strong> duration</span>
    </div>

    <div class="panel" role="region" aria-label="Media player">
      <span class="pill">Player</span>
      ${mediaTag}
    </div>

    <div class="panel" role="region" aria-label="Caption preview">
      <span class="pill">Captions</span>
      <p style="margin:8px 0;font-size:0.9rem;line-height:1.6">${captionPreview || '<em class="muted">No captions generated</em>'}</p>
      ${captions.length > 10 ? '<p class="muted">...and ' + (captions.length - 10) + ' more</p>' : ''}
    </div>

    <div class="sign-overlay${theme.background.style === 'gradient' ? ' bg-gradient' : theme.background.style === 'textured' ? ' bg-textured' : ''}" role="region" aria-label="Sign language preview">
      <span class="pill" style="border-color:var(--sign-accent);margin-bottom:12px">Sign Language — ${escapeHtml(prefs.sign_language)} — ${escapeHtml(theme.name)}</span>
      ${signScript.slice(0, 8).map((s) => `
        <div class="sign-segment">
          ${s.gloss_tokens.map((t) => `<span class="sign-token">${escapeHtml(t)}</span>`).join('')}
          ${s.facial_cues?.length ? `<span class="sign-facial-cue">${escapeHtml(s.facial_cues.join(' '))}</span>` : ''}
        </div>
      `).join('') || '<em class="muted">No sign data</em>'}
    </div>

    <div class="panel" role="region" aria-label="Audio description preview">
      <span class="pill">Audio Description</span>
      <p style="margin:8px 0;font-size:0.9rem;line-height:1.6">${audioPreview || '<em class="muted">No audio descriptions</em>'}</p>
    </div>

    <div class="panel" role="region" aria-label="Download links">
      <span class="pill">Downloads</span>
      <div style="margin-top:8px">
        ${langDownloads}
        <a href="/v1/jobs/${safeId}/audio-description.json" class="dl-link" download>Audio Description (JSON)</a>
        <a href="/v1/jobs/${safeId}/sign-data.json" class="dl-link" download>Sign Data (JSON)</a>
      </div>
    </div>

    <div class="panel" role="region" aria-label="Share link">
      <span class="pill">Share</span>
      <p class="muted" style="margin:6px 0">Shareable player link:</p>
      <div class="share-box">
        <input type="text" id="shareUrl" readonly aria-label="Shareable player URL" />
        <button class="copy-btn" onclick="navigator.clipboard.writeText(document.getElementById('shareUrl').value);this.textContent='Copied!';setTimeout(()=>this.textContent='Copy',2000)">Copy</button>
      </div>
    </div>

    <p><a href="/">&larr; Process another file</a></p>
  </main>
  ${FOOTER_HTML}

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
  ${OG_META}
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
  <main class="container">
    <h1>${escapeHtml(job.original_filename)}</h1>
    <p class="subtitle">Accessibility Lite Player</p>

    <div class="panel" role="region" aria-label="Media player">${mediaTag}</div>

    <div class="panel" role="region" aria-label="Captions">
      <span class="pill">Live Captions</span>
      <pre id="captions" aria-live="polite">${captions.map((c) => escapeHtml(c.text)).join('\n') || 'No captions'}</pre>
    </div>

    <div class="sign-overlay${theme.background.style === 'gradient' ? ' bg-gradient' : theme.background.style === 'textured' ? ' bg-textured' : ''}" id="signOverlay" role="region" aria-label="Sign language overlay">
      <div class="sign-header">
        <span class="pill" style="border-color:var(--sign-accent)">Sign Language — ${escapeHtml(prefs.sign_language)}</span>
        <select class="theme-select" id="themeSelect" aria-label="Sign overlay theme">
          ${SIGN_OVERLAY_THEMES.map((t) => `<option value="${t.id}"${t.id === theme.id ? ' selected' : ''}>${escapeHtml(t.name)}</option>`).join('')}
        </select>
      </div>
      <div class="sign-segments" id="signSegments" aria-live="polite">
        ${signScript.map((s) => `
          <div class="sign-segment">
            ${s.gloss_tokens.map((t) => `<span class="sign-token">${escapeHtml(t)}</span>`).join('')}
            ${s.facial_cues?.length ? `<span class="sign-facial-cue">${escapeHtml(s.facial_cues.join(' '))}</span>` : ''}
          </div>
        `).join('') || '<span class="muted">No sign data</span>'}
      </div>
    </div>

    <div class="panel" role="region" aria-label="Audio description">
      <span class="pill">Audio Description</span>
      <pre id="audio" aria-live="polite">${audioDesc.map((a) => escapeHtml(a.text)).join('\n') || 'No audio descriptions'}</pre>
    </div>

    <div class="panel" role="region" aria-label="Download links">
      <span class="pill">Downloads</span>
      <div style="margin-top:8px">
        ${(prefs.output_languages || ['en-US']).map((lang) =>
          `<a href="/v1/jobs/${safeId}/captions.vtt?language=${lang}" class="dl-link" download>VTT (${lang})</a>
           <a href="/v1/jobs/${safeId}/captions.ttml?language=${lang}" class="dl-link" download>TTML (${lang})</a>`
        ).join('')}
        <a href="/v1/jobs/${safeId}/audio-description.json" class="dl-link" download>Audio Desc (JSON)</a>
        <a href="/v1/jobs/${safeId}/sign-data.json" class="dl-link" download>Sign Data (JSON)</a>
      </div>
    </div>
  </main>
  ${FOOTER_HTML}

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
