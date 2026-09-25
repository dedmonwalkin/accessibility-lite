# Working Access service deployment

The owner authorized a separate Fly app, `whakauru`, for the consulting website.
The existing `inclusy` media app, volumes, secrets and custom domains stay untouched.
Rebrand work is on `codex/working-access-rebrand`; merging experimental branches is
not a prerequisite. The private project-home repository is never a build context.

## Release procedure

**Relaunch authorized September 24, 2026.** The owner approved deployment,
workingaccess.org/www routing, redirects from the old site, and confirmed the
tested bob@workingaccess.org mailbox. Before deployment, machine
`82d1477b227628` is paused on image `registry.fly.io/whakauru:7af0a9d`.
The app name is an infrastructure
identifier, not the public brand; no replacement app or subscription is needed.
This pause does not delete resources or guarantee that all charges stop.

`fly.service.toml` uses the new SITE_URL and CONTACT_EMAIL, restores automatic
startup, and configures explicit redirect hosts: whakauru.com, www.whakauru.com,
whakauru.fly.dev and www.workingaccess.org. GET/HEAD requests to those hosts
receive HTTP 308 to the trusted canonical origin, preserving path/query. The
health endpoint stays available; write methods retain 404/405 restrictions.
The canonical hostname is never redirected back to itself. Local/self-hosted
servers do not redirect unless REDIRECT_HOSTS is configured.

Verify DNS/certificate issuance before running the approved deployment, then
verify redirects and the canonical page after release. Do not restore the old
image as a routine rollback: that would resurrect the retired Whakauru website.
If the new release fails, pause the machine while fixing it instead.

1. Fetch and review Git status; stop on unexpected concurrent changes.
2. Run `npm test` and build/smoke-test `Dockerfile.service`.
3. Commit and push the reviewed release. Record its SHA with the deployment.
4. Run `flyctl config validate --strict --config fly.service.toml`.
5. Run `flyctl deploy --config fly.service.toml --local-only --ha=false`.
6. Verify HTTPS, homepage/contact, `/health`, fonts, security headers, and 404s
   for media routes and POST `/v1/jobs`. Check Fly health and browser controls.

This config selects the service-only Dockerfile and an explicit build allowlist.
The normal release uses one shared 256 MB machine that auto-stops when idle and
auto-starts for requests; the approved release restores that behavior.
Cold starts are possible; this is not a high-availability configuration. No
volumes, databases, providers or application secrets are required. Hosting usage
is billed by Fly. The app region is not a data-residency commitment.

## Domain boundary

Working Access website DNS at Porkbun (TTL 600):

| Type | Host | Value |
| --- | --- | --- |
| A | @ | 66.241.125.183 |
| AAAA | @ | 2a09:8280:1::198:7300:0 |
| CNAME | www | workingaccess.org |

This replaces the apex ALIAS to `pixie.porkbun.com`; the old wildcard CNAME
to that host is preserved. MX and SPF records are unchanged. New certificates
cover workingaccess.org and www.workingaccess.org. No mail records, mailbox
settings, nameservers or additional domains are modified by this release.

### Retired site

The owner previously authorized connecting `whakauru.com` after the initial
Fly-hostname release. The new release uses `SITE_URL=https://workingaccess.org`.
Fly manages certificates for both `whakauru.com` and `www.whakauru.com`.
Before the pause, `www` served the same site with the apex canonical URL, not an
application-level redirect. After this release these hostnames redirect, rather
than serving a second copy of the website. Retain their TLS for secure redirects.

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

For an authorized pause without deleting the app, disable request-driven startup
before stopping each service machine:

```sh
fly machine update 82d1477b227628 -a whakauru --autostart=false --autostop=stop --skip-start --yes
fly machine stop 82d1477b227628 -a whakauru
fly machine list -a whakauru --json
```

Check the current machine inventory first; IDs may change after a release. On
September 24 the machine was already stopped, so only the update was needed.
Verify it stays stopped after a public request. `fly apps suspend` is deprecated;
do not rely on that older command. The media app and email remain unaffected.
Destructive cleanup needs separate approval. Restoration also needs owner approval.

## Remaining checks

Automated tests and browser smoke checks are not a full accessibility audit.
Independent assistive-technology/user testing, name screening, optional social
imagery and business engagement readiness remain separate follow-up work.
