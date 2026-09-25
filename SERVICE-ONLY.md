# Consulting-only release candidate

September 24 current state: **Working Access** is the selected brand and
`https://workingaccess.org` the intended canonical origin. Local rebrand branch:
`codex/working-access-rebrand`, based on `703e1df`. The prior `whakauru` app is
paused with its only machine stopped and autostart disabled. No new image was
deployed. DNS, mail settings and the old media app are unchanged. Contact remains
`bob@whakauru.com` until a new mailbox is verified. Read [DEPLOYMENT.md](DEPLOYMENT.md)
before any restart: existing old-domain routes still reach this same Fly app.
The records below are historical checkpoints, not current deployment status.

Consulting-only release, prepared September 19, 2026.

September 22 release authorization: the owner approved commit, push and deployment
to a separate Fly app, `whakauru`, leaving the existing media app untouched. Use
`fly.service.toml` and [DEPLOYMENT.md](DEPLOYMENT.md), not the media `fly.toml`.
The full 137-test suite and rebuilt Node 24 non-root/read-only container smoke
pass. Custom-domain DNS and mail configuration are not part of this deployment.
The earlier local-only records below describe their respective checkpoints.

September 22 brand update: the local candidate is now Whakauru, with
`https://whakauru.com` as the default SITE_URL and `bob@whakauru.com` as the
default CONTACT_EMAIL for both general and accessibility enquiries. Only Bob's
mailbox is confirmed; do not publish untested aliases from the reference draft.
Environment overrides still take precedence and need cutover review.
The old social PNG is no longer advertised in metadata or served here. A new
social image remains a launch task. Name story and language review remain open.
No Fly app rename, domain routing, DNS or production change was performed.

## Choose the correct entry point

`npm run start:service` runs `src/serviceServer.js`, the isolated consulting
website. `npm start` still runs the full experimental media application. Do not
use the latter as the consulting-only launch command.

For a local preview on the current port:

```sh
PORT=4317 npm run start:service
```

The consulting site retains service descriptions, the local project guide,
theme/text controls, accessibility feedback, and contact links. It omits media
preview navigation, embed links, and the experimental workbench section.
Media accessibility planning remains a consulting scope, not an upload feature.

## Boundary

| Surface | Consulting server |
| --- | --- |
| `/` | GET/HEAD service homepage |
| `/health` | GET/HEAD service-only health response |
| Named `/static/` fonts and font licence | GET/HEAD explicit asset allowlist |
| Uploads, job APIs, job pages, raw media, player, embeds, catalogue | 404, including bearer-key and query-key requests |
| Writes to known public resources | 405 |
| Unknown assets/files | 404 |

This server does not import the media server, providers, store, persistence,
cleanup, or upload services. It starts no database or background-job timers.
Browser policy permits only the exact inline scripts rendered into each page,
and blocks network calls, form submissions, third-party frames and embedding.
Email links still open the visitor's email client; they do not send anything
automatically. Browser-local appearance preferences remain supported.

## Container

`Dockerfile.service` copies only the service entry point, required presentation
modules, package metadata, and public assets. Its matching ignore file excludes
uploads, credentials, Git history and unrelated application code from the build
context. There is no dependency install or ffmpeg. It runs as the non-root
`node` user on Node 24, an LTS release per the
[official release table](https://nodejs.org/en/about/previous-releases).

The existing media Dockerfile and `fly.toml` have NOT been changed. A production
cutover must select this service image explicitly and review routing, secrets,
mounts, HTTPS, health checks, logs, rollback, and any existing embed consumers.
Do not mount old uploads or attach database/model credentials to the service
deployment. Do not assume the development preview changes production behavior.

## Verification

- Full suite: 134 passing tests. Six new tests cover service-only navigation,
  health, media-route rejection across GET/HEAD/POST/OPTIONS, asset allowlisting,
  write rejection, HEAD responses, and exact inline-script CSP hashes.
- Local Node runtime: v26.5.0. Container built using Node 24 Alpine.
- Container smoke passed as non-root, with a read-only filesystem, no external
  network, no host ports and no mounted volumes. Verified homepage, health,
  font delivery and blocked media/API paths, plus absence of media server,
  service modules, uploads and node_modules inside the image. Test container
  removed itself; local review image remains `inclusy-service-review:local`.
- Chrome preview: service-only navigation, working theme toggle and guide,
  no observed browser warnings/errors under the new CSP. Earlier responsive and
  keyboard checks remain recorded in SERVICE-LAUNCH.md and LAUNCH-REVIEW.md.

The actual hosted environment, privacy/terms, owner-approved service scope,
independent assistive-technology testing, monitoring and rollback remain launch
gates. Media authorization/privacy issues remain unresolved in the full app;
isolation avoids exposing them in this candidate, not fixes them in that app.

All follow-up work is local and uncommitted on `codex/inclusy-service-launch`.
No push, merge, DNS change, email, or deployment was performed.
