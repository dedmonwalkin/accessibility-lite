# Service-first website draft

Branch: `codex/inclusy-service-launch`, based on redesign commit `019c7cf`.
Not deployed. Other Claude branches contain separate launch/security/inference
work and need reconciliation before production release.

- `/` describes a proposed accessibility examination and remediation service.
- `/media` keeps the upload tool, clearly marked experimental.
- General contact defaults to the owner's verified `bob@inclusy.org` mailbox.
  `CONTACT_EMAIL` can override it with a plain mailbox address; an explicitly
  empty or invalid value hides general enquiries. Accessibility enquiries use
  the verified `accessibility@inclusy.org` forwarder. Syntax validation does not
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
