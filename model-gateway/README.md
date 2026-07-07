# Model gateway

The one process in the stack that runs real inference. Both
[accessibility-lite](../README.md) and
[accessibility-broadcast](https://github.com/dedmonwalkin/accessibility-broadcast)
call it through `MODEL_HTTP_BASE_URL` — run one gateway, both products get
real transcription.

## Backends

| `WHISPER_BACKEND` | What it does | Required env |
|---|---|---|
| `whispercpp` | Runs [whisper.cpp](https://github.com/ggerganov/whisper.cpp) locally. Audio never leaves your machine. | `WHISPER_CPP_MODEL` (path to ggml `.bin`), optionally `WHISPER_CPP_BIN` (default `whisper-cli`) |
| `openai` | Calls the OpenAI transcription API. No infra, pay per minute. | `OPENAI_API_KEY`, optionally `WHISPER_OPENAI_MODEL` (default `whisper-1`), `OPENAI_BASE_URL` for compatible endpoints |
| `mock` (default) | Clearly-labelled placeholder for dev/tests. Confidence is always `0`. | — |

For public-sector deployments, prefer `whispercpp`: the privacy story
("meeting audio never leaves your infrastructure") matters in procurement.

## Run

```bash
# Local dev (mock)
node model-gateway/server.js

# Local whisper.cpp
WHISPER_BACKEND=whispercpp \
WHISPER_CPP_MODEL=/path/to/ggml-base.en.bin \
node model-gateway/server.js

# Docker (whisper.cpp + model baked in, ~1GB image with base.en)
docker build -t model-gateway model-gateway/
docker run -p 4011:4011 model-gateway
```

Then point the app at it:

```bash
MODEL_PROVIDER=http MODEL_HTTP_BASE_URL=http://localhost:4011 npm start
```

Inside docker-compose the gateway hostname resolves to a private IP, which the
app's SSRF guard refuses by default — set `MODEL_HTTP_ALLOW_PRIVATE=true` on
the app (already wired in the repo's `docker-compose.yml`).

## Endpoints

- `GET /health` — `{ ok, service, backend }`
- `POST /v1/models/transcribe` — `{ audio_base64, format, language, duration_ms }` → `{ transcript, scene, language, duration_ms, confidence, _backend }`
- `POST /v1/models/perception`, `/v1/models/accessibility`, `/v1/models/sign-script` — structural transforms of caller-provided data (no model, no fabrication)
- `POST /v1/translate` — proxies to `LIBRETRANSLATE_URL` if set, otherwise `501`

## Honesty notes

- `scene` is always empty: there is no visual model here, so the gateway never
  invents visual descriptions. Audio description therefore requires human
  authoring (see [LIMITATIONS.md](../LIMITATIONS.md)) until a captioning
  vision model is added.
- `confidence` semantics vary by backend: mean token probability
  (whisper.cpp), `exp(mean avg_logprob)` (OpenAI), `0` (mock). Treat it as a
  review-prioritisation signal, not a guarantee.
- Every transcribe response carries `_backend` so downstream consumers can
  tell real output from mock.

## Auth & limits

- `GATEWAY_API_KEY` — optional bearer token; leave empty only on trusted
  internal networks.
- `GATEWAY_MAX_BODY_BYTES` — request cap (default 32MB, comfortably above a
  base64-encoded 60s 16kHz mono WAV).
- `TRANSCRIBE_TIMEOUT_MS` — per-request inference timeout (default 120s).
