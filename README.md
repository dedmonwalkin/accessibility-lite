# Accessibility Lite

Open-source media accessibility pipeline. Upload a video or audio file and get **captions in 21 languages** plus **AI-drafted audio descriptions** that a human reviewer can polish before shipping.

Self-hostable. MIT-licensed. Works offline with local models.

## Why this exists

Captioning at compliance quality is expensive and locked to proprietary vendors. Audio description is worse — it barely exists in automated form, and what exists is trapped inside closed platforms. Public-sector buyers in the EU cannot legally send media to US SaaS for processing, so they end up with no accessibility at all.

Accessibility Lite is a single, self-hostable pipeline that covers the parts of [WCAG 2.2 Level A/AA](https://www.w3.org/TR/WCAG22/), [EN 301 549](https://www.etsi.org/deliver/etsi_en/301500_301599/301549/), and the [European Accessibility Act](https://eur-lex.europa.eu/eli/dir/2019/882/oj) (enforceable 28 June 2025) that automation can realistically help with: **captions and audio-description drafts**.

## What you get

- **Captions** — AI-powered transcription to [WebVTT](https://www.w3.org/TR/webvtt1/) and [TTML2](https://www.w3.org/TR/ttml2/). Standard, simplified, or verbatim styles. 21 output languages.
- **AD Draft Assist** — AI-generated *first-draft* narration of visual content during dialogue gaps. **Requires human review before publication.** See [LIMITATIONS.md](LIMITATIONS.md).
- **Shareable Player** — Each processed file gets a player page with live captions and audio descriptions. Share the link with anyone.

> [!IMPORTANT]
> Outputs from AI models are drafts, not finished accessibility products. Read [LIMITATIONS.md](LIMITATIONS.md) before using outputs in compliance-bound workflows.

## Quick start

```bash
git clone https://github.com/dedmonwalkin/accessibility-lite.git
cd accessibility-lite
npm install

# Mock providers — no API keys, no external calls. Demo only.
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

| Component | Tool | License | Cost |
|-----------|------|---------|------|
| Transcription | [whisper.cpp](https://github.com/ggerganov/whisper.cpp) server mode | MIT | Free |
| Vision / descriptions | [Ollama](https://ollama.ai) + Gemma or LLaVA | Apache 2.0 / Llama Community | Free |
| Translation | [LibreTranslate](https://github.com/LibreTranslate/LibreTranslate) | **AGPL-3.0** — see note | Free |

> [!WARNING]
> LibreTranslate is AGPL-3.0. If you expose it over a network as part of a hosted service you offer to others, AGPL obligations attach to the combined work. For a managed SaaS, prefer DeepL or an in-house translation shim. For private self-hosting or internal use, AGPL is usually not a practical issue — but confirm with your counsel.

This repo ships a ready-made inference server: the
[model gateway](model-gateway/README.md) runs Whisper locally (whisper.cpp or
the Python CLI) or via the OpenAI API, behind the HTTP contract the app
already speaks.

```bash
# Terminal 1 — real local transcription
WHISPER_BACKEND=python-whisper npm run start:gateway

# Terminal 2 — the app
MODEL_PROVIDER=http MODEL_HTTP_BASE_URL=http://localhost:4011 npm start
```

Or configure any compatible inference server via environment variables:

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
| `MODEL_HTTP_TIMEOUT_MS` | `4000` | Model request timeout (raise to `120000` for real transcription) |
| `MODEL_HTTP_ALLOW_PRIVATE` | `false` | Allow `MODEL_HTTP_BASE_URL` on a private network (e.g. docker-compose gateway). Applies only to the operator-configured gateway URL. |
| `MODEL_FALLBACK_ON_ERROR` | `false` | If `true`, silent fallback to mock on provider failure. **Never enable in production.** |
| `TRANSLATION_PROVIDER` | `mock` | `mock`, `libretranslate`, or `deepl` |
| `TRANSLATION_HTTP_BASE_URL` | — | LibreTranslate URL |
| `TRANSLATION_API_KEY` | — | DeepL or LibreTranslate key |
| `API_KEYS` | — | Comma-separated auth tokens. **Empty requires `AUTH_DISABLED=true`.** |
| `AUTH_DISABLED` | `false` | Must be `true` to run without API keys. |
| `TRUSTED_PROXY` | `false` | Set `true` only when behind a trusted reverse proxy; enables `X-Forwarded-For` parsing. |
| `RATE_LIMIT_RPM` | `60` | Requests per minute per IP (0 = disabled) |
| `MAX_UPLOAD_MB` | `500` | Max upload file size |
| `MAX_JSON_BODY_BYTES` | `1048576` | Max JSON request body (1 MB) |
| `ENABLE_POSTGRES` | `false` | Enable Postgres persistence |
| `DATABASE_URL` | — | Postgres connection string |
| `SNAPSHOT_INTERVAL_MS` | `300000` | Auto-snapshot interval (5 min) |
| `SNAPSHOT_RETENTION` | `20` | Keep last N snapshots (0 = keep all, not recommended) |
| `HTTP_PROVIDER_MAX_RESPONSE_BYTES` | `10485760` | Response cap for model/translation HTTP calls (10 MB) |

## Architecture

```
src/
  server.js                          — HTTP server, auth, rate limiting, SSE
  config/
    runtime.js                       — Env config, fail-fast validation
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
      httpModelProvider.js           — HTTP model gateway (SSRF-guarded, response-capped)
      translationProvider.js         — Factory: mock | libretranslate | deepl (with cache)
    persistence/
      persistenceService.js          — Noop/Postgres adapter with retry
      postgresPersistence.js         — JSONB snapshot table (with retention)
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
| `GET` | `/v1/jobs/:id/audio-description.json` | Download audio-description draft |
| `GET` | `/v1/jobs/:id/media` | Stream original media (range requests supported) |
| `GET` | `/jobs/:id/options` | Options page (HTML) |
| `GET` | `/jobs/:id/results` | Results page (HTML) |
| `GET` | `/player/:id` | Shareable player page |
| `GET` | `/cookies` | Cookie policy |
| `GET` | `/privacy` | Privacy notice |

## How processing works

1. Upload a video or audio file
2. The file is validated against allowed MIME types **and** its first-bytes magic number
3. Audio is extracted to WAV (16 kHz mono) via ffmpeg
4. Audio is split into chunks (5 seconds by default)
5. Each chunk is transcribed, then run through perception and accessibility inference
6. Captions are translated to selected output languages
7. Results are assembled and available via download links or the player page

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

On startup, the latest snapshot is loaded automatically. Old snapshots beyond `SNAPSHOT_RETENTION` are pruned.

## Job expiry

Jobs and their uploaded files are automatically removed after 24 hours. The cleanup runs hourly, on startup, and sweeps orphan directories left behind by failed uploads.

## Privacy & cookies

This service sets a minimal set of strictly-necessary cookies only (no tracking, no third-party analytics by default). See [COOKIES.md](COOKIES.md) and [PRIVACY.md](PRIVACY.md).

## Limitations

AI outputs from this pipeline are drafts, not finished accessibility products. Read [LIMITATIONS.md](LIMITATIONS.md) before relying on outputs for legal compliance or for blind / Deaf / hard-of-hearing audiences.

## Security

Report vulnerabilities via [SECURITY.md](SECURITY.md).

## Tests

```bash
npm test
```

## License

MIT

## Built by

[Isabella & Tan](https://github.com/dedmonwalkin) — with thanks to an audience of one whose evening TV habit reminded us this work matters.
