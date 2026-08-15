# Inclusy

Open source accessibility pipeline, running at **[inclusy.org](https://inclusy.org)**. Upload any video or audio file and get **captions**, **AI audio descriptions**, and **sign language overlays** — all from a single tool. Then add the whole layer to your own site with one script tag.

## Why this exists

> She had nothing she could do anymore. She couldn't drive, she couldn't read. But she would still try to watch as much TV as she could, because that was her habit.

Captions exist in some tools. Audio descriptions barely exist in automated form. Nobody bundles all three accessibility modalities in a single open source pipeline. This project does.

## What you get

- **Captions** — AI-powered transcription in WebVTT and TTML. Standard, simplified, or verbatim styles. 21 output languages.
- **Audio Descriptions** — AI-generated narration of visual content during dialogue gaps.
- **Sign Language** — Gloss tokens and sign cards for 10 sign languages (ASL, BSL, LSF, ISL, JSL, DGS, AUSLAN, LIBRAS, NZSL, HKSL). 6 overlay themes including high contrast and kid-friendly modes.
- **Shareable Player** — Each processed file gets a player page with live captions, sign overlays, and audio descriptions. Share the link with anyone.
- **Embeddable plugin** — One script tag adds all three layers to a video on your own site. See [The plugin](#the-plugin).

## Quick start

```bash
# Clone and install
git clone https://github.com/dedmonwalkin/accessibility-lite.git
cd accessibility-lite
npm install

# Start (uses mock AI providers — no API keys needed)
npm start
# Open http://localhost:3000
```

## Docker

```bash
# With Postgres persistence
docker compose up

# Or standalone
docker build -t accessibility-lite .
docker run -p 3000:3000 accessibility-lite
```

## The plugin

Process a file, press **Publish and get embed code** on the results page, and paste the snippet onto any page that has a video:

```html
<video src="my-talk.mp4" controls></video>
<script src="https://inclusy.org/embed.js"
        data-inclusy="YOUR_EMBED_ID"
        data-lang="en-US"
        data-sign="on"
        data-ad="panel"></script>
```

**Inclusy never serves your media.** The embed sends only the accessibility layer — a few kilobytes of caption, description, and sign data — so your video stays on your own host. There is no bandwidth cost, and published embeds are exempt from the 24-hour job expiry.

| Attribute | Default | Description |
|-----------|---------|-------------|
| `data-inclusy` | required | Embed ID from publishing a result |
| `data-target` | first `<video>` | CSS selector for the video to attach to |
| `data-lang` | job default | Caption language, e.g. `es-ES` |
| `data-sign` | `on` | `on` or `off` — the sign gloss overlay |
| `data-ad` | `panel` | `panel`, `speak` (reads aloud and ducks the video), or `off` |
| `data-position` | `top-right` | Overlay corner. The bottom is left free for the caption line and controls |

For platforms that strip `<script>` tags (Squarespace, Notion, most newsletter tools), use the iframe instead:

```html
<iframe src="https://inclusy.org/embed/YOUR_EMBED_ID?src=https://yoursite.com/my-talk.mp4"
        width="100%" height="480" allowfullscreen title="Accessible player"></iframe>
```

### How it's built

Two decisions shape the script:

- **Cues are injected programmatically** with `addTextTrack` + `VTTCue`, not via a cross-origin `<track src>`. A cross-origin track would require `crossorigin="anonymous"` on your `<video>`, which forces CORS on your media too and breaks videos served from a CDN without those headers.
- **The overlay lives in a shadow root**, anchored to the video's own box. Your CSS can't break it, its CSS can't break your page, and it modifies nothing in your DOM.

It's hand-written with no build step, ships at ~3.8KB gzipped, and never throws into the host page — every failure path warns to the console and no-ops. Because the base URL is derived from the script's own `src`, a self-hosted instance talks to itself rather than to inclusy.org.

Captions are a native text track, so they keep working in fullscreen and with the browser's own caption UI. The sign and description overlay is a DOM layer, so it does not follow the video into fullscreen.

## Self-hosting with local models

Run the full pipeline locally with zero API costs:

| Component | Tool | Cost |
|-----------|------|------|
| Transcription | [whisper.cpp](https://github.com/ggerganov/whisper.cpp) server mode | Free |
| Vision / Descriptions | [Ollama](https://ollama.ai) + Gemma or LLaVA | Free |
| Translation | [LibreTranslate](https://github.com/LibreTranslate/LibreTranslate) | Free |

Configure via environment variables:

```bash
MODEL_PROVIDER=http
MODEL_HTTP_BASE_URL=http://localhost:8080    # whisper.cpp or Ollama adapter
TRANSLATION_PROVIDER=libretranslate
TRANSLATION_HTTP_BASE_URL=http://localhost:5000
```

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `MODEL_PROVIDER` | `mock` | `mock` or `http` |
| `MODEL_HTTP_BASE_URL` | — | URL of model inference server |
| `MODEL_HTTP_API_KEY` | — | Bearer token for model server |
| `MODEL_HTTP_TIMEOUT_MS` | `4000` | Model request timeout |
| `TRANSLATION_PROVIDER` | `mock` | `mock`, `libretranslate`, or `deepl` |
| `TRANSLATION_HTTP_BASE_URL` | — | LibreTranslate URL |
| `TRANSLATION_API_KEY` | — | DeepL or LibreTranslate key |
| `API_KEYS` | — | Comma-separated auth tokens (empty = public) |
| `RATE_LIMIT_RPM` | `60` | Requests per minute per IP (0 = disabled) |
| `MAX_UPLOAD_MB` | `500` | Max upload file size |
| `ENABLE_POSTGRES` | `false` | Enable Postgres persistence |
| `DATABASE_URL` | — | Postgres connection string |
| `SNAPSHOT_INTERVAL_MS` | `300000` | Auto-snapshot interval (5 min) |

## Architecture

```
public/                              — Static assets served at /static/*
  fonts/                             — Self-hosted Atkinson Hyperlegible (SIL OFL)
  og.png                             — Link preview image
design/og.html                       — Source for og.png, re-render with headless Chrome
src/
  server.js                          — HTTP server, auth, rate limiting, CORS, SSE
  config/
    runtime.js                       — Environment variable config
    accessibilityCatalog.js          — Supported languages, styles, themes
  data/
    store.js                         — In-memory state (Maps + audit log)
  services/
    jobService.js                    — Job CRUD, preference normalization
    pipelineService.js               — Processing pipeline (extract, chunk, transcribe, infer)
    mediaService.js                  — ffmpeg/ffprobe operations
    publishService.js                — Turns a finished job into a permanent embed
    uiService.js                     — Facade re-exporting src/ui/ page builders
    cleanupService.js                — TTL expiry; keeps published outputs, drops their media
    sampleService.js                 — Demo sample job creation
    providers/                       — model | transcription | translation factories
    persistence/                     — Noop/Postgres adapter, JSONB snapshots, serializer
  ui/
    tokens.js                        — Design tokens, type scale, base stylesheet
    layout.js                        — HTML shell: head tags, chrome, theme + text-size boot
    signOverlay.js                   — Sign overlay shared by results, player, and embed
    embedScript.js                   — The plugin served at /embed.js
    escape.js                        — HTML escaping and URL validation
    pages/                           — upload, options, results, player, embed, error
```

### Design system

The palette, type scale, and spacing live in `src/ui/tokens.js`. Two rules hold it together, both because this is an accessibility product whose own site is the first demo:

1. **No text below 14px.** Body is 18px.
2. **No opacity-dimmed text.** Every muted value is a token with a measured contrast ratio.

`test/contrast.test.js` recomputes every token pair on each run and fails if any text pair drops below 4.5:1 or any interactive border below 3:1. The UI is set in [Atkinson Hyperlegible](https://www.brailleinstitute.org/freefont/), designed by the Braille Institute for low-vision legibility, self-hosted so no request leaves your origin.

## API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Landing page |
| `GET` | `/health` | Health check (includes persistence status) |
| `GET` | `/v1/catalog` | Supported languages, styles, themes |
| `POST` | `/v1/jobs` | Upload file, create job |
| `POST` | `/v1/jobs/sample` | Create a sample demo job |
| `GET` | `/v1/jobs/:id` | Job status |
| `POST` | `/v1/jobs/:id/process` | Start processing with preferences |
| `GET` | `/v1/jobs/:id/progress` | SSE progress stream |
| `GET` | `/v1/jobs/:id/captions.vtt` | Download WebVTT captions |
| `GET` | `/v1/jobs/:id/captions.ttml` | Download TTML captions |
| `GET` | `/v1/jobs/:id/audio-description.json` | Download audio descriptions |
| `GET` | `/v1/jobs/:id/sign-data.json` | Download sign language data |
| `GET` | `/v1/jobs/:id/media` | Stream original media (range requests supported) |
| `POST` | `/v1/jobs/:id/publish` | Publish a finished job, returns an embed ID + snippet |
| `GET` | `/jobs/:id/options` | Options page (HTML) |
| `GET` | `/jobs/:id/results` | Results page (HTML) |
| `GET` | `/player/:id` | Shareable player page |
| `GET` | `/embed` | Plugin documentation |
| `GET` | `/static/*` | Fonts and images |

### Embed API

Public, CORS-enabled (`Access-Control-Allow-Origin: *`), and permanent — these are the only cross-origin readable routes. Upload and processing endpoints deliberately are not.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/embed.js` | The plugin (gzipped, ~3.8KB) |
| `GET` | `/embed/:embedId?src=` | Chromeless iframe player; `src` must be http/https |
| `GET` | `/v1/embed/:embedId/manifest.json` | Languages and which layers exist |
| `GET` | `/v1/embed/:embedId/captions.vtt?language=` | Cues |
| `GET` | `/v1/embed/:embedId/audio-description.json` | Description segments |
| `GET` | `/v1/embed/:embedId/sign-data.json` | Gloss tokens and sign cards |

## How processing works

1. Upload a video or audio file
2. Audio is extracted to WAV (16kHz mono) via ffmpeg
3. Audio is split into chunks (5 seconds by default)
4. Each chunk is transcribed, then run through perception, accessibility, and sign inference
5. Captions are translated to all selected output languages
6. Results are assembled and available via download links or the player page

## Persistence

By default, all data lives in memory — fast and simple, but lost on restart.

Enable Postgres for durable storage:

```bash
ENABLE_POSTGRES=true
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

The app automatically snapshots state to Postgres on:
- Job completion
- Every 5 minutes (configurable)
- Graceful shutdown

On startup, the latest snapshot is loaded automatically.

## Job expiry

Unpublished jobs and their uploaded files are removed after 24 hours. The cleanup runs hourly and on startup.

Published jobs are treated differently, because someone's website is loading them: the uploaded media is still deleted on the same 24-hour schedule (embeds never serve it), but the job record and its outputs — kilobytes of text — are kept indefinitely.

Publishing triggers an immediate Postgres snapshot. This matters on Fly, where `auto_stop_machines` stops idle machines: an embed that existed only in memory would not survive the next scale-to-zero.

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `SITE_URL` | `https://inclusy.org` | Public origin, used for canonical/OG tags and generated snippets |

## Tests

```bash
npm test
```

100+ tests covering providers, pipeline, UI generation, auth, rate limiting, HTML escaping, the embed API and its CORS boundary, static path traversal, and WCAG contrast for every design token.

## License

MIT

## Built by

[Isabella & Tan](https://github.com/dedmonwalkin)
