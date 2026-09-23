# Whakauru service deployment

The owner authorized a separate Fly app, `whakauru`, for the consulting website.
The existing `inclusy` media app, volumes, secrets and custom domains stay untouched.
Deploy from `codex/inclusy-service-launch`; merging the experimental branches is
not a prerequisite. The private project-home repository is never a build context.

## Release procedure

1. Fetch and review Git status; stop on unexpected concurrent changes.
2. Run `npm test` and build/smoke-test `Dockerfile.service`.
3. Commit and push the reviewed release. Record its SHA with the deployment.
4. Run `flyctl config validate --strict --config fly.service.toml`.
5. Run `flyctl deploy --config fly.service.toml --local-only --ha=false`.
6. Verify HTTPS, homepage/contact, `/health`, fonts, security headers, and 404s
   for media routes and POST `/v1/jobs`. Check Fly health and browser controls.

This config selects the service-only Dockerfile and an explicit build allowlist.
One shared 256 MB machine auto-stops when idle and auto-starts for requests.
Cold starts are possible; this is not a high-availability configuration. No
volumes, databases, providers or application secrets are required. Hosting usage
is billed by Fly. The app region is not a data-residency commitment.

## Domain boundary

The owner authorized connecting `whakauru.com` after the initial Fly-hostname
release. `SITE_URL` is now `https://whakauru.com`, matching the code default.
Fly manages certificates for both `whakauru.com` and `www.whakauru.com`.
The `www` hostname serves the same site with the apex canonical URL, not an
application-level redirect. The Fly hostname remains available as a fallback.

Website DNS at Porkbun (TTL 600):

| Type | Host | Value |
| --- | --- | --- |
| A | @ | 66.241.125.183 |
| AAAA | @ | 2a09:8280:1::198:7300:0 |
| CNAME | www | whakauru.com |

The former apex ALIAS pointed to `uixie.porkbun.com`; `www` previously inherited
the existing wildcard CNAME to that host. The wildcard and existing TXT records
were retained. MX, SPF, DKIM, DMARC, nameservers and Porkbun mailbox settings must
not be changed by website releases. No `.org` routing or redirect is included.
Verify certificate issuance and public HTTPS before calling a cutover complete.

## Rollback

Record each successfully verified `registry.fly.io/whakauru:...` image reference
in the private project-home handoff. For subsequent releases, redeploy that
known-good service image with `flyctl deploy --config fly.service.toml --image
<verified-image-reference> --ha=false`. Re-run the public smoke checks. Never
roll this service back to the old full-media image. Retain the matching config
commit if configuration must also be restored.

For a failed first release there is no prior Whakauru image: stop the new app's
machines with `flyctl apps suspend whakauru` while fixing it. The old app and
email remain unaffected. Stopping machines is not deletion and does not remove
all possible charges. Destructive cleanup needs separate approval.

## Remaining checks

Automated tests and browser smoke checks are not a full accessibility audit.
Independent assistive-technology/user testing, a social preview image, language
review and business engagement readiness remain separate follow-up work.
