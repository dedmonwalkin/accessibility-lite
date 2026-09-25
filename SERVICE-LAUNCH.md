# Service-first website draft

Current branch: `codex/working-access-rebrand`, based on service release `703e1df`.
September 24: local Working Access rebrand; previous Whakauru deployment paused.
The earlier launch records below retain their original scope and dates.

## September 24 Working Access checkpoint

Rebranded the shared page shell, metadata, purpose section, service errors and
experimental media presentation without changing legacy embed attributes or
stored preference keys. The intended canonical origin is workingaccess.org;
the verified bob@whakauru.com mailbox stays until a replacement is tested.
Preserved the map motif, tagline, service scope and experimental-media isolation.

All 139 tests pass, including updated identity/origin assertions and new
transitional-contact and service-404 coverage. Strict Fly config validation and
Git diff whitespace checks pass. Browser checks at 320/390/768/1280px with maximum
built-in text size found no horizontal overflow. Theme controls, visible skip
link with focus transfer, and keyboard project-guide activation passed with no
observed browser warnings/errors. No full screen-reader audit or container
rebuild performed. Preview: http://localhost:4317.

The former site's machine is stopped with autostart disabled. App, image and
domain/mail configuration are preserved; no new deployment, DNS/mail changes,
commit, push or merge. Working Access email and custom-domain cutover need
verification and owner authorization before relaunch.
The owner authorized the isolated service deployment on September 22, 2026.
See [DEPLOYMENT.md](DEPLOYMENT.md) for the separate Fly app and release procedure.
Other Claude branches contain separate launch/security/inference work and need
reconciliation before any media release. Earlier records below are historical.

## September 22 Whakauru rebrand

The local website now uses Whakauru, "Nobody gets left off the map.", a
cartographic hero and a dictionary-linked name story. The owner's reference
HTML was synthesized into the existing accessible shell rather than replacing
it. Unverified legal calculators, dates, capability promises, pronunciation and
email aliases are excluded. Default SITE_URL is https://whakauru.com, not a
claim that the domain is deployed. All enquiry links use bob@whakauru.com unless
CONTACT_EMAIL is explicitly overridden.

137 tests pass, including new identity/origin/compatibility checks. In-app
browser checks verified 320/390/768/1280px reflow with enlarged text, both themes,
skip-link focus transfer, and the keyboard project guide without observed console
warnings/errors. No full screen-reader audit or new container build performed.
The old social image is no longer advertised; a replacement remains to be made.
Legacy embed attributes and preference keys, repo/branch names and deployment
configuration are unchanged. No commit, push, merge, DNS or deployment this pass.

## Service scope

- `/` describes a proposed accessibility examination and remediation service.
- `/media` keeps the upload tool, clearly marked experimental.
- General contact defaults to the owner's verified `bob@whakauru.com` mailbox.
  `CONTACT_EMAIL` can override it with a plain mailbox address; an explicitly
  empty or invalid value hides both enquiry links. Accessibility enquiries use
  the same validated contact mailbox. Syntax validation does not
  establish service readiness, monitoring, or deliverability.
- No legal certification, fully automatic remediation, real-inference, sign
  interpretation, or data-residency claims are made on the new homepage.
- The initial service scope, attribution, terms, privacy notice, and contact
  process still need owner approval. Other legacy pages need a copy audit.
- Production API-key auth still needs end-to-end browser validation; public HTML
  does not mean protected upload APIs work without credentials.

Run `npm ci`, `npm test`, and `npm start` for the default mock-provider preview.
No OpenAI credentials are needed for the default preview. Test with non-sensitive
media only. Do not treat automated tests as a complete accessibility audit.

## Verification, September 18, 2026

- `npm test`: 107 tests passed, including new homepage, mailbox validation,
  public-route, and HTTP regression coverage. Integration tests require local
  socket access; the sandboxed run was interrupted and rerun with permission.
- Browser: 355px viewport with normal and larger text, no homepage horizontal
  overflow; 1280px desktop layout; theme toggle; navigation to `/media`; visible
  skip link on keyboard focus; no observed console errors.
- Not verified: real model accuracy, a representative media corpus, screen-reader
  user testing, production API-key browser flow, or the deployed environment.

## Combined design, September 19, 2026

The service-first implementation now combines the reference draft's warm paper,
green/clay palette and editorial hierarchy with the existing application's
self-hosted body fonts, tested theme tokens, semantic structure, and media routes.
Original architectural line art and a clearly labeled fictional finding explain
the practice without borrowed client logos, testimonials, or certification claims.

The reference draft's obligations calculator was not imported. Its replacement
is a local-only scoping guide: four starting points, native selection and button
controls, a polite live result, and a no-JavaScript contact fallback. It does not
determine legal applicability, deadlines, or compliance. No new dependencies,
external fonts, analytics, or third-party requests were added to the homepage.

- `npm test`: 113 passing tests, including new planner behavior, preference
  validation, fragment targets, and contrast checks for all editorial surfaces.
- Browser: 320, 390, 768, and 1280 CSS-pixel widths checked with maximum built-in
  text size; no horizontal or nested content overflow observed. Light/dark
  themes, guide choices, keyboard activation, visible skip-link focus, and focus
  transfer to main verified. Enlarged list-marker spacing corrected visually.
- Mock sample: `/media` to options to results completed locally. No embed was
  published. No console warnings or errors observed during these checks.
- No full assistive-technology audit, real-media accuracy testing, production
  auth validation, or deployment performed. Existing legacy media copy and the
  separate security/inference branches remain launch review items.
- Design checkpoint approved for a local commit on `codex/inclusy-service-launch`.
  No push or deployment is authorized by this checkpoint.

## Follow-up accessibility and launch pass

Design checkpoint committed as `774b1d2`. The subsequent local fixes and remaining
release gates are recorded in [LAUNCH-REVIEW.md](LAUNCH-REVIEW.md).
The expanded suite passes 128 tests and npm's production dependency audit reports
zero known vulnerabilities. Neither result clears the outstanding browser media
authentication, sensitive-data handling, or independent accessibility gates.

## Consulting-only candidate

The owner chose to separate the first consulting launch from media development.
Use `npm run start:service` for this candidate, NOT `npm start`. See
[SERVICE-ONLY.md](SERVICE-ONLY.md) for the route boundary, minimal container,
134-test result, and production cutover gates. The local preview on port 4317
now runs this service-only entry point. No production changes have been made.
