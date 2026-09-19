import { page } from '../layout.js';
import { resolveSignTheme, signOverlayStyles, signOverlayHtml } from '../signOverlay.js';

/**
 * Illustrative output rendered with the same components as the results page.
 * This is authored example content, not evidence of real model inference.
 */
const DEMO_THEME = resolveSignTheme('standard');
const DEMO_SIGN = [
  { start: 0, end: 2400, gloss_tokens: ['TOMORROW', 'MEETING', 'MOVE', 'WHERE?'], facial_cues: ['brow-raise'] },
  { start: 2400, end: 5200, gloss_tokens: ['ROOM', 'THREE', 'SAME', 'TIME'], facial_cues: ['nod'] }
];

const DEMO_STRIP = `
    <section class="demo" aria-label="Example output">
      <p class="demo-intro muted">Illustrative output formats, not verified model results:</p>
      <div class="demo-grid">
        <div class="demo-col">
          <p class="demo-label">Captions <span class="muted">WebVTT · TTML</span></p>
          <div class="demo-caption">
            <span class="demo-time">00:00:04.120</span>
            <p>So are we moving tomorrow's meeting, or not?</p>
          </div>
        </div>
        <div class="demo-col">
          <p class="demo-label">Audio description <span class="muted">in the dialogue gaps</span></p>
          <div class="demo-ad">
            <span class="demo-time">00:00:06.500</span>
            <p>She turns from the whiteboard, still holding the marker, and waits.</p>
          </div>
        </div>
        <div class="demo-col">
          <p class="demo-label">Sign language <span class="muted">gloss + cues</span></p>
          ${signOverlayHtml({
            theme: DEMO_THEME,
            segments: DEMO_SIGN,
            signLanguage: 'ASL',
            ariaLabel: 'Example sign language output'
          })}
        </div>
      </div>
    </section>`;

const EMBED_SNIPPET = `&lt;video src="my-talk.mp4" controls&gt;&lt;/video&gt;
&lt;script src="https://inclusy.org/embed.js"
        data-inclusy="YOUR_EMBED_ID"&gt;&lt;/script&gt;`;

export function buildUploadPage() {
  return page({
    title: 'Media tools preview',
    description: 'Explore experimental caption and media workflows. Mock providers are enabled by default; outputs require human review.',
    path: '/media',
    styles: `
${signOverlayStyles(DEMO_THEME)}

    .hero { padding: var(--s6) 0 var(--s7); }
    .hero h1 { font-size: var(--text-3xl); max-width: 16ch; margin-bottom: var(--s4); letter-spacing: -0.02em; }
    .hero .tagline { font-size: var(--text-lg); color: var(--ink-muted); max-width: 46ch; margin-bottom: var(--s6); }
    .hero-actions { display: flex; gap: var(--s3); flex-wrap: wrap; }
    .hero-facts { display: flex; gap: var(--s5); flex-wrap: wrap; margin-top: var(--s6); padding-top: var(--s5); border-top: 1px solid var(--rule); font-size: var(--text-sm); color: var(--ink-muted); }
    .hero-facts strong { color: var(--ink); display: block; font-size: var(--text-lg); }

    .demo { padding-bottom: var(--s7); }
    .demo-intro { font-size: var(--text-sm); margin-bottom: var(--s4); }
    .demo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--s4); align-items: stretch; }
    .demo-col { display: flex; flex-direction: column; }
    .demo-col > .demo-caption, .demo-col > .demo-ad, .demo-col > .sign-overlay { flex: 1; margin-bottom: 0; }
    .demo-label { font-size: var(--text-xs); font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: var(--s2); }
    .demo-label .muted { font-weight: 400; text-transform: none; letter-spacing: 0; }
    .demo-caption, .demo-ad {
      border: 1px solid var(--rule); border-left: 4px solid var(--accent);
      border-radius: var(--radius); padding: var(--s3) var(--s4);
      background: var(--surface); margin-bottom: var(--s5);
    }
    .demo-ad { border-left-color: var(--ink-muted); }
    .demo-caption p, .demo-ad p { margin: var(--s1) 0 0; }
    .demo-time { font-family: var(--font-mono); font-size: var(--text-xs); color: var(--ink-muted); }

    .steps, .feature-grid { display: grid; gap: var(--s5); }
    .steps { grid-template-columns: repeat(3, 1fr); }
    .feature-grid { grid-template-columns: repeat(2, 1fr); }
    .step-number {
      display: inline-flex; align-items: center; justify-content: center;
      width: 2rem; height: 2rem; border-radius: 50%;
      background: var(--accent); color: var(--on-accent);
      font-weight: 700; font-size: var(--text-sm); margin-bottom: var(--s3);
    }
    .step h3, .feature h3 { margin-bottom: var(--s2); }
    .step p, .feature p { color: var(--ink-muted); font-size: var(--text-sm); margin: 0; }
    .feature h3 { font-size: var(--text-base); }

    .dropzone {
      border: 2px dashed var(--border);
      border-radius: var(--radius);
      padding: var(--s8) var(--s5);
      text-align: center;
      cursor: pointer;
      background: var(--surface);
    }
    .dropzone:hover, .dropzone.dragover {
      border-color: var(--accent);
      background: color-mix(in oklab, var(--accent) 6%, var(--surface));
    }
    .dropzone p { margin: var(--s2) auto; max-width: none; }
    .dropzone .big { font-size: var(--text-lg); font-weight: 700; }
    .upload-actions { display: flex; gap: var(--s3); flex-wrap: wrap; margin-top: var(--s4); }

    .snippet {
      font-family: var(--font-mono); font-size: var(--text-xs);
      background: var(--surface); border: 1px solid var(--rule);
      border-radius: var(--radius); padding: var(--s4);
      overflow-x: auto; white-space: pre; margin: 0 0 var(--s4);
      color: var(--ink);
    }

    @media (max-width: 900px) {
      .demo-grid { grid-template-columns: 1fr; }
      .demo-col > .demo-caption, .demo-col > .demo-ad, .demo-col > .sign-overlay { flex: 0 1 auto; }
      .steps, .feature-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 480px) {
      .hero h1 { font-size: var(--text-2xl); }
    }`,
    body: `
    <section class="hero">
      <h1>Media tools, in development.</h1>
      <p class="tagline">Explore caption, description, and experimental sign-gloss workflows. Mock providers are enabled by default; this preview is not a production accessibility service.</p>
      <p>Use non-sensitive test media only. Outputs need human review. Sign gloss is not sign-language interpretation and must not replace a qualified interpreter.</p>
      <div class="hero-actions">
        <a href="#upload" class="btn">Upload a file</a>
        <a href="/embed" class="btn-outline">Add it to your site</a>
      </div>
      <div class="hero-facts">
        <span><strong>Preview</strong> experimental workflows</span>
        <span><strong>Review</strong> every output before use</span>
        <span><strong>MIT</strong> open source</span>
      </div>
    </section>

${DEMO_STRIP}

    <section class="section" id="upload">
      <h2>Try it</h2>
      <form id="uploadForm" enctype="multipart/form-data">
        <div class="dropzone" id="dropzone" role="button" tabindex="0" aria-label="File upload area. Press Enter or Space to browse files.">
          <p class="big">Drop a file here</p>
          <p class="muted">or click to browse</p>
          <p class="muted small">Video: MP4, WebM, MOV · Audio: MP3, WAV, OGG, M4A · Max 500MB</p>
          <input type="file" name="file" id="fileInput" accept="video/mp4,video/webm,video/quicktime,audio/mpeg,audio/wav,audio/ogg,audio/mp4" style="display:none" required aria-required="true" />
        </div>
        <p class="file-info" id="fileInfo" style="display:none" aria-live="polite"></p>

        <div class="upload-actions">
          <button type="submit" class="btn" id="uploadBtn" disabled>Upload and continue</button>
          <button type="button" class="btn-outline" id="sampleBtn">Try a sample instead</button>
        </div>

        <p class="error" id="error" style="display:none" aria-live="polite" role="alert"></p>
        <span id="uploadStatus" aria-live="polite" class="visually-hidden"></span>

        <div class="progress-bar" id="uploadProgress" style="display:none" aria-hidden="true">
          <div class="fill" id="uploadFill"></div>
        </div>
        <p class="muted small">Do not upload confidential or personal records. Retention and deletion depend on the deployment configuration; publishing an embed makes its outputs publicly accessible.</p>
      </form>
    </section>

    <section class="section">
      <h2>How it works</h2>
      <div class="steps">
        <div class="step">
          <div class="step-number">1</div>
          <h3>Upload</h3>
          <p>Choose a supported, non-sensitive test file or use the sample.</p>
        </div>
        <div class="step">
          <div class="step-number">2</div>
          <h3>Process</h3>
          <p>Explore the configured pipeline. Mock providers return illustrative data rather than analyzing your media.</p>
        </div>
        <div class="step">
          <div class="step-number">3</div>
          <h3>Use it</h3>
          <p>Inspect draft outputs. Verify accuracy, timing, and suitability before sharing or publishing.</p>
        </div>
      </div>
    </section>

    <section class="section">
      <h2>What you get</h2>
      <div class="feature-grid">
        <div class="feature">
          <h3>Captions</h3>
          <p>WebVTT and TTML export workflows. Accuracy and translation availability depend on the configured providers.</p>
        </div>
        <div class="feature">
          <h3>Audio descriptions</h3>
          <p>Experimental description segments. Verify visual accuracy, timing, and any generated narration before use.</p>
        </div>
        <div class="feature">
          <h3>Sign language</h3>
          <p>Experimental gloss tokens and sign cards, not validated sign-language translation or interpretation.</p>
        </div>
        <div class="feature">
          <h3>Self-hostable</h3>
          <p>Inspect and run the open-source application yourself. Data handling and provider costs depend on your configuration.</p>
        </div>
      </div>
    </section>

    <section class="section">
      <h2>Add it to your site</h2>
      <p>Publishing makes generated outputs publicly accessible through an embed ID. Review them first. The script can accompany a video on your site; it does not remediate the rest of your website.</p>
      <pre class="snippet">${EMBED_SNIPPET}</pre>
      <a href="/embed" class="btn-outline">Read the embed docs</a>
    </section>`,
    scripts: `
    var dropzone = document.getElementById('dropzone');
    var fileInput = document.getElementById('fileInput');
    var fileInfo = document.getElementById('fileInfo');
    var uploadBtn = document.getElementById('uploadBtn');
    var errorEl = document.getElementById('error');

    dropzone.addEventListener('click', function () { fileInput.click(); });
    dropzone.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
    });
    dropzone.addEventListener('dragover', function (e) { e.preventDefault(); dropzone.classList.add('dragover'); });
    dropzone.addEventListener('dragleave', function () { dropzone.classList.remove('dragover'); });
    dropzone.addEventListener('drop', function (e) {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        fileInput.dispatchEvent(new Event('change'));
      }
    });

    fileInput.addEventListener('change', function () {
      var file = fileInput.files[0];
      if (!file) return;
      fileInfo.textContent = file.name + ' (' + (file.size / 1024 / 1024).toFixed(1) + ' MB)';
      fileInfo.style.display = 'block';
      uploadBtn.disabled = false;
      errorEl.style.display = 'none';
    });

    document.getElementById('sampleBtn').addEventListener('click', async function () {
      var btn = document.getElementById('sampleBtn');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Loading sample\\u2026';
      errorEl.style.display = 'none';
      try {
        var res = await fetch('/v1/jobs/sample', { method: 'POST' });
        var data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create sample job');
        window.location.href = '/jobs/' + data.id + '/options';
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Try a sample instead';
      }
    });

    document.getElementById('uploadForm').addEventListener('submit', function (e) {
      e.preventDefault();
      uploadBtn.disabled = true;
      errorEl.style.display = 'none';
      var progress = document.getElementById('uploadProgress');
      var fill = document.getElementById('uploadFill');
      progress.style.display = 'block';

      var formData = new FormData();
      formData.append('file', fileInput.files[0]);

      var xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', function (ev) {
        if (ev.lengthComputable) {
          var pct = Math.round(ev.loaded / ev.total * 100);
          fill.style.width = pct + '%';
          document.getElementById('uploadStatus').textContent = 'Uploading: ' + pct + '%';
        }
      });
      xhr.addEventListener('load', function () {
        var data;
        try { data = JSON.parse(xhr.responseText); } catch (_) { data = {}; }
        if (xhr.status >= 200 && xhr.status < 300) {
          window.location.href = '/jobs/' + data.id + '/options';
        } else {
          errorEl.textContent = data.error || 'Upload failed';
          errorEl.style.display = 'block';
          uploadBtn.disabled = false;
          progress.style.display = 'none';
        }
      });
      xhr.addEventListener('error', function () {
        errorEl.textContent = 'Network error';
        errorEl.style.display = 'block';
        uploadBtn.disabled = false;
        progress.style.display = 'none';
      });
      xhr.open('POST', '/v1/jobs');
      xhr.send(formData);
    });`
  });
}
