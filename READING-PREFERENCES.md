# Reading preferences revision

October 1, 2026. Branch: `codex/reading-preferences-revision`, based on `248ac40`.
This revision is prepared for the service-only website release. The private
project home records the deployed commit, image and verification results.

The existing Working Access palette, wordmark, illustration and glass treatment
are retained. The service website has explicit text-size and theme radio groups,
visible preference summaries and a Reduce transparency checkbox. Positive device
preferences are listed only when they are exposed by the browser and applied by
the site. An explicit saved theme is identified as the visitor's choice. Device
restores automatic colour-scheme following without resetting other settings.
System contrast, transparency and forced-colour settings can require a solid
toolbar even after Reset preferences. The checkbox explains that state.

At 768px and below, Reading preferences opens the settings and Menu opens the
navigation. Both use normal disclosure buttons, not application menu semantics.
Navigation remains visible if JavaScript is unavailable. Keyboard focus is
preserved when resizing, closing disclosures and following menu links.

Read aloud uses the existing opt-in public sections and local English voices.
Playback starts only on request. Escape stops active reading even while focus
is elsewhere on the page. It leaves outside focus in place, closes listening
when used within the open controls, and then closes mobile preferences on a
subsequent Escape. Unavailable speech is explained and playback is disabled.

## Verification

- Full `npm test`: 165 tests passed. Server tests require local socket access.
- Final `node --test test/readingBar.test.js`: 15 tests passed.
- In-app browser: keyboard radio choices, reset, preference disclosure, menu
  destination focus, local playback state and Escape outside the toolbar.
- Expanded 320px layout with maximum built-in text size: no measured horizontal
  overflow. 375px collapsed phone layout and 1280px desktop layout reviewed.
- Browser warning/error log: no entries observed. Git whitespace check passes.

Full VoiceOver/NVDA testing, other browsers, real audio quality and composited
glass contrast remain to be checked. Palette tests cover token colour pairs,
not every composited background. No accessibility conformance claim is made.

## Release and preview

Deploy with `fly.service.toml` and `Dockerfile.service`, not the media application
configuration. This revision does not change DNS, email or the browser extension.

The current preview is served at http://127.0.0.1:4321/ using
`createServiceServer()` bound to `127.0.0.1`. It serves the service page and its
explicit font-asset allowlist. Application, extension and private planning
directories are not exposed as static files.
