# Service-first website draft

Branch: `codex/inclusy-service-launch`, based on redesign commit `019c7cf`.
Not deployed. Other Claude branches contain separate launch/security/inference
work and need reconciliation before production release.

- `/` describes a proposed accessibility examination and remediation service.
- `/media` keeps the upload tool, clearly marked experimental.
- `CONTACT_EMAIL` enables a contact link only when it is a plain mailbox address.
  Leave it unset until that mailbox is verified and monitored. Validation here
  checks syntax, not deliverability, licensing, or readiness to accept clients.
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
