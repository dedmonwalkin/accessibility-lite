# Security policy

## Reporting a vulnerability

Please do **not** report security vulnerabilities through public GitHub issues.

Instead, email the maintainer using the "Report a vulnerability" button on the repository's Security tab (GitHub private vulnerability reporting), or open an issue explicitly requesting private follow-up and we will respond with contact details.

We aim to:

- Acknowledge receipt within 3 business days
- Provide an initial assessment within 7 business days
- Publish a fix within 90 days for High/Critical issues

Please include:

- A description of the issue
- Steps to reproduce or proof-of-concept
- Impact assessment
- Suggested mitigation if you have one

## Scope

In scope:

- The code in this repository
- The default Docker image (`Dockerfile`)
- Configuration examples in `docker-compose.yml` and `.env.example`

Out of scope:

- Third-party models (Whisper, LLaVA, DeepL, LibreTranslate) — report those upstream
- Self-hosted deployments you do not control
- Issues requiring physical access, social engineering, or malicious admin

## Supported versions

The latest minor release is supported. Older minors receive fixes only for Critical issues. See [CHANGELOG.md](CHANGELOG.md) (if present) for release history.

## Hardening checklist for operators

If you run Accessibility Lite in production, please:

1. Set `API_KEYS` — never deploy with `AUTH_DISABLED=true` on a public endpoint.
2. Run behind a TLS-terminating reverse proxy and set `TRUSTED_PROXY=true` so rate limiting works.
3. Leave `MODEL_FALLBACK_ON_ERROR` at its default (`false`). Silent fallback hides real outages and serves fabricated output.
4. Rotate `DATABASE_URL` credentials from their dev defaults. Never commit `.env`.
5. Review [LIMITATIONS.md](LIMITATIONS.md) before advertising outputs as compliant with any specific standard.
6. Keep the base image and ffmpeg up to date. ffmpeg CVEs are the dominant path to RCE in any transcoding pipeline.

## Acknowledgements

Researchers who report valid issues are credited in release notes, unless they ask otherwise.
