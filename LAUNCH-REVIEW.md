# Accessibility and launch review

September 19, 2026. Branch: `codex/inclusy-service-launch`.
Design checkpoint: `774b1d2`. Follow-up fixes described below are local changes
after that checkpoint. No push, merge, deployment, or production configuration
change was performed. This is a targeted engineering review, not certification.

## Corrected in this pass

- Player caption/description data could terminate an inline script. HTML-safe
  JSON serialization now prevents that parser escape while preserving the text.
  Job IDs embedded in options/results scripts use the same serializer.
- Clipboard rejection and missing clipboard APIs incorrectly reported success.
  Copy operations now announce success only after completion, or focus/select
  the correct source and announce manual-copy instructions. Snippet copying no
  longer selects the unrelated share URL on fallback.
- The sign-theme selector and empty-state text inherited inappropriate colors
  from the surrounding website. They now use the sign theme's tested colors;
  focus uses its accent and facial cues have a 14px minimum at normal text size.
- Language selection now has native required validation, not only an ARIA hint.
- Options, results, player, embed docs and iframe preview retain a visible
  unverified/mock-data warning. Theme descriptions no longer imply generated
  lifelike interpreters. Sign gloss is explicitly experimental.
- Removed unsupported permanent-storage, universally public playback, and
  never-serving-uploaded-media claims from the results/embed documentation.
- Fixed the embed guide's upload link to `/media#upload`. Scrollable code
  examples and its table have keyboard focus targets and accessible labels.

## Evidence

- `npm test`: 128 tests pass (113 at the design checkpoint). New coverage
  includes hostile inline data, clipboard success/rejection/unavailability for
  both copy targets, warnings, form semantics, and actual secured HTTP routes.
- `npm audit --omit=dev`: zero known dependency vulnerabilities reported at
  review time. This does not establish application security.
- `git diff --check`: clean.
- Chrome: empty language selection blocks processing and focuses the required
  control; selecting English completes the mock sample; Enter on Copy produces
  the success status; development warnings survive the options/results/player
  journey. Clipboard failure paths are unit-tested, not permission-toggled in
  the user's browser.
- Chrome: light sign theme is readable within the dark website; cue minimum
  renders at 14px. Player and embed guide have no page-wide overflow at 320 CSS
  pixels with maximum built-in text size. Code/table regions are focusable.
- The repaired upload link reaches `/media#upload`. No browser console warnings
  or errors observed during these checks. No browser embed was published.

## Release gates still open

1. **Media authorization (blocking):** with non-empty `API_KEYS`, public HTML
   loads but browser job creation, processing, progress, and download requests
   receive 401s. The new tests intentionally protect those endpoints; passing
   tests do not mean the browser authentication flow is fixed. Do not solve this
   by making write APIs public or embedding a shared API key in browser code.
2. **Media privacy (blocking for sensitive uploads):** raw job media is currently
   a public route for anyone with the job URL, including when API keys are set.
   There is no reviewed per-client authorization boundary. Keep all test media
   non-sensitive. The prior launch/security branches need review and deliberate
   reconciliation, not an unreviewed merge.
3. **Public-service launch boundary:** prefer a service-site-only release while
   media authorization is unfinished. This requires real route/service
   isolation, not merely hiding navigation links. No such deployment boundary
   was added or configured in the initial pass. A subsequent local consulting
   server and minimal image now provide this boundary; see SERVICE-ONLY.md.
   Production routing and deployment remain unverified and unchanged.
4. **Assistive technology:** conduct a full keyboard/zoom/reduced-motion pass and
   screen-reader and disabled-user testing across representative tasks. Browser
   DOM inspection and palette tests are not substitutes for these checks.
5. **Media quality and provenance:** per-output provider provenance, translated
   output accuracy, real recordings, and third-party embeds require further
   validation. The standalone script embed still needs its own accessibility
   and display review; the page-shell fixes are not a complete embed audit.
6. **Operations:** verify the actual deployed commit, auth settings, providers,
   storage, backups/restoration, deletion/retention, rate-limit trust boundary,
   and rollback process. Checked-in Fly settings name mock providers and the
   `iad` region but are not evidence of live settings or Canadian residency.
7. **Commercial readiness:** owner-approved scope, privacy/terms, enquiry
   monitoring, procurement evidence, and ministry/counsel clarification remain
   outside this engineering pass. Do not imply government approval.

Preview remains local at `http://localhost:4317` while its process runs. Launch
requires a separate decision and deployment authorization.
