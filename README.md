# Accessibility Lite

Open source accessibility pipeline. Upload any video or audio file and get **captions**, **AI audio descriptions**, and **sign language overlays** — all from a single tool.

## Why this exists

> She had nothing she could do anymore. She couldn't drive, she couldn't read. But she would still try to watch as much TV as she could, because that was her habit.

Captions exist in some tools. Audio descriptions barely exist in automated form. Nobody bundles all three accessibility modalities in a single open source pipeline. This project does.

## What you get

- **Captions** — AI-powered transcription in WebVTT and TTML. Standard, simplified, or verbatim styles. 21 output languages.
- **Audio Descriptions** — AI-generated narration of visual content during dialogue gaps.
- **Sign Language** — Gloss tokens and sign cards for 10 sign languages (ASL, BSL, LSF, ISL, JSL, DGS, AUSLAN, LIBRAS, NZSL, HKSL). 6 overlay themes including high contrast and kid-friendly modes.
- **Shareable Player** — Each processed file gets a player page with live captions, sign overlays, and audio descriptions. Share the link with anyone.

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
src/
  server.js                          — HTTP server, auth, rate limiting, SSE
  config/
    runtime.js                       — Environment variable config
    accessibilityCatalog.js          — Supported languages, styles, themes
  data/
    store.js                         — In-memory state (Maps + audit log)
  services/
    jobService.js                    — Job CRUD, preference normalization
    pipelineService.js               — Processing pipeline (extract, chunk, transcribe, infer)
    mediaService.js                  — ffmpeg/ffprobe operations
    uiService.js                     — HTML page generation (upload, options, results, player)
    cleanupService.js                — TTL-based job expiry and file cleanup
    sampleService.js                 — Demo sample job creation
    providers/
      modelProvider.js               — Factory: mock | http
      mockModelProvider.js           — Mock transcription and inference
      httpModelProvider.js           — HTTP model gateway with fallback
      translationProvider.js         — Factory: mock | libretranslate | deepl (with cache)
    persistence/
      persistenceService.js          — Noop/Postgres adapter with retry
      postgresPersistence.js         — JSONB snapshot table
      stateSerializer.js             — Export/import all Maps
```

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
| `GET` | `/jobs/:id/options` | Options page (HTML) |
| `GET` | `/jobs/:id/results` | Results page (HTML) |
| `GET` | `/player/:id` | Shareable player page |

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

Jobs and their uploaded files are automatically removed after 24 hours. The cleanup runs hourly and on startup.

## Tests

```bash
npm test
```

69+ tests covering providers, pipeline, UI generation, auth, rate limiting, and HTML escaping.

## License

MIT

## Built by

[Isabella & Tan](https://github.com/dedmonwalkin)
